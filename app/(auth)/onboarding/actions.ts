"use server";

import { redirect } from "next/navigation";
import { getClerkSessionUserId } from "@/lib/current-user";
import { hasDatabaseConfig } from "@/lib/database-status";
import {
  draftDestinationForAccountType,
  getOrCreateOnboardingDraft,
  isAccountType
} from "@/lib/onboarding";
import { prisma } from "@/lib/prisma";

export async function selectAccountType(formData: FormData) {
  if (!hasDatabaseConfig()) {
    redirect("/setup?missing=database");
  }

  const accountType = String(formData.get("accountType"));

  if (!isAccountType(accountType)) {
    throw new Error("Invalid account type");
  }

  try {
    await getOrCreateOnboardingDraft(accountType);
  } catch (error) {
    console.error("Account type onboarding failed", error);
    redirect("/sign-in");
  }

  redirect(draftDestinationForAccountType(accountType));
}

export async function restartCurrentOnboarding() {
  if (!hasDatabaseConfig()) {
    redirect("/setup?missing=database");
  }

  const clerkUserId = await getClerkSessionUserId();

  if (!clerkUserId) {
    redirect("/sign-in");
  }

  const user = await prisma.user.findUnique({
    where: { clerkUserId },
    select: {
      id: true,
      organization: {
        select: {
          id: true,
          referentDetails: { select: { id: true } },
          _count: {
            select: {
              profiles: true,
              users: true,
              leads: true,
              referentReferrals: true,
              aftercareReferrals: true
            }
          }
        }
      }
    }
  });

  if (!user) {
    redirect("/onboarding/account-type");
  }

  await prisma.onboardingDraft.deleteMany({
    where: { userId: user.id, completedAt: null }
  });

  const organization = user.organization;
  const canRemovePlaceholderOrg =
    organization &&
    !organization.referentDetails &&
    organization._count.profiles === 0 &&
    organization._count.users === 1 &&
    organization._count.leads === 0 &&
    organization._count.referentReferrals === 0 &&
    organization._count.aftercareReferrals === 0;

  if (canRemovePlaceholderOrg) {
    await prisma.$transaction([
      prisma.user.update({
        where: { id: user.id },
        data: { orgId: null }
      }),
      prisma.organization.delete({
        where: { id: organization.id }
      })
    ]);
  }

  redirect("/onboarding/account-type");
}
