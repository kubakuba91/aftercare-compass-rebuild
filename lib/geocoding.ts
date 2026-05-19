import { offsetCoordinate } from "@/lib/public-location";

type GeocodedCoordinates = {
  latitude: number;
  longitude: number;
  publicLatitude: number;
  publicLongitude: number;
  geocodedAt: Date;
};

type GoogleGeocodeResult = {
  status: string;
  results?: Array<{
    geometry?: {
      location?: {
        lat?: number;
        lng?: number;
      };
    };
  }>;
};

const GOOGLE_GEOCODING_URL = "https://maps.googleapis.com/maps/api/geocode/json";

function googleMapsApiKey() {
  return process.env.GOOGLE_MAPS_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "";
}

function compactAddress(parts: Array<string | null | undefined>) {
  return parts
    .map((part) => String(part || "").trim())
    .filter(Boolean)
    .join(", ");
}

async function geocodeAddress(address: string) {
  const apiKey = googleMapsApiKey();

  if (!apiKey || !address) {
    return null;
  }

  try {
    const url = new URL(GOOGLE_GEOCODING_URL);
    url.searchParams.set("address", address);
    url.searchParams.set("key", apiKey);

    const response = await fetch(url, {
      cache: "no-store"
    });

    if (!response.ok) {
      console.error("Google geocoding request failed", response.status);
      return null;
    }

    const payload = (await response.json()) as GoogleGeocodeResult;
    const location = payload.results?.[0]?.geometry?.location;

    if (payload.status !== "OK" || typeof location?.lat !== "number" || typeof location.lng !== "number") {
      console.error("Google geocoding returned no usable result", payload.status);
      return null;
    }

    return {
      latitude: location.lat,
      longitude: location.lng
    };
  } catch (error) {
    console.error("Google geocoding failed", error);
    return null;
  }
}

export async function geocodeProfileAddress(input: {
  idSeed: string;
  streetAddress?: string | null;
  city?: string | null;
  state?: string | null;
  zip?: string | null;
}): Promise<GeocodedCoordinates | null> {
  const address = compactAddress([input.streetAddress, input.city, input.state, input.zip]);
  const coordinates = await geocodeAddress(address);

  if (!coordinates) {
    return null;
  }

  const [publicLatitude, publicLongitude] = offsetCoordinate(
    [coordinates.latitude, coordinates.longitude],
    input.idSeed
  );

  return {
    ...coordinates,
    publicLatitude,
    publicLongitude,
    geocodedAt: new Date()
  };
}

export function resetProfileCoordinates() {
  return {
    latitude: null,
    longitude: null,
    publicLatitude: null,
    publicLongitude: null,
    geocodedAt: null
  };
}

export async function geocodeSearchQuery(query: string): Promise<{ lat: number; lng: number } | null> {
  const coordinates = await geocodeAddress(query);

  if (!coordinates) {
    return null;
  }

  return {
    lat: coordinates.latitude,
    lng: coordinates.longitude
  };
}
