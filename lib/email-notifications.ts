import { Role } from "@prisma/client";
import { dashboardAppUrl } from "@/lib/app-urls";
import { createCalendarEvent } from "@/lib/calendar";
import { appUrl, emailButton, emailField, emailShell, escapeHtml, sendTransactionalEmail, uniqueEmailRecipients } from "@/lib/email";
import { formatValue as formatDisplayValue } from "@/lib/format-utils";
import { formatPhoneScreeningDateTime } from "@/lib/phone-screening";
import { prisma } from "@/lib/prisma";

function formatValue(value: string | null | undefined) {
  return formatDisplayValue(value, { fallback: "" });
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

async function createUserNotifications(input: {
  users: Array<{ id: string }>;
  type: string;
  title: string;
  body: string;
}) {
  const userIds = Array.from(new Set(input.users.map((user) => user.id).filter(Boolean)));

  if (!userIds.length) {
    return;
  }

  try {
    await prisma.notification.createMany({
      data: userIds.map((userId) => ({
        userId,
        type: input.type,
        title: input.title,
        body: input.body
      }))
    });
  } catch (error) {
    console.error("In-app notification creation failed", error);
  }
}

async function systemAdminUsers() {
  return prisma.user.findMany({
    where: {
      isActive: true,
      role: Role.system_admin
    },
    select: {
      id: true,
      email: true
    }
  });
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
            select: { id: true, email: true }
          }
        }
      }
    }
  });

  if (!lead) {
    return;
  }

  const dashboardLink = dashboardAppUrl(`/dashboard/aftercare?tab=overview&profileId=${lead.profileId}`);
  const profileLink = appUrl(`/profiles/${lead.profile.slug}`);
  await createUserNotifications({
    users: lead.aftercareOrg.users,
    type: "lead.created",
    title: `New public lead for ${lead.profile.programName}`,
    body: `${lead.name} requested contact from this profile.`
  });

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

  return sendTransactionalEmail({
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

export async function notifyProfileClaimSubmitted(claimRequestId: string) {
  const [claim, admins] = await Promise.all([
    prisma.profileClaimRequest.findUnique({
      where: { id: claimRequestId },
      include: {
        profile: {
          select: {
            programName: true,
            slug: true,
            publicCity: true,
            publicState: true
          }
        }
      }
    }),
    systemAdminUsers()
  ]);

  if (!claim) {
    return;
  }

  const adminLink = dashboardAppUrl("/dashboard/admin?tab=claims");
  const profileLink = appUrl(`/profiles/${claim.profile.slug}?preview=1`);

  await createUserNotifications({
    users: admins,
    type: "profile_claim.submitted",
    title: `Claim submitted for ${claim.profile.programName}`,
    body: `${claim.claimantName} requested ownership review.`
  });

  const adminEmail = sendTransactionalEmail({
    to: admins.map((admin) => admin.email),
    subject: `Profile claim submitted: ${claim.profile.programName}`,
    html: emailShell(
      "Profile claim submitted",
      `
        <p style="margin:0 0 18px;font-size:16px;line-height:1.6;">${escapeHtml(claim.claimantName)} requested to claim ${escapeHtml(claim.profile.programName)}.</p>
        ${emailField("Claimant email", claim.claimantEmail)}
        ${emailField("Claimant phone", claim.claimantPhone)}
        ${emailField("Role", claim.claimantRole)}
        ${emailField("Organization", claim.claimantOrganization)}
        ${emailField("Relationship", claim.relationshipToProgram)}
        ${emailField("Notes", claim.notes)}
        ${emailField("Profile", profileLink)}
        ${emailButton("Review claim", adminLink)}
      `
    ),
    text: [
      `Profile claim submitted: ${claim.profile.programName}`,
      `Claimant: ${claim.claimantName}`,
      `Email: ${claim.claimantEmail}`,
      claim.claimantPhone ? `Phone: ${claim.claimantPhone}` : "",
      claim.claimantRole ? `Role: ${claim.claimantRole}` : "",
      claim.claimantOrganization ? `Organization: ${claim.claimantOrganization}` : "",
      `Relationship: ${claim.relationshipToProgram || "Not provided"}`,
      `Review: ${adminLink}`
    ].filter(Boolean).join("\n")
  });

  const claimantEmail = sendTransactionalEmail({
    to: claim.claimantEmail,
    subject: `We received your claim for ${claim.profile.programName}`,
    html: emailShell(
      "Claim request received",
      `
        <p style="margin:0 0 18px;font-size:16px;line-height:1.6;">Thanks for requesting ownership of ${escapeHtml(claim.profile.programName)}. Our team will review your relationship to the program before transferring management access.</p>
        ${emailField("Profile", `${claim.profile.programName} in ${[claim.profile.publicCity, claim.profile.publicState].filter(Boolean).join(", ")}`)}
        ${emailButton("View profile", profileLink)}
      `
    ),
    text: [
      `We received your claim for ${claim.profile.programName}.`,
      "Our team will review it before transferring management access.",
      `Profile: ${profileLink}`
    ].join("\n")
  });

  return Promise.all([adminEmail, claimantEmail]);
}

export async function notifyProfileClaimApproved(claimRequestId: string) {
  const claim = await prisma.profileClaimRequest.findUnique({
    where: { id: claimRequestId },
    include: {
      profile: {
        select: {
          programName: true,
          slug: true
        }
      }
    }
  });

  if (!claim) {
    return;
  }

  const dashboardLink = dashboardAppUrl("/dashboard/aftercare?tab=homes");
  return sendTransactionalEmail({
    to: claim.claimantEmail,
    subject: `Claim approved: ${claim.profile.programName}`,
    html: emailShell(
      "Profile claim approved",
      `
        <p style="margin:0 0 18px;font-size:16px;line-height:1.6;">Your claim for ${escapeHtml(claim.profile.programName)} was approved. You can now manage this listing from your dashboard.</p>
        ${emailButton("Open dashboard", dashboardLink)}
      `
    ),
    text: [
      `Your claim for ${claim.profile.programName} was approved.`,
      `Open dashboard: ${dashboardLink}`
    ].join("\n")
  });
}

export async function notifyProfileClaimRejected(claimRequestId: string) {
  const claim = await prisma.profileClaimRequest.findUnique({
    where: { id: claimRequestId },
    include: {
      profile: {
        select: {
          programName: true,
          slug: true
        }
      }
    }
  });

  if (!claim) {
    return;
  }

  const profileLink = appUrl(`/profiles/${claim.profile.slug}`);
  return sendTransactionalEmail({
    to: claim.claimantEmail,
    subject: `Claim request update: ${claim.profile.programName}`,
    html: emailShell(
      "Claim request update",
      `
        <p style="margin:0 0 18px;font-size:16px;line-height:1.6;">We could not approve your claim for ${escapeHtml(claim.profile.programName)} at this time.</p>
        ${emailField("Admin notes", claim.reviewerNotes)}
        ${emailButton("View profile", profileLink)}
      `
    ),
    text: [
      `We could not approve your claim for ${claim.profile.programName} at this time.`,
      claim.reviewerNotes ? `Notes: ${claim.reviewerNotes}` : "",
      `Profile: ${profileLink}`
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
            select: { id: true, email: true }
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

  const dashboardLink = dashboardAppUrl(`/dashboard/aftercare?tab=overview&profileId=${referral.aftercareProfileId}&referralId=${referral.id}`);
  await createUserNotifications({
    users: referral.aftercareOrg.users,
    type: "referral.created",
    title: `New referral for ${referral.aftercareProfile.programName}`,
    body: `${referral.caseManagerOrganization} sent a referral for ${formatValue(referral.clientAgeRange)}.`
  });

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

  return sendTransactionalEmail({
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
          name: true,
          users: {
            where: {
              isActive: true,
              role: { in: [Role.referent_admin, Role.referent_manager] }
            },
            select: { id: true, email: true }
          }
        }
      }
    }
  });

  if (!referral) {
    return;
  }

  const dashboardLink = dashboardAppUrl("/dashboard/referent");
  const status = formatValue(referral.status);
  await createUserNotifications({
    users: referral.referentOrg.users,
    type: "referral.status_changed",
    title: `Referral status updated: ${status}`,
    body: `${referral.aftercareProfile.programName} updated the referral status.`
  });

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

  return sendTransactionalEmail({
    to: uniqueEmailRecipients([referral.caseManagerEmail, ...referral.referentOrg.users.map((user) => user.email)]),
    subject: `Referral status updated: ${status} for ${referral.aftercareProfile.programName}`,
    html: body,
    text: [
      `Referral status updated to ${status}`,
      `Profile: ${referral.aftercareProfile.programName}`,
      `Open dashboard: ${dashboardLink}`
    ].join("\n")
  });
}

export async function notifyPhoneScreeningBooked(appointmentId: string) {
  const appointment = await prisma.phoneScreeningAppointment.findUnique({
    where: { id: appointmentId },
    include: {
      referral: {
        select: {
          caseManagerName: true,
          caseManagerEmail: true,
          caseManagerPhone: true,
          caseManagerOrganization: true,
          clientAgeRange: true,
          preferredStartWindow: true
        }
      },
      aftercareProfile: {
        select: {
          programName: true,
          admissionsContactEmail: true,
          admissionsContactPhone: true
        }
      },
      aftercareOrg: {
        select: {
          users: {
            where: {
              isActive: true,
              role: { in: [Role.aftercare_admin, Role.aftercare_manager] }
            },
            select: { id: true, email: true }
          }
        }
      }
    }
  });

  if (!appointment) {
    return;
  }

  const scheduledFor = formatPhoneScreeningDateTime(appointment.startsAt, appointment.timezone);
  const aftercareDashboardLink = dashboardAppUrl(`/dashboard/aftercare?tab=overview&profileId=${appointment.aftercareProfileId}&referralId=${appointment.referralId}`);
  const referentDashboardLink = dashboardAppUrl("/dashboard/referent?tab=referrals");
  const calendarInvite = createCalendarEvent({
    uid: `phone-screening-${appointment.id}@aftercarecompass.com`,
    title: `Phone screening: ${appointment.aftercareProfile.programName}`,
    startsAt: appointment.startsAt,
    endsAt: appointment.endsAt,
    location: "Phone call",
    description: [
      `Phone screening with ${appointment.aftercareProfile.programName}`,
      `Case manager: ${appointment.referral.caseManagerName}`,
      `Organization: ${appointment.referral.caseManagerOrganization}`,
      `Case manager email: ${appointment.referral.caseManagerEmail}`,
      appointment.referral.caseManagerPhone ? `Case manager phone: ${appointment.referral.caseManagerPhone}` : "",
      appointment.aftercareProfile.admissionsContactPhone ? `Provider phone: ${appointment.aftercareProfile.admissionsContactPhone}` : "",
      `Provider dashboard: ${aftercareDashboardLink}`,
      `Referent dashboard: ${referentDashboardLink}`
    ].filter(Boolean).join("\n")
  });
  const calendarAttachment = {
    filename: "phone-screening.ics",
    content: calendarInvite,
    contentType: "text/calendar; charset=utf-8; method=PUBLISH"
  };

  await createUserNotifications({
    users: appointment.aftercareOrg.users,
    type: "phone_screening.booked",
    title: `Phone screening booked for ${appointment.aftercareProfile.programName}`,
    body: `${appointment.referral.caseManagerOrganization} booked ${scheduledFor}.`
  });

  const providerEmail = sendTransactionalEmail({
    to: aftercareTeamRecipients(appointment.aftercareOrg.users, appointment.aftercareProfile.admissionsContactEmail),
    subject: `Phone screening booked: ${appointment.aftercareProfile.programName}`,
    html: emailShell(
      "Phone screening booked",
      `
        <p style="margin:0 0 18px;font-size:16px;line-height:1.6;">A referral phone screening was scheduled for ${escapeHtml(appointment.aftercareProfile.programName)}.</p>
        ${emailField("Scheduled for", scheduledFor)}
        ${emailField("Case manager", appointment.referral.caseManagerName)}
        ${emailField("Organization", appointment.referral.caseManagerOrganization)}
        ${emailField("Case manager email", appointment.referral.caseManagerEmail)}
        ${emailField("Case manager phone", appointment.referral.caseManagerPhone)}
        ${emailField("Provider phone", appointment.aftercareProfile.admissionsContactPhone)}
        <p style="margin:0 0 12px;font-size:15px;line-height:1.5;">A calendar invite is attached to this email.</p>
        ${emailButton("View referral", aftercareDashboardLink)}
      `
    ),
    text: [
      `Phone screening booked for ${appointment.aftercareProfile.programName}`,
      `Scheduled for: ${scheduledFor}`,
      `Case manager: ${appointment.referral.caseManagerName}`,
      `Organization: ${appointment.referral.caseManagerOrganization}`,
      `Email: ${appointment.referral.caseManagerEmail}`,
      `Phone: ${appointment.referral.caseManagerPhone}`,
      appointment.aftercareProfile.admissionsContactPhone ? `Provider phone: ${appointment.aftercareProfile.admissionsContactPhone}` : "",
      "A calendar invite is attached to this email.",
      `View referral: ${aftercareDashboardLink}`
    ].filter(Boolean).join("\n"),
    attachments: [calendarAttachment]
  });

  const referentEmail = sendTransactionalEmail({
    to: appointment.referral.caseManagerEmail,
    subject: `Phone screening confirmed: ${appointment.aftercareProfile.programName}`,
    html: emailShell(
      "Phone screening confirmed",
      `
        <p style="margin:0 0 18px;font-size:16px;line-height:1.6;">Your phone screening with ${escapeHtml(appointment.aftercareProfile.programName)} is confirmed.</p>
        ${emailField("Scheduled for", scheduledFor)}
        ${emailField("Provider phone", appointment.aftercareProfile.admissionsContactPhone)}
        ${emailField("Case manager phone", appointment.referral.caseManagerPhone)}
        <p style="margin:0 0 12px;font-size:15px;line-height:1.5;">A calendar invite is attached to this email.</p>
        ${emailButton("Open referrals", referentDashboardLink)}
      `
    ),
    text: [
      `Phone screening confirmed with ${appointment.aftercareProfile.programName}`,
      `Scheduled for: ${scheduledFor}`,
      appointment.aftercareProfile.admissionsContactPhone ? `Provider phone: ${appointment.aftercareProfile.admissionsContactPhone}` : "",
      "A calendar invite is attached to this email.",
      `Open referrals: ${referentDashboardLink}`
    ].filter(Boolean).join("\n"),
    attachments: [calendarAttachment]
  });

  return Promise.all([providerEmail, referentEmail]);
}

export async function sendOrganizationInviteEmail(input: {
  email: string;
  organizationName: string;
  role: Role;
  invitedByName?: string | null;
}) {
  const signupLink = dashboardAppUrl(`/sign-up?redirect_url=${encodeURIComponent("/auth/complete")}`);
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

  return sendTransactionalEmail({
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
