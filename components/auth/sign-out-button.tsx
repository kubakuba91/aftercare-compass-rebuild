"use client";

import { SignOutButton as ClerkSignOutButton } from "@clerk/nextjs";

export function SignOutButton() {
  // The root layout omits ClerkProvider when public auth configuration is absent.
  const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
  if (!publishableKey || !(publishableKey.startsWith("pk_test_") || publishableKey.startsWith("pk_live_"))) {
    return null;
  }

  return (
    <ClerkSignOutButton redirectUrl="/">
      <button
        className="focus-ring inline-flex min-h-10 items-center justify-center rounded-md border border-border bg-white px-4 text-sm font-semibold"
        type="button"
      >
        Log out
      </button>
    </ClerkSignOutButton>
  );
}
