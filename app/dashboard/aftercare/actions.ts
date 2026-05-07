"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { ProfileType, ReferralStatus, Role } from "@prisma/client";
import { z } from "zod";
import { aftercarePlans } from "@/lib/plans";
import { canTransitionReferral, referralStatuses } from "@/lib/product-rules";
import { prisma } from "@/lib/prisma";
import { getAftercareDashboardUser } from "@/lib/protected-routing";

function numberFromForm(value: FormDataEntryValue | null) {
  if (value === null || value === "") {
    return null;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.max(0, Math.trunc(parsed)) : null;
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

function aftercareManagerLimit(planKey: string | null | undefined) {
  const plan = planKey && planKey in aftercarePlans
    ? aftercarePlans[planKey as keyof typeof aftercarePlans]
    : aftercarePlans.basic;

  return plan.managers;
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

export async function updateAftercareAvailability(formData: FormData) {
  const appUser = await getAftercareDashboardUser("/dashboard/aftercare");
  const profileId = String(formData.get("profileId") || "");

  const profile = await prisma.aftercareProfile.findFirst({
    where: {
      id: profileId,
      orgId: appUser.orgId
    },
    select: {
      id: true,
      type: true,
      totalBeds: true,
      bedsMen: true,
      bedsWomen: true,
      bedsLgbtq: true
    }
  });

  if (!profile) {
    redirect("/dashboard/aftercare");
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

export async function inviteAftercareManagers(formData: FormData) {
  const appUser = await getAftercareDashboardUser("/dashboard/aftercare?tab=managers");

  if (appUser.role !== Role.aftercare_admin) {
    redirect(managersHref("Only aftercare admins can invite managers."));
  }

  const emails = emailsFromText(String(formData.get("emails") || ""));
  const parsedEmails = emailListSchema.safeParse(emails);

  if (!parsedEmails.success) {
    redirect(managersHref("Enter at least one valid email address.", true));
  }

  const organization = await prisma.organization.findUnique({
    where: { id: appUser.orgId },
    select: {
      subscriptionPlan: true,
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
      }
    }
  });

  if (!organization) {
    redirect(managersHref("Aftercare organization not found."));
  }

  const managerLimit = aftercareManagerLimit(organization.subscriptionPlan);
  const activeUserCount = organization.users.filter((user) => user.isActive).length;
  const pendingInviteEmails = new Set(organization.invites.map((invite) => invite.email.toLowerCase()));
  const existingOrgEmails = new Set(organization.users.map((user) => user.email.toLowerCase()));
  const newEmails = parsedEmails.data.filter(
    (email) => !existingOrgEmails.has(email) && !pendingInviteEmails.has(email)
  );

  if (!newEmails.length) {
    redirect(managersHref("Those emails are already active or pending."));
  }

  if (
    managerLimit !== "unlimited" &&
    activeUserCount + pendingInviteEmails.size + newEmails.length > managerLimit
  ) {
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
          isActive: true
        }
      })
    )
  );

  const attachedEmails = new Set(unattachedUsers.map((user) => user.email.toLowerCase()));
  const inviteEmails = newEmails.filter((email) => !attachedEmails.has(email));

  if (inviteEmails.length) {
    await prisma.organizationInvite.createMany({
      data: inviteEmails.map((email) => ({
        orgId: appUser.orgId,
        email,
        role: Role.aftercare_manager,
        invitedByUserId: appUser.id
      })),
      skipDuplicates: true
    });
  }

  revalidatePath("/dashboard/aftercare");
  redirect(managersHref(`${newEmails.length} manager${newEmails.length === 1 ? "" : "s"} invited.`));
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
      aftercareOrgId: appUser.orgId
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

  await prisma.referral.update({
    where: { id: referral.id },
    data: {
      status: nextStatus,
      statusUpdatedAt: new Date()
    }
  });

  revalidatePath("/dashboard/aftercare");
  revalidatePath("/dashboard/referent");
  redirect("/dashboard/aftercare");
}
