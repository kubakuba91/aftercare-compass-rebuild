import { auth } from "@clerk/nextjs/server";
import { Prisma, ProfileType } from "@prisma/client";
import { MapPin } from "lucide-react";
import { PublicSearchHeader } from "@/components/public/public-search-header";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button-link";
import { Card } from "@/components/ui/card";
import { prisma } from "@/lib/prisma";
import { amenityOptions, matOptions, populationOptions, specialtyPopulationOptions } from "@/lib/sober-living-onboarding";

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

function valuesFromQuery(value: string | string[] | undefined) {
  if (!value) {
    return [];
  }

  return Array.isArray(value) ? value.filter(Boolean) : [value].filter(Boolean);
}

function firstFromQuery(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function numberFromQuery(value: string | string[] | undefined) {
  const raw = firstFromQuery(value);

  if (!raw) {
    return undefined;
  }

  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : undefined;
}

export default async function SearchPage({
  searchParams
}: {
  searchParams: Promise<{
    q?: string | string[];
    type?: string | string[];
    population?: string | string[];
    specialty?: string | string[];
    minPrice?: string | string[];
    maxPrice?: string | string[];
    duration?: string | string[];
    amenity?: string | string[];
    mat?: string | string[];
    verified?: string | string[];
    availability?: string | string[];
    filters?: string | string[];
  }>;
}) {
  const [query, session] = await Promise.all([searchParams, auth()]);
  const isSignedIn = Boolean(session.userId);
  const q = firstFromQuery(query.q)?.trim() || "";
  const rawType = firstFromQuery(query.type);
  const type = rawType === "sober_living" || rawType === "continued_care" ? rawType : "";
  const population = valuesFromQuery(query.population).filter((value) =>
    populationOptions.includes(value as never)
  );
  const specialty = valuesFromQuery(query.specialty).filter((value) =>
    specialtyPopulationOptions.includes(value as never)
  );
  const minPrice = numberFromQuery(query.minPrice);
  const maxPrice = numberFromQuery(query.maxPrice);
  const duration = firstFromQuery(query.duration) || "";
  const amenities = valuesFromQuery(query.amenity).filter((value) =>
    amenityOptions.includes(value as never)
  );
  const mat = valuesFromQuery(query.mat).filter((value) => matOptions.includes(value as never));
  const verified = firstFromQuery(query.verified) === "yes";
  const availability = firstFromQuery(query.availability) === "available" ? "available" : "";
  const showFilters = firstFromQuery(query.filters) === "1";
  const filterParams = new URLSearchParams();

  for (const [key, value] of Object.entries(query)) {
    if (key === "filters") {
      continue;
    }

    for (const item of valuesFromQuery(value)) {
      filterParams.append(key, item);
    }
  }

  filterParams.set("filters", showFilters ? "0" : "1");

  const andFilters: Prisma.AftercareProfileWhereInput[] = [{ status: "published" }];

  if (type) {
    andFilters.push({ type: type as ProfileType });
  }

  if (population.length) {
    andFilters.push({ populationServedOptions: { hasSome: population } });
  }

  if (specialty.length) {
    andFilters.push({ specialtyPopulations: { hasSome: specialty } });
  }

  if (duration) {
    andFilters.push({ averageLengthOfStay: duration });
  }

  if (amenities.length) {
    andFilters.push({ amenities: { hasSome: amenities } });
  }

  if (mat.length) {
    andFilters.push({ matAccepted: { hasSome: mat } });
  }

  if (verified) {
    andFilters.push({ verificationTier: { gt: 1 } });
  }

  if (minPrice !== undefined || maxPrice !== undefined) {
    andFilters.push({
      pricePerWeek: {
        ...(minPrice !== undefined ? { gte: minPrice } : {}),
        ...(maxPrice !== undefined ? { lte: maxPrice } : {})
      }
    });
  }

  if (availability) {
    andFilters.push({
      OR: [
        { type: ProfileType.sober_living, bedsAvailable: { gt: 0 } },
        { type: ProfileType.continued_care, acceptingNewPatients: true }
      ]
    });
  }

  if (q) {
    andFilters.push({
      OR: [
        { programName: { contains: q, mode: Prisma.QueryMode.insensitive } },
        { publicCity: { contains: q, mode: Prisma.QueryMode.insensitive } },
        { publicState: { contains: q, mode: Prisma.QueryMode.insensitive } },
        { description: { contains: q, mode: Prisma.QueryMode.insensitive } }
      ]
    });
  }

  const where: Prisma.AftercareProfileWhereInput = {
    AND: andFilters
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
      specialtyPopulations: true,
      averageLengthOfStay: true,
      pricePerWeek: true,
      amenities: true,
      certificationsHeld: true,
      supportServices: true,
      insuranceAccepted: true
    }
  });

  return (
    <>
      <PublicSearchHeader
        amenities={amenities}
        clearHref="/search"
        defaultAvailability={availability}
        defaultLocation={q}
        defaultType={type}
        duration={duration}
        filtersHref={`/search?${filterParams.toString()}`}
        mat={mat}
        maxPrice={maxPrice}
        minPrice={minPrice}
        population={population}
        showFilters={showFilters}
        specialty={specialty}
        verified={verified}
      />
      <main className="shell py-8">
        <div className="flex flex-col justify-between gap-4 border-b border-border pb-6 md:flex-row md:items-end">
          <div>
            <Badge tone="warning">No exact addresses shown</Badge>
            <h1 className="mt-3 text-3xl font-semibold">Search aftercare programs</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
              Find sober living homes and continued care programs. Public listings show city and state only.
            </p>
          </div>
          {!isSignedIn ? (
            <ButtonLink href="/onboarding/account-type" variant="secondary">
              Join marketplace
            </ButtonLink>
          ) : null}
        </div>

      <div className="grid gap-5 py-6">
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
    </>
  );
}
