import { MapPin, SlidersHorizontal } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button-link";
import { Card } from "@/components/ui/card";

const sampleProfiles = [
  {
    name: "Harbor House Recovery",
    type: "Sober Living",
    location: "Philadelphia, PA",
    availability: "4 beds available",
    verification: "Self-reported"
  },
  {
    name: "Compass IOP Center",
    type: "Continued Care",
    location: "Pittsburgh, PA",
    availability: "Accepting new patients",
    verification: "Verified"
  }
];

export default function SearchPage() {
  return (
    <main className="shell py-8">
      <div className="flex flex-col justify-between gap-4 border-b border-border pb-6 md:flex-row md:items-end">
        <div>
          <Badge tone="warning">No exact addresses shown</Badge>
          <h1 className="mt-3 text-3xl font-semibold">Search aftercare programs</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
            Phase 1 search supports city, state, zip, filters, and availability. Rating-based sorting is
            intentionally excluded from v1.
          </p>
        </div>
        <ButtonLink href="/onboarding/account-type" variant="secondary">
          Join marketplace
        </ButtonLink>
      </div>

      <div className="grid gap-5 py-6 lg:grid-cols-[280px_1fr]">
        <Card className="h-fit">
          <div className="flex items-center gap-2">
            <SlidersHorizontal size={18} />
            <h2 className="font-semibold">Filters</h2>
          </div>
          <div className="mt-4 grid gap-3 text-sm text-muted-foreground">
            <span>Program type</span>
            <span>Population served</span>
            <span>Insurance accepted</span>
            <span>MAT-friendly</span>
            <span>Verification tier</span>
            <span>Availability</span>
          </div>
        </Card>

        <div className="grid gap-4">
          {sampleProfiles.map((profile) => (
            <Card key={profile.name}>
              <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge tone={profile.verification === "Verified" ? "verified" : "neutral"}>
                      {profile.verification}
                    </Badge>
                    <Badge>{profile.type}</Badge>
                  </div>
                  <h2 className="mt-3 text-xl font-semibold">{profile.name}</h2>
                  <p className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
                    <MapPin size={16} />
                    {profile.location}
                  </p>
                </div>
                <div className="flex flex-col gap-3 md:items-end">
                  <Badge tone="success">{profile.availability}</Badge>
                  <ButtonLink href="/profiles/sample" variant="secondary">
                    View profile
                  </ButtonLink>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </main>
  );
}

