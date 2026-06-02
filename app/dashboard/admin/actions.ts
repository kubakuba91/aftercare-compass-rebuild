"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  AdminReviewStatus,
  AdminReviewSubjectType,
  OrganizationType,
  ProfileOwnershipStatus,
  ProfileStatus,
  ProfileType,
  Role,
  SubscriptionStatus
} from "@prisma/client";
import { notifyProfileClaimApproved, notifyProfileClaimRejected } from "@/lib/email-notifications";
import { geocodeProfileAddress } from "@/lib/geocoding";
import { prisma } from "@/lib/prisma";
import { sanitizeRichText } from "@/lib/rich-text";
import { valuesFromForm } from "@/lib/sober-living-onboarding";
import { getProtectedAppUser } from "@/lib/protected-routing";
import { slugify } from "@/lib/slug";

function adminReviewHref(message: string) {
  const params = new URLSearchParams({
    tab: "verification",
    reviewMessage: message
  });

  return `/dashboard/admin?${params.toString()}`;
}

function adminClaimHref(message: string) {
  const params = new URLSearchParams({
    tab: "claims",
    reviewMessage: message
  });

  return `/dashboard/admin?${params.toString()}`;
}

function adminProfileHref(message: string) {
  const params = new URLSearchParams({
    tab: "profiles",
    reviewMessage: message
  });

  return `/dashboard/admin?${params.toString()}`;
}

function nullableText(value: FormDataEntryValue | null) {
  const text = String(value || "").trim();
  return text || null;
}

function numberFromForm(value: FormDataEntryValue | null) {
  if (value === null || value === "") {
    return null;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.max(0, Math.trunc(parsed)) : null;
}

async function uniqueProfileSlug(programName: string) {
  const baseSlug = slugify(programName) || "aftercare-profile";
  let slug = baseSlug;
  let suffix = 2;

  while (await prisma.aftercareProfile.findUnique({ where: { slug }, select: { id: true } })) {
    slug = `${baseSlug}-${suffix}`;
    suffix += 1;
  }

  return slug;
}

function systemSeedOrgId(type: ProfileType) {
  return type === ProfileType.sober_living
    ? "system-unclaimed-sober-living"
    : "system-unclaimed-continued-care";
}

async function getOrCreateSystemSeedOrg(type: ProfileType) {
  const orgType = type === ProfileType.sober_living
    ? OrganizationType.aftercare_sober_living
    : OrganizationType.aftercare_continued_care;
  const name = type === ProfileType.sober_living
    ? "Unclaimed Sober Living Listings"
    : "Unclaimed Continued Care Listings";

  return prisma.organization.upsert({
    where: { id: systemSeedOrgId(type) },
    update: {},
    create: {
      id: systemSeedOrgId(type),
      type: orgType,
      name,
      subscriptionPlan: "claimed_listing",
      subscriptionStatus: SubscriptionStatus.active
    },
    select: { id: true }
  });
}

export async function createUnclaimedAftercareProfile(formData: FormData) {
  const appUser = await getProtectedAppUser("/dashboard/admin");

  if (appUser.role !== Role.system_admin) {
    redirect("/dashboard");
  }

  const typeValue = String(formData.get("type") || "");
  const type = typeValue === ProfileType.continued_care ? ProfileType.continued_care : ProfileType.sober_living;
  const programName = String(formData.get("programName") || "").trim();
  const streetAddress = nullableText(formData.get("streetAddress"));
  const city = String(formData.get("city") || "").trim();
  const state = String(formData.get("state") || "").trim();
  const zip = nullableText(formData.get("zip"));
  const status = String(formData.get("status") || "") === ProfileStatus.draft
    ? ProfileStatus.draft
    : ProfileStatus.published;

  if (!programName || !city || !state) {
    redirect(adminProfileHref("Program name, city, and state are required."));
  }

  const [org, slug] = await Promise.all([
    getOrCreateSystemSeedOrg(type),
    uniqueProfileSlug(programName)
  ]);
  const coordinates = await geocodeProfileAddress({
    idSeed: slug,
    streetAddress,
    city,
    state,
    zip
  });

  const populationServedOptions = valuesFromForm(formData, "populationServedOptions");
  const selectedPopulations = new Set(populationServedOptions);
  const bedsMen = selectedPopulations.has("Men") ? numberFromForm(formData.get("bedsMen")) ?? 0 : 0;
  const bedsMenAvailable = selectedPopulations.has("Men") ? numberFromForm(formData.get("bedsMenAvailable")) ?? 0 : 0;
  const bedsWomen = selectedPopulations.has("Women") ? numberFromForm(formData.get("bedsWomen")) ?? 0 : 0;
  const bedsWomenAvailable = selectedPopulations.has("Women") ? numberFromForm(formData.get("bedsWomenAvailable")) ?? 0 : 0;
  const bedsLgbtq = selectedPopulations.has("LGBTQ+") ? numberFromForm(formData.get("bedsLgbtq")) ?? 0 : 0;
  const bedsLgbtqAvailable = selectedPopulations.has("LGBTQ+") ? numberFromForm(formData.get("bedsLgbtqAvailable")) ?? 0 : 0;

  if (
    bedsMenAvailable > bedsMen ||
    bedsWomenAvailable > bedsWomen ||
    bedsLgbtqAvailable > bedsLgbtq
  ) {
    redirect(adminProfileHref("Available beds cannot exceed total beds."));
  }

  const profile = await prisma.aftercareProfile.create({
    data: {
      orgId: org.id,
      type,
      programName,
      slug,
      status,
      ownershipStatus: ProfileOwnershipStatus.unclaimed,
      seededByUserId: appUser.id,
      streetAddress,
      city,
      state,
      zip,
      publicCity: city,
      publicState: state,
      admissionsContactPhone: nullableText(formData.get("admissionsContactPhone")),
      admissionsContactEmail: nullableText(formData.get("admissionsContactEmail")),
      preferredContactMethod: nullableText(formData.get("preferredContactMethod")),
      intakeContactName: nullableText(formData.get("intakeContactName")),
      stateLicenseNumber: nullableText(formData.get("stateLicenseNumber")),
      websiteUrl: nullableText(formData.get("websiteUrl")),
      description: sanitizeRichText(String(formData.get("description") || "")) || null,
      houseRulesText: sanitizeRichText(nullableText(formData.get("houseRulesText"))),
      referralFitNotes: nullableText(formData.get("referralFitNotes")),
      referralProcessDescription: nullableText(formData.get("referralProcessDescription")),
      specialtyPopulations: valuesFromForm(formData, "specialtyPopulations"),
      certificationsHeld: valuesFromForm(formData, "certificationsHeld"),
      supportServices: valuesFromForm(formData, "supportServices"),
      amenities: valuesFromForm(formData, "amenities"),
      insuranceAccepted: valuesFromForm(formData, "insuranceAccepted"),
      fundingAvailable: formData.get("fundingAvailable")
        ? formData.get("fundingAvailable") === "yes"
        : null,
      fundingNotes: nullableText(formData.get("fundingNotes")),
      medicationAdministration: nullableText(formData.get("medicationAdministration")),
      matAccepted: valuesFromForm(formData, "matAccepted"),
      medicationRestrictions: nullableText(formData.get("medicationRestrictions")),
      drugTestingPolicy: nullableText(formData.get("drugTestingPolicy")),
      availabilityNotes: nullableText(formData.get("availabilityNotes")),
      goodNeighborPolicyAcknowledged: formData.get("goodNeighborPolicyAcknowledged") === "yes",
      onboardingCompletedAt: new Date(),
      publishedAt: status === ProfileStatus.published ? new Date() : null,
      ...(type === ProfileType.continued_care
        ? {
            acceptingNewPatients: formData.get("acceptingNewPatients") === "yes",
            acceptingNewPatientsUpdatedAt: new Date(),
            programTypes: valuesFromForm(formData, "programTypes"),
            levelsOfCare: valuesFromForm(formData, "levelsOfCare"),
            telehealthMode: nullableText(formData.get("telehealthMode")),
            hoursOfOperation: nullableText(formData.get("hoursOfOperation"))
          }
        : {
            populationServedOptions,
            populationServed: populationServedOptions.join(", ") || null,
            bedsMen,
            bedsWomen,
            bedsLgbtq,
            bedsMenAvailable,
            bedsWomenAvailable,
            bedsLgbtqAvailable,
            totalBeds: bedsMen + bedsWomen + bedsLgbtq,
            bedsAvailable: bedsMenAvailable + bedsWomenAvailable + bedsLgbtqAvailable,
            bedsAvailableUpdatedAt: new Date(),
            roomTypes: valuesFromForm(formData, "roomTypes"),
            bedsReservedNotes: nullableText(formData.get("bedsReservedNotes")),
            wheelchairAccessibleBeds: numberFromForm(formData.get("wheelchairAccessibleBeds")),
            pricePerWeek: numberFromForm(formData.get("pricePerWeek")),
            moveInCost: nullableText(formData.get("moveInCost"))
          }),
      ...(coordinates ?? {})
    }
  });

  await prisma.adminAuditLog.create({
    data: {
      actorUserId: appUser.id,
      action: "unclaimed_profile_created",
      entityType: "AftercareProfile",
      entityId: profile.id,
      metadata: {
        profileName: profile.programName,
        profileType: profile.type,
        status: profile.status
      }
    }
  });

  revalidatePath("/dashboard/admin");
  revalidatePath("/search");
  revalidatePath(`/profiles/${profile.slug}`);
  redirect(adminProfileHref(`${profile.programName} was added as an unclaimed ${profileLabelForMessage(type)} profile.`));
}

function profileLabelForMessage(type: ProfileType) {
  return type === ProfileType.sober_living ? "sober living" : "continued care";
}

export async function reviewOnboardingSubmission(formData: FormData) {
  const appUser = await getProtectedAppUser("/dashboard/admin");

  if (appUser.role !== Role.system_admin) {
    redirect("/dashboard");
  }

  const reviewId = String(formData.get("reviewId") || "");
  const decision = String(formData.get("decision") || "");
  const reviewerNotes = String(formData.get("reviewerNotes") || "").trim() || null;

  if (!reviewId || (decision !== "approved" && decision !== "rejected")) {
    redirect(adminReviewHref("Choose approve or reject for a valid application."));
  }

  const review = await prisma.adminReview.findUnique({
    where: { id: reviewId },
    select: {
      id: true,
      subjectType: true,
      status: true,
      profileId: true,
      organization: {
        select: {
          name: true
        }
      },
      profile: {
        select: {
          programName: true
        }
      }
    }
  });

  if (!review) {
    redirect(adminReviewHref("Application review was not found."));
  }

  if (review.status !== AdminReviewStatus.pending) {
    redirect(adminReviewHref("This application has already been reviewed."));
  }

  const nextStatus = decision === "approved" ? AdminReviewStatus.approved : AdminReviewStatus.rejected;

  await prisma.$transaction(async (tx) => {
    await tx.adminReview.update({
      where: { id: review.id },
      data: {
        status: nextStatus,
        reviewerNotes,
        reviewedByUserId: appUser.id,
        reviewedAt: new Date()
      }
    });

    if (
      nextStatus === AdminReviewStatus.approved &&
      review.subjectType === AdminReviewSubjectType.aftercare_profile &&
      review.profileId
    ) {
      await tx.aftercareProfile.update({
        where: { id: review.profileId },
        data: {
          verificationTier: 2
        }
      });
    }
  });

  revalidatePath("/dashboard/admin");
  revalidatePath("/search");
  if (review.profileId) {
    revalidatePath("/profiles/[slug]", "page");
  }

  const subjectName = review.profile?.programName || review.organization.name;
  redirect(adminReviewHref(`${subjectName} ${decision}.`));
}

export async function reviewProfileClaimRequest(formData: FormData) {
  const appUser = await getProtectedAppUser("/dashboard/admin");

  if (appUser.role !== Role.system_admin) {
    redirect("/dashboard");
  }

  const claimRequestId = String(formData.get("claimRequestId") || "");
  const decision = String(formData.get("decision") || "");
  const reviewerNotes = String(formData.get("reviewerNotes") || "").trim() || null;

  if (!claimRequestId || (decision !== "approved" && decision !== "rejected")) {
    redirect(adminClaimHref("Choose approve or reject for a valid claim."));
  }

  const claim = await prisma.profileClaimRequest.findUnique({
    where: { id: claimRequestId },
    include: {
      claimantUser: {
        include: {
          organization: true
        }
      },
      profile: {
        select: {
          id: true,
          orgId: true,
          type: true,
          slug: true,
          programName: true,
          ownershipStatus: true,
          verificationTier: true
        }
      }
    }
  });

  if (!claim) {
    redirect(adminClaimHref("Claim request was not found."));
  }

  if (claim.status !== "pending") {
    redirect(adminClaimHref("This claim has already been reviewed."));
  }

  if (decision === "approved") {
    const claimantOrg = claim.claimantUser?.organization;
    const requiredOrgType =
      claim.profile.type === "sober_living"
        ? OrganizationType.aftercare_sober_living
        : OrganizationType.aftercare_continued_care;

    if (!claim.claimantUser || !claim.claimantUser.orgId || claimantOrg?.type !== requiredOrgType) {
      redirect(adminClaimHref("The claimant does not have a matching aftercare organization."));
    }
  }

  await prisma.$transaction(async (tx) => {
    await tx.profileClaimRequest.update({
      where: { id: claim.id },
      data: {
        status: decision === "approved" ? "approved" : "rejected",
        reviewerNotes,
        reviewedByUserId: appUser.id,
        reviewedAt: new Date()
      }
    });

    if (decision === "approved") {
      await tx.aftercareProfile.update({
        where: { id: claim.profileId },
        data: {
          orgId: claim.claimantUser!.orgId!,
          ownershipStatus: "claimed",
          claimedAt: new Date(),
          claimedByUserId: claim.claimantUser!.id,
          verificationTier: Math.max(claim.profile.verificationTier, 2)
        }
      });

      await tx.profileClaimRequest.updateMany({
        where: {
          profileId: claim.profileId,
          status: "pending",
          NOT: { id: claim.id }
        },
        data: {
          status: "cancelled",
          reviewerNotes: "Cancelled because another claim was approved.",
          reviewedByUserId: appUser.id,
          reviewedAt: new Date()
        }
      });
    } else {
      await tx.aftercareProfile.update({
        where: { id: claim.profileId },
        data: {
          ownershipStatus: "unclaimed"
        }
      });
    }

    await tx.adminAuditLog.create({
      data: {
        actorUserId: appUser.id,
        action: decision === "approved" ? "profile_claim_approved" : "profile_claim_rejected",
        entityType: "ProfileClaimRequest",
        entityId: claim.id,
        metadata: {
          profileId: claim.profileId,
          profileName: claim.profile.programName,
          claimantEmail: claim.claimantEmail,
          claimantUserId: claim.claimantUserId,
          previousOrgId: claim.profile.orgId,
          newOrgId: decision === "approved" ? claim.claimantUser?.orgId : null
        }
      }
    });
  });

  if (decision === "approved") {
    await notifyProfileClaimApproved(claim.id);
  } else {
    await notifyProfileClaimRejected(claim.id);
  }

  revalidatePath("/dashboard/admin");
  revalidatePath("/search");
  revalidatePath(`/profiles/${claim.profile.slug}`);

  redirect(adminClaimHref(`${claim.profile.programName} claim ${decision}.`));
}
