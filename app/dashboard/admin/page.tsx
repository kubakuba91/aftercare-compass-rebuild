import { Flag, ShieldCheck, Users } from "lucide-react";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

export const dynamic = "force-dynamic";

export default function AdminDashboardPage() {
  return (
    <main className="shell py-8">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
        <div>
          <Badge tone="verified">System admin</Badge>
          <h1 className="mt-3 text-3xl font-semibold">Marketplace controls</h1>
        </div>
        <SignOutButton />
      </div>
      <div className="mt-6 grid gap-4 md:grid-cols-3">
        <Card>
          <ShieldCheck className="text-primary" size={24} />
          <h2 className="mt-3 font-semibold">Verification queue</h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Review private provider documents and update trust tier status.
          </p>
        </Card>
        <Card>
          <Flag className="text-primary" size={24} />
          <h2 className="mt-3 font-semibold">Flags</h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Investigate reports for misrepresentation, licensing, brokering, or patient safety issues.
          </p>
        </Card>
        <Card>
          <Users className="text-primary" size={24} />
          <h2 className="mt-3 font-semibold">Users and subscriptions</h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Support orgs, inspect billing status, and enforce account access.
          </p>
        </Card>
      </div>
    </main>
  );
}
