"use client";

import { useEffect, useMemo, useState } from "react";
import {
  canonicalPopulationBedFields,
  populationBedFieldNames,
  selectedPopulationBedValue,
  type PopulationBedValues
} from "@/lib/population-beds";

type PopulationBedFieldsProps = {
  initialPopulations: string[];
  populationOptions: readonly string[];
  values: PopulationBedValues;
};

function fieldClassName() {
  return "min-h-11 rounded-md border border-border bg-white px-3 text-sm";
}

function labelClassName() {
  return "grid gap-2 text-sm font-medium";
}

export function PopulationBedFields({
  initialPopulations,
  populationOptions,
  values
}: PopulationBedFieldsProps) {
  const [selectedPopulations, setSelectedPopulations] = useState(initialPopulations);
  const orderedPopulationOptions = useMemo(() => {
    return Array.from(new Set([...populationOptions, ...initialPopulations]));
  }, [initialPopulations, populationOptions]);
  const selectedSet = useMemo(() => new Set(selectedPopulations), [selectedPopulations]);
  const visibleFields = orderedPopulationOptions.filter((population) => selectedSet.has(population));
  const hiddenCanonicalFields = Object.entries(canonicalPopulationBedFields).filter(([population]) => !selectedSet.has(population));

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
          {visibleFields.map((population) => {
            const canonicalFields = canonicalPopulationBedFields[population as keyof typeof canonicalPopulationBedFields];
            const dynamicFields = populationBedFieldNames(population);
            const totalName = canonicalFields?.totalName ?? dynamicFields.totalName;
            const availableName = canonicalFields?.availableName ?? dynamicFields.availableName;

            return (
              <div key={population} className="ac-panel-card p-4">
                <p className="font-semibold">{population}</p>
                <div className="mt-3 grid gap-3">
                  <label className={labelClassName()}>
                    Total beds
                    <input
                      className={fieldClassName()}
                      defaultValue={selectedPopulationBedValue(population, initialPopulations, values, "total")}
                      min="0"
                      name={totalName}
                      type="number"
                    />
                  </label>
                  <label className={labelClassName()}>
                    Available beds
                    <input
                      className={fieldClassName()}
                      defaultValue={selectedPopulationBedValue(population, initialPopulations, values, "available")}
                      min="0"
                      name={availableName}
                      type="number"
                    />
                  </label>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="ac-panel-card p-4 text-sm text-muted-foreground">
          Choose who this home serves in Profile content to set population-specific beds.
        </div>
      )}

      {hiddenCanonicalFields.map(([, field]) => (
        <span key={field.totalName} hidden>
          <input name={field.totalName} type="hidden" value="0" />
          <input name={field.availableName} type="hidden" value="0" />
        </span>
      ))}
    </div>
  );
}
