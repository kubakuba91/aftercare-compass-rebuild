import { Card } from "@/components/ui/card";
import { redirect } from "next/navigation";
import { createAftercareProfileDraft } from "../actions";

export default async function AftercareProfileOnboardingPage({
  searchParams
}: {
  searchParams: Promise<{ type?: string }>;
}) {
  const params = await searchParams;
  const profileType = params.type === "continued_care" ? "continued_care" : "sober_living";
  const isSoberLiving = profileType === "sober_living";

  if (profileType === "continued_care") {
    redirect("/onboarding/aftercare/continued-care/1");
  }

  if (isSoberLiving) {
    redirect("/onboarding/aftercare/sober-living/1");
  }

  return (
    <main className="shell py-10">
      <div className="max-w-2xl">
        <h1 className="text-3xl font-semibold">Create your first aftercare profile</h1>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          This creates a draft profile. Publishing will stay gated until required media,
          verification, and subscription steps are added.
        </p>
      </div>

      <Card className="mt-8 max-w-3xl">
        <form action={createAftercareProfileDraft} className="grid gap-5">
          <input type="hidden" name="profileType" value={profileType} />
          <label className="grid gap-2 text-sm font-medium">
            Program name
            <input name="programName" required className="min-h-10 rounded-md border border-border px-3" />
          </label>
          <label className="grid gap-2 text-sm font-medium">
            Street address
            <input name="streetAddress" required className="min-h-10 rounded-md border border-border px-3" />
          </label>
          <div className="grid gap-4 md:grid-cols-3">
            <label className="grid gap-2 text-sm font-medium">
              City
              <input name="city" required className="min-h-10 rounded-md border border-border px-3" />
            </label>
            <label className="grid gap-2 text-sm font-medium">
              State
              <input name="state" required className="min-h-10 rounded-md border border-border px-3" />
            </label>
            <label className="grid gap-2 text-sm font-medium">
              Zip
              <input name="zip" required className="min-h-10 rounded-md border border-border px-3" />
            </label>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <label className="grid gap-2 text-sm font-medium">
              Admissions phone
              <input
                name="admissionsContactPhone"
                required
                className="min-h-10 rounded-md border border-border px-3"
              />
            </label>
            <label className="grid gap-2 text-sm font-medium">
              Admissions email
              <input
                name="admissionsContactEmail"
                type="email"
                required
                className="min-h-10 rounded-md border border-border px-3"
              />
            </label>
          </div>
          <label className="grid gap-2 text-sm font-medium">
            Population served
            <select name="populationServed" required className="min-h-10 rounded-md border border-border px-3">
              <option value="both">Both</option>
              <option value="men">Men</option>
              <option value="women">Women</option>
              <option value="lgbtq">LGBTQ+</option>
            </select>
          </label>

          {isSoberLiving ? (
            <div className="grid gap-4 md:grid-cols-2">
              <label className="grid gap-2 text-sm font-medium">
                Total beds
                <input
                  name="totalBeds"
                  type="number"
                  min="0"
                  required
                  className="min-h-10 rounded-md border border-border px-3"
                />
              </label>
              <label className="grid gap-2 text-sm font-medium">
                Beds available
                <input
                  name="bedsAvailable"
                  type="number"
                  min="0"
                  required
                  className="min-h-10 rounded-md border border-border px-3"
                />
              </label>
            </div>
          ) : (
            <label className="grid gap-2 text-sm font-medium">
              Accepting new patients
              <select
                name="acceptingNewPatients"
                required
                className="min-h-10 rounded-md border border-border px-3"
              >
                <option value="yes">Yes</option>
                <option value="no">No</option>
              </select>
            </label>
          )}

          <label className="grid gap-2 text-sm font-medium">
            Description
            <textarea
              name="description"
              required
              className="min-h-32 rounded-md border border-border p-3"
            />
          </label>
          <button className="focus-ring min-h-11 rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground">
            Save draft profile
          </button>
        </form>
      </Card>
    </main>
  );
}
