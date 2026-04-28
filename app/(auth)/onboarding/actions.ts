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

  let destination = "/dashboard";

  try {
    const identity = await getRequiredClerkIdentity();
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ email: identity.email }, { clerkUserId: identity.clerkUserId }]
      },
      select: { id: true, orgId: true }
    });

    if (existingUser?.orgId) {
      destination = "/dashboard";
    } else {
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

      if (existingUser) {
        await prisma.user.update({
          where: { id: existingUser.id },
          data: {
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
      } else {
        await prisma.user.create({
          data: {
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
      }

      destination =
        accountType === "referent"
          ? "/dashboard/referent"
          : `/onboarding/aftercare/profile?type=${accountType}`;
    }
  } catch (error) {
    console.error("Account type onboarding failed", error);
    redirect("/sign-in?redirect_url=/onboarding/account-type");
  }

  redirect(destination);
}
