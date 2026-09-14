/** Only allow profile claim destinations through the authentication flow. */
export function claimReturnPath(value: string | string[] | undefined): string | null {
  if (typeof value !== "string" || !value.startsWith("/")) return null;
  const base = "https://claim-return.invalid";
  try {
    const url = new URL(value, base);
    if (url.origin !== base || !/^\/profiles\/[a-zA-Z0-9_-]+$/.test(url.pathname)) return null;
    if (!url.searchParams.get("claim") && !url.searchParams.get("claimToken")) return null;
    return `${url.pathname}${url.search}#claim`;
  } catch {
    return null;
  }
}
