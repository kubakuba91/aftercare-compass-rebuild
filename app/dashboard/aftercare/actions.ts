"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { ProfileType, ReferralStatus } from "@prisma/client";
import { canTransitionReferral, referralStatuses } from "@/lib/product-rules";
import { prisma } from "@/lib/prisma";
import { getAftercareDashboardUser } from "@/lib/protected-routing";

function numberFromForm(value: FormDataEntryValue | null) {
  if (value === null || value === "") {
    return null;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.max(0, Math.trunc(parsed)) : null;
}

function overviewHref(profileId: string, error?: string) {
  const params = new URLSearchParams({
    tab: "overview",
    profileId
  });

  if (error) {
    params.set("availabilityError", error);
  }

  return `/dashboard/aftercare?${params.toString()}`;
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
      totalBeds: true,
      bedsMen: true,
      bedsWomen: true,
      bedsLgbtq: true
    }
  });

  if (!profile) {
    redirect("/dashboard/aftercare");
  }

  if (profile.type === ProfileType.sober_living) {
    const bedsMenAvailable = numberFromForm(formData.get("bedsMenAvailable")) ?? 0;
    const bedsWomenAvailable = numberFromForm(formData.get("bedsWomenAvailable")) ?? 0;
    const bedsLgbtqAvailable = numberFromForm(formData.get("bedsLgbtqAvailable")) ?? 0;

    if (
      bedsMenAvailable > (profile.bedsMen ?? 0) ||
      bedsWomenAvailable > (profile.bedsWomen ?? 0) ||
      bedsLgbtqAvailable > (profile.bedsLgbtq ?? 0)
    ) {
      redirect(
        overviewHref(profile.id, "Available beds cannot exceed the total beds for that population.")
      );
    }

    const bedsAvailable = bedsMenAvailable + bedsWomenAvailable + bedsLgbtqAvailable;

    await prisma.aftercareProfile.update({
      where: { id: profile.id },
      data: {
        bedsMenAvailable,
        bedsWomenAvailable,
        bedsLgbtqAvailable,
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
  redirect(overviewHref(profile.id));
}

export async function updateUserDisplayName(formData: FormData) {
  const appUser = await getAftercareDashboardUser("/dashboard/aftercare?tab=account");
  const firstName = String(formData.get("firstName") || "").trim();
  const lastName = String(formData.get("lastName") || "").trim();

  await prisma.user.update({
    where: { id: appUser.id },
    data: {
      firstName: firstName || null,
      lastName: lastName || null
    }
  });

  revalidatePath("/dashboard/aftercare");
  redirect("/dashboard/aftercare?tab=account");
}

export async function updateReferralStatus(formData: FormData) {
  const appUser = await getAftercareDashboardUser("/dashboard/aftercare");
  const referralId = String(formData.get("referralId") || "");
  const nextStatus = String(formData.get("status") || "") as ReferralStatus;

  if (!referralStatuses.includes(nextStatus)) {
    redirect("/dashboard/aftercare?referralError=Invalid referral status");
  }

  const referral = await prisma.referral.findFirst({
    where: {
      id: referralId,
      aftercareOrgId: appUser.orgId
    },
    select: {
      id: true,
      status: true
    }
  });

  if (!referral) {
    redirect("/dashboard/aftercare?referralError=Referral not found");
  }

  if (!canTransitionReferral(referral.status, nextStatus)) {
    redirect("/dashboard/aftercare?referralError=That status change is not available");
  }

  await prisma.referral.update({
    where: { id: referral.id },
    data: {
      status: nextStatus,
      statusUpdatedAt: new Date()
    }
  });

  revalidatePath("/dashboard/aftercare");
  revalidatePath("/dashboard/referent");
  redirect("/dashboard/aftercare");
}
