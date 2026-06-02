import Link from "next/link";
import { redirect } from "next/navigation";
import { Building2, Home, Search } from "lucide-react";
import { Prisma, ProfileOwnershipStatus, ProfileType } from "@prisma/client";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { ProfileClaimPreviewCard } from "@/components/profile-claim-preview-card";
import { Card } from "@/components/ui/card";
import { getCurrentAppUser } from "@/lib/current-user";
import {
  draftDestinationForAccountType,
  getOnboardingDraftForSession
} from "@/lib/onboarding";
import { prisma } from "@/lib/prisma";
import { richTextToPlainText } from "@/lib/rich-text";

export const dynamic = "force-dynamic";

function formatPricePerWeek(value: number | null) {
  if (!value) {
    return null;
  }

  return `$${value.toLocaleString()}/week`;
}

function typeLabel(type: ProfileType) {
  return type === ProfileType.continued_care ? "Continued Care" : "Sober Living";
}

function profileTypeForAccountType(accountType: string) {
  return accountType === "continued_care" ? ProfileType.continued_care : ProfileType.sober_living;
}

function pageCopy(accountType: string) {
  if (accountType === "continued_care") {
    return {
      Icon: Building2,
      title: "Find your continued care program",
      description: "Search existing continued care listings before creating a new profile. If your program is already listed as unclaimed, you can request access for admin review.",
      placeholder: "Search by program, city, state, or website",
      empty: "No continued care programs matched your search.",
      continueLabel: "Create a new continued care profile"
    };
  }

  return {
    Icon: Home,
    title: "Find your sober living home",
    description: "Search existing sober living listings before creating a new profile. If your home is already listed as unclaimed, you can request access for admin review.",
    placeholder: "Search by home, city, state, or website",
    empty: "No sober living homes matched your search.",
    continueLabel: "Continue to sober living profile creation"
  };
}

function searchWhere(q: string, type: ProfileType): Prisma.AftercareProfileWhereInput {
  return {
    type,
    status: "published",
    ownershipStatus: {
      in: [
        ProfileOwnershipStatus.unclaimed,
        ProfileOwnershipStatus.claim_pending,
        ProfileOwnershipStatus.claimed
      ]
    },
    OR: [
      { programName: { contains: q, mode: Prisma.QueryMode.insensitive } },
      { publicCity: { contains: q, mode: Prisma.QueryMode.insensitive } },
      { publicState: { contains: q, mode: Prisma.QueryMode.insensitive } },
      { city: { contains: q, mode: Prisma.QueryMode.insensitive } },
      { state: { contains: q, mode: Prisma.QueryMode.insensitive } },
      { websiteUrl: { contains: q, mode: Prisma.QueryMode.insensitive } }
    ]
  };
}

export default async function FindExistingAftercareProfilePage({
  searchParams
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const [appUser, draft, query] = await Promise.all([
    getCurrentAppUser(),
    getOnboardingDraftForSession(),
    searchParams
  ]);

  if (appUser?.orgId) {
    if (appUser.role.startsWith("aftercare")) {
      redirect("/dashboard/aftercare");
    }

    redirect("/dashboard");
  }

  const accountType = draft?.selectedAccountType;

  if (accountType === "referent") {
    redirect(draftDestinationForAccountType("referent"));
  }

  if (accountType !== "sober_living" && accountType !== "continued_care") {
    redirect("/onboarding/account-type");
  }

  const profileType = profileTypeForAccountType(accountType);
  const copy = pageCopy(accountType);
  const Icon = copy.Icon;
  const q = String(query.q || "").trim();
  const matchingProfiles = q.length >= 2
    ? await prisma.aftercareProfile.findMany({
        where: searchWhere(q, profileType),
        orderBy: [
          { ownershipStatus: "asc" },
          { programName: "asc" }
        ],
        take: 6,
        select: {
          id: true,
          slug: true,
          type: true,
          programName: true,
          publicCity: true,
          publicState: true,
          description: true,
          pricePerWeek: true,
          ownershipStatus: true,
          populationServedOptions: true,
          levelsOfCare: true,
          programTypes: true,
          images: {
            orderBy: [{ isCover: "desc" }, { sortOrder: "asc" }, { createdAt: "asc" }],
            take: 1,
            select: {
              altText: true,
              url: true
            }
          }
        }
      })
    : [];
  const continueHref = draftDestinationForAccountType(accountType);

  return (
    <main className="shell py-10">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
        <div className="max-w-2xl">
          <div className="flex items-center gap-3">
            <span className="inline-flex size-11 items-center justify-center rounded-full border border-primary/20 bg-primary/10 shadow-sm">
              <Icon className="text-primary" size={24} />
            </span>
            <h1 className="text-3xl font-semibold">{copy.title}</h1>
          </div>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            {copy.description}
          </p>
        </div>
        <SignOutButton />
      </div>

      <Card className="mt-8 overflow-hidden p-0">
        <div className="border-b border-border bg-muted/20 px-5 py-4">
          <div className="flex items-center gap-2">
            <Search className="text-primary" size={20} />
            <h2 className="text-lg font-semibold">Search existing listings</h2>
          </div>
        </div>
        <div className="grid gap-4 p-5">
          <form className="grid gap-3 md:grid-cols-[1fr_auto]">
            <label className="sr-only" htmlFor="existing-profile-search">Search existing profiles</label>
            <input
              className="min-h-11 rounded-md border border-border bg-white px-3 text-sm"
              defaultValue={q}
              id="existing-profile-search"
              name="q"
              placeholder={copy.placeholder}
            />
            <button className="focus-ring inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-primary px-5 text-sm font-semibold text-primary-foreground">
              <Search size={16} />
              Search
            </button>
          </form>

          {q.length === 1 ? (
            <p className="rounded-md border border-border bg-muted/30 p-3 text-sm text-muted-foreground">
              Enter at least 2 characters to search existing profiles.
            </p>
          ) : null}

          {q.length >= 2 && !matchingProfiles.length ? (
            <div className="rounded-md border border-border bg-muted/30 p-4 text-sm text-muted-foreground">
              {copy.empty}
            </div>
          ) : null}

          {matchingProfiles.length ? (
            <div className="grid gap-4">
              {matchingProfiles.map((profile) => {
                const tags = profile.type === ProfileType.continued_care
                  ? [...profile.levelsOfCare, ...profile.programTypes]
                  : profile.populationServedOptions;
                const image = profile.images[0];
                const claimHref = profile.ownershipStatus === ProfileOwnershipStatus.claimed
                  ? `/profiles/${profile.slug}`
                  : `/profiles/${profile.slug}#claim`;

                return (
                  <ProfileClaimPreviewCard
                    key={profile.id}
                    badge="Existing profile"
                    claimHref={claimHref}
                    description={richTextToPlainText(profile.description).slice(0, 220)}
                    imageAlt={image?.altText || profile.programName}
                    imageUrl={image?.url}
                    location={[profile.publicCity, profile.publicState].filter(Boolean).join(", ")}
                    ownershipStatus={profile.ownershipStatus}
                    priceLabel={formatPricePerWeek(profile.pricePerWeek)}
                    programName={profile.programName}
                    tags={tags}
                    typeLabel={typeLabel(profile.type)}
                  />
                );
              })}
            </div>
          ) : null}
        </div>
      </Card>

      <div className="mt-6 flex flex-wrap gap-3">
        <Link
          className="focus-ring inline-flex min-h-11 items-center justify-center rounded-md border border-border bg-white px-5 text-sm font-semibold"
          href="/onboarding/account-type"
        >
          Back to account type
        </Link>
        <Link
          className="focus-ring inline-flex min-h-11 items-center justify-center rounded-md bg-primary px-5 text-sm font-semibold text-primary-foreground shadow-sm"
          href={continueHref}
        >
          {copy.continueLabel}
        </Link>
      </div>
    </main>
  );
}
