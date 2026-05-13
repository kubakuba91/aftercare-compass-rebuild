"use server";

import { redirect } from "next/navigation";
import { OrganizationType, Role } from "@prisma/client";
import { hasDatabaseConfig } from "@/lib/database-status";
import { getCurrentAppUser } from "@/lib/current-user";
import { notifyNewPublicLead, notifyNewReferral, notifyProfileClaimSubmitted } from "@/lib/email-notifications";
import { canReceiveDirectReferrals, canSubmitReferrals } from "@/lib/feature-gates";
import { prisma } from "@/lib/prisma";
import { publicLeadSchema } from "@/lib/validations/lead";
import { profileClaimRequestSchema } from "@/lib/validations/profile-claim";
import { forbiddenDirectIdentifierFields, referralSchema } from "@/lib/validations/referral";

export async function createPublicProfileLead(formData: FormData) {
  if (!hasDatabaseConfig()) {
    redirect("/setup?missing=database");
  }

  const slug = String(formData.get("slug") || "");
  const parsed = publicLeadSchema.safeParse({
    profileId: formData.get("profileId"),
    name: formData.get("name"),
    email: formData.get("email"),
    phone: formData.get("phone") || undefined,
    message: formData.get("message")
  });

  if (!parsed.success) {
    redirect(`/profiles/${slug}?lead=invalid`);
  }

  const profile = await prisma.aftercareProfile.findFirst({
    where: {
      id: parsed.data.profileId,
      slug
    },
    select: {
      id: true,
      orgId: true,
      ownershipStatus: true,
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
    redirect("/search");
  }

  const lead = await prisma.lead.create({
    data: {
      profileId: profile.id,
      aftercareOrgId: profile.orgId,
      name: parsed.data.name,
      email: parsed.data.email,
      phone: parsed.data.phone,
      message: parsed.data.message
    }
  });

  await notifyNewPublicLead(lead.id);

  redirect(`/profiles/${slug}?lead=sent`);
}

export async function createProfileReferral(formData: FormData) {
  if (!hasDatabaseConfig()) {
    redirect("/setup?missing=database");
  }

  const slug = String(formData.get("slug") || "");
  const payload = {
    aftercareProfileId: formData.get("aftercareProfileId"),
    caseManagerName: formData.get("caseManagerName"),
    caseManagerEmail: formData.get("caseManagerEmail"),
    caseManagerPhone: formData.get("caseManagerPhone"),
    caseManagerOrganization: formData.get("caseManagerOrganization"),
    clientAgeRange: formData.get("clientAgeRange"),
    supportCategory: formData.get("supportCategory"),
    insuranceCategory: formData.get("insuranceCategory"),
    preferredStartWindow: formData.get("preferredStartWindow"),
    specialNeeds: formData.getAll("specialNeeds").map(String).filter(Boolean),
    reasonForReferral: formData.get("reasonForReferral")
  };
  const forbiddenField = forbiddenDirectIdentifierFields.find((field) => formData.has(field));
  const parsed = referralSchema.safeParse(payload);

  if (forbiddenField || !parsed.success) {
    redirect(`/profiles/${slug}?referral=invalid`);
  }

  const appUser = await getCurrentAppUser();

  if (!appUser?.orgId || !appUser.role.startsWith("referent")) {
    redirect(`/profiles/${slug}?referral=signin`);
  }

  const profile = await prisma.aftercareProfile.findFirst({
    where: {
      id: parsed.data.aftercareProfileId,
      slug,
      status: "published"
    },
    select: {
      id: true,
      orgId: true,
      ownershipStatus: true,
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
    redirect("/search");
  }

  if (!canSubmitReferrals(appUser.organization)) {
    redirect(`/profiles/${slug}?referral=plan_required`);
  }

  if (!canReceiveDirectReferrals(profile.organization, profile)) {
    redirect(`/profiles/${slug}?referral=contact_only`);
  }

  const referral = await prisma.referral.create({
    data: {
      referentUserId: appUser.id,
      referentOrgId: appUser.orgId,
      aftercareOrgId: profile.orgId,
      aftercareProfileId: profile.id,
      caseManagerName: parsed.data.caseManagerName,
      caseManagerEmail: parsed.data.caseManagerEmail,
      caseManagerPhone: parsed.data.caseManagerPhone,
      caseManagerOrganization: parsed.data.caseManagerOrganization,
      clientAgeRange: parsed.data.clientAgeRange,
      supportCategory: parsed.data.supportCategory,
      insuranceCategory: parsed.data.insuranceCategory,
      preferredStartWindow: parsed.data.preferredStartWindow,
      specialNeeds: parsed.data.specialNeeds,
      reasonForReferral: parsed.data.reasonForReferral
    }
  });

  await notifyNewReferral(referral.id);

  redirect(`/profiles/${slug}?referral=sent`);
}

export async function createProfileClaimRequest(formData: FormData) {
  if (!hasDatabaseConfig()) {
    redirect("/setup?missing=database");
  }

  const parsed = profileClaimRequestSchema.safeParse({
    profileId: formData.get("profileId"),
    slug: formData.get("slug"),
    claimantName: formData.get("claimantName"),
    claimantEmail: formData.get("claimantEmail"),
    claimantPhone: formData.get("claimantPhone") || undefined,
    claimantRole: formData.get("claimantRole"),
    claimantOrganization: formData.get("claimantOrganization"),
    relationshipToProgram: formData.get("relationshipToProgram"),
    notes: formData.get("notes") || undefined
  });
  const slug = String(formData.get("slug") || "");

  if (!parsed.success) {
    redirect(`/profiles/${slug}?claim=invalid`);
  }

  const appUser = await getCurrentAppUser();

  if (!appUser) {
    redirect(`/sign-in?redirect_url=${encodeURIComponent(`/profiles/${parsed.data.slug}`)}`);
  }

  if (appUser.role !== Role.aftercare_admin && appUser.role !== Role.aftercare_manager) {
    redirect(`/profiles/${parsed.data.slug}?claim=provider_required`);
  }

  if (!appUser.orgId || !appUser.organization) {
    redirect(`/profiles/${parsed.data.slug}?claim=provider_required`);
  }

  const profile = await prisma.aftercareProfile.findFirst({
    where: {
      id: parsed.data.profileId,
      slug: parsed.data.slug,
      status: "published"
    },
    select: {
      id: true,
      orgId: true,
      type: true,
      ownershipStatus: true
    }
  });

  if (!profile) {
    redirect("/search");
  }

  const requiredOrgType =
    profile.type === "sober_living"
      ? OrganizationType.aftercare_sober_living
      : OrganizationType.aftercare_continued_care;

  if (appUser.organization.type !== requiredOrgType) {
    redirect(`/profiles/${parsed.data.slug}?claim=provider_type`);
  }

  if (profile.ownershipStatus === "claimed") {
    redirect(`/profiles/${parsed.data.slug}?claim=unavailable`);
  }

  const existingPendingClaim = await prisma.profileClaimRequest.findFirst({
    where: {
      profileId: profile.id,
      status: "pending"
    },
    select: {
      id: true,
      claimantUserId: true
    }
  });

  if (existingPendingClaim) {
    const status = existingPendingClaim.claimantUserId === appUser.id ? "pending" : "under_review";
    redirect(`/profiles/${parsed.data.slug}?claim=${status}`);
  }

  const claim = await prisma.$transaction(async (tx) => {
    const createdClaim = await tx.profileClaimRequest.create({
      data: {
        profileId: profile.id,
        claimantUserId: appUser.id,
        claimantName: parsed.data.claimantName,
        claimantEmail: parsed.data.claimantEmail.toLowerCase(),
        claimantPhone: parsed.data.claimantPhone || null,
        claimantRole: parsed.data.claimantRole,
        claimantOrganization: parsed.data.claimantOrganization,
        relationshipToProgram: parsed.data.relationshipToProgram,
        notes: parsed.data.notes || null
      },
      select: {
        id: true
      }
    });

    await tx.aftercareProfile.update({
      where: { id: profile.id },
      data: {
        ownershipStatus: "claim_pending"
      }
    });

    return createdClaim;
  });

  await notifyProfileClaimSubmitted(claim.id);

  redirect(`/profiles/${parsed.data.slug}?claim=submitted`);
}
