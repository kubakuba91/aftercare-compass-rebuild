import { prisma } from "@/lib/prisma";
import { programTypeOptions } from "@/lib/continued-care-onboarding";
import { levelsOfCareOptions } from "@/lib/levels-of-care";
import {
  amenityOptions,
  certificationOptions,
  insuranceOptions,
  matOptions,
  populationOptions,
  specialtyPopulationOptions,
  supportServiceOptions
} from "@/lib/sober-living-onboarding";

export const accreditationOptions = [
  "CARF",
  "The Joint Commission",
  "LegitScript",
  "NAATP",
  "ASAM Level of Care Certification"
] as const;

export const clinicalFocusOptions = [
  "SUD",
  "Mental Health",
  "Co-occurring/Dual Diagnosis",
  "Co-occurring Mental Health + SUD"
] as const;

export const profileOptionCategories = {
  certificationsHeld: {
    label: "Certifications held",
    description: "Certifications available in onboarding and profile editors.",
    defaults: certificationOptions
  },
  accreditations: {
    label: "Accreditations",
    description: "Accreditations available in onboarding and profile editors.",
    defaults: accreditationOptions
  },
  clinicalFocus: {
    label: "Clinical focus",
    description: "Clinical focus options available in onboarding and profile editors.",
    defaults: clinicalFocusOptions
  },
  levelsOfCare: {
    label: "Levels of care",
    description: "Levels of care available in continued care and referent onboarding.",
    defaults: levelsOfCareOptions
  },
  programTypes: {
    label: "Program types",
    description: "Continued care program types available in onboarding and profile editors.",
    defaults: programTypeOptions
  },
  populationServed: {
    label: "Population served",
    description: "Population options available in onboarding and profile editors.",
    defaults: populationOptions
  },
  specialtyPopulations: {
    label: "Specialty populations",
    description: "Specialty population options available in onboarding and profile editors.",
    defaults: specialtyPopulationOptions
  },
  matAccepted: {
    label: "MAT accepted",
    description: "Medication-assisted treatment options available in onboarding and profile editors.",
    defaults: matOptions
  },
  supportServices: {
    label: "Support services",
    description: "Services homes and programs can select for public profile display.",
    defaults: supportServiceOptions
  },
  amenities: {
    label: "Amenities",
    description: "Sober living housing amenities available for selection.",
    defaults: amenityOptions
  },
  insuranceAccepted: {
    label: "Insurance/payment accepted",
    description: "Payment and insurance options homes and programs can select.",
    defaults: insuranceOptions
  }
} as const;

export type ProfileOptionCategory = keyof typeof profileOptionCategories;

export function profileOptionCategoryKeys() {
  return Object.keys(profileOptionCategories) as ProfileOptionCategory[];
}

function uniqueValues(values: string[]) {
  return Array.from(new Set(values.map((value) => value.trim()).filter(Boolean)));
}

export function mergeOptionValues(activeOptions: readonly string[], selectedOptions: readonly string[] = []) {
  return uniqueValues([...activeOptions, ...selectedOptions]);
}

export async function getProfileOptionGroups({ includeInactive = false } = {}) {
  const categories = profileOptionCategoryKeys();
  const rows = await prisma.profileOption.findMany({
    where: {
      category: { in: categories }
    },
    orderBy: [{ category: "asc" }, { sortOrder: "asc" }, { label: "asc" }]
  });

  return Object.fromEntries(
    categories.map((category) => {
      const rowsForCategory = rows.filter((row) => row.category === category);
      const visibleRowsForCategory = includeInactive
        ? rowsForCategory
        : rowsForCategory.filter((row) => row.isActive);
      const rowLabels = new Set(rowsForCategory.map((row) => row.label.toLowerCase()));
      const defaultOptions = profileOptionCategories[category].defaults
        .map((label, index) => ({
          id: `default-${category}-${index}`,
          category,
          label,
          isActive: true,
          sortOrder: (index + 1) * 10
        }))
        .filter((option) => !rowLabels.has(option.label.toLowerCase()));

      const options = [...defaultOptions, ...visibleRowsForCategory].sort((first, second) => {
        if (first.isActive !== second.isActive) {
          return first.isActive ? -1 : 1;
        }

        if (first.sortOrder !== second.sortOrder) {
          return first.sortOrder - second.sortOrder;
        }

        return first.label.localeCompare(second.label);
      });

      return [category, options];
    })
  ) as Record<
    ProfileOptionCategory,
    Array<{ id: string; category: string; label: string; isActive: boolean; sortOrder: number }>
  >;
}

export async function getActiveProfileOptionValues() {
  const groups = await getProfileOptionGroups();

  return Object.fromEntries(
    profileOptionCategoryKeys().map((category) => [
      category,
      groups[category].filter((option) => option.isActive).map((option) => option.label)
    ])
  ) as Record<ProfileOptionCategory, string[]>;
}
