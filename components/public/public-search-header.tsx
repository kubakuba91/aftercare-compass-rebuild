import Link from "next/link";
import { Calendar, SlidersHorizontal, UserCircle } from "lucide-react";

type PublicSearchHeaderProps = {
  defaultType?: string;
  defaultLocation?: string;
  defaultAvailability?: string;
};

export function PublicSearchHeader({
  defaultType = "",
  defaultLocation = "",
  defaultAvailability = ""
}: PublicSearchHeaderProps) {
  return (
    <header className="border-b border-border bg-white">
      <div className="shell flex flex-col gap-3 py-4 lg:flex-row lg:items-center">
        <Link className="text-lg font-semibold text-primary" href="/">
          Aftercare Compass
        </Link>
        <form action="/search" className="grid flex-1 gap-2 md:grid-cols-[220px_1fr_180px_180px_160px]">
          <div className="flex rounded-md border border-border bg-white">
            <label className="flex flex-1 items-center justify-center border-r border-border px-3 text-sm font-semibold">
              <input
                className="sr-only"
                defaultChecked={defaultType === "sober_living" || !defaultType}
                name="type"
                type="radio"
                value="sober_living"
              />
              Sober Living
            </label>
            <label className="flex flex-1 items-center justify-center px-3 text-sm font-semibold">
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
          <div className="flex min-h-11 items-center gap-2 rounded-md border border-border px-3 text-sm text-muted-foreground">
            <Calendar size={16} />
            Admission date
          </div>
          <label className="flex min-h-11 items-center gap-2 rounded-md border border-border px-3 text-sm">
            <SlidersHorizontal size={16} />
            <input
              defaultChecked={defaultAvailability === "available"}
              name="availability"
              type="checkbox"
              value="available"
            />
            Available
          </label>
          <button className="focus-ring min-h-11 rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground">
            Search
          </button>
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
