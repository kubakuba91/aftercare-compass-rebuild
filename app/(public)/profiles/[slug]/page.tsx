import { isVirtualOnly, coverageLabel } from "@/lib/virtual-care";
import Link from "next/link";
import { notFound } from "next/navigation";
import { OrganizationType, ProfileOwnershipStatus } from "@prisma/client";
import { CheckCircle2, HandHeart, Mail, MapPin, Phone, Send, ShieldCheck, Video, House, CreditCard, Pill, ExternalLink } from "lucide-react";
import { ApproximateLocationMap } from "@/components/public/approximate-location-map";
import { ProfileGallery } from "@/components/public/profile-gallery";
import { Tag } from "@/components/ui/tag";
import { BackLink } from "@/components/public/back-link";
import { ExpandableRichText } from "@/components/public/expandable-rich-text";
import { FavoriteListingButton } from "@/components/public/favorite-listing-button";
import { ClaimProfileDialog } from "@/components/public/claim-profile-dialog";
import { ClaimOutreachStartTracker } from "@/components/public/claim-outreach-start-tracker";
import { ProfileOwnershipBadge } from "@/components/public/profile-ownership-badge";
import { PublicSearchHeader } from "@/components/public/public-search-header";
import { TrustBadge } from "@/components/public/trust-badge";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { ReferralFields } from "@/components/public/referral-fields";
import { ProfileDetailSections } from "@/components/public/profile-detail-sections";
import { getClerkSessionUserId, getCurrentAppUser, getRequiredClerkIdentity } from "@/lib/current-user";
import { canDisplayVerifiedBadge, canReceiveDirectReferrals, canSubmitReferrals, canUseLiveAvailability } from "@/lib/feature-gates";
import { formatPhoneForDisplay, normalizePhoneNumber } from "@/lib/phone";
import { findClaimOutreachByToken } from "@/lib/profile-claim-outreach";
import { dashboardAppUrl } from "@/lib/app-urls";
import { prisma } from "@/lib/prisma";
import { richTextHtml } from "@/lib/rich-text";
import { createProfileClaimRequest, createProfileReferral, createPublicProfileLead } from "./actions";

export const dynamic = "force-dynamic";

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

function telHref(value: string) {
  const normalized = normalizePhoneNumber(value);
  const fallback = value.replace(/[^\d+]/g, "");

  return `tel:${normalized || fallback}`;
}

function publicWebsiteHref(value: string | null) {
  const website = value?.trim();

  if (!website) {
    return null;
  }

  try {
    const url = new URL(website);
    return url.protocol === "http:" || url.protocol === "https:" ? url.toString() : null;
  } catch {
    return null;
  }
}

function ContactForm({
  profile,
  leadStatus,
  notice,
  userName = "",
  userEmail = "",
  userPhone = ""
}: {
  profile: { id: string; slug: string };
  leadStatus?: string;
  notice?: string;
  userName?: string;
  userEmail?: string;
  userPhone?: string;
}) {
  return (
    <Card className="h-fit scroll-mt-24" id="contact">
      <div className="flex items-center gap-2">
        <Mail size={18} />
        <h2 className="font-semibold">Contact this program</h2>
      </div>
      <p className="mt-3 text-sm leading-6 text-muted-foreground">
        Send a contact request to the provider.
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
          <span>Name <span className="text-muted-foreground">(required)</span></span>
          <input autoComplete="name" className="min-h-10 rounded-md border border-border px-3" defaultValue={userName} name="name" required />
        </label>
        <label className="grid gap-2 text-sm font-medium">
          <span>Email <span className="text-muted-foreground">(required)</span></span>
          <input autoComplete="email" className="min-h-10 rounded-md border border-border px-3" defaultValue={userEmail} name="email" required type="email" />
        </label>
        <label className="grid gap-2 text-sm font-medium">
          <span>Phone <span className="text-muted-foreground">(optional)</span></span>
          <input autoComplete="tel" className="min-h-10 rounded-md border border-border px-3" defaultValue={userPhone} name="phone" type="tel" />
        </label>
        <label className="grid gap-2 text-sm font-medium">
          <span>Message <span className="text-muted-foreground">(required)</span></span>
          <textarea className="min-h-28 rounded-md border border-border p-3" name="message" required />
        </label>
        <button className="focus-ring ac-button ac-button--primary">
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
  userPhone,
  organizationName,
  claimOutreachToken,
  invitedEmail
}: {
  profile: { id: string; slug: string };
  referralStatus?: string;
  userName: string;
  userEmail: string;
  userPhone: string;
  organizationName: string;
  claimOutreachToken?: string;
  invitedEmail?: string;
}) {
  return (
    <Card className="h-fit scroll-mt-24" id="contact">
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
        <ReferralFields contact={{ name: userName, email: userEmail, phone: userPhone, organization: organizationName }} />
        <button className="focus-ring ac-button ac-button--primary">
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
  organizationName,
  claimOutreachToken,
  invitedEmail
}: {
  profile: { id: string; slug: string; programName: string; ownershipStatus: ProfileOwnershipStatus };
  claimStatus?: string;
  isSignedIn: boolean;
  canClaim: boolean;
  userName: string;
  userEmail: string;
  organizationName: string;
  claimOutreachToken?: string;
  invitedEmail?: string;
}) {
  const claimMessages: Record<string, { tone: string; message: string }> = {
    submitted: { tone: "border-emerald-200 bg-emerald-50 text-emerald-800", message: "Claim request submitted. Our team will review it before transferring access." },
    pending: { tone: "border-emerald-200 bg-emerald-50 text-emerald-800", message: "Your claim is already in review." },
    under_review: { tone: "border-accent/30 bg-accent/10", message: "A claim is already under review for this profile." },
    invalid: { tone: "border-accent/30 bg-accent/10", message: "Please complete your role, organization, and relationship to this program before submitting." },
    organization_plan: { tone: "border-accent/30 bg-accent/10", message: "This program does not fit your organization’s delivery mode or current plan limits. Review your subscription or contact support before claiming." },
    provider_required: { tone: "border-accent/30 bg-accent/10", message: "Use an aftercare provider account to claim this profile." },
    provider_type: { tone: "border-accent/30 bg-accent/10", message: "This profile type does not match your provider account." },
    unavailable: { tone: "border-accent/30 bg-accent/10", message: "This profile has already been claimed." },
    invite_invalid: { tone: "border-accent/30 bg-accent/10", message: "This claim invitation is invalid or expired. You can still use the standard claim form." },
    invite_email: { tone: "border-accent/30 bg-accent/10", message: "Use the invited work email shown in the form to submit this claim." }
  };
  const statusMessage = claimStatus ? claimMessages[claimStatus] : null;
  const claimReturnPath = `/profiles/${profile.slug}${claimOutreachToken ? `?claimToken=${encodeURIComponent(claimOutreachToken)}` : "?claim=open"}#claim`;

  return (
    <div className="p-6">
      <div className="flex items-center gap-2">
        <ShieldCheck size={18} />
        <h2 className="pr-8 text-xl font-semibold" id="claim-dialog-title">Claim this profile</h2>
        <span className="sr-only"> — {profile.programName}</span>
      </div>
      <p className="mt-3 text-sm leading-6 text-muted-foreground">
        Request access if you manage {profile.programName}.
      </p>
      {statusMessage ? (
        <div className={`mt-4 rounded-md border p-3 text-sm font-semibold ${statusMessage.tone}`}>
          {statusMessage.message}
        </div>
      ) : null}

      {profile.ownershipStatus === ProfileOwnershipStatus.claimed ? (
        <p className="mt-4 text-sm text-muted-foreground">This profile has already been claimed.</p>
      ) : profile.ownershipStatus === ProfileOwnershipStatus.claim_pending ? (
        <p className="mt-4 text-sm font-semibold text-muted-foreground">This claim is currently being reviewed.</p>
      ) : !isSignedIn ? (
        <div className="mt-5 flex flex-wrap gap-3">
          <a
            className="focus-ring inline-flex min-h-10 items-center rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground"
            href={dashboardAppUrl(`/sign-in?redirect_url=${encodeURIComponent(claimReturnPath)}`)}
          >
            Sign in to claim
          </a>
          <a
            className="focus-ring inline-flex min-h-10 items-center rounded-md border border-border bg-white px-4 text-sm font-semibold"
            href={dashboardAppUrl(`/sign-up?redirect_url=${encodeURIComponent(claimReturnPath)}`)}
          >
            Create account
          </a>
        </div>
      ) : canClaim ? (
        <form action={createProfileClaimRequest} className="mt-5 grid gap-3">
          {claimOutreachToken ? <ClaimOutreachStartTracker token={claimOutreachToken} /> : null}
          <input name="profileId" type="hidden" value={profile.id} />
          <input name="slug" type="hidden" value={profile.slug} />
          {claimOutreachToken ? <input name="claimOutreachToken" type="hidden" value={claimOutreachToken} /> : null}
          <input aria-hidden="true" autoComplete="off" className="hidden" name="companyWebsite" tabIndex={-1} />
          <label className="grid gap-2 text-sm font-medium">
            Your name
            <input className="min-h-10 rounded-md border border-border px-3" defaultValue={userName} minLength={2} name="claimantName" required />
          </label>
          <label className="grid gap-2 text-sm font-medium">
            Work email
            <input className="min-h-10 rounded-md border border-border px-3" defaultValue={invitedEmail || userEmail} name="claimantEmail" readOnly={Boolean(invitedEmail)} required type="email" />
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
    </div>
  );
}

export default async function PublicProfilePage({
  params,
  searchParams
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ lead?: string; referral?: string; preview?: string; claim?: string; claimToken?: string }>;
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
          trialEndsAt: true, subscriptionPlan: true,
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
                  trialEndsAt: true, subscriptionPlan: true,
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

  const claimOutreach = query.claimToken
    ? await findClaimOutreachByToken(query.claimToken, profile.id)
    : null;
  const claimStatus = query.claim || (query.claimToken && !claimOutreach ? "invite_invalid" : undefined);

  const isSoberLiving = profile.type === "sober_living";
  const profileShowsLiveAvailability = !isSoberLiving || canUseLiveAvailability(profile.organization, profile);
  const profileShowsVerifiedBadge = canDisplayVerifiedBadge(profile.organization, profile);
  const availabilityLabel = availabilityText(profile, profileShowsLiveAvailability);
  const publicLocation = [profile.publicCity, profile.publicState].filter(Boolean).join(", ");
  const priceLabel = formatPricePerWeek(profile.pricePerWeek);
  const moveInCostLabel = profile.moveInCost?.trim() || null;
  const servedPopulations = populationsServed(profile.populationServedOptions, profile.populationServed);
  const admissionsPhone = profile.admissionsContactPhone?.trim() ?? "";
  const websiteHref = publicWebsiteHref(profile.websiteUrl);
  const virtual = isVirtualOnly(profile);
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
      <main className="shell ac-profile-page py-8">
        <div className="mb-5">
          <BackLink href="/search">
            Back to search
          </BackLink>
        </div>

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <section className="min-w-0">
          <Card className="ac-profile-hero">
            <div className="ac-profile-intro">
            <div>
            <div className="ac-profile-heading">
              <div className="ac-profile-title-group">
                <h1 className="ac-page-heading">{profile.programName}</h1>
                <TrustBadge compact={profileShowsVerifiedBadge} isVerified={profileShowsVerifiedBadge} verificationTier={profile.verificationTier} />
                <ProfileOwnershipBadge ownershipStatus={profile.ownershipStatus} />
                {availabilityLabel !== "Call for availability" ? <Badge tone="availability"><CheckCircle2 aria-hidden="true" size={14} />{availabilityLabel}</Badge> : null}
              </div>

            </div>
            <div className="ac-profile-location">
              <span><MapPin aria-hidden="true" size={17} />{virtual ? `Virtual Only · ${coverageLabel(profile.statesServed)}` : `${publicLocation || "Location not listed"} · Exact address is private`}</span>
              {websiteHref ? <a className="ac-inline-link" href={websiteHref} rel="noopener noreferrer" target="_blank">Visit website<ExternalLink aria-hidden="true" size={15} /></a> : null}
            </div>
            <div className="ac-profile-overview">
              <div className="ac-profile-tags">
                <div className="ac-tag-row">
                  {(isSoberLiving ? (profile.recoveryResidenceLevel ? [profile.recoveryResidenceLevel] : []) : profile.levelsOfCare).map(value => <Tag key={value}><House aria-hidden="true" size={15} />{value}</Tag>)}
                  {profile.insuranceAccepted.map(value => <Tag key={value}><CreditCard aria-hidden="true" size={15} />{value}</Tag>)}
                  {profile.matAccepted.length && (isSoberLiving || profile.medicationServicesOffered.includes("MAT / Addiction medication management")) ? <Tag><Pill aria-hidden="true" size={15} />MAT accepted</Tag> : null}
                </div>
                <div className="ac-tag-row">
                  {Array.from(new Set([...servedPopulations, ...profile.specialtyPopulations])).map(value => <Tag key={value} variant="secondary">{value}</Tag>)}
                </div>
              </div>

            </div>
            </div>
            <div className="ac-profile-header-aside">
              {priceLabel || moveInCostLabel ? <div className="ac-profile-pricing">
                {priceLabel ? <p className="ac-profile-price">{priceLabel.replace("/week", "")}<span>/week</span></p> : null}
                {profile.roomTypes.length ? <p>{profile.roomTypes.join(" · ")}</p> : null}
                {moveInCostLabel ? <p className="ac-profile-move-in"><strong>Move-in costs:</strong> {moveInCostLabel}</p> : null}
              </div> : null}
              <FavoriteListingButton large canFavorite={isReferent} initialFavorited={Boolean(favorite)} isSignedIn={Boolean(appUser)} profileId={profile.id} programName={profile.programName} />
            </div>
            </div>
            {admissionsPhone ? <div className="ac-contact-panel">
              <div className="ac-contact-panel-copy">
                <span className="ac-icon-tile"><Phone aria-hidden="true" size={22} /></span>
                <div><p className="ac-contact-panel-title">Call for availability</p><p className="ac-summary-notes">Speak with admissions or learn more on their website.</p></div>
              </div>
              <a className="ac-phone-button focus-ring" href={telHref(admissionsPhone)}>{formatPhoneForDisplay(admissionsPhone)}</a>
            </div> : null}
            <ProfileGallery profile={profile} preview={canPreviewDraft} />
            <div className="ac-profile-claim">
                {profile.ownershipStatus !== ProfileOwnershipStatus.claimed || query.claim === "unavailable" ? (
                  <ClaimProfileDialog
                    label={profile.ownershipStatus === ProfileOwnershipStatus.claim_pending ? "Under Review" : "Claim this profile"}
                    showTrigger={profile.ownershipStatus !== ProfileOwnershipStatus.claimed}
                  >
                    <ClaimProfileCard
                      canClaim={canClaimProfile}
                      claimStatus={claimStatus}
                      claimOutreachToken={claimOutreach ? query.claimToken : undefined}
                      invitedEmail={claimOutreach?.recipientEmail}
                      isSignedIn={Boolean(clerkUserId)}
                      organizationName={appUser?.organization?.name || ""}
                      profile={profile}
                      userEmail={claimantEmail}
                      userName={claimantName}
                    />
                  </ClaimProfileDialog>
                ) : null}
            </div>
          </Card>

          <div className="mt-5 grid gap-4">
            <ProfileDetailSections profile={profile} />
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

            {richTextHtml(profile.description) ? (
              <Card>
                <h2 className="text-xl font-semibold">About</h2>
                <ExpandableRichText html={richTextHtml(profile.description)} />
              </Card>
            ) : null}

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

            {virtual ? <Card><h2 className="text-xl font-semibold">Virtual program coverage</h2><p className="mt-3">{coverageLabel(profile.statesServed)}</p><p className="mt-3 text-sm">Programming: {profile.hoursOfOperation || profile.programmingSchedule.join(", ")} · {profile.programmingTimeZone}</p></Card> : (
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
            )}
          </div>
        </section>

        {isReferent && profileAcceptsDirectReferrals && referentCanSubmitReferrals ? (
          <PlaceClientForm
            organizationName={appUser?.organization?.name || ""}
            profile={profile}
            referralStatus={query.referral}
            userPhone={appUser?.phone?.trim() || appUser?.organization?.phone?.trim() || ""}
            userEmail={appUser?.email || ""}
            userName={userName}
          />
        ) : isReferent ? (
          <ContactForm
            leadStatus={query.lead}
            userName={userName}
            userEmail={appUser?.email || ""}
            userPhone={appUser?.phone?.trim() || appUser?.organization?.phone?.trim() || ""}
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
