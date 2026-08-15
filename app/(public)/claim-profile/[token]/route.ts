import { NextRequest, NextResponse } from "next/server";
import { findClaimOutreachByToken } from "@/lib/profile-claim-outreach";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const outreach = await findClaimOutreachByToken(token);

  if (!outreach || outreach.profile.ownershipStatus === "claimed") {
    return NextResponse.redirect(new URL("/search", request.url));
  }

  await prisma.profileClaimOutreach.update({
    where: { id: outreach.id },
    data: {
      clickedAt: outreach.clickedAt || new Date(),
      status: outreach.claimCompletedAt ? outreach.status : "clicked"
    }
  });

  const destination = new URL(`/profiles/${outreach.profile.slug}`, request.url);
  destination.searchParams.set("claimToken", token);
  destination.hash = "claim";
  return NextResponse.redirect(destination);
}
