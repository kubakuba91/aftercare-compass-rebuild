import Link from "next/link";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { Card } from "@/components/ui/card";
import { restartCurrentOnboarding } from "@/app/(auth)/onboarding/actions";

export function OnboardingRecoveryCard() {
  return (
    <main className="shell flex min-h-screen items-center justify-center py-10">
      <Card className="max-w-xl">
        <h1 className="text-2xl font-semibold">Onboarding needs a reset</h1>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          Your account is signed in, but this onboarding draft could not continue. Start over to
          choose an account type again, or log out and sign in with another account.
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <form action={restartCurrentOnboarding}>
            <button className="focus-ring inline-flex min-h-10 items-center rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground">
              Start over
            </button>
          </form>
          <Link
            className="focus-ring inline-flex min-h-10 items-center rounded-md border border-border bg-white px-4 text-sm font-semibold"
            href="/auth/complete"
          >
            Continue
          </Link>
          <SignOutButton />
        </div>
      </Card>
    </main>
  );
}
