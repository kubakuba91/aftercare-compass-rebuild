import { SignIn } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Card } from "@/components/ui/card";
import { publicAppUrl } from "@/lib/app-urls";
import { hasValidClerkPublishableKey } from "@/lib/clerk-config";

export const dynamic = "force-dynamic";

export default async function SignInPage() {
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

  const { userId } = await auth();

  if (userId) {
    redirect("/auth/complete");
  }

  return (
    <main className="shell flex min-h-screen flex-col items-center justify-center gap-8 py-10">
      <Link
        aria-label="Return to the Aftercare Compass homepage"
        className="focus-ring inline-flex rounded-md"
        href={publicAppUrl("/")}
      >
        <Image
          alt=""
          className="h-auto w-64 max-w-[75vw]"
          height={75}
          priority
          sizes="256px"
          src="/brand/logo-aftercare.png"
          width={260}
        />
      </Link>
      <SignIn
        routing="path"
        path="/sign-in"
        signUpUrl="/sign-up"
        forceRedirectUrl="/auth/complete"
        fallbackRedirectUrl="/auth/complete"
      />
    </main>
  );
}
