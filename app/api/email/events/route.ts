import { createHmac, timingSafeEqual } from "crypto";
import { Webhook } from "svix";
import { normalizeOutreachEmail } from "@/lib/profile-claim-outreach";
import { prisma } from "@/lib/prisma";

type ProviderEvent = {
  messageId: string;
  event: "delivered" | "bounced" | "complained" | "delayed";
};

function mailgunSignatureIsValid(signature: { timestamp?: string; token?: string; signature?: string }) {
  const key = process.env.MAILGUN_WEBHOOK_SIGNING_KEY;
  if (!key || !signature.timestamp || !signature.token || !signature.signature) return false;
  const signedAt = Number(signature.timestamp) * 1000;
  if (!Number.isFinite(signedAt) || Math.abs(Date.now() - signedAt) > 15 * 60 * 1000) return false;
  const expected = createHmac("sha256", key).update(`${signature.timestamp}${signature.token}`).digest("hex");
  const actualBuffer = Buffer.from(signature.signature);
  const expectedBuffer = Buffer.from(expected);
  return actualBuffer.length === expectedBuffer.length && timingSafeEqual(actualBuffer, expectedBuffer);
}

function normalizeMessageIds(value: string) {
  const clean = value.trim();
  const bare = clean.replace(/^<|>$/g, "");
  return Array.from(new Set([clean, bare, `<${bare}>`])).filter(Boolean);
}

async function recordProviderEvent(input: ProviderEvent) {
  const outreach = await prisma.profileClaimOutreach.findFirst({
    where: { providerMessageId: { in: normalizeMessageIds(input.messageId) } }
  });
  if (!outreach) return;

  const terminalFunnelStatus = Boolean(outreach.clickedAt || outreach.claimStartedAt || outreach.claimCompletedAt);
  const now = new Date();
  await prisma.profileClaimOutreach.update({
    where: { id: outreach.id },
    data: {
      ...(input.event === "delivered" ? { deliveredAt: outreach.deliveredAt || now } : {}),
      status: terminalFunnelStatus
        ? outreach.status
        : input.event === "delivered"
          ? "delivered"
          : input.event === "delayed"
            ? "delivery_delayed"
            : input.event,
      errorMessage: input.event === "bounced" || input.event === "complained"
        ? `Email provider reported ${input.event}.`
        : outreach.errorMessage
    }
  });

  if (input.event === "complained") {
    await prisma.emailSuppression.upsert({
      where: { email: normalizeOutreachEmail(outreach.recipientEmail) },
      update: { reason: "spam_complaint", sourceOutreachId: outreach.id },
      create: {
        email: normalizeOutreachEmail(outreach.recipientEmail),
        reason: "spam_complaint",
        sourceOutreachId: outreach.id
      }
    });
  }
}

export async function POST(request: Request) {
  const rawBody = await request.text();
  const svixId = request.headers.get("svix-id");

  if (svixId) {
    const secret = process.env.RESEND_WEBHOOK_SECRET;
    if (!secret) return new Response("Webhook not configured", { status: 503 });

    try {
      const payload = new Webhook(secret).verify(rawBody, {
        "svix-id": svixId,
        "svix-timestamp": request.headers.get("svix-timestamp") || "",
        "svix-signature": request.headers.get("svix-signature") || ""
      }) as { type?: string; data?: { email_id?: string } };
      const eventMap: Record<string, ProviderEvent["event"]> = {
        "email.delivered": "delivered",
        "email.bounced": "bounced",
        "email.complained": "complained",
        "email.delivery_delayed": "delayed"
      };
      const event = payload.type ? eventMap[payload.type] : null;
      if (event && payload.data?.email_id) {
        await recordProviderEvent({ event, messageId: payload.data.email_id });
      }
      return new Response("OK");
    } catch {
      return new Response("Invalid signature", { status: 401 });
    }
  }

  let payload: {
    signature?: { timestamp?: string; token?: string; signature?: string };
    "event-data"?: { event?: string; message?: { headers?: { "message-id"?: string } } };
  };
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return new Response("Invalid payload", { status: 400 });
  }
  if (!mailgunSignatureIsValid(payload.signature || {})) return new Response("Invalid signature", { status: 401 });

  const mailgunEvent = payload["event-data"]?.event;
  const messageId = payload["event-data"]?.message?.headers?.["message-id"];
  const eventMap: Record<string, ProviderEvent["event"]> = {
    delivered: "delivered",
    failed: "bounced",
    complained: "complained"
  };
  if (mailgunEvent && messageId && eventMap[mailgunEvent]) {
    await recordProviderEvent({ event: eventMap[mailgunEvent], messageId });
  }
  return new Response("OK");
}
