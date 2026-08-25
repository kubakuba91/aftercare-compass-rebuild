import { prisma } from "@/lib/prisma";

export const searchFilterDefinitions = {
  population: {
    label: "Population served",
    description: "Who the home or program serves.",
    defaultSelectionMode: "multiple",
    configurableSelectionMode: true,
    showForSoberLiving: true,
    showForContinuedCare: true
  },
  price: {
    label: "Price",
    description: "Minimum and maximum weekly price.",
    defaultSelectionMode: "single",
    configurableSelectionMode: false,
    showForSoberLiving: true,
    showForContinuedCare: false
  },
  distance: {
    label: "Distance",
    description: "Distance from the searched city or location.",
    defaultSelectionMode: "single",
    configurableSelectionMode: false,
    showForSoberLiving: true,
    showForContinuedCare: true
  },
  duration: {
    label: "Program duration",
    description: "Average program or length-of-stay duration.",
    defaultSelectionMode: "single",
    configurableSelectionMode: true,
    showForSoberLiving: true,
    showForContinuedCare: true
  }
} as const;

export type SearchFilterKey = keyof typeof searchFilterDefinitions;
export type SearchFilterSelectionMode = "single" | "multiple";
export type SearchFilterSettingRow = {
  id: string;
  key: SearchFilterKey;
  label: string;
  isActive: boolean;
  isRequired: boolean;
  selectionMode: SearchFilterSelectionMode;
  showForSoberLiving: boolean;
  showForContinuedCare: boolean;
  sortOrder: number;
};

export function searchFilterKeys() {
  return Object.keys(searchFilterDefinitions) as SearchFilterKey[];
}

export function isSearchFilterKey(value: string): value is SearchFilterKey {
  return searchFilterKeys().includes(value as SearchFilterKey);
}

export function isSearchFilterSelectionMode(value: string): value is SearchFilterSelectionMode {
  return value === "single" || value === "multiple";
}

export function defaultSearchFilterSetting(key: SearchFilterKey, index = searchFilterKeys().indexOf(key)): SearchFilterSettingRow {
  const definition = searchFilterDefinitions[key];

  return {
    id: `default-search-filter-${key}`,
    key,
    label: definition.label,
    isActive: true,
    isRequired: false,
    selectionMode: definition.defaultSelectionMode,
    showForSoberLiving: definition.showForSoberLiving,
    showForContinuedCare: definition.showForContinuedCare,
    sortOrder: (index + 1) * 10
  };
}

export async function getSearchFilterSettings({
  includeInactive = true,
  profileType
}: {
  includeInactive?: boolean;
  profileType?: "sober_living" | "continued_care";
} = {}) {
  const keys = searchFilterKeys();
  const stored = await prisma.searchFilterSetting.findMany({
    where: { key: { in: keys } },
    orderBy: [{ sortOrder: "asc" }, { label: "asc" }]
  });
  const storedByKey = new Map(stored.map((setting) => [setting.key, setting]));

  return keys
    .map((key, index) => {
      const fallback = defaultSearchFilterSetting(key, index);
      const setting = storedByKey.get(key);

      if (!setting) {
        return fallback;
      }

      return {
        id: setting.id,
        key,
        label: setting.label,
        isActive: setting.isActive,
        isRequired: setting.isRequired,
        selectionMode: isSearchFilterSelectionMode(setting.selectionMode)
          ? setting.selectionMode
          : fallback.selectionMode,
        showForSoberLiving: setting.showForSoberLiving,
        showForContinuedCare: setting.showForContinuedCare,
        sortOrder: setting.sortOrder
      } satisfies SearchFilterSettingRow;
    })
    .filter((setting) => includeInactive || setting.isActive)
    .filter((setting) => profileType === "sober_living"
      ? setting.showForSoberLiving
      : profileType === "continued_care"
        ? setting.showForContinuedCare
        : true)
    .sort((first, second) => first.sortOrder - second.sortOrder || first.label.localeCompare(second.label));
}
