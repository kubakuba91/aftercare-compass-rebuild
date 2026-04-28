"use server";

import { redirect } from "next/navigation";
import { OrganizationType } from "@prisma/client";
import { getRequiredClerkIdentity, defaultRoleForAccountType } from "@/lib/current-user";
import { hasDatabaseConfig } from "@/lib/database-status";
import { prisma } from "@/lib/prisma";

const accountTypeToOrgType = {
  referent: OrganizationType.referent,
  sober_living: OrganizationType.aftercare_sober_living,
  continued_care: OrganizationType.aftercare_continued_care
} as const;

export async function selectAccountType(formData: FormData) {
  if (!hasDatabaseConfig()) {
    redirect("/setup?missing=database");
  }

  const accountType = String(formData.get("accountType"));

  if (!(accountType in accountTypeToOrgType)) {
    throw new Error("Invalid account type");
  }

  const identity = await getRequiredClerkIdentity();
  const existingUser = await prisma.user.findUnique({
    where: { email: identity.email },
    select: { orgId: true }
  });

  if (existingUser?.orgId) {
    redirect("/dashboard");
  }

  const orgType = accountTypeToOrgType[accountType as keyof typeof accountTypeToOrgType];
  const role = defaultRoleForAccountType(accountType);
  const organizationName =
    accountType === "referent"
      ? `${identity.email} Referent Organization`
      : `${identity.email} Aftercare Organization`;

  const organization = await prisma.organization.create({
    data: {
      type: orgType,
      name: organizationName,
      email: identity.email
    },
    select: { id: true }
  });

  await prisma.user.upsert({
    where: { clerkUserId: identity.clerkUserId },
    update: {
      email: identity.email,
      firstName: identity.firstName,
      lastName: identity.lastName,
      role,
      orgId: organization.id,
      emailVerified: identity.emailVerified,
      emailVerifiedAt: identity.emailVerified ? new Date() : null
    },
    create: {
      clerkUserId: identity.clerkUserId,
      email: identity.email,
      firstName: identity.firstName,
      lastName: identity.lastName,
      role,
      orgId: organization.id,
      emailVerified: identity.emailVerified,
      emailVerifiedAt: identity.emailVerified ? new Date() : null
    }
  });

  if (accountType === "referent") {
    redirect("/dashboard/referent");
  }

  redirect(`/onboarding/aftercare/profile?type=${accountType}`);
}

