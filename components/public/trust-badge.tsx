import { Badge } from "@/components/ui/badge";

export function TrustBadge({ verificationTier }: { verificationTier: number }) {
  const isVerified = verificationTier > 1;
  const label = isVerified ? "Verified" : "Self-reported";
  const description = isVerified
    ? "Aftercare Compass has reviewed this provider's trust details."
    : "This information was submitted by the provider and has not been verified by Aftercare Compass yet.";

  return (
    <span className="group relative inline-flex">
      <button
        aria-label={`${label}. ${description}`}
        className="cursor-help rounded-full focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
        type="button"
      >
        <Badge tone={isVerified ? "verified" : "neutral"}>{label}</Badge>
      </button>
      <span
        className="pointer-events-none absolute left-1/2 top-[calc(100%+0.5rem)] z-50 hidden w-64 -translate-x-1/2 rounded-md border border-border bg-white p-3 text-left text-xs font-medium leading-5 text-foreground shadow-lg group-focus-within:block group-hover:block"
        role="tooltip"
      >
        {description}
      </span>
    </span>
  );
}
