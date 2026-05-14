import { randomUUID } from "crypto";
import { prisma } from "@/lib/prisma";
import { ensureProfileMediaBucket, profileMediaBucket } from "@/lib/supabase-storage";

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

  const currentImageCount = await prisma.profileImage.count({
    where: { profileId: profile.id }
  });

  if (currentImageCount + files.length > 6) {
    throw new Error("Each profile can have up to 6 images for now.");
  }

  const invalidFile = files.find((file) => !file.type.startsWith("image/") || file.size > 10 * 1024 * 1024);

  if (invalidFile) {
    throw new Error("Upload image files only, up to 10 MB each.");
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
