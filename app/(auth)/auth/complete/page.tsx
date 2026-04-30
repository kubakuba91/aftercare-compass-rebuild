import { redirect } from "next/navigation";
import { Card } from "@/components/ui/card";
import { getAuthenticatedLandingPath } from "@/lib/protected-routing";

export const dynamic = "force-dynamic";

function isRedirectError(error: unknown) {
  return (
    error instanceof Error &&
    (error.message === "NEXT_REDIRECT" ||
      ("digest" in error && String(error.digest).startsWith("NEXT_REDIRECT")))
  );
}

export default async function AuthCompletePage() {
  try {
    redirect(await getAuthenticatedLandingPath());
  } catch (error) {
    if (isRedirectError(error)) {
      throw error;
    }

    console.error("Auth completion failed", error);

    return (
      <main className="shell flex min-h-screen items-center justify-center py-10">
        <Card className="max-w-md">
          <h1 className="text-2xl font-semibold">Account setup needs attention</h1>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            Your sign-in worked, but we could not load the account setup step. Please check the
            deployment settings before continuing.
          </p>
          <a className="mt-5 inline-flex text-sm font-semibold text-primary" href="/setup">
            View setup
          </a>
        </Card>
      </main>
    );
  }
}
