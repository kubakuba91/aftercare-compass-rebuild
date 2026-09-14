import { SignUp } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";
import Link from "next/link";
import { redirect } from "next/navigation";
import { publicAppUrl } from "@/lib/app-urls";
import { Card } from "@/components/ui/card";
import { hasValidClerkPublishableKey } from "@/lib/clerk-config";

import { claimReturnPath } from "@/lib/claim-return-path";

export const dynamic = "force-dynamic";

export default async function SignUpPage({ searchParams }: {
  searchParams: Promise<{ redirect_url?: string | string[] }>;
}) {
  const returnPath = claimReturnPath((await searchParams).redirect_url);
  const destination = returnPath ? publicAppUrl(returnPath) : "/auth/complete";
  if (!hasValidClerkPublishableKey()) {
    return (
      <main className="shell flex min-h-screen items-center justify-center py-10">
        <Card className="max-w-md">
          <h1 className="text-2xl font-semibold">Clerk setup needed</h1>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            Add Clerk environment variables before using sign up.
          </p>
          <Link className="mt-5 inline-flex text-sm font-semibold text-primary" href="/setup">
            View setup
          </Link>
        </Card>
      </main>
    );
  }

  const { userId } = await auth();

  if (userId) {
    redirect(destination);
  }

  return (
    <main className="shell flex min-h-screen items-center justify-center py-10">
      <SignUp
        routing="path"
        path="/sign-up"
        signInUrl={returnPath ? `/sign-in?redirect_url=${encodeURIComponent(returnPath)}` : "/sign-in"}
        forceRedirectUrl={destination}
        fallbackRedirectUrl={destination}
      />
    </main>
  );
}
