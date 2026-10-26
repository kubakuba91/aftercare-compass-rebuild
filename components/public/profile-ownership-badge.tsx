"use client";

import { useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import type { ProfileOwnershipStatus } from "@prisma/client";
import { Badge } from "@/components/ui/badge";

export function ProfileOwnershipBadge({ ownershipStatus, claimHref }: {
  ownershipStatus: ProfileOwnershipStatus;
  claimHref?: string;
}) {
  const [open, setOpen] = useState(false);
  const trigger = useRef<HTMLButtonElement>(null);
  const panelId = useId();
  const container = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!open) return;
    function dismiss(event: PointerEvent) {
      if (event.target instanceof Node && !container.current?.contains(event.target)) setOpen(false);
    }
    document.addEventListener("pointerdown", dismiss);
    return () => document.removeEventListener("pointerdown", dismiss);
  }, [open]);

  if (ownershipStatus === "claimed") return null;
  const pending = ownershipStatus === "claim_pending";
  const label = pending ? "Claim under review" : "Unclaimed";
  if (!claimHref) return <Badge tone="warning">{label}</Badge>;

  return <span
    ref={container}
    className="relative inline-flex"
    onMouseEnter={() => setOpen(true)}
    onMouseLeave={(event) => { if (!event.currentTarget.contains(document.activeElement)) setOpen(false); }}
    onFocus={() => setOpen(true)}
    onBlur={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false); }}
    onKeyDown={(event) => {
      if (event.key === "Escape") {
        event.preventDefault();
        trigger.current?.focus();
        setOpen(false);
      }
    }}
  >
    <button
      ref={trigger}
      type="button"
      data-profile-claim-trigger
      aria-expanded={open}
      aria-controls={panelId}
      className="focus-ring inline-flex rounded-full"
      onClick={() => setOpen(true)}
    >
      <Badge tone="warning">{label}</Badge>
    </button>
    {open ? <span id={panelId} className="absolute left-0 top-full z-30 w-64 max-w-[calc(100vw-3rem)] pt-2">
      <span className="block rounded-xl border border-border bg-white p-4 text-sm font-normal leading-6 text-heading shadow-lg">
        {pending ? "A claim for this profile is being reviewed." : "This profile hasn’t been claimed by its provider."}
        <Link href={claimHref} className="focus-ring mt-2 block font-semibold !text-heading underline underline-offset-2" onClick={() => setOpen(false)}>
          {pending ? "View claim status" : "Claim this profile"}
        </Link>
      </span>
    </span> : null}
  </span>;
}
