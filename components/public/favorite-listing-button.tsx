"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { Heart, X } from "lucide-react";
import { toggleFavorite } from "@/app/(public)/search/actions";
import { cn } from "@/lib/utils";

export function FavoriteListingButton({
  canFavorite = true,
  initialFavorited = false,
  isSignedIn,
  profileId,
  programName
}: {
  canFavorite?: boolean;
  initialFavorited?: boolean;
  isSignedIn: boolean;
  profileId: string;
  programName: string;
}) {
  const [showPrompt, setShowPrompt] = useState(false);
  const [isFavorited, setIsFavorited] = useState(initialFavorited);
  const [isPending, startTransition] = useTransition();

  if (isSignedIn && !canFavorite) {
    return null;
  }

  if (isSignedIn) {
    return (
      <button
        aria-label={isFavorited ? `Remove ${programName} from favorites` : `Save ${programName}`}
        aria-pressed={isFavorited}
        className={cn(
          "focus-ring flex size-9 shrink-0 items-center justify-center rounded-md border border-border bg-white disabled:cursor-not-allowed disabled:opacity-60",
          isFavorited ? "text-primary" : null
        )}
        disabled={isPending}
        onClick={() => {
          startTransition(async () => {
            const result = await toggleFavorite(profileId);

            if (result.reason === "signin") {
              setShowPrompt(true);
              return;
            }

            if (typeof result.favorited === "boolean") {
              setIsFavorited(result.favorited);
            }
          });
        }}
        type="button"
      >
        <Heart fill={isFavorited ? "currentColor" : "none"} size={18} />
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
          className="ac-modal-overlay"
          role="dialog"
        >
          <div className="ac-modal relative max-w-md p-6">
            <button
              aria-label="Close"
              className="focus-ring ac-modal-close absolute right-4 top-4"
              onClick={() => setShowPrompt(false)}
              type="button"
            >
              <X size={18} />
            </button>
            <span className="ac-modal-icon">
              <Heart size={24} />
            </span>
            <div className="mt-5">
              <h2 className="pr-8 text-2xl font-semibold">Save this home</h2>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">
                Log in or create an account to favorite homes and find them again later.
              </p>
            </div>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <Link
                className="focus-ring ac-button ac-button--primary"
                href="/sign-in"
              >
                Log in
              </Link>
              <Link
                className="focus-ring ac-button ac-button--secondary"
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
