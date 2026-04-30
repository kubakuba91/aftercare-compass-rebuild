"use client";

import { useEffect } from "react";
import { useClerk } from "@clerk/nextjs";

export default function OnboardingError({
  error,
  reset
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const { signOut } = useClerk();

  useEffect(() => {
    console.error("Onboarding error", error);
  }, [error]);

  function resetOnboarding() {
    window.location.assign("/onboarding/reset");
  }

  function logOut() {
    void signOut(() => {
      window.location.assign("/");
    });
  }

  return (
    <main className="shell flex min-h-screen items-center justify-center py-10">
      <section className="max-w-xl rounded-lg border border-border bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-semibold">Onboarding needs a reset</h1>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          This onboarding page could not continue. Reset the incomplete draft, or log out and sign
          in with another account.
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <button
            className="focus-ring inline-flex min-h-10 items-center rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground"
            onClick={resetOnboarding}
            type="button"
          >
            Reset onboarding
          </button>
          <button
            className="focus-ring inline-flex min-h-10 items-center rounded-md border border-border bg-white px-4 text-sm font-semibold"
            onClick={logOut}
            type="button"
          >
            Log out
          </button>
        </div>
      </section>
    </main>
  );
}
