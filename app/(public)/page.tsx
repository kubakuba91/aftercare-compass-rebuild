import { auth } from "@clerk/nextjs/server";
import { ProfileType } from "@prisma/client";
import { Search } from "lucide-react";
import Image from "next/image";
import { TrendingHomes } from "@/components/public/trending-homes";
import { ButtonLink } from "@/components/ui/button-link";
import { Card } from "@/components/ui/card";
import { dashboardAppUrl } from "@/lib/app-urls";
import { canUseLiveAvailability } from "@/lib/feature-gates";
import { profilePlaceholderAlt, profilePlaceholderImage } from "@/lib/public-profile-placeholder";
import { prisma } from "@/lib/prisma";
import { redirectToDashboardDestination } from "@/lib/protected-routing";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const { userId } = await auth();

  if (userId) {
    await redirectToDashboardDestination();
  }

  const trendingProfiles = await prisma.aftercareProfile.findMany({
    where: {
      publicCity: { equals: "Lancaster", mode: "insensitive" },
      publicState: { equals: "PA", mode: "insensitive" },
      status: "published",
      type: ProfileType.sober_living
    },
    orderBy: [
      { favorites: { _count: "desc" } },
      { verificationTier: "desc" },
      { updatedAt: "desc" }
    ],
    take: 8,
    select: {
      id: true,
      slug: true,
      programName: true,
      type: true,
      publicCity: true,
      publicState: true,
      bedsAvailable: true,
      pricePerWeek: true,
      recoveryResidenceLevel: true,
      ownershipStatus: true,
      organization: {
        select: {
          subscriptionPlan: true,
          subscriptionStatus: true,
          type: true
        }
      },
      images: {
        orderBy: [{ isCover: "desc" }, { sortOrder: "asc" }, { createdAt: "asc" }],
        take: 1,
        select: {
          altText: true,
          focalX: true,
          focalY: true,
          presentationMode: true,
          url: true
        }
      }
    }
  });

  const trendingHomes = trendingProfiles.map((profile) => {
    const showLiveAvailability = canUseLiveAvailability(profile.organization, profile);
    const isAvailable = showLiveAvailability && Boolean(profile.bedsAvailable && profile.bedsAvailable > 0);

    return {
      id: profile.id,
      slug: profile.slug,
      programName: profile.programName,
      location: [profile.publicCity, profile.publicState].filter(Boolean).join(", "),
      photoUrl: profile.images[0]?.url ?? profilePlaceholderImage(profile.type),
      photoAlt: profile.images[0]?.altText || (profile.images[0] ? profile.programName : profilePlaceholderAlt(profile.type)),
      photoFocalX: profile.images[0]?.focalX ?? 50,
      photoFocalY: profile.images[0]?.focalY ?? 50,
      photoPresentationMode: profile.images[0]?.presentationMode ?? "photo",
      priceLabel: profile.pricePerWeek ? `$${profile.pricePerWeek.toLocaleString()}/week` : "Contact for pricing",
      availabilityLabel: isAvailable ? `${profile.bedsAvailable} bed${profile.bedsAvailable === 1 ? "" : "s"} available` : "Call for availability",
      isAvailable,
      recoveryResidenceLevel: profile.recoveryResidenceLevel
    };
  });

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
            <ButtonLink href={dashboardAppUrl("/sign-in")} variant="secondary">
              Join or Login
            </ButtonLink>
          </div>

          <div className="relative mt-5 min-h-[500px] overflow-hidden rounded-lg border border-border">
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

            <div className="relative max-w-5xl px-6 py-14 md:px-20 md:py-16">
              <h1 className="text-4xl font-semibold leading-tight tracking-normal text-white md:text-6xl">
                <span className="block">Close the gap.</span>
                <span className="block">Change the outcome.</span>
              </h1>
              <p className="mt-4 max-w-4xl text-lg leading-8 text-white">
                Finding the right next step for your client shouldn&apos;t take the whole day. Aftercare Compass connects your
                team with real-time availability across every level of aftercare — for the next chapter in their journey.
              </p>

              <form action="/search" className="mt-6 grid max-w-4xl gap-3">
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

                <div className="focus-within:ring-ring flex min-h-16 w-full max-w-[520px] items-center gap-3 rounded-2xl border border-border bg-white py-2 pl-5 pr-2 shadow-sm focus-within:ring-2">
                  <label className="sr-only" htmlFor="homepage-search">
                    Search by city, state, or program name
                  </label>
                  <input
                    id="homepage-search"
                    name="q"
                    className="!min-h-0 min-w-0 flex-1 appearance-none !border-0 !bg-transparent !p-0 text-base font-medium !shadow-none outline-none placeholder:text-muted-foreground focus:!border-0 focus:!shadow-none focus:ring-0"
                    placeholder="City, state, or program name"
                  />
                  <button
                    aria-label="Search"
                    className="focus-ring inline-flex size-11 shrink-0 items-center justify-center rounded-full text-primary hover:bg-muted"
                    type="submit"
                  >
                    <Search aria-hidden="true" size={28} />
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </section>

      <TrendingHomes homes={trendingHomes} />

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
