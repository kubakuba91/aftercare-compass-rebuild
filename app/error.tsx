"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function GlobalError({
  error,
  reset: _reset
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Global app error", error);
  }, [error]);

  return (
    <main className="shell flex min-h-screen items-center justify-center py-10">
      <section className="max-w-xl rounded-lg border border-border bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-semibold">Session timed out</h1>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          Please sign back in to continue.
        </p>
        <Link
          className="focus-ring mt-5 inline-flex min-h-10 items-center rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground"
          href="/sign-in?redirect_url=/dashboard&reason=session_timeout"
        >
          Sign in to continue
        </Link>
      </section>
    </main>
  );
}
