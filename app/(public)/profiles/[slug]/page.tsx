import { Mail, MapPin, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

export default function PublicProfilePage() {
  return (
    <main className="shell py-8">
      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <section>
          <div className="rounded-lg border border-border bg-white p-6">
            <div className="flex flex-wrap gap-2">
              <Badge tone="verified">Verified</Badge>
              <Badge>Sober Living</Badge>
              <Badge tone="success">Beds available</Badge>
            </div>
            <h1 className="mt-4 text-3xl font-semibold">Sample aftercare profile</h1>
            <p className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
              <MapPin size={16} />
              City and state only. Exact address remains private.
            </p>
            <div className="mt-6 aspect-[16/7] rounded-lg bg-muted" aria-label="Profile photo gallery placeholder" />
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <Card>
              <ShieldCheck className="text-primary" size={22} />
              <h2 className="mt-3 font-semibold">Verification and compliance</h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Tier, certification badges, document status, and public trust signals belong here.
              </p>
            </Card>
            <Card>
              <h2 className="font-semibold">Services and amenities</h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Support services, medication policy, insurance accepted, and linked programs are shown
                without exposing private operational data.
              </p>
            </Card>
          </div>
        </section>

        <Card className="h-fit">
          <div className="flex items-center gap-2">
            <Mail size={18} />
            <h2 className="font-semibold">Contact this program</h2>
          </div>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            Public visitors create an internal lead. Logged-in referent users will see the structured
            de-identified referral form.
          </p>
          <form className="mt-5 grid gap-3">
            <input className="min-h-10 rounded-md border border-border px-3" placeholder="Name" />
            <input className="min-h-10 rounded-md border border-border px-3" placeholder="Email" />
            <textarea className="min-h-28 rounded-md border border-border p-3" placeholder="Message" />
            <button className="focus-ring min-h-10 rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground">
              Send contact request
            </button>
          </form>
        </Card>
      </div>
    </main>
  );
}

