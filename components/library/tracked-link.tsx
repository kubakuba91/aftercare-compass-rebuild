"use client";

import type { AnchorHTMLAttributes } from "react";
import { trackEvent } from "@/lib/track-event";

type Props = AnchorHTMLAttributes<HTMLAnchorElement> & {
  eventName: string;
  eventParams?: Record<string, unknown>;
};

export function TrackedLink({ eventName, eventParams, onClick, ...props }: Props) {
  return (
    <a
      {...props}
      onClick={(e) => {
        trackEvent(eventName, eventParams);
        onClick?.(e);
      }}
    />
  );
}
