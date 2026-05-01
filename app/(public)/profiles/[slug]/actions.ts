"use server";

import { redirect } from "next/navigation";
import { hasDatabaseConfig } from "@/lib/database-status";
import { prisma } from "@/lib/prisma";
import { publicLeadSchema } from "@/lib/validations/lead";

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
