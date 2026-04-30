import { notFound, redirect } from "next/navigation";
import { isClerkIdentityError } from "@/lib/current-user";
import { hasDatabaseConfig } from "@/lib/database-status";
import {
  draftDestinationForAccountType,
  getOrCreateOnboardingDraft,
  isAccountType
} from "@/lib/onboarding";

export default async function StartOnboardingPage({
  params
}: {
  params: Promise<{ accountType: string }>;
}) {
  const { accountType } = await params;

  if (!isAccountType(accountType)) {
    notFound();
  }

  if (!hasDatabaseConfig()) {
    redirect("/setup?missing=database");
  }

  try {
    await getOrCreateOnboardingDraft(accountType);
  } catch (error) {
    console.error("Onboarding start failed", error);

    if (isClerkIdentityError(error)) {
      redirect("/sign-in");
    }

    redirect("/sign-in");
  }

  redirect(draftDestinationForAccountType(accountType));
}
