import { auth } from "@clerk/nextjs/server";
import { Search } from "lucide-react";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button-link";
import { Card } from "@/components/ui/card";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const { userId } = await auth();

  return (
    <main>
      <section className="border-b border-border bg-white">
        <div className="shell py-5">
          <div className="flex items-center justify-between gap-4">
            <Image
              alt="Aftercare Compass"
              className="h-12 w-auto object-contain sm:h-14"
              height={80}
              src="/brand/logo-aftercare.png"
              width={280}
            />
            <ButtonLink href={userId ? "/auth/complete" : "/sign-in"} variant="secondary">
              {userId ? "Dashboard" : "Join or Login"}
            </ButtonLink>
          </div>

          <div className="relative mt-5 min-h-[560px] overflow-hidden rounded-lg border border-border">
            <Image
              alt=""
              aria-hidden="true"
              className="object-cover"
              fill
              priority
              src="/images/hero-bg-opt.jpg"
              sizes="100vw"
            />
            <div className="absolute inset-0 bg-black/35" aria-hidden="true" />

            <div className="relative max-w-3xl px-6 py-20 md:px-20 md:py-28">
              <Badge tone="verified">Aftercare marketplace</Badge>
              <h1 className="mt-5 text-4xl font-semibold leading-tight tracking-normal text-white md:text-6xl">
                Navigate Recovery Together
              </h1>
              <p className="mt-5 max-w-2xl text-lg leading-8 text-white">
                Find sober living homes and continued care programs with referral-ready
                availability, privacy-safe profiles, and simple next steps for connection.
              </p>

              <form action="/search" className="mt-8 grid max-w-4xl gap-3">
                <div className="grid w-fit overflow-hidden rounded-md border border-[#12185f] bg-[#12185f] p-1 shadow-sm sm:grid-cols-2">
                  <label className="focus-within:ring-ring flex min-h-12 cursor-pointer items-center justify-center whitespace-nowrap rounded px-5 text-sm font-semibold text-white transition has-[:checked]:bg-white has-[:checked]:text-[#17212b] has-[:focus-visible]:ring-2 md:px-7">
                    <input
                      className="sr-only"
                      type="radio"
                      name="type"
                      value="sober_living"
                      defaultChecked
                    />
                    Sober Living
                  </label>
                  <label className="focus-within:ring-ring flex min-h-12 cursor-pointer items-center justify-center whitespace-nowrap rounded px-5 text-sm font-semibold text-white transition has-[:checked]:bg-white has-[:checked]:text-[#17212b] has-[:focus-visible]:ring-2 md:px-7">
                    <input className="sr-only" type="radio" name="type" value="continued_care" />
                    Continued Care
                  </label>
                </div>

                <div className="grid gap-3 md:grid-cols-[minmax(0,520px)_250px]">
                  <label className="focus-within:ring-ring flex min-h-16 items-center gap-3 rounded-2xl border border-border bg-white px-5 shadow-sm focus-within:ring-2">
                    <span className="sr-only">Search by city, state, or program name</span>
                    <Search className="shrink-0 text-primary" size={28} />
                    <input
                      name="q"
                      className="!min-h-0 min-w-0 flex-1 appearance-none !border-0 !bg-transparent !p-0 text-base font-medium !shadow-none outline-none placeholder:text-muted-foreground focus:!border-0 focus:!shadow-none focus:ring-0"
                      placeholder="City, state, or program name"
                    />
                  </label>

                  <button
                    type="submit"
                    className="focus-ring min-h-16 rounded-2xl bg-[#12185f] px-8 text-lg font-semibold text-white shadow-sm hover:bg-[#0d1249]"
                  >
                    Search
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </section>

      <section className="shell grid gap-4 py-10 md:grid-cols-3">
        <Card className="grid gap-4">
          <div className="relative mx-auto aspect-square w-full max-w-56">
            <Image
              alt="Illustration of searching aftercare listings"
              className="object-contain"
              fill
              src="/images/home-search-listings.jpg"
              sizes="224px"
            />
          </div>
          <div>
            <h2 className="text-xl font-semibold">Public discovery</h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Search profiles by location, availability, and fit.
            </p>
          </div>
        </Card>
        <Card className="grid gap-4">
          <div className="relative mx-auto aspect-square w-full max-w-56">
            <Image
              alt="Illustration of managing aftercare documents"
              className="object-contain"
              fill
              src="/images/home-manage-documents.jpg"
              sizes="224px"
            />
          </div>
          <div>
            <h2 className="text-xl font-semibold">Provider supply</h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Aftercare teams can publish profiles, manage documents, and update availability.
            </p>
          </div>
        </Card>
        <Card className="grid gap-4">
          <div className="relative mx-auto aspect-square w-full max-w-56">
            <Image
              alt="Illustration of referral-ready aftercare coordination"
              className="object-contain"
              fill
              src="/images/home-refer-ready.jpg"
              sizes="224px"
            />
          </div>
          <div>
            <h2 className="text-xl font-semibold">Referral-ready</h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Referents submit de-identified referrals, and aftercare teams manage the status lifecycle.
            </p>
          </div>
        </Card>
      </section>
    </main>
  );
}
