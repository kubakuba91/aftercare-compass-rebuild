import { KeyRound } from "lucide-react";
import { Card } from "@/components/ui/card";

const requiredVercelEnv = [
  "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY",
  "CLERK_SECRET_KEY",
  "NEXT_PUBLIC_APP_URL"
];

export default function SetupPage() {
  return (
    <main className="shell py-10">
      <Card className="max-w-3xl">
        <KeyRound className="text-primary" size={28} />
        <h1 className="mt-4 text-3xl font-semibold">Deployment setup needed</h1>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          Public pages can render without authentication configured, but onboarding and dashboards
          require Clerk environment variables in Vercel.
        </p>
        <div className="mt-6 rounded-md border border-border bg-muted/60 p-4">
          <h2 className="font-semibold">Add these in Vercel Project Settings</h2>
          <ul className="mt-3 grid gap-2 text-sm text-muted-foreground">
            {requiredVercelEnv.map((name) => (
              <li key={name}>
                <code>{name}</code>
              </li>
            ))}
          </ul>
        </div>
      </Card>
    </main>
  );
}

