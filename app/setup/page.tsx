import { KeyRound } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { clerkEnvRequirements } from "@/lib/clerk-config";

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
          <h2 className="font-semibold">Check these in Vercel Project Settings</h2>
          <ul className="mt-3 grid gap-3 text-sm text-muted-foreground">
            {clerkEnvRequirements.map((item) => (
              <li key={item.key} className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                <span>
                  <code>{item.key}</code>
                  <span className="ml-2">{item.valueHint}</span>
                </span>
                <Badge tone={item.valid ? "success" : "warning"}>
                  {item.valid ? "Detected" : "Missing or invalid"}
                </Badge>
              </li>
            ))}
          </ul>
        </div>
      </Card>
    </main>
  );
}
