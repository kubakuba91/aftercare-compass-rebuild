import { SignUp } from "@clerk/nextjs";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { hasValidClerkPublishableKey } from "@/lib/clerk-config";

export default function SignUpPage() {
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
        forceRedirectUrl="/onboarding/account-type"
      />
    </main>
  );
}
