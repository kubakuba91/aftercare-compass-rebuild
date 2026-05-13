import Stripe from "stripe";

let stripeClient: Stripe | null = null;

export function hasStripeConfig() {
  return Boolean(process.env.STRIPE_SECRET_KEY);
}

export function getStripe() {
  const secretKey = process.env.STRIPE_SECRET_KEY;

  if (!secretKey) {
    throw new Error("Stripe is not configured");
  }

  if (!stripeClient) {
    stripeClient = new Stripe(secretKey, {
      apiVersion: "2026-04-22.dahlia",
      typescript: true
    });
  }

  return stripeClient;
}

export function hasStripeWebhookConfig() {
  return Boolean(process.env.STRIPE_WEBHOOK_SECRET);
}

export const stripeEnvRequirements = [
  {
    key: "STRIPE_SECRET_KEY",
    valueHint: "Starts with sk_test_ or sk_live_",
    valid: Boolean(process.env.STRIPE_SECRET_KEY?.startsWith("sk_"))
  },
  {
    key: "STRIPE_WEBHOOK_SECRET",
    valueHint: "Starts with whsec_",
    valid: Boolean(process.env.STRIPE_WEBHOOK_SECRET?.startsWith("whsec_"))
  }
];
