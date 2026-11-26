import { cookies, headers } from "next/headers";
import { RESOURCE_STATE_COOKIE, resolveResourceState } from "@/lib/resources/state-choice";

/** Read the visitor's state choice. Does not log or persist the IP or the geo headers. */
export async function requestResourceState(knownStates: readonly string[], urlState?: string | null) {
  const [headerStore, cookieStore] = await Promise.all([headers(), cookies()]);
  return resolveResourceState({
    urlState,
    savedState: cookieStore.get(RESOURCE_STATE_COOKIE)?.value,
    country: headerStore.get("x-vercel-ip-country"),
    region: headerStore.get("x-vercel-ip-country-region"),
    knownStates
  });
}
