import Link from "next/link";
import { SignOutButton } from "@/components/auth/sign-out-button";

export default function InvitationConflictPage() {
  return <main className="shell py-10">
    <h1 className="text-3xl font-semibold">We need to confirm your organization</h1>
    <p className="mt-4 max-w-xl">This email has conflicting account or invitation records. Each account can belong to only one organization. Contact support to resolve the invitations or transfer access.</p>
    <div className="mt-6 flex gap-3"><Link className="focus-ring ac-button ac-button--primary" href="/contact">Contact support</Link><SignOutButton /></div>
  </main>;
}
