"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function OnboardingError({
  error,
  reset
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Onboarding error", error);
  }, [error]);

  return (
    <main className="shell flex min-h-screen items-center justify-center py-10">
      <section className="max-w-xl rounded-lg border border-border bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-semibold">Onboarding needs a reset</h1>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          This onboarding page could not continue. Return home, then sign out or start onboarding
          again from a fresh page.
        </p>
        <Link
          className="focus-ring mt-5 inline-flex min-h-10 items-center rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground"
          href="/"
        >
          Go home
        </Link>
      </section>
    </main>
  );
}
