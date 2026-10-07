import type { Prisma } from "@prisma/client";

export const searchSortOptions = [
  { key: "updated", label: "Recently updated" },
  { key: "name-asc", label: "Name: A–Z" },
  { key: "name-desc", label: "Name: Z–A" },
  { key: "distance", label: "Nearest first" }
] as const;

export type SearchSort = typeof searchSortOptions[number]["key"];

export function normalizeSearchSort(value: string | undefined, canSortByDistance: boolean): SearchSort {
  return searchSortOptions.some((option) => option.key === value) && (value !== "distance" || canSortByDistance)
    ? value as SearchSort
    : "updated";
}

export function searchSortOrder(sort: SearchSort): Prisma.AftercareProfileOrderByWithRelationInput[] {
  if (sort === "name-asc" || sort === "name-desc") {
    return [{ programName: sort === "name-asc" ? "asc" : "desc" }, { id: "asc" }];
  }
  return [{ updatedAt: "desc" }, { id: "asc" }];
}
