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
        <h1 className="text-2xl font-semibold">Onboarding needs a quick check</h1>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          We could not continue onboarding. This is usually caused by a missing Vercel environment
          variable or an expired sign-in session.
        </p>
        {error.digest ? (
          <p className="mt-3 text-xs text-muted-foreground">
            Error digest: <code>{error.digest}</code>
          </p>
        ) : null}
        <div className="mt-5 flex flex-wrap gap-3">
          <button
            className="focus-ring min-h-10 rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground"
            onClick={reset}
          >
            Try again
          </button>
          <Link
            className="focus-ring inline-flex min-h-10 items-center rounded-md border border-border bg-white px-4 text-sm font-semibold"
            href="/onboarding/start/sober_living"
          >
            Resume onboarding
          </Link>
          <Link
            className="focus-ring inline-flex min-h-10 items-center rounded-md border border-border bg-white px-4 text-sm font-semibold"
            href="/sign-in?redirect_url=/onboarding/start/sober_living"
          >
            Sign in again
          </Link>
          <Link
            className="focus-ring inline-flex min-h-10 items-center rounded-md border border-border bg-white px-4 text-sm font-semibold"
            href="/setup"
          >
            Check setup
          </Link>
        </div>
      </section>
    </main>
  );
}
