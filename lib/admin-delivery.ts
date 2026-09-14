import { virtualStates, virtualTimeZones } from "@/lib/virtual-care";

export function adminDeliveryData(type: string, form: FormData) {
  const mode = String(form.get("telehealthMode") || "In-person only");
  const virtual = type === "continued_care" && mode === "Virtual only";
  const states = [...new Set(form.getAll("statesServed").map(String))];
  const zone = String(form.get("programmingTimeZone") || "");
  let error: string | null = null;
  if (type === "continued_care" && !["In-person only", "Virtual only", "Hybrid"].includes(mode)) error = "Choose a valid delivery mode.";
  if (virtual && (!states.length || states.some((state) => !(virtualStates as readonly string[]).includes(state)))) error = "Select valid states served for the virtual program.";
  if (virtual && !(virtualTimeZones as readonly string[]).includes(zone)) error = "Select a programming time zone.";
  return { virtual, error, data: type === "continued_care" ? {
    telehealthMode: mode,
    statesServed: virtual ? states : [],
    programmingTimeZone: virtual ? zone : null,
    hoursOfOperation: String(form.get("hoursOfOperation") || "").trim() || null,
    insuranceNotes: String(form.get("insuranceNotes") || "").trim() || null,
    ...(virtual ? { streetAddress: null, city: "", state: "", zip: null, publicCity: "", publicState: "", latitude: null, longitude: null, publicLatitude: null, publicLongitude: null, geocodedAt: null, totalBeds: null, bedsAvailable: null } : {})
  } : { telehealthMode: undefined, statesServed: undefined } };
}
