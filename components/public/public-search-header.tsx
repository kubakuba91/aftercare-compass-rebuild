import Link from "next/link";
import Image from "next/image";
import { Search, SlidersHorizontal, UserCircle } from "lucide-react";
import { MultiSelectDropdown } from "@/components/onboarding/multi-select-dropdown";
import {
  averageLengthOptions,
  insuranceOptions,
  matOptions,
  populationOptions,
  specialtyPopulationOptions
} from "@/lib/sober-living-onboarding";
import { continuedCareDurationOptions } from "@/lib/continued-care-onboarding";
import { levelsOfCareOptions } from "@/lib/levels-of-care";
import { clinicalFocusOptions } from "@/lib/profile-options";
import { defaultSearchFilterSetting, searchFilterKeys, type SearchFilterSettingRow } from "@/lib/search-filter-settings";
import { dashboardAppUrl } from "@/lib/app-urls";
import { cn } from "@/lib/utils";

type PublicSearchHeaderProps = {
  isSignedIn?: boolean;
  defaultType?: string;
  defaultLocation?: string;
  defaultAvailability?: string;
  showFilters?: boolean;
  clearHref?: string;
  population?: string[];
  populationOptions?: string[];
  specialty?: string[];
  specialtyOptions?: string[];
  minPrice?: number;
  maxPrice?: number;
  radiusMiles?: number;
  duration?: string[];
  searchFilterSettings?: SearchFilterSettingRow[];
  amenities?: string[];
  amenityOptions?: string[];
  mat?: string[];
  matOptions?: string[];
  levelsOfCare?: string[];
  levelOfCareOptions?: string[];
  clinicalFocus?: string[];
  clinicalFocusOptions?: string[];
  insurance?: string[];
  insuranceOptions?: string[];
  verified?: boolean;
};

export function PublicSearchHeader({
  isSignedIn = false,
  defaultType = "",
  defaultLocation = "",
  defaultAvailability = "",
  showFilters = false,
  clearHref = "/search",
  population = [],
  populationOptions: availablePopulationOptions = [...populationOptions],
  specialty = [],
  specialtyOptions: availableSpecialtyOptions = [...specialtyPopulationOptions],
  minPrice,
  maxPrice,
  radiusMiles,
  duration = [],
  searchFilterSettings = searchFilterKeys().map((key) => defaultSearchFilterSetting(key)),
  amenities = [],
  amenityOptions = [],
  mat = [],
  matOptions: availableMatOptions = [...matOptions],
  levelsOfCare = [],
  levelOfCareOptions: availableLevelOfCareOptions = [...levelsOfCareOptions],
  clinicalFocus = [],
  clinicalFocusOptions: availableClinicalFocusOptions = [...clinicalFocusOptions],
  insurance = [],
  insuranceOptions: availableInsuranceOptions = [...insuranceOptions],
  verified = false
}: PublicSearchHeaderProps) {
  const isContinuedCare = defaultType === "continued_care";
  const durationOptions = isContinuedCare ? continuedCareDurationOptions : averageLengthOptions;
  const searchFilterByKey = new Map(searchFilterSettings.map((setting) => [setting.key, setting]));
  const activeFilterCount = [
    searchFilterByKey.has("population") ? population.length : 0,
    specialty.length,
    searchFilterByKey.has("price") && !isContinuedCare && (minPrice !== undefined || maxPrice !== undefined) ? 1 : 0,
    searchFilterByKey.has("distance") && radiusMiles !== undefined ? 1 : 0,
    searchFilterByKey.has("duration") ? duration.length : 0,
    isContinuedCare ? 0 : amenities.length,
    mat.length,
    isContinuedCare ? levelsOfCare.length : 0,
    isContinuedCare ? clinicalFocus.length : 0,
    isContinuedCare ? insurance.length : 0,
    verified ? 1 : 0
  ].reduce((sum, value) => sum + (typeof value === "number" ? value : 0), 0);

  function requiredLabel(label: string, required: boolean) {
    return required ? `${label} (required)` : label;
  }

  function renderCoreFilter(setting: SearchFilterSettingRow) {
    if (setting.key === "population") {
      return (
        <label className="grid gap-2 text-sm font-medium" key={setting.key}>
          {requiredLabel(setting.label, setting.isRequired)}
          {setting.selectionMode === "multiple" ? (
            <MultiSelectDropdown
              name="population"
              options={availablePopulationOptions}
              placeholder="Select population..."
              selected={population}
            />
          ) : (
            <select className="min-h-10 w-full rounded-md border border-border bg-white px-3 text-sm" defaultValue={population[0] || ""} name="population" required={setting.isRequired}>
              <option value="">Select population...</option>
              {availablePopulationOptions.map((option) => <option key={option} value={option}>{option}</option>)}
            </select>
          )}
        </label>
      );
    }

    if (setting.key === "price" && !isContinuedCare) {
      return (
        <div className="grid gap-2" key={setting.key}>
          <span className="text-sm font-medium">{requiredLabel(setting.label, setting.isRequired)}</span>
          <div className="grid min-w-0 grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2">
            <input className="min-h-10 w-full min-w-0 rounded-md border border-border bg-white px-3 text-sm" defaultValue={minPrice ?? ""} min="0" name="minPrice" placeholder="$ Min" required={setting.isRequired} type="number" />
            <span className="text-sm text-muted-foreground">to</span>
            <input className="min-h-10 w-full min-w-0 rounded-md border border-border bg-white px-3 text-sm" defaultValue={maxPrice ?? ""} min="0" name="maxPrice" placeholder="$ Max" type="number" />
          </div>
        </div>
      );
    }

    if (setting.key === "distance") {
      return (
        <label className="grid gap-2 text-sm font-medium" key={setting.key}>
          {requiredLabel(setting.label, setting.isRequired)}
          <select className="min-h-10 w-full min-w-0 rounded-md border border-border bg-white px-3 text-sm" defaultValue={radiusMiles ?? ""} name="radius" required={setting.isRequired}>
            <option value="">Any distance</option>
            <option value="5">Within 5 miles</option>
            <option value="10">Within 10 miles</option>
            <option value="25">Within 25 miles</option>
            <option value="50">Within 50 miles</option>
            <option value="100">Within 100 miles</option>
          </select>
          <span className="text-xs leading-5 text-muted-foreground">Uses public city-level locations. Enter a city and state for best results.</span>
        </label>
      );
    }

    if (setting.key === "duration") {
      return (
        <label className="grid gap-2 text-sm font-medium" key={setting.key}>
          {requiredLabel(setting.label, setting.isRequired)}
          {setting.selectionMode === "multiple" ? (
            <MultiSelectDropdown name="duration" options={durationOptions} placeholder="Select duration..." selected={duration} />
          ) : (
            <select className="min-h-10 w-full min-w-0 rounded-md border border-border bg-white px-3 text-sm" defaultValue={duration[0] || ""} name="duration" required={setting.isRequired}>
              <option value="">Select duration...</option>
              {durationOptions.map((option) => <option key={option} value={option}>{option}</option>)}
            </select>
          )}
        </label>
      );
    }

    return null;
  }

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
        <form action="/search" className="relative grid min-w-0 flex-1 gap-2 md:grid-cols-[340px_minmax(180px,1fr)_128px_160px]">
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
          <label className="focus-within:ring-ring flex h-14 min-w-0 items-center gap-2 rounded-lg border border-border bg-white px-4 shadow-sm focus-within:ring-2">
            <span className="sr-only">Search by city, state, or program name</span>
            <Search aria-hidden="true" className="shrink-0 text-muted-foreground" size={18} />
            <input
              className="!min-h-0 min-w-0 flex-1 appearance-none !border-0 !bg-transparent !p-0 text-sm font-medium !shadow-none outline-none placeholder:text-muted-foreground focus:!border-0 focus:!shadow-none focus:ring-0"
              defaultValue={defaultLocation}
              name="q"
              placeholder="City, state, or name"
            />
          </label>
          <button hidden type="submit">
            Search
          </button>
          <button
            className="focus-ring flex h-14 items-center justify-center gap-2 rounded-lg border border-border bg-white px-3 text-sm font-semibold"
            name="filters"
            type="submit"
            value={showFilters ? "0" : "1"}
          >
            <SlidersHorizontal size={16} />
            Filters
            {activeFilterCount ? (
              <span className="rounded-full bg-[#12185f]/10 px-2 py-0.5 text-xs font-semibold text-[#12185f]">
                {activeFilterCount}
              </span>
            ) : null}
          </button>
          <button className="focus-ring h-14 rounded-lg bg-[#12185f] px-4 text-sm font-semibold text-white shadow-sm hover:bg-[#0d1249]" type="submit">
            Search
          </button>
          {!showFilters ? (
            <>
              {searchFilterByKey.has("population") ? population.map((value) => <input key={`population-${value}`} name="population" type="hidden" value={value} />) : null}
              {specialty.map((value) => <input key={`specialty-${value}`} name="specialty" type="hidden" value={value} />)}
              {searchFilterByKey.has("price") && !isContinuedCare && minPrice !== undefined ? <input name="minPrice" type="hidden" value={minPrice} /> : null}
              {searchFilterByKey.has("price") && !isContinuedCare && maxPrice !== undefined ? <input name="maxPrice" type="hidden" value={maxPrice} /> : null}
              {searchFilterByKey.has("distance") && radiusMiles !== undefined ? <input name="radius" type="hidden" value={radiusMiles} /> : null}
              {searchFilterByKey.has("duration") ? duration.map((value) => <input key={`duration-${value}`} name="duration" type="hidden" value={value} />) : null}
              {!isContinuedCare ? amenities.map((value) => <input key={`amenity-${value}`} name="amenity" type="hidden" value={value} />) : null}
              {mat.map((value) => <input key={`mat-${value}`} name="mat" type="hidden" value={value} />)}
              {isContinuedCare ? levelsOfCare.map((value) => <input key={`level-${value}`} name="levelOfCare" type="hidden" value={value} />) : null}
              {isContinuedCare ? clinicalFocus.map((value) => <input key={`clinical-${value}`} name="clinicalFocus" type="hidden" value={value} />) : null}
              {isContinuedCare ? insurance.map((value) => <input key={`insurance-${value}`} name="insurance" type="hidden" value={value} />) : null}
              {verified ? <input name="verified" type="hidden" value="yes" /> : null}
              {defaultAvailability === "available" ? <input name="availability" type="hidden" value="available" /> : null}
            </>
          ) : null}
          {showFilters ? (
            <div className="absolute left-0 top-[calc(100%+0.75rem)] z-50 grid w-full min-w-0 gap-4 rounded-lg border border-border bg-white p-5 shadow-lg md:left-auto md:right-[168px] md:w-[min(100vw-2rem,420px)]">
              <h2 className="text-lg font-semibold">
                {isContinuedCare ? "Continued Care Filters" : "Sober Living Filters"}
              </h2>
              {searchFilterSettings.map(renderCoreFilter)}
              <label className="grid gap-2 text-sm font-medium">
                Specialty Populations Served
                <MultiSelectDropdown
                  closeOnSelect
                  name="specialty"
                  options={availableSpecialtyOptions}
                  placeholder="Select specialty populations..."
                  selected={specialty}
                />
              </label>
              {isContinuedCare ? (
                <>
                  <label className="grid gap-2 text-sm font-medium">
                    Levels of Care
                    <MultiSelectDropdown name="levelOfCare" options={availableLevelOfCareOptions} placeholder="Select levels of care..." selected={levelsOfCare} />
                  </label>
                  <label className="grid gap-2 text-sm font-medium">
                    Clinical Focus
                    <MultiSelectDropdown name="clinicalFocus" options={availableClinicalFocusOptions} placeholder="Select clinical focus..." selected={clinicalFocus} />
                  </label>
                  <label className="grid gap-2 text-sm font-medium">
                    Insurance / Payment Accepted
                    <MultiSelectDropdown name="insurance" options={availableInsuranceOptions} placeholder="Select insurance or payment..." selected={insurance} />
                  </label>
                </>
              ) : (
                <label className="grid gap-2 text-sm font-medium">
                  Amenities
                  <MultiSelectDropdown name="amenity" options={amenityOptions} placeholder="Select amenities..." selected={amenities} />
                </label>
              )}
              <label className="grid gap-2 text-sm font-medium">
                MAT Medications Accepted
                <MultiSelectDropdown
                  name="mat"
                  options={availableMatOptions}
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
                {isContinuedCare ? "Accepting new patients" : "Available now"}
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
          className={cn(
            "focus-ring inline-flex h-14 shrink-0 items-center justify-center rounded-lg border border-border px-3 text-sm font-semibold",
            isSignedIn ? "w-14" : "min-w-28 whitespace-nowrap px-4"
          )}
          href={dashboardAppUrl(isSignedIn ? "/auth/complete" : "/sign-in")}
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
