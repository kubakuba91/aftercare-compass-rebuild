"use server";

import { redirect } from "next/navigation";
import { OrganizationType, Prisma, Role, SubscriptionStatus } from "@prisma/client";
import { hasDatabaseConfig } from "@/lib/database-status";
import { getOrCreateOnboardingDraft } from "@/lib/onboarding";
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

function mergeDraft(currentDraft: unknown, nextValues: Record<string, unknown>) {
  return {
    ...(currentDraft && typeof currentDraft === "object" && !Array.isArray(currentDraft) ? currentDraft : {}),
    ...nextValues
  };
}

function jsonDraft(value: Record<string, unknown>) {
  return value as Prisma.InputJsonValue;
}

function arrayFromDraft(value: unknown) {
  return Array.isArray(value) ? value.map(String) : [];
}

export async function saveReferentOnboardingStep(step: number, formData: FormData) {
  if (!hasDatabaseConfig()) {
    redirect("/setup?missing=database");
  }

  let destination = "/onboarding/referent/1";

  try {
    const draft = await getOrCreateOnboardingDraft("referent", false);
    const currentDraft = draft.referentDraft;

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

      await prisma.onboardingDraft.update({
        where: { id: draft.id },
        data: {
          referentDraft: jsonDraft(mergeDraft(currentDraft, {
            ...parsed,
            website: nullableText(parsed.website),
            medicalRecordsFax: nullableText(parsed.medicalRecordsFax),
            healthSystemAffiliation: nullableText(parsed.healthSystemAffiliation),
            npiNumber: nullableText(parsed.npiNumber),
            stateLicenseNumber: nullableText(parsed.stateLicenseNumber)
          })),
          selectedAccountType: "referent",
          activeStep: 2,
          completedAt: null
        }
      });

      destination = stepRedirect(2);
    }

    if (step === 2) {
      const parsed = referentStepTwoSchema.parse({
        levelsOfCare: valuesFromForm(formData, "levelsOfCare"),
        currentPlacementMethods: valuesFromForm(formData, "currentPlacementMethods"),
        avgMonthlyReferrals: formData.get("avgMonthlyReferrals")
      });

      await prisma.onboardingDraft.update({
        where: { id: draft.id },
        data: {
          referentDraft: jsonDraft(mergeDraft(currentDraft, parsed)),
          selectedAccountType: "referent",
          activeStep: 3,
          completedAt: null
        }
      });

      destination = stepRedirect(3);
    }

    if (step === 3) {
      const parsed = referentStepThreeSchema.parse({
        selectedPlan: formData.get("selectedPlan") || "professional",
        billingCycle: formData.get("billingCycle") || "monthly"
      });

      await prisma.onboardingDraft.update({
        where: { id: draft.id },
        data: {
          referentDraft: jsonDraft(mergeDraft(currentDraft, parsed)),
          selectedAccountType: "referent",
          activeStep: 4,
          completedAt: null
        }
      });

      destination = stepRedirect(4);
    }

    if (step === 4) {
      const parsed = referentStepFourSchema.parse({
        invitedTeamEmails: emailsFromText(String(formData.get("invitedTeamEmails") || ""))
      });
      const finalDraft = mergeDraft(currentDraft, parsed) as Record<string, unknown>;
      const selectedPlan = String(finalDraft.selectedPlan || "professional");

      await prisma.$transaction(async (tx) => {
        const organization = await tx.organization.create({
          data: {
            type: OrganizationType.referent,
            name: String(finalDraft.organization || `${draft.user.email} Referent Organization`),
            phone: String(finalDraft.phone || ""),
            email: draft.user.email,
            website: nullableText(String(finalDraft.website || "")),
            subscriptionPlan: selectedPlan,
            subscriptionBillingCycle: String(finalDraft.billingCycle || "monthly"),
            subscriptionStatus: SubscriptionStatus.trialing
          }
        });

        await tx.user.update({
          where: { id: draft.userId },
          data: {
            role: Role.referent_admin,
            orgId: organization.id
          }
        });

        await tx.referentOrganization.create({
          data: {
            orgId: organization.id,
            orgTypeDetail: String(finalDraft.orgTypeDetail || ""),
            streetAddress: String(finalDraft.streetAddress || ""),
            city: String(finalDraft.city || ""),
            state: String(finalDraft.state || ""),
            zip: String(finalDraft.zip || ""),
            medicalRecordsFax: nullableText(String(finalDraft.medicalRecordsFax || "")),
            healthSystemAffiliation: nullableText(String(finalDraft.healthSystemAffiliation || "")),
            npiNumber: nullableText(String(finalDraft.npiNumber || "")),
            stateLicenseNumber: nullableText(String(finalDraft.stateLicenseNumber || "")),
            ehrSystem: String(finalDraft.ehrSystem || "None"),
            statesOperatedIn: arrayFromDraft(finalDraft.statesOperatedIn),
            levelsOfCare: arrayFromDraft(finalDraft.levelsOfCare),
            currentPlacementMethods: arrayFromDraft(finalDraft.currentPlacementMethods),
            avgMonthlyReferrals: String(finalDraft.avgMonthlyReferrals || ""),
            invitedTeamEmails: parsed.invitedTeamEmails,
            onboardingStep: maxReferentStep,
            onboardingCompletedAt: new Date()
          }
        });

        await tx.onboardingDraft.update({
          where: { id: draft.id },
          data: {
            referentDraft: jsonDraft(finalDraft),
            selectedAccountType: "referent",
            activeStep: maxReferentStep,
            completedAt: new Date()
          }
        });
      });

      destination = "/dashboard/referent";
    }
  } catch (error) {
    console.error("Referent onboarding step save failed", error);
    destination = stepRedirect(step, "Please check the highlighted fields and try again.");
  }

  redirect(destination);
}
