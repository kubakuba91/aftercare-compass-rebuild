import { BackButton } from "@/components/public/back-button";
import { Card } from "@/components/ui/card";

export const dynamic = "force-dynamic";

type PolicySection = {
  title: string;
  paragraphs: string[];
  bullets?: string[];
};

const policySections: PolicySection[] = [
  {
    title: "1. Introduction",
    paragraphs: [
      "Aftercare Compass LLC ('we,' 'our,' or 'us') is committed to protecting your privacy. This Privacy Policy explains what information we collect, how we use it, and your rights with respect to it. It applies to all users of the Aftercare Compass platform at www.aftercarecompass.com."
    ]
  },
  {
    title: "2. Information We Collect",
    paragraphs: [
      "We collect information you provide directly, including:",
      "We also collect information automatically when you use the Platform, including IP address, browser type, device identifiers, and usage data through standard web technologies."
    ],
    bullets: [
      "Name, email address, phone number, organization name, and role when you create an account",
      "Organization details such as address, contact information, and licensing information submitted during onboarding",
      "Profile content including program descriptions, availability, pricing, services, and images submitted by providers",
      "Referral submissions provided by referent organizations",
      "Messages and support inquiries you send to us"
    ]
  },
  {
    title: "3. How We Use Your Information",
    paragraphs: ["We use the information we collect to:"],
    bullets: [
      "Create and manage your account and provide Platform services",
      "Facilitate marketplace search, referrals, and placement coordination",
      "Send notifications related to your account and platform activity",
      "Process subscriptions and billing",
      "Improve Platform performance and user experience",
      "Detect and prevent fraud and security incidents",
      "Comply with legal obligations"
    ]
  },
  {
    title: "4. How We Share Your Information",
    paragraphs: [
      "We do not sell, rent, or share your personally identifiable information with third parties for marketing purposes. We share information only with service providers who help us operate the Platform, and only to the extent necessary for them to do so. All service providers are bound by confidentiality obligations.",
      "We may also disclose information when required by law, to protect the safety of users or the public, or in connection with a merger or acquisition, with advance notice to affected users."
    ]
  },
  {
    title: "5. Mobile Numbers and SMS Communications",
    paragraphs: [
      "By providing your mobile phone number and opting in to SMS notifications, you consent to receive text messages from Aftercare Compass related to your account activity, referrals, availability updates, and platform events.",
      "Your mobile phone number will never be shared with third parties for marketing or promotional purposes. Mobile opt-in data and consent are not shared with any third party under any circumstances.",
      "You may opt out of SMS at any time by replying STOP to any message. Reply HELP for assistance. You may also opt out by contacting admin@aftercarecompass.com.",
      "Message frequency varies based on your account activity. Message and data rates may apply."
    ]
  },
  {
    title: "6. Email Communications",
    paragraphs: [
      "By opting in, you consent to receive email notifications from Aftercare Compass related to your account and platform activity. You may opt out of non-essential email at any time by using the unsubscribe link in any message or by contacting admin@aftercarecompass.com."
    ]
  },
  {
    title: "7. Location and Address Privacy",
    paragraphs: [
      "Exact provider addresses are never displayed to public visitors or referent organizations. Public-facing pages and maps show city and state level location information only."
    ]
  },
  {
    title: "8. Data Retention",
    paragraphs: [
      "We retain your information for as long as your account is active or as needed to provide services, meet legal obligations, and resolve disputes. You may request deletion of your account and associated data at any time, subject to legal retention requirements."
    ]
  },
  {
    title: "9. Data Security",
    paragraphs: [
      "We use industry-standard security measures to protect your information, including encrypted data transmission and access controls. Payment card data is processed exclusively by our billing provider under PCI-DSS compliance standards and is never stored by Aftercare Compass. No method of internet transmission is completely secure, and we cannot guarantee absolute security."
    ]
  },
  {
    title: "10. Your Rights",
    paragraphs: [
      "You have the right to access, correct, or request deletion of your personal information at any time. To exercise these rights, contact us at admin@aftercarecompass.com."
    ]
  },
  {
    title: "11. Cookies",
    paragraphs: [
      "We use cookies to maintain session state and analyze Platform usage. You may disable cookies in your browser settings, though some Platform features may not function properly as a result."
    ]
  },
  {
    title: "12. Children's Privacy",
    paragraphs: [
      "The Platform is not intended for individuals under the age of 18. We do not knowingly collect information from minors."
    ]
  },
  {
    title: "13. Changes to This Policy",
    paragraphs: [
      "We may update this Privacy Policy from time to time. Material changes will be communicated via email or a notice on the Platform. Continued use of the Platform after any update constitutes acceptance of the revised Policy."
    ]
  }
];

export default function PrivacyPolicyPage() {
  return (
    <main className="shell py-10">
      <div className="mx-auto mb-4 flex max-w-4xl">
        <BackButton />
      </div>
      <Card className="mx-auto max-w-4xl p-0">
        <div className="border-b border-border px-6 py-7 sm:px-8">
          <p className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Legal</p>
          <h1 className="mt-3 text-3xl font-semibold tracking-normal">Privacy Policy</h1>
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
          {policySections.map((section) => (
            <section className="scroll-mt-8" key={section.title}>
              <h2 className="text-xl font-semibold tracking-normal text-foreground">{section.title}</h2>
              <div className="mt-3 space-y-3 text-sm leading-7 text-muted-foreground">
                {section.paragraphs.slice(0, 1).map((paragraph) => (
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
                {section.paragraphs.slice(1).map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
              </div>
            </section>
          ))}

          <section className="rounded-lg border border-border bg-muted/40 p-5">
            <h2 className="text-xl font-semibold tracking-normal text-foreground">14. Contact Us</h2>
            <div className="mt-3 space-y-2 text-sm leading-7 text-muted-foreground">
              <p>For questions or data requests related to this Privacy Policy:</p>
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
