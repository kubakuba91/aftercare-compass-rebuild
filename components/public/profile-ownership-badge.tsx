"use client";

import { useEffect, useId, useLayoutEffect, useRef, useState } from "react";
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
  const panel = useRef<HTMLSpanElement>(null);
  const [position, setPosition] = useState<{ left: number; top: number } | null>(null);

  useLayoutEffect(() => {
    if (!open) return;
    function placePanel() {
      if (!trigger.current || !panel.current) return;
      const anchor = trigger.current.getBoundingClientRect();
      const { width, height } = panel.current.getBoundingClientRect();
      setPosition({
        left: Math.max(16, Math.min(anchor.left, window.innerWidth - width - 16)),
        top: anchor.bottom + height <= window.innerHeight - 16
          ? anchor.bottom : Math.max(16, anchor.top - height)
      });
    }
    placePanel();
    window.addEventListener("resize", placePanel);
    window.addEventListener("scroll", placePanel, true);
    return () => {
      window.removeEventListener("resize", placePanel);
      window.removeEventListener("scroll", placePanel, true);
    };
  }, [open]);

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
    {open ? <span ref={panel} id={panelId} style={{ ...position, visibility: position ? "visible" : "hidden" }} className="fixed z-50 w-64 max-w-[calc(100vw-2rem)] pt-2">
      <span className="block rounded-xl border border-border bg-white p-4 text-sm font-normal leading-6 text-heading shadow-lg">
        {pending ? "A claim for this profile is being reviewed." : "This profile hasn’t been claimed by its provider."}
        <Link href={claimHref} className="focus-ring mt-2 block font-semibold !text-heading underline underline-offset-2" onClick={() => setOpen(false)}>
          {pending ? "View claim status" : "Claim this profile"}
        </Link>
      </span>
    </span> : null}
  </span>;
}
