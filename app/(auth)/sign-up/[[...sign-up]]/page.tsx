import { SignUp } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Card } from "@/components/ui/card";
import { hasValidClerkPublishableKey } from "@/lib/clerk-config";

export const dynamic = "force-dynamic";

export default async function SignUpPage() {
  const { userId } = await auth();

  if (userId) {
    redirect("/auth/complete");
  }

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

  return (
    <main className="shell flex min-h-screen items-center justify-center py-10">
      <SignUp
        routing="path"
        path="/sign-up"
        signInUrl="/sign-in"
        forceRedirectUrl="/auth/complete"
        fallbackRedirectUrl="/auth/complete"
      />
    </main>
  );
}
