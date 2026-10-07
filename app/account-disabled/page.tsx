import { SignOutButton } from "@/components/auth/sign-out-button";
import { Card } from "@/components/ui/card";

export default function AccountDisabledPage() {
  return <main className="shell py-16"><Card className="mx-auto max-w-lg"><h1 className="text-2xl font-semibold">Your account is inactive</h1><p className="mb-6 mt-3 leading-7 text-muted-foreground">Your signed-in access has been deactivated. Contact your organization or the Aftercare Compass team if you need help restoring access.</p><SignOutButton /></Card></main>;
}
