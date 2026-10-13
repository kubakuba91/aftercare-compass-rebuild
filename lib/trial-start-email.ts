import { prisma } from "@/lib/prisma";
import { dashboardAppUrl } from "@/lib/app-urls";
import { emailButton, emailField, emailShell, sendTransactionalEmail, uniqueEmailRecipients } from "@/lib/email";

// Called only after a successful trial grant has committed. Email failure must not undo access.
export async function sendTrialStartedEmail(orgId: string, endsAt: Date) {
  try {
    const org = await prisma.organization.findUnique({
      where: { id: orgId },
      select: {
        name: true, email: true,
        users: { where: { isActive: true, role: "aftercare_admin" }, select: { email: true } }
      }
    });
    if (!org) return "Trial started, but the confirmation email could not be sent.";
    const admins = uniqueEmailRecipients(org.users.map(user => user.email));
    const to = admins.length ? admins : uniqueEmailRecipients([org.email]);
    const endDate = endsAt.toLocaleString("en-US", {
      timeZone: "America/New_York", month: "long", day: "numeric", year: "numeric",
      hour: "numeric", minute: "2-digit", timeZoneName: "short"
    });
    const subject = "Your Aftercare Compass trial has started";
    const link = dashboardAppUrl("/dashboard/aftercare?tab=subscription");
    const terms = "Your 30-day Aftercare Basic trial is now active. No card is required, and you will not be charged automatically. When the trial ends, your account returns to the free Claimed Listing plan unless you choose a paid subscription. Your existing records are retained.";
    const result = await sendTransactionalEmail({
      to, subject,
      html: emailShell(subject, `<p>${terms}</p>${emailField("Organization", org.name)}${emailField("Trial ends", endDate)}${emailButton("Open your dashboard", link)}`),
      text: `${subject}\n\n${org.name}\n\n${terms}\n\nTrial ends: ${endDate}\n\nOpen your dashboard: ${link}`
    });
    if (result.status === "sent") return "Trial confirmation email sent.";
    console.warn("Trial start email not sent", { orgId, status: result.status });
  } catch {
    console.error("Trial start email failed", { orgId });
  }
  return "Trial started, but the confirmation email could not be sent.";
}
