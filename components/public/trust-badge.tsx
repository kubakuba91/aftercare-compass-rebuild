"use client";

import { useCallback, useRef, useState } from "react";
import { Badge } from "@/components/ui/badge";

export function TrustBadge({ verificationTier }: { verificationTier: number }) {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [position, setPosition] = useState({ left: 16, top: 16 });
  const isVerified = verificationTier > 1;
  const label = isVerified ? "Verified" : "Self-reported";
  const description = isVerified
    ? "Aftercare Compass has reviewed this provider's trust details."
    : "This information was submitted by the provider and has not been verified by Aftercare Compass yet.";
  const updatePosition = useCallback(() => {
    const button = buttonRef.current;

    if (!button) {
      return;
    }

    const tooltipWidth = Math.min(256, window.innerWidth - 32);
    const tooltipHeight = 96;
    const rect = button.getBoundingClientRect();
    const centeredLeft = rect.left + rect.width / 2 - tooltipWidth / 2;
    const left = Math.min(Math.max(16, centeredLeft), window.innerWidth - tooltipWidth - 16);
    const preferredTop = rect.bottom + 8;
    const top =
      preferredTop + tooltipHeight > window.innerHeight
        ? Math.max(16, rect.top - tooltipHeight - 8)
        : preferredTop;

    setPosition({
      left,
      top
    });
  }, []);

  function showTooltip() {
    updatePosition();
    setIsVisible(true);
  }

  return (
    <span className="relative inline-flex">
      <button
        aria-label={`${label}. ${description}`}
        className="cursor-help rounded-full focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
        onBlur={() => setIsVisible(false)}
        onFocus={showTooltip}
        onMouseEnter={showTooltip}
        onMouseLeave={() => setIsVisible(false)}
        ref={buttonRef}
        type="button"
      >
        <Badge tone={isVerified ? "verified" : "neutral"}>{label}</Badge>
      </button>
      {isVisible ? (
        <span
          className="pointer-events-none fixed z-50 max-w-[calc(100vw-2rem)] rounded-md border border-border bg-white p-3 text-left text-xs font-medium leading-5 text-foreground shadow-lg"
          role="tooltip"
          style={{
            left: position.left,
            top: position.top,
            width: "min(16rem, calc(100vw - 2rem))"
          }}
        >
          {description}
        </span>
      ) : null}
    </span>
  );
}
