import { randomUUID } from "crypto";
import { formatPhotoLimit, getAftercarePhotoLimit, isWithinPlanLimit } from "@/lib/feature-gates";
import { prisma } from "@/lib/prisma";
import { ensureProfileMediaBucket, profileMediaBucket } from "@/lib/supabase-storage";

const maxUploadImageSize = 10 * 1024 * 1024;

type ProfileImageUploadTarget = {
  id: string;
  orgId: string;
  programName: string;
};

function safeFileName(value: string) {
  const extension = value.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "") || "jpg";
  return `${randomUUID()}.${extension}`;
}

export function imagesFromFormData(formData: FormData) {
  return formData
    .getAll("images")
    .filter((item): item is File => item instanceof File && item.size > 0);
}

export async function uploadProfileImagesForProfile(profile: ProfileImageUploadTarget, files: File[]) {
  if (!files.length) {
    return 0;
  }

  const profileRecord = await prisma.aftercareProfile.findFirst({
    where: {
      id: profile.id,
      orgId: profile.orgId
    },
    select: {
      id: true,
      organization: {
        select: {
          subscriptionPlan: true
        }
      },
      _count: {
        select: {
          images: true
        }
      }
    }
  });

  if (!profileRecord) {
    throw new Error("Profile could not be found for this account.");
  }

  const currentImageCount = profileRecord._count.images;
  const photoLimit = getAftercarePhotoLimit(profileRecord.organization.subscriptionPlan);

  if (!isWithinPlanLimit(photoLimit, currentImageCount, files.length)) {
    throw new Error(
      `Your current plan includes ${formatPhotoLimit(photoLimit)}. Remove a photo or upgrade to add more.`
    );
  }

  const invalidFile = files.find((file) => !file.type.startsWith("image/") || file.size > maxUploadImageSize);

  if (invalidFile) {
    throw new Error("Upload image files only, up to 10 MB each. Try a smaller image or export it as JPG/WebP before uploading.");
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
      throw new Error(`Image upload failed: ${error.message}`);
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

  return createdImages.length;
}

export async function removeProfileImageForProfile(profileId: string, imageId: string) {
  const image = await prisma.profileImage.findFirst({
    where: {
      id: imageId,
      profileId
    },
    select: {
      id: true,
      storagePath: true,
      isCover: true
    }
  });

  if (!image) {
    return false;
  }

  const supabase = await ensureProfileMediaBucket();
  await supabase.storage.from(profileMediaBucket).remove([image.storagePath]);
  await prisma.profileImage.delete({ where: { id: image.id } });

  if (image.isCover) {
    const nextImage = await prisma.profileImage.findFirst({
      where: { profileId },
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

  return true;
}
