import { NextResponse } from "next/server";
import { parseAvailabilityReply, availabilityReplyExample } from "@/lib/availability-sms";
import { formatPhoneForDisplay, normalizePhoneNumber } from "@/lib/phone";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

function twiml(message: string) {
  return new NextResponse(`<Response><Message>${escapeXml(message)}</Message></Response>`, {
    headers: { "Content-Type": "text/xml" }
  });
}

function escapeXml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

export async function POST(request: Request) {
  const formData = await request.formData();
  const from = normalizePhoneNumber(String(formData.get("From") || ""));
  const body = String(formData.get("Body") || "");
  const parsed = parseAvailabilityReply(body);

  if (!from || !parsed) {
    return twiml(`We could not read that availability update. ${availabilityReplyExample()}`);
  }

  const phoneCandidates = Array.from(new Set([
    from,
    formatPhoneForDisplay(from),
    from.replace(/^\+1/, "")
  ]));

  const check = await prisma.availabilitySmsCheck.findFirst({
    where: {
      phone: { in: phoneCandidates },
      status: { in: ["pending", "sent"] },
      ...(parsed.token ? { token: parsed.token } : {})
    },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      token: true,
      profileId: true,
      inboundBody: true,
      profile: {
        select: {
          id: true,
          programName: true,
          bedsMen: true,
          bedsWomen: true,
          bedsLgbtq: true,
          bedsMenAvailable: true,
          bedsWomenAvailable: true,
          bedsLgbtqAvailable: true
        }
      }
    }
  });

  if (!check) {
    return twiml("We could not find an active bed check for this phone number.");
  }

  if (parsed.noChange) {
    await prisma.availabilitySmsCheck.update({
      where: { id: check.id },
      data: {
        status: "responded",
        inboundBody: body,
        respondedAt: new Date()
      }
    });

    return twiml(`Thanks. ${check.profile.programName} availability is still marked as unchanged.`);
  }

  const bedsMenAvailable = parsed.men ?? check.profile.bedsMenAvailable ?? 0;
  const bedsWomenAvailable = parsed.women ?? check.profile.bedsWomenAvailable ?? 0;
  const bedsLgbtqAvailable = parsed.lgbtq ?? check.profile.bedsLgbtqAvailable ?? 0;

  if (
    bedsMenAvailable > (check.profile.bedsMen ?? 0) ||
    bedsWomenAvailable > (check.profile.bedsWomen ?? 0) ||
    bedsLgbtqAvailable > (check.profile.bedsLgbtq ?? 0)
  ) {
    await prisma.availabilitySmsCheck.update({
      where: { id: check.id },
      data: {
        status: "failed",
        inboundBody: body,
        errorMessage: "Available beds exceeded configured total beds.",
        respondedAt: new Date()
      }
    });

    return twiml("That update is higher than the configured total beds. Please update the dashboard or reply with lower counts.");
  }

  const bedsAvailable = bedsMenAvailable + bedsWomenAvailable + bedsLgbtqAvailable;

  await prisma.$transaction([
    prisma.aftercareProfile.update({
      where: { id: check.profileId },
      data: {
        bedsMenAvailable,
        bedsWomenAvailable,
        bedsLgbtqAvailable,
        bedsAvailable,
        bedsAvailableUpdatedAt: new Date(),
        availabilityNotes: `Updated by SMS reply ${check.token}`
      }
    }),
    prisma.availabilitySmsCheck.update({
      where: { id: check.id },
      data: {
        status: "responded",
        inboundBody: body,
        respondedAt: new Date()
      }
    })
  ]);

  return twiml(
    `Thanks. ${check.profile.programName} updated: MEN ${bedsMenAvailable}, WOMEN ${bedsWomenAvailable}, LGBTQ ${bedsLgbtqAvailable}.`
  );
}
