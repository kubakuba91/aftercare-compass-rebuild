"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Global app error", error);
  }, [error]);

  return (
    <html lang="en">
      <body>
        <main className="shell flex min-h-screen items-center justify-center py-10">
          <section className="max-w-xl rounded-lg border border-border bg-white p-6 shadow-sm">
            <h1 className="text-2xl font-semibold">Something went sideways</h1>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              The app hit an unexpected browser error. Try again, and if it repeats, check the
              browser console for the message shown with this screen.
            </p>
            {error.digest ? (
              <p className="mt-3 text-xs text-muted-foreground">
                Error digest: <code>{error.digest}</code>
              </p>
            ) : null}
            <button
              className="focus-ring mt-5 min-h-10 rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground"
              onClick={reset}
            >
              Try again
            </button>
          </section>
        </main>
      </body>
    </html>
  );
}

