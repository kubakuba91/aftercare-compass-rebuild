import { auth } from "@clerk/nextjs/server";
import { ProfileType } from "@prisma/client";
import { HeroSearchForm } from "@/components/public/hero-search-form";
import Image from "next/image";
import { MarketingHeader } from "@/components/marketing-header";
import { TrendingHomes } from "@/components/public/trending-homes";
import { Card } from "@/components/ui/card";
import { hasValidClerkRuntimeConfig } from "@/lib/clerk-config";
import { hasDatabaseConfig } from "@/lib/database-status";
import { canUseLiveAvailability } from "@/lib/feature-gates";
import { profilePlaceholderAlt, profilePlaceholderImage } from "@/lib/public-profile-placeholder";
import { prisma } from "@/lib/prisma";
import { redirectToDashboardDestination } from "@/lib/protected-routing";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const userId = hasValidClerkRuntimeConfig() ? (await auth()).userId : null;

  if (userId) {
    await redirectToDashboardDestination();
  }

  const trendingProfiles = hasDatabaseConfig() ? await prisma.aftercareProfile.findMany({
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
          trialEndsAt: true, subscriptionPlan: true,
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
  }) : [];

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
    <>
      <MarketingHeader />
      <main>
      <section className="border-b border-border bg-white">
        <div className="shell py-5">
          <div className="relative min-h-[500px] overflow-hidden rounded-lg border border-border">
            <Image
              alt=""
              aria-hidden="true"
              className="object-cover object-[65%_center]"
              fill
              priority
              src="/images/aftercare-community-hero.webp"
              sizes="100vw"
            />
            <div className="ac-hero-overlay absolute inset-0" aria-hidden="true" />

            <div className="relative max-w-5xl px-6 py-14 md:px-20 md:py-16">
              <h1 className="text-4xl font-semibold leading-tight tracking-normal text-white md:text-6xl">
                <span className="block">Close the gap.</span>
                <span className="block">Change the outcome.</span>
              </h1>
              <p className="mt-4 max-w-4xl text-lg leading-8 text-white">
                Find real-time availability for sober living and continued care programs—in minutes, not hours.
              </p>

              <HeroSearchForm />
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
    </>
  );
}
