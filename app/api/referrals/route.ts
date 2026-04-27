import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { hasDatabaseConfig, missingDatabaseResponse } from "@/lib/database-status";
import { prisma } from "@/lib/prisma";
import { forbiddenDirectIdentifierFields, referralSchema } from "@/lib/validations/referral";

export async function POST(request: Request) {
  const body = await request.json();
  const forbiddenField = forbiddenDirectIdentifierFields.find((field) => field in body);

  if (forbiddenField) {
    return NextResponse.json(
      { error: `Direct patient identifier is not allowed: ${forbiddenField}` },
      { status: 400 }
    );
  }

  const parsed = referralSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid referral payload" }, { status: 400 });
  }

  if (!hasDatabaseConfig()) {
    return NextResponse.json(missingDatabaseResponse(), { status: 503 });
  }

  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  const [referentUser, profile] = await Promise.all([
    prisma.user.findUnique({
      where: { clerkUserId: userId },
      select: { id: true, orgId: true }
    }),
    prisma.aftercareProfile.findUnique({
      where: { id: parsed.data.aftercareProfileId },
      select: { id: true, orgId: true }
    })
  ]);

  if (!referentUser?.orgId) {
    return NextResponse.json({ error: "Referent organization not found" }, { status: 403 });
  }

  if (!profile) {
    return NextResponse.json({ error: "Profile not found" }, { status: 404 });
  }

  const referral = await prisma.referral.create({
    data: {
      referentUserId: referentUser.id,
      referentOrgId: referentUser.orgId,
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

  // TODO: Send Resend referral notification.
  return NextResponse.json({
    status: referral.status,
    referralId: referral.id,
    next: "Send referral notification"
  });
}
