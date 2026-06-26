"use client";

import { ArrowLeft } from "lucide-react";

export function BackButton({ fallbackHref = "/" }: { fallbackHref?: string }) {
  function handleBack() {
    if (window.history.length > 1) {
      window.history.back();
      return;
    }

    window.location.href = fallbackHref;
  }

  return (
    <button className="focus-ring ac-button ac-button--secondary" onClick={handleBack} type="button">
      <ArrowLeft aria-hidden="true" size={18} />
      Back
    </button>
  );
}
