"use client";

import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type BackButtonSurface = "page" | "panel";

function backButtonClassName(surface: BackButtonSurface, className?: string) {
  return cn(
    "focus-ring ac-back-button",
    surface === "page"
      ? "ac-back-button--page"
      : "ac-back-button--panel",
    className
  );
}

export function BackLink({
  children = "Back",
  className,
  href,
  surface = "page"
}: {
  children?: ReactNode;
  className?: string;
  href: string;
  surface?: BackButtonSurface;
}) {
  return (
    <Link className={backButtonClassName(surface, className)} href={href}>
      <ArrowLeft aria-hidden="true" size={22} />
      {children}
    </Link>
  );
}

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
