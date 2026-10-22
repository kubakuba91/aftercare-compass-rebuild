import type { ComponentPropsWithoutRef } from "react";
import { cn } from "@/lib/utils";

/** Informational tags preserve provider wording; unlike status badges, no title casing. */
export function Tag({ variant = "primary", className, ...props }: ComponentPropsWithoutRef<"span"> & {
  variant?: "primary" | "secondary" | "tertiary";
}) {
  return <span {...props} className={cn("ac-tag", `ac-tag--${variant}`, className)} />;
}
