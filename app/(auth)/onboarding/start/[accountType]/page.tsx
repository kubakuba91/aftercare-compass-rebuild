import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Card } from "@/components/ui/card";
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

  if (accountType !== "referent") {
    redirect(destinationForAccountType(accountType, false));
  }

  let destination: string;

  try {
    const result = await ensureOnboardingOrganization(accountType);
    destination = destinationForAccountType(accountType, result.alreadyOnboarded);
  } catch (error) {
    console.error("Onboarding start failed", error);

    return (
      <main className="shell flex min-h-screen items-center justify-center py-10">
        <Card className="max-w-xl">
          <h1 className="text-2xl font-semibold">Could not start onboarding</h1>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            Your sign-in session or database connection needs a quick check before onboarding can
            continue.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link className="text-sm font-semibold text-primary" href="/sign-in">
              Sign in again
            </Link>
            <Link className="text-sm font-semibold text-primary" href="/setup">
              Check setup
            </Link>
          </div>
        </Card>
      </main>
    );
  }

  redirect(destination);
}
