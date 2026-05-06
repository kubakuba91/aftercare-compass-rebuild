import Link from "next/link";
import { MapPin } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type ApproximateMapListing = {
  id: string;
  slug: string;
  programName: string;
  type: "sober_living" | "continued_care";
  publicCity: string;
  publicState: string;
  latitude: number | null;
  longitude: number | null;
  isAvailable: boolean;
};

type MapPinPoint = ApproximateMapListing & {
  lat: number;
  lng: number;
};

const cityCenters: Record<string, [number, number]> = {
  "harrisburg,pa": [40.2732, -76.8867],
  "lancaster,pa": [40.0379, -76.3055],
  "philadelphia,pa": [39.9526, -75.1652],
  "pittsburgh,pa": [40.4406, -79.9959],
  "allentown,pa": [40.6023, -75.4714],
  "reading,pa": [40.3356, -75.9269],
  "york,pa": [39.9626, -76.7277],
  "honey brook,pa": [40.0943, -75.9119],
  "west chester,pa": [39.9607, -75.6055],
  "king of prussia,pa": [40.1013, -75.3836]
};

const stateCenters: Record<string, [number, number]> = {
  PA: [40.8781, -77.7996],
  NJ: [40.0583, -74.4057],
  NY: [42.9538, -75.5268],
  DE: [38.9108, -75.5277],
  MD: [39.0458, -76.6413],
  VA: [37.4316, -78.6569],
  OH: [40.4173, -82.9071],
  WV: [38.5976, -80.4549],
  CT: [41.6032, -73.0877],
  MA: [42.4072, -71.3824],
  DC: [38.9072, -77.0369]
};

function hashNumber(value: string) {
  let hash = 0;

  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) % 100000;
  }

  return hash / 100000;
}

function offsetCoordinate([lat, lng]: [number, number], seed: string, scale: number) {
  const latOffset = (hashNumber(`${seed}:lat`) - 0.5) * scale;
  const lngOffset = (hashNumber(`${seed}:lng`) - 0.5) * scale;

  return [lat + latOffset, lng + lngOffset] as const;
}

function approximatePoint(listing: ApproximateMapListing): MapPinPoint | null {
  if (listing.latitude !== null && listing.longitude !== null) {
    const rounded: [number, number] = [
      Math.round(listing.latitude * 100) / 100,
      Math.round(listing.longitude * 100) / 100
    ];
    const [lat, lng] = offsetCoordinate(rounded, listing.id, 0.02);

    return { ...listing, lat, lng };
  }

  const cityKey = `${listing.publicCity},${listing.publicState}`.toLowerCase();
  const cityCenter = cityCenters[cityKey];

  if (cityCenter) {
    const [lat, lng] = offsetCoordinate(cityCenter, listing.id, 0.04);
    return { ...listing, lat, lng };
  }

  const stateCenter = stateCenters[listing.publicState.toUpperCase()];

  if (stateCenter) {
    const [lat, lng] = offsetCoordinate(stateCenter, `${listing.publicCity}:${listing.id}`, 0.9);
    return { ...listing, lat, lng };
  }

  return null;
}

function pinPosition(point: MapPinPoint, bounds: { minLat: number; maxLat: number; minLng: number; maxLng: number }) {
  const latRange = bounds.maxLat - bounds.minLat || 1;
  const lngRange = bounds.maxLng - bounds.minLng || 1;

  return {
    left: `${((point.lng - bounds.minLng) / lngRange) * 88 + 6}%`,
    top: `${(1 - (point.lat - bounds.minLat) / latRange) * 78 + 11}%`
  };
}

function typeLabel(type: ApproximateMapListing["type"]) {
  return type === "sober_living" ? "Sober Living" : "Continued Care";
}

export function ApproximateLocationMap({ listings }: { listings: ApproximateMapListing[] }) {
  const points = listings.map(approximatePoint).filter((point): point is MapPinPoint => Boolean(point));
  const latitudes = points.map((point) => point.lat);
  const longitudes = points.map((point) => point.lng);
  const bounds = {
    minLat: Math.min(...latitudes) - 0.02,
    maxLat: Math.max(...latitudes) + 0.02,
    minLng: Math.min(...longitudes) - 0.02,
    maxLng: Math.max(...longitudes) + 0.02
  };

  return (
    <aside className="h-fit rounded-lg border border-border bg-white p-4 shadow-sm lg:sticky lg:top-24">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="font-semibold">Approximate locations</h2>
          <p className="mt-1 text-xs leading-5 text-muted-foreground">
            Pins show generalized city or area locations. Exact addresses stay private.
          </p>
        </div>
        <Badge>{points.length}</Badge>
      </div>

      <div className="relative mt-4 min-h-[320px] overflow-hidden rounded-md border border-border bg-[linear-gradient(90deg,rgba(15,23,42,0.08)_1px,transparent_1px),linear-gradient(rgba(15,23,42,0.08)_1px,transparent_1px)] bg-[size:44px_44px]">
        <div className="absolute inset-x-[-12%] top-[18%] h-10 rotate-[-10deg] bg-primary/10" />
        <div className="absolute bottom-[18%] left-[-10%] h-12 w-[125%] rotate-[16deg] bg-emerald-400/10" />
        <div className="absolute left-[18%] top-0 h-full w-12 rotate-[8deg] bg-muted/80" />
        {points.length ? (
          points.map((point, index) => (
            <Link
              key={point.id}
              aria-label={`View ${point.programName}`}
              className={cn(
                "focus-ring absolute flex size-9 -translate-x-1/2 -translate-y-full items-center justify-center rounded-full border-2 border-white text-white shadow-md",
                point.isAvailable ? "bg-emerald-600" : "bg-accent"
              )}
              href={`/profiles/${point.slug}`}
              style={pinPosition(point, bounds)}
              title={`${point.programName} - ${point.publicCity}, ${point.publicState}`}
            >
              <MapPin size={19} />
              <span className="absolute -right-1 -top-1 flex size-5 items-center justify-center rounded-full border border-white bg-foreground text-[10px] font-semibold text-background">
                {index + 1}
              </span>
            </Link>
          ))
        ) : (
          <div className="absolute inset-0 grid place-items-center p-6 text-center text-sm leading-6 text-muted-foreground">
            Location pins will appear once listings have public city and state data.
          </div>
        )}
      </div>

      {points.length ? (
        <div className="mt-4 grid gap-2">
          {points.slice(0, 8).map((point, index) => (
            <Link
              key={point.id}
              className="focus-ring grid grid-cols-[auto_1fr_auto] items-center gap-2 rounded-md border border-border p-2 text-sm hover:bg-muted"
              href={`/profiles/${point.slug}`}
            >
              <span className="flex size-6 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
                {index + 1}
              </span>
              <span className="min-w-0">
                <span className="block truncate font-semibold">{point.programName}</span>
                <span className="block truncate text-xs text-muted-foreground">
                  {point.publicCity}, {point.publicState}
                </span>
              </span>
              <span className="text-xs text-muted-foreground">{typeLabel(point.type)}</span>
            </Link>
          ))}
        </div>
      ) : null}
    </aside>
  );
}
