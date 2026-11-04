import type { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";
import { hasValidDatabaseUrl } from "@/lib/database-status";
import { publicSeoUrl } from "@/lib/profile-seo";

// Query at request time so newly published or unpublished profiles are reflected automatically.
export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const profiles = hasValidDatabaseUrl() ? await prisma.aftercareProfile.findMany({
    where: { status: "published" },
    select: { slug: true, updatedAt: true },
    orderBy: { slug: "asc" }
  }) : [];
  const publicPages = ["/", "/search", "/about", "/for-case-managers", "/for-providers", "/resources", "/pricing", "/contact"];
  return [
    ...publicPages.map(path => ({ url: publicSeoUrl(path) })),
    ...profiles.map(profile => ({
      url: publicSeoUrl(`/profiles/${encodeURIComponent(profile.slug)}`),
      lastModified: profile.updatedAt
    }))
  ];
}
