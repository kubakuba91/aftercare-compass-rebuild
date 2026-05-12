import { NextResponse } from "next/server";
import Stripe from "stripe";
import {
  billingCycleFromPriceId,
  planKeyFromPriceId,
  subscriptionStatusFromStripe
} from "@/lib/billing";
import { prisma } from "@/lib/prisma";
import { getStripe } from "@/lib/stripe";

export const dynamic = "force-dynamic";

function subscriptionPeriodEnd(subscription: Stripe.Subscription) {
  const unixSeconds = (subscription as unknown as { current_period_end?: number }).current_period_end;
  return unixSeconds ? new Date(unixSeconds * 1000) : null;
}

function subscriptionPriceId(subscription: Stripe.Subscription) {
  return subscription.items.data[0]?.price.id ?? null;
}

async function updateOrganizationFromSubscription(subscription: Stripe.Subscription) {
  const customerId =
    typeof subscription.customer === "string" ? subscription.customer : subscription.customer.id;
  const priceId = subscriptionPriceId(subscription);
  const planKey = planKeyFromPriceId(priceId) ?? subscription.metadata.plan ?? null;
  const billingCycle = billingCycleFromPriceId(priceId) ?? subscription.metadata.billingCycle ?? null;

  await prisma.organization.updateMany({
    where: {
      OR: [
        { stripeCustomerId: customerId },
        { id: subscription.metadata.organizationId || "__missing_org__" }
      ]
    },
    data: {
      stripeCustomerId: customerId,
      stripeSubscriptionId: subscription.id,
      subscriptionPlan: planKey,
      subscriptionBillingCycle: billingCycle,
      subscriptionStatus: subscriptionStatusFromStripe(subscription.status),
      subscriptionRenewsAt: subscriptionPeriodEnd(subscription)
    }
  });
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  if (!session.subscription) {
    return;
  }

  const stripe = getStripe();
  const subscriptionId =
    typeof session.subscription === "string" ? session.subscription : session.subscription.id;
  const subscription = await stripe.subscriptions.retrieve(subscriptionId);

  await updateOrganizationFromSubscription(subscription);
}

export async function POST(request: Request) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    return NextResponse.json({ error: "Stripe webhook is not configured" }, { status: 500 });
  }

  const stripe = getStripe();
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "Missing Stripe signature" }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(await request.text(), signature, webhookSecret);
  } catch {
    return NextResponse.json({ error: "Invalid Stripe signature" }, { status: 400 });
  }

  switch (event.type) {
    case "checkout.session.completed":
      await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
      break;
    case "customer.subscription.created":
    case "customer.subscription.updated":
    case "customer.subscription.deleted":
      await updateOrganizationFromSubscription(event.data.object as Stripe.Subscription);
      break;
    default:
      break;
  }

  return NextResponse.json({ received: true });
}
