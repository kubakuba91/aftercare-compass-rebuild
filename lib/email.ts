import { Resend } from "resend";

type EmailInput = {
  to: string | string[];
  subject: string;
  html: string;
  text: string;
};

const resendApiKey = process.env.RESEND_API_KEY;
const emailFrom = process.env.EMAIL_FROM;

const resend = resendApiKey ? new Resend(resendApiKey) : null;

export function appUrl(path = "/") {
  const baseUrl = (process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000").replace(/\/$/, "");
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;

  return `${baseUrl}${normalizedPath}`;
}

export function uniqueEmailRecipients(recipients: Array<string | null | undefined>) {
  return Array.from(
    new Set(
      recipients
        .filter((recipient): recipient is string => Boolean(recipient))
        .map((recipient) => recipient.trim().toLowerCase())
        .filter(Boolean)
    )
  );
}

export function escapeHtml(value: string | null | undefined) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export function emailShell(title: string, body: string) {
  return `
    <!doctype html>
    <html>
      <body style="margin:0;background:#f7f8fa;color:#182530;font-family:Arial,sans-serif;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f7f8fa;padding:32px 16px;">
          <tr>
            <td align="center">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:640px;background:#ffffff;border:1px solid #d8dee5;border-radius:12px;padding:28px;">
                <tr>
                  <td>
                    <p style="margin:0 0 16px;font-size:14px;font-weight:700;color:#13205d;">Aftercare Compass</p>
                    <h1 style="margin:0 0 20px;font-size:24px;line-height:1.25;color:#182530;">${escapeHtml(title)}</h1>
                    ${body}
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `;
}

export function emailButton(label: string, href: string) {
  return `
    <p style="margin:24px 0 0;">
      <a href="${escapeHtml(href)}" style="display:inline-block;background:#13205d;color:#ffffff;text-decoration:none;border-radius:8px;padding:12px 18px;font-weight:700;">
        ${escapeHtml(label)}
      </a>
    </p>
  `;
}

export function emailField(label: string, value: string | null | undefined) {
  if (!value) {
    return "";
  }

  return `
    <p style="margin:0 0 12px;font-size:15px;line-height:1.5;">
      <strong>${escapeHtml(label)}:</strong> ${escapeHtml(value)}
    </p>
  `;
}

export async function sendTransactionalEmail(input: EmailInput) {
  const recipients = uniqueEmailRecipients(Array.isArray(input.to) ? input.to : [input.to]);

  if (!recipients.length) {
    return { status: "skipped", reason: "missing_recipient" };
  }

  if (!resend || !emailFrom) {
    console.warn("Email skipped because RESEND_API_KEY or EMAIL_FROM is not configured.");
    return { status: "skipped", reason: "missing_email_config" };
  }

  try {
    await resend.emails.send({
      from: emailFrom,
      to: recipients,
      subject: input.subject,
      html: input.html,
      text: input.text
    });

    return { status: "sent" };
  } catch (error) {
    console.error("Transactional email failed", error);
    return { status: "failed" };
  }
}
