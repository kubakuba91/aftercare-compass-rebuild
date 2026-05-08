import { Role } from "@prisma/client";
import { appUrl, emailButton, emailField, emailShell, escapeHtml, sendTransactionalEmail, uniqueEmailRecipients } from "@/lib/email";
import { prisma } from "@/lib/prisma";

function formatValue(value: string | null | undefined) {
  return value ? value.replace(/_/g, " ") : "";
}

function roleLabel(role: Role) {
  switch (role) {
    case Role.aftercare_admin:
      return "aftercare admin";
    case Role.aftercare_manager:
      return "aftercare manager";
    case Role.referent_admin:
      return "referent admin";
    case Role.referent_manager:
      return "referent manager";
    default:
      return "team member";
  }
}

function aftercareTeamRecipients(users: Array<{ email: string }>, admissionsEmail?: string | null) {
  return uniqueEmailRecipients([admissionsEmail, ...users.map((user) => user.email)]);
}

export async function notifyNewPublicLead(leadId: string) {
  const lead = await prisma.lead.findUnique({
    where: { id: leadId },
    include: {
      profile: {
        select: {
          id: true,
          programName: true,
          slug: true,
          admissionsContactEmail: true
        }
      },
      aftercareOrg: {
        select: {
          users: {
            where: {
              isActive: true,
              role: { in: [Role.aftercare_admin, Role.aftercare_manager] }
            },
            select: { email: true }
          }
        }
      }
    }
  });

  if (!lead) {
    return;
  }

  const dashboardLink = appUrl(`/dashboard/aftercare?tab=overview&profileId=${lead.profileId}`);
  const profileLink = appUrl(`/profiles/${lead.profile.slug}`);
  const body = emailShell(
    "New public lead",
    `
      <p style="margin:0 0 18px;font-size:16px;line-height:1.6;">A visitor requested contact from ${escapeHtml(lead.profile.programName)}.</p>
      ${emailField("Name", lead.name)}
      ${emailField("Email", lead.email)}
      ${emailField("Phone", lead.phone)}
      ${emailField("Message", lead.message)}
      ${emailField("Profile", profileLink)}
      ${emailButton("Open dashboard", dashboardLink)}
    `
  );

  await sendTransactionalEmail({
    to: aftercareTeamRecipients(lead.aftercareOrg.users, lead.profile.admissionsContactEmail),
    subject: `New lead for ${lead.profile.programName}`,
    html: body,
    text: [
      `New public lead for ${lead.profile.programName}`,
      `Name: ${lead.name}`,
      `Email: ${lead.email}`,
      lead.phone ? `Phone: ${lead.phone}` : "",
      `Message: ${lead.message}`,
      `Open dashboard: ${dashboardLink}`
    ].filter(Boolean).join("\n")
  });
}

export async function notifyNewReferral(referralId: string) {
  const referral = await prisma.referral.findUnique({
    where: { id: referralId },
    include: {
      aftercareProfile: {
        select: {
          id: true,
          programName: true,
          admissionsContactEmail: true
        }
      },
      aftercareOrg: {
        select: {
          users: {
            where: {
              isActive: true,
              role: { in: [Role.aftercare_admin, Role.aftercare_manager] }
            },
            select: { email: true }
          }
        }
      },
      referentOrg: {
        select: { name: true }
      }
    }
  });

  if (!referral) {
    return;
  }

  const dashboardLink = appUrl(`/dashboard/aftercare?tab=overview&profileId=${referral.aftercareProfileId}&referralId=${referral.id}`);
  const body = emailShell(
    "New referral received",
    `
      <p style="margin:0 0 18px;font-size:16px;line-height:1.6;">${escapeHtml(referral.caseManagerOrganization)} sent a referral to ${escapeHtml(referral.aftercareProfile.programName)}.</p>
      ${emailField("Case manager", referral.caseManagerName)}
      ${emailField("Case manager email", referral.caseManagerEmail)}
      ${emailField("Case manager phone", referral.caseManagerPhone)}
      ${emailField("Client age range", formatValue(referral.clientAgeRange))}
      ${emailField("Support category", formatValue(referral.supportCategory))}
      ${emailField("Insurance", formatValue(referral.insuranceCategory))}
      ${emailField("Preferred start", formatValue(referral.preferredStartWindow))}
      ${emailField("Reason", referral.reasonForReferral)}
      ${emailButton("View referral", dashboardLink)}
    `
  );

  await sendTransactionalEmail({
    to: aftercareTeamRecipients(referral.aftercareOrg.users, referral.aftercareProfile.admissionsContactEmail),
    subject: `New referral for ${referral.aftercareProfile.programName}`,
    html: body,
    text: [
      `New referral for ${referral.aftercareProfile.programName}`,
      `From: ${referral.caseManagerOrganization}`,
      `Case manager: ${referral.caseManagerName}`,
      `Email: ${referral.caseManagerEmail}`,
      `Phone: ${referral.caseManagerPhone}`,
      `Reason: ${referral.reasonForReferral}`,
      `View referral: ${dashboardLink}`
    ].join("\n")
  });
}

export async function notifyReferralStatusChanged(referralId: string) {
  const referral = await prisma.referral.findUnique({
    where: { id: referralId },
    include: {
      aftercareProfile: {
        select: { programName: true }
      },
      referentOrg: {
        select: {
          users: {
            where: {
              isActive: true,
              role: { in: [Role.referent_admin, Role.referent_manager] }
            },
            select: { email: true }
          }
        }
      }
    }
  });

  if (!referral) {
    return;
  }

  const dashboardLink = appUrl("/dashboard/referent");
  const status = formatValue(referral.status);
  const body = emailShell(
    "Referral status updated",
    `
      <p style="margin:0 0 18px;font-size:16px;line-height:1.6;">${escapeHtml(referral.aftercareProfile.programName)} updated a referral status to <strong>${escapeHtml(status)}</strong>.</p>
      ${emailField("Client age range", formatValue(referral.clientAgeRange))}
      ${emailField("Preferred start", formatValue(referral.preferredStartWindow))}
      ${emailField("Reason", referral.reasonForReferral)}
      ${emailButton("Open referent dashboard", dashboardLink)}
    `
  );

  await sendTransactionalEmail({
    to: uniqueEmailRecipients([referral.caseManagerEmail, ...referral.referentOrg.users.map((user) => user.email)]),
    subject: `Referral status updated: ${status}`,
    html: body,
    text: [
      `Referral status updated to ${status}`,
      `Profile: ${referral.aftercareProfile.programName}`,
      `Open dashboard: ${dashboardLink}`
    ].join("\n")
  });
}

export async function sendOrganizationInviteEmail(input: {
  email: string;
  organizationName: string;
  role: Role;
  invitedByName?: string | null;
}) {
  const signupLink = appUrl(`/sign-up?redirect_url=${encodeURIComponent("/auth/complete")}`);
  const body = emailShell(
    "You have been invited",
    `
      <p style="margin:0 0 18px;font-size:16px;line-height:1.6;">
        ${escapeHtml(input.invitedByName || "An admin")} invited you to join ${escapeHtml(input.organizationName)} as a ${escapeHtml(roleLabel(input.role))}.
      </p>
      <p style="margin:0 0 18px;font-size:15px;line-height:1.6;">Use ${escapeHtml(input.email)} when you create your account so we can connect you to the right organization.</p>
      ${emailButton("Join Aftercare Compass", signupLink)}
    `
  );

  await sendTransactionalEmail({
    to: input.email,
    subject: `Join ${input.organizationName} on Aftercare Compass`,
    html: body,
    text: [
      `${input.invitedByName || "An admin"} invited you to join ${input.organizationName} as a ${roleLabel(input.role)}.`,
      `Use ${input.email} when you create your account.`,
      `Join: ${signupLink}`
    ].join("\n")
  });
}
