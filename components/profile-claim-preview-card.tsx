import Image from "next/image";
import Link from "next/link";
import { ArrowRight, BedDouble, Building2, MapPin, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type ProfileClaimPreviewCardProps = {
  badge?: string;
  claimHref: string;
  description?: string | null;
  imageAlt?: string;
  imageUrl?: string | null;
  location: string;
  ownershipStatus: "claimed" | "unclaimed" | "claim_pending";
  priceLabel?: string | null;
  programName: string;
  tags?: string[];
  typeLabel: string;
};

export function ProfileClaimPreviewCard({
  badge,
  claimHref,
  description,
  imageAlt,
  imageUrl,
  location,
  ownershipStatus,
  priceLabel,
  programName,
  tags = [],
  typeLabel
}: ProfileClaimPreviewCardProps) {
  const isPending = ownershipStatus === "claim_pending";
  const isClaimed = ownershipStatus === "claimed";
  const statusLabel = isClaimed ? "Already managed" : isPending ? "Claim in review" : "Unclaimed";

  return (
    <article className="overflow-hidden rounded-lg border border-border bg-white shadow-sm">
      <div className="grid gap-0 md:grid-cols-[220px_1fr]">
        <div className="relative min-h-48 overflow-hidden bg-muted md:min-h-full">
          {imageUrl ? (
            <Image
              alt={imageAlt || programName}
              className="object-cover"
              fill
              sizes="(min-width: 768px) 220px, 100vw"
              src={imageUrl}
              unoptimized
            />
          ) : (
            <div className="flex h-full min-h-48 items-center justify-center bg-[linear-gradient(135deg,#eef2ff,#ecfdf5)] px-6 text-center">
              <div>
                <Building2 className="mx-auto text-primary" size={32} />
                <p className="mt-3 text-sm font-semibold text-muted-foreground">Profile image pending</p>
              </div>
            </div>
          )}
          {badge ? (
            <span className="absolute left-3 top-3 rounded-full bg-white/95 px-3 py-1 text-xs font-semibold shadow-sm">
              {badge}
            </span>
          ) : null}
        </div>

        <div className="grid gap-4 p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <div className="flex flex-wrap gap-2">
                <Badge>{typeLabel}</Badge>
                <Badge tone={isClaimed || isPending ? "warning" : "success"}>
                  {statusLabel}
                </Badge>
              </div>
              <h2 className="mt-3 text-xl font-semibold">{programName}</h2>
              <p className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
                <MapPin size={16} />
                {location || "Location not listed"}
              </p>
            </div>
            {priceLabel ? (
              <div className="rounded-md border border-border bg-muted/30 px-3 py-2 text-right">
                <p className="text-xs font-semibold text-muted-foreground">Starting at</p>
                <p className="text-sm font-semibold">{priceLabel}</p>
              </div>
            ) : null}
          </div>

          {description ? (
            <p className="line-clamp-2 text-sm leading-6 text-muted-foreground">{description}</p>
          ) : null}

          {tags.length ? (
            <div className="flex flex-wrap gap-2">
              {tags.slice(0, 4).map((tag) => (
                <span key={tag} className="rounded-full border border-border bg-muted/40 px-3 py-1 text-xs font-semibold">
                  {tag}
                </span>
              ))}
              {tags.length > 4 ? (
                <span className="rounded-full border border-border bg-muted/40 px-3 py-1 text-xs font-semibold">
                  +{tags.length - 4} more
                </span>
              ) : null}
            </div>
          ) : null}

          <div className="flex flex-wrap items-center gap-3 border-t border-border pt-4">
            <Link
              className={cn(
                "focus-ring inline-flex min-h-10 items-center gap-2 rounded-md px-4 text-sm font-semibold",
                isPending || isClaimed
                  ? "border border-border bg-white text-muted-foreground"
                  : "bg-primary text-primary-foreground"
              )}
              href={claimHref}
            >
              {isPending || isClaimed ? <ShieldCheck size={16} /> : <BedDouble size={16} />}
              {isClaimed ? "View managed profile" : isPending ? "View claim status" : "Claim this profile"}
              <ArrowRight size={16} />
            </Link>
            <p className="text-xs leading-5 text-muted-foreground">
              {isClaimed
                ? "This profile is already managed. Ask the organization admin to invite you."
                : "Claims are reviewed by a system admin before management access is granted."}
            </p>
          </div>
        </div>
      </div>
    </article>
  );
}
