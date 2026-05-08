"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { Role } from "@prisma/client";
import { z } from "zod";
import { sendOrganizationInviteEmail } from "@/lib/email-notifications";
import { referentPlans } from "@/lib/plans";
import { prisma } from "@/lib/prisma";
import { getProtectedAppUser } from "@/lib/protected-routing";

const addTeamMemberSchema = z.object({
  email: z.string().trim().email()
});

function referentTeamLimit(planKey: string | null | undefined) {
  const plan = planKey && planKey in referentPlans
    ? referentPlans[planKey as keyof typeof referentPlans]
    : referentPlans.starter;

  return plan.teamMembers;
}

function teamHref(message?: string) {
  const params = new URLSearchParams();

  if (message) {
    params.set("teamMessage", message);
  }

  return `/dashboard/referent${params.size ? `?${params.toString()}` : ""}`;
}

export async function addReferentTeamMember(formData: FormData) {
  const appUser = await getProtectedAppUser("/dashboard/referent");

  if (appUser.role !== Role.referent_admin || !appUser.orgId) {
    redirect(teamHref("Only referent admins can add team members."));
  }

  const parsed = addTeamMemberSchema.safeParse({
    email: formData.get("email")
  });

  if (!parsed.success) {
    redirect(teamHref("Enter a valid email address."));
  }

  const email = parsed.data.email.toLowerCase();
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
    redirect(teamHref("Referent organization setup is incomplete."));
  }

  const activeUsers = organization.users.filter((user) => user.isActive);
  const pendingEmails = organization.referentDetails.invitedTeamEmails.map((item) => item.toLowerCase());
  const teamLimit = referentTeamLimit(organization.subscriptionPlan);
  const existingOrgUser = organization.users.find((user) => user.email.toLowerCase() === email);

  if (existingOrgUser?.isActive) {
    redirect(teamHref("That person is already on this account."));
  }

  if (pendingEmails.includes(email)) {
    redirect(teamHref("That invite is already pending."));
  }

  if (teamLimit !== "unlimited" && activeUsers.length + pendingEmails.length >= teamLimit) {
    redirect(teamHref(`Your current plan allows ${teamLimit} team members.`));
  }

  const existingUser = await prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      orgId: true,
      isActive: true
    }
  });

  if (existingUser?.orgId && existingUser.orgId !== appUser.orgId) {
    redirect(teamHref("That email already belongs to another organization."));
  }

  if (existingUser && !existingUser.orgId) {
    await prisma.user.update({
      where: { id: existingUser.id },
      data: {
        orgId: appUser.orgId,
        role: Role.referent_manager,
        isActive: true
      }
    });

    await sendOrganizationInviteEmail({
      email,
      organizationName: organization.name,
      role: Role.referent_manager,
      invitedByName: [appUser.firstName, appUser.lastName].filter(Boolean).join(" ") || appUser.email
    });

    revalidatePath("/dashboard/referent");
    redirect(teamHref("Team member added."));
  }

  await prisma.referentOrganization.update({
    where: { orgId: appUser.orgId },
    data: {
      invitedTeamEmails: [...pendingEmails, email]
    }
  });

  await sendOrganizationInviteEmail({
    email,
    organizationName: organization.name,
    role: Role.referent_manager,
    invitedByName: [appUser.firstName, appUser.lastName].filter(Boolean).join(" ") || appUser.email
  });

  revalidatePath("/dashboard/referent");
  redirect(teamHref("Invite saved. They can join by signing up with that email."));
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
