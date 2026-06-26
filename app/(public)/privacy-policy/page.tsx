import { Card } from "@/components/ui/card";

export const dynamic = "force-dynamic";

export default function PrivacyPolicyPage() {
  return (
    <main className="shell py-10">
      <Card className="mx-auto max-w-4xl">
        <p className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Legal</p>
        <h1 className="mt-3 text-3xl font-semibold">Privacy Policy</h1>
        <p className="mt-4 text-sm leading-6 text-muted-foreground">
          Privacy Policy content coming soon.
        </p>
      </Card>
    </main>
  );
}
