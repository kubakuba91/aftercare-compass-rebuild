"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { ProfileType } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getAftercareDashboardUser } from "@/lib/protected-routing";

function numberFromForm(value: FormDataEntryValue | null) {
  if (value === null || value === "") {
    return null;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.max(0, Math.trunc(parsed)) : null;
}

export async function updateAftercareAvailability(formData: FormData) {
  const appUser = await getAftercareDashboardUser("/dashboard/aftercare");
  const profileId = String(formData.get("profileId") || "");

  const profile = await prisma.aftercareProfile.findFirst({
    where: {
      id: profileId,
      orgId: appUser.orgId
    },
    select: {
      id: true,
      type: true,
      totalBeds: true
    }
  });

  if (!profile) {
    redirect("/dashboard/aftercare");
  }

  if (profile.type === ProfileType.sober_living) {
    const bedsAvailable = Math.min(
      numberFromForm(formData.get("bedsAvailable")) ?? 0,
      profile.totalBeds ?? 0
    );

    await prisma.aftercareProfile.update({
      where: { id: profile.id },
      data: {
        bedsAvailable,
        bedsAvailableUpdatedAt: new Date(),
        availabilityNotes: String(formData.get("availabilityNotes") || "").trim() || null
      }
    });
  } else {
    await prisma.aftercareProfile.update({
      where: { id: profile.id },
      data: {
        acceptingNewPatients: formData.get("acceptingNewPatients") === "yes",
        acceptingNewPatientsUpdatedAt: new Date(),
        availabilityNotes: String(formData.get("availabilityNotes") || "").trim() || null
      }
    });
  }

  revalidatePath("/dashboard/aftercare");
  redirect("/dashboard/aftercare");
}
