import { cache } from "react";
import { prisma } from "@/lib/prisma";

// Restrict metadata queries to published profiles and public-facing fields.
export const getPublishedSeoProfile = cache((slug: string) => prisma.aftercareProfile.findFirst({
  where: { slug, status: "published" },
  select: {
    slug: true, programName: true, type: true, publicCity: true, publicState: true,
    telehealthMode: true, statesServed: true, description: true, levelsOfCare: true,
    admissionsContactPhone: true
  }
}));
