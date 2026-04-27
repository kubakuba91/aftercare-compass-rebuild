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
        "focus-ring inline-flex min-h-10 items-center justify-center rounded-md px-4 text-sm font-semibold",
        variant === "primary"
          ? "bg-primary text-primary-foreground"
          : "border border-border bg-white text-foreground"
      )}
    >
      {children}
    </Link>
  );
}
