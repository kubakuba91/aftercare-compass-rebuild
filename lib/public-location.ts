export type PublicLocationInput = {
  id: string;
  publicCity: string;
  publicState: string;
  latitude: number | null;
  longitude: number | null;
  publicLatitude?: number | null;
  publicLongitude?: number | null;
};

export type PublicPoint = PublicLocationInput & {
  lat: number;
  lng: number;
};

export const cityCenters: Record<string, [number, number]> = {
  "harrisburg,pa": [40.2732, -76.8867],
  "lancaster,pa": [40.0379, -76.3055],
  "philadelphia,pa": [39.9526, -75.1652],
  "pittsburgh,pa": [40.4406, -79.9959],
  "allentown,pa": [40.6023, -75.4714],
  "reading,pa": [40.3356, -75.9269],
  "york,pa": [39.9626, -76.7277],
  "wayne,pa": [40.044, -75.3877],
  "honey brook,pa": [40.0943, -75.9119],
  "west chester,pa": [39.9607, -75.6055],
  "king of prussia,pa": [40.1013, -75.3836],
  "nashville,tn": [36.1627, -86.7816]
};

export const stateCenters: Record<string, [number, number]> = {
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
  DC: [38.9072, -77.0369],
  TN: [35.5175, -86.5804]
};

const stateAliases: Record<string, string> = {
  connecticut: "CT",
  delaware: "DE",
  "district of columbia": "DC",
  maryland: "MD",
  massachusetts: "MA",
  "new jersey": "NJ",
  "new york": "NY",
  ohio: "OH",
  pennsylvania: "PA",
  tennessee: "TN",
  virginia: "VA",
  "west virginia": "WV"
};

const METERS_PER_DEGREE_LATITUDE = 111320;
const DEFAULT_PUBLIC_PIN_RADIUS_METERS = 240;

export function hashNumber(value: string) {
  let hash = 0;

  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) % 100000;
  }

  return hash / 100000;
}

export function normalizeState(value: string) {
  const normalized = value.replace(/\./g, "").replace(/\s+/g, " ").trim().toLowerCase();
  return stateAliases[normalized] || normalized.toUpperCase();
}

function cityStateKey(city: string, state: string) {
  return `${city.replace(/\s+/g, " ").trim().toLowerCase()},${normalizeState(state).toLowerCase()}`;
}

export function offsetCoordinate(
  [lat, lng]: [number, number],
  seed: string,
  radiusMeters = DEFAULT_PUBLIC_PIN_RADIUS_METERS
) {
  const angle = hashNumber(`${seed}:angle`) * Math.PI * 2;
  const distance = radiusMeters * (0.35 + hashNumber(`${seed}:distance`) * 0.65);
  const latOffset = (Math.cos(angle) * distance) / METERS_PER_DEGREE_LATITUDE;
  const lngScale = METERS_PER_DEGREE_LATITUDE * Math.max(0.2, Math.cos((lat * Math.PI) / 180));
  const lngOffset = (Math.sin(angle) * distance) / lngScale;

  return [lat + latOffset, lng + lngOffset] as const;
}

export function approximatePublicPoint(location: PublicLocationInput): PublicPoint | null {
  if (
    location.publicLatitude !== null &&
    location.publicLatitude !== undefined &&
    location.publicLongitude !== null &&
    location.publicLongitude !== undefined
  ) {
    return { ...location, lat: location.publicLatitude, lng: location.publicLongitude };
  }

  if (location.latitude !== null && location.longitude !== null) {
    const [lat, lng] = offsetCoordinate([location.latitude, location.longitude], location.id);

    return { ...location, lat, lng };
  }

  const cityKey = cityStateKey(location.publicCity, location.publicState);
  const cityCenter = cityCenters[cityKey];

  if (cityCenter) {
    const [lat, lng] = offsetCoordinate(cityCenter, location.id);
    return { ...location, lat, lng };
  }

  return null;
}

export function searchCenterFromQuery(query: string): { lat: number; lng: number } | null {
  const normalized = query.replace(/\s+/g, " ").trim().toLowerCase();

  if (!normalized) {
    return null;
  }

  const compact = normalized.replace(/\s*,\s*/g, ",");
  const compactParts = compact.split(",");
  const normalizedCompact =
    compactParts.length === 2 ? `${compactParts[0]},${normalizeState(compactParts[1]).toLowerCase()}` : compact;
  const cityCenter = cityCenters[normalizedCompact];

  if (cityCenter) {
    return { lat: cityCenter[0], lng: cityCenter[1] };
  }

  const parts = normalized.split(" ");
  const possibleState = normalizeState(parts.at(-1) || "");

  if (possibleState in stateCenters && parts.length === 1) {
    const stateCenter = stateCenters[possibleState];
    return { lat: stateCenter[0], lng: stateCenter[1] };
  }

  if (possibleState in stateCenters && parts.length > 1) {
    const city = parts.slice(0, -1).join(" ");
    const cityStateCenter = cityCenters[cityStateKey(city, possibleState)];

    if (cityStateCenter) {
      return { lat: cityStateCenter[0], lng: cityStateCenter[1] };
    }
  }

  return null;
}

export function milesBetween(
  first: { lat: number; lng: number },
  second: { lat: number; lng: number }
) {
  const earthRadiusMiles = 3958.8;
  const toRadians = (degrees: number) => (degrees * Math.PI) / 180;
  const latDistance = toRadians(second.lat - first.lat);
  const lngDistance = toRadians(second.lng - first.lng);
  const startLat = toRadians(first.lat);
  const endLat = toRadians(second.lat);
  const a =
    Math.sin(latDistance / 2) ** 2 +
    Math.cos(startLat) * Math.cos(endLat) * Math.sin(lngDistance / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return earthRadiusMiles * c;
}
