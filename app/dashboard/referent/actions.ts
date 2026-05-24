"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { ReferralStatus, Role } from "@prisma/client";
import { z } from "zod";
import { notifyPhoneScreeningBooked, sendOrganizationInviteEmail } from "@/lib/email-notifications";
import { canReceiveDirectReferrals, canSubmitReferrals, getReferentTeamLimit, isWithinPlanLimit } from "@/lib/feature-gates";
import { generatePhoneScreeningSlots, phoneScreeningTimezone } from "@/lib/phone-screening";
import { prisma } from "@/lib/prisma";
import { getProtectedAppUser } from "@/lib/protected-routing";

const emailListSchema = z.array(z.string().email()).min(1);

const displayNameSchema = z.object({
  firstName: z.string().trim().max(80).optional(),
  lastName: z.string().trim().max(80).optional()
});

function teamHref(message?: string, invite = false) {
  const params = new URLSearchParams({ tab: "managers" });

  if (message) {
    params.set("teamMessage", message);
  }

  if (invite) {
    params.set("invite", "1");
  }

  return `/dashboard/referent${params.size ? `?${params.toString()}` : ""}`;
}

function referralsHref(message?: string) {
  const params = new URLSearchParams({ tab: "referrals" });

  if (message) {
    params.set("referralMessage", message);
  }

  return `/dashboard/referent?${params.toString()}`;
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

function inviteDeliveryMessage(count: number, results: Array<{ status: string }>, attachedCount = 0) {
  if (!count && !attachedCount) {
    return "No new manager invites were needed.";
  }

  const sentCount = results.filter((result) => result.status === "sent").length;
  const skippedCount = results.filter((result) => result.status === "skipped").length;
  const failedCount = results.filter((result) => result.status === "failed").length;
  const inviteLabel = count === 1 ? "manager invite" : "manager invites";
  const attachedMessage = attachedCount
    ? `${attachedCount} existing user${attachedCount === 1 ? "" : "s"} added. `
    : "";

  if (sentCount === count) {
    return `${attachedMessage}${count} ${inviteLabel} sent.`;
  }

  if (skippedCount === count) {
    return `${attachedMessage}${count} ${inviteLabel} saved, but email is not configured or could not be sent.`;
  }

  if (failedCount > 0 || skippedCount > 0) {
    return `${attachedMessage}${count} ${inviteLabel} saved. ${sentCount} email${sentCount === 1 ? "" : "s"} sent, ${failedCount + skippedCount} need${failedCount + skippedCount === 1 ? "s" : ""} a resend.`;
  }

  return `${attachedMessage}${count} ${inviteLabel} saved.`;
}

export async function inviteReferentManagers(formData: FormData) {
  const appUser = await getProtectedAppUser("/dashboard/referent");

  if (appUser.role !== Role.referent_admin || !appUser.orgId) {
    redirect(teamHref("Only referent admins can invite managers.", true));
  }

  const parsedEmails = emailListSchema.safeParse(emailsFromText(String(formData.get("emails") || "")));

  if (!parsedEmails.success) {
    redirect(teamHref("Enter at least one valid email address.", true));
  }

  const organization = await prisma.organization.findUnique({
    where: { id: appUser.orgId },
    select: {
      name: true,
      subscriptionPlan: true,
      users: {
        select: {
          id: true,
          email: true,
          isActive: true
        }
      },
      referentDetails: {
        select: {
          invitedTeamEmails: true
        }
      }
    }
  });

  if (!organization?.referentDetails) {
    redirect(teamHref("Referent organization setup is incomplete.", true));
  }

  const activeUsers = organization.users.filter((user) => user.isActive);
  const pendingEmails = organization.referentDetails.invitedTeamEmails.map((item) => item.toLowerCase());
  const teamLimit = getReferentTeamLimit(organization.subscriptionPlan);
  const existingOrgEmails = new Set(organization.users.map((user) => user.email.toLowerCase()));
  const pendingEmailSet = new Set(pendingEmails);
  const newEmails = parsedEmails.data.filter(
    (email) => !existingOrgEmails.has(email) && !pendingEmailSet.has(email)
  );
  const alreadyActiveEmails = parsedEmails.data.filter((email) => existingOrgEmails.has(email));
  const alreadyPendingEmails = parsedEmails.data.filter((email) => pendingEmailSet.has(email));

  if (!newEmails.length) {
    const details = [
      alreadyActiveEmails.length ? `${alreadyActiveEmails.length} already on account` : "",
      alreadyPendingEmails.length ? `${alreadyPendingEmails.length} already pending` : ""
    ].filter(Boolean).join(", ");
    redirect(teamHref(details || "Those emails are already active or pending.", true));
  }

  if (!isWithinPlanLimit(teamLimit, activeUsers.length + pendingEmails.length, newEmails.length)) {
    redirect(teamHref(`Your current plan allows ${teamLimit} team members.`, true));
  }

  const existingUsers = await prisma.user.findMany({
    where: { email: { in: newEmails } },
    select: { id: true, email: true, orgId: true }
  });

  const externalUser = existingUsers.find((user) => user.orgId && user.orgId !== appUser.orgId);

  if (externalUser) {
    redirect(teamHref(`${externalUser.email} already belongs to another organization.`, true));
  }

  const attachableUsers = existingUsers.filter((user) => !user.orgId);
  const attachedEmails = new Set(attachableUsers.map((user) => user.email.toLowerCase()));
  const inviteEmails = newEmails.filter((email) => !attachedEmails.has(email));

  if (attachableUsers.length) {
    await prisma.user.updateMany({
      where: { id: { in: attachableUsers.map((user) => user.id) } },
      data: {
        orgId: appUser.orgId,
        role: Role.referent_manager,
        isActive: true
      }
    });
  }

  if (inviteEmails.length) {
    await prisma.referentOrganization.update({
      where: { orgId: appUser.orgId },
      data: {
        invitedTeamEmails: [...pendingEmails, ...inviteEmails]
      }
    });
  }

  const inviterName = [appUser.firstName, appUser.lastName].filter(Boolean).join(" ") || appUser.email;
  const emailResults = await Promise.all(newEmails.map((email) => sendOrganizationInviteEmail({
    email,
    organizationName: organization.name,
    role: Role.referent_manager,
    invitedByName: inviterName
  })));

  revalidatePath("/dashboard/referent");
  redirect(teamHref(inviteDeliveryMessage(newEmails.length, emailResults, attachableUsers.length), emailResults.some((result) => result.status !== "sent")));
}

export async function removePendingReferentInvite(formData: FormData) {
  const appUser = await getProtectedAppUser("/dashboard/referent");

  if (appUser.role !== Role.referent_admin || !appUser.orgId) {
    redirect(teamHref("Only referent admins can manage team members."));
  }

  const email = String(formData.get("email") || "").trim().toLowerCase();

  if (!email) {
    redirect(teamHref());
  }

  const referentDetails = await prisma.referentOrganization.findUnique({
    where: { orgId: appUser.orgId },
    select: { invitedTeamEmails: true }
  });

  if (!referentDetails) {
    redirect(teamHref("Referent organization setup is incomplete."));
  }

  await prisma.referentOrganization.update({
    where: { orgId: appUser.orgId },
    data: {
      invitedTeamEmails: referentDetails.invitedTeamEmails.filter(
        (pendingEmail) => pendingEmail.toLowerCase() !== email
      )
    }
  });

  revalidatePath("/dashboard/referent");
  redirect(teamHref("Pending invite removed."));
}

export async function removeReferentManager(formData: FormData) {
  const appUser = await getProtectedAppUser("/dashboard/referent");

  if (appUser.role !== Role.referent_admin || !appUser.orgId) {
    redirect(teamHref("Only referent admins can remove managers."));
  }

  const managerId = String(formData.get("managerId") || "");

  if (!managerId) {
    redirect(teamHref("Manager not found."));
  }

  if (managerId === appUser.id) {
    redirect(teamHref("You cannot remove your own account."));
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
    redirect(teamHref("Manager not found."));
  }

  if (manager.role !== Role.referent_manager) {
    redirect(teamHref("Only manager accounts can be removed from this screen."));
  }

  await prisma.user.update({
    where: { id: manager.id },
    data: {
      orgId: null,
      isActive: false
    }
  });

  revalidatePath("/dashboard/referent");
  const managerName = [manager.firstName, manager.lastName].filter(Boolean).join(" ") || manager.email;
  redirect(teamHref(`${managerName} was removed from this account.`));
}

export async function bookPhoneScreeningSlot(formData: FormData) {
  const appUser = await getProtectedAppUser("/dashboard/referent");

  if (!appUser.orgId || !canSubmitReferrals(appUser.organization)) {
    redirect(referralsHref("Your plan does not allow referral scheduling."));
  }

  const referralId = String(formData.get("referralId") || "");
  const slotValue = String(formData.get("slot") || "");
  const requestedStart = new Date(slotValue);

  if (!referralId || Number.isNaN(requestedStart.getTime())) {
    redirect(referralsHref("Choose a valid phone screening slot."));
  }

  const referral = await prisma.referral.findFirst({
    where: {
      id: referralId,
      referentOrgId: appUser.orgId
    },
    include: {
      aftercareProfile: {
        select: {
          id: true,
          orgId: true,
          ownershipStatus: true,
          verificationTier: true,
          phoneScreeningWindows: {
            where: { isActive: true },
            orderBy: [{ dayOfWeek: "asc" }, { startMinute: "asc" }]
          },
          phoneScreeningAppointments: {
            where: {
              status: "scheduled",
              startsAt: { gte: new Date() }
            },
            select: {
              startsAt: true,
              endsAt: true,
              status: true
            }
          },
          organization: {
            select: {
              type: true,
              subscriptionPlan: true,
              subscriptionStatus: true
            }
          }
        }
      },
      phoneScreeningAppointments: {
        where: { status: "scheduled" },
        select: { id: true },
        take: 1
      }
    }
  });

  if (!referral) {
    redirect(referralsHref("Referral not found."));
  }

  if (referral.status !== ReferralStatus.accepted) {
    redirect(referralsHref("Phone screening can be booked after the provider accepts the referral."));
  }

  if (referral.phoneScreeningAppointments.length) {
    redirect(referralsHref("This referral already has a scheduled phone screening."));
  }

  if (!canReceiveDirectReferrals(referral.aftercareProfile.organization, referral.aftercareProfile)) {
    redirect(referralsHref("This provider plan does not allow phone screening scheduling."));
  }

  const availableSlots = generatePhoneScreeningSlots({
    windows: referral.aftercareProfile.phoneScreeningWindows,
    appointments: referral.aftercareProfile.phoneScreeningAppointments,
    maxSlots: null
  });
  const selectedSlot = availableSlots.find((slot) => slot.startsAt.toISOString() === requestedStart.toISOString());

  if (!selectedSlot) {
    redirect(referralsHref("That phone screening slot is no longer available."));
  }

  const appointment = await prisma.phoneScreeningAppointment.create({
    data: {
      referralId: referral.id,
      aftercareProfileId: referral.aftercareProfile.id,
      aftercareOrgId: referral.aftercareProfile.orgId,
      bookedByUserId: appUser.id,
      startsAt: selectedSlot.startsAt,
      endsAt: selectedSlot.endsAt,
      timezone: phoneScreeningTimezone
    }
  });

  await notifyPhoneScreeningBooked(appointment.id);

  revalidatePath("/dashboard/referent");
  revalidatePath("/dashboard/aftercare");
  redirect(referralsHref("Phone screening booked."));
}

export async function updateReferentDisplayName(formData: FormData) {
  const appUser = await getProtectedAppUser("/dashboard/referent?tab=account");
  const parsed = displayNameSchema.safeParse({
    firstName: formData.get("firstName"),
    lastName: formData.get("lastName")
  });

  if (!parsed.success) {
    redirect("/dashboard/referent?tab=account&edit=displayName");
  }

  await prisma.user.update({
    where: { id: appUser.id },
    data: {
      firstName: parsed.data.firstName || null,
      lastName: parsed.data.lastName || null
    }
  });

  revalidatePath("/dashboard/referent");
  redirect("/dashboard/referent?tab=account");
}
