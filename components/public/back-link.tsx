import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import type { ReactNode } from "react";
import { backButtonClassName, type BackButtonSurface } from "@/components/public/back-button-styles";

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
