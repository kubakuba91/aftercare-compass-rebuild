import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ProfileType } from "@prisma/client";
import { Card } from "@/components/ui/card";
import { isClerkIdentityError } from "@/lib/current-user";
import { ensureOnboardingOrganization } from "@/lib/onboarding";
import { prisma } from "@/lib/prisma";
import { cn } from "@/lib/utils";
import {
  amenityOptions,
  averageLengthOptions,
  certificationOptions,
  drugTestingPolicyOptions,
  insuranceOptions,
  matOptions,
  maxSoberLivingStep,
  medicationAdministrationOptions,
  populationOptions,
  preferredContactOptions,
  roomTypeOptions,
  soberLivingSteps,
  specialtyPopulationOptions,
  supportServiceOptions
} from "@/lib/sober-living-onboarding";
import { saveSoberLivingOnboardingStep } from "../../actions";

const photoReadinessOptions = ["Exterior", "Common areas", "Bedrooms", "Kitchen"];

function fieldClassName() {
  return "min-h-10 rounded-md border border-border bg-white px-3 text-sm";
}

function textAreaClassName() {
  return "min-h-28 rounded-md border border-border bg-white p-3 text-sm";
}

function checkboxGroup(name: string, options: readonly string[], selected: string[] = []) {
  return (
    <div className="grid gap-2 md:grid-cols-2">
      {options.map((option) => (
        <label key={option} className="flex min-h-10 items-center gap-2 rounded-md border border-border bg-white px-3 text-sm">
          <input type="checkbox" name={name} value={option} defaultChecked={selected.includes(option)} />
          <span>{option}</span>
        </label>
      ))}
    </div>
  );
}

function StepRail({ currentStep }: { currentStep: number }) {
  return (
    <>
      <aside className="hidden min-h-screen bg-[#121b57] px-7 py-8 text-white lg:block">
        <Link href="/" className="block text-2xl font-semibold leading-tight">
          Aftercare
          <br />
          Compass
        </Link>
        <div className="mt-12">
          <h1 className="text-3xl font-semibold">Create Home</h1>
          <p className="mt-3 text-sm text-white/80">Complete these 5 steps to get started.</p>
        </div>
        <ol className="mt-12 grid gap-9">
          {soberLivingSteps.map((step) => (
            <li key={step.number} className="flex items-center gap-4">
              <span
                className={cn(
                  "flex size-11 shrink-0 items-center justify-center rounded-full border-2 text-lg",
                  step.number === currentStep ? "border-cyan-300 bg-cyan-300 text-[#121b57]" : "border-cyan-400"
                )}
              >
                {step.number}
              </span>
              <span className="text-sm font-semibold">{step.label}</span>
            </li>
          ))}
        </ol>
      </aside>
      <div className="border-b border-border bg-white px-4 py-3 lg:hidden">
        <p className="text-xs font-semibold uppercase text-muted-foreground">
          Step {currentStep} of {maxSoberLivingStep}
        </p>
        <p className="mt-1 font-semibold">{soberLivingSteps[currentStep - 1]?.label}</p>
      </div>
    </>
  );
}

function selectedPopulation(values?: string[] | null, legacyValue?: string | null) {
  if (values?.length) {
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

function bedFieldsForPopulation(
  label: string,
  totalName: string,
  availableName: string,
  totalValue?: number | null,
  availableValue?: number | null
) {
  return (
    <div className="rounded-md border border-border bg-white p-4">
      <h3 className="text-sm font-semibold">{label} beds</h3>
      <div className="mt-3 grid gap-4 md:grid-cols-2">
        <label className="grid gap-2 text-sm font-medium">
          Total beds
          <input
            name={totalName}
            type="number"
            min="0"
            required
            defaultValue={totalValue ?? ""}
            className={fieldClassName()}
          />
        </label>
        <label className="grid gap-2 text-sm font-medium">
          Available beds
          <input
            name={availableName}
            type="number"
            min="0"
            required
            defaultValue={availableValue ?? ""}
            className={fieldClassName()}
          />
        </label>
      </div>
    </div>
  );
}

function OnboardingRecoveryCard() {
  return (
    <main className="shell flex min-h-screen items-center justify-center py-10">
      <Card className="max-w-xl">
        <h1 className="text-2xl font-semibold">Resume onboarding</h1>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          Your sign-in is active, but onboarding needs to refresh your account setup before
          continuing.
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <Link
            className="focus-ring inline-flex min-h-10 items-center rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground"
            href="/onboarding/start/sober_living"
          >
            Resume
          </Link>
          <Link
            className="focus-ring inline-flex min-h-10 items-center rounded-md border border-border px-4 text-sm font-semibold"
            href="/sign-in?redirect_url=/onboarding/start/sober_living"
          >
            Sign in again
          </Link>
        </div>
      </Card>
    </main>
  );
}

export default async function SoberLivingStepPage({
  params,
  searchParams
}: {
  params: Promise<{ step: string }>;
  searchParams: Promise<{ profileId?: string; error?: string; new?: string }>;
}) {
  const { step: stepParam } = await params;
  const query = await searchParams;
  const currentStep = Number(stepParam);

  if (!Number.isInteger(currentStep) || currentStep < 1 || currentStep > maxSoberLivingStep) {
    notFound();
  }

  let organization: Awaited<ReturnType<typeof ensureOnboardingOrganization>>;

  try {
    organization = await ensureOnboardingOrganization("sober_living");
  } catch (error) {
    console.error("Sober living onboarding bootstrap failed", error);

    if (isClerkIdentityError(error)) {
      redirect("/sign-in?redirect_url=/onboarding/start/sober_living");
    }

    return <OnboardingRecoveryCard />;
  }

  const isNewProfile = query.new === "1";
  let profile;

  try {
    profile = query.profileId
      ? await prisma.aftercareProfile.findFirst({
          where: { id: query.profileId, orgId: organization.orgId, type: ProfileType.sober_living }
        })
      : null;
  } catch (error) {
    console.error("Sober living onboarding profile lookup failed", error);
    return <OnboardingRecoveryCard />;
  }

  if (query.profileId && !profile) {
    redirect("/dashboard/aftercare");
  }

  if (!profile && !isNewProfile) {
    let latestProfile;

    try {
      latestProfile = await prisma.aftercareProfile.findFirst({
        where: { orgId: organization.orgId, type: ProfileType.sober_living },
        orderBy: { updatedAt: "desc" }
      });
    } catch (error) {
      console.error("Sober living onboarding resume lookup failed", error);
      return <OnboardingRecoveryCard />;
    }

    if (latestProfile?.onboardingCompletedAt) {
      redirect("/dashboard/aftercare");
    }

    if (latestProfile) {
      const resumeStep = Math.min(Math.max(latestProfile.onboardingStep ?? 1, 1), maxSoberLivingStep);
      redirect(`/onboarding/aftercare/sober-living/${resumeStep}?profileId=${latestProfile.id}`);
    }
  }

  if (!profile && currentStep > 1) {
    redirect("/onboarding/aftercare/sober-living/1");
  }

  const step = soberLivingSteps[currentStep - 1];
  const action = saveSoberLivingOnboardingStep.bind(null, currentStep);
  const selected = (values?: string[] | null) => values ?? [];
  const servedPopulations = selectedPopulation(profile?.populationServedOptions, profile?.populationServed);

  return (
    <main className="grid min-h-screen lg:grid-cols-[320px_1fr]">
      <StepRail currentStep={currentStep} />
      <section className="pb-28">
        <div className="mx-auto w-full max-w-3xl px-4 py-10 lg:py-16">
          <h1 className="text-3xl font-semibold">{step.title}</h1>
          {query.error ? (
            <div className="mt-5 rounded-md border border-accent/30 bg-accent/10 p-3 text-sm">
              {query.error}
            </div>
          ) : null}
          <Card className="mt-8">
            <form action={action} className="grid gap-5">
              {profile ? <input type="hidden" name="profileId" value={profile.id} /> : null}

              {currentStep === 1 ? (
                <>
                  <label className="grid gap-2 text-sm font-medium">
                    Program name
                    <input name="programName" required defaultValue={profile?.programName ?? ""} className={fieldClassName()} />
                  </label>
                  <label className="grid gap-2 text-sm font-medium">
                    Main address
                    <input name="streetAddress" required defaultValue={profile?.streetAddress ?? ""} className={fieldClassName()} />
                  </label>
                  <div className="grid gap-4 md:grid-cols-3">
                    <label className="grid gap-2 text-sm font-medium">
                      City
                      <input name="city" required defaultValue={profile?.city ?? ""} className={fieldClassName()} />
                    </label>
                    <label className="grid gap-2 text-sm font-medium">
                      State
                      <input name="state" required defaultValue={profile?.state ?? ""} className={fieldClassName()} />
                    </label>
                    <label className="grid gap-2 text-sm font-medium">
                      Zip
                      <input name="zip" required defaultValue={profile?.zip ?? ""} className={fieldClassName()} />
                    </label>
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <label className="grid gap-2 text-sm font-medium">
                      Admissions phone
                      <input name="admissionsContactPhone" required defaultValue={profile?.admissionsContactPhone ?? ""} className={fieldClassName()} />
                    </label>
                    <label className="grid gap-2 text-sm font-medium">
                      Admissions email
                      <input name="admissionsContactEmail" type="email" required defaultValue={profile?.admissionsContactEmail ?? ""} className={fieldClassName()} />
                    </label>
                  </div>
                  <label className="grid gap-2 text-sm font-medium">
                    Website URL
                    <input name="websiteUrl" type="url" placeholder="https://example.com" defaultValue={profile?.websiteUrl ?? ""} className={fieldClassName()} />
                  </label>
                  <div className="grid gap-2 text-sm font-medium">
                    Population served
                    {checkboxGroup(
                      "populationServed",
                      populationOptions,
                      selectedPopulation(profile?.populationServedOptions, profile?.populationServed)
                    )}
                  </div>
                  <div className="grid gap-2 text-sm font-medium">
                    Specialty populations served
                    {checkboxGroup("specialtyPopulations", specialtyPopulationOptions, selected(profile?.specialtyPopulations))}
                  </div>
                  <div className="grid gap-2 text-sm font-medium">
                    Accreditations held
                    {checkboxGroup("certificationsHeld", certificationOptions, selected(profile?.certificationsHeld))}
                  </div>
                  <label className="grid gap-2 text-sm font-medium">
                    Average length of stay
                    <select name="averageLengthOfStay" required defaultValue={profile?.averageLengthOfStay ?? "90 days"} className={fieldClassName()}>
                      {averageLengthOptions.map((option) => <option key={option}>{option}</option>)}
                    </select>
                  </label>
                </>
              ) : null}

              {currentStep === 2 ? (
                <>
                  <div className="grid gap-3">
                    {servedPopulations.includes("Men")
                      ? bedFieldsForPopulation(
                          "Men",
                          "bedsMen",
                          "bedsMenAvailable",
                          profile?.bedsMen,
                          profile?.bedsMenAvailable
                        )
                      : null}
                    {servedPopulations.includes("Women")
                      ? bedFieldsForPopulation(
                          "Women",
                          "bedsWomen",
                          "bedsWomenAvailable",
                          profile?.bedsWomen,
                          profile?.bedsWomenAvailable
                        )
                      : null}
                    {servedPopulations.includes("LGBTQ+")
                      ? bedFieldsForPopulation(
                          "LGBTQ+",
                          "bedsLgbtq",
                          "bedsLgbtqAvailable",
                          profile?.bedsLgbtq,
                          profile?.bedsLgbtqAvailable
                        )
                      : null}
                  </div>
                  <div className="grid gap-2 text-sm font-medium">
                    Room types
                    {checkboxGroup("roomTypes", roomTypeOptions, selected(profile?.roomTypes))}
                  </div>
                  <label className="grid gap-2 text-sm font-medium">
                    Reserved beds notes
                    <input name="bedsReservedNotes" defaultValue={profile?.bedsReservedNotes ?? ""} className={fieldClassName()} />
                  </label>
                  <div className="grid gap-4 md:grid-cols-2">
                    <label className="grid gap-2 text-sm font-medium">
                      Wheelchair accessible beds?
                      <select name="wheelchairAccessible" defaultValue={profile?.wheelchairAccessibleBeds ? "yes" : "no"} className={fieldClassName()}>
                        <option value="no">No</option>
                        <option value="yes">Yes</option>
                      </select>
                    </label>
                    <label className="grid gap-2 text-sm font-medium">
                      Accessible bed count
                      <input name="wheelchairAccessibleBeds" type="number" min="0" defaultValue={profile?.wheelchairAccessibleBeds ?? ""} className={fieldClassName()} />
                    </label>
                  </div>
                  <label className="grid gap-2 text-sm font-medium">
                    Price per week
                    <input name="pricePerWeek" type="number" min="0" required defaultValue={profile?.pricePerWeek ?? ""} className={fieldClassName()} />
                  </label>
                </>
              ) : null}

              {currentStep === 3 ? (
                <>
                  <div className="grid gap-2 text-sm font-medium">
                    Support services
                    {checkboxGroup("supportServices", supportServiceOptions, selected(profile?.supportServices))}
                  </div>
                  <div className="grid gap-2 text-sm font-medium">
                    Amenities
                    {checkboxGroup("amenities", amenityOptions, selected(profile?.amenities))}
                  </div>
                  <div className="grid gap-2 text-sm font-medium">
                    Insurance/payment accepted
                    {checkboxGroup("insuranceAccepted", insuranceOptions, selected(profile?.insuranceAccepted))}
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <label className="grid gap-2 text-sm font-medium">
                      Funding available?
                      <select name="fundingAvailable" defaultValue={profile?.fundingAvailable ? "yes" : "no"} className={fieldClassName()}>
                        <option value="no">No</option>
                        <option value="yes">Yes</option>
                      </select>
                    </label>
                    <label className="grid gap-2 text-sm font-medium">
                      Funding notes
                      <input name="fundingNotes" defaultValue={profile?.fundingNotes ?? ""} className={fieldClassName()} />
                    </label>
                  </div>
                  <label className="grid gap-2 text-sm font-medium">
                    Medication administration
                    <select name="medicationAdministration" required defaultValue={profile?.medicationAdministration ?? "Self-administered only"} className={fieldClassName()}>
                      {medicationAdministrationOptions.map((option) => <option key={option}>{option}</option>)}
                    </select>
                  </label>
                  <div className="grid gap-2 text-sm font-medium">
                    MAT accepted
                    {checkboxGroup("matAccepted", matOptions, selected(profile?.matAccepted))}
                  </div>
                  <label className="grid gap-2 text-sm font-medium">
                    Medication restrictions
                    <input name="medicationRestrictions" defaultValue={profile?.medicationRestrictions ?? ""} className={fieldClassName()} />
                  </label>
                  <label className="grid gap-2 text-sm font-medium">
                    Drug testing policy
                    <select name="drugTestingPolicy" required defaultValue={profile?.drugTestingPolicy ?? "Random"} className={fieldClassName()}>
                      {drugTestingPolicyOptions.map((option) => <option key={option}>{option}</option>)}
                    </select>
                  </label>
                </>
              ) : null}

              {currentStep === 4 ? (
                <>
                  <label className="grid gap-2 text-sm font-medium">
                    Home description
                    <textarea name="description" required defaultValue={profile?.description ?? ""} className={textAreaClassName()} />
                  </label>
                  <label className="grid gap-2 text-sm font-medium">
                    House rules
                    <textarea name="houseRulesText" defaultValue={profile?.houseRulesText ?? ""} className={textAreaClassName()} />
                  </label>
                  <div className="grid gap-2 text-sm font-medium">
                    Photo checklist
                    {checkboxGroup("photoReadiness", photoReadinessOptions, selected(profile?.photoReadiness))}
                  </div>
                  {[0, 1, 2].map((index) => (
                    <label key={index} className="grid gap-2 text-sm font-medium">
                      Video URL {index + 1}
                      <input name="videoUrls" type="url" defaultValue={profile?.videoUrls[index] ?? ""} className={fieldClassName()} />
                    </label>
                  ))}
                  <label className="grid gap-2 text-sm font-medium">
                    Preferred contact method
                    <select name="preferredContactMethod" required defaultValue={profile?.preferredContactMethod ?? "Any"} className={fieldClassName()}>
                      {preferredContactOptions.map((option) => <option key={option}>{option}</option>)}
                    </select>
                  </label>
                </>
              ) : null}

              {currentStep === 5 ? (
                <>
                  <label className="grid gap-2 text-sm font-medium">
                    Availability notes
                    <textarea name="availabilityNotes" defaultValue={profile?.availabilityNotes ?? ""} className={textAreaClassName()} />
                  </label>
                  <label className="grid gap-2 text-sm font-medium">
                    Referral fit notes
                    <textarea name="referralFitNotes" defaultValue={profile?.referralFitNotes ?? ""} className={textAreaClassName()} />
                  </label>
                  <label className="flex items-start gap-3 rounded-md border border-border bg-white p-3 text-sm">
                    <input type="checkbox" name="goodNeighborPolicyAcknowledged" value="yes" defaultChecked={profile?.goodNeighborPolicyAcknowledged ?? false} required />
                    <span>I acknowledge that the home will follow a Good Neighbor Policy and keep public profile information accurate.</span>
                  </label>
                  <div className="rounded-md border border-border bg-muted/60 p-4 text-sm">
                    Review the previous steps, then finish to open the aftercare dashboard.
                  </div>
                </>
              ) : null}

              <div className="fixed inset-x-0 bottom-0 border-t border-border bg-white p-4 lg:left-[320px]">
                <div className="mx-auto flex max-w-3xl gap-3">
                  {currentStep > 1 && profile ? (
                    <Link className="focus-ring inline-flex min-h-11 flex-1 items-center justify-center rounded-md border border-border px-4 text-sm font-semibold" href={`/onboarding/aftercare/sober-living/${currentStep - 1}?profileId=${profile.id}`}>
                      Back
                    </Link>
                  ) : (
                    <Link className="focus-ring inline-flex min-h-11 flex-1 items-center justify-center rounded-md border border-border px-4 text-sm font-semibold" href="/dashboard/aftercare">
                      Back
                    </Link>
                  )}
                  <button name="intent" value="save" className="focus-ring min-h-11 flex-1 rounded-md border border-border px-4 text-sm font-semibold">
                    Save & continue later
                  </button>
                  <button name="intent" value="continue" className="focus-ring min-h-11 flex-1 rounded-md bg-[#121b57] px-4 text-sm font-semibold text-white">
                    {currentStep === maxSoberLivingStep ? "Finish" : "Next"}
                  </button>
                </div>
              </div>
            </form>
          </Card>
        </div>
      </section>
    </main>
  );
}
