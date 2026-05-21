import Link from "next/link";
import { redirect } from "next/navigation";
import { Building2, ClipboardCheck, FileCheck2, Flag, Handshake, Home, Inbox, PlusCircle } from "lucide-react";
import {
  AdminReviewStatus,
  AdminReviewSubjectType,
  LeadStatus,
  OrganizationType,
  ProfileStatus,
  ProfileType,
  ReferralStatus,
  Role
} from "@prisma/client";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { getProtectedAppUser } from "@/lib/protected-routing";
import { prisma } from "@/lib/prisma";
import {
  createUnclaimedAftercareProfile,
  reviewOnboardingSubmission,
  reviewProfileClaimRequest
} from "./actions";

export const dynamic = "force-dynamic";

const adminTabs = [
  { key: "overview", label: "Overview", icon: ClipboardCheck },
  { key: "organizations", label: "Organizations", icon: Building2 },
  { key: "profiles", label: "Homes & Programs", icon: Home },
  { key: "requests", label: "Referrals & Leads", icon: Inbox },
  { key: "claims", label: "Claims", icon: Handshake },
  { key: "verification", label: "Verification", icon: FileCheck2 }
] as const;

type AdminTab = (typeof adminTabs)[number]["key"];

function asAdminTab(value: string | string[] | undefined): AdminTab {
  const selected = Array.isArray(value) ? value[0] : value;
  return adminTabs.some((tab) => tab.key === selected) ? selected as AdminTab : "overview";
}

function formatValue(value: string | null | undefined) {
  if (!value) {
    return "Not set";
  }

  return value
    .replaceAll("_", " ")
    .split(" ")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function formatDate(value: Date | null | undefined) {
  return value ? value.toLocaleDateString() : "Not set";
}

function organizationLabel(type: OrganizationType) {
  if (type === OrganizationType.referent) {
    return "Referent";
  }

  if (type === OrganizationType.aftercare_continued_care) {
    return "Continued Care";
  }

  return "Sober Living";
}

function profileLabel(type: ProfileType) {
  return type === ProfileType.sober_living ? "Sober Living" : "Continued Care";
}

function reviewSubjectLabel(type: AdminReviewSubjectType) {
  return type === AdminReviewSubjectType.referent_org ? "Referent" : "Home / Program";
}

function statusTone(status: string): "neutral" | "verified" | "warning" | "success" {
  if (["active", "published", "accepted", "placed", "approved"].includes(status)) {
    return "success";
  }

  if (["under_review", "pending", "new", "draft", "trialing"].includes(status)) {
    return "warning";
  }

  if (["verified"].includes(status)) {
    return "verified";
  }

  return "neutral";
}

function availabilityText(profile: {
  type: ProfileType;
  bedsAvailable: number | null;
  acceptingNewPatients: boolean | null;
}) {
  if (profile.type === ProfileType.sober_living) {
    return `${profile.bedsAvailable ?? 0} beds`;
  }

  return profile.acceptingNewPatients ? "Accepting" : "Not accepting";
}

function SummaryCards({ items }: { items: Array<[string, string]> }) {
  return (
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
      {items.map(([label, value]) => (
        <Card className="p-4" key={label}>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
          <p className="mt-2 text-3xl font-semibold">{value}</p>
        </Card>
      ))}
    </div>
  );
}

export default async function AdminDashboardPage({
  searchParams
}: {
  searchParams: Promise<{ tab?: string | string[]; reviewMessage?: string | string[] }>;
}) {
  const [query, appUser] = await Promise.all([
    searchParams,
    getProtectedAppUser("/dashboard/admin")
  ]);
  const activeTab = asAdminTab(query.tab);
  const reviewMessage = Array.isArray(query.reviewMessage) ? query.reviewMessage[0] : query.reviewMessage;

  if (appUser.role !== Role.system_admin) {
    redirect("/dashboard");
  }

  const [
    orgCounts,
    profileCounts,
    referralCounts,
    leadCounts,
    recentOrganizations,
    organizations,
    profiles,
    referrals,
    leads,
    profileClaims,
    applicationReviews,
    verificationDocuments,
    flags
  ] = await Promise.all([
    prisma.organization.groupBy({
      by: ["type"],
      _count: { _all: true }
    }),
    prisma.aftercareProfile.groupBy({
      by: ["type", "status"],
      _count: { _all: true }
    }),
    prisma.referral.groupBy({
      by: ["status"],
      _count: { _all: true }
    }),
    prisma.lead.groupBy({
      by: ["status"],
      _count: { _all: true }
    }),
    prisma.organization.findMany({
      orderBy: { createdAt: "desc" },
      take: 6,
      select: {
        id: true,
        name: true,
        type: true,
        subscriptionPlan: true,
        subscriptionStatus: true,
        createdAt: true,
        _count: {
          select: {
            users: true,
            profiles: true,
            leads: true,
            aftercareReferrals: true,
            referentReferrals: true
          }
        }
      }
    }),
    prisma.organization.findMany({
      orderBy: [{ type: "asc" }, { name: "asc" }],
      take: 50,
      select: {
        id: true,
        name: true,
        type: true,
        email: true,
        phone: true,
        subscriptionPlan: true,
        subscriptionStatus: true,
        createdAt: true,
        _count: {
          select: {
            users: true,
            profiles: true,
            leads: true,
            aftercareReferrals: true,
            referentReferrals: true
          }
        }
      }
    }),
    prisma.aftercareProfile.findMany({
      orderBy: [{ status: "asc" }, { updatedAt: "desc" }],
      take: 75,
      select: {
        id: true,
        slug: true,
        programName: true,
        type: true,
        status: true,
        verificationTier: true,
        publicCity: true,
        publicState: true,
        bedsAvailable: true,
        acceptingNewPatients: true,
        updatedAt: true,
        organization: {
          select: {
            id: true,
            name: true,
            type: true,
            _count: { select: { users: true } }
          }
        },
        _count: {
          select: {
            referrals: true,
            leads: true
          }
        }
      }
    }),
    prisma.referral.findMany({
      orderBy: { createdAt: "desc" },
      take: 35,
      select: {
        id: true,
        status: true,
        caseManagerOrganization: true,
        caseManagerName: true,
        clientAgeRange: true,
        preferredStartWindow: true,
        createdAt: true,
        aftercareProfile: {
          select: {
            programName: true,
            slug: true
          }
        },
        referentOrg: {
          select: {
            name: true
          }
        }
      }
    }),
    prisma.lead.findMany({
      orderBy: { createdAt: "desc" },
      take: 35,
      select: {
        id: true,
        status: true,
        name: true,
        email: true,
        createdAt: true,
        profile: {
          select: {
            programName: true,
            slug: true
          }
        },
        aftercareOrg: {
          select: {
            name: true
          }
        }
      }
    }),
    prisma.profileClaimRequest.findMany({
      orderBy: [{ status: "asc" }, { submittedAt: "desc" }],
      take: 75,
      select: {
        id: true,
        status: true,
        claimantName: true,
        claimantEmail: true,
        claimantPhone: true,
        claimantRole: true,
        claimantOrganization: true,
        relationshipToProgram: true,
        notes: true,
        reviewerNotes: true,
        submittedAt: true,
        reviewedAt: true,
        profile: {
          select: {
            id: true,
            slug: true,
            programName: true,
            type: true,
            publicCity: true,
            publicState: true,
            ownershipStatus: true,
            organization: {
              select: {
                name: true
              }
            }
          }
        },
        claimantUser: {
          select: {
            email: true,
            organization: {
              select: {
                name: true,
                type: true
              }
            }
          }
        },
        reviewedByUser: {
          select: {
            email: true
          }
        }
      }
    }),
    prisma.adminReview.findMany({
      orderBy: [{ status: "asc" }, { submittedAt: "desc" }],
      take: 75,
      select: {
        id: true,
        subjectType: true,
        status: true,
        submittedByEmail: true,
        reviewerNotes: true,
        submittedAt: true,
        reviewedAt: true,
        organization: {
          select: {
            name: true,
            type: true,
            email: true
          }
        },
        profile: {
          select: {
            programName: true,
            slug: true,
            type: true,
            publicCity: true,
            publicState: true,
            verificationTier: true
          }
        },
        reviewedByUser: {
          select: {
            email: true
          }
        }
      }
    }),
    prisma.verificationDocument.findMany({
      orderBy: { submittedAt: "desc" },
      take: 50,
      select: {
        id: true,
        documentType: true,
        status: true,
        submittedAt: true,
        expiresAt: true,
        profile: {
          select: {
            programName: true,
            slug: true,
            verificationTier: true,
            organization: {
              select: {
                name: true
              }
            }
          }
        }
      }
    }),
    prisma.flag.findMany({
      orderBy: { createdAt: "desc" },
      take: 20,
      select: {
        id: true,
        flagType: true,
        status: true,
        createdAt: true,
        profile: {
          select: {
            programName: true,
            slug: true
          }
        }
      }
    })
  ]);

  const countOrganizations = (type: OrganizationType) =>
    orgCounts.find((item) => item.type === type)?._count._all ?? 0;
  const countProfiles = (status?: ProfileStatus, type?: ProfileType) =>
    profileCounts
      .filter((item) => (status ? item.status === status : true) && (type ? item.type === type : true))
      .reduce((sum, item) => sum + item._count._all, 0);
  const countReferrals = (status?: ReferralStatus) =>
    referralCounts
      .filter((item) => status ? item.status === status : true)
      .reduce((sum, item) => sum + item._count._all, 0);
  const countLeads = (status?: LeadStatus) =>
    leadCounts
      .filter((item) => status ? item.status === status : true)
      .reduce((sum, item) => sum + item._count._all, 0);
  const pendingVerificationCount = verificationDocuments.filter((document) => document.status === "pending").length;
  const pendingApplicationCount = applicationReviews.filter((review) => review.status === AdminReviewStatus.pending).length;
  const pendingClaimCount = profileClaims.filter((claim) => claim.status === "pending").length;
  const openFlagCount = flags.filter((flag) => flag.status === "open").length;

  return (
    <main className="shell py-8">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
        <div>
          <Badge tone="verified">System admin</Badge>
          <h1 className="mt-3 text-3xl font-semibold">Marketplace controls</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
            Platform-wide visibility across aftercare supply, referent demand, referrals,
            public leads, and verification work.
          </p>
        </div>
        <SignOutButton />
      </div>

      <nav className="ac-tabs mt-6" aria-label="System admin dashboard sections">
        {adminTabs.map((tab) => {
          const Icon = tab.icon;
          const selected = activeTab === tab.key;

          return (
            <Link
              className="focus-ring ac-tab"
              data-active={selected ? "true" : "false"}
              href={`/dashboard/admin?tab=${tab.key}`}
              key={tab.key}
            >
              <Icon size={16} />
              {tab.label}
            </Link>
          );
        })}
      </nav>

      {activeTab === "overview" ? (
        <div className="mt-6 grid gap-6">
          <SummaryCards
            items={[
              ["Aftercare orgs", (countOrganizations(OrganizationType.aftercare_sober_living) + countOrganizations(OrganizationType.aftercare_continued_care)).toString()],
              ["Referent orgs", countOrganizations(OrganizationType.referent).toString()],
              ["Published profiles", countProfiles(ProfileStatus.published).toString()],
              ["Total requests", (countReferrals() + countLeads()).toString()]
            ]}
          />

          <div className="grid gap-4 xl:grid-cols-2">
            <Card>
              <h2 className="text-xl font-semibold">Recent organizations</h2>
              <div className="mt-4 overflow-hidden rounded-md border border-border">
                {recentOrganizations.map((organization) => (
                  <div className="grid gap-3 border-b border-border p-3 text-sm last:border-0 md:grid-cols-[minmax(0,1fr)_150px_120px_120px]" key={organization.id}>
                    <div>
                      <p className="font-semibold">{organization.name}</p>
                      <p className="mt-1 text-muted-foreground">{organizationLabel(organization.type)}</p>
                    </div>
                    <Badge tone={statusTone(organization.subscriptionStatus || "draft")}>
                      {formatValue(organization.subscriptionStatus || "No subscription")}
                    </Badge>
                    <p className="text-muted-foreground">{organization._count.users} users</p>
                    <p className="text-muted-foreground">{formatDate(organization.createdAt)}</p>
                  </div>
                ))}
              </div>
            </Card>

            <Card>
              <h2 className="text-xl font-semibold">Operational queue</h2>
              <div className="mt-4 grid gap-3">
                <div className="ac-panel-card p-4">
                  <p className="font-semibold">Application review</p>
                  <p className="mt-1 text-sm text-muted-foreground">{pendingApplicationCount} onboarding submissions need approval.</p>
                </div>
                <div className="ac-panel-card p-4">
                  <p className="font-semibold">Verification review</p>
                  <p className="mt-1 text-sm text-muted-foreground">{pendingVerificationCount} pending document reviews.</p>
                </div>
                <div className="ac-panel-card p-4">
                  <p className="font-semibold">Referral response</p>
                  <p className="mt-1 text-sm text-muted-foreground">{countReferrals(ReferralStatus.pending)} referrals still pending provider action.</p>
                </div>
                <div className="ac-panel-card p-4">
                  <p className="font-semibold">Public lead follow-up</p>
                  <p className="mt-1 text-sm text-muted-foreground">{countLeads(LeadStatus.new)} new public leads in provider inboxes.</p>
                </div>
                <div className="ac-panel-card p-4">
                  <p className="font-semibold">Profile claims</p>
                  <p className="mt-1 text-sm text-muted-foreground">{pendingClaimCount} ownership claims need review.</p>
                </div>
                <div className="ac-panel-card p-4">
                  <p className="font-semibold">Marketplace quality</p>
                  <p className="mt-1 text-sm text-muted-foreground">{openFlagCount} open profile flags.</p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      ) : null}

      {activeTab === "organizations" ? (
        <div className="mt-6 grid gap-4">
          <SummaryCards
            items={[
              ["Aftercare orgs", (countOrganizations(OrganizationType.aftercare_sober_living) + countOrganizations(OrganizationType.aftercare_continued_care)).toString()],
              ["Referent orgs", countOrganizations(OrganizationType.referent).toString()],
              ["Sober living orgs", countOrganizations(OrganizationType.aftercare_sober_living).toString()],
              ["Continued care orgs", countOrganizations(OrganizationType.aftercare_continued_care).toString()]
            ]}
          />
          <Card>
            <div className="flex items-center gap-3">
              <Building2 className="text-primary" size={24} />
              <h2 className="text-xl font-semibold">Organizations</h2>
            </div>
            <div className="mt-5 overflow-x-auto">
              <table className="w-full min-w-[920px] text-left text-sm">
              <thead className="border-b border-border text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="py-3 pr-4">Organization</th>
                  <th className="py-3 pr-4">Type</th>
                  <th className="py-3 pr-4">Users</th>
                  <th className="py-3 pr-4">Profiles</th>
                  <th className="py-3 pr-4">Requests</th>
                  <th className="py-3 pr-4">Subscription</th>
                  <th className="py-3 pr-4">Created</th>
                </tr>
              </thead>
              <tbody>
                {organizations.map((organization) => {
                  const requestCount = organization._count.leads + organization._count.aftercareReferrals + organization._count.referentReferrals;

                  return (
                    <tr className="border-b border-border last:border-0" key={organization.id}>
                      <td className="py-4 pr-4">
                        <p className="font-semibold">{organization.name}</p>
                        <p className="mt-1 text-xs text-muted-foreground">{organization.email || organization.phone || "No contact listed"}</p>
                      </td>
                      <td className="py-4 pr-4"><Badge>{organizationLabel(organization.type)}</Badge></td>
                      <td className="py-4 pr-4">{organization._count.users}</td>
                      <td className="py-4 pr-4">{organization._count.profiles}</td>
                      <td className="py-4 pr-4">{requestCount}</td>
                      <td className="py-4 pr-4">
                        <Badge tone={statusTone(organization.subscriptionStatus || "draft")}>
                          {organization.subscriptionPlan || formatValue(organization.subscriptionStatus || "Not set")}
                        </Badge>
                      </td>
                      <td className="py-4 pr-4 text-muted-foreground">{formatDate(organization.createdAt)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            </div>
          </Card>
        </div>
      ) : null}

      {activeTab === "profiles" ? (
        <div className="mt-6 grid gap-4">
          <SummaryCards
            items={[
              ["Published profiles", countProfiles(ProfileStatus.published).toString()],
              ["Draft profiles", countProfiles(ProfileStatus.draft).toString()],
              ["Sober living profiles", countProfiles(undefined, ProfileType.sober_living).toString()],
              ["Continued care profiles", countProfiles(undefined, ProfileType.continued_care).toString()]
            ]}
          />
          <Card>
            <div className="flex flex-col justify-between gap-3 md:flex-row md:items-start">
              <div>
                <div className="flex items-center gap-3">
                  <PlusCircle className="text-primary" size={24} />
                  <h2 className="text-xl font-semibold">Add unclaimed listing</h2>
                </div>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  Add a home or program to the public directory before the provider claims it.
                </p>
              </div>
              {reviewMessage ? <Badge tone="success">{reviewMessage}</Badge> : null}
            </div>
            <form action={createUnclaimedAftercareProfile} className="mt-5 grid gap-4">
              <div className="grid gap-3 md:grid-cols-3">
                <label className="grid gap-1 text-sm font-semibold">
                  Listing type
                  <select className="min-h-10 rounded-md border border-border bg-white px-3 text-sm" name="type">
                    <option value={ProfileType.sober_living}>Sober living home</option>
                    <option value={ProfileType.continued_care}>Continued care program</option>
                  </select>
                </label>
                <label className="grid gap-1 text-sm font-semibold md:col-span-2">
                  Program name
                  <input className="min-h-10 rounded-md border border-border bg-white px-3 text-sm" name="programName" required />
                </label>
              </div>
              <div className="grid gap-3 md:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_120px_140px]">
                <label className="grid gap-1 text-sm font-semibold">
                  Street address
                  <input className="min-h-10 rounded-md border border-border bg-white px-3 text-sm" name="streetAddress" />
                </label>
                <label className="grid gap-1 text-sm font-semibold">
                  City
                  <input className="min-h-10 rounded-md border border-border bg-white px-3 text-sm" name="city" required />
                </label>
                <label className="grid gap-1 text-sm font-semibold">
                  State
                  <input className="min-h-10 rounded-md border border-border bg-white px-3 text-sm" maxLength={2} name="state" required />
                </label>
                <label className="grid gap-1 text-sm font-semibold">
                  ZIP
                  <input className="min-h-10 rounded-md border border-border bg-white px-3 text-sm" name="zip" />
                </label>
              </div>
              <div className="grid gap-3 md:grid-cols-3">
                <label className="grid gap-1 text-sm font-semibold">
                  Admissions email
                  <input className="min-h-10 rounded-md border border-border bg-white px-3 text-sm" name="admissionsContactEmail" type="email" />
                </label>
                <label className="grid gap-1 text-sm font-semibold">
                  Admissions phone
                  <input className="min-h-10 rounded-md border border-border bg-white px-3 text-sm" name="admissionsContactPhone" />
                </label>
                <label className="grid gap-1 text-sm font-semibold">
                  Website
                  <input className="min-h-10 rounded-md border border-border bg-white px-3 text-sm" name="websiteUrl" type="url" />
                </label>
              </div>
              <label className="grid gap-1 text-sm font-semibold">
                Short description
                <textarea className="min-h-24 rounded-md border border-border bg-white p-3 text-sm leading-6" name="description" />
              </label>
              <div className="flex flex-col justify-between gap-3 md:flex-row md:items-end">
                <label className="grid gap-1 text-sm font-semibold">
                  Initial status
                  <select className="min-h-10 rounded-md border border-border bg-white px-3 text-sm" name="status">
                    <option value={ProfileStatus.published}>Published</option>
                    <option value={ProfileStatus.draft}>Draft</option>
                  </select>
                </label>
                <button className="focus-ring inline-flex min-h-10 items-center justify-center rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground">
                  Add listing
                </button>
              </div>
            </form>
          </Card>
          <Card>
            <div className="flex items-center gap-3">
              <Home className="text-primary" size={24} />
              <h2 className="text-xl font-semibold">Homes & programs</h2>
            </div>
            <div className="mt-5 overflow-x-auto">
              <table className="w-full min-w-[980px] text-left text-sm">
              <thead className="border-b border-border text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="py-3 pr-4">Profile</th>
                  <th className="py-3 pr-4">Organization</th>
                  <th className="py-3 pr-4">Type</th>
                  <th className="py-3 pr-4">Status</th>
                  <th className="py-3 pr-4">Availability</th>
                  <th className="py-3 pr-4">Requests</th>
                  <th className="py-3 pr-4">Updated</th>
                </tr>
              </thead>
              <tbody>
                {profiles.map((profile) => (
                  <tr className="border-b border-border last:border-0" key={profile.id}>
                    <td className="py-4 pr-4">
                      <Link className="font-semibold underline-offset-4 hover:underline" href={`/profiles/${profile.slug}?preview=1`}>
                        {profile.programName}
                      </Link>
                      <p className="mt-1 text-xs text-muted-foreground">{[profile.publicCity, profile.publicState].filter(Boolean).join(", ")}</p>
                    </td>
                    <td className="py-4 pr-4">
                      <p className="font-medium">{profile.organization.name}</p>
                      <p className="mt-1 text-xs text-muted-foreground">{profile.organization._count.users} users</p>
                    </td>
                    <td className="py-4 pr-4"><Badge>{profileLabel(profile.type)}</Badge></td>
                    <td className="py-4 pr-4">
                      <Badge tone={statusTone(profile.status)}>{formatValue(profile.status)}</Badge>
                    </td>
                    <td className="py-4 pr-4">{availabilityText(profile)}</td>
                    <td className="py-4 pr-4">{profile._count.referrals + profile._count.leads}</td>
                    <td className="py-4 pr-4 text-muted-foreground">{formatDate(profile.updatedAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          </Card>
        </div>
      ) : null}

      {activeTab === "requests" ? (
        <div className="mt-6 grid gap-4">
          <SummaryCards
            items={[
              ["Open referrals", countReferrals(ReferralStatus.pending).toString()],
              ["New public leads", countLeads(LeadStatus.new).toString()],
              ["Total referrals", countReferrals().toString()],
              ["Total public leads", countLeads().toString()]
            ]}
          />
          <div className="grid gap-4 xl:grid-cols-2">
          <Card>
            <h2 className="text-xl font-semibold">Recent referrals</h2>
            <div className="mt-4 grid gap-3">
              {referrals.map((referral) => (
                <div className="ac-panel-card p-4 text-sm" key={referral.id}>
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold">{referral.referentOrg.name}</p>
                      <p className="mt-1 text-muted-foreground">
                        To {referral.aftercareProfile.programName} · {formatValue(referral.clientAgeRange)} · {formatValue(referral.preferredStartWindow)}
                      </p>
                    </div>
                    <Badge tone={statusTone(referral.status)}>{formatValue(referral.status)}</Badge>
                  </div>
                  <p className="mt-3 text-muted-foreground">Case manager: {referral.caseManagerName || referral.caseManagerOrganization}</p>
                  <p className="mt-2 text-xs text-muted-foreground">Submitted {formatDate(referral.createdAt)}</p>
                </div>
              ))}
              {!referrals.length ? <p className="text-sm text-muted-foreground">No referrals yet.</p> : null}
            </div>
          </Card>
          <Card>
            <h2 className="text-xl font-semibold">Recent public leads</h2>
            <div className="mt-4 grid gap-3">
              {leads.map((lead) => (
                <div className="ac-panel-card p-4 text-sm" key={lead.id}>
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold">{lead.name}</p>
                      <p className="mt-1 text-muted-foreground">
                        {lead.email} · {lead.profile.programName}
                      </p>
                    </div>
                    <Badge tone={statusTone(lead.status)}>{formatValue(lead.status)}</Badge>
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground">Submitted {formatDate(lead.createdAt)} to {lead.aftercareOrg.name}</p>
                </div>
              ))}
              {!leads.length ? <p className="text-sm text-muted-foreground">No public leads yet.</p> : null}
            </div>
          </Card>
          </div>
        </div>
      ) : null}

      {activeTab === "claims" ? (
        <div className="mt-6 grid gap-4">
          <SummaryCards
            items={[
              ["Pending claims", pendingClaimCount.toString()],
              ["Total claims", profileClaims.length.toString()],
              ["Approved claims", profileClaims.filter((claim) => claim.status === "approved").length.toString()],
              ["Rejected claims", profileClaims.filter((claim) => claim.status === "rejected").length.toString()]
            ]}
          />
        <Card>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-3">
                <Handshake className="text-primary" size={24} />
                <h2 className="text-xl font-semibold">Profile claims</h2>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">
                Review ownership requests for unclaimed homes and programs before transferring dashboard access.
              </p>
            </div>
            <Badge tone="warning">{pendingClaimCount} pending</Badge>
          </div>
          {reviewMessage ? (
            <p className="ac-panel-card mt-4 p-3 text-sm font-semibold text-primary">
              {reviewMessage}
            </p>
          ) : null}
          <div className="mt-5 overflow-x-auto">
            <table className="w-full min-w-[1080px] text-left text-sm">
              <thead className="border-b border-border text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="py-3 pr-4">Profile</th>
                  <th className="py-3 pr-4">Claimant</th>
                  <th className="py-3 pr-4">Relationship</th>
                  <th className="py-3 pr-4">Status</th>
                  <th className="py-3 pr-4">Submitted</th>
                  <th className="py-3 pr-4">Review</th>
                </tr>
              </thead>
              <tbody>
                {profileClaims.map((claim) => (
                  <tr className="border-b border-border align-top last:border-0" key={claim.id}>
                    <td className="py-4 pr-4">
                      <Link className="font-semibold underline-offset-4 hover:underline" href={`/profiles/${claim.profile.slug}?preview=1`}>
                        {claim.profile.programName}
                      </Link>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {profileLabel(claim.profile.type)} · {[claim.profile.publicCity, claim.profile.publicState].filter(Boolean).join(", ")}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Current org: {claim.profile.organization.name}
                      </p>
                    </td>
                    <td className="py-4 pr-4">
                      <p className="font-semibold">{claim.claimantName}</p>
                      <p className="mt-1 text-muted-foreground">{claim.claimantEmail}</p>
                      {claim.claimantPhone ? <p className="mt-1 text-muted-foreground">{claim.claimantPhone}</p> : null}
                      <p className="mt-2 text-xs text-muted-foreground">
                        Account org: {claim.claimantUser?.organization?.name || "Not connected"}
                      </p>
                    </td>
                    <td className="max-w-sm py-4 pr-4">
                      <p className="font-medium">{claim.claimantRole || "Role not listed"} · {claim.claimantOrganization || "Organization not listed"}</p>
                      <p className="mt-2 leading-6 text-muted-foreground">{claim.relationshipToProgram || "No relationship details provided."}</p>
                      {claim.notes ? <p className="mt-2 text-xs leading-5 text-muted-foreground">Notes: {claim.notes}</p> : null}
                    </td>
                    <td className="py-4 pr-4">
                      <Badge tone={statusTone(claim.status)}>{formatValue(claim.status)}</Badge>
                      {claim.reviewedByUser ? (
                        <p className="mt-2 text-xs text-muted-foreground">By {claim.reviewedByUser.email}</p>
                      ) : null}
                    </td>
                    <td className="py-4 pr-4 text-muted-foreground">
                      {formatDate(claim.submittedAt)}
                      {claim.reviewedAt ? <p className="mt-1 text-xs">Reviewed {formatDate(claim.reviewedAt)}</p> : null}
                    </td>
                    <td className="py-4 pr-4">
                      {claim.status === "pending" ? (
                        <form action={reviewProfileClaimRequest} className="grid gap-2">
                          <input name="claimRequestId" type="hidden" value={claim.id} />
                          <textarea
                            className="min-h-16 rounded-md border border-border p-2 text-sm"
                            name="reviewerNotes"
                            placeholder="Optional notes"
                          />
                          <div className="flex flex-wrap gap-2">
                            <button
                              className="focus-ring min-h-9 rounded-md border border-border bg-white px-3 text-sm font-semibold"
                              name="decision"
                              value="rejected"
                            >
                              Reject
                            </button>
                            <button
                              className="focus-ring min-h-9 rounded-md bg-primary px-3 text-sm font-semibold text-primary-foreground"
                              name="decision"
                              value="approved"
                            >
                              Approve claim
                            </button>
                          </div>
                        </form>
                      ) : (
                        <p className="max-w-xs text-sm text-muted-foreground">{claim.reviewerNotes || "No notes added."}</p>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!profileClaims.length ? (
              <p className="ac-panel-card mt-4 p-4 text-sm text-muted-foreground">
                No profile claims have been submitted yet.
              </p>
            ) : null}
          </div>
        </Card>
        </div>
      ) : null}

      {activeTab === "verification" ? (
        <div className="mt-6 grid gap-4">
          <SummaryCards
            items={[
              ["Pending applications", pendingApplicationCount.toString()],
              ["Verification queue", pendingVerificationCount.toString()],
              ["Open flags", openFlagCount.toString()],
              ["Total reviews", applicationReviews.length.toString()]
            ]}
          />
        <div className="grid gap-4 xl:grid-cols-[minmax(0,1.3fr)_minmax(320px,0.7fr)]">
          <Card className="xl:col-span-2">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-3">
                  <FileCheck2 className="text-primary" size={24} />
                  <h2 className="text-xl font-semibold">Onboarding applications</h2>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">
                  Review submitted referent, home, and program applications. Approving homes and programs gives them the verified badge.
                </p>
              </div>
              <Badge tone="warning">{pendingApplicationCount} pending</Badge>
            </div>
            {reviewMessage ? (
              <p className="ac-panel-card mt-4 p-3 text-sm font-semibold text-primary">
                {reviewMessage}
              </p>
            ) : null}
            <div className="mt-5 overflow-x-auto">
              <table className="w-full min-w-[980px] text-left text-sm">
                <thead className="border-b border-border text-xs uppercase tracking-wide text-muted-foreground">
                  <tr>
                    <th className="py-3 pr-4">Application</th>
                    <th className="py-3 pr-4">Organization</th>
                    <th className="py-3 pr-4">Submitted by</th>
                    <th className="py-3 pr-4">Status</th>
                    <th className="py-3 pr-4">Submitted</th>
                    <th className="py-3 pr-4">Review</th>
                  </tr>
                </thead>
                <tbody>
                  {applicationReviews.map((review) => {
                    const subjectName = review.profile?.programName || review.organization.name;

                    return (
                      <tr className="border-b border-border align-top last:border-0" key={review.id}>
                        <td className="py-4 pr-4">
                          {review.profile ? (
                            <Link className="font-semibold underline-offset-4 hover:underline" href={`/profiles/${review.profile.slug}?preview=1`}>
                              {subjectName}
                            </Link>
                          ) : (
                            <p className="font-semibold">{subjectName}</p>
                          )}
                          <p className="mt-1 text-xs text-muted-foreground">
                            {reviewSubjectLabel(review.subjectType)}
                            {review.profile ? ` · ${profileLabel(review.profile.type)}` : ""}
                          </p>
                          {review.profile ? (
                            <p className="mt-1 text-xs text-muted-foreground">
                              {[review.profile.publicCity, review.profile.publicState].filter(Boolean).join(", ")}
                            </p>
                          ) : null}
                        </td>
                        <td className="py-4 pr-4">
                          <p className="font-medium">{review.organization.name}</p>
                          <p className="mt-1 text-xs text-muted-foreground">{organizationLabel(review.organization.type)}</p>
                        </td>
                        <td className="py-4 pr-4 text-muted-foreground">{review.submittedByEmail || review.organization.email || "Not set"}</td>
                        <td className="py-4 pr-4">
                          <Badge tone={statusTone(review.status)}>{formatValue(review.status)}</Badge>
                          {review.reviewedByUser ? (
                            <p className="mt-2 text-xs text-muted-foreground">By {review.reviewedByUser.email}</p>
                          ) : null}
                        </td>
                        <td className="py-4 pr-4 text-muted-foreground">
                          {formatDate(review.submittedAt)}
                          {review.reviewedAt ? <p className="mt-1 text-xs">Reviewed {formatDate(review.reviewedAt)}</p> : null}
                        </td>
                        <td className="py-4 pr-4">
                          {review.status === AdminReviewStatus.pending ? (
                            <form action={reviewOnboardingSubmission} className="grid gap-2">
                              <input name="reviewId" type="hidden" value={review.id} />
                              <textarea
                                className="min-h-16 rounded-md border border-border p-2 text-sm"
                                name="reviewerNotes"
                                placeholder="Optional notes"
                              />
                              <div className="flex flex-wrap gap-2">
                                <button
                                  className="focus-ring min-h-9 rounded-md border border-border bg-white px-3 text-sm font-semibold"
                                  name="decision"
                                  value="rejected"
                                >
                                  Reject
                                </button>
                                <button
                                  className="focus-ring min-h-9 rounded-md bg-primary px-3 text-sm font-semibold text-primary-foreground"
                                  name="decision"
                                  value="approved"
                                >
                                  Approve
                                </button>
                              </div>
                            </form>
                          ) : (
                            <p className="max-w-xs text-sm text-muted-foreground">{review.reviewerNotes || "No notes added."}</p>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {!applicationReviews.length ? (
                <p className="ac-panel-card mt-4 p-4 text-sm text-muted-foreground">
                  No onboarding applications have been submitted yet.
                </p>
              ) : null}
            </div>
          </Card>

          <Card>
            <div className="flex items-center gap-3">
              <FileCheck2 className="text-primary" size={24} />
              <h2 className="text-xl font-semibold">Verification queue</h2>
            </div>
            <div className="mt-5 overflow-x-auto">
              <table className="w-full min-w-[760px] text-left text-sm">
                <thead className="border-b border-border text-xs uppercase tracking-wide text-muted-foreground">
                  <tr>
                    <th className="py-3 pr-4">Profile</th>
                    <th className="py-3 pr-4">Document</th>
                    <th className="py-3 pr-4">Status</th>
                    <th className="py-3 pr-4">Expires</th>
                    <th className="py-3 pr-4">Submitted</th>
                  </tr>
                </thead>
                <tbody>
                  {verificationDocuments.map((document) => (
                    <tr className="border-b border-border last:border-0" key={document.id}>
                      <td className="py-4 pr-4">
                        <Link className="font-semibold underline-offset-4 hover:underline" href={`/profiles/${document.profile.slug}?preview=1`}>
                          {document.profile.programName}
                        </Link>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {document.profile.organization.name}
                        </p>
                      </td>
                      <td className="py-4 pr-4">{document.documentType}</td>
                      <td className="py-4 pr-4">
                        <Badge tone={statusTone(document.status)}>{formatValue(document.status)}</Badge>
                      </td>
                      <td className="py-4 pr-4 text-muted-foreground">{formatDate(document.expiresAt)}</td>
                      <td className="py-4 pr-4 text-muted-foreground">{formatDate(document.submittedAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {!verificationDocuments.length ? (
                <p className="ac-panel-card mt-4 p-4 text-sm text-muted-foreground">
                  No verification documents have been submitted yet.
                </p>
              ) : null}
            </div>
          </Card>

          <Card>
            <div className="flex items-center gap-3">
              <Flag className="text-primary" size={24} />
              <h2 className="text-xl font-semibold">Flags</h2>
            </div>
            <div className="mt-4 grid gap-3">
              {flags.map((flag) => (
                <div className="ac-panel-card p-4 text-sm" key={flag.id}>
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold">{formatValue(flag.flagType)}</p>
                      <Link className="mt-1 block text-muted-foreground underline-offset-4 hover:underline" href={`/profiles/${flag.profile.slug}?preview=1`}>
                        {flag.profile.programName}
                      </Link>
                    </div>
                    <Badge tone={statusTone(flag.status)}>{formatValue(flag.status)}</Badge>
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground">Reported {formatDate(flag.createdAt)}</p>
                </div>
              ))}
              {!flags.length ? <p className="text-sm text-muted-foreground">No flags yet.</p> : null}
            </div>
          </Card>
          </div>
        </div>
      ) : null}
    </main>
  );
}
