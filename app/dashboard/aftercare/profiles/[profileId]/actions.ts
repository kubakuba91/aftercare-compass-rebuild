"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { ProfileStatus, ProfileType } from "@prisma/client";
import { aftercareProfileIdWhereForUser } from "@/lib/aftercare-access";
import { getAftercareProfileReadiness } from "@/lib/aftercare-profile-readiness";
import {
  canManageAftercareProfile,
  canUseLiveAvailability,
  getAftercareProfileLimit,
  isWithinPlanLimit
} from "@/lib/feature-gates";
import { moveInCostText, nullableText, numberFromForm } from "@/lib/form-utils";
import { geocodeProfileAddress } from "@/lib/geocoding";
import { imagesFromFormData, removeProfileImageForProfile, uploadProfileImagesForProfile } from "@/lib/profile-images";
import { populationBedTotalsFromForm } from "@/lib/population-beds";
import { normalizePhoneForStorage } from "@/lib/phone";
import { prisma } from "@/lib/prisma";
import { sanitizeRichText } from "@/lib/rich-text";
import { getAftercareDashboardUser } from "@/lib/protected-routing";
import { valuesFromForm } from "@/lib/sober-living-onboarding";

async function getOwnedProfile(profileId: string) {
  const appUser = await getAftercareDashboardUser(`/dashboard/aftercare/profiles/${profileId}`);
  const profile = await prisma.aftercareProfile.findFirst({
    where: aftercareProfileIdWhereForUser(appUser, profileId),
    include: {
      organization: {
        select: {
          type: true,
          subscriptionPlan: true,
          subscriptionStatus: true
        }
      }
    }
  });

  if (!profile) {
    redirect("/dashboard/aftercare?tab=homes");
  }

  return profile;
}

function ensureProfileCanBeEdited(profile: Awaited<ReturnType<typeof getOwnedProfile>>) {
  if (!canManageAftercareProfile(profile.organization, profile)) {
    redirect(profileHref(profile.id, "Upgrade or claim this profile before editing it."));
  }
}

function profileHref(profileId: string, message?: string) {
  const params = new URLSearchParams();

  if (message) {
    params.set("message", message);
  }

  return `/dashboard/aftercare/profiles/${profileId}${params.size ? `?${params.toString()}` : ""}`;
}

function savedMessageWithCoordinates(message: string, coordinates: Awaited<ReturnType<typeof geocodeProfileAddress>>) {
  if (coordinates) {
    return message;
  }

  return `${message} Google could not create map coordinates from this address, so the public map pin is still hidden.`;
}

export async function updateAftercareProfileBasics(formData: FormData) {
  const profileId = String(formData.get("profileId") || "");
  const profile = await getOwnedProfile(profileId);
  ensureProfileCanBeEdited(profile);
  const programName = String(formData.get("programName") || "").trim();
  const city = String(formData.get("city") || "").trim();
  const state = String(formData.get("state") || "").trim();
  const nameLabel = profile.type === ProfileType.sober_living ? "Residence name" : "Program name";
  const phoneLabel = profile.type === ProfileType.sober_living ? "intake phone" : "admissions phone";

  if (!programName || !city || !state) {
    redirect(profileHref(profile.id, `${nameLabel}, city, and state are required.`));
  }

  const streetAddress = nullableText(formData.get("streetAddress"));
  const zip = nullableText(formData.get("zip"));
  const admissionsContactPhone = normalizePhoneForStorage(formData.get("admissionsContactPhone"));

  if (formData.get("admissionsContactPhone") && !admissionsContactPhone) {
    redirect(profileHref(profile.id, `Enter a valid 10-digit ${phoneLabel} number.`));
  }

  const coordinates = await geocodeProfileAddress({
    idSeed: profile.id,
    streetAddress,
    city,
    state,
    zip
  });

  await prisma.aftercareProfile.update({
    where: { id: profile.id },
    data: {
      programName,
      streetAddress,
      city,
      state,
      zip,
      publicCity: city,
      publicState: state,
      websiteUrl: nullableText(formData.get("websiteUrl")),
      admissionsContactPhone,
      admissionsContactEmail: nullableText(formData.get("admissionsContactEmail")),
      preferredContactMethod: nullableText(formData.get("preferredContactMethod")),
      intakeTurnaroundTime: profile.type === ProfileType.sober_living
        ? nullableText(formData.get("intakeTurnaroundTime"))
        : null,
      intakeContactName: nullableText(formData.get("intakeContactName")),
      stateLicenseNumber: nullableText(formData.get("stateLicenseNumber")),
      ...(coordinates ?? {})
    }
  });

  revalidatePath("/dashboard/aftercare");
  revalidatePath(profileHref(profile.id));
  redirect(profileHref(profile.id, savedMessageWithCoordinates("Basics saved.", coordinates)));
}

export async function updateAftercareProfileDetails(formData: FormData) {
  const profileId = String(formData.get("profileId") || "");
  const profile = await getOwnedProfile(profileId);
  ensureProfileCanBeEdited(profile);
  const programName = String(formData.get("programName") || "").trim();
  const city = String(formData.get("city") || "").trim();
  const state = String(formData.get("state") || "").trim();
  const nameLabel = profile.type === ProfileType.sober_living ? "Residence name" : "Program name";
  const phoneLabel = profile.type === ProfileType.sober_living ? "intake phone" : "admissions phone";

  if (!programName || !city || !state) {
    redirect(profileHref(profile.id, `${nameLabel}, city, and state are required.`));
  }

  const streetAddress = nullableText(formData.get("streetAddress"));
  const zip = nullableText(formData.get("zip"));
  const admissionsContactPhone = normalizePhoneForStorage(formData.get("admissionsContactPhone"));

  if (formData.get("admissionsContactPhone") && !admissionsContactPhone) {
    redirect(profileHref(profile.id, `Enter a valid 10-digit ${phoneLabel} number.`));
  }

  const coordinates = await geocodeProfileAddress({
    idSeed: profile.id,
    streetAddress,
    city,
    state,
    zip
  });
  const videoUrls = valuesFromForm(formData, "videoUrls").filter((url) => /^https?:\/\/.+\..+/.test(url));
  const populationServedOptions = valuesFromForm(formData, "populationServedOptions");

  const baseData = {
    programName,
    streetAddress,
    city,
    state,
    zip,
    publicCity: city,
    publicState: state,
    websiteUrl: nullableText(formData.get("websiteUrl")),
    admissionsContactPhone,
    admissionsContactEmail: nullableText(formData.get("admissionsContactEmail")),
    preferredContactMethod: nullableText(formData.get("preferredContactMethod")),
    intakeTurnaroundTime: profile.type === ProfileType.sober_living
      ? nullableText(formData.get("intakeTurnaroundTime"))
      : null,
    intakeContactName: nullableText(formData.get("intakeContactName")),
    stateLicenseNumber: nullableText(formData.get("stateLicenseNumber")),
    description: sanitizeRichText(nullableText(formData.get("description"))),
    houseRulesText: sanitizeRichText(nullableText(formData.get("houseRulesText"))),
    referralFitNotes: nullableText(formData.get("referralFitNotes")),
    referralProcessDescription: nullableText(formData.get("referralProcessDescription")),
    specialtyPopulations: valuesFromForm(formData, "specialtyPopulations"),
    recoveryResidenceLevel: profile.type === ProfileType.sober_living
      ? nullableText(formData.get("recoveryResidenceLevel"))
      : null,
    certificationsHeld: valuesFromForm(formData, "certificationsHeld"),
    accreditations: profile.type === ProfileType.sober_living ? [] : valuesFromForm(formData, "accreditations"),
    clinicalFocus: profile.type === ProfileType.sober_living ? [] : valuesFromForm(formData, "clinicalFocus"),
    recoverySupportServices: profile.type === ProfileType.sober_living
      ? valuesFromForm(formData, "recoverySupportServices")
      : [],
    supportServices: valuesFromForm(formData, "supportServices"),
    amenities: valuesFromForm(formData, "amenities"),
    insuranceAccepted: valuesFromForm(formData, "insuranceAccepted"),
    clientAcceptanceMethods: valuesFromForm(formData, "clientAcceptanceMethods"),
    fundingAvailable: formData.get("fundingAvailable")
      ? formData.get("fundingAvailable") === "yes"
      : null,
    fundingNotes: nullableText(formData.get("fundingNotes")),
    medicationAdministration: nullableText(formData.get("medicationAdministration")),
    medicationServicesOffered: valuesFromForm(formData, "medicationServicesOffered"),
    matAccepted: valuesFromForm(formData, "matAccepted"),
    medicationRestrictions: nullableText(formData.get("medicationRestrictions")),
    drugTestingPolicy: nullableText(formData.get("drugTestingPolicy")),
    photoReadiness: valuesFromForm(formData, "photoReadiness"),
    videoUrls,
    goodNeighborPolicyAcknowledged: formData.get("goodNeighborPolicyAcknowledged") === "yes",
    availabilityNotes: nullableText(formData.get("availabilityNotes")),
    ...(coordinates ?? {})
  };

  if (profile.type === ProfileType.sober_living) {
    const bedTotals = populationBedTotalsFromForm(formData, populationServedOptions, numberFromForm);

    if (bedTotals.hasInvalidAvailableBeds) {
      redirect(profileHref(profile.id, "Available beds cannot exceed total beds."));
    }

    await prisma.aftercareProfile.update({
      where: { id: profile.id },
      data: {
        ...baseData,
        populationServedOptions,
        populationServed: populationServedOptions.join(", ") || null,
        totalBeds: bedTotals.totalBeds,
        bedsAvailable: bedTotals.bedsAvailable,
        bedsMen: bedTotals.bedsMen,
        bedsMenAvailable: bedTotals.bedsMenAvailable,
        bedsWomen: bedTotals.bedsWomen,
        bedsWomenAvailable: bedTotals.bedsWomenAvailable,
        bedsLgbtq: bedTotals.bedsLgbtq,
        bedsLgbtqAvailable: bedTotals.bedsLgbtqAvailable,
        bedsAvailableUpdatedAt: new Date(),
        pricePerWeek: numberFromForm(formData.get("pricePerWeek")),
        moveInCost: moveInCostText(formData.get("moveInCost")),
        insuranceAccepted: valuesFromForm(formData, "insuranceAccepted"),
        fundingAvailable: formData.get("fundingAvailable")
          ? formData.get("fundingAvailable") === "yes"
          : null,
        fundingNotes: nullableText(formData.get("fundingNotes")),
        wheelchairAccessibleBeds: numberFromForm(formData.get("wheelchairAccessibleBeds")),
        roomTypes: valuesFromForm(formData, "roomTypes"),
        bedTypes: valuesFromForm(formData, "bedTypes"),
        bedsReservedNotes: nullableText(formData.get("bedsReservedNotes"))
      }
    });
  } else {
    await prisma.aftercareProfile.update({
      where: { id: profile.id },
      data: {
        ...baseData,
        populationServedOptions,
        populationServed: populationServedOptions.join(", ") || null,
        acceptingNewPatients: formData.get("acceptingNewPatients") === "yes",
        acceptingNewPatientsUpdatedAt: new Date(),
        matServicesOffered: valuesFromForm(formData, "medicationServicesOffered").includes("MAT / Addiction medication management"),
        matAccepted: valuesFromForm(formData, "medicationServicesOffered").includes("MAT / Addiction medication management")
          ? valuesFromForm(formData, "matAccepted")
          : [],
        programTypes: [],
        levelsOfCare: valuesFromForm(formData, "levelsOfCare"),
        programmingSchedule: valuesFromForm(formData, "programmingSchedule"),
        languagesServed: valuesFromForm(formData, "languagesServed"),
        insuranceAccepted: valuesFromForm(formData, "insuranceAccepted"),
        fundingAvailable: formData.get("fundingAvailable")
          ? formData.get("fundingAvailable") === "yes"
          : null,
        fundingNotes: nullableText(formData.get("fundingNotes")),
        telehealthMode: nullableText(formData.get("telehealthMode")),
        hoursOfOperation: null,
        coOccurringTreatment: null
      }
    });
  }

  revalidatePath("/dashboard/aftercare");
  revalidatePath(profileHref(profile.id));
  revalidatePath(`/profiles/${profile.slug}`);
  redirect(profileHref(profile.id, savedMessageWithCoordinates("Profile changes saved.", coordinates)));
}

export async function updateAftercareProfileAvailability(formData: FormData) {
  const profileId = String(formData.get("profileId") || "");
  const profile = await getOwnedProfile(profileId);

  if (!canUseLiveAvailability(profile.organization, profile)) {
    redirect(profileHref(profile.id, "Live availability updates are available on Professional, Verified, and Network plans."));
  }

  if (profile.type === ProfileType.sober_living) {
    const populationServedOptions = valuesFromForm(formData, "populationServedOptions");
    const bedTotals = populationBedTotalsFromForm(formData, populationServedOptions, numberFromForm);

    if (bedTotals.hasInvalidAvailableBeds) {
      redirect(profileHref(profile.id, "Available beds cannot exceed total beds."));
    }

    await prisma.aftercareProfile.update({
      where: { id: profile.id },
      data: {
        totalBeds: bedTotals.totalBeds,
        bedsAvailable: bedTotals.bedsAvailable,
        populationServedOptions,
        populationServed: populationServedOptions.join(", ") || null,
        bedsMen: bedTotals.bedsMen,
        bedsMenAvailable: bedTotals.bedsMenAvailable,
        bedsWomen: bedTotals.bedsWomen,
        bedsWomenAvailable: bedTotals.bedsWomenAvailable,
        bedsLgbtq: bedTotals.bedsLgbtq,
        bedsLgbtqAvailable: bedTotals.bedsLgbtqAvailable,
        bedsAvailableUpdatedAt: new Date(),
        pricePerWeek: numberFromForm(formData.get("pricePerWeek")),
        moveInCost: moveInCostText(formData.get("moveInCost")),
        insuranceAccepted: valuesFromForm(formData, "insuranceAccepted"),
        fundingAvailable: formData.get("fundingAvailable")
          ? formData.get("fundingAvailable") === "yes"
          : null,
        fundingNotes: nullableText(formData.get("fundingNotes")),
        wheelchairAccessibleBeds: numberFromForm(formData.get("wheelchairAccessibleBeds")),
        roomTypes: valuesFromForm(formData, "roomTypes"),
        bedTypes: valuesFromForm(formData, "bedTypes"),
        bedsReservedNotes: nullableText(formData.get("bedsReservedNotes")),
        availabilityNotes: nullableText(formData.get("availabilityNotes"))
      }
    });
  } else {
    await prisma.aftercareProfile.update({
      where: { id: profile.id },
      data: {
        acceptingNewPatients: formData.get("acceptingNewPatients") === "yes",
        acceptingNewPatientsUpdatedAt: new Date(),
        availabilityNotes: nullableText(formData.get("availabilityNotes")),
        programTypes: [],
        levelsOfCare: valuesFromForm(formData, "levelsOfCare"),
        programmingSchedule: valuesFromForm(formData, "programmingSchedule"),
        languagesServed: valuesFromForm(formData, "languagesServed"),
        telehealthMode: nullableText(formData.get("telehealthMode")),
        hoursOfOperation: null,
        coOccurringTreatment: null
      }
    });
  }

  revalidatePath("/dashboard/aftercare");
  revalidatePath(profileHref(profile.id));
  redirect(profileHref(profile.id, "Availability saved."));
}

export async function updateAftercareProfileContent(formData: FormData) {
  const profileId = String(formData.get("profileId") || "");
  const profile = await getOwnedProfile(profileId);
  ensureProfileCanBeEdited(profile);
  const videoUrls = valuesFromForm(formData, "videoUrls").filter((url) => /^https?:\/\/.+\..+/.test(url));
  const populationServedOptions = valuesFromForm(formData, "populationServedOptions");

  await prisma.aftercareProfile.update({
    where: { id: profile.id },
    data: {
      description: sanitizeRichText(nullableText(formData.get("description"))),
      houseRulesText: sanitizeRichText(nullableText(formData.get("houseRulesText"))),
      referralFitNotes: nullableText(formData.get("referralFitNotes")),
      referralProcessDescription: nullableText(formData.get("referralProcessDescription")),
      ...(profile.type === ProfileType.continued_care
        ? {
            populationServedOptions,
            populationServed: populationServedOptions.join(", ") || null,
            clientAcceptanceMethods: valuesFromForm(formData, "clientAcceptanceMethods")
          }
        : {}),
      specialtyPopulations: valuesFromForm(formData, "specialtyPopulations"),
      recoveryResidenceLevel: profile.type === ProfileType.sober_living
        ? nullableText(formData.get("recoveryResidenceLevel"))
        : null,
      certificationsHeld: valuesFromForm(formData, "certificationsHeld"),
      accreditations: profile.type === ProfileType.sober_living ? [] : valuesFromForm(formData, "accreditations"),
      clinicalFocus: profile.type === ProfileType.sober_living ? [] : valuesFromForm(formData, "clinicalFocus"),
      recoverySupportServices: profile.type === ProfileType.sober_living
        ? valuesFromForm(formData, "recoverySupportServices")
        : [],
      supportServices: valuesFromForm(formData, "supportServices"),
      amenities: valuesFromForm(formData, "amenities"),
      medicationAdministration: nullableText(formData.get("medicationAdministration")),
      medicationServicesOffered: valuesFromForm(formData, "medicationServicesOffered"),
      matAccepted: profile.type === ProfileType.continued_care &&
        !valuesFromForm(formData, "medicationServicesOffered").includes("MAT / Addiction medication management")
        ? []
        : valuesFromForm(formData, "matAccepted"),
      medicationRestrictions: nullableText(formData.get("medicationRestrictions")),
      drugTestingPolicy: nullableText(formData.get("drugTestingPolicy")),
      photoReadiness: valuesFromForm(formData, "photoReadiness"),
      videoUrls,
      goodNeighborPolicyAcknowledged: formData.get("goodNeighborPolicyAcknowledged") === "yes"
    }
  });

  revalidatePath("/dashboard/aftercare");
  revalidatePath(profileHref(profile.id));
  redirect(profileHref(profile.id, "Profile content saved."));
}

export async function uploadAftercareProfileImages(formData: FormData) {
  const profileId = String(formData.get("profileId") || "");
  const profile = await getOwnedProfile(profileId);
  ensureProfileCanBeEdited(profile);
  const files = imagesFromFormData(formData);

  if (!files.length) {
    redirect(profileHref(profile.id, "Choose at least one image to upload."));
  }

  let uploadedCount = 0;

  try {
    uploadedCount = await uploadProfileImagesForProfile(profile, files);
  } catch (error) {
    redirect(profileHref(profile.id, error instanceof Error ? error.message : "Image upload failed."));
  }

  revalidatePath("/dashboard/aftercare");
  revalidatePath(profileHref(profile.id));
  revalidatePath("/search");
  revalidatePath(`/profiles/${profile.slug}`);
  redirect(profileHref(profile.id, `${uploadedCount} image${uploadedCount === 1 ? "" : "s"} uploaded.`));
}

export async function setAftercareProfileCoverImage(formData: FormData) {
  const profileId = String(formData.get("profileId") || "");
  const imageId = String(formData.get("imageId") || "");
  const profile = await getOwnedProfile(profileId);
  ensureProfileCanBeEdited(profile);
  const image = await prisma.profileImage.findFirst({
    where: {
      id: imageId,
      profileId: profile.id
    },
    select: { id: true }
  });

  if (!image) {
    redirect(profileHref(profile.id, "Image not found."));
  }

  await prisma.$transaction([
    prisma.profileImage.updateMany({
      where: { profileId: profile.id },
      data: { isCover: false }
    }),
    prisma.profileImage.update({
      where: { id: image.id },
      data: { isCover: true }
    })
  ]);

  revalidatePath("/dashboard/aftercare");
  revalidatePath(profileHref(profile.id));
  revalidatePath("/search");
  revalidatePath(`/profiles/${profile.slug}`);
  redirect(profileHref(profile.id, "Cover image updated."));
}

export async function updateAftercareProfileImagePresentation(formData: FormData) {
  const profileId = String(formData.get("profileId") || "");
  const imageId = String(formData.get("imageId") || "");
  const requestedMode = String(formData.get("presentationMode") || "auto");
  const presentationMode = requestedMode === "photo" || requestedMode === "graphic" ? requestedMode : "auto";
  const requestedFocalX = Number.parseInt(String(formData.get("focalX") ?? "50"), 10);
  const requestedFocalY = Number.parseInt(String(formData.get("focalY") ?? "50"), 10);
  const focalX = Number.isFinite(requestedFocalX) ? Math.min(100, Math.max(0, requestedFocalX)) : 50;
  const focalY = Number.isFinite(requestedFocalY) ? Math.min(100, Math.max(0, requestedFocalY)) : 50;
  const profile = await getOwnedProfile(profileId);
  ensureProfileCanBeEdited(profile);
  const image = await prisma.profileImage.findFirst({
    where: { id: imageId, profileId: profile.id },
    select: { id: true }
  });

  if (!image) {
    redirect(profileHref(profile.id, "Image not found."));
  }

  await prisma.profileImage.update({
    where: { id: image.id },
    data: { focalX, focalY, presentationMode }
  });

  revalidatePath("/dashboard/aftercare");
  revalidatePath(profileHref(profile.id));
  revalidatePath("/search");
  revalidatePath(`/profiles/${profile.slug}`);
  revalidatePath(`/profiles/${profile.slug}/photos`);
  redirect(profileHref(profile.id, "Image fit updated."));
}

export async function removeAftercareProfileImage(formData: FormData) {
  const profileId = String(formData.get("profileId") || "");
  const imageId = String(formData.get("imageId") || "");
  const profile = await getOwnedProfile(profileId);
  ensureProfileCanBeEdited(profile);
  const removed = await removeProfileImageForProfile(profile.id, imageId);

  if (!removed) {
    redirect(profileHref(profile.id, "Image not found."));
  }

  revalidatePath("/dashboard/aftercare");
  revalidatePath(profileHref(profile.id));
  revalidatePath("/search");
  revalidatePath(`/profiles/${profile.slug}`);
  redirect(profileHref(profile.id, "Image removed."));
}

export async function addAssociatedContinuedCareProgram(formData: FormData) {
  const profileId = String(formData.get("profileId") || "");
  const continuedCareProfileId = String(formData.get("continuedCareProfileId") || "");
  const appUser = await getAftercareDashboardUser(profileHref(profileId));
  const profile = await getOwnedProfile(profileId);
  ensureProfileCanBeEdited(profile);

  if (profile.type !== ProfileType.sober_living) {
    redirect(profileHref(profile.id, "Associated continued care can only be added to sober living homes."));
  }

  const continuedCareProfile = await prisma.aftercareProfile.findFirst({
    where: {
      ...aftercareProfileIdWhereForUser(appUser, continuedCareProfileId),
      type: ProfileType.continued_care
    },
    select: { id: true }
  });

  if (!continuedCareProfile) {
    redirect(profileHref(profile.id, "Choose a continued care program from your organization."));
  }

  await prisma.profileAssociation.upsert({
    where: {
      soberLivingProfileId_continuedCareProfileId: {
        soberLivingProfileId: profile.id,
        continuedCareProfileId: continuedCareProfile.id
      }
    },
    create: {
      soberLivingProfileId: profile.id,
      continuedCareProfileId: continuedCareProfile.id
    },
    update: {}
  });

  revalidatePath(profileHref(profile.id));
  revalidatePath(`/profiles/${profile.slug}`);
  redirect(profileHref(profile.id, "Associated continued care program added."));
}

export async function removeAssociatedContinuedCareProgram(formData: FormData) {
  const profileId = String(formData.get("profileId") || "");
  const associationId = String(formData.get("associationId") || "");
  const profile = await getOwnedProfile(profileId);
  ensureProfileCanBeEdited(profile);

  await prisma.profileAssociation.deleteMany({
    where: {
      id: associationId,
      soberLivingProfileId: profile.id
    }
  });

  revalidatePath(profileHref(profile.id));
  revalidatePath(`/profiles/${profile.slug}`);
  redirect(profileHref(profile.id, "Associated continued care program removed."));
}

export async function updateAftercareProfileStatus(formData: FormData) {
  const profileId = String(formData.get("profileId") || "");
  const nextStatus = String(formData.get("status") || "");
  const appUser = await getAftercareDashboardUser(profileHref(profileId));
  const profile = await getOwnedProfile(profileId);
  ensureProfileCanBeEdited(profile);

  if (nextStatus === ProfileStatus.published) {
    const readiness = getAftercareProfileReadiness(profile);

    if (!readiness.canPublish) {
      redirect(profileHref(profile.id, readiness.blockers[0] || "Profile is not ready to publish."));
    }

    const profileLimit = getAftercareProfileLimit(profile.organization.subscriptionPlan);
    const planCountedProfileCount = await prisma.aftercareProfile.count({
      where: {
        orgId: profile.orgId,
        status: ProfileStatus.published
      }
    });
    const addedCount = profile.status === ProfileStatus.published ? 0 : 1;

    if (!isWithinPlanLimit(profileLimit, planCountedProfileCount, addedCount)) {
      redirect(
        profileHref(
          profile.id,
          "Your current plan has reached its profile limit. Upgrade before publishing another home or program."
        )
      );
    }
  }

  if (
    nextStatus !== ProfileStatus.published &&
    nextStatus !== ProfileStatus.draft &&
    nextStatus !== ProfileStatus.unpublished
  ) {
    redirect(profileHref(profile.id, "That profile status is not available."));
  }

  const status =
    nextStatus === ProfileStatus.published
      ? ProfileStatus.published
      : nextStatus === ProfileStatus.unpublished
        ? ProfileStatus.unpublished
        : ProfileStatus.draft;

  await prisma.aftercareProfile.update({
    where: { id: profile.id },
    data: {
      status,
      publishedAt: status === ProfileStatus.published ? new Date() : null,
      unpublishedAt: status === ProfileStatus.unpublished ? new Date() : null,
      unpublishedByUserId: status === ProfileStatus.unpublished ? appUser.id : null
    }
  });

  revalidatePath("/dashboard/aftercare");
  revalidatePath(profileHref(profile.id));
  revalidatePath("/search");
  revalidatePath(`/profiles/${profile.slug}`);

  const message =
    status === ProfileStatus.published
      ? "Profile published."
      : status === ProfileStatus.unpublished
        ? "Profile unpublished. It no longer appears in search and does not count toward your plan limit."
        : "Profile moved to draft.";

  redirect(profileHref(profile.id, message));
}
