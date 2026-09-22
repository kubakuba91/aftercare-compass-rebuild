"use server";

import { assertInvitationAvailable, InvitationConflict, lockInvitations } from "@/lib/organization-invitations";
import { sendOrganizationInviteEmail } from "@/lib/email-notifications";
import { deliverInvitations } from "@/lib/invite-delivery";
import { getCurrentAppUser } from "@/lib/current-user";
import { createBillingCheckoutSession } from "@/app/dashboard/billing/actions";
import { getReferentTeamLimit, isWithinPlanLimit } from "@/lib/feature-gates";
import { redirect } from "next/navigation";
import { OrganizationType, Prisma, Role } from "@prisma/client";
import { hasDatabaseConfig } from "@/lib/database-status";
import { getOrCreateOnboardingDraft } from "@/lib/onboarding";
import { prisma } from "@/lib/prisma";
import {
  referentEnrollmentData,
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

  const existingUser = await getCurrentAppUser();
  if (existingUser?.orgId) redirect("/dashboard");
  let invitations: { emails: string[]; organizationName: string; invitedByName: string } | null = null;
  let checkout: FormData | null = null;
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
        roleOrganizationDescription: formData.get("roleOrganizationDescription"),
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
        enrollmentChoice: formData.get("enrollmentChoice"),
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
      const enrollment = referentStepThreeSchema.parse(finalDraft);
      const isTrial = enrollment.enrollmentChoice === "trial";
      const selectedPlan = isTrial ? "professional" : enrollment.enrollmentChoice;
      referentStepOneSchema.parse(Object.fromEntries(Object.entries(finalDraft).map(([key, value]) => [key, value === null ? undefined : value])));
      referentStepTwoSchema.parse(finalDraft);
      const teamEmails = [...new Set(parsed.invitedTeamEmails.map(email => email.toLowerCase()))].filter(email => email !== draft.user.email.toLowerCase());
      if (!isWithinPlanLimit(getReferentTeamLimit(selectedPlan), 1, teamEmails.length)) throw new Error("Too many team members for this plan");
      const startedAt = new Date();

      await prisma.$transaction(async (tx) => {
        await lockInvitations(tx);
        await assertInvitationAvailable(tx, [...teamEmails, draft.user.email], null);
        const organization = await tx.organization.create({
          data: {
            type: OrganizationType.referent,
            name: String(finalDraft.organization || `${draft.user.email} Referent Organization`),
            phone: String(finalDraft.phone || ""),
            email: draft.user.email,
            website: nullableText(String(finalDraft.website || "")),
            ...referentEnrollmentData(enrollment, startedAt)
          }
        });

        const assigned = await tx.user.updateMany({
          where: { id: draft.userId, orgId: null },
          data: {
            role: Role.referent_admin,
            orgId: organization.id
          }
        });

        if (assigned.count !== 1) throw new Error("Organization already created");

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
            roleOrganizationDescription: String(finalDraft.roleOrganizationDescription || ""),
            levelsOfCare: [],
            currentPlacementMethods: arrayFromDraft(finalDraft.currentPlacementMethods),
            avgMonthlyReferrals: String(finalDraft.avgMonthlyReferrals || ""),
            invitedTeamEmails: teamEmails,
            onboardingStep: maxReferentStep,
            onboardingCompletedAt: new Date()
          }
        });

        if (draft.user.role !== Role.system_admin) {
          await tx.adminReview.create({
            data: {
              subjectType: "referent_org",
              orgId: organization.id,
              submittedByEmail: draft.user.email
            }
          });
        }

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

      invitations = {
        emails: teamEmails,
        organizationName: String(finalDraft.organization),
        invitedByName: [draft.user.firstName, draft.user.lastName].filter(Boolean).join(" ") || draft.user.email
      };
      destination = "/dashboard/referent";
      if (!isTrial) {
        checkout = new FormData();
        checkout.set("plan", selectedPlan);
        checkout.set("billingCycle", enrollment.billingCycle);
        checkout.set("returnTo", "/dashboard/referent?tab=subscription");
      }
    }
  } catch (error) {
    console.error("Referent onboarding step save failed", error);
    destination = stepRedirect(step, error instanceof InvitationConflict ? error.message : "Please check the highlighted fields and try again.");
  }

  if (invitations?.emails.length) {
    const { organizationName, invitedByName } = invitations;
    const delivery = await deliverInvitations(invitations.emails, email => sendOrganizationInviteEmail({
      email, organizationName, invitedByName, role: Role.referent_manager
    }));
    const message = delivery.notSent
      ? `Your account is ready. ${delivery.sent} invitation emails sent; ${delivery.notSent} could not be sent. Use Resend for pending invitations below.`
      : `${delivery.sent} invitation email${delivery.sent === 1 ? "" : "s"} sent.`;
    destination = `/dashboard/referent?tab=managers&teamMessage=${encodeURIComponent(message)}`;
    if (delivery.notSent) console.warn("Onboarding invitation delivery incomplete", { sent: delivery.sent, notSent: delivery.notSent });
  }
  if (checkout) return createBillingCheckoutSession(checkout);
  redirect(destination);
}
