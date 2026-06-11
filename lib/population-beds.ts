export const canonicalPopulationBedFields = {
  Men: {
    totalName: "bedsMen",
    availableName: "bedsMenAvailable"
  },
  Women: {
    totalName: "bedsWomen",
    availableName: "bedsWomenAvailable"
  },
  "LGBTQ+": {
    totalName: "bedsLgbtq",
    availableName: "bedsLgbtqAvailable"
  }
} as const;

type NumberFromForm = (value: FormDataEntryValue | null) => number | null;

export type PopulationBedValues = {
  bedsAvailable: number | null;
  bedsLgbtq: number | null;
  bedsLgbtqAvailable: number | null;
  bedsMen: number | null;
  bedsMenAvailable: number | null;
  bedsWomen: number | null;
  bedsWomenAvailable: number | null;
  totalBeds: number | null;
};

export function populationBedFieldNames(label: string) {
  return {
    totalName: `populationBedTotal:${label}`,
    availableName: `populationBedAvailable:${label}`
  };
}

export function selectedPopulationBedValue(
  label: string,
  selectedPopulations: readonly string[],
  values: PopulationBedValues,
  kind: "total" | "available"
) {
  const canonicalFields = canonicalPopulationBedFields[label as keyof typeof canonicalPopulationBedFields];

  if (canonicalFields) {
    return values[kind === "total" ? canonicalFields.totalName : canonicalFields.availableName] ?? 0;
  }

  const knownTotal = Object.entries(canonicalPopulationBedFields).reduce((sum, [population, fields]) => {
    if (!selectedPopulations.includes(population)) {
      return sum;
    }

    return sum + (values[kind === "total" ? fields.totalName : fields.availableName] ?? 0);
  }, 0);
  const remaining = Math.max(0, (values[kind === "total" ? "totalBeds" : "bedsAvailable"] ?? 0) - knownTotal);
  const customPopulations = selectedPopulations.filter((population) => !(population in canonicalPopulationBedFields));

  return customPopulations[0] === label ? remaining : 0;
}

export function populationBedTotalsFromForm(
  formData: FormData,
  populationServedOptions: readonly string[],
  numberFromForm: NumberFromForm
) {
  let totalBeds = 0;
  let bedsAvailable = 0;
  let hasInvalidAvailableBeds = false;
  const canonicalValues = {
    bedsMen: 0,
    bedsMenAvailable: 0,
    bedsWomen: 0,
    bedsWomenAvailable: 0,
    bedsLgbtq: 0,
    bedsLgbtqAvailable: 0
  };

  for (const population of populationServedOptions) {
    const dynamicFields = populationBedFieldNames(population);
    const canonicalFields = canonicalPopulationBedFields[population as keyof typeof canonicalPopulationBedFields];
    const totalName = canonicalFields?.totalName ?? dynamicFields.totalName;
    const availableName = canonicalFields?.availableName ?? dynamicFields.availableName;
    const total = numberFromForm(formData.get(totalName)) ?? 0;
    const available = numberFromForm(formData.get(availableName)) ?? 0;

    if (available > total) {
      hasInvalidAvailableBeds = true;
    }

    totalBeds += total;
    bedsAvailable += available;

    if (canonicalFields) {
      canonicalValues[canonicalFields.totalName] = total;
      canonicalValues[canonicalFields.availableName] = available;
    }
  }

  return {
    ...canonicalValues,
    totalBeds,
    bedsAvailable,
    hasInvalidAvailableBeds
  };
}
