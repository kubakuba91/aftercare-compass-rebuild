"use server";

import { redirect } from "next/navigation";
import { Role } from "@prisma/client";
import {
  billingAudienceForOrganization,
  billingCycleOptions,
  getBillingPlan,
  getStripePriceId,
  planBelongsToAudience
} from "@/lib/billing";
import { prisma } from "@/lib/prisma";
import { getProtectedAppUser } from "@/lib/protected-routing";
import { getStripe, hasStripeConfig } from "@/lib/stripe";

function appUrl() {
  return (process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000").replace(/\/$/, "");
}

function billingReturnPath(audience: "referent" | "aftercare", message?: string) {
  const path = audience === "referent" ? "/dashboard/referent" : "/dashboard/aftercare";
  const params = new URLSearchParams();

  if (audience === "aftercare") {
    params.set("tab", "subscription");
  }

  if (message) {
    params.set("billingMessage", message);
  }

  return `${path}${params.size ? `?${params.toString()}` : ""}`;
}

async function getBillingContext(returnTo: string) {
  const appUser = await getProtectedAppUser(returnTo);

  if (!appUser.orgId || !appUser.organization) {
    redirect("/onboarding/account-type");
  }

  const isAdmin =
    appUser.role === Role.aftercare_admin ||
    appUser.role === Role.referent_admin ||
    appUser.role === Role.system_admin;

  if (!isAdmin) {
    redirect(returnTo);
  }

  return {
    appUser,
    organization: appUser.organization,
    audience: billingAudienceForOrganization(appUser.organization.type)
  };
}

export async function createBillingCheckoutSession(formData: FormData) {
  const returnTo = String(formData.get("returnTo") || "/dashboard");
  const planKey = String(formData.get("plan") || "");
  const cycle = String(formData.get("billingCycle") || "monthly");
  const { appUser, organization, audience } = await getBillingContext(returnTo);

  if (!hasStripeConfig()) {
    redirect(billingReturnPath(audience, "Stripe is not configured yet."));
  }

  if (!planBelongsToAudience(planKey, audience)) {
    redirect(billingReturnPath(audience, "Choose a valid plan."));
  }

  if (!billingCycleOptions.includes(cycle as (typeof billingCycleOptions)[number])) {
    redirect(billingReturnPath(audience, "Choose a valid billing cycle."));
  }

  const plan = getBillingPlan(audience, planKey);
  const { envKey, priceId } = getStripePriceId(audience, plan.key, cycle);

  if (!priceId) {
    redirect(
      billingReturnPath(
        audience,
        plan.monthlyPrice ? `Stripe price is missing for ${plan.label}. Add ${envKey} in Vercel.` : "Enterprise pricing is handled manually."
      )
    );
  }

  const stripe = getStripe();
  let customerId = organization.stripeCustomerId;

  if (!customerId) {
    const customer = await stripe.customers.create({
      email: organization.email || appUser.email,
      name: organization.name,
      metadata: {
        organizationId: organization.id,
        organizationType: organization.type
      }
    });

    customerId = customer.id;

    await prisma.organization.update({
      where: { id: organization.id },
      data: { stripeCustomerId: customerId }
    });
  }

  const successUrl = `${appUrl()}${billingReturnPath(audience, "Subscription updated.")}`;
  const cancelUrl = `${appUrl()}${billingReturnPath(audience, "Checkout cancelled.")}`;

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: customerId,
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: successUrl,
    cancel_url: cancelUrl,
    metadata: {
      organizationId: organization.id,
      audience,
      plan: plan.key,
      billingCycle: cycle
    },
    subscription_data: {
      metadata: {
        organizationId: organization.id,
        audience,
        plan: plan.key,
        billingCycle: cycle
      }
    }
  });

  if (!session.url) {
    redirect(billingReturnPath(audience, "Stripe checkout could not be started."));
  }

  redirect(session.url);
}

export async function createBillingPortalSession(formData: FormData) {
  const returnTo = String(formData.get("returnTo") || "/dashboard");
  const { organization, audience } = await getBillingContext(returnTo);

  if (!hasStripeConfig()) {
    redirect(billingReturnPath(audience, "Stripe is not configured yet."));
  }

  if (!organization.stripeCustomerId) {
    redirect(billingReturnPath(audience, "Start a subscription before opening billing management."));
  }

  const session = await getStripe().billingPortal.sessions.create({
    customer: organization.stripeCustomerId,
    return_url: `${appUrl()}${billingReturnPath(audience)}`
  });

  redirect(session.url);
}
