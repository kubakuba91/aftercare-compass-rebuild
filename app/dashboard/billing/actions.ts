"use server";

import { canStartReferentTrial, trialEndFrom } from "@/lib/referent-trial";
import { virtualOrganizationPlanError } from "@/lib/virtual-care-billing";

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
import { dashboardAppUrl } from "@/lib/app-urls";
import { prisma } from "@/lib/prisma";
import { getProtectedAppUser } from "@/lib/protected-routing";
import { getStripe, hasStripeConfig } from "@/lib/stripe";

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

function isStripeMissingCustomerError(error: unknown) {
  if (!isStripeMissingResourceError(error)) {
    return false;
  }

  const stripeError = error as {
    param?: string;
    raw?: {
      param?: string;
    };
  };
  const errorParam = stripeError.param ?? stripeError.raw?.param;

  return !errorParam || errorParam === "customer" || errorParam === "id";
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
  if (audience === "aftercare") {
    const error = await virtualOrganizationPlanError(organization.id, plan.key);
    if (error) redirect(billingReturnPath(audience, error));
  }

  if (plan.monthlyPrice === 0) {
    if (organization.stripeSubscriptionId) redirect(billingReturnPath(audience, "Cancel the paid subscription before switching to a free listing."));
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

  if (organization.stripeSubscriptionId) redirect(billingReturnPath(audience, "Manage your existing subscription to change plans."));
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
      }, { idempotencyKey: `customer:${organization.id}` });

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
        if (!isStripeMissingCustomerError(error)) {
          throw error;
        }

        customerId = null;
      }
    }

    if (!customerId) {
      customerId = await createCustomer();
    }

    // Reuse an open checkout after a back/refresh, instead of creating another subscription checkout.
    const openSessions = await stripe.checkout.sessions.list({ customer: customerId, status: "open", limit: 100 });
    const matchingSession = openSessions.data.find(session => session.mode === "subscription" && session.metadata?.organizationId === organization.id && session.metadata?.plan === plan.key && session.metadata?.billingCycle === cycle);
    for (const session of openSessions.data) {
      if (session.mode === "subscription" && session.metadata?.organizationId === organization.id && session.id !== matchingSession?.id) {
        await stripe.checkout.sessions.expire(session.id);
      }
    }
    const successUrl = dashboardAppUrl(billingReturnPath(audience, "Payment submitted. Access activates once payment is confirmed."));
    const cancelUrl = dashboardAppUrl(billingReturnPath(audience, "Payment was not completed. Your setup is saved. Finish payment or start your free trial if eligible."));

    const session = matchingSession ?? await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_collection: "always",
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
  if (audience === "aftercare") {
    const error = await virtualOrganizationPlanError(organization.id, plan.key);
    if (error) redirect(billingReturnPath(audience, error));
  }

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
  let confirmedStatus = organization.subscriptionStatus;

  try {
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    const subscriptionItemId = subscription.items.data[0]?.id;

    if (!subscriptionItemId) {
      redirect(billingReturnPath(audience, "Stripe subscription item could not be found."));
    }

    const updatedSubscription = await stripe.subscriptions.update(subscription.id, {
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
    confirmedStatus = subscriptionStatusFromStripe(updatedSubscription.status);
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
      subscriptionStatus: confirmedStatus
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
    return_url: dashboardAppUrl(billingReturnPath(audience))
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

export async function startReferentTrial() {
  const { organization, audience } = await getBillingContext("/dashboard/referent?tab=subscription");
  if (audience !== "referent" || !canStartReferentTrial(organization)) {
    redirect(billingReturnPath(audience, "This organization is not eligible for another free trial."));
  }
  const now = new Date();
  const result = await prisma.organization.updateMany({
    where: { id: organization.id, type: "referent", subscriptionStatus: "incomplete", stripeSubscriptionId: null, referentTrialStartedAt: null },
    data: { subscriptionPlan: "professional", subscriptionStatus: "trialing", referentTrialStartedAt: now, referentTrialEndsAt: trialEndFrom(now) }
  });
  redirect(billingReturnPath(audience, result.count ? "Your 30-day Professional trial has started. No automatic charge." : "Trial could not be started. Refresh to see your current subscription."));
}
