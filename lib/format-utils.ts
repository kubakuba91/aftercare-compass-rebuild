export function formatValue(
  value: string | null | undefined,
  {
    fallback = "Not provided",
    titleCase = false
  }: {
    fallback?: string;
    titleCase?: boolean;
  } = {}
) {
  const text = value?.trim();

  if (!text) {
    return fallback;
  }

  const normalized = text.replaceAll("_", " ");

  if (!titleCase) {
    return normalized;
  }

  return normalized
    .split(" ")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function formatDate(
  value: Date | null | undefined,
  {
    fallback = "Not set",
    options = {
      month: "short",
      day: "numeric",
      year: "numeric"
    }
  }: {
    fallback?: string;
    options?: Intl.DateTimeFormatOptions;
  } = {}
) {
  if (!value) {
    return fallback;
  }

  return new Intl.DateTimeFormat("en", options).format(value);
}
