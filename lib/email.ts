type EmailInput = {
  to: string | string[];
  subject: string;
  html: string;
  text: string;
};

const resendApiKey = process.env.RESEND_API_KEY;
const mailgunApiKey = process.env.MAILGUN_API_KEY;
const mailgunDomain = process.env.MAILGUN_DOMAIN;
const mailgunBaseUrl = process.env.MAILGUN_BASE_URL || "https://api.mailgun.net/v3";
const emailFrom = process.env.MAILGUN_FROM_EMAIL || process.env.EMAIL_FROM;

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

  if (mailgunApiKey && mailgunDomain && emailFrom) {
    return sendMailgunEmail({
      ...input,
      to: recipients
    });
  }

  if (resendApiKey && emailFrom) {
    return sendResendEmail({
      ...input,
      to: recipients
    });
  }

  console.warn(
    "Email skipped because Mailgun or Resend environment variables are not configured."
  );
  return { status: "skipped", reason: "missing_email_config" };
}

async function sendMailgunEmail(input: EmailInput & { to: string[] }) {
  if (!mailgunApiKey || !mailgunDomain || !emailFrom) {
    return { status: "skipped", reason: "missing_email_config" };
  }

  const formData = new FormData();
  formData.set("from", emailFrom);
  input.to.forEach((recipient) => formData.append("to", recipient));
  formData.set("subject", input.subject);
  formData.set("text", input.text);
  formData.set("html", input.html);

  try {
    const response = await fetch(`${mailgunBaseUrl}/${mailgunDomain}/messages`, {
      method: "POST",
      headers: {
        Authorization: `Basic ${Buffer.from(`api:${mailgunApiKey}`).toString("base64")}`
      },
      body: formData
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error("Mailgun email failed", response.status, errorBody);
      return { status: "failed" };
    }

    return { status: "sent" };
  } catch (error) {
    console.error("Mailgun email failed", error);
    return { status: "failed" };
  }
}

async function sendResendEmail(input: EmailInput & { to: string[] }) {
  if (!resendApiKey || !emailFrom) {
    return { status: "skipped", reason: "missing_email_config" };
  }

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        from: emailFrom,
        to: input.to,
        subject: input.subject,
        html: input.html,
        text: input.text
      })
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error("Resend email failed", response.status, errorBody);
      return { status: "failed" };
    }

    return { status: "sent" };
  } catch (error) {
    console.error("Resend email failed", error);
    return { status: "failed" };
  }
}
