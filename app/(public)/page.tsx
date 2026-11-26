import { auth } from "@clerk/nextjs/server";
import { headers } from "next/headers";
import { normalizePhoneNumber } from "@/lib/phone";
import { HomeAnswerSection } from "@/components/public/home-answer-section";
import { HeroSearchForm } from "@/components/public/hero-search-form";
import Image from "next/image";
import { MarketingHeader } from "@/components/marketing-header";
import { TrendingHomes } from "@/components/public/trending-homes";
import { ButtonLink } from "@/components/ui/button-link";
import { hasValidClerkRuntimeConfig } from "@/lib/clerk-config";
import { hasDatabaseConfig } from "@/lib/database-status";
import { homeJsonLd, homeMetadata } from "@/lib/home-seo";
import { popularProgramAvailability } from "@/lib/popular-program-availability";
import { profilePlaceholderAlt, profilePlaceholderImage } from "@/lib/public-profile-placeholder";
import { prisma } from "@/lib/prisma";
import { redirectToDashboardDestination } from "@/lib/protected-routing";

export const dynamic = "force-dynamic";

export const metadata = homeMetadata();

export default async function HomePage() {
  const userId = hasValidClerkRuntimeConfig() ? (await auth()).userId : null;

  if (userId) {
    await redirectToDashboardDestination();
  }

  const requestHeaders = await headers();
  function decodedHeader(name: string) {
    const value = requestHeaders.get(name);
    if (!value) return null;
    try { return decodeURIComponent(value).trim().slice(0, 100) || null; }
    catch { return null; }
  }
  const city = decodedHeader("x-vercel-ip-city");
  const state = decodedHeader("x-vercel-ip-country-region");
  const country = decodedHeader("x-vercel-ip-country");
  // Listings use US state codes; avoid matching a same-named city abroad.
  const detectedLocation = country === "US" && city && state ? { city, state } : null;

  async function popularProfiles(local: boolean) {
    return hasDatabaseConfig() ? prisma.aftercareProfile.findMany({
      where: {
        ...(local && detectedLocation ? {
          publicCity: { equals: detectedLocation.city, mode: "insensitive" as const },
          publicState: { equals: detectedLocation.state, mode: "insensitive" as const }
        } : {}),
        status: "published"
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
        admissionsContactPhone: true,
        type: true,
        publicCity: true,
        publicState: true,
        bedsAvailable: true,
        acceptingNewPatients: true,
        insuranceAccepted: true,
        matAccepted: true,
        matServicesOffered: true,
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
  }

  async function popularGroup() {
    const localProfiles = detectedLocation ? await popularProfiles(true) : [];
    const profiles = localProfiles.length ? localProfiles : await popularProfiles(false);
    const location = localProfiles.length && detectedLocation
      ? `${detectedLocation.city}, ${detectedLocation.state}` : null;
    const homes = profiles.map((profile) => {
      const availability = popularProgramAvailability(profile);

      return {
        id: profile.id,
        programType: profile.type,
        slug: profile.slug,
        programName: profile.programName,
        phone: normalizePhoneNumber(profile.admissionsContactPhone || ""),
        location: [profile.publicCity, profile.publicState].filter(Boolean).join(", "),
        photoUrl: profile.images[0]?.url ?? profilePlaceholderImage(profile.type),
        photoAlt: profile.images[0]?.altText || (profile.images[0] ? profile.programName : profilePlaceholderAlt(profile.type)),
        photoFocalX: profile.images[0]?.focalX ?? 50,
        photoFocalY: profile.images[0]?.focalY ?? 50,
        photoPresentationMode: profile.images[0]?.presentationMode ?? "photo",
        priceAmount: profile.pricePerWeek ? `$${profile.pricePerWeek.toLocaleString()}` : null,
        tags: [
          profile.recoveryResidenceLevel,
          ...profile.insuranceAccepted.slice(0, 1),
          ...(profile.matAccepted.length || profile.matServicesOffered ? ["MAT accepted"] : [])
        ].filter((tag): tag is string => Boolean(tag)),
        ...availability
      };
    });
    return { homes, location };
  }
  const isLocalPreview = process.env.NODE_ENV === "development" && !hasDatabaseConfig();
  const popularPrograms = isLocalPreview
    ? { homes: (await import("@/lib/popular-program-preview")).popularProgramPreview, location: null }
    : await popularGroup();

  return (
    <>
      <MarketingHeader />
      <main>
      <section className="relative overflow-hidden border-b border-border bg-[#f4f3ef]">
        <div className="pointer-events-none absolute inset-y-0 right-0 hidden w-[48%] lg:block" aria-hidden="true">
          <Image
            alt=""
            className="object-cover object-[70%_center]"
            fill
            priority
            sizes="48vw"
            src="/images/aftercare-community-hero.webp"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#f4f3ef] via-[#f4f3ef]/88 to-[#f4f3ef]/20" />
        </div>
        <div className="shell relative py-16 sm:py-20 lg:py-28">
          <div className="max-w-xl lg:max-w-2xl">
            <p className="text-[13px] font-semibold uppercase tracking-[0.22em] text-[#10195e]">Aftercare Compass</p>
            <h1 className="mt-5 text-[2.75rem] font-semibold leading-[1.02] tracking-[-0.035em] text-[#17212b] sm:text-6xl lg:text-[4.5rem]">
              <span className="block">Close the gap.</span>
              <span className="block">Change the outcome.</span>
            </h1>
            <p className="mt-6 max-w-lg text-lg leading-8 text-[#3d4a57]">
              Find real-time availability for sober living and continued care programs—in minutes, not hours.
            </p>
            <HeroSearchForm />
            <p className="mt-5 max-w-lg text-sm leading-6 text-[#5c6b7a]">
              A placement assistant is coming to search. Until that update is ready, this search works the same way it does today.
            </p>
          </div>
        </div>
      </section>

      <TrendingHomes homes={popularPrograms.homes} location={popularPrograms.location} preview={isLocalPreview} />

      <section className="bg-white">
        <div className="shell grid gap-12 py-16 md:grid-cols-2 md:gap-16 md:py-24">
          <article>
            <p className="text-[13px] font-semibold uppercase tracking-[0.18em] text-[#10195e]">Placing someone</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-[-0.03em] text-[#17212b] sm:text-4xl">Find the next step.</h2>
            <p className="mt-4 max-w-md text-base leading-7 text-[#3d4a57]">
              Search published sober living and continued care. See the availability the program posted. When you are signed in, send a referral that leaves out client identifiers.
            </p>
            <div className="mt-6">
              <ButtonLink href="/for-case-managers">For case managers</ButtonLink>
            </div>
          </article>
          <article className="md:border-l md:border-border md:pl-16">
            <p className="text-[13px] font-semibold uppercase tracking-[0.18em] text-[#10195e]">Running a program</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-[-0.03em] text-[#17212b] sm:text-4xl">Show what you have open.</h2>
            <p className="mt-4 max-w-md text-base leading-7 text-[#3d4a57]">
              Publish your sober living or continued care listing and update availability so the people placing clients can find you.
            </p>
            <div className="mt-6">
              <ButtonLink href="/for-providers" variant="secondary">For providers</ButtonLink>
            </div>
          </article>
        </div>
      </section>

      <section className="border-y border-border bg-[#f4f3ef]" aria-label="How listings work">
        <ul className="shell grid gap-8 py-12 md:grid-cols-3 md:py-14">
          <li>
            <p className="text-base font-semibold text-[#17212b]">Availability is what the program posted.</p>
            <p className="mt-2 text-sm leading-6 text-[#5c6b7a]">Confirm space with the program. Aftercare Compass does not hold beds.</p>
          </li>
          <li>
            <p className="text-base font-semibold text-[#17212b]">Referrals leave out client identifiers.</p>
            <p className="mt-2 text-sm leading-6 text-[#5c6b7a]">A signed-in referrer sends a de-identified referral. The program tracks it from its dashboard.</p>
          </li>
          <li>
            <p className="text-base font-semibold text-[#17212b]">Listings are not ordered by ad spend.</p>
            <p className="mt-2 text-sm leading-6 text-[#5c6b7a]">A program is not placed above another because it bought a larger promotion.</p>
          </li>
        </ul>
      </section>

      <HomeAnswerSection />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: homeJsonLd() }} />
      </main>
    </>
  );
}
