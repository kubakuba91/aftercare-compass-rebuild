"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { Prisma, ProfileStatus, ProfileType, Role } from "@prisma/client";
import { hasDatabaseConfig } from "@/lib/database-status";
import { getAftercareProfileLimit, isWithinPlanLimit } from "@/lib/feature-gates";
import { currencyText, moveInCostText, numberFromForm } from "@/lib/form-utils";
import { geocodeProfileAddress } from "@/lib/geocoding";
import { imagesFromFormData, uploadProfileImagesForProfile } from "@/lib/profile-images";
import { getOrCreateOnboardingDraft } from "@/lib/onboarding";
import { populationBedTotalsFromForm } from "@/lib/population-beds";
import { normalizePhoneForStorage } from "@/lib/phone";
import { getProtectedAppUser } from "@/lib/protected-routing";
import { prisma } from "@/lib/prisma";
import { sanitizeRichText } from "@/lib/rich-text";
import { slugify } from "@/lib/slug";
import {
  continuedCareStepFiveSchema,
  continuedCareStepFourSchema,
  continuedCareStepOneSchema,
  continuedCareStepThreeSchema,
  continuedCareStepTwoSchema,
  maxContinuedCareStep
} from "@/lib/continued-care-onboarding";
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

const onboardingTransactionOptions = {
  maxWait: 5000,
  timeout: 15000
};

function mergeDraft(currentDraft: unknown, nextValues: Record<string, unknown>) {
  return {
    ...(currentDraft && typeof currentDraft === "object" && !Array.isArray(currentDraft) ? currentDraft : {}),
    ...nextValues
  };
}

function jsonDraft(value: Record<string, unknown>) {
  return value as Prisma.InputJsonValue;
}

function arrayFromDraft(value: unknown) {
  return Array.isArray(value) ? value.map(String) : [];
}


function stepRedirect(step: number, error?: string) {
  const params = new URLSearchParams();

  if (error) {
    params.set("error", error);
  }

  return `/onboarding/aftercare/sober-living/${step}${params.size ? `?${params.toString()}` : ""}`;
}

function continuedCareStepRedirect(step: number, error?: string) {
  const params = new URLSearchParams();

  if (error) {
    params.set("error", error);
  }

  return `/onboarding/aftercare/continued-care/${step}${params.size ? `?${params.toString()}` : ""}`;
}

function aftercareSubscriptionRedirect(message: string) {
  const params = new URLSearchParams({
    tab: "subscription",
    billingMessage: message
  });

  return `/dashboard/aftercare?${params.toString()}`;
}

function onboardingSaveErrorMessage(error: unknown) {
  if (error instanceof Error && error.message.startsWith("Invalid continued care intake phone:")) {
    return error.message.replace("Invalid continued care intake phone:", "").trim();
  }

  if (
    error instanceof Error &&
    error.message.includes("Transaction already closed") &&
    error.message.includes("expired transaction")
  ) {
    return "This save took a little too long. Your information is still on this page. Please try again, or upload fewer/smaller images first.";
  }

  if (
    error instanceof Error &&
    error.message.includes("Timed out fetching a new connection from the connection pool")
  ) {
    return "The upload service was busy for a moment. Your information is still on this page. Please try again.";
  }

  return "Please check the highlighted fields and try again.";
}

async function profileLimitMessageForExistingOrg(orgId: string | null) {
  if (!orgId) {
    return null;
  }

  const organization = await prisma.organization.findUnique({
    where: { id: orgId },
    select: {
      subscriptionPlan: true
    }
  });

  if (!organization) {
    return null;
  }

  const limit = getAftercareProfileLimit(organization.subscriptionPlan);
  const planCountedProfileCount = await prisma.aftercareProfile.count({
    where: {
      orgId,
      status: ProfileStatus.published
    }
  });

  if (!isWithinPlanLimit(limit, planCountedProfileCount)) {
    return "Your current plan has reached its profile limit. Upgrade to add another home or program.";
  }

  return null;
}

async function getOrCreateAftercareOrganization(tx: Prisma.TransactionClient, draft: Awaited<ReturnType<typeof getOrCreateOnboardingDraft>>, data: {
  accountType: "sober_living" | "continued_care";
  admissionsContactPhone?: string;
  programName: string;
}) {
  if (draft.user.orgId) {
    return draft.user.orgId;
  }

  const organization = await tx.organization.create({
    data: {
      type: data.accountType === "continued_care" ? "aftercare_continued_care" : "aftercare_sober_living",
      name: data.programName,
      email: draft.user.email,
      phone: data.admissionsContactPhone
    },
    select: { id: true }
  });

  await tx.user.update({
    where: { id: draft.userId },
    data: {
      role: "aftercare_admin",
      orgId: organization.id
    }
  });

  return organization.id;
}

async function updateProfileCoordinatesForAddress(input: {
  profileId: string;
  streetAddress?: string | null;
  city?: string | null;
  state?: string | null;
  zip?: string | null;
}) {
  const coordinates = await geocodeProfileAddress({
    idSeed: input.profileId,
    streetAddress: input.streetAddress,
    city: input.city,
    state: input.state,
    zip: input.zip
  });

  if (coordinates) {
    await prisma.aftercareProfile.update({
      where: { id: input.profileId },
      data: coordinates
    });
  }
}

type SoberLivingDraftProfile = {
  id: string;
  orgId: string;
  programName: string;
  slug: string;
};

async function upsertSoberLivingDraftProfile(
  tx: Prisma.TransactionClient,
  draft: Awaited<ReturnType<typeof getOrCreateOnboardingDraft>>,
  draftData: Record<string, unknown>,
  onboardingStep: number
): Promise<SoberLivingDraftProfile> {
  const programName = String(draftData.programName || "Sober Living Home");
  const existingProfileId = typeof draftData.profileId === "string" ? draftData.profileId : "";

  if (existingProfileId) {
    const existingProfile = await tx.aftercareProfile.findFirst({
      where: {
        id: existingProfileId,
        orgId: draft.user.orgId ?? undefined
      },
      select: { id: true, orgId: true, programName: true, slug: true }
    });

    if (!existingProfile) {
      throw new Error("Profile could not be found.");
    }

    await tx.aftercareProfile.update({
      where: { id: existingProfile.id },
      data: {
        description: sanitizeRichText(String(draftData.description || "")) || "",
        houseRulesText: sanitizeRichText(nullableText(String(draftData.houseRulesText || ""))),
        photoReadiness: arrayFromDraft(draftData.photoReadiness),
        videoUrls: arrayFromDraft(draftData.videoUrls),
        preferredContactMethod: String(draftData.preferredContactMethod || ""),
        onboardingStep
      }
    });

    return existingProfile;
  }

  const profileLimitMessage = await profileLimitMessageForExistingOrg(draft.user.orgId);

  if (profileLimitMessage) {
    throw new Error(profileLimitMessage);
  }

  const orgId = await getOrCreateAftercareOrganization(tx, draft, {
    accountType: "sober_living",
    admissionsContactPhone: String(draftData.admissionsContactPhone || ""),
    programName
  });
  const slug = `${slugify(programName)}-${Date.now().toString(36)}`;
  const profile = await tx.aftercareProfile.create({
    data: {
      orgId,
      type: ProfileType.sober_living,
      programName,
      slug,
      status: ProfileStatus.draft,
      streetAddress: String(draftData.streetAddress || ""),
      city: String(draftData.city || ""),
      state: String(draftData.state || ""),
      zip: String(draftData.zip || ""),
      publicCity: String(draftData.city || ""),
      publicState: String(draftData.state || ""),
      admissionsContactPhone: String(draftData.admissionsContactPhone || ""),
      admissionsContactEmail: String(draftData.admissionsContactEmail || ""),
      websiteUrl: nullableText(String(draftData.websiteUrl || "")),
      populationServed: String(draftData.populationServed || ""),
      populationServedOptions: arrayFromDraft(draftData.populationServedOptions),
      specialtyPopulations: arrayFromDraft(draftData.specialtyPopulations),
      recoveryResidenceLevel: nullableText(String(draftData.recoveryResidenceLevel || "")),
      certificationsHeld: arrayFromDraft(draftData.certificationsHeld),
      accreditations: [],
      clinicalFocus: [],
      recoverySupportServices: arrayFromDraft(draftData.recoverySupportServices),
      averageLengthOfStay: String(draftData.averageLengthOfStay || ""),
      totalBeds: Number(draftData.totalBeds || 0),
      bedsAvailable: Number(draftData.bedsAvailable || 0),
      bedsAvailableUpdatedAt: new Date(),
      bedsMen: Number(draftData.bedsMen || 0),
      bedsMenAvailable: Number(draftData.bedsMenAvailable || 0),
      bedsWomen: Number(draftData.bedsWomen || 0),
      bedsWomenAvailable: Number(draftData.bedsWomenAvailable || 0),
      bedsLgbtq: Number(draftData.bedsLgbtq || 0),
      bedsLgbtqAvailable: Number(draftData.bedsLgbtqAvailable || 0),
      roomTypes: arrayFromDraft(draftData.roomTypes),
      bedTypes: arrayFromDraft(draftData.bedTypes),
      bedsReservedNotes: nullableText(String(draftData.bedsReservedNotes || "")),
      wheelchairAccessibleBeds:
        draftData.wheelchairAccessibleBeds === null ? null : Number(draftData.wheelchairAccessibleBeds || 0),
      pricePerWeek: draftData.pricePerWeek === undefined ? null : Number(draftData.pricePerWeek || 0),
      moveInCost: moveInCostText(String(draftData.moveInCost || "")),
      supportServices: arrayFromDraft(draftData.supportServices),
      amenities: arrayFromDraft(draftData.amenities),
      insuranceAccepted: arrayFromDraft(draftData.insuranceAccepted),
      fundingAvailable: Boolean(draftData.fundingAvailable),
      fundingNotes: nullableText(String(draftData.fundingNotes || "")),
      medicationAdministration: String(draftData.medicationAdministration || ""),
      matAccepted: arrayFromDraft(draftData.matAccepted),
      medicationRestrictions: nullableText(String(draftData.medicationRestrictions || "")),
      drugTestingPolicy: String(draftData.drugTestingPolicy || ""),
      description: sanitizeRichText(String(draftData.description || "")) || "",
      houseRulesText: sanitizeRichText(nullableText(String(draftData.houseRulesText || ""))),
      photoReadiness: arrayFromDraft(draftData.photoReadiness),
      videoUrls: arrayFromDraft(draftData.videoUrls),
      preferredContactMethod: String(draftData.preferredContactMethod || ""),
      onboardingStep
    },
    select: { id: true, orgId: true, programName: true, slug: true }
  });

  await tx.onboardingDraft.update({
    where: { id: draft.id },
    data: {
      soberLivingDraft: jsonDraft({ ...draftData, profileId: profile.id })
    }
  });

  return profile;
}

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

  const accountType = parsed.profileType === "continued_care" ? "continued_care" : "sober_living";
  const draft = await getOrCreateOnboardingDraft(accountType, false);
  const profileLimitMessage = await profileLimitMessageForExistingOrg(draft.user.orgId);

  if (profileLimitMessage) {
    redirect(aftercareSubscriptionRedirect(profileLimitMessage));
  }

  const profileType =
    parsed.profileType === "sober_living" ? ProfileType.sober_living : ProfileType.continued_care;
  const programName = parsed.programName;
  const slug = `${slugify(programName)}-${Date.now().toString(36)}`;
  let geocodeTarget: { profileId: string; streetAddress: string; city: string; state: string; zip: string } | null = null;

  try {
    await prisma.$transaction(async (tx) => {
      const organization = await tx.organization.create({
        data: {
          type: accountType === "continued_care" ? "aftercare_continued_care" : "aftercare_sober_living",
          name: programName,
          email: draft.user.email,
          phone: parsed.admissionsContactPhone
        }
      });

      await tx.user.update({
        where: { id: draft.userId },
        data: {
          role: "aftercare_admin",
          orgId: organization.id
        }
      });

      const profile = await tx.aftercareProfile.create({
        data: {
          orgId: organization.id,
          type: profileType,
          programName,
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
            profileType === ProfileType.continued_care ? new Date() : null,
          onboardingCompletedAt: new Date()
        }
      });
      geocodeTarget = {
        profileId: profile.id,
        streetAddress: parsed.streetAddress,
        city: parsed.city,
        state: parsed.state,
        zip: parsed.zip
      };

      await tx.onboardingDraft.update({
        where: { id: draft.id },
        data: {
          selectedAccountType: accountType,
          ...(accountType === "continued_care"
            ? { continuedCareDraft: jsonDraft(mergeDraft(draft.continuedCareDraft, parsed)) }
            : { soberLivingDraft: jsonDraft(mergeDraft(draft.soberLivingDraft, parsed)) }),
          completedAt: new Date()
        }
      });
    }, onboardingTransactionOptions);
  } catch (error) {
    console.error("Aftercare profile draft creation failed", error);
    redirect("/setup?missing=database&from=aftercare-profile");
  }

  if (geocodeTarget) {
    await updateProfileCoordinatesForAddress(geocodeTarget);
  }

  redirect("/dashboard/aftercare");
}

export async function saveSoberLivingOnboardingStep(step: number, formData: FormData) {
  if (!hasDatabaseConfig()) {
    redirect("/setup?missing=database");
  }

  let destination = stepRedirect(step);
  let geocodeTarget: { profileId: string; streetAddress: string; city: string; state: string; zip: string } | null = null;
  let completedProfileId = "";

  try {
    const draft = await getOrCreateOnboardingDraft("sober_living", false);
    const currentDraft = draft.soberLivingDraft;

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
        recoveryResidenceLevel: formData.get("recoveryResidenceLevel") || undefined,
        certificationsHeld: valuesFromForm(formData, "certificationsHeld"),
        accreditations: [],
        recoverySupportServices: valuesFromForm(formData, "recoverySupportServices"),
        averageLengthOfStay: formData.get("averageLengthOfStay")
      });

      await prisma.onboardingDraft.update({
        where: { id: draft.id },
        data: {
          soberLivingDraft: jsonDraft(mergeDraft(currentDraft, {
            ...parsed,
            websiteUrl: nullableText(parsed.websiteUrl),
            populationServed: parsed.populationServed.join(", "),
            populationServedOptions: parsed.populationServed
          })),
          selectedAccountType: "sober_living",
          activeStep: 2,
          completedAt: null
        }
      });

      destination = stepRedirect(2);
    }

    if (step === 2) {
      const parsed = stepTwoSchema.parse({
        profileId: "draft",
        bedsMen: formData.get("bedsMen") || "0",
        bedsMenAvailable: formData.get("bedsMenAvailable") || "0",
        bedsWomen: formData.get("bedsWomen") || "0",
        bedsWomenAvailable: formData.get("bedsWomenAvailable") || "0",
        bedsLgbtq: formData.get("bedsLgbtq") || "0",
        bedsLgbtqAvailable: formData.get("bedsLgbtqAvailable") || "0",
        roomTypes: valuesFromForm(formData, "roomTypes"),
        bedTypes: valuesFromForm(formData, "bedTypes"),
        bedsReservedNotes: formData.get("bedsReservedNotes") || undefined,
        wheelchairAccessible: formData.get("wheelchairAccessible"),
        wheelchairAccessibleBeds: formData.get("wheelchairAccessibleBeds") || undefined,
        pricePerWeek: currencyText(formData.get("pricePerWeek")) || undefined,
        moveInCost: currencyText(formData.get("moveInCost")) || undefined
      });

      const populationServedOptions = arrayFromDraft(
        currentDraft && typeof currentDraft === "object" && !Array.isArray(currentDraft)
          ? (currentDraft as Record<string, unknown>).populationServedOptions
          : []
      );
      const bedTotals = populationBedTotalsFromForm(formData, populationServedOptions, numberFromForm);

      if (bedTotals.hasInvalidAvailableBeds) {
        redirect("/onboarding/aftercare/sober-living/2?error=Available beds cannot exceed total beds.");
      }

      await prisma.onboardingDraft.update({
        where: { id: draft.id },
        data: {
          soberLivingDraft: jsonDraft(mergeDraft(currentDraft, {
            totalBeds: bedTotals.totalBeds,
            bedsAvailable: bedTotals.bedsAvailable,
            bedsMen: bedTotals.bedsMen,
            bedsMenAvailable: bedTotals.bedsMenAvailable,
            bedsWomen: bedTotals.bedsWomen,
            bedsWomenAvailable: bedTotals.bedsWomenAvailable,
            bedsLgbtq: bedTotals.bedsLgbtq,
            bedsLgbtqAvailable: bedTotals.bedsLgbtqAvailable,
            roomTypes: parsed.roomTypes,
            bedTypes: parsed.bedTypes,
            bedsReservedNotes: nullableText(parsed.bedsReservedNotes),
            wheelchairAccessibleBeds:
              parsed.wheelchairAccessible === "yes" ? parsed.wheelchairAccessibleBeds ?? 0 : null,
            pricePerWeek: parsed.pricePerWeek,
            moveInCost: moveInCostText(parsed.moveInCost)
          })),
          selectedAccountType: "sober_living",
          activeStep: 3,
          completedAt: null
        }
      });

      destination = stepRedirect(3);
    }

    if (step === 3) {
      const parsed = stepThreeSchema.parse({
        profileId: "draft",
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

      await prisma.onboardingDraft.update({
        where: { id: draft.id },
        data: {
          soberLivingDraft: jsonDraft(mergeDraft(currentDraft, {
            supportServices: parsed.supportServices,
            amenities: parsed.amenities,
            insuranceAccepted: parsed.insuranceAccepted,
            fundingAvailable: parsed.fundingAvailable === "yes",
            fundingNotes: nullableText(parsed.fundingNotes),
            medicationAdministration: parsed.medicationAdministration,
            matAccepted: parsed.matAccepted,
            medicationRestrictions: nullableText(parsed.medicationRestrictions),
            drugTestingPolicy: parsed.drugTestingPolicy
          })),
          selectedAccountType: "sober_living",
          activeStep: 4,
          completedAt: null
        }
      });

      destination = stepRedirect(4);
    }

    if (step === 4) {
      const parsed = stepFourSchema.parse({
        profileId: "draft",
        description: formData.get("description") || undefined,
        houseRulesText: formData.get("houseRulesText") || undefined,
        photoReadiness: valuesFromForm(formData, "photoReadiness"),
        videoUrls: valuesFromForm(formData, "videoUrls"),
        preferredContactMethod: formData.get("preferredContactMethod")
      });
      const nextDraft = mergeDraft(currentDraft, {
        description: sanitizeRichText(nullableText(parsed.description)),
        houseRulesText: sanitizeRichText(nullableText(parsed.houseRulesText)),
        photoReadiness: parsed.photoReadiness,
        videoUrls: parsed.videoUrls,
        preferredContactMethod: parsed.preferredContactMethod
      }) as Record<string, unknown>;

      await prisma.onboardingDraft.update({
        where: { id: draft.id },
        data: {
          soberLivingDraft: jsonDraft(nextDraft),
          selectedAccountType: "sober_living",
          activeStep: 5,
          completedAt: null
        }
      });

      if (destination === stepRedirect(step)) {
        destination = stepRedirect(5);
      }
    }

    if (step === 5) {
      const parsed = stepFiveSchema.parse({
        profileId: "draft",
        availabilityNotes: formData.get("availabilityNotes") || undefined,
        referralFitNotes: formData.get("referralFitNotes") || undefined,
        goodNeighborPolicyAcknowledged: formData.get("goodNeighborPolicyAcknowledged")
      });
      const finalDraft = mergeDraft(currentDraft, {
        availabilityNotes: nullableText(parsed.availabilityNotes),
        referralFitNotes: nullableText(parsed.referralFitNotes),
        goodNeighborPolicyAcknowledged: true
      }) as Record<string, unknown>;
      const programName = String(finalDraft.programName || "Sober Living Home");
      const slug = `${slugify(programName)}-${Date.now().toString(36)}`;
      const existingProfileId = typeof finalDraft.profileId === "string" ? finalDraft.profileId : "";

      const profileLimitMessage = existingProfileId ? null : await profileLimitMessageForExistingOrg(draft.user.orgId);

      if (profileLimitMessage) {
        destination = aftercareSubscriptionRedirect(profileLimitMessage);
      } else {
        await prisma.$transaction(async (tx) => {
          const orgId = await getOrCreateAftercareOrganization(tx, draft, {
            accountType: "sober_living",
            admissionsContactPhone: String(finalDraft.admissionsContactPhone || ""),
            programName
          });

          const profileData = {
            programName,
            streetAddress: String(finalDraft.streetAddress || ""),
            city: String(finalDraft.city || ""),
            state: String(finalDraft.state || ""),
            zip: String(finalDraft.zip || ""),
            publicCity: String(finalDraft.city || ""),
            publicState: String(finalDraft.state || ""),
            admissionsContactPhone: String(finalDraft.admissionsContactPhone || ""),
            admissionsContactEmail: String(finalDraft.admissionsContactEmail || ""),
            websiteUrl: nullableText(String(finalDraft.websiteUrl || "")),
            populationServed: String(finalDraft.populationServed || ""),
            populationServedOptions: arrayFromDraft(finalDraft.populationServedOptions),
            specialtyPopulations: arrayFromDraft(finalDraft.specialtyPopulations),
            recoveryResidenceLevel: nullableText(String(finalDraft.recoveryResidenceLevel || "")),
            certificationsHeld: arrayFromDraft(finalDraft.certificationsHeld),
            accreditations: [],
            clinicalFocus: [],
            recoverySupportServices: arrayFromDraft(finalDraft.recoverySupportServices),
            averageLengthOfStay: String(finalDraft.averageLengthOfStay || ""),
            totalBeds: Number(finalDraft.totalBeds || 0),
            bedsAvailable: Number(finalDraft.bedsAvailable || 0),
            bedsAvailableUpdatedAt: new Date(),
            bedsMen: Number(finalDraft.bedsMen || 0),
            bedsMenAvailable: Number(finalDraft.bedsMenAvailable || 0),
            bedsWomen: Number(finalDraft.bedsWomen || 0),
            bedsWomenAvailable: Number(finalDraft.bedsWomenAvailable || 0),
            bedsLgbtq: Number(finalDraft.bedsLgbtq || 0),
            bedsLgbtqAvailable: Number(finalDraft.bedsLgbtqAvailable || 0),
            roomTypes: arrayFromDraft(finalDraft.roomTypes),
            bedTypes: arrayFromDraft(finalDraft.bedTypes),
            bedsReservedNotes: nullableText(String(finalDraft.bedsReservedNotes || "")),
            wheelchairAccessibleBeds:
              finalDraft.wheelchairAccessibleBeds === null ? null : Number(finalDraft.wheelchairAccessibleBeds || 0),
            pricePerWeek: finalDraft.pricePerWeek === undefined ? null : Number(finalDraft.pricePerWeek || 0),
            moveInCost: moveInCostText(String(finalDraft.moveInCost || "")),
            supportServices: arrayFromDraft(finalDraft.supportServices),
            amenities: arrayFromDraft(finalDraft.amenities),
            insuranceAccepted: arrayFromDraft(finalDraft.insuranceAccepted),
            fundingAvailable: Boolean(finalDraft.fundingAvailable),
            fundingNotes: nullableText(String(finalDraft.fundingNotes || "")),
            medicationAdministration: String(finalDraft.medicationAdministration || ""),
            matAccepted: arrayFromDraft(finalDraft.matAccepted),
            medicationRestrictions: nullableText(String(finalDraft.medicationRestrictions || "")),
            drugTestingPolicy: String(finalDraft.drugTestingPolicy || ""),
            description: sanitizeRichText(String(finalDraft.description || "")) || "",
            houseRulesText: sanitizeRichText(nullableText(String(finalDraft.houseRulesText || ""))),
            photoReadiness: arrayFromDraft(finalDraft.photoReadiness),
            videoUrls: arrayFromDraft(finalDraft.videoUrls),
            preferredContactMethod: String(finalDraft.preferredContactMethod || ""),
            availabilityNotes: nullableText(String(finalDraft.availabilityNotes || "")),
            referralFitNotes: nullableText(String(finalDraft.referralFitNotes || "")),
            goodNeighborPolicyAcknowledged: true,
            onboardingStep: maxSoberLivingStep,
            onboardingCompletedAt: new Date()
          };
          const profile = existingProfileId
            ? await tx.aftercareProfile.update({
              where: {
                id: (
                  await tx.aftercareProfile.findFirstOrThrow({
                    where: { id: existingProfileId, orgId },
                    select: { id: true }
                  })
                ).id
              },
              data: profileData,
              select: { id: true }
            })
            : await tx.aftercareProfile.create({
              data: {
                orgId,
                type: ProfileType.sober_living,
                slug,
                status: ProfileStatus.draft,
                ...profileData
              },
              select: { id: true }
            });
          geocodeTarget = {
            profileId: profile.id,
            streetAddress: String(finalDraft.streetAddress || ""),
            city: String(finalDraft.city || ""),
            state: String(finalDraft.state || ""),
            zip: String(finalDraft.zip || "")
          };

          completedProfileId = profile.id;

          await tx.onboardingDraft.update({
            where: { id: draft.id },
            data: {
              soberLivingDraft: jsonDraft({ ...finalDraft, profileId: profile.id, profileImages: [] }),
              selectedAccountType: "sober_living",
              activeStep: maxSoberLivingStep,
              completedAt: new Date()
            }
          });
        }, onboardingTransactionOptions);

        destination = completedProfileId
          ? `/onboarding/aftercare/images?profileId=${completedProfileId}`
          : "/dashboard/aftercare";
      }
    }
  } catch (error) {
    console.error("Sober living onboarding step save failed", error);
    destination = stepRedirect(step, onboardingSaveErrorMessage(error));
  }

  if (geocodeTarget) {
    await updateProfileCoordinatesForAddress(geocodeTarget);
  }

  redirect(destination);
}

export async function uploadCompletedAftercareOnboardingImages(formData: FormData) {
  if (!hasDatabaseConfig()) {
    redirect("/setup?missing=database");
  }

  const appUser = await getProtectedAppUser("/onboarding/aftercare/images");

  if (appUser.role !== Role.aftercare_admin && appUser.role !== Role.aftercare_manager) {
    redirect("/dashboard");
  }

  if (!appUser.orgId) {
    redirect("/onboarding/account-type");
  }

  const profileId = String(formData.get("profileId") || "");
  const profile = await prisma.aftercareProfile.findFirst({
    where: {
      id: profileId,
      orgId: appUser.orgId
    },
    select: {
      id: true,
      orgId: true,
      programName: true,
      slug: true
    }
  });

  if (!profile) {
    redirect("/dashboard/aftercare");
  }

  const params = new URLSearchParams({ profileId: profile.id });

  try {
    const files = imagesFromFormData(formData);

    if (!files.length) {
      params.set("message", "Choose at least one image to upload.");
      redirect("/onboarding/aftercare/images?" + params.toString());
    }

    const uploadedCount = await uploadProfileImagesForProfile(profile, files);
    params.set("message", `${uploadedCount} image${uploadedCount === 1 ? "" : "s"} uploaded.`);
  } catch (error) {
    params.set("message", error instanceof Error ? error.message : "Image upload failed.");
  }

  revalidatePath("/dashboard/aftercare");
  revalidatePath(`/dashboard/aftercare/profiles/${profile.id}`);
  revalidatePath("/search");
  revalidatePath(`/profiles/${profile.slug}`);
  redirect("/onboarding/aftercare/images?" + params.toString());
}

export async function saveContinuedCareOnboardingStep(step: number, formData: FormData) {
  if (!hasDatabaseConfig()) {
    redirect("/setup?missing=database");
  }

  let destination = continuedCareStepRedirect(step);
  let geocodeTarget: { profileId: string; streetAddress: string; city: string; state: string; zip: string } | null = null;
  let completedProfileId = "";

  try {
    const draft = await getOrCreateOnboardingDraft("continued_care", false);
    const currentDraft = draft.continuedCareDraft;

    if (step === 1) {
      const parsed = continuedCareStepOneSchema.parse({
        programName: formData.get("programName"),
        streetAddress: formData.get("streetAddress"),
        city: formData.get("city"),
        state: formData.get("state"),
        zip: formData.get("zip"),
        websiteUrl: formData.get("websiteUrl") || undefined,
        telehealthMode: formData.get("telehealthMode"),
        additionalLocations: formData.get("additionalLocations") || undefined,
        stateLicenseNumber: formData.get("stateLicenseNumber"),
        certificationsHeld: valuesFromForm(formData, "certificationsHeld"),
        accreditations: valuesFromForm(formData, "accreditations"),
        clinicalFocus: valuesFromForm(formData, "clinicalFocus")
      });

      await prisma.onboardingDraft.update({
        where: { id: draft.id },
        data: {
          continuedCareDraft: jsonDraft(mergeDraft(currentDraft, {
            ...parsed,
            websiteUrl: nullableText(parsed.websiteUrl),
            additionalLocations: nullableText(parsed.additionalLocations),
            telehealthAvailable: parsed.telehealthMode !== "In-person only"
          })),
          selectedAccountType: "continued_care",
          activeStep: 2,
          completedAt: null
        }
      });

      destination = continuedCareStepRedirect(2);
    }

    if (step === 2) {
      const parsed = continuedCareStepTwoSchema.parse({
        levelsOfCare: valuesFromForm(formData, "levelsOfCare"),
        programmingSchedule: valuesFromForm(formData, "programmingSchedule"),
        populationServed: valuesFromForm(formData, "populationServed"),
        specialtyPopulations: valuesFromForm(formData, "specialtyPopulations"),
        medicationServicesOffered: valuesFromForm(formData, "medicationServicesOffered"),
        matAccepted: valuesFromForm(formData, "matAccepted"),
        averageLengthOfStay: formData.get("averageLengthOfStay"),
        languagesServed: valuesFromForm(formData, "languagesServed")
      });
      const matServicesOffered = parsed.medicationServicesOffered.includes("MAT / Addiction medication management");

      await prisma.onboardingDraft.update({
        where: { id: draft.id },
        data: {
          continuedCareDraft: jsonDraft(mergeDraft(currentDraft, {
            ...parsed,
            populationServed: parsed.populationServed.join(", "),
            populationServedOptions: parsed.populationServed,
            matServicesOffered,
            matAccepted: matServicesOffered ? parsed.matAccepted : []
          })),
          selectedAccountType: "continued_care",
          activeStep: 3,
          completedAt: null
        }
      });

      destination = continuedCareStepRedirect(3);
    }

    if (step === 3) {
      const formattedPhone = normalizePhoneForStorage(formData.get("admissionsContactPhone"));

      if (!formattedPhone) {
        destination = continuedCareStepRedirect(3, "Enter a valid 10-digit intake phone number.");
        throw new Error("Invalid continued care intake phone: Enter a valid 10-digit intake phone number.");
      }

      const parsed = continuedCareStepThreeSchema.parse({
        intakeContactName: formData.get("intakeContactName"),
        admissionsContactPhone: formattedPhone,
        admissionsContactEmail: formData.get("admissionsContactEmail"),
        insuranceAccepted: valuesFromForm(formData, "insuranceAccepted"),
        clientAcceptanceMethods: valuesFromForm(formData, "clientAcceptanceMethods"),
        referralProcessDescription: formData.get("referralProcessDescription"),
        medicalRecordsFax: formData.get("medicalRecordsFax") || undefined
      });

      await prisma.onboardingDraft.update({
        where: { id: draft.id },
        data: {
          continuedCareDraft: jsonDraft(mergeDraft(currentDraft, {
            ...parsed,
            medicalRecordsFax: nullableText(parsed.medicalRecordsFax)
          })),
          selectedAccountType: "continued_care",
          activeStep: 4,
          completedAt: null
        }
      });

      destination = continuedCareStepRedirect(4);
    }

    if (step === 4) {
      const parsed = continuedCareStepFourSchema.parse({
        affiliatedSoberLivingHomes: formData.get("affiliatedSoberLivingHomes") || undefined,
        description: formData.get("description"),
        supportServices: valuesFromForm(formData, "supportServices"),
        preferredContactMethod: formData.get("preferredContactMethod")
      });

      await prisma.onboardingDraft.update({
        where: { id: draft.id },
        data: {
          continuedCareDraft: jsonDraft(mergeDraft(currentDraft, {
            ...parsed,
            affiliatedSoberLivingHomes: nullableText(parsed.affiliatedSoberLivingHomes)
          })),
          selectedAccountType: "continued_care",
          activeStep: 5,
          completedAt: null
        }
      });

      destination = continuedCareStepRedirect(5);
    }

    if (step === 5) {
      const parsed = continuedCareStepFiveSchema.parse({
        acceptingNewPatients: formData.get("acceptingNewPatients"),
        availabilityNotes: formData.get("availabilityNotes") || undefined,
        photoReadiness: valuesFromForm(formData, "photoReadiness"),
        videoUrls: valuesFromForm(formData, "videoUrls")
      });
      const finalDraft = mergeDraft(currentDraft, {
        acceptingNewPatients: parsed.acceptingNewPatients === "yes",
        availabilityNotes: nullableText(parsed.availabilityNotes),
        photoReadiness: parsed.photoReadiness,
        videoUrls: parsed.videoUrls
      }) as Record<string, unknown>;
      const programName = String(finalDraft.programName || "Continued Care Program");
      const slug = `${slugify(programName)}-${Date.now().toString(36)}`;
      const profileLimitMessage = await profileLimitMessageForExistingOrg(draft.user.orgId);

      if (profileLimitMessage) {
        destination = aftercareSubscriptionRedirect(profileLimitMessage);
      } else {
        await prisma.$transaction(async (tx) => {
          const orgId = await getOrCreateAftercareOrganization(tx, draft, {
            accountType: "continued_care",
            admissionsContactPhone: String(finalDraft.admissionsContactPhone || ""),
            programName
          });

        const profile = await tx.aftercareProfile.create({
          data: {
            orgId,
            type: ProfileType.continued_care,
            programName,
            slug,
            status: ProfileStatus.draft,
            streetAddress: String(finalDraft.streetAddress || ""),
            city: String(finalDraft.city || ""),
            state: String(finalDraft.state || ""),
            zip: String(finalDraft.zip || ""),
            publicCity: String(finalDraft.city || ""),
            publicState: String(finalDraft.state || ""),
            admissionsContactPhone: String(finalDraft.admissionsContactPhone || ""),
            admissionsContactEmail: String(finalDraft.admissionsContactEmail || ""),
            preferredContactMethod: String(finalDraft.preferredContactMethod || ""),
            websiteUrl: nullableText(String(finalDraft.websiteUrl || "")),
            programTypes: [],
            telehealthAvailable: Boolean(finalDraft.telehealthAvailable),
            telehealthMode: String(finalDraft.telehealthMode || ""),
            additionalLocations: nullableText(String(finalDraft.additionalLocations || "")),
            stateLicenseNumber: String(finalDraft.stateLicenseNumber || ""),
            certificationsHeld: arrayFromDraft(finalDraft.certificationsHeld),
            accreditations: arrayFromDraft(finalDraft.accreditations),
            clinicalFocus: arrayFromDraft(finalDraft.clinicalFocus),
            levelsOfCare: arrayFromDraft(finalDraft.levelsOfCare),
            hoursOfOperation: null,
            programmingSchedule: arrayFromDraft(finalDraft.programmingSchedule),
            languagesServed: arrayFromDraft(finalDraft.languagesServed),
            medicationServicesOffered: arrayFromDraft(finalDraft.medicationServicesOffered),
            populationServed: String(finalDraft.populationServed || ""),
            populationServedOptions: arrayFromDraft(finalDraft.populationServedOptions),
            specialtyPopulations: arrayFromDraft(finalDraft.specialtyPopulations),
            matServicesOffered: Boolean(finalDraft.matServicesOffered),
            matAccepted: arrayFromDraft(finalDraft.matAccepted),
            coOccurringTreatment: null,
            averageLengthOfStay: String(finalDraft.averageLengthOfStay || ""),
            intakeContactName: String(finalDraft.intakeContactName || ""),
            insuranceAccepted: arrayFromDraft(finalDraft.insuranceAccepted),
            clientAcceptanceMethods: arrayFromDraft(finalDraft.clientAcceptanceMethods),
            referralProcessDescription: String(finalDraft.referralProcessDescription || ""),
            referralFitNotes: String(finalDraft.referralProcessDescription || ""),
            bedsReservedNotes: nullableText(String(finalDraft.medicalRecordsFax || "")),
            affiliatedSoberLivingHomes: nullableText(String(finalDraft.affiliatedSoberLivingHomes || "")),
            description: String(finalDraft.description || ""),
            supportServices: arrayFromDraft(finalDraft.supportServices),
            acceptingNewPatients: Boolean(finalDraft.acceptingNewPatients),
            acceptingNewPatientsUpdatedAt: new Date(),
            availabilityNotes: nullableText(String(finalDraft.availabilityNotes || "")),
            photoReadiness: arrayFromDraft(finalDraft.photoReadiness),
            videoUrls: arrayFromDraft(finalDraft.videoUrls),
            onboardingStep: maxContinuedCareStep,
            onboardingCompletedAt: new Date()
          },
          select: { id: true, orgId: true, programName: true }
        });
        completedProfileId = profile.id;
        geocodeTarget = {
          profileId: profile.id,
          streetAddress: String(finalDraft.streetAddress || ""),
          city: String(finalDraft.city || ""),
          state: String(finalDraft.state || ""),
          zip: String(finalDraft.zip || "")
        };

        await tx.onboardingDraft.update({
          where: { id: draft.id },
          data: {
            continuedCareDraft: jsonDraft(finalDraft),
            selectedAccountType: "continued_care",
            activeStep: maxContinuedCareStep,
            completedAt: new Date()
          }
        });
        }, onboardingTransactionOptions);

        if (destination === continuedCareStepRedirect(step)) {
          destination = completedProfileId
            ? `/onboarding/aftercare/images?profileId=${completedProfileId}`
            : "/dashboard/aftercare";
        }
      }
    }
  } catch (error) {
    console.error("Continued care onboarding step save failed", error);
    destination = continuedCareStepRedirect(step, onboardingSaveErrorMessage(error));
  }

  if (geocodeTarget) {
    await updateProfileCoordinatesForAddress(geocodeTarget);
  }

  redirect(destination);
}
