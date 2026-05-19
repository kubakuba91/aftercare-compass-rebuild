"use client";

import { useEffect, useMemo, useState } from "react";

type PopulationBedValues = {
  bedsLgbtq: number | null;
  bedsLgbtqAvailable: number | null;
  bedsMen: number | null;
  bedsMenAvailable: number | null;
  bedsWomen: number | null;
  bedsWomenAvailable: number | null;
};

type PopulationBedFieldsProps = {
  initialPopulations: string[];
  values: PopulationBedValues;
};

const bedFields = [
  {
    availableName: "bedsMenAvailable",
    availableValueName: "bedsMenAvailable",
    label: "Men",
    totalName: "bedsMen",
    totalValueName: "bedsMen"
  },
  {
    availableName: "bedsWomenAvailable",
    availableValueName: "bedsWomenAvailable",
    label: "Women",
    totalName: "bedsWomen",
    totalValueName: "bedsWomen"
  },
  {
    availableName: "bedsLgbtqAvailable",
    availableValueName: "bedsLgbtqAvailable",
    label: "LGBTQ+",
    totalName: "bedsLgbtq",
    totalValueName: "bedsLgbtq"
  }
] as const;

function fieldClassName() {
  return "min-h-11 rounded-md border border-border bg-white px-3 text-sm";
}

function labelClassName() {
  return "grid gap-2 text-sm font-medium";
}

export function PopulationBedFields({
  initialPopulations,
  values
}: PopulationBedFieldsProps) {
  const [selectedPopulations, setSelectedPopulations] = useState(initialPopulations);
  const selectedSet = useMemo(() => new Set(selectedPopulations), [selectedPopulations]);
  const visibleFields = bedFields.filter((field) => selectedSet.has(field.label));
  const hiddenFields = bedFields.filter((field) => !selectedSet.has(field.label));

  useEffect(() => {
    function handleMultiSelectChange(event: Event) {
      const detail = (event as CustomEvent<{ name?: string; values?: string[] }>).detail;

      if (detail?.name === "populationServedOptions") {
        setSelectedPopulations(detail.values ?? []);
      }
    }

    document.addEventListener("aftercare:multiselect-change", handleMultiSelectChange);
    return () => document.removeEventListener("aftercare:multiselect-change", handleMultiSelectChange);
  }, []);

  return (
    <div className="grid gap-3">
      {visibleFields.length ? (
        <div className="grid gap-4 md:grid-cols-3">
          {visibleFields.map((field) => (
            <div key={field.totalName} className="ac-panel-card p-4">
              <p className="font-semibold">{field.label}</p>
              <div className="mt-3 grid gap-3">
                <label className={labelClassName()}>
                  Total beds
                  <input
                    className={fieldClassName()}
                    defaultValue={Number(values[field.totalValueName] ?? 0)}
                    min="0"
                    name={field.totalName}
                    type="number"
                  />
                </label>
                <label className={labelClassName()}>
                  Available beds
                  <input
                    className={fieldClassName()}
                    defaultValue={Number(values[field.availableValueName] ?? 0)}
                    min="0"
                    name={field.availableName}
                    type="number"
                  />
                </label>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="ac-panel-card p-4 text-sm text-muted-foreground">
          Choose who this home serves in Profile content to set population-specific beds.
        </div>
      )}

      {hiddenFields.map((field) => (
        <span key={field.totalName} hidden>
          <input name={field.totalName} type="hidden" value="0" />
          <input name={field.availableName} type="hidden" value="0" />
        </span>
      ))}
    </div>
  );
}
