import { NextResponse } from "next/server";
import { hasHumanTrapValue } from "@/lib/form-utils";
import { hasDatabaseConfig, missingDatabaseResponse } from "@/lib/database-status";
import { notifyNewPublicLead } from "@/lib/email-notifications";
import { prisma } from "@/lib/prisma";
import { publicLeadSchema } from "@/lib/validations/lead";

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = publicLeadSchema.safeParse(body);

  if (!parsed.success || hasHumanTrapValue(body)) {
    return NextResponse.json({ error: "Invalid lead payload" }, { status: 400 });
  }

  if (!hasDatabaseConfig()) {
    return NextResponse.json(missingDatabaseResponse(), { status: 503 });
  }

  const profile = await prisma.aftercareProfile.findFirst({
    where: {
      id: parsed.data.profileId,
      status: "published",
      ...(parsed.data.slug ? { slug: parsed.data.slug } : {})
    },
    select: { id: true, orgId: true }
  });

  if (!profile) {
    return NextResponse.json({ error: "Profile not found" }, { status: 404 });
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

  return NextResponse.json({
    status: lead.status,
    leadId: lead.id
  });
}
