import Link from "next/link";
import { dashboardAppUrl, publicAppUrl } from "@/lib/app-urls";

export function SmsConsentCard({
  action,
  smsOptIn,
  message,
  description = "Receive account-related text messages from Aftercare Compass for prompts to update availability within your account dashboard, new referral activity, placement acceptance, and changes to account settings. Only active account holders will receive these messages.",
  returnToPath
}: {
  action: (formData: FormData) => void | Promise<void>;
  smsOptIn?: boolean;
  message?: string | null;
  description?: string;
  returnToPath: string;
}) {
  if (smsOptIn) {
    return (
      <div className="ac-panel-card mt-6 p-4">
        <p className="text-sm font-semibold">Text notifications enabled.</p>
        <form action={action} className="mt-4">
          <input name="intent" type="hidden" value="optOut" />
          <button className="focus-ring min-h-10 rounded-md border border-border bg-white px-4 text-sm font-semibold text-destructive">
            Stop text notifications
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="ac-panel-card mt-6 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="font-semibold">Text message notifications</h3>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
            {description}
          </p>
        </div>
        <span className="rounded-full border border-border bg-surface-secondary px-3 py-1 text-xs font-semibold text-muted-foreground">
          Not enabled
        </span>
      </div>

      {message ? (
        <p className="ac-callout mt-4 p-3 text-sm font-semibold text-foreground">
          {message}
        </p>
      ) : null}

      <div className="mt-4 flex flex-wrap gap-2">
        <Link
          className="focus-ring inline-flex min-h-10 items-center justify-center rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground"
          href={publicAppUrl(`/sms-opt-in?returnTo=${encodeURIComponent(dashboardAppUrl(returnToPath))}`)}
        >
          Set up text notifications
        </Link>
      </div>
    </div>
  );
}
