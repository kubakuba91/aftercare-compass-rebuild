export function nullableText(value: FormDataEntryValue | string | null | undefined) {
  const text = String(value || "").trim();
  return text || null;
}

export function currencyText(value: FormDataEntryValue | string | null | undefined) {
  return String(value || "").replace(/^\s*\$\s*/, "").trim();
}

export function numberFromForm(value: FormDataEntryValue | null) {
  const text = currencyText(value);

  if (!text) {
    return null;
  }

  const parsed = Number(text);
  return Number.isFinite(parsed) ? Math.max(0, Math.trunc(parsed)) : null;
}

export function moveInCostText(value: FormDataEntryValue | string | null | undefined) {
  const text = currencyText(value);
  const match = text.match(/^\d+/);

  if (!match) {
    return null;
  }

  return `$${match[0]}`;
}

export function hasHumanTrapValue(formData: FormData | Record<string, unknown>) {
  if (formData instanceof FormData) {
    return Boolean(String(formData.get("companyWebsite") || "").trim());
  }

  return Boolean(String(formData.companyWebsite || "").trim());
}
