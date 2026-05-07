import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { Prisma, ProfileType } from "@prisma/client";
import { Heart, MapPin } from "lucide-react";
import { ApproximateLocationMap } from "@/components/public/approximate-location-map";
import { PublicSearchHeader } from "@/components/public/public-search-header";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button-link";
import { Card } from "@/components/ui/card";
import { prisma } from "@/lib/prisma";
import { richTextToPlainText } from "@/lib/rich-text";
import { amenityOptions, matOptions, populationOptions, specialtyPopulationOptions } from "@/lib/sober-living-onboarding";

export const dynamic = "force-dynamic";

const stateAliases: Record<string, string> = {
  alabama: "AL",
  alaska: "AK",
  arizona: "AZ",
  arkansas: "AR",
  california: "CA",
  colorado: "CO",
  connecticut: "CT",
  delaware: "DE",
  florida: "FL",
  georgia: "GA",
  hawaii: "HI",
  idaho: "ID",
  illinois: "IL",
  indiana: "IN",
  iowa: "IA",
  kansas: "KS",
  kentucky: "KY",
  louisiana: "LA",
  maine: "ME",
  maryland: "MD",
  massachusetts: "MA",
  michigan: "MI",
  minnesota: "MN",
  mississippi: "MS",
  missouri: "MO",
  montana: "MT",
  nebraska: "NE",
  nevada: "NV",
  "new hampshire": "NH",
  "new jersey": "NJ",
  "new mexico": "NM",
  "new york": "NY",
  "north carolina": "NC",
  "north dakota": "ND",
  ohio: "OH",
  oklahoma: "OK",
  oregon: "OR",
  pennsylvania: "PA",
  "rhode island": "RI",
  "south carolina": "SC",
  "south dakota": "SD",
  tennessee: "TN",
  texas: "TX",
  utah: "UT",
  vermont: "VT",
  virginia: "VA",
  washington: "WA",
  "west virginia": "WV",
  wisconsin: "WI",
  wyoming: "WY"
};

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

function compactItems(values: Array<string | null | undefined>, limit: number) {
  const items = Array.from(new Set(values.filter((value): value is string => Boolean(value))));
  const visible = items.slice(0, limit);
  const hiddenCount = Math.max(items.length - visible.length, 0);

  return { visible, hiddenCount };
}

function formatPricePerWeek(value: number | null) {
  if (!value) {
    return "Price not listed";
  }

  return `$${value}/week`;
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

function stateSearchTerms(rawState: string) {
  const cleaned = rawState.trim();

  if (!cleaned) {
    return [];
  }

  const alias = stateAliases[cleaned.toLowerCase()];
  const terms = new Set([cleaned, cleaned.toUpperCase()]);

  if (alias) {
    terms.add(alias);
  }

  return Array.from(terms);
}

function locationSearchFilters(q: string): Prisma.AftercareProfileWhereInput[] {
  const normalized = q.replace(/\s+/g, " ").trim();

  if (!normalized) {
    return [];
  }

  const commaParts = normalized.split(",").map((part) => part.trim()).filter(Boolean);

  if (commaParts.length >= 2) {
    const city = commaParts[0];
    const stateTerms = stateSearchTerms(commaParts.slice(1).join(" "));

    if (city && stateTerms.length) {
      return [
        {
          AND: [
            { publicCity: { contains: city, mode: Prisma.QueryMode.insensitive } },
            {
              OR: stateTerms.map((state) => ({
                publicState: { contains: state, mode: Prisma.QueryMode.insensitive }
              }))
            }
          ]
        }
      ];
    }
  }

  const spaceParts = normalized.split(" ");
  const possibleState = spaceParts.at(-1) || "";

  if (/^[a-z]{2}$/i.test(possibleState) && spaceParts.length > 1) {
    const city = spaceParts.slice(0, -1).join(" ");
    const stateTerms = stateSearchTerms(possibleState);

    return [
      {
        AND: [
          { publicCity: { contains: city, mode: Prisma.QueryMode.insensitive } },
          {
            OR: stateTerms.map((state) => ({
              publicState: { contains: state, mode: Prisma.QueryMode.insensitive }
            }))
          }
        ]
      }
    ];
  }

  return [];
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
        { description: { contains: q, mode: Prisma.QueryMode.insensitive } },
        ...locationSearchFilters(q)
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
      latitude: true,
      longitude: true,
      description: true,
      totalBeds: true,
      bedsAvailable: true,
      acceptingNewPatients: true,
      populationServedOptions: true,
      specialtyPopulations: true,
      averageLengthOfStay: true,
      pricePerWeek: true,
      programTypes: true,
      levelsOfCare: true,
      amenities: true,
      certificationsHeld: true,
      supportServices: true,
      insuranceAccepted: true,
      matAccepted: true,
      roomTypes: true
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

      <div className="grid gap-5 py-6 lg:grid-cols-[minmax(0,1fr)_380px] lg:items-start">
        <div className="grid gap-4">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-semibold">{profiles.length} listings</p>
            <p className="text-xs text-muted-foreground">Reviews and rating sort are intentionally excluded from v1.</p>
          </div>
          {profiles.length ? (
            profiles.map((profile, index) => {
              const offerings = compactItems(
                [
                  typeLabel(profile.type),
                  ...profile.programTypes,
                  ...profile.levelsOfCare,
                  ...profile.populationServedOptions,
                  ...profile.specialtyPopulations,
                  ...profile.matAccepted,
                  ...profile.insuranceAccepted,
                  ...profile.certificationsHeld
                ],
                4
              );
              const amenitySummary = compactItems(
                [
                  ...profile.amenities,
                  ...profile.supportServices,
                  ...profile.roomTypes.map((roomType) => `${roomType} rooms`)
                ],
                3
              );

              return (
                <Card key={profile.id} className="overflow-hidden p-0">
                  <Link className="focus-ring grid gap-0 md:grid-cols-[190px_1fr]" href={`/profiles/${profile.slug}`}>
                    <div className="relative min-h-40 bg-muted md:min-h-0">
                      <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(20,184,166,0.18),rgba(30,64,175,0.12)),linear-gradient(90deg,rgba(15,23,42,0.08)_1px,transparent_1px),linear-gradient(rgba(15,23,42,0.08)_1px,transparent_1px)] bg-[size:100%_100%,34px_34px,34px_34px]" />
                      <div className="absolute left-3 top-3 rounded-full bg-white/90 px-2 py-1 text-xs font-semibold">
                        {index + 1}
                      </div>
                    </div>

                    <div className="grid gap-3 p-4">
                      <div className="flex flex-wrap items-start gap-2 md:flex-nowrap md:items-center">
                        <h2 className="min-w-0 flex-1 text-lg font-semibold leading-tight">{profile.programName}</h2>
                        <Badge tone={profile.verificationTier > 1 ? "verified" : "neutral"}>
                          {profile.verificationTier > 1 ? "Verified" : "Self-reported"}
                        </Badge>
                        <Badge tone={profile.bedsAvailable || profile.acceptingNewPatients ? "success" : "warning"}>
                          {availabilityText(profile)}
                        </Badge>
                        <span
                          aria-label="Save listing"
                          className="focus-ring flex size-9 shrink-0 items-center justify-center rounded-md border border-border bg-white"
                        >
                          <Heart size={18} />
                        </span>
                      </div>

                      <p className="flex items-center gap-2 text-sm text-muted-foreground">
                        <MapPin size={16} />
                        {[profile.publicCity, profile.publicState].filter(Boolean).join(", ") || "Location not listed"}
                      </p>

                      <div className="flex flex-wrap gap-2">
                        {offerings.visible.map((item) => (
                          <Badge key={item}>{item}</Badge>
                        ))}
                        {offerings.hiddenCount ? <Badge>+{offerings.hiddenCount} more</Badge> : null}
                      </div>

                      <p className="line-clamp-2 text-sm leading-6 text-muted-foreground">
                        {richTextToPlainText(profile.description) || "No description added yet."}
                      </p>

                      <div className="flex flex-col justify-between gap-3 border-t border-border pt-3 md:flex-row md:items-end">
                        <div>
                          {amenitySummary.visible.length ? (
                            <div className="flex flex-wrap gap-2">
                              {amenitySummary.visible.map((item) => (
                                <span key={item} className="inline-flex items-center gap-1 text-sm">
                                  <span className="size-2 rounded-full border border-foreground" />
                                  {item}
                                </span>
                              ))}
                              {amenitySummary.hiddenCount ? (
                                <span className="text-sm text-muted-foreground">+{amenitySummary.hiddenCount} more</span>
                              ) : null}
                            </div>
                          ) : (
                            <p className="mt-2 text-sm text-muted-foreground">Amenities not listed</p>
                          )}
                        </div>

                        <div className="grid shrink-0 gap-2 md:justify-items-end">
                          <p className="text-base font-semibold">{formatPricePerWeek(profile.pricePerWeek)}</p>
                        </div>
                      </div>
                    </div>
                  </Link>
                </Card>
              );
            })
          ) : (
            <Card>
              <h2 className="text-xl font-semibold">No matching listings yet</h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Try a broader search or check back as more providers publish profiles.
              </p>
            </Card>
          )}
        </div>
        <ApproximateLocationMap
          listings={profiles.map((profile) => ({
            id: profile.id,
            slug: profile.slug,
            programName: profile.programName,
            type: profile.type,
            publicCity: profile.publicCity,
            publicState: profile.publicState,
            latitude: profile.latitude ? Number(profile.latitude) : null,
            longitude: profile.longitude ? Number(profile.longitude) : null,
            isAvailable: Boolean(profile.bedsAvailable || profile.acceptingNewPatients)
          }))}
        />
      </div>
      </main>
    </>
  );
}
