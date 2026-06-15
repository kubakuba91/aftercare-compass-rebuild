export function normalizePhoneNumber(value: string) {
  const trimmed = value.trim();

  if (!trimmed) {
    return "";
  }

  const digits = trimmed.replace(/\D/g, "");

  if (digits.length === 10) {
    return `+1${digits}`;
  }

  if (digits.length === 11 && digits.startsWith("1")) {
    return `+${digits}`;
  }

  if (trimmed.startsWith("+") && digits.length >= 10) {
    return `+${digits}`;
  }

  return "";
}

export function formatPhoneForDisplay(value: string | null | undefined) {
  if (!value) {
    return "Not set";
  }

  const digits = value.replace(/\D/g, "");

  if (digits.length === 10) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  }

  if (digits.length === 11 && digits.startsWith("1")) {
    return `(${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7)}`;
  }

  return value;
}

export function normalizePhoneForStorage(value: FormDataEntryValue | string | null | undefined) {
  const text = String(value || "").trim();

  if (!text) {
    return null;
  }

  const normalized = normalizePhoneNumber(text);

  if (!normalized) {
    return null;
  }

  return formatPhoneForDisplay(normalized);
}
