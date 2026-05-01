"use server";

import { redirect } from "next/navigation";
import { hasDatabaseConfig } from "@/lib/database-status";
import { getCurrentAppUser } from "@/lib/current-user";
import { prisma } from "@/lib/prisma";
import { publicLeadSchema } from "@/lib/validations/lead";
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
      orgId: true
    }
  });

  if (!profile) {
    redirect("/search");
  }

  await prisma.lead.create({
    data: {
      profileId: profile.id,
      aftercareOrgId: profile.orgId,
      name: parsed.data.name,
      email: parsed.data.email,
      phone: parsed.data.phone,
      message: parsed.data.message
    }
  });

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
      orgId: true
    }
  });

  if (!profile) {
    redirect("/search");
  }

  await prisma.referral.create({
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

  redirect(`/profiles/${slug}?referral=sent`);
}
