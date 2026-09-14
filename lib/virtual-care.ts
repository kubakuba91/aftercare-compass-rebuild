import { statesOperatedOptions } from "@/lib/referent-onboarding";

export const virtualStates = statesOperatedOptions;
export const virtualTimeZones = ["America/New_York", "America/Chicago", "America/Denver", "America/Phoenix", "America/Los_Angeles", "America/Anchorage", "Pacific/Honolulu"] as const;
export function isVirtualOnly(profile: { type?: string; telehealthMode?: string | null }) {
  return profile.type === "continued_care" && profile.telehealthMode === "Virtual only";
}
export function coverageLabel(states: readonly string[]) {
  return virtualStates.every((state) => states.includes(state)) ? "Nationwide (50 states + DC)" : states.join(", ");
}
export function requiredVirtualPlan(states: readonly string[], profiles: number, managers: number) {
  const count = new Set(states).size;
  if (count >= virtualStates.length || profiles > 5 || managers > 10) return "virtual_network";
  if (count > 1 || profiles > 1 || managers > 3) return "virtual_growth";
  return "virtual_basic";
}
export function virtualPlanCovers(plan: string, states: readonly string[], profiles: number, managers: number) {
  const plans = ["virtual_basic", "virtual_growth", "virtual_network"];
  return plans.indexOf(plan) >= plans.indexOf(requiredVirtualPlan(states, profiles, managers));
}
