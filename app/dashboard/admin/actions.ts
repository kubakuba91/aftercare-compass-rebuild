"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  AdminReviewStatus,
  AdminReviewSubjectType,
  AftercareManagerScope,
  OrganizationType,
  ProfileOwnershipStatus,
  ProfileStatus,
  ProfileType,
  Role,
  SubscriptionStatus
} from "@prisma/client";
import { availabilityReplyExample } from "@/lib/availability-sms";
import { notifyProfileClaimApproved, notifyProfileClaimRejected } from "@/lib/email-notifications";
import { geocodeProfileAddress } from "@/lib/geocoding";
import { moveInCostText, nullableText, numberFromForm } from "@/lib/form-utils";
import { imagesFromFormData, removeProfileImageForProfile, uploadProfileImagesForProfile } from "@/lib/profile-images";
import { populationBedTotalsFromForm } from "@/lib/population-beds";
import { normalizePhoneForStorage } from "@/lib/phone";
import { profileOptionCategories, profileOptionCategoryKeys, type ProfileOptionCategory } from "@/lib/profile-options";
import { prisma } from "@/lib/prisma";
import { sanitizeRichText } from "@/lib/rich-text";
import { valuesFromForm } from "@/lib/sober-living-onboarding";
import { getProtectedAppUser } from "@/lib/protected-routing";
import { slugify } from "@/lib/slug";
import { sendSms } from "@/lib/sms";
import {
  claimOutreachCooldownDays,
  claimOutreachExpirationDays,
  createClaimOutreachToken,
  hashClaimOutreachToken,
  normalizeOutreachEmail,
  sendClaimOutreachEmail
} from "@/lib/profile-claim-outreach";

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

function adminEditProfileHref(profileId: string, message: string) {
  const params = new URLSearchParams({ message });

  return `/dashboard/admin/profiles/${profileId}/edit?${params.toString()}`;
}

function smsToken() {
  return `AC-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
}

export async function sendAdminBedAvailabilityTextCheck(formData: FormData) {
  const appUser = await getProtectedAppUser("/dashboard/admin");

  if (appUser.role !== Role.system_admin) {
    redirect("/dashboard");
  }

  const profileId = String(formData.get("profileId") || "");
  const managerId = String(formData.get("managerId") || "");
  const returnToProfiles = String(formData.get("returnTo") || "") === "profiles";
  const profile = await prisma.aftercareProfile.findFirst({
    where: {
      id: profileId,
      type: ProfileType.sober_living
    },
    select: {
      id: true,
      orgId: true,
      programName: true,
      bedsMen: true,
      bedsWomen: true,
      bedsLgbtq: true,
      bedsMenAvailable: true,
      bedsWomenAvailable: true,
      bedsLgbtqAvailable: true
    }
  });

  if (!profile) {
    redirect(adminProfileHref("Sober living profile was not found."));
  }

  const managers = await prisma.user.findMany({
    where: {
      ...(managerId ? { id: managerId } : {}),
      orgId: profile.orgId,
      isActive: true,
      smsOptIn: true,
      phone: { not: null },
      OR: [
        { role: Role.aftercare_admin },
        {
          role: Role.aftercare_manager,
          aftercareManagerScope: AftercareManagerScope.all_profiles
        },
        {
          role: Role.aftercare_manager,
          aftercareProfileAssignments: {
            some: { profileId: profile.id }
          }
        }
      ]
    },
    select: {
      id: true,
      phone: true
    },
    orderBy: { createdAt: "asc" },
    take: managerId ? 1 : 2
  });
  const manager = managers[0];

  if (!managerId && managers.length > 1) {
    redirect(adminEditProfileHref(profile.id, "Choose which SMS-enabled manager should receive this bed check."));
  }

  if (!manager?.phone) {
    redirect(
      returnToProfiles
        ? adminProfileHref(`${profile.programName} has no SMS-enabled manager available.`)
        : adminEditProfileHref(profile.id, "Choose an SMS-enabled manager for this home.")
    );
  }

  const token = smsToken();
  const body =
    `Aftercare Compass bed check for ${profile.programName}. ` +
    `Current: MEN ${profile.bedsMenAvailable ?? 0}/${profile.bedsMen ?? 0}, ` +
    `WOMEN ${profile.bedsWomenAvailable ?? 0}/${profile.bedsWomen ?? 0}, ` +
    `LGBTQ ${profile.bedsLgbtqAvailable ?? 0}/${profile.bedsLgbtq ?? 0}. ` +
    `Reply: ${token} MEN # WOMEN # LGBTQ #. Or NO CHANGE.`;

  const check = await prisma.availabilitySmsCheck.create({
    data: {
      token,
      orgId: profile.orgId,
      profileId: profile.id,
      userId: manager.id,
      phone: manager.phone,
      outboundBody: body
    }
  });

  try {
    await sendSms({ to: manager.phone, body });
    await prisma.$transaction([
      prisma.availabilitySmsCheck.update({
        where: { id: check.id },
        data: {
          status: "sent",
          sentAt: new Date()
        }
      }),
      prisma.adminAuditLog.create({
        data: {
          actorUserId: appUser.id,
          action: "bed_availability_check_sent",
          entityType: "AftercareProfile",
          entityId: profile.id,
          metadata: {
            managerId: manager.id,
            phone: manager.phone,
            token
          }
        }
      })
    ]);
  } catch (error) {
    await prisma.availabilitySmsCheck.update({
      where: { id: check.id },
      data: {
        status: "failed",
        errorMessage: error instanceof Error ? error.message : "SMS send failed"
      }
    });

    const message = `SMS could not be sent. Check Twilio configuration. ${availabilityReplyExample()}`;
    redirect(returnToProfiles ? adminProfileHref(message) : adminEditProfileHref(profile.id, message));
  }

  revalidatePath(`/dashboard/admin/profiles/${profile.id}/edit`);
  revalidatePath("/dashboard/admin");
  revalidatePath("/dashboard/aftercare");
  redirect(
    returnToProfiles
      ? adminProfileHref(`Bed check text sent for ${profile.programName}.`)
      : adminEditProfileHref(profile.id, "Bed check text sent.")
  );
}

function adminDataSettingsHref(message: string, category?: ProfileOptionCategory | null) {
  const params = new URLSearchParams({
    tab: "data-settings",
    reviewMessage: message
  });

  if (category) {
    params.set("dataCategory", category);
  }

  return `/dashboard/admin?${params.toString()}`;
}

function profileOptionCategory(value: FormDataEntryValue | null): ProfileOptionCategory | null {
  const category = String(value || "");

  return profileOptionCategoryKeys().includes(category as ProfileOptionCategory)
    ? category as ProfileOptionCategory
    : null;
}

function defaultProfileOptionIndex(optionId: string, category: ProfileOptionCategory) {
  const prefix = `default-${category}-`;

  if (!optionId.startsWith(prefix)) {
    return null;
  }

  const index = Number(optionId.slice(prefix.length));
  return Number.isInteger(index) && index >= 0 ? index : null;
}

function defaultProfileOptionLabel(optionId: string, category: ProfileOptionCategory) {
  const index = defaultProfileOptionIndex(optionId, category);

  if (index === null) {
    return null;
  }

  return profileOptionCategories[category].defaults[index] ?? null;
}

async function findOrCreateProfileOptionFromForm(formData: FormData) {
  const optionId = String(formData.get("optionId") || "");
  const existingOption = optionId
    ? await prisma.profileOption.findUnique({
        where: { id: optionId },
        select: {
          id: true,
          category: true,
          label: true,
          showForSoberLiving: true,
          showForContinuedCare: true,
          sortOrder: true
        }
      })
    : null;

  if (existingOption) {
    return existingOption;
  }

  const category = profileOptionCategory(formData.get("category"));

  if (!category) {
    return null;
  }

  const defaultLabel = defaultProfileOptionLabel(optionId, category);

  if (!defaultLabel) {
    return null;
  }

  const sortOrder = (defaultProfileOptionIndex(optionId, category) ?? 0) * 10 + 10;

  return prisma.profileOption.upsert({
    where: {
      category_label: {
        category,
        label: defaultLabel
      }
    },
    update: {},
    create: {
      category,
      label: defaultLabel,
      isActive: true,
      showForSoberLiving: true,
      showForContinuedCare: true,
      sortOrder
    },
    select: {
      id: true,
      category: true,
      label: true,
      showForSoberLiving: true,
      showForContinuedCare: true,
      sortOrder: true
    }
  });
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
    redirect(adminProfileHref(`${type === ProfileType.sober_living ? "Residence name" : "Program name"}, city, and state are required.`));
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
  const bedTotals = populationBedTotalsFromForm(formData, populationServedOptions, numberFromForm);
  const admissionsContactPhone = normalizePhoneForStorage(formData.get("admissionsContactPhone"));

  if (formData.get("admissionsContactPhone") && !admissionsContactPhone) {
    redirect(adminProfileHref(`Enter a valid 10-digit ${type === ProfileType.sober_living ? "intake phone" : "admissions phone"} number.`));
  }

  if (bedTotals.hasInvalidAvailableBeds) {
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
      admissionsContactPhone,
      admissionsContactEmail: nullableText(formData.get("admissionsContactEmail")),
      preferredContactMethod: nullableText(formData.get("preferredContactMethod")),
      intakeTurnaroundTime: type === ProfileType.sober_living
        ? nullableText(formData.get("intakeTurnaroundTime"))
        : null,
      intakeContactName: nullableText(formData.get("intakeContactName")),
      stateLicenseNumber: nullableText(formData.get("stateLicenseNumber")),
      websiteUrl: nullableText(formData.get("websiteUrl")),
      description: sanitizeRichText(String(formData.get("description") || "")) || null,
      houseRulesText: sanitizeRichText(nullableText(formData.get("houseRulesText"))),
      referralFitNotes: nullableText(formData.get("referralFitNotes")),
      referralProcessDescription: nullableText(formData.get("referralProcessDescription")),
      specialtyPopulations: valuesFromForm(formData, "specialtyPopulations"),
      recoveryResidenceLevel: type === ProfileType.sober_living
        ? nullableText(formData.get("recoveryResidenceLevel"))
        : null,
      certificationsHeld: valuesFromForm(formData, "certificationsHeld"),
      accreditations: type === ProfileType.sober_living ? [] : valuesFromForm(formData, "accreditations"),
      clinicalFocus: type === ProfileType.sober_living ? [] : valuesFromForm(formData, "clinicalFocus"),
      recoverySupportServices: type === ProfileType.sober_living
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
      availabilityNotes: nullableText(formData.get("availabilityNotes")),
      goodNeighborPolicyAcknowledged: formData.get("goodNeighborPolicyAcknowledged") === "yes",
      onboardingCompletedAt: new Date(),
      publishedAt: status === ProfileStatus.published ? new Date() : null,
      ...(type === ProfileType.continued_care
        ? {
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
            telehealthMode: nullableText(formData.get("telehealthMode")),
            hoursOfOperation: null,
            coOccurringTreatment: null
          }
        : {
            populationServedOptions,
            populationServed: populationServedOptions.join(", ") || null,
            bedsMen: bedTotals.bedsMen,
            bedsWomen: bedTotals.bedsWomen,
            bedsLgbtq: bedTotals.bedsLgbtq,
            bedsMenAvailable: bedTotals.bedsMenAvailable,
            bedsWomenAvailable: bedTotals.bedsWomenAvailable,
            bedsLgbtqAvailable: bedTotals.bedsLgbtqAvailable,
            totalBeds: bedTotals.totalBeds,
            bedsAvailable: bedTotals.bedsAvailable,
            bedsAvailableUpdatedAt: new Date(),
            roomTypes: valuesFromForm(formData, "roomTypes"),
            bedTypes: valuesFromForm(formData, "bedTypes"),
            bedsReservedNotes: nullableText(formData.get("bedsReservedNotes")),
            wheelchairAccessibleBeds: numberFromForm(formData.get("wheelchairAccessibleBeds")),
            pricePerWeek: numberFromForm(formData.get("pricePerWeek")),
            moveInCost: moveInCostText(formData.get("moveInCost"))
          }),
      ...(coordinates ?? {})
    }
  });

  const imageFiles = imagesFromFormData(formData);
  let imageUploadMessage = "";

  if (imageFiles.length) {
    try {
      const uploadedCount = await uploadProfileImagesForProfile(profile, imageFiles);
      imageUploadMessage = ` ${uploadedCount} image${uploadedCount === 1 ? "" : "s"} uploaded.`;
    } catch (error) {
      imageUploadMessage = ` Image upload failed: ${error instanceof Error ? error.message : "Unknown upload error."}`;
    }
  }

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
  redirect(adminProfileHref(`${profile.programName} was added as an unclaimed ${profileLabelForMessage(type)} profile.${imageUploadMessage}`));
}

export async function sendProfileClaimOutreach(formData: FormData) {
  const appUser = await getProtectedAppUser("/dashboard/admin");
  if (appUser.role !== Role.system_admin) redirect("/dashboard");

  const profileId = String(formData.get("profileId") || "");
  const profile = await prisma.aftercareProfile.findUnique({
    where: { id: profileId },
    select: {
      id: true,
      programName: true,
      publicCity: true,
      publicState: true,
      ownershipStatus: true,
      lastClaimOutreachAt: true,
      admissionsContactEmail: true,
      intakeContactName: true
    }
  });

  if (!profile || profile.ownershipStatus !== ProfileOwnershipStatus.unclaimed) {
    redirect(adminProfileHref("Claim invitations are available only for unclaimed profiles."));
  }

  const recipientEmail = normalizeOutreachEmail(profile.admissionsContactEmail || "");
  if (!recipientEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recipientEmail)) {
    redirect(adminProfileHref("Add a valid intake contact email before sending a claim invitation."));
  }

  if (!process.env.COMPANY_POSTAL_ADDRESS?.trim()) {
    redirect(adminProfileHref("Set COMPANY_POSTAL_ADDRESS before sending commercial claim invitations."));
  }

  const suppression = await prisma.emailSuppression.findUnique({
    where: { email: recipientEmail },
    select: { id: true }
  });

  if (suppression) {
    redirect(adminProfileHref(`${recipientEmail} has unsubscribed from profile-claim invitations.`));
  }
  const cooldownCutoff = new Date(Date.now() - claimOutreachCooldownDays * 24 * 60 * 60 * 1000);
  const reservedAt = new Date();
  const reservation = await prisma.aftercareProfile.updateMany({
    where: {
      id: profile.id,
      OR: [{ lastClaimOutreachAt: null }, { lastClaimOutreachAt: { lte: cooldownCutoff } }]
    },
    data: { lastClaimOutreachAt: reservedAt }
  });
  if (!reservation.count) {
    const availableAt = new Date((profile.lastClaimOutreachAt || reservedAt).getTime() + claimOutreachCooldownDays * 24 * 60 * 60 * 1000);
    redirect(adminProfileHref(`A claim invitation was already sent recently. Try again after ${availableAt.toLocaleDateString("en-US")}.`));
  }

  const token = createClaimOutreachToken();
  const outreach = await prisma.profileClaimOutreach.create({
    data: {
      profileId: profile.id,
      sentByUserId: appUser.id,
      recipientEmail,
      recipientName: profile.intakeContactName,
      tokenHash: hashClaimOutreachToken(token),
      expiresAt: new Date(Date.now() + claimOutreachExpirationDays * 24 * 60 * 60 * 1000)
    }
  }).catch(async () => {
    await prisma.aftercareProfile.updateMany({
      where: { id: profile.id, lastClaimOutreachAt: reservedAt },
      data: { lastClaimOutreachAt: profile.lastClaimOutreachAt }
    });
    return null;
  });
  if (!outreach) {
    redirect(adminProfileHref("The claim invitation could not be prepared. Please try again."));
  }
  const result = await sendClaimOutreachEmail({
    outreachId: outreach.id,
    token,
    recipientEmail,
    recipientName: profile.intakeContactName,
    programName: profile.programName,
    city: profile.publicCity,
    state: profile.publicState
  });
  const sent = result.status === "sent";
  const reason = "reason" in result ? result.reason : null;

  await prisma.$transaction([
    prisma.profileClaimOutreach.update({
      where: { id: outreach.id },
      data: {
        status: sent ? "sent" : result.status === "skipped" ? "skipped" : "failed",
        provider: "provider" in result ? result.provider : null,
        providerMessageId: "messageId" in result ? result.messageId : null,
        sentAt: sent ? new Date() : null,
        errorMessage: sent ? null : reason || "Email provider rejected the message."
      }
    }),
    prisma.adminAuditLog.create({
      data: {
        actorUserId: appUser.id,
        action: sent ? "profile_claim_outreach_sent" : "profile_claim_outreach_failed",
        entityType: "ProfileClaimOutreach",
        entityId: outreach.id,
        metadata: {
          profileId: profile.id,
          recipientEmail,
          provider: "provider" in result ? result.provider : null,
          status: result.status
        }
      }
    }),
    ...(!sent
      ? [prisma.aftercareProfile.updateMany({
          where: { id: profile.id, lastClaimOutreachAt: reservedAt },
          data: { lastClaimOutreachAt: profile.lastClaimOutreachAt }
        })]
      : [])
  ]);

  revalidatePath("/dashboard/admin");
  redirect(adminProfileHref(sent
    ? `Claim invitation sent to ${recipientEmail}.`
    : "The claim invitation could not be sent. Check the email configuration and try again."));
}

function profileLabelForMessage(type: ProfileType) {
  return type === ProfileType.sober_living ? "sober living" : "continued care";
}

export async function updateAdminProfileStatus(formData: FormData) {
  const appUser = await getProtectedAppUser("/dashboard/admin");

  if (appUser.role !== Role.system_admin) {
    redirect("/dashboard");
  }

  const profileId = String(formData.get("profileId") || "");
  const requestedStatus = String(formData.get("status") || "");

  if (
    !profileId ||
    (requestedStatus !== ProfileStatus.unpublished && requestedStatus !== ProfileStatus.draft)
  ) {
    redirect(adminProfileHref("Choose a valid listing action."));
  }

  const profile = await prisma.aftercareProfile.findUnique({
    where: { id: profileId },
    select: {
      id: true,
      programName: true,
      slug: true,
      status: true
    }
  });

  if (!profile) {
    redirect(adminProfileHref("Listing was not found."));
  }

  const status =
    requestedStatus === ProfileStatus.unpublished ? ProfileStatus.unpublished : ProfileStatus.draft;

  await prisma.aftercareProfile.update({
    where: { id: profile.id },
    data: {
      status,
      publishedAt: null,
      unpublishedAt: status === ProfileStatus.unpublished ? new Date() : null,
      unpublishedByUserId: status === ProfileStatus.unpublished ? appUser.id : null
    }
  });

  await prisma.adminAuditLog.create({
    data: {
      actorUserId: appUser.id,
      action: status === ProfileStatus.unpublished ? "profile_unpublished" : "profile_restored_to_draft",
      entityType: "AftercareProfile",
      entityId: profile.id,
      metadata: {
        previousStatus: profile.status,
        nextStatus: status,
        profileName: profile.programName
      }
    }
  });

  revalidatePath("/dashboard/admin");
  revalidatePath("/search");
  revalidatePath(`/profiles/${profile.slug}`);

  redirect(
    adminProfileHref(
      status === ProfileStatus.unpublished
        ? `${profile.programName} was unpublished.`
        : `${profile.programName} was restored as a draft.`
    )
  );
}

export async function updateAdminAftercareProfile(formData: FormData) {
  const appUser = await getProtectedAppUser("/dashboard/admin");

  if (appUser.role !== Role.system_admin) {
    redirect("/dashboard");
  }

  const profileId = String(formData.get("profileId") || "");
  const programName = String(formData.get("programName") || "").trim();
  const city = String(formData.get("city") || "").trim();
  const state = String(formData.get("state") || "").trim();

  if (!profileId || !programName || !city || !state) {
    redirect(adminProfileHref("Listing name, city, and state are required."));
  }

  const profile = await prisma.aftercareProfile.findUnique({
    where: { id: profileId },
    select: {
      id: true,
      type: true,
      slug: true,
      programName: true,
      status: true
    }
  });

  if (!profile) {
    redirect(adminProfileHref("Listing was not found."));
  }

  const requestedStatus = String(formData.get("status") || "");
  const status =
    requestedStatus === ProfileStatus.draft
      ? ProfileStatus.draft
      : requestedStatus === ProfileStatus.unpublished
        ? ProfileStatus.unpublished
        : ProfileStatus.published;

  const streetAddress = nullableText(formData.get("streetAddress"));
  const zip = nullableText(formData.get("zip"));
  const admissionsContactPhone = normalizePhoneForStorage(formData.get("admissionsContactPhone"));

  if (formData.get("admissionsContactPhone") && !admissionsContactPhone) {
    redirect(adminEditProfileHref(profile.id, `Enter a valid 10-digit ${profile.type === ProfileType.sober_living ? "intake phone" : "admissions phone"} number.`));
  }

  const coordinates = await geocodeProfileAddress({
    idSeed: profile.slug,
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
    admissionsContactPhone,
    admissionsContactEmail: nullableText(formData.get("admissionsContactEmail")),
    preferredContactMethod: nullableText(formData.get("preferredContactMethod")),
    intakeTurnaroundTime: profile.type === ProfileType.sober_living
      ? nullableText(formData.get("intakeTurnaroundTime"))
      : null,
    intakeContactName: nullableText(formData.get("intakeContactName")),
    stateLicenseNumber: nullableText(formData.get("stateLicenseNumber")),
    websiteUrl: nullableText(formData.get("websiteUrl")),
    description: sanitizeRichText(String(formData.get("description") || "")) || null,
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
    fundingAvailable: formData.get("fundingAvailable")
      ? formData.get("fundingAvailable") === "yes"
      : null,
    fundingNotes: nullableText(formData.get("fundingNotes")),
    medicationAdministration: nullableText(formData.get("medicationAdministration")),
    medicationServicesOffered: valuesFromForm(formData, "medicationServicesOffered"),
    matAccepted: valuesFromForm(formData, "matAccepted"),
    medicationRestrictions: nullableText(formData.get("medicationRestrictions")),
    drugTestingPolicy: nullableText(formData.get("drugTestingPolicy")),
    videoUrls,
    goodNeighborPolicyAcknowledged: formData.get("goodNeighborPolicyAcknowledged") === "yes",
    availabilityNotes: nullableText(formData.get("availabilityNotes")),
    status,
    publishedAt: status === ProfileStatus.published ? new Date() : null,
    unpublishedAt: status === ProfileStatus.unpublished ? new Date() : null,
    unpublishedByUserId: status === ProfileStatus.unpublished ? appUser.id : null,
    ...(coordinates ?? {})
  };

  let typeSpecificData = {};

  if (profile.type === ProfileType.sober_living) {
    const bedTotals = populationBedTotalsFromForm(formData, populationServedOptions, numberFromForm);

    if (bedTotals.hasInvalidAvailableBeds) {
      redirect(adminProfileHref("Available beds cannot exceed total beds."));
    }

    typeSpecificData = {
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
      wheelchairAccessibleBeds: numberFromForm(formData.get("wheelchairAccessibleBeds")),
      roomTypes: valuesFromForm(formData, "roomTypes"),
      bedTypes: valuesFromForm(formData, "bedTypes"),
      bedsReservedNotes: nullableText(formData.get("bedsReservedNotes"))
    };
  } else {
    typeSpecificData = {
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
      clientAcceptanceMethods: valuesFromForm(formData, "clientAcceptanceMethods"),
      telehealthMode: nullableText(formData.get("telehealthMode")),
      hoursOfOperation: null,
      coOccurringTreatment: null
    };
  }

  const updatedProfile = await prisma.aftercareProfile.update({
    where: { id: profile.id },
    data: {
      ...baseData,
      ...typeSpecificData
    }
  });

  const imageFiles = imagesFromFormData(formData);
  let imageUploadMessage = "";

  if (imageFiles.length) {
    try {
      const uploadedCount = await uploadProfileImagesForProfile(updatedProfile, imageFiles);
      imageUploadMessage = ` ${uploadedCount} image${uploadedCount === 1 ? "" : "s"} uploaded.`;
    } catch (error) {
      imageUploadMessage = ` Image upload failed: ${error instanceof Error ? error.message : "Unknown upload error."}`;
    }
  }

  await prisma.adminAuditLog.create({
    data: {
      actorUserId: appUser.id,
      action: "profile_updated",
      entityType: "AftercareProfile",
      entityId: profile.id,
      metadata: {
        previousStatus: profile.status,
        nextStatus: status,
        previousName: profile.programName,
        nextName: programName
      }
    }
  });

  revalidatePath("/dashboard/admin");
  revalidatePath("/search");
  revalidatePath(`/profiles/${profile.slug}`);

  redirect(adminProfileHref(`${programName} was updated.${imageUploadMessage}`));
}

export async function uploadAdminProfileImages(formData: FormData) {
  const appUser = await getProtectedAppUser("/dashboard/admin");

  if (appUser.role !== Role.system_admin) {
    redirect("/dashboard");
  }

  const profileId = String(formData.get("profileId") || "");
  const profile = await prisma.aftercareProfile.findUnique({
    where: { id: profileId },
    select: {
      id: true,
      orgId: true,
      programName: true,
      slug: true
    }
  });

  if (!profile) {
    redirect(adminProfileHref("Listing was not found."));
  }

  const files = imagesFromFormData(formData);

  if (!files.length) {
    redirect(adminEditProfileHref(profile.id, "Choose at least one image to upload."));
  }

  let uploadedCount = 0;

  try {
    uploadedCount = await uploadProfileImagesForProfile(profile, files);
  } catch (error) {
    redirect(adminEditProfileHref(profile.id, error instanceof Error ? error.message : "Image upload failed."));
  }

  await prisma.adminAuditLog.create({
    data: {
      actorUserId: appUser.id,
      action: "profile_images_uploaded",
      entityType: "AftercareProfile",
      entityId: profile.id,
      metadata: {
        profileName: profile.programName,
        uploadedCount
      }
    }
  });

  revalidatePath("/dashboard/admin");
  revalidatePath(`/dashboard/admin/profiles/${profile.id}/edit`);
  revalidatePath("/search");
  revalidatePath(`/profiles/${profile.slug}`);
  redirect(adminEditProfileHref(profile.id, `${uploadedCount} image${uploadedCount === 1 ? "" : "s"} uploaded.`));
}

export async function setAdminProfileCoverImage(formData: FormData) {
  const appUser = await getProtectedAppUser("/dashboard/admin");

  if (appUser.role !== Role.system_admin) {
    redirect("/dashboard");
  }

  const profileId = String(formData.get("profileId") || "");
  const imageId = String(formData.get("imageId") || "");
  const profile = await prisma.aftercareProfile.findUnique({
    where: { id: profileId },
    select: {
      id: true,
      slug: true,
      programName: true
    }
  });

  if (!profile) {
    redirect(adminProfileHref("Listing was not found."));
  }

  const image = await prisma.profileImage.findFirst({
    where: {
      id: imageId,
      profileId: profile.id
    },
    select: { id: true }
  });

  if (!image) {
    redirect(adminEditProfileHref(profile.id, "Image not found."));
  }

  await prisma.$transaction([
    prisma.profileImage.updateMany({
      where: { profileId: profile.id },
      data: { isCover: false }
    }),
    prisma.profileImage.update({
      where: { id: image.id },
      data: { isCover: true }
    }),
    prisma.adminAuditLog.create({
      data: {
        actorUserId: appUser.id,
        action: "profile_cover_image_updated",
        entityType: "AftercareProfile",
        entityId: profile.id,
        metadata: {
          profileName: profile.programName,
          imageId: image.id
        }
      }
    })
  ]);

  revalidatePath("/dashboard/admin");
  revalidatePath(`/dashboard/admin/profiles/${profile.id}/edit`);
  revalidatePath("/search");
  revalidatePath(`/profiles/${profile.slug}`);
  redirect(adminEditProfileHref(profile.id, "Cover image updated."));
}

export async function removeAdminProfileImage(formData: FormData) {
  const appUser = await getProtectedAppUser("/dashboard/admin");

  if (appUser.role !== Role.system_admin) {
    redirect("/dashboard");
  }

  const profileId = String(formData.get("profileId") || "");
  const imageId = String(formData.get("imageId") || "");
  const profile = await prisma.aftercareProfile.findUnique({
    where: { id: profileId },
    select: {
      id: true,
      slug: true,
      programName: true
    }
  });

  if (!profile) {
    redirect(adminProfileHref("Listing was not found."));
  }

  const removed = await removeProfileImageForProfile(profile.id, imageId);

  if (!removed) {
    redirect(adminEditProfileHref(profile.id, "Image not found."));
  }

  await prisma.adminAuditLog.create({
    data: {
      actorUserId: appUser.id,
      action: "profile_image_removed",
      entityType: "AftercareProfile",
      entityId: profile.id,
      metadata: {
        profileName: profile.programName,
        imageId
      }
    }
  });

  revalidatePath("/dashboard/admin");
  revalidatePath(`/dashboard/admin/profiles/${profile.id}/edit`);
  revalidatePath("/search");
  revalidatePath(`/profiles/${profile.slug}`);
  redirect(adminEditProfileHref(profile.id, "Image removed."));
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

export async function addProfileOption(formData: FormData) {
  const appUser = await getProtectedAppUser("/dashboard/admin");

  if (appUser.role !== Role.system_admin) {
    redirect("/dashboard");
  }

  const category = profileOptionCategory(formData.get("category"));
  const label = String(formData.get("label") || "").trim().replace(/\s+/g, " ");

  if (!category || !label) {
    redirect(adminDataSettingsHref("Choose a category and enter an option label."));
  }

  const lastOption = await prisma.profileOption.findFirst({
    where: { category },
    orderBy: { sortOrder: "desc" },
    select: { sortOrder: true }
  });

  await prisma.profileOption.upsert({
    where: {
      category_label: {
        category,
        label
      }
    },
    update: {
      isActive: true,
      showForSoberLiving: true,
      showForContinuedCare: true
    },
    create: {
      category,
      label,
      isActive: true,
      showForSoberLiving: true,
      showForContinuedCare: true,
      sortOrder: (lastOption?.sortOrder ?? 0) + 10
    }
  });

  await prisma.adminAuditLog.create({
    data: {
      actorUserId: appUser.id,
      action: "profile_option_added",
      entityType: "ProfileOption",
      entityId: `${category}:${label}`,
      metadata: {
        category,
        label,
        categoryLabel: profileOptionCategories[category].label
      }
    }
  });

  revalidatePath("/dashboard/admin");
  revalidatePath("/dashboard/aftercare");
  redirect(adminDataSettingsHref(`${label} is available in ${profileOptionCategories[category].label}.`, category));
}

export async function updateProfileOptionStatus(formData: FormData) {
  const appUser = await getProtectedAppUser("/dashboard/admin");

  if (appUser.role !== Role.system_admin) {
    redirect("/dashboard");
  }

  const isActive = String(formData.get("isActive") || "") === "true";
  const existingOption = await findOrCreateProfileOptionFromForm(formData);

  if (!existingOption) {
    redirect(adminDataSettingsHref("Option was not found."));
  }

  const option = await prisma.profileOption.update({
    where: { id: existingOption.id },
    data: { isActive },
    select: {
      id: true,
      category: true,
      label: true
    }
  });
  const category = profileOptionCategory(option.category);

  if (!category) {
    redirect(adminDataSettingsHref("Option category is no longer supported."));
  }

  await prisma.adminAuditLog.create({
    data: {
      actorUserId: appUser.id,
      action: isActive ? "profile_option_enabled" : "profile_option_disabled",
      entityType: "ProfileOption",
      entityId: option.id,
      metadata: {
        category,
        label: option.label,
        categoryLabel: profileOptionCategories[category].label
      }
    }
  });

  revalidatePath("/", "layout");
  revalidatePath("/search");
  revalidatePath("/dashboard/admin");
  revalidatePath("/dashboard/aftercare");
  revalidatePath("/onboarding/aftercare/sober-living/1");
  revalidatePath("/onboarding/aftercare/continued-care/1");
  redirect(adminDataSettingsHref(`${option.label} was ${isActive ? "enabled" : "disabled"}.`, category));
}

export async function updateProfileOptionVisibility(formData: FormData) {
  const appUser = await getProtectedAppUser("/dashboard/admin");

  if (appUser.role !== Role.system_admin) {
    redirect("/dashboard");
  }

  const visibility = String(formData.get("visibility") || "");
  const existingOption = await findOrCreateProfileOptionFromForm(formData);

  if (!existingOption) {
    redirect(adminDataSettingsHref("Option was not found."));
  }

  const category = profileOptionCategory(existingOption.category);

  if (!category) {
    redirect(adminDataSettingsHref("Option category is no longer supported."));
  }

  const data = visibility === "continued_care"
    ? { showForContinuedCare: !existingOption.showForContinuedCare }
    : { showForSoberLiving: !existingOption.showForSoberLiving };

  const option = await prisma.profileOption.update({
    where: { id: existingOption.id },
    data,
    select: {
      id: true,
      label: true,
      showForSoberLiving: true,
      showForContinuedCare: true
    }
  });

  await prisma.adminAuditLog.create({
    data: {
      actorUserId: appUser.id,
      action: "profile_option_visibility_updated",
      entityType: "ProfileOption",
      entityId: option.id,
      metadata: {
        category,
        label: option.label,
        categoryLabel: profileOptionCategories[category].label,
        showForSoberLiving: option.showForSoberLiving,
        showForContinuedCare: option.showForContinuedCare
      }
    }
  });

  revalidatePath("/", "layout");
  revalidatePath("/search");
  revalidatePath("/dashboard/admin");
  revalidatePath("/dashboard/aftercare");
  revalidatePath("/onboarding/aftercare/sober-living/1");
  revalidatePath("/onboarding/aftercare/continued-care/1");
  redirect(adminDataSettingsHref(`${option.label} visibility updated.`, category));
}

export async function updateProfileOptionLabel(formData: FormData) {
  const appUser = await getProtectedAppUser("/dashboard/admin");

  if (appUser.role !== Role.system_admin) {
    redirect("/dashboard");
  }

  const label = String(formData.get("label") || "").trim().replace(/\s+/g, " ");
  const existingOption = await findOrCreateProfileOptionFromForm(formData);

  if (!existingOption || !label) {
    redirect(adminDataSettingsHref("Choose an option and enter a label."));
  }

  const category = profileOptionCategory(existingOption.category);

  if (!category) {
    redirect(adminDataSettingsHref("Option category is no longer supported."));
  }

  const duplicate = await prisma.profileOption.findUnique({
    where: {
      category_label: {
        category,
        label
      }
    },
    select: { id: true }
  });

  if (duplicate && duplicate.id !== existingOption.id) {
    redirect(adminDataSettingsHref(`${label} already exists in ${profileOptionCategories[category].label}.`, category));
  }

  const option = await prisma.profileOption.update({
    where: { id: existingOption.id },
    data: { label },
    select: {
      id: true,
      label: true
    }
  });

  await prisma.adminAuditLog.create({
    data: {
      actorUserId: appUser.id,
      action: "profile_option_renamed",
      entityType: "ProfileOption",
      entityId: option.id,
      metadata: {
        category,
        previousLabel: existingOption.label,
        nextLabel: option.label,
        categoryLabel: profileOptionCategories[category].label
      }
    }
  });

  revalidatePath("/", "layout");
  revalidatePath("/search");
  revalidatePath("/dashboard/admin");
  revalidatePath("/dashboard/aftercare");
  revalidatePath("/onboarding/aftercare/sober-living/1");
  revalidatePath("/onboarding/aftercare/continued-care/1");
  redirect(adminDataSettingsHref(`${existingOption.label} was renamed to ${option.label}.`, category));
}
