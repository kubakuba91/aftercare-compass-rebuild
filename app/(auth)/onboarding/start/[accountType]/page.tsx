import { notFound, redirect } from "next/navigation";
import { isClerkIdentityError } from "@/lib/current-user";
import { hasDatabaseConfig } from "@/lib/database-status";
import {
  destinationForAccountType,
  ensureOnboardingOrganization,
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

  let destination: string;

  try {
    const result = await ensureOnboardingOrganization(accountType);
    destination = destinationForAccountType(accountType, result.alreadyOnboarded);
  } catch (error) {
    console.error("Onboarding start failed", error);

    if (isClerkIdentityError(error)) {
      redirect(`/sign-in?redirect_url=/onboarding/start/${accountType}&reason=session_timeout`);
    }

    redirect(`/sign-in?redirect_url=/onboarding/start/${accountType}&reason=session_timeout`);
  }

  redirect(destination);
}
