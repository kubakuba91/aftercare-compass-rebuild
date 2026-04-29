"use server";

import { redirect } from "next/navigation";
import { ProfileStatus, ProfileType } from "@prisma/client";
import { hasDatabaseConfig } from "@/lib/database-status";
import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/slug";
import { ensureOnboardingOrganization } from "@/lib/onboarding";
import {
  maxSoberLivingStep,
  nullableText,
  stepFiveSchema,
  stepFourSchema,
  stepOneSchema,
  stepThreeSchema,
  stepTwoSchema,
  valuesFromForm
} from "@/lib/sober-living-onboarding";
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

function stepRedirect(step: number, profileId: string, error?: string) {
  const params = new URLSearchParams({ profileId });

  if (error) {
    params.set("error", error);
  }

  return `/onboarding/aftercare/sober-living/${step}?${params.toString()}`;
}

async function requireOwnedSoberLivingProfile(profileId: string, orgId: string) {
  const profile = await prisma.aftercareProfile.findFirst({
    where: {
      id: profileId,
      orgId,
      type: ProfileType.sober_living
    },
    select: { id: true }
  });

  if (!profile) {
    redirect("/dashboard/aftercare");
  }

  return profile;
}

export async function saveSoberLivingOnboardingStep(step: number, formData: FormData) {
  if (!hasDatabaseConfig()) {
    redirect("/setup?missing=database");
  }

  const intent = String(formData.get("intent") || "continue");
  let destination = "/dashboard/aftercare";

  try {
    const organization = await ensureOnboardingOrganization("sober_living");

    if (step === 1) {
      const parsed = stepOneSchema.parse({
        programName: formData.get("programName"),
        streetAddress: formData.get("streetAddress"),
        city: formData.get("city"),
        state: formData.get("state"),
        zip: formData.get("zip"),
        admissionsContactPhone: formData.get("admissionsContactPhone"),
        admissionsContactEmail: formData.get("admissionsContactEmail"),
        websiteUrl: formData.get("websiteUrl") || undefined,
        populationServed: valuesFromForm(formData, "populationServed"),
        specialtyPopulations: valuesFromForm(formData, "specialtyPopulations"),
        certificationsHeld: valuesFromForm(formData, "certificationsHeld"),
        averageLengthOfStay: formData.get("averageLengthOfStay")
      });

      const existingProfileId = String(formData.get("profileId") || "");
      const existingProfile = existingProfileId
        ? await requireOwnedSoberLivingProfile(existingProfileId, organization.orgId)
        : null;

      const slug = `${slugify(parsed.programName)}-${Date.now().toString(36)}`;
      const profile = existingProfile
        ? await prisma.aftercareProfile.update({
            where: { id: existingProfile.id },
            data: {
              programName: parsed.programName,
              streetAddress: parsed.streetAddress,
              city: parsed.city,
              state: parsed.state,
              zip: parsed.zip,
              publicCity: parsed.city,
              publicState: parsed.state,
              admissionsContactPhone: parsed.admissionsContactPhone,
              admissionsContactEmail: parsed.admissionsContactEmail,
              websiteUrl: nullableText(parsed.websiteUrl),
              populationServed: parsed.populationServed.join(", "),
              populationServedOptions: parsed.populationServed,
              specialtyPopulations: parsed.specialtyPopulations,
              certificationsHeld: parsed.certificationsHeld,
              averageLengthOfStay: parsed.averageLengthOfStay,
              onboardingStep: 2
            },
            select: { id: true }
          })
        : await prisma.aftercareProfile.create({
            data: {
              orgId: organization.orgId,
              type: ProfileType.sober_living,
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
              websiteUrl: nullableText(parsed.websiteUrl),
              populationServed: parsed.populationServed.join(", "),
              populationServedOptions: parsed.populationServed,
              specialtyPopulations: parsed.specialtyPopulations,
              certificationsHeld: parsed.certificationsHeld,
              averageLengthOfStay: parsed.averageLengthOfStay,
              onboardingStep: 2
            },
            select: { id: true }
          });

      destination = intent === "save" ? "/dashboard/aftercare" : stepRedirect(2, profile.id);
    }

    if (step === 2) {
      const parsed = stepTwoSchema.parse({
        profileId: formData.get("profileId"),
        totalBeds: formData.get("totalBeds"),
        bedsAvailable: formData.get("bedsAvailable"),
        bedsMen: formData.get("bedsMen"),
        bedsWomen: formData.get("bedsWomen"),
        bedsLgbtq: formData.get("bedsLgbtq"),
        roomTypes: valuesFromForm(formData, "roomTypes"),
        bedsReservedNotes: formData.get("bedsReservedNotes") || undefined,
        wheelchairAccessible: formData.get("wheelchairAccessible"),
        wheelchairAccessibleBeds: formData.get("wheelchairAccessibleBeds") || undefined,
        pricePerWeek: formData.get("pricePerWeek")
      });

      await requireOwnedSoberLivingProfile(parsed.profileId, organization.orgId);
      await prisma.aftercareProfile.update({
        where: { id: parsed.profileId },
        data: {
          totalBeds: parsed.totalBeds,
          bedsAvailable: parsed.bedsAvailable,
          bedsAvailableUpdatedAt: new Date(),
          bedsMen: parsed.bedsMen,
          bedsWomen: parsed.bedsWomen,
          bedsLgbtq: parsed.bedsLgbtq,
          roomTypes: parsed.roomTypes,
          bedsReservedNotes: nullableText(parsed.bedsReservedNotes),
          wheelchairAccessibleBeds:
            parsed.wheelchairAccessible === "yes" ? parsed.wheelchairAccessibleBeds ?? 0 : null,
          pricePerWeek: parsed.pricePerWeek,
          onboardingStep: 3
        }
      });

      destination = intent === "save" ? "/dashboard/aftercare" : stepRedirect(3, parsed.profileId);
    }

    if (step === 3) {
      const parsed = stepThreeSchema.parse({
        profileId: formData.get("profileId"),
        supportServices: valuesFromForm(formData, "supportServices"),
        amenities: valuesFromForm(formData, "amenities"),
        insuranceAccepted: valuesFromForm(formData, "insuranceAccepted"),
        fundingAvailable: formData.get("fundingAvailable"),
        fundingNotes: formData.get("fundingNotes") || undefined,
        medicationAdministration: formData.get("medicationAdministration"),
        matAccepted: valuesFromForm(formData, "matAccepted"),
        medicationRestrictions: formData.get("medicationRestrictions") || undefined,
        drugTestingPolicy: formData.get("drugTestingPolicy")
      });

      await requireOwnedSoberLivingProfile(parsed.profileId, organization.orgId);
      await prisma.aftercareProfile.update({
        where: { id: parsed.profileId },
        data: {
          supportServices: parsed.supportServices,
          amenities: parsed.amenities,
          insuranceAccepted: parsed.insuranceAccepted,
          fundingAvailable: parsed.fundingAvailable === "yes",
          fundingNotes: nullableText(parsed.fundingNotes),
          medicationAdministration: parsed.medicationAdministration,
          matAccepted: parsed.matAccepted,
          medicationRestrictions: nullableText(parsed.medicationRestrictions),
          drugTestingPolicy: parsed.drugTestingPolicy,
          onboardingStep: 4
        }
      });

      destination = intent === "save" ? "/dashboard/aftercare" : stepRedirect(4, parsed.profileId);
    }

    if (step === 4) {
      const parsed = stepFourSchema.parse({
        profileId: formData.get("profileId"),
        description: formData.get("description"),
        houseRulesText: formData.get("houseRulesText") || undefined,
        photoReadiness: valuesFromForm(formData, "photoReadiness"),
        videoUrls: valuesFromForm(formData, "videoUrls"),
        preferredContactMethod: formData.get("preferredContactMethod")
      });

      await requireOwnedSoberLivingProfile(parsed.profileId, organization.orgId);
      await prisma.aftercareProfile.update({
        where: { id: parsed.profileId },
        data: {
          description: parsed.description,
          houseRulesText: nullableText(parsed.houseRulesText),
          photoReadiness: parsed.photoReadiness,
          videoUrls: parsed.videoUrls,
          preferredContactMethod: parsed.preferredContactMethod,
          onboardingStep: 5
        }
      });

      destination = intent === "save" ? "/dashboard/aftercare" : stepRedirect(5, parsed.profileId);
    }

    if (step === 5) {
      const parsed = stepFiveSchema.parse({
        profileId: formData.get("profileId"),
        availabilityNotes: formData.get("availabilityNotes") || undefined,
        referralFitNotes: formData.get("referralFitNotes") || undefined,
        goodNeighborPolicyAcknowledged: formData.get("goodNeighborPolicyAcknowledged")
      });

      await requireOwnedSoberLivingProfile(parsed.profileId, organization.orgId);
      await prisma.aftercareProfile.update({
        where: { id: parsed.profileId },
        data: {
          availabilityNotes: nullableText(parsed.availabilityNotes),
          referralFitNotes: nullableText(parsed.referralFitNotes),
          goodNeighborPolicyAcknowledged: true,
          onboardingStep: maxSoberLivingStep,
          onboardingCompletedAt: new Date()
        }
      });

      destination = "/dashboard/aftercare";
    }
  } catch (error) {
    console.error("Sober living onboarding step save failed", error);
    const profileId = String(formData.get("profileId") || "");
    destination = profileId
      ? stepRedirect(step, profileId, "Please check the highlighted fields and try again.")
      : `/onboarding/aftercare/sober-living/${step}?error=Please+check+the+fields+and+try+again.`;
  }

  redirect(destination);
}
