import { BackButton } from "@/components/public/back-button";
import { Card } from "@/components/ui/card";

export const dynamic = "force-dynamic";

type TermsSection = {
  title: string;
  paragraphs: string[];
  bullets?: string[];
};

const termsSections: TermsSection[] = [
  {
    title: "1. Acceptance of Terms",
    paragraphs: [
      "By accessing or using the Aftercare Compass platform (www.aftercarecompass.com), you agree to be bound by these Terms of Service and our Privacy Policy. If you do not agree, you may not use the Platform. These Terms constitute a legally binding agreement between you and Aftercare Compass LLC."
    ]
  },
  {
    title: "2. About Aftercare Compass",
    paragraphs: [
      "Aftercare Compass LLC is a Pennsylvania-based company that operates an online marketplace connecting aftercare providers -- including sober living homes and continued care programs -- with referent organizations seeking placements. The Platform allows providers to list services and receive referrals, and allows referent organizations to search listings and submit referrals. Public visitors may browse listings and submit general contact inquiries."
    ]
  },
  {
    title: "3. Account Registration",
    paragraphs: [
      "To access certain features, you must register for an account. By registering, you agree to provide accurate and current information and to keep it up to date. You are responsible for maintaining the confidentiality of your credentials and for all activity that occurs under your account. One email address may belong to only one organization."
    ]
  },
  {
    title: "4. Acceptable Use",
    paragraphs: ["You agree to use the Platform only for lawful purposes. You agree not to:"],
    bullets: [
      "Submit false, misleading, or inaccurate information",
      "Access accounts or data that do not belong to you",
      "Use the Platform to harass, deceive, or harm any person or organization",
      "Use automated tools to scrape or extract Platform data without written authorization",
      "Interfere with the operation or security of the Platform"
    ]
  },
  {
    title: "5. Provider Listings and Content",
    paragraphs: [
      "Aftercare organizations are responsible for the accuracy of all information submitted for their listings, including availability, pricing, and program details. Aftercare Compass does not independently verify provider-submitted content and makes no representations about its accuracy."
    ]
  },
  {
    title: "6. Referrals and Location Privacy",
    paragraphs: [
      "Referrals submitted through the Platform are intended to be de-identified. Referent organizations are responsible for ensuring their submissions do not contain unnecessary personally identifiable information. Exact provider addresses are never displayed to public visitors or referent organizations. Public-facing pages show city and state level location information only."
    ]
  },
  {
    title: "7. Subscriptions and Billing",
    paragraphs: [
      "Access to certain features requires a paid subscription. By subscribing, you authorize Aftercare Compass to charge your payment method on a recurring basis at the rate for your selected plan. Cancellations take effect at the end of the current billing period. Aftercare Compass reserves the right to modify pricing with reasonable advance notice to active subscribers."
    ]
  },
  {
    title: "8. Communications",
    paragraphs: [
      "By opting in, you consent to receive SMS and email notifications from Aftercare Compass related to your account and platform activity. You may opt out of SMS at any time by replying STOP. You may opt out of non-essential email by using the unsubscribe link in any message or by contacting admin@aftercarecompass.com.",
      "Message and data rates may apply for SMS. Message frequency varies."
    ]
  },
  {
    title: "9. Intellectual Property",
    paragraphs: [
      "All content, features, and functionality of the Platform are the property of Aftercare Compass LLC and are protected under applicable intellectual property laws. You may not reproduce, distribute, or create derivative works from Platform content without prior written permission."
    ]
  },
  {
    title: "10. Disclaimer of Warranties",
    paragraphs: [
      "The Platform is provided on an 'as is' and 'as available' basis without warranties of any kind. Aftercare Compass does not warrant that the Platform will be uninterrupted or error-free, or that any listing information is accurate or complete. We do not guarantee that any referral will result in a successful placement."
    ]
  },
  {
    title: "11. Limitation of Liability",
    paragraphs: [
      "To the fullest extent permitted by Pennsylvania law, Aftercare Compass LLC shall not be liable for any indirect, incidental, special, or consequential damages arising from your use of the Platform. Our total liability for any claim shall not exceed the amount you paid to Aftercare Compass in the twelve months preceding the claim."
    ]
  },
  {
    title: "12. Changes to These Terms",
    paragraphs: [
      "We reserve the right to update these Terms at any time. Material changes will be communicated via email or a notice on the Platform. Continued use of the Platform after any update constitutes acceptance of the revised Terms."
    ]
  },
  {
    title: "13. Governing Law",
    paragraphs: [
      "These Terms are governed by the laws of the Commonwealth of Pennsylvania. Any disputes shall be subject to the exclusive jurisdiction of the courts of the Commonwealth of Pennsylvania."
    ]
  }
];

export default function TermsOfServicePage() {
  return (
    <main className="shell py-10">
      <div className="mx-auto mb-4 flex max-w-4xl">
        <BackButton />
      </div>
      <Card className="mx-auto max-w-4xl p-0">
        <div className="border-b border-border px-6 py-7 sm:px-8">
          <p className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Legal</p>
          <h1 className="mt-3 text-3xl font-semibold tracking-normal">Terms of Service</h1>
          <div className="mt-5 grid gap-2 text-sm leading-6 text-muted-foreground sm:grid-cols-2">
            <p>
              <span className="font-semibold text-foreground">Effective Date:</span> June 26, 2026
            </p>
            <p>
              <span className="font-semibold text-foreground">Company:</span> Aftercare Compass LLC
            </p>
            <p>
              <span className="font-semibold text-foreground">Website:</span>{" "}
              <a className="font-medium text-foreground underline-offset-4 hover:underline" href="https://www.aftercarecompass.com">
                www.aftercarecompass.com
              </a>
            </p>
            <p>
              <span className="font-semibold text-foreground">Email:</span>{" "}
              <a className="font-medium text-foreground underline-offset-4 hover:underline" href="mailto:admin@aftercarecompass.com">
                admin@aftercarecompass.com
              </a>
            </p>
          </div>
        </div>

        <div className="space-y-8 px-6 py-7 sm:px-8">
          {termsSections.map((section) => (
            <section className="scroll-mt-8" key={section.title}>
              <h2 className="text-xl font-semibold tracking-normal text-foreground">{section.title}</h2>
              <div className="mt-3 space-y-3 text-sm leading-7 text-muted-foreground">
                {section.paragraphs.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
                {section.bullets ? (
                  <ul className="ml-5 list-disc space-y-2 marker:text-foreground">
                    {section.bullets.map((bullet) => (
                      <li className="pl-1" key={bullet}>
                        {bullet}
                      </li>
                    ))}
                  </ul>
                ) : null}
                {section.title === "4. Acceptable Use" ? (
                  <p>Aftercare Compass reserves the right to suspend or terminate any account that violates these Terms.</p>
                ) : null}
              </div>
            </section>
          ))}

          <section className="rounded-lg border border-border bg-muted/40 p-5">
            <h2 className="text-xl font-semibold tracking-normal text-foreground">14. Contact</h2>
            <div className="mt-3 space-y-2 text-sm leading-7 text-muted-foreground">
              <p>For questions about these Terms:</p>
              <p className="font-medium text-foreground">Aftercare Compass LLC</p>
              <p>
                Email:{" "}
                <a className="font-medium text-foreground underline-offset-4 hover:underline" href="mailto:admin@aftercarecompass.com">
                  admin@aftercarecompass.com
                </a>
              </p>
              <p>
                Website:{" "}
                <a className="font-medium text-foreground underline-offset-4 hover:underline" href="https://www.aftercarecompass.com">
                  www.aftercarecompass.com
                </a>
              </p>
            </div>
          </section>

          <p className="border-t border-border pt-5 text-sm text-muted-foreground">
            © 2026 Aftercare Compass LLC. All rights reserved.
          </p>
        </div>
      </Card>
    </main>
  );
}
