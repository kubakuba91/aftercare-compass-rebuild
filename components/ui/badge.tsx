import { cn } from "@/lib/utils";

type BadgeTone = "neutral" | "verified" | "warning" | "success";

const tones: Record<BadgeTone, string> = {
  neutral: "ac-chip--neutral",
  verified: "ac-chip--verified",
  warning: "ac-chip--warning",
  success: "ac-chip--success"
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
        "ac-chip",
        tones[tone],
        className
      )}
    >
      {children}
    </span>
  );
}
