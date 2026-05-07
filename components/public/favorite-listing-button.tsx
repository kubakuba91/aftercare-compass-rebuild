"use client";

import Link from "next/link";
import { useState } from "react";
import { Heart, X } from "lucide-react";

export function FavoriteListingButton({
  isSignedIn,
  programName
}: {
  isSignedIn: boolean;
  programName: string;
}) {
  const [showPrompt, setShowPrompt] = useState(false);

  if (isSignedIn) {
    return (
      <button
        aria-label={`Save ${programName}`}
        className="focus-ring flex size-9 shrink-0 items-center justify-center rounded-md border border-border bg-white"
        type="button"
      >
        <Heart size={18} />
      </button>
    );
  }

  return (
    <>
      <button
        aria-label={`Save ${programName}`}
        className="focus-ring flex size-9 shrink-0 items-center justify-center rounded-md border border-border bg-white"
        onClick={() => setShowPrompt(true)}
        type="button"
      >
        <Heart size={18} />
      </button>
      {showPrompt ? (
        <div
          aria-modal="true"
          className="fixed inset-0 z-50 grid place-items-center bg-black/30 p-4"
          role="dialog"
        >
          <div className="relative w-full max-w-md rounded-lg border border-border bg-white p-6 shadow-xl">
            <button
              aria-label="Close"
              className="focus-ring absolute right-4 top-4 rounded-md p-1"
              onClick={() => setShowPrompt(false)}
              type="button"
            >
              <X size={18} />
            </button>
            <h2 className="pr-8 text-2xl font-semibold">Save this home</h2>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              Log in or create an account to favorite homes and find them again later.
            </p>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <Link
                className="focus-ring inline-flex min-h-11 items-center justify-center rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground"
                href="/sign-in"
              >
                Log in
              </Link>
              <Link
                className="focus-ring inline-flex min-h-11 items-center justify-center rounded-md border border-border px-4 text-sm font-semibold"
                href="/sign-up"
              >
                Create account
              </Link>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
