import { ContactProgramDialog } from "@/components/public/contact-program-dialog";
import { removeSearchFilterHref } from "@/lib/search-filter-chips";
import { parseSearchLocation, searchLocationWhere, removeSearchStateHref } from "@/lib/search-location";
import { virtualStates, isVirtualOnly, coverageLabel, virtualSearchSelection } from "@/lib/virtual-care";
import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { Prisma, ProfileOwnershipStatus, ProfileType, Role, SubscriptionStatus } from "@prisma/client";
import { normalizePhoneNumber } from "@/lib/phone";
import { MapPin, Phone, House, CreditCard, Pill, Wifi, Zap, Armchair, Bus, WashingMachine, BedDouble, Check, CircleCheck } from "lucide-react";
import { ApproximateLocationMap } from "@/components/public/approximate-location-map";
import { FavoriteListingButton } from "@/components/public/favorite-listing-button";
import { AdaptiveProfileImage } from "@/components/public/adaptive-profile-image";
import { LoadMoreListings } from "@/components/public/load-more-listings";
import { SearchSortDropdown } from "@/components/public/search-sort-dropdown";
import { normalizeSearchSort, searchSortOrder } from "@/lib/search-sort";
import { PublicSearchHeader } from "@/components/public/public-search-header";
import { TrustBadge } from "@/components/public/trust-badge";
import { Badge } from "@/components/ui/badge";
import { Tag } from "@/components/ui/tag";
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

function amenityIcon(label: string) {
  if (/wi-?fi|internet/i.test(label)) return Wifi;
  if (/utilities/i.test(label)) return Zap;
  if (/furnish/i.test(label)) return Armchair;
  if (/transport/i.test(label)) return Bus;
  if (/laundry|washer/i.test(label)) return WashingMachine;
  if (/room|bed/i.test(label)) return BedDouble;
  return Check;
}

function compactItems(values: Array<string | null | undefined>, limit: number) {
  const items = Array.from(new Set(values.filter((value): value is string => Boolean(value))));
  const visible = items.slice(0, limit);
  const hiddenCount = Math.max(items.length - visible.length, 0);

  return { visible, hiddenCount };
}

function formatPricePerWeek(value: number | null) {
  if (value === null) {
    return null;
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

export default async function SearchPage({
  searchParams
}: {
  searchParams: Promise<{
    delivery?: string;
    virtualState?: string;
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
    sort?: string | string[];
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
          firstName: true, lastName: true, email: true, phone: true,
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
  const searchLocation = parseSearchLocation(q);
  const rawType = firstFromQuery(query.type);
  const type = rawType === "continued_care" ? "continued_care" : "sober_living";
  if (type !== "continued_care") { query.delivery = undefined; query.virtualState = undefined; }
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
  const selection = virtualSearchSelection(query.delivery, query.virtualState);
  query.delivery = selection.delivery;
  query.virtualState = selection.virtualState;
  const virtualSearch = selection.virtualSearch;
  const requestedRadiusMiles = numberFromQuery(query.radius);
  const radiusMiles = !(searchLocation && !searchLocation.city) && !virtualSearch && searchFilterByKey.has("distance") && requestedRadiusMiles !== undefined && requestedRadiusMiles > 0
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
  const canSortByDistance = Boolean(radiusMiles && radiusCenter && !query.virtualState);
  const sort = normalizeSearchSort(firstFromQuery(query.sort), canSortByDistance);

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
        subscriptionPlan: { in: ["verified", "network", "virtual_basic", "virtual_growth", "virtual_network"] },
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

  const matchedVirtualState = parseSearchLocation(query.virtualState || q)?.state.coverage;
  const appliedLocation = !radiusCenter && !query.virtualState ? searchLocation : null;
  const filterChips: Array<{ label: string; href: string }> = [];
  const addChip = (key: string, label: string, value?: string) => filterChips.push({ label, href: removeSearchFilterHref(query, key, value) });
  if (appliedLocation) filterChips.push({ label: `State: ${appliedLocation.state.name}`, href: removeSearchStateHref(query, appliedLocation) });
  else if (q && !query.virtualState) addChip("q", `Search: ${q}`);
  for (const [key, label, values] of [
    ["population", "Population", population], ["specialty", "Specialty", specialty],
    ["duration", "Duration", durations], ["amenity", "Amenity", amenities],
    ["mat", "MAT", mat], ["levelOfCare", "Level of care", levelsOfCare],
    ["clinicalFocus", "Clinical focus", clinicalFocus], ["insurance", "Insurance", insurance]
  ] as const) for (const value of values) addChip(key, `${label}: ${value}`, value);
  if (minPrice !== undefined) addChip("minPrice", `Min: $${minPrice}/week`);
  if (maxPrice !== undefined) addChip("maxPrice", `Max: $${maxPrice}/week`);
  if (radiusMiles) addChip("radius", `Within ${radiusMiles} mi`);
  if (verified) addChip("verified", "Verified only");
  if (availability) addChip("availability", "Available now");
  if (query.delivery) addChip("delivery", query.delivery === "virtual" ? "Virtual only" : "In person");
  if (query.virtualState) addChip("virtualState", `Serves: ${query.virtualState}`);
  // Once a radius has a geographic center, the distance check is the location
  // filter. Keeping the text-location predicate here would exclude valid nearby
  // listings in neighboring cities before their distance can be calculated.
  if (q && !radiusCenter && !query.virtualState) {
    andFilters.push(appliedLocation ? searchLocationWhere(appliedLocation) : {
      OR: [
        { programName: { contains: q, mode: Prisma.QueryMode.insensitive } },
        { publicCity: { contains: q, mode: Prisma.QueryMode.insensitive } },
        { publicState: { contains: q, mode: Prisma.QueryMode.insensitive } },
        { description: { contains: q, mode: Prisma.QueryMode.insensitive } },
        ...(matchedVirtualState ? [{ telehealthMode: "Virtual only", statesServed: { has: matchedVirtualState } }] : [])
      ]
    });
  }

  if (query.delivery === "virtual") andFilters.push({ type: ProfileType.continued_care, telehealthMode: "Virtual only" });
  if (query.delivery === "in-person") andFilters.push({ OR: [{ telehealthMode: null }, { telehealthMode: { not: "Virtual only" } }] });
  if (query.virtualState && (virtualStates as readonly string[]).includes(query.virtualState)) andFilters.push({ statesServed: { has: query.virtualState } });
  const where: Prisma.AftercareProfileWhereInput = {
    AND: andFilters
  };

  const profileQuery = {
    where,
    orderBy: searchSortOrder(sort),
    ...(radiusCenter ? {} : { take: resultLimit }),
    select: {
      id: true,
      slug: true,
      programName: true,
      type: true,
      verificationTier: true,
      ownershipStatus: true,
      telehealthMode: true,
      statesServed: true,
      publicCity: true,
      publicState: true,
      latitude: true,
      longitude: true,
      publicLatitude: true,
      publicLongitude: true,
      description: true,
      admissionsContactPhone: true,
      totalBeds: true,
      bedsAvailable: true,
      acceptingNewPatients: true,
      populationServedOptions: true,
      specialtyPopulations: true,
      averageLengthOfStay: true,
      pricePerWeek: true,
      moveInCost: true,
      levelsOfCare: true,
      recoveryResidenceLevel: true,
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
          trialEndsAt: true, subscriptionPlan: true,
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
  const radiusMatches = radiusMiles && radiusCenter && !query.virtualState
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
        .filter((item) => isVirtualOnly(item.profile) ? Boolean(matchedVirtualState && item.profile.statesServed.includes(matchedVirtualState)) : item.distanceMiles <= radiusMiles)
        .sort((first, second) => sort === "distance" ? first.distanceMiles - second.distanceMiles : 0)
        .map((item) => item.profile)
    : null;
  const totalListings = radiusMatches ? radiusMatches.length : databaseTotal ?? rawProfiles.length;
  const profiles = radiusMatches ? radiusMatches.slice(0, resultLimit) : rawProfiles.slice(0, resultLimit);
  const hasMoreListings = profiles.length < totalListings;

  return (
    <>
      <PublicSearchHeader
        sort={sort}
        delivery={query.delivery}
        virtualState={query.virtualState}
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
        <div className="flex flex-wrap items-center gap-x-6 gap-y-3 border-b border-border pb-4">
          <h1 className="text-lg font-semibold leading-snug text-heading">
            {totalListings.toLocaleString("en-US")} {type === "sober_living" ? (totalListings === 1 ? "home" : "homes") : (totalListings === 1 ? "program" : "programs")}
            {query.virtualState ? ` serving ${query.virtualState}` : radiusCenter ? ` near ${q}` : appliedLocation ? ` in ${appliedLocation.city ? `${appliedLocation.city}, ` : ""}${appliedLocation.state.name}` : " in your search"}
          </h1>
          <div className="min-w-0 flex-1 basis-64">
          {filterChips.length ? (
            <nav aria-label="Active search filters" className="flex flex-wrap items-center gap-2">
              {filterChips.map(chip => <Link key={chip.label} className="focus-ring inline-flex max-w-full items-center gap-2 rounded-full border border-border bg-white px-3 py-1.5 text-sm hover:bg-muted" href={chip.href} aria-label={`Remove filter: ${chip.label}`}>
                {chip.label}<span aria-hidden="true" className="shrink-0">×</span>
              </Link>)}
              <Link className="focus-ring rounded px-2 py-1 text-sm font-medium text-primary underline" href={`/search?type=${type}`}>Clear all</Link>
            </nav>
          ) : null}
          </div>
          <div className="ml-auto shrink-0">
            <SearchSortDropdown value={sort} canSortByDistance={canSortByDistance} />
          </div>
        </div>

      <div className={`grid gap-5 py-6 ${virtualSearch ? "" : "lg:grid-cols-[minmax(0,2fr)_minmax(360px,1fr)] lg:items-start"}`}>
        <div className="grid gap-4">
          {radiusMiles && !radiusCenter ? (
            <Card className="border-amber-200 bg-amber-50">
              <h2 className="font-semibold text-amber-950">We couldn&apos;t locate that search area</h2>
              <p className="mt-1 text-sm leading-6 text-amber-900">
                Enter a city and state, then try the {radiusMiles}-mile distance filter again.
              </p>
            </Card>
          ) : null}
          {profiles.length ? (
            profiles.map((profile, index) => {
              const offerings = compactItems(
                [
                  ...profile.populationServedOptions,
                  ...profile.specialtyPopulations,
                  ...profile.certificationsHeld,
                  ...(profile.type === ProfileType.sober_living ? [] : profile.accreditations),
                  ...(profile.type === ProfileType.sober_living ? profile.recoverySupportServices : profile.clinicalFocus)
                ],
                3
              );
              const amenitySummary = compactItems(
                [
                  ...profile.amenities,
                  ...profile.supportServices,
                  ...profile.roomTypes.map((roomType) => `${roomType} rooms`)
                ],
                3
              );
              const careSummary = compactItems(profile.type === ProfileType.sober_living ? [profile.recoveryResidenceLevel || ""] : profile.levelsOfCare, 2);
              const insuranceSummary = compactItems(profile.insuranceAccepted, 2);
              const matSummary = compactItems(profile.matAccepted, 2);
              const primaryTags = [
                { label: profile.type === ProfileType.sober_living ? "Residence level" : "Level of care", summary: careSummary, Icon: House },
                { label: "Payment", summary: insuranceSummary, Icon: CreditCard },
                { label: "MAT", summary: matSummary, Icon: Pill }
              ].filter(tag => tag.summary.visible.length);
              const phone = normalizePhoneNumber(profile.admissionsContactPhone || "");
              const description = richTextToPlainText(profile.description);
              const locationLabel = isVirtualOnly(profile) ? `Virtual Only · ${coverageLabel(profile.statesServed)}` : [profile.publicCity, profile.publicState].filter(Boolean).join(", ");
              const point = radiusCenter && !isVirtualOnly(profile) ? approximatePublicPoint({
                id: profile.id, publicCity: profile.publicCity, publicState: profile.publicState,
                latitude: profile.latitude ? Number(profile.latitude) : null,
                longitude: profile.longitude ? Number(profile.longitude) : null,
                publicLatitude: profile.publicLatitude ? Number(profile.publicLatitude) : null,
                publicLongitude: profile.publicLongitude ? Number(profile.publicLongitude) : null
              }) : null;
              const distance = radiusCenter && point ? milesBetween(radiusCenter, point) : null;
              const price = formatPricePerWeek(profile.pricePerWeek);
              const moveInCost = formatMoveInCost(profile.moveInCost);
              const showVerifiedBadge = canDisplayVerifiedBadge(profile.organization, profile);
              const showLiveAvailability =
                profile.type !== ProfileType.sober_living || canUseLiveAvailability(profile.organization, profile);
              const availabilityLabel = availabilityText(profile, showLiveAvailability);

              return (
                <div key={profile.id} className="scroll-mt-24" id={`listing-${profile.id}`}>
                <Card
                  className={cn(
                    "search-result-card relative overflow-hidden p-0 transition-shadow",
                    selectedListingId === profile.id ? "ring-2 ring-primary ring-offset-2" : null
                  )}
                >
                  <div className="search-result-layout">
                  <Link className="search-result-photo focus-ring" href={`/profiles/${profile.slug}`} aria-label={`Open ${profile.programName}`}>
                    <div className="absolute inset-0">
                      {profile.images[0] ? (
                        <AdaptiveProfileImage
                          alt={profile.images[0].altText || profile.programName}
                          focalX={profile.images[0].focalX}
                          focalY={profile.images[0].focalY}
                          mode={profile.images[0].presentationMode}
                          sizes="(max-width: 540px) 100vw, (max-width: 1023px) 25vw, 240px"
                          src={profile.images[0].url}
                        />
                      ) : (
                        <AdaptiveProfileImage
                          alt={profilePlaceholderAlt(profile.type)}
                          sizes="(max-width: 540px) 100vw, (max-width: 1023px) 25vw, 240px"
                          src={profilePlaceholderImage(profile.type)}
                        />
                      )}
                      <div className="absolute left-3 top-3 rounded-full bg-white/90 px-2 py-1 text-xs font-semibold">
                        {index + 1}
                      </div>
                    </div>

                  </Link>
                  <div className="search-result-body">
                    <div className="search-result-heading">
                      <div className="search-result-heading-main">
                        <div className="search-result-title-row">
                        <Link className="search-result-title focus-ring" href={`/profiles/${profile.slug}`}><h2>{profile.programName}</h2></Link>
                        {showVerifiedBadge ? <TrustBadge compact isVerified verificationTier={profile.verificationTier} /> : null}
                        {availabilityLabel !== "Call for availability" ? <Badge tone="availability"><CircleCheck aria-hidden="true" size={14} />{availabilityLabel}</Badge> : null}
                        </div>
                      {locationLabel ? <p className="search-result-location">
                        <MapPin aria-hidden="true" size={15} />{locationLabel}
                        {distance !== null && Number.isFinite(distance) ? <span aria-label={`Approximately ${distance.toFixed(1)} miles from search location`}>· ~{distance.toFixed(1)} mi from search location</span> : null}
                      </p> : null}
                      </div>
                      {price || moveInCost ? <div className="search-result-price">
                        {price ? <p className="search-result-price-main">{price.replace("/week", "")}<small>/week</small></p> : null}
                        {moveInCost ? <p className="search-result-fee">{moveInCost}</p> : null}
                      </div> : null}
                    </div>
                    <Link className="search-result-details focus-ring" href={`/profiles/${profile.slug}`} aria-label={`Read details for ${profile.programName}`}>
                      {primaryTags.length ? <div className="flex flex-wrap gap-2">
                        {primaryTags.map(({ label, summary, Icon }) => <Tag key={label}>
                          <Icon aria-hidden="true" className="mt-0.5 shrink-0" size={14} />
                          <span title={`${label}: ${summary.visible.join(" · ")}${summary.hiddenCount ? ` · +${summary.hiddenCount} more (see profile)` : ""}`}>
                            {label === "MAT" ? "MAT accepted" : summary.visible.map(value => label === "Residence level" ? value.replace(/^(Level [IVX]+).*$/, "$1 Recovery Residence") : value).join(" · ")}{label !== "MAT" && summary.hiddenCount ? ` +${summary.hiddenCount}` : ""}
                          </span>
                        </Tag>)}
                      </div> : null}
                      {offerings.visible.length ? <div className="flex flex-wrap gap-1.5">
                        {offerings.visible.map(item => <Tag key={item} variant="secondary">{item}</Tag>)}
                        {offerings.hiddenCount ? <span className="px-1 py-0.5 text-xs font-medium text-primary">+{offerings.hiddenCount} more</span> : null}
                      </div> : null}
                      {description ? <p className="search-result-description">{description}</p> : null}
                      {amenitySummary.visible.length ? <p className="search-result-amenities">
                        {amenitySummary.visible.map(item => {
                          const Icon = amenityIcon(item);
                          return <Tag key={item} variant="tertiary"><Icon aria-hidden="true" size={15} />{item}</Tag>;
                        })}{amenitySummary.hiddenCount ? <Tag variant="tertiary">+{amenitySummary.hiddenCount} more</Tag> : null}
                      </p> : null}
                    </Link>
                    <div className="search-result-footer">
                      <div className="grid gap-2">
                        <div className="flex flex-wrap gap-2">
                        {phone ? <a className="search-result-call focus-ring" href={`tel:${phone}`} aria-label={`Call ${profile.programName} for availability`}>
                          <Phone aria-hidden="true" size={16} />Call for availability
                        </a> : null}
                        <ContactProgramDialog profile={{ id: profile.id, slug: profile.slug, name: profile.programName }} contact={appUser ? { name: [appUser.firstName, appUser.lastName].filter(Boolean).join(" "), email: appUser.email, phone: appUser.phone || "" } : undefined} />
                        </div>
                      </div>
                      <FavoriteListingButton large canFavorite={canFavorite} initialFavorited={favoriteProfileIds.has(profile.id)} isSignedIn={isSignedIn} profileId={profile.id} programName={profile.programName} />
                    </div>
                  </div>
                  </div>
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
        {virtualSearch ? null : <ApproximateLocationMap
          listings={profiles.filter((profile) => !isVirtualOnly(profile)).map((profile) => ({
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
        />}
      </div>
      </main>
    </>
  );
}
