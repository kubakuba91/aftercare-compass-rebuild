import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { Prisma, ProfileOwnershipStatus, ProfileType, Role, SubscriptionStatus } from "@prisma/client";
import { MapPin } from "lucide-react";
import { ApproximateLocationMap } from "@/components/public/approximate-location-map";
import { FavoriteListingButton } from "@/components/public/favorite-listing-button";
import { AdaptiveProfileImage } from "@/components/public/adaptive-profile-image";
import { LoadMoreListings } from "@/components/public/load-more-listings";
import { ProfileOwnershipBadge } from "@/components/public/profile-ownership-badge";
import { PublicSearchHeader } from "@/components/public/public-search-header";
import { TrustBadge } from "@/components/public/trust-badge";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { hasValidClerkRuntimeConfig } from "@/lib/clerk-config";
import { canDisplayVerifiedBadge, canUseLiveAvailability } from "@/lib/feature-gates";
import { geocodeSearchQuery } from "@/lib/geocoding";
import { getActiveProfileOptionValues } from "@/lib/profile-options";
import { getSearchFilterSettings } from "@/lib/search-filter-settings";
import { prisma } from "@/lib/prisma";
import { approximatePublicPoint, milesBetween, searchCenterFromQuery } from "@/lib/public-location";
import { profilePlaceholderAlt, profilePlaceholderImage } from "@/lib/public-profile-placeholder";
import { richTextToPlainText } from "@/lib/rich-text";
import { continuedCareDurationOptions } from "@/lib/continued-care-onboarding";
import { averageLengthOptions } from "@/lib/sober-living-onboarding";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

const SEARCH_PAGE_SIZE = 50;

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
  bedsAvailable: number | null;
  acceptingNewPatients: boolean | null;
}, canShowLiveAvailability = true) {
  if (profile.type === "sober_living") {
    return canShowLiveAvailability && profile.bedsAvailable && profile.bedsAvailable > 0
      ? "Available now"
      : "Call for availability";
  }

  return profile.acceptingNewPatients ? "Accepting patients" : "Call for availability";
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

function formatMoveInCost(value: string | null) {
  const text = value?.trim();

  if (!text) {
    return null;
  }

  const amount = text.match(/\d[\d,]*/)?.[0];

  return amount ? `$${amount} Move-in fee` : `${text} Move-in fee`;
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
    radius?: string | string[];
    duration?: string | string[];
    amenity?: string | string[];
    mat?: string | string[];
    levelOfCare?: string | string[];
    clinicalFocus?: string | string[];
    insurance?: string | string[];
    verified?: string | string[];
    availability?: string | string[];
    filters?: string | string[];
    selected?: string | string[];
    page?: string | string[];
  }>;
}) {
  const [query, session] = await Promise.all([
    searchParams,
    hasValidClerkRuntimeConfig() ? auth() : Promise.resolve({ userId: null })
  ]);
  const appUser = session.userId
    ? await prisma.user.findUnique({
        where: { clerkUserId: session.userId },
        select: {
          id: true,
          orgId: true,
          role: true,
          favorites: {
            select: { profileId: true }
          }
        }
      })
    : null;
  const isSignedIn = Boolean(session.userId);
  const canFavorite =
    appUser?.role === Role.referent_admin || appUser?.role === Role.referent_manager;
  const favoriteProfileIds = new Set(appUser?.favorites.map((favorite) => favorite.profileId) ?? []);
  const q = firstFromQuery(query.q)?.trim() || "";
  const rawType = firstFromQuery(query.type);
  const type = rawType === "continued_care" ? "continued_care" : "sober_living";
  const [profileOptions, searchFilterSettings] = await Promise.all([
    getActiveProfileOptionValues(type),
    getSearchFilterSettings({ includeInactive: false, profileType: type })
  ]);
  const searchFilterByKey = new Map(searchFilterSettings.map((setting) => [setting.key, setting]));
  const populationSetting = searchFilterByKey.get("population");
  const selectedPopulations = valuesFromQuery(query.population).filter((value) =>
    profileOptions.populationServed.includes(value)
  );
  const population = populationSetting
    ? populationSetting.selectionMode === "multiple" ? selectedPopulations : selectedPopulations.slice(0, 1)
    : [];
  const specialty = valuesFromQuery(query.specialty).filter((value) =>
    profileOptions.specialtyPopulations.includes(value)
  );
  const priceFilterEnabled = searchFilterByKey.has("price") && type === "sober_living";
  const minPrice = priceFilterEnabled ? numberFromQuery(query.minPrice) : undefined;
  const maxPrice = priceFilterEnabled ? numberFromQuery(query.maxPrice) : undefined;
  const requestedRadiusMiles = numberFromQuery(query.radius);
  const radiusMiles = searchFilterByKey.has("distance") && requestedRadiusMiles !== undefined && requestedRadiusMiles > 0
    ? requestedRadiusMiles
    : undefined;
  const durationOptions = type === "continued_care" ? continuedCareDurationOptions : averageLengthOptions;
  const durationSetting = searchFilterByKey.get("duration");
  const requestedDurations = valuesFromQuery(query.duration).filter((value) =>
    durationOptions.some((option) => option === value)
  );
  const durations = durationSetting
    ? durationSetting.selectionMode === "multiple" ? requestedDurations : requestedDurations.slice(0, 1)
    : [];
  const amenities = type === "sober_living" ? valuesFromQuery(query.amenity).filter((value) =>
    profileOptions.amenities.includes(value)
  ) : [];
  const mat = valuesFromQuery(query.mat).filter((value) => profileOptions.matAccepted.includes(value));
  const levelsOfCare = type === "continued_care" ? valuesFromQuery(query.levelOfCare).filter((value) =>
    profileOptions.levelsOfCare.includes(value)
  ) : [];
  const clinicalFocus = type === "continued_care" ? valuesFromQuery(query.clinicalFocus).filter((value) =>
    profileOptions.clinicalFocus.includes(value)
  ) : [];
  const insurance = type === "continued_care" ? valuesFromQuery(query.insurance).filter((value) =>
    profileOptions.insuranceAccepted.includes(value)
  ) : [];
  const verified = firstFromQuery(query.verified) === "yes";
  const availability = firstFromQuery(query.availability) === "available" ? "available" : "";
  const showFilters = firstFromQuery(query.filters) === "1";
  const selectedListingId = firstFromQuery(query.selected);
  const requestedPage = numberFromQuery(query.page);
  const page = requestedPage && requestedPage > 0 ? Math.floor(requestedPage) : 1;
  const resultLimit = page * SEARCH_PAGE_SIZE;
  const radiusCenter = radiusMiles ? searchCenterFromQuery(q) ?? await geocodeSearchQuery(q) : null;

  function selectedListingHref(profileId: string) {
    const params = new URLSearchParams();

    for (const [key, value] of Object.entries(query)) {
      if (key === "selected") {
        continue;
      }

      for (const item of valuesFromQuery(value)) {
        params.append(key, item);
      }
    }

    params.set("selected", profileId);

    return `/search?${params.toString()}#listing-${profileId}`;
  }

  function pageHref(nextPage: number) {
    const params = new URLSearchParams();

    for (const [key, value] of Object.entries(query)) {
      if (key === "page") {
        continue;
      }

      for (const item of valuesFromQuery(value)) {
        params.append(key, item);
      }
    }

    params.set("page", nextPage.toString());
    return `/search?${params.toString()}`;
  }

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

  if (durations.length) {
    andFilters.push({ averageLengthOfStay: { in: durations } });
  }

  if (amenities.length) {
    andFilters.push({ amenities: { hasSome: amenities } });
  }

  if (mat.length) {
    andFilters.push({ matAccepted: { hasSome: mat } });
  }

  if (levelsOfCare.length) {
    andFilters.push({ levelsOfCare: { hasSome: levelsOfCare } });
  }

  if (clinicalFocus.length) {
    andFilters.push({ clinicalFocus: { hasSome: clinicalFocus } });
  }

  if (insurance.length) {
    andFilters.push({ insuranceAccepted: { hasSome: insurance } });
  }

  if (verified) {
    andFilters.push({
      verificationTier: { gt: 1 },
      ownershipStatus: ProfileOwnershipStatus.claimed,
      organization: {
        subscriptionPlan: { in: ["verified", "network"] },
        subscriptionStatus: { in: [SubscriptionStatus.active, SubscriptionStatus.trialing] }
      }
    });
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

  // Once a radius has a geographic center, the distance check is the location
  // filter. Keeping the text-location predicate here would exclude valid nearby
  // listings in neighboring cities before their distance can be calculated.
  if (q && !radiusCenter) {
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

  const profileQuery = {
    where,
    orderBy: [{ verificationTier: "desc" }, { updatedAt: "desc" }, { id: "asc" }],
    ...(radiusCenter ? {} : { take: resultLimit }),
    select: {
      id: true,
      slug: true,
      programName: true,
      type: true,
      verificationTier: true,
      ownershipStatus: true,
      publicCity: true,
      publicState: true,
      latitude: true,
      longitude: true,
      publicLatitude: true,
      publicLongitude: true,
      description: true,
      totalBeds: true,
      bedsAvailable: true,
      acceptingNewPatients: true,
      populationServedOptions: true,
      specialtyPopulations: true,
      averageLengthOfStay: true,
      pricePerWeek: true,
      moveInCost: true,
      levelsOfCare: true,
      amenities: true,
      certificationsHeld: true,
      accreditations: true,
      clinicalFocus: true,
      recoverySupportServices: true,
      supportServices: true,
      insuranceAccepted: true,
      matAccepted: true,
      roomTypes: true,
      organization: {
        select: {
          type: true,
          subscriptionPlan: true,
          subscriptionStatus: true
        }
      },
      images: {
        orderBy: [{ isCover: "desc" }, { sortOrder: "asc" }, { createdAt: "asc" }],
        take: 1,
        select: {
          id: true,
          url: true,
          altText: true,
          focalX: true,
          focalY: true,
          presentationMode: true
        }
      }
    }
  } satisfies Prisma.AftercareProfileFindManyArgs;
  const [rawProfiles, databaseTotal] = await Promise.all([
    prisma.aftercareProfile.findMany(profileQuery),
    radiusCenter ? Promise.resolve(null) : prisma.aftercareProfile.count({ where })
  ]);
  const radiusMatches = radiusMiles && radiusCenter
    ? rawProfiles
        .map((profile) => {
          const point = approximatePublicPoint({
            id: profile.id,
            publicCity: profile.publicCity,
            publicState: profile.publicState,
            latitude: profile.latitude ? Number(profile.latitude) : null,
            longitude: profile.longitude ? Number(profile.longitude) : null,
            publicLatitude: profile.publicLatitude ? Number(profile.publicLatitude) : null,
            publicLongitude: profile.publicLongitude ? Number(profile.publicLongitude) : null
          });

          return {
            distanceMiles: point ? milesBetween(radiusCenter, point) : Number.POSITIVE_INFINITY,
            profile
          };
        })
        .filter((item) => item.distanceMiles <= radiusMiles)
        .sort((first, second) => first.distanceMiles - second.distanceMiles)
        .map((item) => item.profile)
    : null;
  const totalListings = radiusMiles ? radiusMatches?.length ?? 0 : databaseTotal ?? rawProfiles.length;
  const profiles = radiusMiles ? radiusMatches?.slice(0, resultLimit) ?? [] : rawProfiles;
  const hasMoreListings = profiles.length < totalListings;

  return (
    <>
      <PublicSearchHeader
        amenities={amenities}
        amenityOptions={profileOptions.amenities}
        clearHref={`/search?type=${type}`}
        defaultAvailability={availability}
        defaultLocation={q}
        defaultType={type}
        duration={durations}
        isSignedIn={isSignedIn}
        insurance={insurance}
        insuranceOptions={profileOptions.insuranceAccepted}
        clinicalFocus={clinicalFocus}
        clinicalFocusOptions={profileOptions.clinicalFocus}
        levelsOfCare={levelsOfCare}
        levelOfCareOptions={profileOptions.levelsOfCare}
        mat={mat}
        matOptions={profileOptions.matAccepted}
        maxPrice={maxPrice}
        minPrice={minPrice}
        population={population}
        populationOptions={profileOptions.populationServed}
        radiusMiles={radiusMiles}
        searchFilterSettings={searchFilterSettings}
        showFilters={showFilters}
        specialty={specialty}
        specialtyOptions={profileOptions.specialtyPopulations}
        verified={verified}
      />
      <main className="shell py-8">
        <div className="flex flex-col justify-between gap-4 border-b border-border pb-6 md:flex-row md:items-end">
          <div>
            <h1 className="mt-3 text-3xl font-semibold">Search aftercare programs</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
              Find sober living homes and continued care programs.
            </p>
          </div>
        </div>

      <div className="grid gap-5 py-6 lg:grid-cols-[minmax(0,2fr)_minmax(360px,1fr)] lg:items-start">
        <div className="grid gap-4">
          {radiusMiles && !radiusCenter ? (
            <Card className="border-amber-200 bg-amber-50">
              <h2 className="font-semibold text-amber-950">We couldn&apos;t locate that search area</h2>
              <p className="mt-1 text-sm leading-6 text-amber-900">
                Enter a city and state, then try the {radiusMiles}-mile distance filter again.
              </p>
            </Card>
          ) : null}
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-semibold">{totalListings} listings</p>
          </div>
          {profiles.length ? (
            profiles.map((profile, index) => {
              const offerings = compactItems(
                [
                  ...profile.levelsOfCare,
                  ...profile.populationServedOptions,
                  ...profile.specialtyPopulations,
                  ...profile.matAccepted,
                  ...profile.insuranceAccepted,
                  ...profile.certificationsHeld,
                  ...(profile.type === ProfileType.sober_living ? [] : profile.accreditations),
                  ...(profile.type === ProfileType.sober_living ? profile.recoverySupportServices : profile.clinicalFocus)
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
              const showVerifiedBadge = canDisplayVerifiedBadge(profile.organization, profile);
              const showLiveAvailability =
                profile.type !== ProfileType.sober_living || canUseLiveAvailability(profile.organization, profile);
              const profileIsAvailable =
                profile.type === ProfileType.sober_living
                  ? showLiveAvailability && Boolean(profile.bedsAvailable)
                  : Boolean(profile.acceptingNewPatients);

              return (
                <div key={profile.id} className="scroll-mt-24" id={`listing-${profile.id}`}>
                <Card
                  className={cn(
                    "relative overflow-hidden p-0 transition-shadow",
                    selectedListingId === profile.id ? "ring-2 ring-primary ring-offset-2" : null
                  )}
                >
                  <div className="absolute right-4 top-4 z-10">
                    <FavoriteListingButton
                      canFavorite={canFavorite}
                      initialFavorited={favoriteProfileIds.has(profile.id)}
                      isSignedIn={isSignedIn}
                      profileId={profile.id}
                      programName={profile.programName}
                    />
                  </div>
                  <Link className="focus-ring grid gap-0 md:grid-cols-[190px_1fr]" href={`/profiles/${profile.slug}`}>
                    <div className="relative min-h-40 bg-muted md:min-h-0">
                      {profile.images[0] ? (
                        <AdaptiveProfileImage
                          alt={profile.images[0].altText || profile.programName}
                          focalX={profile.images[0].focalX}
                          focalY={profile.images[0].focalY}
                          mode={profile.images[0].presentationMode}
                          sizes="190px"
                          src={profile.images[0].url}
                        />
                      ) : (
                        <AdaptiveProfileImage
                          alt={profilePlaceholderAlt(profile.type)}
                          sizes="190px"
                          src={profilePlaceholderImage(profile.type)}
                        />
                      )}
                      <div className="absolute left-3 top-3 rounded-full bg-white/90 px-2 py-1 text-xs font-semibold">
                        {index + 1}
                      </div>
                    </div>

                    <div className="grid gap-3 p-4">
                      <div className="flex flex-wrap items-start gap-2 pr-12 md:flex-nowrap md:items-center">
                        <h2 className="min-w-0 flex-1 text-lg font-semibold leading-tight">{profile.programName}</h2>
                        <TrustBadge isVerified={showVerifiedBadge} verificationTier={profile.verificationTier} />
                        <ProfileOwnershipBadge ownershipStatus={profile.ownershipStatus} />
                        <Badge tone={profileIsAvailable ? "success" : "warning"}>
                          {availabilityText(profile, showLiveAvailability)}
                        </Badge>
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
                                <span key={item} className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                                  <span className="size-1.5 rounded-full border border-muted-foreground" />
                                  {item}
                                </span>
                              ))}
                              {amenitySummary.hiddenCount ? (
                                <span className="text-xs text-muted-foreground">+{amenitySummary.hiddenCount} more</span>
                              ) : null}
                            </div>
                          ) : (
                            <p className="mt-2 text-xs text-muted-foreground">Amenities not listed</p>
                          )}
                        </div>

                        <div className="grid shrink-0 gap-2 md:justify-items-end">
                          <p className="text-base font-semibold">{formatPricePerWeek(profile.pricePerWeek)}</p>
                          {formatMoveInCost(profile.moveInCost) ? (
                            <span className="inline-flex min-h-7 items-center rounded-full border border-emerald-200 bg-emerald-50 px-3 text-xs font-semibold text-emerald-800">
                              {formatMoveInCost(profile.moveInCost)}
                            </span>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  </Link>
                </Card>
                </div>
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
          <LoadMoreListings
            hasMore={hasMoreListings}
            loadedCount={profiles.length}
            nextHref={pageHref(page + 1)}
            totalCount={totalListings}
          />
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
            publicLatitude: profile.publicLatitude ? Number(profile.publicLatitude) : null,
            publicLongitude: profile.publicLongitude ? Number(profile.publicLongitude) : null,
            isAvailable: Boolean(
              profile.type === ProfileType.sober_living
                ? canUseLiveAvailability(profile.organization, profile) && profile.bedsAvailable
                : profile.acceptingNewPatients
            ),
            selectionHref: selectedListingHref(profile.id)
          }))}
          selectedListingId={selectedListingId}
        />
      </div>
      </main>
    </>
  );
}
