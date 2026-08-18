"use server";

import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { publicAppUrl } from "@/lib/app-urls";
import { normalizePhoneNumber } from "@/lib/phone";
import { prisma } from "@/lib/prisma";
import { sendSms } from "@/lib/sms";
import {
  safeSmsReturnDestination,
  smsConsentDisclosure,
  smsOptInConfirmation
} from "@/lib/sms-consent";

function optInErrorUrl(message: string, returnTo: string) {
  const destination = new URL(publicAppUrl("/sms-opt-in"));
  destination.searchParams.set("message", message);
  destination.searchParams.set("returnTo", returnTo);
  return destination.toString();
}

export async function submitSmsOptIn(formData: FormData) {
  const returnTo = safeSmsReturnDestination(String(formData.get("returnTo") || ""));
  const honeypot = String(formData.get("companyWebsite") || "").trim();

  if (honeypot) {
    redirect(returnTo);
  }

  const phone = normalizePhoneNumber(String(formData.get("phone") || ""));

  if (!phone) {
    redirect(optInErrorUrl("Enter a valid mobile phone number.", returnTo));
  }

  if (formData.get("smsConsent") !== "yes") {
    redirect(optInErrorUrl("Check the consent box to continue.", returnTo));
  }

  const { userId: clerkUserId } = await auth();
  const appUser = clerkUserId
    ? await prisma.user.findUnique({
        where: { clerkUserId },
        select: { id: true }
      })
    : null;
  const consentedAt = new Date();

  await prisma.$transaction(async (transaction) => {
    await transaction.smsOptInConsent.upsert({
      where: { phone },
      create: {
        phone,
        userId: appUser?.id,
        consentText: smsConsentDisclosure,
        consentedAt
      },
      update: {
        userId: appUser?.id,
        consentText: smsConsentDisclosure,
        consentedAt
      }
    });

    if (appUser) {
      await transaction.user.update({
        where: { id: appUser.id },
        data: {
          phone,
          smsOptIn: true
        }
      });
    }
  });

  try {
    await sendSms({
      to: phone,
      body: smsOptInConfirmation
    });
  } catch (error) {
    console.error("SMS opt-in confirmation failed", error);
    redirect(
      optInErrorUrl(
        "Your consent was saved, but we could not send the confirmation text. Please try again later.",
        returnTo
      )
    );
  }

  redirect(returnTo);
}
