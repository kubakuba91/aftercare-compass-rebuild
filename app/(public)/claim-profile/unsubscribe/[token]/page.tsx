import Link from "next/link";
import { notFound } from "next/navigation";
import { Card } from "@/components/ui/card";
import { findClaimOutreachByToken } from "@/lib/profile-claim-outreach";
import { unsubscribeClaimOutreach } from "./actions";

export const dynamic = "force-dynamic";

export default async function ClaimOutreachUnsubscribePage({
  params,
  searchParams
}: {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ done?: string }>;
}) {
  const [{ token }, query] = await Promise.all([params, searchParams]);
  const outreach = await findClaimOutreachByToken(token);
  if (!outreach) notFound();

  return (
    <main className="shell flex min-h-screen items-center justify-center py-10">
      <Card className="max-w-lg">
        <h1 className="text-2xl font-semibold">Profile invitation emails</h1>
        {query.done || outreach.unsubscribedAt ? (
          <>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              {outreach.recipientEmail} will no longer receive profile-claim invitations from Aftercare Compass.
            </p>
            <Link className="mt-5 inline-flex font-semibold text-primary" href={`/profiles/${outreach.profile.slug}`}>
              Return to the public profile
            </Link>
          </>
        ) : (
          <>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              Stop profile-claim invitations to {outreach.recipientEmail}. This suppression is permanent unless an administrator removes it after receiving a direct request.
            </p>
            <form action={unsubscribeClaimOutreach} className="mt-5">
              <input name="token" type="hidden" value={token} />
              <button className="min-h-11 rounded-md bg-primary px-5 text-sm font-semibold text-primary-foreground" type="submit">
                Unsubscribe
              </button>
            </form>
          </>
        )}
      </Card>
    </main>
  );
}
