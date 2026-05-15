import type { ButtonHTMLAttributes, ReactNode } from "react";
import Link from "next/link";
import { MoreHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";

export function RowActionsMenu({
  children,
  label = "More actions",
  className
}: {
  children: ReactNode;
  label?: string;
  className?: string;
}) {
  return (
    <details className={cn("group relative inline-flex", className)}>
      <summary
        aria-label={label}
        className="focus-ring inline-flex min-h-9 w-9 cursor-pointer list-none items-center justify-center rounded-md border border-border bg-surface text-foreground shadow-sm transition hover:bg-surface-secondary [&::-webkit-details-marker]:hidden"
        title={label}
      >
        <MoreHorizontal aria-hidden="true" size={18} />
      </summary>
      <div className="absolute right-0 top-full z-40 mt-2 min-w-56 rounded-xl border border-border bg-surface p-2 text-left shadow-lg">
        {children}
      </div>
    </details>
  );
}

export function RowActionsMenuLabel({ children }: { children: ReactNode }) {
  return (
    <p className="px-3 py-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
      {children}
    </p>
  );
}

export function RowActionsMenuDivider() {
  return <div className="my-2 border-t border-border" />;
}

export function RowActionsMenuLink({
  href,
  children,
  description,
  tone = "neutral"
}: {
  href: string;
  children: ReactNode;
  description?: ReactNode;
  tone?: "neutral" | "danger";
}) {
  return (
    <Link
      className={cn(
        "block rounded-md px-3 py-2 text-sm transition hover:bg-surface-secondary",
        tone === "danger" ? "text-destructive" : "text-foreground"
      )}
      href={href}
    >
      <span className="font-semibold">{children}</span>
      {description ? <span className="mt-0.5 block text-xs text-muted-foreground">{description}</span> : null}
    </Link>
  );
}

export function RowActionsMenuButton({
  children,
  className,
  description,
  tone = "neutral",
  type = "submit",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
  description?: ReactNode;
  tone?: "neutral" | "danger";
}) {
  return (
    <button
      className={cn(
        "block w-full rounded-md px-3 py-2 text-left text-sm transition hover:bg-surface-secondary",
        tone === "danger" ? "text-destructive" : "text-foreground",
        className
      )}
      type={type}
      {...props}
    >
      <span className="font-semibold">{children}</span>
      {description ? <span className="mt-0.5 block text-xs text-muted-foreground">{description}</span> : null}
    </button>
  );
}
