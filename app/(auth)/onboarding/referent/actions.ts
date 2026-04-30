"use server";

import { redirect } from "next/navigation";
import { SubscriptionStatus } from "@prisma/client";
import { hasDatabaseConfig } from "@/lib/database-status";
import { ensureOnboardingOrganization } from "@/lib/onboarding";
import { prisma } from "@/lib/prisma";
import {
  emailsFromText,
  maxReferentStep,
  nullableText,
  referentStepFourSchema,
  referentStepOneSchema,
  referentStepThreeSchema,
  referentStepTwoSchema,
  valuesFromForm
} from "@/lib/referent-onboarding";

function stepRedirect(step: number, error?: string) {
  const params = new URLSearchParams();

  if (error) {
    params.set("error", error);
  }

  return `/onboarding/referent/${step}${params.size ? `?${params.toString()}` : ""}`;
}

export async function saveReferentOnboardingStep(step: number, formData: FormData) {
  if (!hasDatabaseConfig()) {
    redirect("/setup?missing=database");
  }

  let destination = "/onboarding/referent/1";

  try {
    const organization = await ensureOnboardingOrganization("referent");

    if (step === 1) {
      const parsed = referentStepOneSchema.parse({
        organization: formData.get("organization"),
        orgTypeDetail: formData.get("orgTypeDetail"),
        streetAddress: formData.get("streetAddress"),
        city: formData.get("city"),
        state: formData.get("state"),
        zip: formData.get("zip"),
        phone: formData.get("phone"),
        medicalRecordsFax: formData.get("medicalRecordsFax") || undefined,
        website: formData.get("website") || undefined,
        healthSystemAffiliation: formData.get("healthSystemAffiliation") || undefined,
        npiNumber: formData.get("npiNumber") || undefined,
        stateLicenseNumber: formData.get("stateLicenseNumber") || undefined,
        ehrSystem: formData.get("ehrSystem"),
        statesOperatedIn: valuesFromForm(formData, "statesOperatedIn")
      });

      await prisma.$transaction([
        prisma.organization.update({
          where: { id: organization.orgId },
          data: {
            name: parsed.organization,
            phone: parsed.phone,
            website: nullableText(parsed.website)
          }
        }),
        prisma.referentOrganization.upsert({
          where: { orgId: organization.orgId },
          create: {
            orgId: organization.orgId,
            orgTypeDetail: parsed.orgTypeDetail,
            streetAddress: parsed.streetAddress,
            city: parsed.city,
            state: parsed.state,
            zip: parsed.zip,
            medicalRecordsFax: nullableText(parsed.medicalRecordsFax),
            healthSystemAffiliation: nullableText(parsed.healthSystemAffiliation),
            npiNumber: nullableText(parsed.npiNumber),
            stateLicenseNumber: nullableText(parsed.stateLicenseNumber),
            ehrSystem: parsed.ehrSystem,
            statesOperatedIn: parsed.statesOperatedIn,
            onboardingStep: 2
          },
          update: {
            orgTypeDetail: parsed.orgTypeDetail,
            streetAddress: parsed.streetAddress,
            city: parsed.city,
            state: parsed.state,
            zip: parsed.zip,
            medicalRecordsFax: nullableText(parsed.medicalRecordsFax),
            healthSystemAffiliation: nullableText(parsed.healthSystemAffiliation),
            npiNumber: nullableText(parsed.npiNumber),
            stateLicenseNumber: nullableText(parsed.stateLicenseNumber),
            ehrSystem: parsed.ehrSystem,
            statesOperatedIn: parsed.statesOperatedIn,
            onboardingStep: 2
          }
        })
      ]);

      destination = stepRedirect(2);
    }

    if (step === 2) {
      const parsed = referentStepTwoSchema.parse({
        levelsOfCare: valuesFromForm(formData, "levelsOfCare"),
        currentPlacementMethods: valuesFromForm(formData, "currentPlacementMethods"),
        avgMonthlyReferrals: formData.get("avgMonthlyReferrals")
      });

      await prisma.referentOrganization.update({
        where: { orgId: organization.orgId },
        data: {
          levelsOfCare: parsed.levelsOfCare,
          currentPlacementMethods: parsed.currentPlacementMethods,
          avgMonthlyReferrals: parsed.avgMonthlyReferrals,
          onboardingStep: 3
        }
      });

      destination = stepRedirect(3);
    }

    if (step === 3) {
      const parsed = referentStepThreeSchema.parse({
        selectedPlan: formData.get("selectedPlan"),
        billingCycle: formData.get("billingCycle")
      });

      await prisma.$transaction([
        prisma.organization.update({
          where: { id: organization.orgId },
          data: {
            subscriptionPlan: parsed.selectedPlan,
            subscriptionBillingCycle: parsed.billingCycle,
            subscriptionStatus:
              parsed.selectedPlan === "professional" ? SubscriptionStatus.trialing : SubscriptionStatus.incomplete
          }
        }),
        prisma.referentOrganization.update({
          where: { orgId: organization.orgId },
          data: { onboardingStep: 4 }
        })
      ]);

      destination = stepRedirect(4);
    }

    if (step === 4) {
      const parsed = referentStepFourSchema.parse({
        invitedTeamEmails: emailsFromText(String(formData.get("invitedTeamEmails") || ""))
      });

      await prisma.referentOrganization.update({
        where: { orgId: organization.orgId },
        data: {
          invitedTeamEmails: parsed.invitedTeamEmails,
          onboardingStep: maxReferentStep,
          onboardingCompletedAt: new Date()
        }
      });

      destination = "/dashboard/referent";
    }
  } catch (error) {
    console.error("Referent onboarding step save failed", error);
    destination = stepRedirect(step, "Please check the highlighted fields and try again.");
  }

  redirect(destination);
}
