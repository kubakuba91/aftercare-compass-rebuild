import { prisma } from "@/lib/prisma";
import {
  amenityOptions,
  certificationOptions,
  insuranceOptions,
  supportServiceOptions
} from "@/lib/sober-living-onboarding";

export const profileOptionCategories = {
  certificationsHeld: {
    label: "Certifications held",
    description: "Accreditations and certifications available in onboarding and profile editors.",
    defaults: certificationOptions
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
      category: { in: categories },
      ...(includeInactive ? {} : { isActive: true })
    },
    orderBy: [{ category: "asc" }, { sortOrder: "asc" }, { label: "asc" }]
  });

  return Object.fromEntries(
    categories.map((category) => {
      const rowsForCategory = rows.filter((row) => row.category === category);

      if (!rowsForCategory.length) {
        return [
          category,
          profileOptionCategories[category].defaults.map((label, index) => ({
            id: `default-${category}-${index}`,
            category,
            label,
            isActive: true,
            sortOrder: (index + 1) * 10
          }))
        ];
      }

      return [category, rowsForCategory];
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
