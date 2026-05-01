import { Prisma } from "@prisma/client";
import { MapPin, Search, SlidersHorizontal } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button-link";
import { Card } from "@/components/ui/card";
import { prisma } from "@/lib/prisma";
import { populationOptions } from "@/lib/sober-living-onboarding";

export const dynamic = "force-dynamic";

function availabilityText(profile: {
  type: string;
  totalBeds: number | null;
  bedsAvailable: number | null;
  acceptingNewPatients: boolean | null;
}) {
  if (profile.type === "sober_living") {
    return `${profile.bedsAvailable ?? 0} beds available`;
  }

  return profile.acceptingNewPatients ? "Accepting new patients" : "Not accepting patients";
}

function typeLabel(type: string) {
  return type === "sober_living" ? "Sober Living" : "Continued Care";
}

function selected(value: string | undefined, option: string) {
  return value === option;
}

export default async function SearchPage({
  searchParams
}: {
  searchParams: Promise<{
    q?: string;
    type?: string;
    population?: string;
    availability?: string;
  }>;
}) {
  const query = await searchParams;
  const q = query.q?.trim() || "";
  const type = query.type === "sober_living" || query.type === "continued_care" ? query.type : "";
  const population = populationOptions.includes(query.population as never) ? query.population : "";
  const availability = query.availability === "available" ? "available" : "";

  const where: Prisma.AftercareProfileWhereInput = {
    status: "published",
    ...(type ? { type } : {}),
    ...(population ? { populationServedOptions: { has: population } } : {}),
    ...(availability
      ? {
          OR: [
            { type: "sober_living", bedsAvailable: { gt: 0 } },
            { type: "continued_care", acceptingNewPatients: true }
          ]
        }
      : {}),
    ...(q
      ? {
          OR: [
            { programName: { contains: q, mode: "insensitive" } },
            { publicCity: { contains: q, mode: "insensitive" } },
            { publicState: { contains: q, mode: "insensitive" } },
            { description: { contains: q, mode: "insensitive" } }
          ]
        }
      : {})
  };

  const profiles = await prisma.aftercareProfile.findMany({
    where,
    orderBy: [{ verificationTier: "desc" }, { updatedAt: "desc" }],
    take: 50,
    select: {
      id: true,
      slug: true,
      programName: true,
      type: true,
      verificationTier: true,
      publicCity: true,
      publicState: true,
      description: true,
      totalBeds: true,
      bedsAvailable: true,
      acceptingNewPatients: true,
      populationServedOptions: true,
      certificationsHeld: true,
      supportServices: true,
      insuranceAccepted: true
    }
  });

  return (
    <main className="shell py-8">
      <div className="flex flex-col justify-between gap-4 border-b border-border pb-6 md:flex-row md:items-end">
        <div>
          <Badge tone="warning">No exact addresses shown</Badge>
          <h1 className="mt-3 text-3xl font-semibold">Search aftercare programs</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
            Find sober living homes and continued care programs. Public listings show city and state only.
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
          <form className="mt-4 grid gap-4" action="/search">
            <label className="grid gap-2 text-sm font-medium">
              Search
              <div className="flex items-center rounded-md border border-border bg-white px-3">
                <Search className="text-muted-foreground" size={16} />
                <input
                  className="min-h-10 flex-1 bg-transparent px-2 text-sm outline-none"
                  defaultValue={q}
                  name="q"
                  placeholder="City, state, or name"
                />
              </div>
            </label>
            <label className="grid gap-2 text-sm font-medium">
              Program type
              <select className="min-h-10 rounded-md border border-border bg-white px-3 text-sm" defaultValue={type} name="type">
                <option value="">Any</option>
                <option value="sober_living">Sober Living</option>
                <option value="continued_care">Continued Care</option>
              </select>
            </label>
            <label className="grid gap-2 text-sm font-medium">
              Population served
              <select
                className="min-h-10 rounded-md border border-border bg-white px-3 text-sm"
                defaultValue={population}
                name="population"
              >
                <option value="">Any</option>
                {populationOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex items-center gap-2 text-sm font-medium">
              <input defaultChecked={selected(availability, "available")} name="availability" type="checkbox" value="available" />
              Available now
            </label>
            <button className="focus-ring min-h-10 rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground">
              Apply filters
            </button>
          </form>
        </Card>

        <div className="grid gap-4">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-semibold">{profiles.length} listings</p>
            <p className="text-xs text-muted-foreground">Reviews and rating sort are intentionally excluded from v1.</p>
          </div>
          {profiles.length ? (
            profiles.map((profile) => (
              <Card key={profile.id}>
                <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge tone={profile.verificationTier > 1 ? "verified" : "neutral"}>
                        {profile.verificationTier > 1 ? "Verified" : "Self-reported"}
                      </Badge>
                      <Badge>{typeLabel(profile.type)}</Badge>
                      <Badge tone={profile.bedsAvailable || profile.acceptingNewPatients ? "success" : "warning"}>
                        {availabilityText(profile)}
                      </Badge>
                    </div>
                    <h2 className="mt-3 text-xl font-semibold">{profile.programName}</h2>
                    <p className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
                      <MapPin size={16} />
                      {[profile.publicCity, profile.publicState].filter(Boolean).join(", ") || "Location not listed"}
                    </p>
                    <p className="mt-3 line-clamp-2 max-w-3xl text-sm leading-6 text-muted-foreground">
                      {profile.description || "No description added yet."}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {profile.populationServedOptions.slice(0, 3).map((item) => (
                        <Badge key={item}>{item}</Badge>
                      ))}
                      {profile.certificationsHeld.slice(0, 2).map((item) => (
                        <Badge key={item} tone="verified">{item}</Badge>
                      ))}
                    </div>
                  </div>
                  <div className="flex flex-col gap-3 md:items-end">
                    <ButtonLink href={`/profiles/${profile.slug}`} variant="secondary">
                      View profile
                    </ButtonLink>
                  </div>
                </div>
              </Card>
            ))
          ) : (
            <Card>
              <h2 className="text-xl font-semibold">No matching listings yet</h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Try a broader search or check back as more providers publish profiles.
              </p>
            </Card>
          )}
        </div>
      </div>
    </main>
  );
}
