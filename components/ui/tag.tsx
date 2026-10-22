import type { ComponentPropsWithoutRef } from "react";
import { cn } from "@/lib/utils";

/** Informational tags preserve provider wording; unlike status badges, no title casing. */
export function Tag({ variant = "filled", className, ...props }: ComponentPropsWithoutRef<"span"> & {
  variant?: "filled" | "outline";
}) {
  return <span {...props} className={cn("ac-tag", `ac-tag--${variant}`, className)} />;
}
