import { createHash, randomBytes } from "crypto";
import { appUrl, emailButton, emailShell, escapeHtml, sendTransactionalEmail } from "@/lib/email";
import { prisma } from "@/lib/prisma";

export const claimOutreachCooldownDays = 14;
export const claimOutreachExpirationDays = 90;

export function normalizeOutreachEmail(value: string) {
  return value.trim().toLowerCase();
}

export function hashClaimOutreachToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export function createClaimOutreachToken() {
  return randomBytes(32).toString("base64url");
}

export async function findClaimOutreachByToken(token: string, profileId?: string) {
  if (!/^[A-Za-z0-9_-]{40,100}$/.test(token)) return null;

  return prisma.profileClaimOutreach.findFirst({
    where: {
      tokenHash: hashClaimOutreachToken(token),
      expiresAt: { gt: new Date() },
      ...(profileId ? { profileId } : {})
    },
    include: {
      profile: {
        select: { id: true, slug: true, programName: true, ownershipStatus: true }
      }
    }
  });
}

export async function suppressClaimOutreachEmail(token: string) {
  const outreach = await findClaimOutreachByToken(token);
  if (!outreach) return null;
  const email = normalizeOutreachEmail(outreach.recipientEmail);
  const now = new Date();

  await prisma.$transaction([
    prisma.emailSuppression.upsert({
      where: { email },
      update: { reason: "unsubscribe", sourceOutreachId: outreach.id },
      create: { email, reason: "unsubscribe", sourceOutreachId: outreach.id }
    }),
    prisma.profileClaimOutreach.updateMany({
      where: { recipientEmail: email, unsubscribedAt: null },
      data: { unsubscribedAt: now }
    })
  ]);
  return outreach;
}

export async function sendClaimOutreachEmail(input: {
  outreachId: string;
  token: string;
  recipientEmail: string;
  recipientName?: string | null;
  programName: string;
  city: string;
  state: string;
}) {
  const postalAddress = process.env.COMPANY_POSTAL_ADDRESS?.trim();
  if (!postalAddress) {
    return { status: "skipped" as const, reason: "missing_postal_address" };
  }

  const claimLink = appUrl(`/claim-profile/${input.token}`);
  const unsubscribePage = appUrl(`/claim-profile/unsubscribe/${input.token}`);
  const oneClickUnsubscribe = appUrl(`/api/email/unsubscribe/${input.token}`);
  const greeting = input.recipientName ? `Hello ${escapeHtml(input.recipientName)},` : "Hello,";
  const location = [input.city, input.state].filter(Boolean).join(", ");
  const subject = `Claim your ${input.programName} profile on Aftercare Compass`;
  const complianceFooter = `
    <hr style="margin:28px 0 18px;border:0;border-top:1px solid #d8dee5;" />
    <p style="margin:0 0 8px;font-size:12px;line-height:1.6;color:#5b6573;">This is a commercial profile invitation from Aftercare Compass. No patient information is included. Claiming requires account verification and admin approval.</p>
    <p style="margin:0 0 8px;font-size:12px;line-height:1.6;color:#5b6573;">${escapeHtml(postalAddress)}</p>
    <p style="margin:0;font-size:12px;line-height:1.6;"><a href="${escapeHtml(unsubscribePage)}" style="color:#334155;">Unsubscribe from profile-claim invitations</a></p>
  `;

  return sendTransactionalEmail({
    to: input.recipientEmail,
    subject,
    headers: {
      "List-Unsubscribe": `<${oneClickUnsubscribe}>`,
      "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
      "X-Aftercare-Outreach-Id": input.outreachId
    },
    html: emailShell(
      "Is this your program?",
      `
        <p style="margin:0 0 18px;font-size:16px;line-height:1.6;">${greeting}</p>
        <p style="margin:0 0 18px;font-size:16px;line-height:1.6;">Aftercare Compass has a self-reported public profile for <strong>${escapeHtml(input.programName)}</strong>${location ? ` in ${escapeHtml(location)}` : ""}.</p>
        <p style="margin:0 0 18px;font-size:16px;line-height:1.6;">If you manage this program, you can request ownership to update its details and respond to inquiries. The link opens a prefilled claim request; it does not automatically transfer the listing.</p>
        ${emailButton("Review and claim profile", claimLink)}
        ${complianceFooter}
      `
    ),
    text: [
      input.recipientName ? `Hello ${input.recipientName},` : "Hello,",
      "",
      `Aftercare Compass has a self-reported public profile for ${input.programName}${location ? ` in ${location}` : ""}.`,
      "If you manage this program, you can request ownership. Account verification and admin approval are required.",
      "",
      `Review and claim: ${claimLink}`,
      "",
      "This is a commercial profile invitation from Aftercare Compass. No patient information is included.",
      postalAddress,
      `Unsubscribe: ${unsubscribePage}`
    ].join("\n")
  });
}
