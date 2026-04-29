"use server";

import { redirect } from "next/navigation";
import { hasDatabaseConfig } from "@/lib/database-status";
import {
  destinationForAccountType,
  ensureOnboardingOrganization,
  isAccountType
} from "@/lib/onboarding";

export async function selectAccountType(formData: FormData) {
  if (!hasDatabaseConfig()) {
    redirect("/setup?missing=database");
  }

  const accountType = String(formData.get("accountType"));

  if (!isAccountType(accountType)) {
    throw new Error("Invalid account type");
  }

  let destination: string;

  try {
    const result = await ensureOnboardingOrganization(accountType);
    destination = destinationForAccountType(accountType, result.alreadyOnboarded);
  } catch (error) {
    console.error("Account type onboarding failed", error);
    redirect("/sign-in?redirect_url=/onboarding/account-type&reason=session_timeout");
  }

  redirect(destination);
}
