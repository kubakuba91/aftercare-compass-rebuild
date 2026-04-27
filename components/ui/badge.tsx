import { cn } from "@/lib/utils";

type BadgeTone = "neutral" | "verified" | "warning" | "success";

const tones: Record<BadgeTone, string> = {
  neutral: "border-border bg-white text-foreground",
  verified: "border-primary/20 bg-primary/10 text-primary",
  warning: "border-accent/30 bg-accent/15 text-foreground",
  success: "border-emerald-200 bg-emerald-50 text-emerald-800"
};

export function Badge({
  children,
  tone = "neutral",
  className
}: {
  children: React.ReactNode;
  tone?: BadgeTone;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium",
        tones[tone],
        className
      )}
    >
      {children}
    </span>
  );
}

