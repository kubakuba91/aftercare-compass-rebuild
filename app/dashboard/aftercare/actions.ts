"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { AftercareManagerScope, ProfileStatus, ProfileType, ReferralStatus, Role } from "@prisma/client";
import { z } from "zod";
import { aftercareProfileIdWhereForUser, aftercareProfileWhereForUser } from "@/lib/aftercare-access";
import { availabilityReplyExample } from "@/lib/availability-sms";
import { notifyReferralStatusChanged, sendOrganizationInviteEmail } from "@/lib/email-notifications";
import {
  canReceiveDirectReferrals,
  canUsePlacementTracking,
  canUseLiveAvailability,
  getAftercareManagerLimit,
  isWithinPlanLimit
} from "@/lib/feature-gates";
import { numberFromForm } from "@/lib/form-utils";
import { phoneScreeningTimezone } from "@/lib/phone-screening";
import { canTransitionReferral, referralStatuses } from "@/lib/product-rules";
import { prisma } from "@/lib/prisma";
import { getAftercareDashboardUser } from "@/lib/protected-routing";
import { sendSms } from "@/lib/sms";

function minuteFromTime(value: FormDataEntryValue | null) {
  const text = String(value || "");
  const match = text.match(/^(\d{2}):(\d{2})$/);

  if (!match) {
    return null;
  }

  const hours = Number(match[1]);
  const minutes = Number(match[2]);

  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
    return null;
  }

  return hours * 60 + minutes;
}

function overviewHref(profileId: string, error?: string) {
  const params = new URLSearchParams({
    tab: "overview",
    profileId
  });

  if (error) {
    params.set("availabilityError", error);
  }

  return `/dashboard/aftercare?${params.toString()}`;
}

function screeningHref(profileId: string, message?: string) {
  const params = new URLSearchParams({
    tab: "overview",
    profileId
  });

  if (message) {
    params.set("screeningMessage", message);
  }

  return `/dashboard/aftercare?${params.toString()}`;
}

function homesHref(message?: string) {
  const params = new URLSearchParams({ tab: "homes" });

  if (message) {
    params.set("homesMessage", message);
  }

  return `/dashboard/aftercare?${params.toString()}`;
}

function managersHref(message?: string, invite = false) {
  const params = new URLSearchParams({ tab: "managers" });

  if (message) {
    params.set("managerMessage", message);
  }

  if (invite) {
    params.set("invite", "1");
  }

  return `/dashboard/aftercare?${params.toString()}`;
}

function inviteDeliveryMessage(count: number, results: Array<{ status: string }>) {
  if (!count) {
    return "No new manager invites were needed.";
  }

  const sentCount = results.filter((result) => result.status === "sent").length;
  const skippedCount = results.filter((result) => result.status === "skipped").length;
  const failedCount = results.filter((result) => result.status === "failed").length;

  if (sentCount === count) {
    return `${count} manager invite${count === 1 ? "" : "s"} sent.`;
  }

  if (skippedCount === count) {
    return `${count} manager invite${count === 1 ? "" : "s"} saved, but email is not configured or could not be sent.`;
  }

  if (failedCount > 0 || skippedCount > 0) {
    return `${count} manager invite${count === 1 ? "" : "s"} saved. ${sentCount} email${sentCount === 1 ? "" : "s"} sent, ${failedCount + skippedCount} need${failedCount + skippedCount === 1 ? "s" : ""} a resend.`;
  }

  return `${count} manager invite${count === 1 ? "" : "s"} saved.`;
}

function smsHref(profileId: string, message: string) {
  const params = new URLSearchParams({
    tab: "overview",
    profileId,
    availabilityError: message
  });

  return `/dashboard/aftercare?${params.toString()}`;
}

function emailsFromText(value: string) {
  return Array.from(
    new Set(
      value
        .split(/[\s,;]+/)
        .map((email) => email.trim().toLowerCase())
        .filter(Boolean)
    )
  );
}

const emailListSchema = z.array(z.string().email()).min(1);

function managerScopeFromForm(formData: FormData) {
  const rawScope = String(formData.get("managerScope") || "");
  const scope = rawScope === AftercareManagerScope.assigned_profiles
    ? AftercareManagerScope.assigned_profiles
    : AftercareManagerScope.all_profiles;
  const profileIds = Array.from(
    new Set(formData.getAll("profileIds").map((value) => String(value)).filter(Boolean))
  );

  return {
    scope,
    profileIds: scope === AftercareManagerScope.assigned_profiles ? profileIds : []
  };
}

async function validManagerAssignmentProfileIds(orgId: string, profileIds: string[]) {
  if (!profileIds.length) {
    return [];
  }

  const profiles = await prisma.aftercareProfile.findMany({
    where: {
      id: { in: profileIds },
      orgId
    },
    select: { id: true }
  });

  return profiles.map((profile) => profile.id);
}

function smsToken() {
  return `AC-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
}

export async function updateAftercareProfileStatusFromDashboard(formData: FormData) {
  const appUser = await getAftercareDashboardUser(homesHref());
  const profileId = String(formData.get("profileId") || "");
  const nextStatus = String(formData.get("status") || "");

  if (nextStatus !== ProfileStatus.unpublished && nextStatus !== ProfileStatus.draft) {
    redirect(homesHref("That profile status is not available from the dashboard."));
  }

  const profile = await prisma.aftercareProfile.findFirst({
    where: aftercareProfileIdWhereForUser(appUser, profileId),
    select: {
      id: true,
      slug: true,
      programName: true
    }
  });

  if (!profile) {
    redirect(homesHref("Profile not found."));
  }

  const status = nextStatus === ProfileStatus.unpublished ? ProfileStatus.unpublished : ProfileStatus.draft;

  await prisma.aftercareProfile.update({
    where: { id: profile.id },
    data: {
      status,
      publishedAt: null,
      unpublishedAt: status === ProfileStatus.unpublished ? new Date() : null,
      unpublishedByUserId: status === ProfileStatus.unpublished ? appUser.id : null
    }
  });

  revalidatePath("/dashboard/aftercare");
  revalidatePath("/search");
  revalidatePath(`/profiles/${profile.slug}`);

  redirect(
    homesHref(
      status === ProfileStatus.unpublished
        ? `${profile.programName} was unpublished and no longer counts toward your plan limit.`
        : `${profile.programName} was restored as a draft.`
    )
  );
}

export async function updateAftercareAvailability(formData: FormData) {
  const appUser = await getAftercareDashboardUser("/dashboard/aftercare");
  const profileId = String(formData.get("profileId") || "");

  const profile = await prisma.aftercareProfile.findFirst({
    where: aftercareProfileIdWhereForUser(appUser, profileId),
    select: {
      id: true,
      type: true,
      ownershipStatus: true,
      totalBeds: true,
      bedsMen: true,
      bedsWomen: true,
      bedsLgbtq: true
    }
  });

  if (!profile) {
    redirect("/dashboard/aftercare");
  }

  if (!canUseLiveAvailability(appUser.organization, profile)) {
    redirect(overviewHref(profile.id, "Live availability updates are available on Professional, Verified, and Network plans."));
  }

  if (profile.type === ProfileType.sober_living) {
    const bedsMenAvailable = numberFromForm(formData.get("bedsMenAvailable")) ?? 0;
    const bedsWomenAvailable = numberFromForm(formData.get("bedsWomenAvailable")) ?? 0;
    const bedsLgbtqAvailable = numberFromForm(formData.get("bedsLgbtqAvailable")) ?? 0;

    if (
      bedsMenAvailable > (profile.bedsMen ?? 0) ||
      bedsWomenAvailable > (profile.bedsWomen ?? 0) ||
      bedsLgbtqAvailable > (profile.bedsLgbtq ?? 0)
    ) {
      redirect(
        overviewHref(profile.id, "Available beds cannot exceed the total beds for that population.")
      );
    }

    const bedsAvailable = bedsMenAvailable + bedsWomenAvailable + bedsLgbtqAvailable;

    await prisma.aftercareProfile.update({
      where: { id: profile.id },
      data: {
        bedsMenAvailable,
        bedsWomenAvailable,
        bedsLgbtqAvailable,
        bedsAvailable,
        bedsAvailableUpdatedAt: new Date(),
        availabilityNotes: String(formData.get("availabilityNotes") || "").trim() || null
      }
    });
  } else {
    await prisma.aftercareProfile.update({
      where: { id: profile.id },
      data: {
        acceptingNewPatients: formData.get("acceptingNewPatients") === "yes",
        acceptingNewPatientsUpdatedAt: new Date(),
        availabilityNotes: String(formData.get("availabilityNotes") || "").trim() || null
      }
    });
  }

  revalidatePath("/dashboard/aftercare");
  redirect(overviewHref(profile.id));
}

export async function updateUserDisplayName(formData: FormData) {
  const appUser = await getAftercareDashboardUser("/dashboard/aftercare?tab=account");
  const firstName = String(formData.get("firstName") || "").trim();
  const lastName = String(formData.get("lastName") || "").trim();

  await prisma.user.update({
    where: { id: appUser.id },
    data: {
      firstName: firstName || null,
      lastName: lastName || null
    }
  });

  revalidatePath("/dashboard/aftercare");
  redirect("/dashboard/aftercare?tab=account");
}

export async function updateAccountSmsConsent(formData: FormData) {
  const appUser = await getAftercareDashboardUser("/dashboard/aftercare?tab=account");
  const intent = String(formData.get("intent") || "");

  if (intent !== "optOut") {
    redirect("/dashboard/aftercare?tab=account");
  }

  await prisma.user.update({
    where: { id: appUser.id },
    data: {
      smsOptIn: false
    }
  });

  revalidatePath("/dashboard/aftercare");
  redirect("/dashboard/aftercare?tab=account&accountMessage=Text notifications disabled.");
}

export async function inviteAftercareManagers(formData: FormData) {
  const appUser = await getAftercareDashboardUser("/dashboard/aftercare?tab=managers");

  if (appUser.role !== Role.aftercare_admin) {
    redirect(managersHref("Only aftercare admins can invite managers.", true));
  }

  const emails = emailsFromText(String(formData.get("emails") || ""));
  const parsedEmails = emailListSchema.safeParse(emails);
  const managerAssignment = managerScopeFromForm(formData);

  if (!parsedEmails.success) {
    redirect(managersHref("Enter at least one valid email address.", true));
  }

  const organization = await prisma.organization.findUnique({
    where: { id: appUser.orgId },
    select: {
      name: true,
      subscriptionPlan: true,
      subscriptionStatus: true,
      users: {
        select: {
          id: true,
          email: true,
          orgId: true,
          isActive: true
        }
      },
      invites: {
        where: { status: "pending" },
        select: {
          email: true
        }
      },
      profiles: {
        select: { id: true }
      }
    }
  });

  if (!organization) {
    redirect(managersHref("Aftercare organization not found.", true));
  }

  const managerLimit = getAftercareManagerLimit(organization.subscriptionPlan);
  const organizationProfileIds = new Set(organization.profiles.map((profile) => profile.id));

  if (
    managerAssignment.scope === AftercareManagerScope.assigned_profiles &&
    !managerAssignment.profileIds.length
  ) {
    redirect(managersHref("Choose at least one home or use All homes.", true));
  }

  if (
    managerAssignment.scope === AftercareManagerScope.assigned_profiles &&
    managerAssignment.profileIds.some((profileId) => !organizationProfileIds.has(profileId))
  ) {
    redirect(managersHref("Choose homes from this organization only.", true));
  }

  const activeUserCount = organization.users.filter((user) => user.isActive).length;
  const pendingInviteEmails = new Set(organization.invites.map((invite) => invite.email.toLowerCase()));
  const existingOrgEmails = new Set(organization.users.map((user) => user.email.toLowerCase()));
  const alreadyActiveEmails = parsedEmails.data.filter((email) => existingOrgEmails.has(email));
  const alreadyPendingEmails = parsedEmails.data.filter((email) => pendingInviteEmails.has(email));
  const newEmails = parsedEmails.data.filter(
    (email) => !existingOrgEmails.has(email) && !pendingInviteEmails.has(email)
  );

  if (!newEmails.length) {
    const details = [
      alreadyActiveEmails.length ? `Already on this account: ${alreadyActiveEmails.join(", ")}` : "",
      alreadyPendingEmails.length ? `Already pending: ${alreadyPendingEmails.join(", ")}` : ""
    ].filter(Boolean).join(". ");

    redirect(managersHref(details || "Those emails are already active or pending.", true));
  }

  if (!isWithinPlanLimit(managerLimit, activeUserCount + pendingInviteEmails.size, newEmails.length)) {
    redirect(managersHref(`Your current plan allows ${managerLimit} managers.`, true));
  }

  const existingUsers = await prisma.user.findMany({
    where: { email: { in: newEmails } },
    select: {
      id: true,
      email: true,
      orgId: true
    }
  });
  const externalUser = existingUsers.find((user) => user.orgId && user.orgId !== appUser.orgId);

  if (externalUser) {
    redirect(managersHref(`${externalUser.email} already belongs to another organization.`, true));
  }

  const unattachedUsers = existingUsers.filter((user) => !user.orgId);
  await Promise.all(
    unattachedUsers.map((user) =>
      prisma.user.update({
        where: { id: user.id },
        data: {
          orgId: appUser.orgId,
          role: Role.aftercare_manager,
          aftercareManagerScope: managerAssignment.scope,
          isActive: true
        }
      })
    )
  );

  if (unattachedUsers.length && managerAssignment.profileIds.length) {
    await prisma.aftercareProfileManagerAssignment.createMany({
      data: unattachedUsers.flatMap((user) =>
        managerAssignment.profileIds.map((profileId) => ({
          userId: user.id,
          profileId
        }))
      ),
      skipDuplicates: true
    });
  }

  const attachedEmails = new Set(unattachedUsers.map((user) => user.email.toLowerCase()));
  const inviteEmails = newEmails.filter((email) => !attachedEmails.has(email));

  if (inviteEmails.length) {
    await Promise.all(
      inviteEmails.map((email) =>
        prisma.organizationInvite.create({
          data: {
            orgId: appUser.orgId,
            email,
            role: Role.aftercare_manager,
            invitedByUserId: appUser.id,
            aftercareManagerScope: managerAssignment.scope,
            aftercareProfileAssignments: {
              create: managerAssignment.profileIds.map((profileId) => ({ profileId }))
            }
          }
        })
      )
    );
  }

  const inviterName = [appUser.firstName, appUser.lastName].filter(Boolean).join(" ") || appUser.email;
  const emailResults = await Promise.all(
    [...newEmails].map((email) =>
      sendOrganizationInviteEmail({
        email,
        organizationName: organization.name,
        role: Role.aftercare_manager,
        invitedByName: inviterName
      })
    )
  );

  revalidatePath("/dashboard/aftercare");
  redirect(managersHref(inviteDeliveryMessage(newEmails.length, emailResults), emailResults.some((result) => result.status !== "sent")));
}

export async function updateAftercareManagerAssignments(formData: FormData) {
  const appUser = await getAftercareDashboardUser("/dashboard/aftercare?tab=managers");

  if (appUser.role !== Role.aftercare_admin) {
    redirect(managersHref("Only aftercare admins can edit manager assignments."));
  }

  const managerId = String(formData.get("managerId") || "");
  const managerAssignment = managerScopeFromForm(formData);

  if (!managerId) {
    redirect(managersHref("Manager not found."));
  }

  if (
    managerAssignment.scope === AftercareManagerScope.assigned_profiles &&
    !managerAssignment.profileIds.length
  ) {
    redirect(managersHref("Choose at least one home or use All homes."));
  }

  const [manager, validProfileIds] = await Promise.all([
    prisma.user.findFirst({
      where: {
        id: managerId,
        orgId: appUser.orgId,
        role: Role.aftercare_manager
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true
      }
    }),
    validManagerAssignmentProfileIds(appUser.orgId, managerAssignment.profileIds)
  ]);

  if (!manager) {
    redirect(managersHref("Manager not found."));
  }

  if (
    managerAssignment.scope === AftercareManagerScope.assigned_profiles &&
    validProfileIds.length !== managerAssignment.profileIds.length
  ) {
    redirect(managersHref("Choose homes from this organization only."));
  }

  await prisma.$transaction(async (tx) => {
    await tx.user.update({
      where: { id: manager.id },
      data: { aftercareManagerScope: managerAssignment.scope }
    });

    await tx.aftercareProfileManagerAssignment.deleteMany({
      where: { userId: manager.id }
    });

    if (managerAssignment.scope === AftercareManagerScope.assigned_profiles) {
      await tx.aftercareProfileManagerAssignment.createMany({
        data: validProfileIds.map((profileId) => ({
          userId: manager.id,
          profileId
        })),
        skipDuplicates: true
      });
    }
  });

  const managerName = [manager.firstName, manager.lastName].filter(Boolean).join(" ") || manager.email;

  revalidatePath("/dashboard/aftercare");
  redirect(managersHref(`${managerName} assignments updated.`));
}

export async function removeAftercareManagerInvite(formData: FormData) {
  const appUser = await getAftercareDashboardUser("/dashboard/aftercare?tab=managers");

  if (appUser.role !== Role.aftercare_admin) {
    redirect(managersHref("Only aftercare admins can manage invites."));
  }

  const inviteId = String(formData.get("inviteId") || "");

  if (inviteId) {
    await prisma.organizationInvite.deleteMany({
      where: {
        id: inviteId,
        orgId: appUser.orgId,
        status: "pending"
      }
    });
  }

  revalidatePath("/dashboard/aftercare");
  redirect(managersHref("Pending invite removed."));
}

export async function removeAftercareManager(formData: FormData) {
  const appUser = await getAftercareDashboardUser("/dashboard/aftercare?tab=managers");

  if (appUser.role !== Role.aftercare_admin) {
    redirect(managersHref("Only aftercare admins can remove managers."));
  }

  const managerId = String(formData.get("managerId") || "");

  if (!managerId) {
    redirect(managersHref("Manager not found."));
  }

  if (managerId === appUser.id) {
    redirect(managersHref("You cannot remove your own account."));
  }

  const manager = await prisma.user.findFirst({
    where: {
      id: managerId,
      orgId: appUser.orgId
    },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      role: true
    }
  });

  if (!manager) {
    redirect(managersHref("Manager not found."));
  }

  if (manager.role !== Role.aftercare_manager) {
    redirect(managersHref("Only manager accounts can be removed from this screen."));
  }

  await prisma.user.update({
    where: { id: manager.id },
    data: {
      orgId: null,
      isActive: false,
      phone: null,
      smsOptIn: false
    }
  });

  await prisma.aftercareProfileManagerAssignment.deleteMany({
    where: { userId: manager.id }
  });

  const managerName = [manager.firstName, manager.lastName].filter(Boolean).join(" ") || manager.email;

  revalidatePath("/dashboard/aftercare");
  redirect(managersHref(`${managerName} was removed from this account.`));
}

export async function sendBedAvailabilityTextCheck(formData: FormData) {
  const appUser = await getAftercareDashboardUser("/dashboard/aftercare");
  const profileId = String(formData.get("profileId") || "");
  const managerId = String(formData.get("managerId") || "");

  const [profile, manager] = await Promise.all([
    prisma.aftercareProfile.findFirst({
      where: {
        ...aftercareProfileIdWhereForUser(appUser, profileId),
        type: ProfileType.sober_living
      },
      select: {
        id: true,
        orgId: true,
        programName: true,
        bedsMen: true,
        bedsWomen: true,
        bedsLgbtq: true,
        bedsMenAvailable: true,
        bedsWomenAvailable: true,
        bedsLgbtqAvailable: true
      }
    }),
    prisma.user.findFirst({
      where: {
        id: managerId,
        orgId: appUser.orgId,
        isActive: true,
        smsOptIn: true,
        phone: { not: null },
        OR: [
          { role: Role.aftercare_admin },
          {
            role: Role.aftercare_manager,
            aftercareManagerScope: AftercareManagerScope.all_profiles
          },
          {
            role: Role.aftercare_manager,
            aftercareProfileAssignments: {
              some: { profileId }
            }
          }
        ]
      },
      select: {
        id: true,
        phone: true
      }
    })
  ]);

  if (!profile) {
    redirect("/dashboard/aftercare?tab=overview");
  }

  if (!manager?.phone) {
    redirect(smsHref(profile.id, "Choose a manager with SMS enabled first."));
  }

  const token = smsToken();
  const body =
    `Aftercare Compass bed check for ${profile.programName}. ` +
    `Current: MEN ${profile.bedsMenAvailable ?? 0}/${profile.bedsMen ?? 0}, ` +
    `WOMEN ${profile.bedsWomenAvailable ?? 0}/${profile.bedsWomen ?? 0}, ` +
    `LGBTQ ${profile.bedsLgbtqAvailable ?? 0}/${profile.bedsLgbtq ?? 0}. ` +
    `Reply: ${token} MEN # WOMEN # LGBTQ #. Or NO CHANGE.`;

  const check = await prisma.availabilitySmsCheck.create({
    data: {
      token,
      orgId: appUser.orgId,
      profileId: profile.id,
      userId: manager.id,
      phone: manager.phone,
      outboundBody: body
    }
  });

  try {
    await sendSms({ to: manager.phone, body });
    await prisma.availabilitySmsCheck.update({
      where: { id: check.id },
      data: {
        status: "sent",
        sentAt: new Date()
      }
    });
  } catch (error) {
    await prisma.availabilitySmsCheck.update({
      where: { id: check.id },
      data: {
        status: "failed",
        errorMessage: error instanceof Error ? error.message : "SMS send failed"
      }
    });

    redirect(
      smsHref(
        profile.id,
        `SMS could not be sent. Check Twilio env vars. ${availabilityReplyExample()}`
      )
    );
  }

  revalidatePath("/dashboard/aftercare");
  redirect(smsHref(profile.id, "Bed check text sent."));
}

export async function addPhoneScreeningWindow(formData: FormData) {
  const appUser = await getAftercareDashboardUser("/dashboard/aftercare");
  const profileId = String(formData.get("profileId") || "");
  const dayOfWeek = numberFromForm(formData.get("dayOfWeek"));
  const startMinute = minuteFromTime(formData.get("startTime"));
  const endMinute = minuteFromTime(formData.get("endTime"));

  const profile = await prisma.aftercareProfile.findFirst({
    where: aftercareProfileIdWhereForUser(appUser, profileId),
    select: {
      id: true,
      organization: {
        select: {
          type: true,
          subscriptionPlan: true,
          subscriptionStatus: true
        }
      },
      ownershipStatus: true,
      verificationTier: true
    }
  });

  if (!profile) {
    redirect("/dashboard/aftercare?availabilityError=Profile not found");
  }

  if (!canReceiveDirectReferrals(profile.organization, profile)) {
    redirect(screeningHref(profile.id, "Phone screening windows are available on paid plans with direct referral intake."));
  }

  if (
    dayOfWeek === null ||
    dayOfWeek < 0 ||
    dayOfWeek > 6 ||
    startMinute === null ||
    endMinute === null ||
    endMinute <= startMinute ||
    endMinute - startMinute < 30
  ) {
    redirect(screeningHref(profile.id, "Choose a valid weekday and at least a 30-minute window."));
  }

  await prisma.phoneScreeningWindow.create({
    data: {
      profileId: profile.id,
      dayOfWeek,
      startMinute,
      endMinute,
      slotMinutes: 30,
      timezone: phoneScreeningTimezone
    }
  });

  revalidatePath("/dashboard/aftercare");
  revalidatePath("/dashboard/referent");
  redirect(screeningHref(profile.id, "Phone screening window added."));
}

export async function deletePhoneScreeningWindow(formData: FormData) {
  const appUser = await getAftercareDashboardUser("/dashboard/aftercare");
  const windowId = String(formData.get("windowId") || "");

  const window = await prisma.phoneScreeningWindow.findFirst({
    where: {
      id: windowId,
      profile: aftercareProfileWhereForUser(appUser)
    },
    select: {
      id: true,
      profileId: true
    }
  });

  if (!window) {
    redirect("/dashboard/aftercare?availabilityError=Screening window not found");
  }

  await prisma.phoneScreeningWindow.delete({
    where: { id: window.id }
  });

  revalidatePath("/dashboard/aftercare");
  revalidatePath("/dashboard/referent");
  redirect(screeningHref(window.profileId, "Phone screening window removed."));
}

export async function updateReferralStatus(formData: FormData) {
  const appUser = await getAftercareDashboardUser("/dashboard/aftercare");
  const referralId = String(formData.get("referralId") || "");
  const nextStatus = String(formData.get("status") || "") as ReferralStatus;

  if (!referralStatuses.includes(nextStatus)) {
    redirect("/dashboard/aftercare?referralError=Invalid referral status");
  }

  const referral = await prisma.referral.findFirst({
    where: {
      id: referralId,
      aftercareOrgId: appUser.orgId,
      aftercareProfile: aftercareProfileWhereForUser(appUser)
    },
    select: {
      id: true,
      status: true
    }
  });

  if (!referral) {
    redirect("/dashboard/aftercare?referralError=Referral not found");
  }

  if (!canTransitionReferral(referral.status, nextStatus)) {
    redirect("/dashboard/aftercare?referralError=That status change is not available");
  }

  if (nextStatus === ReferralStatus.placed && !canUsePlacementTracking(appUser.organization)) {
    redirect("/dashboard/aftercare?referralError=Placement tracking is available on Verified and Network plans.");
  }

  await prisma.referral.update({
    where: { id: referral.id },
    data: {
      status: nextStatus,
      statusUpdatedAt: new Date()
    }
  });

  await notifyReferralStatusChanged(referral.id);

  revalidatePath("/dashboard/aftercare");
  revalidatePath("/dashboard/referent");
  redirect("/dashboard/aftercare");
}
