"use client";

import { ArrowLeft } from "lucide-react";
import { backButtonClassName, type BackButtonSurface } from "@/components/public/back-button-styles";

export function BackButton({
  className,
  fallbackHref = "/",
  surface = "page"
}: {
  className?: string;
  fallbackHref?: string;
  surface?: BackButtonSurface;
}) {
  function handleBack() {
    if (window.history.length > 1) {
      window.history.back();
      return;
    }

    window.location.href = fallbackHref;
  }

  return (
    <button className={backButtonClassName(surface, className)} onClick={handleBack} type="button">
      <ArrowLeft aria-hidden="true" size={22} />
      Back
    </button>
  );
}
