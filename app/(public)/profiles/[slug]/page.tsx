import Link from "next/link";
import { notFound } from "next/navigation";
import { BedDouble, CheckCircle2, Mail, MapPin, Send, ShieldCheck, Video } from "lucide-react";
import { PublicSearchHeader } from "@/components/public/public-search-header";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { getVisiblePopulationBeds } from "@/lib/bed-display";
import { getCurrentAppUser } from "@/lib/current-user";
import { prisma } from "@/lib/prisma";
import { createProfileReferral, createPublicProfileLead } from "./actions";

export const dynamic = "force-dynamic";

function listOrFallback(values: string[], fallback = "Not listed") {
  return values.length ? values.join(", ") : fallback;
}

function availabilityText(profile: {
  type: string;
  totalBeds: number | null;
  bedsAvailable: number | null;
  acceptingNewPatients: boolean | null;
}) {
  if (profile.type === "sober_living") {
    return `${profile.bedsAvailable ?? 0} of ${profile.totalBeds ?? 0} beds available`;
  }

  return profile.acceptingNewPatients ? "Accepting new patients" : "Not accepting new patients";
}

function ContactForm({
  profile,
  leadStatus
}: {
  profile: { id: string; slug: string };
  leadStatus?: string;
}) {
  return (
    <Card className="h-fit">
      <div className="flex items-center gap-2">
        <Mail size={18} />
        <h2 className="font-semibold">Contact this program</h2>
      </div>
      <p className="mt-3 text-sm leading-6 text-muted-foreground">
        Send a contact request to the provider. This creates an internal lead for their team.
      </p>
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

export default async function PublicProfilePage({
  params,
  searchParams
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ lead?: string; referral?: string; preview?: string }>;
}) {
  const [{ slug }, query, appUser] = await Promise.all([
    params,
    searchParams,
    getCurrentAppUser()
  ]);
  const profile = await prisma.aftercareProfile.findUnique({
    where: {
      slug
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
  const publicLocation = [profile.publicCity, profile.publicState].filter(Boolean).join(", ");
  const visiblePopulationBeds = getVisiblePopulationBeds(profile);
  const isReferent = appUser?.role.startsWith("referent") ?? false;
  const isAftercareUser = appUser?.role.startsWith("aftercare") ?? false;
  const userName = [appUser?.firstName, appUser?.lastName].filter(Boolean).join(" ") || "";

  return (
    <>
      <PublicSearchHeader
        defaultLocation={publicLocation}
        defaultType={profile.type}
        defaultAvailability={profile.bedsAvailable || profile.acceptingNewPatients ? "available" : ""}
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
            <div className="flex flex-wrap gap-2">
              <Badge tone={profile.verificationTier > 1 ? "verified" : "neutral"}>
                {profile.verificationTier > 1 ? "Verified" : "Self-reported"}
              </Badge>
              <Badge>{isSoberLiving ? "Sober Living" : "Continued Care"}</Badge>
              <Badge tone={profile.bedsAvailable || profile.acceptingNewPatients ? "success" : "warning"}>
                {availabilityText(profile)}
              </Badge>
            </div>
            <h1 className="mt-4 text-3xl font-semibold">{profile.programName}</h1>
            <p className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
              <MapPin size={16} />
              {publicLocation || "Location not listed"} · Exact address is private
            </p>
            <div className="mt-6 rounded-lg border border-dashed border-border bg-muted/40 p-6">
              <p className="text-sm font-semibold">Photos coming soon</p>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Providers can mark photos as ready in the dashboard. Uploaded photo hosting is planned
                after the v1 profile workflow.
              </p>
            </div>
          </div>

          <div className="mt-5 grid gap-4">
            <Card>
              <h2 className="text-xl font-semibold">About</h2>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">
                {profile.description || "No description has been added yet."}
              </p>
            </Card>

            {isSoberLiving ? (
              <Card>
                <BedDouble className="text-primary" size={22} />
                <h2 className="mt-3 text-xl font-semibold">Bed availability</h2>
                {visiblePopulationBeds.length ? (
                  <div className="mt-4 grid gap-3 md:grid-cols-3">
                    {visiblePopulationBeds.map((bed) => (
                      <div key={bed.label} className="rounded-md border border-border bg-muted/40 p-3">
                        <p className="text-sm text-muted-foreground">{bed.label}</p>
                        <p className="mt-1 text-2xl font-semibold">{bed.available}/{bed.total}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="mt-3 text-sm leading-6 text-muted-foreground">
                    Population-specific bed counts are not listed.
                  </p>
                )}
              </Card>
            ) : (
              <Card>
                <CheckCircle2 className="text-primary" size={22} />
                <h2 className="mt-3 text-xl font-semibold">Program availability</h2>
                <p className="mt-3 text-sm leading-6 text-muted-foreground">
                  {availabilityText(profile)}
                  {profile.availabilityNotes ? ` · ${profile.availabilityNotes}` : ""}
                </p>
              </Card>
            )}

            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <ShieldCheck className="text-primary" size={22} />
                <h2 className="mt-3 font-semibold">Services and amenities</h2>
                <dl className="mt-4 grid gap-3 text-sm">
                  <div>
                    <dt className="text-muted-foreground">Population served</dt>
                    <dd className="font-medium">
                      {listOrFallback(profile.populationServedOptions, profile.populationServed || "Not listed")}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Specialty populations</dt>
                    <dd className="font-medium">{listOrFallback(profile.specialtyPopulations)}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Support services</dt>
                    <dd className="font-medium">{listOrFallback(profile.supportServices)}</dd>
                  </div>
                  {isSoberLiving ? (
                    <div>
                      <dt className="text-muted-foreground">Amenities</dt>
                      <dd className="font-medium">{listOrFallback(profile.amenities)}</dd>
                    </div>
                  ) : null}
                </dl>
              </Card>

              <Card>
                <h2 className="font-semibold">Payment and clinical fit</h2>
                <dl className="mt-4 grid gap-3 text-sm">
                  <div>
                    <dt className="text-muted-foreground">Insurance/payment</dt>
                    <dd className="font-medium">{listOrFallback(profile.insuranceAccepted)}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">MAT accepted</dt>
                    <dd className="font-medium">{listOrFallback(profile.matAccepted)}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Certifications</dt>
                    <dd className="font-medium">{listOrFallback(profile.certificationsHeld)}</dd>
                  </div>
                </dl>
              </Card>
            </div>

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
                {publicLocation || "Location not listed"}. Exact addresses are private and are never
                shown on public or referent-facing pages.
              </p>
              <div className="mt-4 rounded-md border border-dashed border-border bg-muted/40 p-6 text-sm text-muted-foreground">
                Generalized map area placeholder
              </div>
            </Card>
          </div>
        </section>

        {isReferent ? (
          <PlaceClientForm
            organizationName={appUser?.organization?.name || ""}
            profile={profile}
            referralStatus={query.referral}
            userEmail={appUser?.email || ""}
            userName={userName}
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
