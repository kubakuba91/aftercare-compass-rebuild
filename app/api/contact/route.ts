import { NextResponse } from "next/server";
import { emailField, emailShell, escapeHtml, sendTransactionalEmail } from "@/lib/email";
import { hasHumanTrapValue } from "@/lib/form-utils";
import { contactInquirySchema } from "@/lib/validations/contact";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = contactInquirySchema.safeParse(body);

  if (!parsed.success || !body || hasHumanTrapValue(body)) {
    return NextResponse.json({ error: "Please check the form and try again." }, { status: 400 });
  }

  const { name, email, organization, role, message } = parsed.data;
  const recipient = process.env.CONTACT_EMAIL?.trim() || "contact@aftercarecompass.com";
  const result = await sendTransactionalEmail({
    to: recipient,
    subject: `Website inquiry from ${name} (${role})`,
    headers: { "Reply-To": email },
    html: emailShell(
      "New website inquiry",
      [
        emailField("Name", name),
        emailField("Email", email),
        emailField("Organization", organization),
        emailField("Role", role),
        `<p style="margin:18px 0 6px;font-size:15px;font-weight:700;">Message</p>`,
        `<p style="margin:0;font-size:15px;line-height:1.6;white-space:pre-wrap;">${escapeHtml(message)}</p>`
      ].join("")
    ),
    text: [
      "New website inquiry",
      `Name: ${name}`,
      `Email: ${email}`,
      organization ? `Organization: ${organization}` : "",
      `Role: ${role}`,
      "",
      message
    ].filter((line) => line !== "").join("\n")
  });

  if (result.status === "skipped") {
    return NextResponse.json({ error: "Contact email is not configured yet." }, { status: 503 });
  }

  if (result.status === "failed") {
    return NextResponse.json({ error: "We couldn’t send your message. Please try again." }, { status: 502 });
  }

  return NextResponse.json({ status: "sent" });
}
