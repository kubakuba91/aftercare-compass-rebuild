"use client";

import { SignOutButton as ClerkSignOutButton } from "@clerk/nextjs";

export function SignOutButton() {
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
