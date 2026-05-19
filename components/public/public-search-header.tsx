import Link from "next/link";
import Image from "next/image";
import { SlidersHorizontal, UserCircle } from "lucide-react";
import { MultiSelectDropdown } from "@/components/onboarding/multi-select-dropdown";
import {
  amenityOptions,
  averageLengthOptions,
  matOptions,
  populationOptions,
  specialtyPopulationOptions
} from "@/lib/sober-living-onboarding";

type PublicSearchHeaderProps = {
  isSignedIn?: boolean;
  defaultType?: string;
  defaultLocation?: string;
  defaultAvailability?: string;
  showFilters?: boolean;
  filtersHref?: string;
  clearHref?: string;
  population?: string[];
  specialty?: string[];
  minPrice?: number;
  maxPrice?: number;
  radiusMiles?: number;
  duration?: string;
  amenities?: string[];
  mat?: string[];
  verified?: boolean;
};

export function PublicSearchHeader({
  isSignedIn = false,
  defaultType = "",
  defaultLocation = "",
  defaultAvailability = "",
  showFilters = false,
  filtersHref = "/search?filters=1",
  clearHref = "/search",
  population = [],
  specialty = [],
  minPrice,
  maxPrice,
  radiusMiles,
  duration = "",
  amenities = [],
  mat = [],
  verified = false
}: PublicSearchHeaderProps) {
  const activeFilterCount = [
    population.length,
    specialty.length,
    minPrice !== undefined || maxPrice !== undefined ? 1 : 0,
    radiusMiles !== undefined ? 1 : 0,
    duration ? 1 : 0,
    amenities.length,
    mat.length,
    verified ? 1 : 0
  ].reduce((sum, value) => sum + (typeof value === "number" ? value : 0), 0);

  return (
    <header className="relative z-30 border-b border-border bg-white">
      <div className="shell relative flex flex-col gap-3 py-4 lg:flex-row lg:items-start">
        <Link className="focus-ring inline-flex shrink-0 items-center rounded-md" href="/" aria-label="Aftercare Compass home">
          <Image
            alt="Aftercare Compass"
            className="h-12 w-12 object-contain"
            height={48}
            src="/brand/ac-favicon.png"
            width={48}
          />
        </Link>
        <form action="/search" className="relative grid flex-1 gap-2 md:grid-cols-[340px_1fr_180px_160px]">
          <div className="grid h-14 gap-1.5 overflow-hidden rounded-lg border border-[#12185f] bg-[#12185f] p-2 sm:grid-cols-2">
            <label className="focus-within:ring-ring flex h-10 cursor-pointer items-center justify-center whitespace-nowrap rounded-md px-4 text-center text-sm font-semibold text-white transition-colors has-[:checked]:bg-white has-[:checked]:text-[#17212b] has-[:focus-visible]:ring-2">
              <input
                className="sr-only"
                defaultChecked={defaultType === "sober_living" || !defaultType}
                name="type"
                type="radio"
                value="sober_living"
              />
              Sober Living
            </label>
            <label className="focus-within:ring-ring flex h-10 cursor-pointer items-center justify-center whitespace-nowrap rounded-md px-4 text-center text-sm font-semibold text-white transition-colors has-[:checked]:bg-white has-[:checked]:text-[#17212b] has-[:focus-visible]:ring-2">
              <input
                className="sr-only"
                defaultChecked={defaultType === "continued_care"}
                name="type"
                type="radio"
                value="continued_care"
              />
              Continued Care
            </label>
          </div>
          <input
            className="h-14 rounded-lg border border-border px-3 text-sm"
            defaultValue={defaultLocation}
            name="q"
            placeholder="City, state, or name"
          />
          <Link
            className="focus-ring flex h-14 items-center gap-2 rounded-lg border border-border bg-white px-3 text-sm font-semibold"
            href={filtersHref}
          >
            <SlidersHorizontal size={16} />
            Filters
            <span className="font-normal text-muted-foreground">
              {activeFilterCount ? `${activeFilterCount} active` : "None"}
            </span>
          </Link>
          <button className="focus-ring h-14 rounded-lg bg-[#12185f] px-4 text-sm font-semibold text-white shadow-sm hover:bg-[#0d1249]">
            Search
          </button>
          {!showFilters && defaultAvailability === "available" ? (
            <input name="availability" type="hidden" value="available" />
          ) : null}
          {showFilters ? (
            <div className="absolute left-0 top-[calc(100%+0.75rem)] z-50 grid w-full min-w-0 gap-4 rounded-lg border border-border bg-white p-5 shadow-lg md:left-auto md:right-[168px] md:w-[min(100vw-2rem,420px)]">
              <h2 className="text-lg font-semibold">Filter Options</h2>
              <label className="grid gap-2 text-sm font-medium">
                Population Served
                <MultiSelectDropdown
                  name="population"
                  options={populationOptions}
                  placeholder="Select population..."
                  selected={population}
                />
              </label>
              <label className="grid gap-2 text-sm font-medium">
                Specialty Populations Served
                <MultiSelectDropdown
                  closeOnSelect
                  name="specialty"
                  options={specialtyPopulationOptions}
                  placeholder="Select specialty populations..."
                  selected={specialty}
                />
              </label>
              <div className="grid gap-2">
                <span className="text-sm font-medium">Price per week</span>
                <div className="grid min-w-0 grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2">
                  <input
                    className="min-h-10 w-full min-w-0 rounded-md border border-border bg-white px-3 text-sm"
                    defaultValue={minPrice ?? ""}
                    min="0"
                    name="minPrice"
                    placeholder="$ Min"
                    type="number"
                  />
                  <span className="text-sm text-muted-foreground">to</span>
                  <input
                    className="min-h-10 w-full min-w-0 rounded-md border border-border bg-white px-3 text-sm"
                    defaultValue={maxPrice ?? ""}
                    min="0"
                    name="maxPrice"
                    placeholder="$ Max"
                    type="number"
                  />
                </div>
              </div>
              <label className="grid gap-2 text-sm font-medium">
                Distance from search location
                <select
                  className="min-h-10 w-full min-w-0 rounded-md border border-border bg-white px-3 text-sm"
                  defaultValue={radiusMiles ?? ""}
                  name="radius"
                >
                  <option value="">Any distance</option>
                  <option value="5">Within 5 miles</option>
                  <option value="10">Within 10 miles</option>
                  <option value="25">Within 25 miles</option>
                  <option value="50">Within 50 miles</option>
                  <option value="100">Within 100 miles</option>
                </select>
                <span className="text-xs leading-5 text-muted-foreground">
                  Uses public city-level locations. Enter a city and state for best results.
                </span>
              </label>
              <label className="grid gap-2 text-sm font-medium">
                Average Program Duration
                <select className="min-h-10 w-full min-w-0 rounded-md border border-border bg-white px-3 text-sm" defaultValue={duration} name="duration">
                  <option value="">Select duration...</option>
                  {averageLengthOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </label>
              <label className="grid gap-2 text-sm font-medium">
                Specialties / Amenities
                <MultiSelectDropdown
                  name="amenity"
                  options={amenityOptions}
                  placeholder="Select amenities..."
                  selected={amenities}
                />
              </label>
              <label className="grid gap-2 text-sm font-medium">
                Restricted Medications
                <MultiSelectDropdown
                  name="mat"
                  options={matOptions}
                  placeholder="Select medications..."
                  selected={mat}
                />
              </label>
              <label className="flex items-center gap-2 text-sm font-medium">
                <input defaultChecked={verified} name="verified" type="checkbox" value="yes" />
                Is verified
              </label>
              <label className="flex items-center gap-2 text-sm font-medium">
                <input
                  defaultChecked={defaultAvailability === "available"}
                  name="availability"
                  type="checkbox"
                  value="available"
                />
                Available now
              </label>
              <Link
                className="focus-ring inline-flex min-h-10 items-center justify-center rounded-md border border-border px-4 text-sm font-semibold text-muted-foreground"
                href={clearHref}
              >
                Clear All
              </Link>
            </div>
          ) : null}
        </form>
        <Link
          className="focus-ring inline-flex h-14 w-14 shrink-0 items-center justify-center rounded-lg border border-border px-3 text-sm font-semibold"
          href={isSignedIn ? "/auth/complete" : "/sign-in"}
        >
          {isSignedIn ? (
            <>
              <UserCircle size={22} />
              <span className="sr-only">Account</span>
            </>
          ) : (
            "Join or Login"
          )}
        </Link>
      </div>
    </header>
  );
}
