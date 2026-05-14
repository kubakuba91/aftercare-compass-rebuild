import Link from "next/link";
import { cn } from "@/lib/utils";

export function ButtonLink({
  href,
  children,
  variant = "primary"
}: {
  href: string;
  children: React.ReactNode;
  variant?: "primary" | "secondary";
}) {
  return (
    <Link
      href={href}
      className={cn(
        "focus-ring ac-button",
        variant === "primary" ? "ac-button--primary" : "ac-button--secondary"
      )}
    >
      {children}
    </Link>
  );
}
