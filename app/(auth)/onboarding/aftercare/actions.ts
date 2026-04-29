"use server";

import { redirect } from "next/navigation";
import { ProfileStatus, ProfileType } from "@prisma/client";
import { hasDatabaseConfig } from "@/lib/database-status";
import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/slug";
import { ensureOnboardingOrganization } from "@/lib/onboarding";
import { aftercareProfileDraftSchema } from "@/lib/validations/onboarding";

export async function createAftercareProfileDraft(formData: FormData) {
  if (!hasDatabaseConfig()) {
    redirect("/setup?missing=database");
  }

  const parsed = aftercareProfileDraftSchema.parse({
    profileType: formData.get("profileType"),
    programName: formData.get("programName"),
    streetAddress: formData.get("streetAddress"),
    city: formData.get("city"),
    state: formData.get("state"),
    zip: formData.get("zip"),
    admissionsContactPhone: formData.get("admissionsContactPhone"),
    admissionsContactEmail: formData.get("admissionsContactEmail"),
    description: formData.get("description"),
    populationServed: formData.get("populationServed"),
    totalBeds: formData.get("totalBeds") || undefined,
    bedsAvailable: formData.get("bedsAvailable") || undefined,
    acceptingNewPatients: formData.get("acceptingNewPatients") || undefined
  });

  const profileType =
    parsed.profileType === "sober_living" ? ProfileType.sober_living : ProfileType.continued_care;
  const baseSlug = slugify(parsed.programName);
  const slug = `${baseSlug}-${Date.now().toString(36)}`;

  let destination: string;

  try {
    const organization = await ensureOnboardingOrganization(parsed.profileType);
    const profile = await prisma.aftercareProfile.create({
      data: {
        orgId: organization.orgId,
        type: profileType,
        programName: parsed.programName,
        slug,
        status: ProfileStatus.draft,
        streetAddress: parsed.streetAddress,
        city: parsed.city,
        state: parsed.state,
        zip: parsed.zip,
        publicCity: parsed.city,
        publicState: parsed.state,
        admissionsContactPhone: parsed.admissionsContactPhone,
        admissionsContactEmail: parsed.admissionsContactEmail,
        description: parsed.description,
        populationServed: parsed.populationServed,
        totalBeds: profileType === ProfileType.sober_living ? parsed.totalBeds : null,
        bedsAvailable: profileType === ProfileType.sober_living ? parsed.bedsAvailable : null,
        bedsAvailableUpdatedAt: profileType === ProfileType.sober_living ? new Date() : null,
        acceptingNewPatients:
          profileType === ProfileType.continued_care ? parsed.acceptingNewPatients === "yes" : null,
        acceptingNewPatientsUpdatedAt:
          profileType === ProfileType.continued_care ? new Date() : null
      },
      select: { id: true }
    });

    destination = `/dashboard/aftercare?profile=${profile.id}`;
  } catch (error) {
    console.error("Aftercare profile draft creation failed", error);
    redirect("/setup?missing=database&from=aftercare-profile");
  }

  redirect(destination);
}
