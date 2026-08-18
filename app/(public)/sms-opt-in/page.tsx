import { headers } from "next/headers";
import Image from "next/image";
import Link from "next/link";
import { CircleCheckBig, MessageSquareText, ShieldCheck } from "lucide-react";
import { BackLink } from "@/components/public/back-link";
import { publicAppUrl } from "@/lib/app-urls";
import { safeSmsReturnDestination } from "@/lib/sms-consent";
import { submitSmsOptIn } from "./actions";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "SMS Updates | Aftercare Compass",
  description: "Opt in to referral status, screening, and scheduling updates from Aftercare Compass."
};

export default async function SmsOptInPage({
  searchParams
}: {
  searchParams: Promise<{ message?: string; returnTo?: string; success?: string }>;
}) {
  const [query, requestHeaders] = await Promise.all([searchParams, headers()]);
  const returnTo = safeSmsReturnDestination(query.returnTo || requestHeaders.get("referer"));

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(20,184,166,0.13),transparent_36%),radial-gradient(circle_at_bottom_right,rgba(30,64,175,0.14),transparent_40%)] px-4 py-10 sm:py-16">
      <div className="mx-auto w-full max-w-2xl">
        <BackLink href={returnTo} surface="page">
          Back
        </BackLink>

        <section className="ac-card mt-4 overflow-hidden p-0 shadow-xl" aria-labelledby="sms-opt-in-heading">
          <div className="border-b border-border bg-white px-6 py-7 sm:px-9">
            <Link
              aria-label="Return to the Aftercare Compass homepage"
              className="focus-ring inline-flex rounded-md"
              href={publicAppUrl("/")}
            >
              <Image
                alt=""
                className="h-auto w-52"
                height={60}
                priority
                sizes="208px"
                src="/brand/logo-aftercare.png"
                width={220}
              />
            </Link>
            <div className="mt-7 flex items-start gap-4">
              <span className="inline-flex size-12 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                <MessageSquareText aria-hidden="true" size={25} />
              </span>
              <div>
                <p className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Text notifications</p>
                <h1 id="sms-opt-in-heading" className="mt-1 text-3xl font-semibold tracking-normal">
                  Stay informed by SMS
                </h1>
              </div>
            </div>
            <p className="mt-5 text-base leading-7 text-muted-foreground">
              Aftercare Compass sends SMS updates about referral status and scheduling to participating providers and case managers.
            </p>
          </div>

          {query.success === "1" ? (
            <div className="grid gap-6 bg-white px-6 py-9 text-center sm:px-9 sm:py-12" role="status">
              <span className="mx-auto inline-flex size-16 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                <CircleCheckBig aria-hidden="true" size={36} strokeWidth={2.25} />
              </span>
              <p className="mx-auto max-w-lg text-lg leading-8 text-muted-foreground">
                <strong className="font-semibold text-foreground">You&apos;re all set!</strong> You&apos;ll receive SMS updates from
                Aftercare Compass about referral status, screening, and scheduling. Reply STOP at any time to unsubscribe.
              </p>
              <Link
                className="focus-ring ac-button ac-button--primary mx-auto w-full max-w-sm justify-center rounded-xl text-base shadow-sm"
                href={returnTo}
              >
                Continue
              </Link>
            </div>
          ) : (
          <form action={submitSmsOptIn} className="grid gap-6 bg-white px-6 py-7 sm:px-9 sm:py-9">
            <input name="returnTo" type="hidden" value={returnTo} />
            <label className="absolute -left-[10000px] top-auto size-px overflow-hidden" aria-hidden="true">
              Company website
              <input autoComplete="off" name="companyWebsite" tabIndex={-1} />
            </label>

            {query.message ? (
              <p className="ac-callout p-3 text-sm font-semibold text-foreground" role="alert">
                {query.message}
              </p>
            ) : null}

            <label className="grid gap-2 text-sm font-semibold" htmlFor="sms-phone">
              Mobile phone number
              <input
                autoComplete="tel"
                className="min-h-14 px-4 text-base"
                id="sms-phone"
                inputMode="tel"
                name="phone"
                placeholder="(555) 555-1234"
                required
                type="tel"
              />
            </label>

            <div className="flex items-start gap-3 rounded-xl border border-border bg-surface-secondary p-4 text-sm">
              <input
                className="mt-1 size-5 shrink-0"
                id="sms-consent"
                name="smsConsent"
                required
                type="checkbox"
                value="yes"
              />
              <p className="leading-6">
                <label className="cursor-pointer" htmlFor="sms-consent">
                  I agree to receive SMS messages from Aftercare Compass regarding referral status, screening, and scheduling. Message
                  frequency varies. Msg &amp; data rates may apply. Reply STOP to unsubscribe, HELP for help. See our{" "}
                </label>
                <Link className="font-semibold text-primary underline underline-offset-4" href={publicAppUrl("/terms-of-service")}>
                Terms of Service
                </Link>{" "}
                and{" "}
                <Link className="font-semibold text-primary underline underline-offset-4" href={publicAppUrl("/privacy-policy")}>
                Privacy Policy
                </Link>
                .
              </p>
            </div>

            <button className="focus-ring ac-button ac-button--primary w-full justify-center rounded-xl text-base shadow-sm">
              Agree and enable SMS updates
            </button>

            <p className="flex items-start gap-2 text-xs leading-5 text-muted-foreground">
              <ShieldCheck aria-hidden="true" className="mt-0.5 shrink-0" size={16} />
              Your consent is recorded securely. We&apos;ll send a confirmation text after you submit.
            </p>
          </form>
          )}
        </section>
      </div>
    </main>
  );
}
