import Link from "next/link";
import { Card } from "@/components/ui/card";
import { restartCurrentOnboarding } from "../actions";

export const dynamic = "force-dynamic";

export default function OnboardingResetPage() {
  return (
    <main className="shell flex min-h-screen items-center justify-center py-10">
      <Card className="max-w-xl">
        <h1 className="text-2xl font-semibold">Reset onboarding</h1>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          This will clear your incomplete onboarding draft and return you to account type
          selection. It will not delete your sign-in account.
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <form action={restartCurrentOnboarding}>
            <button className="focus-ring inline-flex min-h-10 items-center rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground">
              Reset onboarding
            </button>
          </form>
          <Link
            className="focus-ring inline-flex min-h-10 items-center rounded-md border border-border bg-white px-4 text-sm font-semibold"
            href="/auth/complete"
          >
            Continue without reset
          </Link>
        </div>
      </Card>
    </main>
  );
}
