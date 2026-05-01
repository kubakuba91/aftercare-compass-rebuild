import Link from "next/link";
import { SlidersHorizontal, UserCircle } from "lucide-react";
import {
  amenityOptions,
  averageLengthOptions,
  matOptions,
  populationOptions,
  specialtyPopulationOptions
} from "@/lib/sober-living-onboarding";

type PublicSearchHeaderProps = {
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
  duration?: string;
  amenities?: string[];
  mat?: string[];
  verified?: boolean;
};

export function PublicSearchHeader({
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
  duration = "",
  amenities = [],
  mat = [],
  verified = false
}: PublicSearchHeaderProps) {
  const activeFilterCount = [
    population.length,
    specialty.length,
    minPrice !== undefined || maxPrice !== undefined ? 1 : 0,
    duration ? 1 : 0,
    amenities.length,
    mat.length,
    verified ? 1 : 0
  ].reduce((sum, value) => sum + (typeof value === "number" ? value : 0), 0);

  return (
    <header className="border-b border-border bg-white">
      <div className="shell relative flex flex-col gap-3 py-4 lg:flex-row lg:items-start">
        <Link className="text-lg font-semibold text-primary" href="/">
          Aftercare Compass
        </Link>
        <form action="/search" className="grid flex-1 gap-2 md:grid-cols-[260px_1fr_180px_160px]">
          <div className="grid rounded-md border border-border bg-white p-1 sm:grid-cols-2">
            <label className="focus-within:ring-ring flex min-h-10 cursor-pointer items-center justify-center rounded px-3 text-center text-sm font-semibold transition has-[:checked]:bg-primary has-[:checked]:text-primary-foreground has-[:focus-visible]:ring-2">
              <input
                className="sr-only"
                defaultChecked={defaultType === "sober_living" || !defaultType}
                name="type"
                type="radio"
                value="sober_living"
              />
              Sober Living
            </label>
            <label className="focus-within:ring-ring flex min-h-10 cursor-pointer items-center justify-center rounded px-3 text-center text-sm font-semibold transition has-[:checked]:bg-primary has-[:checked]:text-primary-foreground has-[:focus-visible]:ring-2">
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
            className="min-h-11 rounded-md border border-border px-3 text-sm"
            defaultValue={defaultLocation}
            name="q"
            placeholder="City, state, or name"
          />
          <Link
            className="focus-ring flex min-h-11 items-center gap-2 rounded-md border border-border bg-white px-3 text-sm font-semibold"
            href={filtersHref}
          >
            <SlidersHorizontal size={16} />
            Filters
            <span className="font-normal text-muted-foreground">
              {activeFilterCount ? `${activeFilterCount} active` : "None"}
            </span>
          </Link>
          <button className="focus-ring min-h-11 rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground">
            Search
          </button>
          {!showFilters && defaultAvailability === "available" ? (
            <input name="availability" type="hidden" value="available" />
          ) : null}
          {showFilters ? (
            <div className="z-10 grid gap-4 rounded-lg border border-border bg-white p-5 shadow-sm md:col-start-3 md:col-end-5">
              <h2 className="text-lg font-semibold">Filter Options</h2>
              <label className="grid gap-2 text-sm font-medium">
                Population Served
                <select
                  className="min-h-10 rounded-md border border-border bg-white px-3 text-sm"
                  defaultValue={population[0] || ""}
                  name="population"
                >
                  <option value="">Select population...</option>
                  {populationOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </label>
              <label className="grid gap-2 text-sm font-medium">
                Specialty Populations Served
                <select
                  className="min-h-24 rounded-md border border-border bg-white px-3 py-2 text-sm"
                  defaultValue={specialty}
                  multiple
                  name="specialty"
                >
                  {specialtyPopulationOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </label>
              <div className="grid gap-2">
                <span className="text-sm font-medium">Price per week</span>
                <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
                  <input
                    className="min-h-10 rounded-md border border-border bg-white px-3 text-sm"
                    defaultValue={minPrice ?? ""}
                    min="0"
                    name="minPrice"
                    placeholder="$ Min"
                    type="number"
                  />
                  <span className="text-sm text-muted-foreground">to</span>
                  <input
                    className="min-h-10 rounded-md border border-border bg-white px-3 text-sm"
                    defaultValue={maxPrice ?? ""}
                    min="0"
                    name="maxPrice"
                    placeholder="$ Max"
                    type="number"
                  />
                </div>
              </div>
              <label className="grid gap-2 text-sm font-medium">
                Average Program Duration
                <select className="min-h-10 rounded-md border border-border bg-white px-3 text-sm" defaultValue={duration} name="duration">
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
                <select
                  className="min-h-24 rounded-md border border-border bg-white px-3 py-2 text-sm"
                  defaultValue={amenities}
                  multiple
                  name="amenity"
                >
                  {amenityOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </label>
              <label className="grid gap-2 text-sm font-medium">
                Restricted Medications
                <select
                  className="min-h-24 rounded-md border border-border bg-white px-3 py-2 text-sm"
                  defaultValue={mat}
                  multiple
                  name="mat"
                >
                  {matOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
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
          className="focus-ring inline-flex min-h-11 items-center justify-center rounded-md border border-border px-3"
          href="/auth/complete"
        >
          <UserCircle size={22} />
          <span className="sr-only">Account</span>
        </Link>
      </div>
    </header>
  );
}
