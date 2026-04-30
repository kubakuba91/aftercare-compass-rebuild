import { auth } from "@clerk/nextjs/server";
import { ArrowRight, Building2, Search, ShieldCheck } from "lucide-react";
import { redirect } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button-link";
import { Card } from "@/components/ui/card";

export const dynamic = "force-dynamic";

const supplySignals = [
  "Verification-ready provider profiles",
  "Sober Living bed availability",
  "Continued Care accepting-new-patients status",
  "Public lead capture without exposing exact addresses"
];

export default async function HomePage() {
  const { userId } = await auth();

  if (userId) {
    redirect("/auth/complete");
  }

  return (
    <main>
      <section className="border-b border-border bg-white">
        <div className="shell grid gap-10 py-14 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <div>
            <Badge tone="verified">Aftercare-first beta foundation</Badge>
            <h1 className="mt-5 max-w-3xl text-4xl font-semibold leading-tight tracking-normal text-foreground md:text-6xl">
              Aftercare Compass
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-muted-foreground">
              A referral-ready marketplace for sober living homes, continued care programs,
              and the organizations placing patients into safe aftercare.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <ButtonLink href="/search">Search programs</ButtonLink>
              <ButtonLink href="/sign-in" variant="secondary">
                Sign in
              </ButtonLink>
              <ButtonLink href="/sign-up" variant="secondary">
                Create account
              </ButtonLink>
            </div>
          </div>
          <Card className="grid gap-4">
            <div className="flex items-center gap-3">
              <div className="rounded-md bg-primary/10 p-2 text-primary">
                <ShieldCheck size={22} />
              </div>
              <div>
                <h2 className="text-lg font-semibold">Phase 1 build rules</h2>
                <p className="text-sm text-muted-foreground">Locked from the product blueprint.</p>
              </div>
            </div>
            <ul className="grid gap-3 text-sm text-muted-foreground">
              {supplySignals.map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <ArrowRight className="mt-0.5 shrink-0 text-accent" size={16} />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </section>

      <section className="shell grid gap-4 py-10 md:grid-cols-3">
        <Card>
          <Search className="text-primary" size={24} />
          <h2 className="mt-4 text-xl font-semibold">Public discovery</h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Search profiles by location and filters while showing only privacy-safe city/state data.
          </p>
        </Card>
        <Card>
          <Building2 className="text-primary" size={24} />
          <h2 className="mt-4 text-xl font-semibold">Provider supply</h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Aftercare teams can publish profiles, manage documents, and update availability.
          </p>
        </Card>
        <Card>
          <ShieldCheck className="text-primary" size={24} />
          <h2 className="mt-4 text-xl font-semibold">Referral-ready</h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Referents submit de-identified referrals, and aftercare teams manage the status lifecycle.
          </p>
        </Card>
      </section>
    </main>
  );
}
