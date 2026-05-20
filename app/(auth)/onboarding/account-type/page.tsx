import { redirect } from "next/navigation";
import { Building2, Hospital, Home, Search } from "lucide-react";
import { Prisma, ProfileOwnershipStatus } from "@prisma/client";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { ProfileClaimPreviewCard } from "@/components/profile-claim-preview-card";
import { Card } from "@/components/ui/card";
import { getCurrentAppUser } from "@/lib/current-user";
import { prisma } from "@/lib/prisma";
import { richTextToPlainText } from "@/lib/rich-text";
import { selectAccountType } from "../actions";

const accountTypes = [
  {
    value: "referent",
    title: "I refer patients",
    description: "Hospitals, inpatient centers, crisis centers, RTCs, and community organizations.",
    icon: Hospital
  },
  {
    value: "sober_living",
    title: "I manage a Sober Living Home",
    description: "Create provider profiles, manage bed availability, and receive referrals.",
    icon: Home
  },
  {
    value: "continued_care",
    title: "I manage a Continued Care Program",
    description: "Publish IOP, PHP, OP, MAT, and dual diagnosis program availability.",
    icon: Building2
  }
];

export const dynamic = "force-dynamic";

function formatPricePerWeek(value: number | null) {
  if (!value) {
    return null;
  }

  return `$${value.toLocaleString()}/week`;
}

function typeLabel(type: string) {
  return type === "continued_care" ? "Continued Care" : "Sober Living";
}

function searchWhere(q: string): Prisma.AftercareProfileWhereInput {
  return {
    status: "published",
    ownershipStatus: {
      in: [
        ProfileOwnershipStatus.unclaimed,
        ProfileOwnershipStatus.claim_pending,
        ProfileOwnershipStatus.claimed
      ]
    },
    OR: [
      { programName: { contains: q, mode: "insensitive" } },
      { publicCity: { contains: q, mode: "insensitive" } },
      { publicState: { contains: q, mode: "insensitive" } },
      { city: { contains: q, mode: "insensitive" } },
      { state: { contains: q, mode: "insensitive" } },
      { websiteUrl: { contains: q, mode: "insensitive" } }
    ]
  };
}

export default async function AccountTypePage({
  searchParams
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const appUser = await getCurrentAppUser();
  const query = await searchParams;
  const q = String(query.q || "").trim();
  const claimableProfiles = q.length >= 2
    ? await prisma.aftercareProfile.findMany({
        where: searchWhere(q),
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

  if (appUser?.orgId) {
    if (appUser.role.startsWith("referent")) {
      redirect("/dashboard/referent");
    }

    if (appUser.role.startsWith("aftercare")) {
      redirect("/dashboard/aftercare");
    }

    redirect("/dashboard");
  }

  return (
    <main className="shell py-10">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
        <div className="max-w-2xl">
          <h1 className="text-3xl font-semibold">Choose your account type</h1>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            Email verification is a hard gate before onboarding continues. Each email belongs to one
            organization only.
          </p>
        </div>
        <SignOutButton />
      </div>

      <Card className="mt-8 overflow-hidden p-0">
        <div className="border-b border-border bg-muted/20 px-5 py-4">
          <div className="flex items-center gap-2">
            <Search className="text-primary" size={20} />
            <h2 className="text-lg font-semibold">Find an existing profile first</h2>
          </div>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
            Search before creating a new profile. If your home or program is already listed as unclaimed, you can request access for admin review.
          </p>
        </div>
        <div className="grid gap-4 p-5">
          <form className="grid gap-3 md:grid-cols-[1fr_auto]">
            <label className="sr-only" htmlFor="existing-profile-search">Search existing profiles</label>
            <input
              className="min-h-11 rounded-md border border-border bg-white px-3 text-sm"
              defaultValue={q}
              id="existing-profile-search"
              name="q"
              placeholder="Search by home, program, city, state, or website"
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

          {q.length >= 2 && !claimableProfiles.length ? (
            <div className="rounded-md border border-border bg-muted/30 p-4 text-sm text-muted-foreground">
              No unclaimed profiles matched your search. You can create a new profile below.
            </div>
          ) : null}

          {claimableProfiles.length ? (
            <div className="grid gap-4">
              {claimableProfiles.map((profile) => {
                const tags = profile.type === "continued_care"
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

      <div className="mt-8 grid gap-4 md:grid-cols-3">
        {accountTypes.map((accountType) => {
          const Icon = accountType.icon;
          return (
            <Card key={accountType.title}>
              <Icon className="text-primary" size={24} />
              <h2 className="mt-4 text-lg font-semibold">{accountType.title}</h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{accountType.description}</p>
              <form action={selectAccountType}>
                <input type="hidden" name="accountType" value={accountType.value} />
                <button className="focus-ring mt-5 inline-flex min-h-10 items-center rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground">
                  Continue
                </button>
              </form>
            </Card>
          );
        })}
      </div>
    </main>
  );
}
