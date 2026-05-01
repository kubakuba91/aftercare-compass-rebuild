import Link from "next/link";
import { notFound } from "next/navigation";
import { BedDouble, CheckCircle2, Mail, MapPin, ShieldCheck, Video } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { prisma } from "@/lib/prisma";
import { createPublicProfileLead } from "./actions";

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

export default async function PublicProfilePage({
  params,
  searchParams
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ lead?: string }>;
}) {
  const [{ slug }, query] = await Promise.all([params, searchParams]);
  const profile = await prisma.aftercareProfile.findFirst({
    where: {
      slug,
      status: "published"
    }
  });

  if (!profile) {
    notFound();
  }

  const isSoberLiving = profile.type === "sober_living";
  const publicLocation = [profile.publicCity, profile.publicState].filter(Boolean).join(", ");

  return (
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
                <div className="mt-4 grid gap-3 md:grid-cols-3">
                  <div className="rounded-md border border-border bg-muted/40 p-3">
                    <p className="text-sm text-muted-foreground">Men</p>
                    <p className="mt-1 text-2xl font-semibold">{profile.bedsMenAvailable ?? 0}/{profile.bedsMen ?? 0}</p>
                  </div>
                  <div className="rounded-md border border-border bg-muted/40 p-3">
                    <p className="text-sm text-muted-foreground">Women</p>
                    <p className="mt-1 text-2xl font-semibold">{profile.bedsWomenAvailable ?? 0}/{profile.bedsWomen ?? 0}</p>
                  </div>
                  <div className="rounded-md border border-border bg-muted/40 p-3">
                    <p className="text-sm text-muted-foreground">LGBTQ+</p>
                    <p className="mt-1 text-2xl font-semibold">{profile.bedsLgbtqAvailable ?? 0}/{profile.bedsLgbtq ?? 0}</p>
                  </div>
                </div>
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
          </div>
        </section>

        <Card className="h-fit">
          <div className="flex items-center gap-2">
            <Mail size={18} />
            <h2 className="font-semibold">Contact this program</h2>
          </div>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            Send a contact request to the provider. This creates an internal lead for their team.
          </p>
          {query.lead === "sent" ? (
            <div className="mt-4 rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm font-semibold text-emerald-800">
              Contact request sent.
            </div>
          ) : null}
          {query.lead === "invalid" ? (
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
      </div>
    </main>
  );
}
