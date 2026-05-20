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

export const stateCenters: Record<string, [number, number]> = {
  AL: [32.8067, -86.7911],
  AK: [61.3707, -152.4044],
  AZ: [33.7298, -111.4312],
  AR: [34.9697, -92.3731],
  CA: [36.1162, -119.6816],
  CO: [39.0598, -105.3111],
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
  TN: [35.5175, -86.5804],
  FL: [27.7663, -81.6868],
  GA: [33.0406, -83.6431],
  HI: [21.0943, -157.4983],
  ID: [44.2405, -114.4788],
  IL: [40.3495, -88.9861],
  IN: [39.8494, -86.2583],
  IA: [42.0115, -93.2105],
  KS: [38.5266, -96.7265],
  KY: [37.6681, -84.6701],
  LA: [31.1695, -91.8678],
  ME: [44.6939, -69.3819],
  MI: [43.3266, -84.5361],
  MN: [45.6945, -93.9002],
  MS: [32.7416, -89.6787],
  MO: [38.4561, -92.2884],
  MT: [46.9219, -110.4544],
  NE: [41.1254, -98.2681],
  NV: [38.3135, -117.0554],
  NH: [43.4525, -71.5639],
  NM: [34.8405, -106.2485],
  NC: [35.6301, -79.8064],
  ND: [47.5289, -99.784],
  OK: [35.5653, -96.9289],
  OR: [44.572, -122.0709],
  RI: [41.6809, -71.5118],
  SC: [33.8569, -80.945],
  SD: [44.2998, -99.4388],
  TX: [31.0545, -97.5635],
  UT: [40.15, -111.8624],
  VT: [44.0459, -72.7107],
  WA: [47.4009, -121.4905],
  WI: [44.2685, -89.6165],
  WY: [42.7559, -107.3025]
};

const stateAliases: Record<string, string> = {
  alabama: "AL",
  alaska: "AK",
  arizona: "AZ",
  arkansas: "AR",
  california: "CA",
  colorado: "CO",
  connecticut: "CT",
  delaware: "DE",
  "district of columbia": "DC",
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

  const stateCenter = stateCenters[normalizeState(location.publicState)];

  if (stateCenter) {
    const [lat, lng] = offsetCoordinate(stateCenter, location.id, 12000);
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

  const parts = normalized.split(" ");
  const queryParts = compactParts.length === 2 ? compactParts : parts;
  const stateCandidate = compactParts.length === 2 ? compactParts[1] : parts.at(-1) || "";
  const possibleState = normalizeState(stateCandidate);

  if (possibleState in stateCenters && queryParts.length === 1) {
    const stateCenter = stateCenters[possibleState];
    return { lat: stateCenter[0], lng: stateCenter[1] };
  }

  if (possibleState in stateCenters && queryParts.length > 1) {
    const stateCenter = stateCenters[possibleState];
    return { lat: stateCenter[0], lng: stateCenter[1] };
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
