"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { randomUUID } from "crypto";
import { ProfileStatus, ProfileType } from "@prisma/client";
import { getAftercareProfileReadiness } from "@/lib/aftercare-profile-readiness";
import { canManageAftercareProfile, canUseLiveAvailability } from "@/lib/feature-gates";
import { prisma } from "@/lib/prisma";
import { sanitizeRichText } from "@/lib/rich-text";
import { getAftercareDashboardUser } from "@/lib/protected-routing";
import { valuesFromForm } from "@/lib/sober-living-onboarding";
import { ensureProfileMediaBucket, profileMediaBucket } from "@/lib/supabase-storage";

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

async function getOwnedProfile(profileId: string) {
  const appUser = await getAftercareDashboardUser(`/dashboard/aftercare/profiles/${profileId}`);
  const profile = await prisma.aftercareProfile.findFirst({
    where: {
      id: profileId,
      orgId: appUser.orgId ?? undefined
    },
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

function safeFileName(value: string) {
  const extension = value.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "") || "jpg";
  return `${randomUUID()}.${extension}`;
}

export async function updateAftercareProfileBasics(formData: FormData) {
  const profileId = String(formData.get("profileId") || "");
  const profile = await getOwnedProfile(profileId);
  ensureProfileCanBeEdited(profile);
  const programName = String(formData.get("programName") || "").trim();
  const city = String(formData.get("city") || "").trim();
  const state = String(formData.get("state") || "").trim();

  if (!programName || !city || !state) {
    redirect(profileHref(profile.id, "Program name, city, and state are required."));
  }

  await prisma.aftercareProfile.update({
    where: { id: profile.id },
    data: {
      programName,
      streetAddress: nullableText(formData.get("streetAddress")),
      city,
      state,
      zip: nullableText(formData.get("zip")),
      publicCity: city,
      publicState: state,
      websiteUrl: nullableText(formData.get("websiteUrl")),
      admissionsContactPhone: nullableText(formData.get("admissionsContactPhone")),
      admissionsContactEmail: nullableText(formData.get("admissionsContactEmail")),
      preferredContactMethod: nullableText(formData.get("preferredContactMethod")),
      intakeContactName: nullableText(formData.get("intakeContactName")),
      stateLicenseNumber: nullableText(formData.get("stateLicenseNumber"))
    }
  });

  revalidatePath("/dashboard/aftercare");
  revalidatePath(profileHref(profile.id));
  redirect(profileHref(profile.id, "Basics saved."));
}

export async function updateAftercareProfileAvailability(formData: FormData) {
  const profileId = String(formData.get("profileId") || "");
  const profile = await getOwnedProfile(profileId);

  if (!canUseLiveAvailability(profile.organization, profile)) {
    redirect(profileHref(profile.id, "Live availability updates are available on Professional, Verified, and Network plans."));
  }

  if (profile.type === ProfileType.sober_living) {
    const bedsMen = numberFromForm(formData.get("bedsMen")) ?? 0;
    const bedsMenAvailable = numberFromForm(formData.get("bedsMenAvailable")) ?? 0;
    const bedsWomen = numberFromForm(formData.get("bedsWomen")) ?? 0;
    const bedsWomenAvailable = numberFromForm(formData.get("bedsWomenAvailable")) ?? 0;
    const bedsLgbtq = numberFromForm(formData.get("bedsLgbtq")) ?? 0;
    const bedsLgbtqAvailable = numberFromForm(formData.get("bedsLgbtqAvailable")) ?? 0;

    if (
      bedsMenAvailable > bedsMen ||
      bedsWomenAvailable > bedsWomen ||
      bedsLgbtqAvailable > bedsLgbtq
    ) {
      redirect(profileHref(profile.id, "Available beds cannot exceed total beds."));
    }

    await prisma.aftercareProfile.update({
      where: { id: profile.id },
      data: {
        totalBeds: bedsMen + bedsWomen + bedsLgbtq,
        bedsAvailable: bedsMenAvailable + bedsWomenAvailable + bedsLgbtqAvailable,
        bedsMen,
        bedsMenAvailable,
        bedsWomen,
        bedsWomenAvailable,
        bedsLgbtq,
        bedsLgbtqAvailable,
        bedsAvailableUpdatedAt: new Date(),
        pricePerWeek: numberFromForm(formData.get("pricePerWeek")),
        wheelchairAccessibleBeds: numberFromForm(formData.get("wheelchairAccessibleBeds")),
        roomTypes: valuesFromForm(formData, "roomTypes"),
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
        programTypes: valuesFromForm(formData, "programTypes"),
        levelsOfCare: valuesFromForm(formData, "levelsOfCare"),
        telehealthMode: nullableText(formData.get("telehealthMode")),
        hoursOfOperation: nullableText(formData.get("hoursOfOperation"))
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

  await prisma.aftercareProfile.update({
    where: { id: profile.id },
    data: {
      description: sanitizeRichText(nullableText(formData.get("description"))),
      houseRulesText: sanitizeRichText(nullableText(formData.get("houseRulesText"))),
      referralFitNotes: nullableText(formData.get("referralFitNotes")),
      referralProcessDescription: nullableText(formData.get("referralProcessDescription")),
      populationServedOptions: valuesFromForm(formData, "populationServedOptions"),
      populationServed: valuesFromForm(formData, "populationServedOptions").join(", ") || null,
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
  const files = formData
    .getAll("images")
    .filter((item): item is File => item instanceof File && item.size > 0);

  if (!files.length) {
    redirect(profileHref(profile.id, "Choose at least one image to upload."));
  }

  const currentImageCount = await prisma.profileImage.count({
    where: { profileId: profile.id }
  });

  if (currentImageCount + files.length > 6) {
    redirect(profileHref(profile.id, "Each profile can have up to 6 images for now."));
  }

  const invalidFile = files.find((file) => !file.type.startsWith("image/") || file.size > 10 * 1024 * 1024);

  if (invalidFile) {
    redirect(profileHref(profile.id, "Upload image files only, up to 10 MB each."));
  }

  const supabase = await ensureProfileMediaBucket();
  const createdImages = [];

  for (const [index, file] of files.entries()) {
    const storagePath = `${profile.orgId}/${profile.id}/${Date.now()}-${index}-${safeFileName(file.name)}`;
    const bytes = await file.arrayBuffer();
    const { error } = await supabase.storage
      .from(profileMediaBucket)
      .upload(storagePath, bytes, {
        contentType: file.type,
        upsert: false
      });

    if (error) {
      redirect(profileHref(profile.id, `Image upload failed: ${error.message}`));
    }

    const { data } = supabase.storage.from(profileMediaBucket).getPublicUrl(storagePath);

    createdImages.push({
      profileId: profile.id,
      url: data.publicUrl,
      storagePath,
      altText: profile.programName,
      sortOrder: currentImageCount + index,
      isCover: currentImageCount === 0 && index === 0
    });
  }

  await prisma.profileImage.createMany({ data: createdImages });

  revalidatePath("/dashboard/aftercare");
  revalidatePath(profileHref(profile.id));
  revalidatePath("/search");
  revalidatePath(`/profiles/${profile.slug}`);
  redirect(profileHref(profile.id, `${createdImages.length} image${createdImages.length === 1 ? "" : "s"} uploaded.`));
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

export async function removeAftercareProfileImage(formData: FormData) {
  const profileId = String(formData.get("profileId") || "");
  const imageId = String(formData.get("imageId") || "");
  const profile = await getOwnedProfile(profileId);
  ensureProfileCanBeEdited(profile);
  const image = await prisma.profileImage.findFirst({
    where: {
      id: imageId,
      profileId: profile.id
    },
    select: {
      id: true,
      storagePath: true,
      isCover: true
    }
  });

  if (!image) {
    redirect(profileHref(profile.id, "Image not found."));
  }

  const supabase = await ensureProfileMediaBucket();
  await supabase.storage.from(profileMediaBucket).remove([image.storagePath]);
  await prisma.profileImage.delete({ where: { id: image.id } });

  if (image.isCover) {
    const nextImage = await prisma.profileImage.findFirst({
      where: { profileId: profile.id },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
      select: { id: true }
    });

    if (nextImage) {
      await prisma.profileImage.update({
        where: { id: nextImage.id },
        data: { isCover: true }
      });
    }
  }

  revalidatePath("/dashboard/aftercare");
  revalidatePath(profileHref(profile.id));
  revalidatePath("/search");
  revalidatePath(`/profiles/${profile.slug}`);
  redirect(profileHref(profile.id, "Image removed."));
}

export async function updateAftercareProfileStatus(formData: FormData) {
  const profileId = String(formData.get("profileId") || "");
  const nextStatus = String(formData.get("status") || "");
  const profile = await getOwnedProfile(profileId);
  ensureProfileCanBeEdited(profile);

  if (nextStatus === ProfileStatus.published) {
    const readiness = getAftercareProfileReadiness(profile);

    if (!readiness.canPublish) {
      redirect(profileHref(profile.id, readiness.blockers[0] || "Profile is not ready to publish."));
    }
  }

  await prisma.aftercareProfile.update({
    where: { id: profile.id },
    data: {
      status: nextStatus === ProfileStatus.published ? ProfileStatus.published : ProfileStatus.draft,
      publishedAt: nextStatus === ProfileStatus.published ? new Date() : null
    }
  });

  revalidatePath("/dashboard/aftercare");
  revalidatePath(profileHref(profile.id));
  redirect(profileHref(profile.id, nextStatus === ProfileStatus.published ? "Profile published." : "Profile moved to draft."));
}
