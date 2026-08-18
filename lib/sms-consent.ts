import { dashboardAppOrigin, publicAppOrigin, publicAppUrl } from "@/lib/app-urls";

export const smsConsentDisclosure =
  "I agree to receive SMS messages from Aftercare Compass regarding referral status, screening, and scheduling. Message frequency varies. Msg & data rates may apply. Reply STOP to unsubscribe, HELP for help. See our Terms of Service and Privacy Policy.";

export const smsOptInConfirmation =
  "Aftercare Compass: SMS updates are enabled for referral status, screening, and scheduling. Message frequency varies. Msg & data rates may apply. Reply STOP to unsubscribe, HELP for help.";

export function safeSmsReturnDestination(value: string | null | undefined) {
  const fallback = publicAppUrl("/");

  if (!value) {
    return fallback;
  }

  try {
    const destination = new URL(value, publicAppOrigin());
    const allowedOrigins = new Set([publicAppOrigin(), dashboardAppOrigin()]);

    if (!allowedOrigins.has(destination.origin)) {
      return fallback;
    }

    if (destination.protocol !== "https:" && destination.protocol !== "http:") {
      return fallback;
    }

    return destination.toString();
  } catch {
    return fallback;
  }
}
