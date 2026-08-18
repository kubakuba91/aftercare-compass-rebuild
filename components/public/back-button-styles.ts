import { cn } from "@/lib/utils";

export type BackButtonSurface = "page" | "panel";

export function backButtonClassName(surface: BackButtonSurface, className?: string) {
  return cn(
    "focus-ring ac-back-button",
    surface === "page"
      ? "ac-back-button--page"
      : "ac-back-button--panel",
    className
  );
}
