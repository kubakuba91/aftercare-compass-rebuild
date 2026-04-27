import { NextResponse } from "next/server";
import { hasDatabaseConfig, missingDatabaseResponse } from "@/lib/database-status";
import { prisma } from "@/lib/prisma";
import { publicLeadSchema } from "@/lib/validations/lead";

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = publicLeadSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid lead payload" }, { status: 400 });
  }

  if (!hasDatabaseConfig()) {
    return NextResponse.json(missingDatabaseResponse(), { status: 503 });
  }

  const profile = await prisma.aftercareProfile.findUnique({
    where: { id: parsed.data.profileId },
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

  // TODO: Send Resend notification to admissions contact.
  return NextResponse.json({
    status: lead.status,
    leadId: lead.id,
    next: "Send Resend lead notification"
  });
}
