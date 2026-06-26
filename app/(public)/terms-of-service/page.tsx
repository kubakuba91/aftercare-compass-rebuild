import { Card } from "@/components/ui/card";

export const dynamic = "force-dynamic";

export default function TermsOfServicePage() {
  return (
    <main className="shell py-10">
      <Card className="mx-auto max-w-4xl">
        <p className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Legal</p>
        <h1 className="mt-3 text-3xl font-semibold">Terms of Service</h1>
        <p className="mt-4 text-sm leading-6 text-muted-foreground">
          Terms of Service content coming soon.
        </p>
      </Card>
    </main>
  );
}
