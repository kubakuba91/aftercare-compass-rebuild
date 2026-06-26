import Link from "next/link";
import { formatPhoneForDisplay } from "@/lib/phone";

export function SmsConsentCard({
  action,
  phone,
  smsOptIn,
  message
}: {
  action: (formData: FormData) => void | Promise<void>;
  phone?: string | null;
  smsOptIn?: boolean;
  message?: string | null;
}) {
  return (
    <div className="ac-panel-card mt-6 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="font-semibold">Text message notifications</h3>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
            Receive account-related text messages from Aftercare Compass for prompts to update availability within your
            account dashboard, new referral activity, placement acceptance, and changes to account settings. Only active
            account holders will receive these messages.
          </p>
        </div>
        {smsOptIn ? (
          <span className="rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
            Enabled
          </span>
        ) : (
          <span className="rounded-full border border-border bg-surface-secondary px-3 py-1 text-xs font-semibold text-muted-foreground">
            Not enabled
          </span>
        )}
      </div>

      {message ? (
        <p className="ac-callout mt-4 p-3 text-sm font-semibold text-foreground">
          {message}
        </p>
      ) : null}

      {smsOptIn ? (
        <p className="mt-4 text-sm font-semibold">
          Text notifications are enabled for {formatPhoneForDisplay(phone)}.
        </p>
      ) : null}

      <form action={action} className="mt-4 grid gap-4">
        <input name="intent" type="hidden" value="optIn" />
        <label className="grid gap-2 text-sm font-medium">
          Mobile phone number
          <input
            className="min-h-10 rounded-md border border-border bg-white px-3 text-sm"
            defaultValue={phone ?? ""}
            inputMode="tel"
            name="phone"
            placeholder="(555) 555-1234"
            type="tel"
          />
        </label>

        <label className="flex items-start gap-3 rounded-md border border-border bg-surface-secondary p-3 text-sm">
          <input
            className="mt-1 size-4 shrink-0"
            name="smsConsent"
            required
            type="checkbox"
            value="yes"
          />
          <span className="leading-6">
            I agree to receive account-related text messages from Aftercare Compass at the mobile number provided.
            Message frequency varies. Message and data rates may apply. Reply HELP for help or STOP to cancel. I agree
            to the{" "}
            <Link className="font-semibold text-primary underline-offset-4 hover:underline" href="/terms-of-service">
              Terms of Service
            </Link>{" "}
            and{" "}
            <Link className="font-semibold text-primary underline-offset-4 hover:underline" href="/privacy-policy">
              Privacy Policy
            </Link>
            .
          </span>
        </label>

        <div className="flex flex-wrap gap-2">
          <button className="focus-ring min-h-10 rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground">
            Yes, I agree to be notified by text
          </button>
        </div>
      </form>

      {smsOptIn ? (
        <form action={action} className="mt-3">
          <input name="intent" type="hidden" value="optOut" />
          <button className="focus-ring min-h-10 rounded-md border border-border bg-white px-4 text-sm font-semibold text-destructive">
            Stop text notifications
          </button>
        </form>
      ) : null}
    </div>
  );
}
