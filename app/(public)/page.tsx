import { auth } from "@clerk/nextjs/server";
import { Building2, Search, ShieldCheck } from "lucide-react";
import { redirect } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button-link";
import { Card } from "@/components/ui/card";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const { userId } = await auth();

  if (userId) {
    redirect("/auth/complete");
  }

  return (
    <main>
      <section className="relative overflow-hidden border-b border-border bg-white">
        <div className="absolute inset-0 bg-muted/40" aria-hidden="true">
          <div className="shell h-full py-8">
            <div className="flex h-full min-h-[560px] items-center justify-center rounded-lg border border-dashed border-border bg-white/70 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Image background placeholder
            </div>
          </div>
        </div>

        <div className="shell relative py-8">
          <div className="flex items-center justify-between gap-4">
            <div className="text-lg font-semibold text-foreground">Aftercare Compass</div>
            <ButtonLink href="/sign-in" variant="secondary">
              Join or Login
            </ButtonLink>
          </div>

          <div className="max-w-3xl py-20 md:py-28">
            <Badge tone="verified">Aftercare marketplace</Badge>
            <h1 className="mt-5 text-4xl font-semibold leading-tight tracking-normal text-foreground md:text-6xl">
              Navigate Recovery Together
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-muted-foreground">
              Find sober living homes and continued care programs with referral-ready
              availability, privacy-safe profiles, and simple next steps for connection.
            </p>

            <form
              action="/search"
              className="mt-8 grid gap-3 rounded-lg border border-border bg-white p-3 shadow-sm lg:grid-cols-[auto_1fr_auto]"
            >
              <div className="grid rounded-md border border-border p-1 sm:grid-cols-2">
                <label className="cursor-pointer rounded px-4 py-3 text-sm font-semibold has-[:checked]:bg-primary has-[:checked]:text-primary-foreground">
                  <input
                    className="sr-only"
                    type="radio"
                    name="type"
                    value="sober_living"
                    defaultChecked
                  />
                  Sober Living
                </label>
                <label className="cursor-pointer rounded px-4 py-3 text-sm font-semibold has-[:checked]:bg-primary has-[:checked]:text-primary-foreground">
                  <input className="sr-only" type="radio" name="type" value="continued_care" />
                  Continued Care
                </label>
              </div>

              <label className="flex min-h-12 items-center gap-3 rounded-md border border-border bg-white px-4">
                <span className="sr-only">Search by city, state, or program name</span>
                <input
                  name="q"
                  className="min-w-0 flex-1 bg-transparent text-sm outline-none"
                  placeholder="City, state, or program name"
                />
                <Search className="shrink-0 text-primary" size={22} />
              </label>

              <button
                type="submit"
                className="focus-ring min-h-12 rounded-md bg-primary px-6 text-sm font-semibold text-primary-foreground"
              >
                Search
              </button>
            </form>

            <div className="mt-6 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
              <span>Explore trusted aftercare options by location, population served, and fit.</span>
              <ButtonLink href="/sign-up" variant="secondary">
                Create account
              </ButtonLink>
            </div>
          </div>
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
