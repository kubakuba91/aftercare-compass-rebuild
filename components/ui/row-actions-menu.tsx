"use client";

import type { ButtonHTMLAttributes, ReactNode } from "react";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { MoreHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";

const menuWidth = 288;
const viewportPadding = 16;
const menuGap = 8;
const preferredMenuHeight = 320;

type MenuPosition = {
  bottom?: number;
  left: number;
  top?: number;
};

export function RowActionsMenu({
  children,
  label = "More actions",
  className
}: {
  children: ReactNode;
  label?: string;
  className?: string;
}) {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState<MenuPosition>({ left: 0, top: 0 });
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) {
      return;
    }

    function updatePosition() {
      const rect = buttonRef.current?.getBoundingClientRect();

      if (!rect) {
        return;
      }

      const availableWidth = Math.max(0, window.innerWidth - viewportPadding * 2);
      const safeMenuWidth = Math.min(menuWidth, availableWidth);
      const left = Math.min(
        window.innerWidth - safeMenuWidth - viewportPadding,
        Math.max(viewportPadding, rect.right - safeMenuWidth)
      );
      const spaceBelow = window.innerHeight - rect.bottom;
      const shouldOpenUp = spaceBelow < preferredMenuHeight && rect.top > spaceBelow;

      setPosition(
        shouldOpenUp
          ? { bottom: window.innerHeight - rect.top + menuGap, left }
          : { left, top: rect.bottom + menuGap }
      );
    }

    function closeOnOutsideClick(event: MouseEvent) {
      const target = event.target as Node;

      if (buttonRef.current?.contains(target) || menuRef.current?.contains(target)) {
        return;
      }

      setOpen(false);
    }

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
        buttonRef.current?.focus();
      }
    }

    updatePosition();
    document.addEventListener("mousedown", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);

    return () => {
      document.removeEventListener("mousedown", closeOnOutsideClick);
      document.removeEventListener("keydown", closeOnEscape);
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [open]);

  return (
    <div className={cn("relative inline-flex", className)}>
      <button
        aria-label={label}
        aria-expanded={open}
        aria-haspopup="menu"
        className="focus-ring inline-flex min-h-9 w-9 cursor-pointer list-none items-center justify-center rounded-md border border-border bg-surface text-foreground shadow-sm transition hover:bg-surface-secondary [&::-webkit-details-marker]:hidden"
        onClick={() => setOpen((current) => !current)}
        ref={buttonRef}
        title={label}
        type="button"
      >
        <MoreHorizontal aria-hidden="true" size={18} />
      </button>
      {mounted && open
        ? createPortal(
            <div
              className="fixed z-[9999] max-h-[min(28rem,calc(100vh-2rem))] overflow-y-auto rounded-xl border border-border bg-surface p-2 text-left shadow-xl"
              ref={menuRef}
              role="menu"
              style={{
                bottom: position.bottom,
                left: position.left,
                top: position.top,
                width: `min(${menuWidth}px, calc(100vw - ${viewportPadding * 2}px))`
              }}
            >
              {children}
            </div>,
            document.body
          )
        : null}
    </div>
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
