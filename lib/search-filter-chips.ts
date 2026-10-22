export function removeSearchFilterHref(
  query: Record<string, string | string[] | undefined>,
  key: string,
  value?: string
) {
  const params = new URLSearchParams();
  for (const [name, raw] of Object.entries(query)) {
    if (["page", "selected"].includes(name) || (key === "delivery" && name === "virtualState")) continue;
    const values = Array.isArray(raw) ? raw : raw ? [raw] : [];
    for (const item of values) {
      if (name === key && (value === undefined || item === value)) continue;
      params.append(name, item);
    }
  }
  return `/search?${params.toString()}`;
}
