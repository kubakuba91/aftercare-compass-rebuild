import { SignIn } from "@clerk/nextjs";
import Link from "next/link";
import { Card } from "@/components/ui/card";

export default function SignInPage() {
  if (!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY) {
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
    <main className="shell flex min-h-screen items-center justify-center py-10">
      <SignIn routing="path" path="/sign-in" signUpUrl="/sign-up" />
    </main>
  );
}

