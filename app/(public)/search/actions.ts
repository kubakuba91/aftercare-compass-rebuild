"use server";

import { revalidatePath } from "next/cache";
import { ProfileStatus, Role } from "@prisma/client";
import { getCurrentAppUser } from "@/lib/current-user";
import { prisma } from "@/lib/prisma";

export async function toggleFavorite(profileId: string) {
  const appUser = await getCurrentAppUser();

  if (!appUser) {
    return { favorited: false, reason: "signin" };
  }

  if (
    !appUser.orgId ||
    (appUser.role !== Role.referent_admin && appUser.role !== Role.referent_manager)
  ) {
    return { favorited: false, reason: "not_allowed" };
  }

  const profile = await prisma.aftercareProfile.findFirst({
    where: {
      id: profileId,
      status: ProfileStatus.published
    },
    select: { id: true }
  });

  if (!profile) {
    return { favorited: false, reason: "not_found" };
  }

  const existing = await prisma.favorite.findUnique({
    where: {
      orgId_profileId: {
        orgId: appUser.orgId,
        profileId
      }
    },
    select: { id: true }
  });

  if (existing) {
    await prisma.favorite.delete({
      where: { id: existing.id }
    });
    revalidatePath("/search");
    revalidatePath("/dashboard/referent");

    return { favorited: false };
  }

  await prisma.favorite.create({
    data: {
      orgId: appUser.orgId,
      profileId,
      userId: appUser.id
    }
  });
  revalidatePath("/search");
  revalidatePath("/dashboard/referent");

  return { favorited: true };
}
