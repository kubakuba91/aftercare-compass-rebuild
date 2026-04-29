import { SignIn } from "@clerk/nextjs";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { hasValidClerkPublishableKey } from "@/lib/clerk-config";

export const dynamic = "force-dynamic";

export default async function SignInPage({
  searchParams
}: {
  searchParams: Promise<{ reason?: string }>;
}) {
  const params = await searchParams;

  if (!hasValidClerkPublishableKey()) {
    return (
      <main className="shell flex min-h-screen items-center justify-center py-10">
        <Card className="max-w-md">
          <h1 className="text-2xl font-semibold">Clerk setup needed</h1>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            Add Clerk environment variables before using sign in.
          </p>
          <Link className="mt-5 inline-flex text-sm font-semibold text-primary" href="/setup">
            View setup
          </Link>
        </Card>
      </main>
    );
  }

  return (
    <main className="shell flex min-h-screen flex-col items-center justify-center gap-4 py-10">
      {params.reason === "session_timeout" ? (
        <Card className="max-w-md">
          <h1 className="text-2xl font-semibold">Session timed out</h1>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            Please sign back in to continue onboarding.
          </p>
        </Card>
      ) : null}
      <SignIn routing="path" path="/sign-in" signUpUrl="/sign-up" fallbackRedirectUrl="/dashboard" />
    </main>
  );
}
