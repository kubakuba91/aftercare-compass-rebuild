import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { OrganizationType, ProfileOwnershipStatus } from "@prisma/client";
import { BadgeCheck, CheckCircle2, HandHeart, Mail, MapPin, Phone, PillBottle, Send, ShieldCheck, Users, Video } from "lucide-react";
import { ApproximateLocationMap } from "@/components/public/approximate-location-map";
import { ExpandableRichText } from "@/components/public/expandable-rich-text";
import { FavoriteListingButton } from "@/components/public/favorite-listing-button";
import { ProfileOwnershipBadge } from "@/components/public/profile-ownership-badge";
import { PublicSearchHeader } from "@/components/public/public-search-header";
import { TrustBadge } from "@/components/public/trust-badge";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { getClerkSessionUserId, getCurrentAppUser, getRequiredClerkIdentity } from "@/lib/current-user";
import { canDisplayVerifiedBadge, canReceiveDirectReferrals, canSubmitReferrals, canUseLiveAvailability } from "@/lib/feature-gates";
import { formatPhoneForDisplay, normalizePhoneNumber } from "@/lib/phone";
import { prisma } from "@/lib/prisma";
import { richTextHtml } from "@/lib/rich-text";
import { createProfileClaimRequest, createProfileReferral, createPublicProfileLead } from "./actions";

export const dynamic = "force-dynamic";

function listOrFallback(values: string[], fallback = "Not listed") {
  return values.length ? values.join(", ") : fallback;
}

function populationsServed(values: string[], legacyValue: string | null) {
  if (values.length) {
    return values;
  }

  if (legacyValue === "men") {
    return ["Men"];
  }

  if (legacyValue === "women") {
    return ["Women"];
  }

  if (legacyValue === "lgbtq") {
    return ["LGBTQ+"];
  }

  if (legacyValue === "both") {
    return ["Men", "Women"];
  }

  return [];
}

function availabilityText(profile: {
  type: string;
  bedsAvailable: number | null;
  acceptingNewPatients: boolean | null;
}, canShowLiveAvailability = true) {
  if (profile.type === "sober_living") {
    return canShowLiveAvailability && profile.bedsAvailable && profile.bedsAvailable > 0
      ? "Available now"
      : "Call for availability";
  }

  return profile.acceptingNewPatients ? "Accepting patients" : "Call for availability";
}

function formatPricePerWeek(value: number | null) {
  if (!value) {
    return null;
  }

  return `$${value}/week`;
}

function formatMoveInCost(value: string | null) {
  const text = value?.trim();

  if (!text) {
    return null;
  }

  const amount = text.match(/\d[\d,]*/)?.[0];

  return amount ? `$${amount} Move-in fee` : `${text} Move-in fee`;
}

function telHref(value: string) {
  const normalized = normalizePhoneNumber(value);
  const fallback = value.replace(/[^\d+]/g, "");

  return `tel:${normalized || fallback}`;
}

function ContactForm({
  profile,
  leadStatus,
  notice
}: {
  profile: { id: string; slug: string };
  leadStatus?: string;
  notice?: string;
}) {
  return (
    <Card className="h-fit scroll-mt-24" id="claim">
      <div className="flex items-center gap-2">
        <Mail size={18} />
        <h2 className="font-semibold">Contact this program</h2>
      </div>
      <p className="mt-3 text-sm leading-6 text-muted-foreground">
        Send a contact request to the provider. This creates an internal lead for their team.
      </p>
      {notice ? (
        <div className="ac-panel-card mt-4 p-3 text-sm font-semibold">
          {notice}
        </div>
      ) : null}
      {leadStatus === "sent" ? (
        <div className="mt-4 rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm font-semibold text-emerald-800">
          Contact request sent.
        </div>
      ) : null}
      {leadStatus === "invalid" ? (
        <div className="mt-4 rounded-md border border-accent/30 bg-accent/10 p-3 text-sm font-semibold">
          Please complete the required contact fields.
        </div>
      ) : null}
      <form action={createPublicProfileLead} className="mt-5 grid gap-3">
        <input name="profileId" type="hidden" value={profile.id} />
        <input name="slug" type="hidden" value={profile.slug} />
        <input aria-hidden="true" autoComplete="off" className="hidden" name="companyWebsite" tabIndex={-1} />
        <label className="grid gap-2 text-sm font-medium">
          Name
          <input className="min-h-10 rounded-md border border-border px-3" name="name" required />
        </label>
        <label className="grid gap-2 text-sm font-medium">
          Email
          <input className="min-h-10 rounded-md border border-border px-3" name="email" required type="email" />
        </label>
        <label className="grid gap-2 text-sm font-medium">
          Phone
          <input className="min-h-10 rounded-md border border-border px-3" name="phone" />
        </label>
        <label className="grid gap-2 text-sm font-medium">
          Message
          <textarea className="min-h-28 rounded-md border border-border p-3" name="message" required />
        </label>
        <button className="focus-ring min-h-10 rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground">
          Send contact request
        </button>
      </form>
    </Card>
  );
}

function PlaceClientForm({
  profile,
  referralStatus,
  userName,
  userEmail,
  organizationName
}: {
  profile: { id: string; slug: string };
  referralStatus?: string;
  userName: string;
  userEmail: string;
  organizationName: string;
}) {
  return (
    <Card className="h-fit">
      <div className="flex items-center gap-2">
        <Send size={18} />
        <h2 className="font-semibold">Place client</h2>
      </div>
      <p className="mt-3 text-sm leading-6 text-muted-foreground">
        Submit a de-identified referral. Do not include patient name, DOB, address, phone, email, or MRN.
      </p>
      {referralStatus === "sent" ? (
        <div className="mt-4 rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm font-semibold text-emerald-800">
          Referral sent.
        </div>
      ) : null}
      {referralStatus === "invalid" ? (
        <div className="mt-4 rounded-md border border-accent/30 bg-accent/10 p-3 text-sm font-semibold">
          Please complete the referral fields and avoid direct patient identifiers.
        </div>
      ) : null}
      <form action={createProfileReferral} className="mt-5 grid gap-3">
        <input name="aftercareProfileId" type="hidden" value={profile.id} />
        <input name="slug" type="hidden" value={profile.slug} />
        <input aria-hidden="true" autoComplete="off" className="hidden" name="companyWebsite" tabIndex={-1} />
        <label className="grid gap-2 text-sm font-medium">
          Case manager name
          <input className="min-h-10 rounded-md border border-border px-3" defaultValue={userName} name="caseManagerName" required />
        </label>
        <label className="grid gap-2 text-sm font-medium">
          Case manager email
          <input className="min-h-10 rounded-md border border-border px-3" defaultValue={userEmail} name="caseManagerEmail" required type="email" />
        </label>
        <label className="grid gap-2 text-sm font-medium">
          Case manager phone
          <input className="min-h-10 rounded-md border border-border px-3" name="caseManagerPhone" required />
        </label>
        <label className="grid gap-2 text-sm font-medium">
          Organization name
          <input className="min-h-10 rounded-md border border-border px-3" defaultValue={organizationName} name="caseManagerOrganization" required />
        </label>
        <label className="grid gap-2 text-sm font-medium">
          Client age range
          <select className="min-h-10 rounded-md border border-border px-3" name="clientAgeRange" required>
            <option value="">Select one</option>
            <option value="18_25">18-25</option>
            <option value="26_35">26-35</option>
            <option value="36_45">36-45</option>
            <option value="46_55">46-55</option>
            <option value="55_plus">55+</option>
          </select>
        </label>
        <label className="grid gap-2 text-sm font-medium">
          Support category
          <select className="min-h-10 rounded-md border border-border px-3" name="supportCategory" required>
            <option value="">Select one</option>
            <option value="substance_use">Substance use recovery</option>
            <option value="mental_health">Mental health support</option>
            <option value="co_occurring">Co-occurring support</option>
            <option value="other">Other</option>
          </select>
        </label>
        <label className="grid gap-2 text-sm font-medium">
          Insurance category
          <select className="min-h-10 rounded-md border border-border px-3" name="insuranceCategory" required>
            <option value="">Select one</option>
            <option value="medicaid">Medicaid</option>
            <option value="medicare">Medicare</option>
            <option value="commercial">Commercial</option>
            <option value="self_pay">Self-pay</option>
          </select>
        </label>
        <label className="grid gap-2 text-sm font-medium">
          Preferred start window
          <select className="min-h-10 rounded-md border border-border px-3" name="preferredStartWindow" required>
            <option value="">Select one</option>
            <option value="within_1_week">Within 1 week</option>
            <option value="1_2_weeks">1-2 weeks</option>
            <option value="2_4_weeks">2-4 weeks</option>
            <option value="flexible">Flexible</option>
          </select>
        </label>
        <fieldset className="grid gap-2">
          <legend className="text-sm font-medium">Special needs/preferences</legend>
          {["MAT-friendly", "Gender-specific housing", "12-Step oriented", "Pet friendly"].map((item) => (
            <label key={item} className="flex items-center gap-2 text-sm">
              <input name="specialNeeds" type="checkbox" value={item} />
              {item}
            </label>
          ))}
        </fieldset>
        <label className="grid gap-2 text-sm font-medium">
          Reason for referral
          <textarea className="min-h-28 rounded-md border border-border p-3" name="reasonForReferral" required />
        </label>
        <button className="focus-ring min-h-10 rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground">
          Send referral
        </button>
      </form>
    </Card>
  );
}

function ClaimProfileCard({
  profile,
  claimStatus,
  isSignedIn,
  canClaim,
  userName,
  userEmail,
  organizationName
}: {
  profile: { id: string; slug: string; programName: string; ownershipStatus: ProfileOwnershipStatus };
  claimStatus?: string;
  isSignedIn: boolean;
  canClaim: boolean;
  userName: string;
  userEmail: string;
  organizationName: string;
}) {
  const claimMessages: Record<string, { tone: string; message: string }> = {
    submitted: { tone: "border-emerald-200 bg-emerald-50 text-emerald-800", message: "Claim request submitted. Our team will review it before transferring access." },
    pending: { tone: "border-emerald-200 bg-emerald-50 text-emerald-800", message: "Your claim is already in review." },
    under_review: { tone: "border-accent/30 bg-accent/10", message: "A claim is already under review for this profile." },
    invalid: { tone: "border-accent/30 bg-accent/10", message: "Please complete your role, organization, and relationship to this program before submitting." },
    provider_required: { tone: "border-accent/30 bg-accent/10", message: "Use an aftercare provider account to claim this profile." },
    provider_type: { tone: "border-accent/30 bg-accent/10", message: "This profile type does not match your provider account." },
    unavailable: { tone: "border-accent/30 bg-accent/10", message: "This profile has already been claimed." }
  };
  const statusMessage = claimStatus ? claimMessages[claimStatus] : null;

  return (
    <Card className="h-fit">
      <div className="flex items-center gap-2">
        <ShieldCheck size={18} />
        <h2 className="font-semibold">Claim this profile</h2>
      </div>
      <p className="mt-3 text-sm leading-6 text-muted-foreground">
        Request access if you manage this home or program. A system admin will verify the relationship before transferring the listing.
      </p>
      {statusMessage ? (
        <div className={`mt-4 rounded-md border p-3 text-sm font-semibold ${statusMessage.tone}`}>
          {statusMessage.message}
        </div>
      ) : null}

      {profile.ownershipStatus === ProfileOwnershipStatus.claim_pending ? (
        <p className="mt-4 text-sm font-semibold text-muted-foreground">This claim is currently being reviewed.</p>
      ) : !isSignedIn ? (
        <div className="mt-5 flex flex-wrap gap-3">
          <Link
            className="focus-ring inline-flex min-h-10 items-center rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground"
            href={`/sign-in?redirect_url=${encodeURIComponent(`/profiles/${profile.slug}`)}`}
          >
            Sign in to claim
          </Link>
          <Link
            className="focus-ring inline-flex min-h-10 items-center rounded-md border border-border bg-white px-4 text-sm font-semibold"
            href={`/sign-up?redirect_url=${encodeURIComponent(`/profiles/${profile.slug}`)}`}
          >
            Create account
          </Link>
        </div>
      ) : canClaim ? (
        <form action={createProfileClaimRequest} className="mt-5 grid gap-3">
          <input name="profileId" type="hidden" value={profile.id} />
          <input name="slug" type="hidden" value={profile.slug} />
          <input aria-hidden="true" autoComplete="off" className="hidden" name="companyWebsite" tabIndex={-1} />
          <label className="grid gap-2 text-sm font-medium">
            Your name
            <input className="min-h-10 rounded-md border border-border px-3" defaultValue={userName} minLength={2} name="claimantName" required />
          </label>
          <label className="grid gap-2 text-sm font-medium">
            Work email
            <input className="min-h-10 rounded-md border border-border px-3" defaultValue={userEmail} name="claimantEmail" required type="email" />
          </label>
          <label className="grid gap-2 text-sm font-medium">
            Phone
            <input className="min-h-10 rounded-md border border-border px-3" name="claimantPhone" />
          </label>
          <label className="grid gap-2 text-sm font-medium">
            Your role
            <input className="min-h-10 rounded-md border border-border px-3" minLength={2} name="claimantRole" placeholder="Owner, director, manager..." required />
          </label>
          <label className="grid gap-2 text-sm font-medium">
            Organization
            <input className="min-h-10 rounded-md border border-border px-3" defaultValue={organizationName} minLength={2} name="claimantOrganization" required />
          </label>
          <label className="grid gap-2 text-sm font-medium">
            Relationship to this program
            <textarea className="min-h-24 rounded-md border border-border p-3" minLength={2} name="relationshipToProgram" required />
          </label>
          <label className="grid gap-2 text-sm font-medium">
            Notes
            <textarea className="min-h-24 rounded-md border border-border p-3" name="notes" />
          </label>
          <button className="focus-ring min-h-10 rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground">
            Submit claim
          </button>
        </form>
      ) : (
        <p className="mt-4 text-sm font-semibold text-muted-foreground">
          Claiming is available from an aftercare provider account that matches this profile type.
        </p>
      )}
    </Card>
  );
}

export default async function PublicProfilePage({
  params,
  searchParams
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ lead?: string; referral?: string; preview?: string; claim?: string }>;
}) {
  const [{ slug }, query, appUser, clerkUserId] = await Promise.all([
    params,
    searchParams,
    getCurrentAppUser(),
    getClerkSessionUserId()
  ]);
  const clerkIdentity = !appUser && clerkUserId ? await getRequiredClerkIdentity().catch(() => null) : null;
  const profile = await prisma.aftercareProfile.findUnique({
    where: {
      slug
    },
    include: {
      organization: {
        select: {
          type: true,
          subscriptionPlan: true,
          subscriptionStatus: true
        }
      },
      continuedCareAssociations: {
        where: {
          continuedCareProfile: {
            status: "published"
          }
        },
        orderBy: { createdAt: "asc" },
        include: {
          continuedCareProfile: {
            select: {
              id: true,
              slug: true,
              programName: true,
              publicCity: true,
              publicState: true,
              levelsOfCare: true,
              acceptingNewPatients: true,
              organization: {
                select: {
                  type: true,
                  subscriptionPlan: true,
                  subscriptionStatus: true
                }
              },
              verificationTier: true,
              ownershipStatus: true
            }
          }
        }
      },
      images: { orderBy: [{ isCover: "desc" }, { sortOrder: "asc" }, { createdAt: "asc" }] }
    }
  });

  if (!profile) {
    notFound();
  }

  const canPreviewDraft =
    query.preview === "1" &&
    appUser?.orgId === profile.orgId &&
    appUser.role.startsWith("aftercare");

  if (profile.status !== "published" && !canPreviewDraft) {
    notFound();
  }

  const isSoberLiving = profile.type === "sober_living";
  const profileShowsLiveAvailability = !isSoberLiving || canUseLiveAvailability(profile.organization, profile);
  const profileShowsVerifiedBadge = canDisplayVerifiedBadge(profile.organization, profile);
  const publicLocation = [profile.publicCity, profile.publicState].filter(Boolean).join(", ");
  const priceLabel = formatPricePerWeek(profile.pricePerWeek);
  const moveInCostLabel = formatMoveInCost(profile.moveInCost);
  const servedPopulations = populationsServed(profile.populationServedOptions, profile.populationServed);
  const admissionsPhone = profile.admissionsContactPhone?.trim() ?? "";
  const isReferent = appUser?.role.startsWith("referent") ?? false;
  const isAftercareUser = appUser?.role.startsWith("aftercare") ?? false;
  const profileAcceptsDirectReferrals = canReceiveDirectReferrals(profile.organization, profile);
  const referentCanSubmitReferrals = canSubmitReferrals(appUser?.organization);
  const userName = [appUser?.firstName, appUser?.lastName].filter(Boolean).join(" ") || "";
  const claimantName = userName || [clerkIdentity?.firstName, clerkIdentity?.lastName].filter(Boolean).join(" ") || "";
  const claimantEmail = appUser?.email || clerkIdentity?.email || "";
  const canClaimProfile =
    Boolean(clerkUserId) &&
    (!appUser || isAftercareUser) &&
    ((profile.type === "sober_living" && appUser?.organization?.type === OrganizationType.aftercare_sober_living) ||
      (profile.type === "continued_care" && appUser?.organization?.type === OrganizationType.aftercare_continued_care) ||
      !appUser?.orgId);
  const favorite = isReferent && appUser?.orgId
    ? await prisma.favorite.findUnique({
        where: {
          orgId_profileId: {
            orgId: appUser.orgId,
            profileId: profile.id
          }
        },
        select: { id: true }
      })
    : null;

  return (
    <>
      <PublicSearchHeader
        defaultLocation={publicLocation}
        defaultType={profile.type}
        defaultAvailability={
          (isSoberLiving ? profile.bedsAvailable : profile.acceptingNewPatients)
            ? "available"
            : ""
        }
        isSignedIn={Boolean(appUser)}
      />
      <main className="shell py-8">
        <div className="mb-5">
          <Link className="text-sm font-semibold text-primary" href="/search">
            Back to search
          </Link>
        </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <section>
          <div className="rounded-lg border border-border bg-white p-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-3xl font-semibold">{profile.programName}</h1>
                <div className="flex flex-wrap gap-2">
                  <TrustBadge isVerified={profileShowsVerifiedBadge} verificationTier={profile.verificationTier} />
                  <ProfileOwnershipBadge ownershipStatus={profile.ownershipStatus} />
                  <Badge
                    tone={
                      (isSoberLiving ? profileShowsLiveAvailability && profile.bedsAvailable : profile.acceptingNewPatients)
                        ? "success"
                        : "warning"
                    }
                  >
                    {availabilityText(profile, profileShowsLiveAvailability)}
                  </Badge>
                </div>
                <FavoriteListingButton
                  canFavorite={isReferent}
                  initialFavorited={Boolean(favorite)}
                  isSignedIn={Boolean(appUser)}
                  profileId={profile.id}
                  programName={profile.programName}
                />
              </div>
              {priceLabel || moveInCostLabel ? (
                <div className="shrink-0 text-right">
                  {priceLabel ? (
                    <>
                      <p className="text-xs font-semibold uppercase text-muted-foreground">Price</p>
                      <p className="text-lg font-semibold">{priceLabel}</p>
                    </>
                  ) : null}
                  {moveInCostLabel ? (
                    <span className="mt-2 inline-flex min-h-8 items-center rounded-full border border-emerald-200 bg-emerald-50 px-3 text-sm font-semibold text-emerald-800">
                      {moveInCostLabel}
                    </span>
                  ) : null}
                </div>
              ) : null}
            </div>
            <p className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
              <MapPin size={16} />
              {publicLocation || "Location not listed"} · Exact address is private
            </p>
            {servedPopulations.length ? (
              <section aria-labelledby="populations-served-heading" className="mt-4 flex flex-wrap items-center gap-2">
                <h2 className="mr-1 flex items-center gap-2 text-sm font-semibold" id="populations-served-heading">
                  <Users aria-hidden="true" className="text-primary" size={17} />
                  Populations served
                </h2>
                {servedPopulations.map((population) => (
                  <Badge key={population}>{population}</Badge>
                ))}
              </section>
            ) : null}
            {admissionsPhone ? (
              <div className="mt-5 flex flex-col gap-4 rounded-[1.5rem] border border-border bg-surface p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-surface-secondary text-foreground">
                    <Phone aria-hidden="true" size={20} />
                  </span>
                  <div>
                    <p className="font-semibold">Call for availability</p>
                    <p className="text-sm text-muted-foreground">
                      Speak with admissions about current openings.
                    </p>
                  </div>
                </div>
                <a
                  className="focus-ring inline-flex min-h-11 items-center justify-center rounded-full bg-default px-5 text-sm font-semibold text-default-foreground transition hover:bg-surface-tertiary"
                  href={telHref(admissionsPhone)}
                >
                  {formatPhoneForDisplay(admissionsPhone)}
                </a>
              </div>
            ) : null}
            {profile.images.length ? (
              <div className="mt-6 grid gap-3 md:grid-cols-[1.35fr_1fr]">
                <div className="relative min-h-[28rem] overflow-hidden rounded-[1.25rem] border border-border bg-muted">
                  <Image
                    alt={profile.images[0]?.altText || profile.programName}
                    className="object-cover"
                    fill
                    priority
                    sizes="(min-width: 1024px) 680px, 100vw"
                    src={profile.images[0].url}
                    unoptimized
                  />
                </div>
                <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-1">
                  {profile.images.slice(1, 3).map((image, index) => {
                    const showAllPhotosLink = profile.images.length > 3 && index === 1;

                    return (
                    <div key={image.id} className="relative min-h-40 overflow-hidden rounded-[1.25rem] border border-border bg-muted">
                      <Image
                        alt={image.altText || profile.programName}
                        className="object-cover"
                        fill
                        sizes="(min-width: 1024px) 280px, 50vw"
                        src={image.url}
                        unoptimized
                      />
                      {showAllPhotosLink ? (
                        <Link
                          className="focus-ring absolute bottom-4 right-4 inline-flex min-h-11 items-center justify-center rounded-full bg-surface px-4 text-sm font-semibold text-foreground shadow-lg transition hover:bg-surface-secondary"
                          href={`/profiles/${profile.slug}/photos${canPreviewDraft ? "?preview=1" : ""}`}
                        >
                          View all photos
                        </Link>
                      ) : null}
                    </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="mt-6 rounded-lg border border-dashed border-border bg-muted/40 p-6">
                <p className="text-sm font-semibold">Photos not added yet</p>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  This provider has not uploaded profile images yet.
                </p>
              </div>
            )}
          </div>

          <div className="mt-5 grid gap-4">
            {!isSoberLiving ? (
              <Card>
                <CheckCircle2 className="text-primary" size={22} />
                <h2 className="mt-3 text-xl font-semibold">Program availability</h2>
                <p className="mt-3 text-sm leading-6 text-muted-foreground">
                  {availabilityText(profile)}
                  {profile.availabilityNotes ? ` · ${profile.availabilityNotes}` : ""}
                </p>
              </Card>
            ) : null}

            {isSoberLiving && profile.continuedCareAssociations.length ? (
              <Card>
                <HandHeart className="text-primary" size={22} />
                <h2 className="mt-3 text-xl font-semibold">Associated continued care</h2>
                <div className="mt-4 grid gap-3">
                  {profile.continuedCareAssociations.map((association) => {
                    const continuedCareProfile = association.continuedCareProfile;
                    const associatedLocation = [
                      continuedCareProfile.publicCity,
                      continuedCareProfile.publicState
                    ].filter(Boolean).join(", ");

                    return (
                      <Link
                        key={association.id}
                        className="focus-ring block rounded-md border border-border bg-white p-4 transition hover:border-primary/40"
                        href={`/profiles/${continuedCareProfile.slug}`}
                      >
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div>
                            <p className="font-semibold">{continuedCareProfile.programName}</p>
                            <p className="mt-1 text-sm text-muted-foreground">
                              {associatedLocation || "Location not listed"}
                            </p>
                          </div>
                          <TrustBadge
                            isVerified={canDisplayVerifiedBadge(
                              continuedCareProfile.organization,
                              continuedCareProfile
                            )}
                            verificationTier={continuedCareProfile.verificationTier}
                          />
                        </div>
                        <div className="mt-3 flex flex-wrap gap-2">
                          {continuedCareProfile.acceptingNewPatients ? (
                            <Badge tone="success">Accepting patients</Badge>
                          ) : null}
                          {continuedCareProfile.levelsOfCare.slice(0, 2).map((level) => (
                            <Badge key={level}>{level}</Badge>
                          ))}
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </Card>
            ) : null}

            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <h2 className="font-semibold">Services and amenities</h2>
                <dl className="mt-4 grid gap-3 text-sm">
                  <div>
                    <dt className="flex items-center gap-2 font-semibold text-foreground">
                      <Users className="text-primary" size={16} />
                      Specialty populations
                    </dt>
                    <dd className="font-medium">{listOrFallback(profile.specialtyPopulations)}</dd>
                  </div>
                  <div>
                    <dt className="flex items-center gap-2 font-semibold text-foreground">
                      <HandHeart className="text-primary" size={16} />
                      Support services
                    </dt>
                    <dd className="font-medium">{listOrFallback(profile.supportServices)}</dd>
                  </div>
                  {isSoberLiving ? (
                    <div>
                      <dt className="flex items-center gap-2 font-semibold text-foreground">
                        <CheckCircle2 className="text-primary" size={16} />
                        Amenities
                      </dt>
                      <dd className="font-medium">{listOrFallback(profile.amenities)}</dd>
                    </div>
                  ) : (
                    <div>
                      <dt className="flex items-center gap-2 font-semibold text-foreground">
                        <CheckCircle2 className="text-primary" size={16} />
                        Programming schedule
                      </dt>
                      <dd className="font-medium">{listOrFallback(profile.programmingSchedule)}</dd>
                    </div>
                  )}
                  {!isSoberLiving ? (
                    <div>
                      <dt className="flex items-center gap-2 font-semibold text-foreground">
                        <HandHeart className="text-primary" size={16} />
                        How clients are accepted
                      </dt>
                      <dd className="font-medium">{listOrFallback(profile.clientAcceptanceMethods)}</dd>
                    </div>
                  ) : null}
                  {!isSoberLiving ? (
                    <div>
                      <dt className="flex items-center gap-2 font-semibold text-foreground">
                        <Users className="text-primary" size={16} />
                        Languages served
                      </dt>
                      <dd className="font-medium">{listOrFallback(profile.languagesServed)}</dd>
                    </div>
                  ) : null}
                </dl>
              </Card>

              <Card>
                <h2 className="font-semibold">Payment and clinical fit</h2>
                <dl className="mt-4 grid gap-3 text-sm">
                  <div>
                    <dt className="flex items-center gap-2 font-semibold text-foreground">
                      <ShieldCheck className="text-primary" size={16} />
                      Insurance/payment
                    </dt>
                    <dd className="font-medium">{listOrFallback(profile.insuranceAccepted)}</dd>
                  </div>
                  <div>
                    <dt className="flex items-center gap-2 font-semibold text-foreground">
                      <PillBottle className="text-primary" size={16} />
                      {isSoberLiving ? "MAT accepted" : "Medication services"}
                    </dt>
                    <dd className="font-medium">
                      {isSoberLiving ? listOrFallback(profile.matAccepted) : listOrFallback(profile.medicationServicesOffered)}
                    </dd>
                  </div>
                  {!isSoberLiving && profile.medicationServicesOffered.includes("MAT / Addiction medication management") ? (
                    <div>
                      <dt className="flex items-center gap-2 font-semibold text-foreground">
                        <PillBottle className="text-primary" size={16} />
                        MAT medications offered
                      </dt>
                      <dd className="font-medium">{listOrFallback(profile.matAccepted)}</dd>
                    </div>
                  ) : null}
                  {isSoberLiving ? (
                    <div>
                      <dt className="flex items-center gap-2 font-semibold text-foreground">
                        <BadgeCheck className="text-primary" size={16} />
                        Recovery Residence Level (NARR)
                      </dt>
                      <dd className="font-medium">{profile.recoveryResidenceLevel || "Not listed"}</dd>
                    </div>
                  ) : null}
                  {isSoberLiving ? (
                    <div>
                      <dt className="flex items-center gap-2 font-semibold text-foreground">
                        <CheckCircle2 className="text-primary" size={16} />
                        Intake turnaround
                      </dt>
                      <dd className="font-medium">{profile.intakeTurnaroundTime || "Not listed"}</dd>
                    </div>
                  ) : null}
                  <div>
                    <dt className="flex items-center gap-2 font-semibold text-foreground">
                      <BadgeCheck className="text-primary" size={16} />
                      Certifications
                    </dt>
                    <dd className="font-medium">{listOrFallback(profile.certificationsHeld)}</dd>
                  </div>
                  {!isSoberLiving ? (
                    <div>
                      <dt className="flex items-center gap-2 font-semibold text-foreground">
                        <BadgeCheck className="text-primary" size={16} />
                        Accreditations
                      </dt>
                      <dd className="font-medium">{listOrFallback(profile.accreditations)}</dd>
                    </div>
                  ) : null}
                  <div>
                    <dt className="flex items-center gap-2 font-semibold text-foreground">
                      <PillBottle className="text-primary" size={16} />
                      {isSoberLiving ? "Recovery Support Services" : "Clinical focus"}
                    </dt>
                    <dd className="font-medium">
                      {isSoberLiving ? listOrFallback(profile.recoverySupportServices) : listOrFallback(profile.clinicalFocus)}
                    </dd>
                  </div>
                </dl>
              </Card>
            </div>

            <Card>
              <h2 className="text-xl font-semibold">About</h2>
              {profile.description ? (
                <ExpandableRichText html={richTextHtml(profile.description)} />
              ) : (
                <p className="mt-3 text-sm leading-6 text-muted-foreground">
                  No description has been added yet.
                </p>
              )}
            </Card>

            {isSoberLiving && profile.houseRulesText ? (
              <Card>
                <h2 className="text-xl font-semibold">House rules</h2>
                <ExpandableRichText html={richTextHtml(profile.houseRulesText)} />
              </Card>
            ) : null}

            {profile.videoUrls.length ? (
              <Card>
                <Video className="text-primary" size={22} />
                <h2 className="mt-3 text-xl font-semibold">Videos</h2>
                <div className="mt-4 grid gap-2">
                  {profile.videoUrls.map((url) => (
                    <a
                      key={url}
                      className="text-sm font-semibold text-primary underline-offset-4 hover:underline"
                      href={url}
                      rel="noreferrer"
                      target="_blank"
                    >
                      {url}
                    </a>
                  ))}
                </div>
              </Card>
            ) : null}

            <Card>
              <MapPin className="text-primary" size={22} />
              <h2 className="mt-3 text-xl font-semibold">Location area</h2>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">
                {publicLocation || "Location not listed"}
              </p>
              <ApproximateLocationMap
                className="mt-4 border-0 p-0 shadow-none lg:static"
                listings={[
                  {
                    id: profile.id,
                    slug: profile.slug,
                    programName: profile.programName,
                    type: profile.type,
                    publicCity: profile.publicCity,
                    publicState: profile.publicState,
                    latitude: profile.latitude ? Number(profile.latitude) : null,
                    longitude: profile.longitude ? Number(profile.longitude) : null,
                    publicLatitude: profile.publicLatitude ? Number(profile.publicLatitude) : null,
                    publicLongitude: profile.publicLongitude ? Number(profile.publicLongitude) : null,
                    isAvailable: Boolean(
                      isSoberLiving
                        ? profileShowsLiveAvailability && profile.bedsAvailable
                        : profile.acceptingNewPatients
                    ),
                    selectionHref: `/profiles/${profile.slug}`
                  }
                ]}
                mapClassName="min-h-[280px] lg:min-h-[320px]"
                selectedListingId={profile.id}
              />
            </Card>
          </div>
        </section>

        {profile.ownershipStatus !== ProfileOwnershipStatus.claimed ? (
          <ClaimProfileCard
            canClaim={canClaimProfile}
            claimStatus={query.claim}
            isSignedIn={Boolean(clerkUserId)}
            organizationName={appUser?.organization?.name || ""}
            profile={profile}
            userEmail={claimantEmail}
            userName={claimantName}
          />
        ) : isReferent && profileAcceptsDirectReferrals && referentCanSubmitReferrals ? (
          <PlaceClientForm
            organizationName={appUser?.organization?.name || ""}
            profile={profile}
            referralStatus={query.referral}
            userEmail={appUser?.email || ""}
            userName={userName}
          />
        ) : isReferent ? (
          <ContactForm
            leadStatus={query.lead}
            notice={
              profileAcceptsDirectReferrals
                ? "Your current plan can use contact requests. Direct referral tools unlock when referral access is enabled."
                : "This provider is accepting general contact requests on their current listing."
            }
            profile={profile}
          />
        ) : isAftercareUser ? (
          <Card className="h-fit">
            <h2 className="font-semibold">Provider view</h2>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              Aftercare users can preview public profiles here. Use the dashboard to manage leads,
              referrals, and profile content.
            </p>
            <Link className="mt-4 inline-flex text-sm font-semibold text-primary" href="/dashboard/aftercare">
              Go to dashboard
            </Link>
          </Card>
        ) : (
          <ContactForm leadStatus={query.lead} profile={profile} />
        )}
      </div>
      </main>
    </>
  );
}
