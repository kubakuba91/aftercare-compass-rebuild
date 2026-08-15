import { getClerkSessionUserId } from "@/lib/current-user";
import { findClaimOutreachByToken } from "@/lib/profile-claim-outreach";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  const clerkUserId = await getClerkSessionUserId();
  if (!clerkUserId) return Response.json({ error: "Authentication required" }, { status: 401 });

  const payload = await request.json().catch(() => null) as { token?: unknown } | null;
  const token = typeof payload?.token === "string" ? payload.token : "";
  const outreach = await findClaimOutreachByToken(token);
  if (!outreach) return Response.json({ error: "Invalid invitation" }, { status: 404 });

  if (!outreach.claimStartedAt && !outreach.claimCompletedAt) {
    await prisma.profileClaimOutreach.update({
      where: { id: outreach.id },
      data: { claimStartedAt: new Date(), status: "claim_started" }
    });
  }
  return Response.json({ ok: true });
}
