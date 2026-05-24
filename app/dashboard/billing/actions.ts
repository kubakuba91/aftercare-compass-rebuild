"use server";

import { redirect } from "next/navigation";
import { Role } from "@prisma/client";
import {
  billingAudienceForOrganization,
  billingCycleOptions,
  getBillingPlan,
  getStripePriceId,
  planBelongsToAudience,
  subscriptionStatusFromStripe
} from "@/lib/billing";
import { prisma } from "@/lib/prisma";
import { getProtectedAppUser } from "@/lib/protected-routing";
import { getStripe, hasStripeConfig } from "@/lib/stripe";

function appUrl() {
  return (process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000").replace(/\/$/, "");
}

function billingReturnPath(audience: "referent" | "aftercare", message?: string) {
  const path = audience === "referent" ? "/dashboard/referent" : "/dashboard/aftercare";
  const params = new URLSearchParams({ tab: "subscription" });

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

function isStripeMissingResourceError(error: unknown, param?: string) {
  if (!error || typeof error !== "object") {
    return false;
  }

  const stripeError = error as {
    code?: string;
    param?: string;
    raw?: {
      code?: string;
      param?: string;
    };
  };
  const code = stripeError.code ?? stripeError.raw?.code;
  const errorParam = stripeError.param ?? stripeError.raw?.param;

  return code === "resource_missing" && (!param || errorParam === param);
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

  if (plan.monthlyPrice === 0) {
    await prisma.organization.update({
      where: { id: organization.id },
      data: {
        subscriptionPlan: plan.key,
        subscriptionBillingCycle: null,
        subscriptionStatus: "active"
      }
    });

    redirect(billingReturnPath(audience, `${plan.label} selected.`));
  }

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
  let checkoutUrl: string | null = null;

  try {
    let customerId = organization.stripeCustomerId;
    const createCustomer = async () => {
      const customer = await stripe.customers.create({
        email: organization.email || appUser.email,
        name: organization.name,
        metadata: {
          organizationId: organization.id,
          organizationType: organization.type
        }
      });

      await prisma.organization.update({
        where: { id: organization.id },
        data: { stripeCustomerId: customer.id }
      });

      return customer.id;
    };

    if (customerId) {
      try {
        const customer = await stripe.customers.retrieve(customerId);

        if ("deleted" in customer && customer.deleted) {
          customerId = null;
        }
      } catch (error) {
        if (!isStripeMissingResourceError(error, "customer")) {
          throw error;
        }

        customerId = null;
      }
    }

    if (!customerId) {
      customerId = await createCustomer();
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

    checkoutUrl = session.url;
  } catch (error) {
    console.error("Stripe checkout session failed", {
      organizationId: organization.id,
      audience,
      plan: plan.key,
      cycle,
      priceId,
      error
    });

    redirect(billingReturnPath(audience, "Stripe checkout could not be started. Check the plan price configuration."));
  }

  if (!checkoutUrl) {
    redirect(billingReturnPath(audience, "Stripe checkout could not be started."));
  }

  redirect(checkoutUrl);
}

export async function changeBillingPlan(formData: FormData) {
  const returnTo = String(formData.get("returnTo") || "/dashboard");
  const planKey = String(formData.get("plan") || "");
  const cycle = String(formData.get("billingCycle") || "monthly");
  const { organization, audience } = await getBillingContext(returnTo);

  if (!hasStripeConfig()) {
    redirect(billingReturnPath(audience, "Stripe is not configured yet."));
  }

  const subscriptionId = organization.stripeSubscriptionId;

  if (!subscriptionId) {
    return createBillingCheckoutSession(formData);
  }

  if (!planBelongsToAudience(planKey, audience)) {
    redirect(billingReturnPath(audience, "Choose a valid plan."));
  }

  if (!billingCycleOptions.includes(cycle as (typeof billingCycleOptions)[number])) {
    redirect(billingReturnPath(audience, "Choose a valid billing cycle."));
  }

  const plan = getBillingPlan(audience, planKey);

  if (plan.monthlyPrice === 0) {
    redirect(billingReturnPath(audience, "Cancel the paid plan before switching to Claimed Listing."));
  }

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

  try {
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    const subscriptionItemId = subscription.items.data[0]?.id;

    if (!subscriptionItemId) {
      redirect(billingReturnPath(audience, "Stripe subscription item could not be found."));
    }

    await stripe.subscriptions.update(subscription.id, {
      cancel_at_period_end: false,
      items: [{ id: subscriptionItemId, price: priceId }],
      metadata: {
        ...subscription.metadata,
        organizationId: organization.id,
        audience,
        plan: plan.key,
        billingCycle: cycle
      },
      proration_behavior: "create_prorations"
    }
    );
  } catch (error) {
    if (isStripeMissingResourceError(error)) {
      await prisma.organization.update({
        where: { id: organization.id },
        data: {
          stripeSubscriptionId: null,
          subscriptionRenewsAt: null
        }
      });

      return createBillingCheckoutSession(formData);
    }

    console.error("Stripe subscription update failed", {
      organizationId: organization.id,
      audience,
      plan: plan.key,
      cycle,
      priceId,
      subscriptionId,
      error
    });

    redirect(billingReturnPath(audience, "Stripe subscription could not be updated. Check the plan price configuration."));
  }

  await prisma.organization.update({
    where: { id: organization.id },
    data: {
      subscriptionPlan: plan.key,
      subscriptionBillingCycle: cycle,
      subscriptionStatus: "active"
    }
  });

  redirect(billingReturnPath(audience, "Plan updated."));
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

export async function cancelBillingSubscription(formData: FormData) {
  const returnTo = String(formData.get("returnTo") || "/dashboard");
  const { organization, audience } = await getBillingContext(returnTo);

  if (!hasStripeConfig()) {
    redirect(billingReturnPath(audience, "Stripe is not configured yet."));
  }

  if (!organization.stripeSubscriptionId) {
    redirect(billingReturnPath(audience, "No active Stripe subscription was found."));
  }

  const subscription = await getStripe().subscriptions.update(organization.stripeSubscriptionId, {
    cancel_at_period_end: true
  });
  const periodEnd = (subscription as unknown as { current_period_end?: number }).current_period_end;

  await prisma.organization.update({
    where: { id: organization.id },
    data: {
      subscriptionStatus: subscriptionStatusFromStripe(subscription.status),
      subscriptionRenewsAt: periodEnd ? new Date(periodEnd * 1000) : organization.subscriptionRenewsAt
    }
  });

  redirect(billingReturnPath(audience, "Plan cancellation scheduled."));
}
