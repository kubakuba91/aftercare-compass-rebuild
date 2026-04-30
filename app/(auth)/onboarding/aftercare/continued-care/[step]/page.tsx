import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { MultiSelectDropdown } from "@/components/onboarding/multi-select-dropdown";
import { OnboardingRecoveryCard } from "@/components/onboarding/onboarding-recovery-card";
import { Card } from "@/components/ui/card";
import {
  continuedCareDurationOptions,
  continuedCareOptionGroups,
  continuedCareSteps,
  levelOfCareOptions,
  maxContinuedCareStep,
  programTypeOptions,
  telehealthModeOptions
} from "@/lib/continued-care-onboarding";
import { isClerkIdentityError } from "@/lib/current-user";
import { getOrCreateOnboardingDraft } from "@/lib/onboarding";
import { cn } from "@/lib/utils";
import { saveContinuedCareOnboardingStep } from "../../actions";

const photoReadinessOptions = ["Exterior", "Group rooms", "Clinical offices", "Lobby / waiting area"];

function fieldClassName() {
  return "min-h-10 rounded-md border border-border bg-white px-3 text-sm";
}

function textAreaClassName() {
  return "min-h-28 rounded-md border border-border bg-white p-3 text-sm";
}

function requiredLabel(label: string) {
  return (
    <span className="flex items-center gap-2">
      <span>{label}</span>
      <span className="rounded-full bg-accent/10 px-2 py-0.5 text-[11px] font-semibold uppercase text-accent">
        Required
      </span>
    </span>
  );
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
          <h1 className="text-3xl font-semibold">Create Program</h1>
          <p className="mt-3 text-sm text-white/80">Complete these 5 steps to get started.</p>
        </div>
        <ol className="mt-12 grid gap-9">
          {continuedCareSteps.map((step) => (
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
          Step {currentStep} of {maxContinuedCareStep}
        </p>
        <p className="mt-1 font-semibold">{continuedCareSteps[currentStep - 1]?.label}</p>
      </div>
    </>
  );
}

export default async function ContinuedCareStepPage({
  params,
  searchParams
}: {
  params: Promise<{ step: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { step: stepParam } = await params;
  const query = await searchParams;
  const currentStep = Number(stepParam);

  if (!Number.isInteger(currentStep) || currentStep < 1 || currentStep > maxContinuedCareStep) {
    notFound();
  }

  let draft: Awaited<ReturnType<typeof getOrCreateOnboardingDraft>>;

  try {
    draft = await getOrCreateOnboardingDraft("continued_care", false);
  } catch (error) {
    console.error("Continued care onboarding bootstrap failed", error);

    if (isClerkIdentityError(error)) {
      redirect("/sign-in");
    }

    return <OnboardingRecoveryCard />;
  }

  const profile = draft.continuedCareDraft as Record<string, any> | null;

  if (!profile && currentStep > 1) {
    redirect("/onboarding/aftercare/continued-care/1");
  }

  const step = continuedCareSteps[currentStep - 1];
  const action = saveContinuedCareOnboardingStep.bind(null, currentStep);
  const selected = (values?: string[] | null) => values ?? [];
  const videoUrls = Array.isArray(profile?.videoUrls) ? profile.videoUrls : [];

  return (
    <main className="grid min-h-screen lg:grid-cols-[320px_1fr]">
      <StepRail currentStep={currentStep} />
      <section className="pb-28">
        <div className="mx-auto w-full max-w-3xl px-4 py-10 lg:py-16">
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
            <h1 className="text-3xl font-semibold">{step.title}</h1>
            <SignOutButton />
          </div>
          {query.error ? (
            <div className="mt-5 rounded-md border border-accent/30 bg-accent/10 p-3 text-sm">
              {query.error}
            </div>
          ) : null}
          <Card className="mt-8">
            <form action={action} className="grid gap-5">
              {currentStep === 1 ? (
                <>
                  <label className="grid gap-2 text-sm font-medium">
                    {requiredLabel("Program name")}
                    <input name="programName" required defaultValue={profile?.programName ?? ""} className={fieldClassName()} />
                  </label>
                  <div className="grid gap-2 text-sm font-medium">
                    {requiredLabel("Program type")}
                    <MultiSelectDropdown name="programTypes" options={programTypeOptions} selected={selected(profile?.programTypes)} />
                  </div>
                  <label className="grid gap-2 text-sm font-medium">
                    {requiredLabel("Primary address")}
                    <input name="streetAddress" required defaultValue={profile?.streetAddress ?? ""} className={fieldClassName()} />
                  </label>
                  <div className="grid gap-4 md:grid-cols-3">
                    <label className="grid gap-2 text-sm font-medium">
                      {requiredLabel("City")}
                      <input name="city" required defaultValue={profile?.city ?? ""} className={fieldClassName()} />
                    </label>
                    <label className="grid gap-2 text-sm font-medium">
                      {requiredLabel("State")}
                      <input name="state" required defaultValue={profile?.state ?? ""} className={fieldClassName()} />
                    </label>
                    <label className="grid gap-2 text-sm font-medium">
                      {requiredLabel("Zip")}
                      <input name="zip" required defaultValue={profile?.zip ?? ""} className={fieldClassName()} />
                    </label>
                  </div>
                  <label className="grid gap-2 text-sm font-medium">
                    Website URL
                    <input name="websiteUrl" type="url" placeholder="https://example.com" defaultValue={profile?.websiteUrl ?? ""} className={fieldClassName()} />
                  </label>
                  <label className="grid gap-2 text-sm font-medium">
                    {requiredLabel("Telehealth")}
                    <select name="telehealthMode" required defaultValue={profile?.telehealthMode ?? "In-person only"} className={fieldClassName()}>
                      {telehealthModeOptions.map((option) => <option key={option}>{option}</option>)}
                    </select>
                  </label>
                  <label className="grid gap-2 text-sm font-medium">
                    Additional locations
                    <textarea name="additionalLocations" defaultValue={profile?.additionalLocations ?? ""} className={textAreaClassName()} />
                  </label>
                  <label className="grid gap-2 text-sm font-medium">
                    {requiredLabel("State license number")}
                    <input name="stateLicenseNumber" required defaultValue={profile?.stateLicenseNumber ?? ""} className={fieldClassName()} />
                  </label>
                  <div className="grid gap-2 text-sm font-medium">
                    Accreditations
                    <MultiSelectDropdown
                      name="certificationsHeld"
                      options={continuedCareOptionGroups.certifications}
                      selected={selected(profile?.certificationsHeld)}
                    />
                  </div>
                </>
              ) : null}

              {currentStep === 2 ? (
                <>
                  <div className="grid gap-2 text-sm font-medium">
                    {requiredLabel("Levels of care offered")}
                    {checkboxGroup("levelsOfCare", levelOfCareOptions, selected(profile?.levelsOfCare))}
                  </div>
                  <label className="grid gap-2 text-sm font-medium">
                    {requiredLabel("Hours of operation")}
                    <textarea name="hoursOfOperation" required defaultValue={profile?.hoursOfOperation ?? ""} className={textAreaClassName()} />
                  </label>
                  <div className="grid gap-2 text-sm font-medium">
                    {requiredLabel("Population served")}
                    {checkboxGroup("populationServed", continuedCareOptionGroups.population, selected(profile?.populationServedOptions))}
                  </div>
                  <div className="grid gap-2 text-sm font-medium">
                    Specialty populations
                    {checkboxGroup("specialtyPopulations", continuedCareOptionGroups.specialty, selected(profile?.specialtyPopulations))}
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <label className="grid gap-2 text-sm font-medium">
                      {requiredLabel("MAT services offered?")}
                      <select name="matServicesOffered" required defaultValue={profile?.matServicesOffered ? "yes" : "no"} className={fieldClassName()}>
                        <option value="no">No</option>
                        <option value="yes">Yes</option>
                      </select>
                    </label>
                    <label className="grid gap-2 text-sm font-medium">
                      {requiredLabel("Co-occurring mental health treatment?")}
                      <select name="coOccurringTreatment" required defaultValue={profile?.coOccurringTreatment ? "yes" : "no"} className={fieldClassName()}>
                        <option value="no">No</option>
                        <option value="yes">Yes</option>
                      </select>
                    </label>
                  </div>
                  <div className="grid gap-2 text-sm font-medium">
                    MAT accepted
                    <MultiSelectDropdown name="matAccepted" options={continuedCareOptionGroups.mat} selected={selected(profile?.matAccepted)} />
                  </div>
                  <label className="grid gap-2 text-sm font-medium">
                    {requiredLabel("Average program duration")}
                    <select name="averageLengthOfStay" required defaultValue={profile?.averageLengthOfStay ?? "30-60 days"} className={fieldClassName()}>
                      {continuedCareDurationOptions.map((option) => <option key={option}>{option}</option>)}
                    </select>
                  </label>
                </>
              ) : null}

              {currentStep === 3 ? (
                <>
                  <label className="grid gap-2 text-sm font-medium">
                    {requiredLabel("Intake contact name")}
                    <input name="intakeContactName" required defaultValue={profile?.intakeContactName ?? ""} className={fieldClassName()} />
                  </label>
                  <div className="grid gap-4 md:grid-cols-2">
                    <label className="grid gap-2 text-sm font-medium">
                      {requiredLabel("Intake phone")}
                      <input name="admissionsContactPhone" required defaultValue={profile?.admissionsContactPhone ?? ""} className={fieldClassName()} />
                    </label>
                    <label className="grid gap-2 text-sm font-medium">
                      {requiredLabel("Intake email")}
                      <input name="admissionsContactEmail" type="email" required defaultValue={profile?.admissionsContactEmail ?? ""} className={fieldClassName()} />
                    </label>
                  </div>
                  <div className="grid gap-2 text-sm font-medium">
                    Insurance accepted
                    <MultiSelectDropdown
                      name="insuranceAccepted"
                      options={continuedCareOptionGroups.insurance}
                      selected={selected(profile?.insuranceAccepted)}
                    />
                  </div>
                  <label className="grid gap-2 text-sm font-medium">
                    {requiredLabel("Referral process description")}
                    <textarea name="referralProcessDescription" required defaultValue={profile?.referralProcessDescription ?? ""} className={textAreaClassName()} />
                  </label>
                  <label className="grid gap-2 text-sm font-medium">
                    Medical records fax
                    <input name="medicalRecordsFax" defaultValue={profile?.medicalRecordsFax ?? ""} className={fieldClassName()} />
                  </label>
                </>
              ) : null}

              {currentStep === 4 ? (
                <>
                  <label className="grid gap-2 text-sm font-medium">
                    Affiliated sober living homes
                    <textarea name="affiliatedSoberLivingHomes" defaultValue={profile?.affiliatedSoberLivingHomes ?? ""} className={textAreaClassName()} />
                  </label>
                  <label className="grid gap-2 text-sm font-medium">
                    {requiredLabel("Program description")}
                    <textarea name="description" required defaultValue={profile?.description ?? ""} className={textAreaClassName()} />
                  </label>
                  <div className="grid gap-2 text-sm font-medium">
                    Support services
                    <MultiSelectDropdown
                      name="supportServices"
                      options={continuedCareOptionGroups.support}
                      selected={selected(profile?.supportServices)}
                    />
                  </div>
                  <label className="grid gap-2 text-sm font-medium">
                    {requiredLabel("Preferred contact method")}
                    <select name="preferredContactMethod" required defaultValue={profile?.preferredContactMethod ?? "Any"} className={fieldClassName()}>
                      {continuedCareOptionGroups.contact.map((option) => <option key={option}>{option}</option>)}
                    </select>
                  </label>
                </>
              ) : null}

              {currentStep === 5 ? (
                <>
                  <label className="grid gap-2 text-sm font-medium">
                    {requiredLabel("Accepting new patients?")}
                    <select name="acceptingNewPatients" required defaultValue={profile?.acceptingNewPatients === false ? "no" : "yes"} className={fieldClassName()}>
                      <option value="yes">Yes</option>
                      <option value="no">No</option>
                    </select>
                  </label>
                  <label className="grid gap-2 text-sm font-medium">
                    Availability notes
                    <textarea name="availabilityNotes" defaultValue={profile?.availabilityNotes ?? ""} className={textAreaClassName()} />
                  </label>
                  <div className="grid gap-2 text-sm font-medium">
                    Photo checklist
                    {checkboxGroup("photoReadiness", photoReadinessOptions, selected(profile?.photoReadiness))}
                  </div>
                  {[0, 1, 2].map((index) => (
                    <label key={index} className="grid gap-2 text-sm font-medium">
                      Video URL {index + 1}
                      <input name="videoUrls" type="url" defaultValue={videoUrls[index] ?? ""} className={fieldClassName()} />
                    </label>
                  ))}
                  <div className="rounded-md border border-border bg-muted/60 p-4 text-sm">
                    Finish to create the draft program profile and open the aftercare dashboard.
                  </div>
                </>
              ) : null}

              <div className="fixed inset-x-0 bottom-0 border-t border-border bg-white p-4 lg:left-[320px]">
                <div className="mx-auto flex max-w-3xl gap-3">
                  {currentStep > 1 ? (
                    <Link className="focus-ring inline-flex min-h-11 flex-1 items-center justify-center rounded-md border border-border px-4 text-sm font-semibold" href={`/onboarding/aftercare/continued-care/${currentStep - 1}`}>
                      Back
                    </Link>
                  ) : (
                    <Link className="focus-ring inline-flex min-h-11 flex-1 items-center justify-center rounded-md border border-border px-4 text-sm font-semibold" href="/onboarding/account-type">
                      Back
                    </Link>
                  )}
                  <button className="focus-ring min-h-11 flex-1 rounded-md bg-[#121b57] px-4 text-sm font-semibold text-white">
                    {currentStep === maxContinuedCareStep ? "Finish" : "Next"}
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
