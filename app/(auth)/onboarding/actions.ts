"use server";

import { redirect } from "next/navigation";
import { hasDatabaseConfig } from "@/lib/database-status";
import {
  draftDestinationForAccountType,
  getOrCreateOnboardingDraft,
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

  try {
    await getOrCreateOnboardingDraft(accountType);
  } catch (error) {
    console.error("Account type onboarding failed", error);
    redirect("/sign-in");
  }

  redirect(draftDestinationForAccountType(accountType));
}
