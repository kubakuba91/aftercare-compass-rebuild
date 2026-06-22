import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ProfileType } from "@prisma/client";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { PopulationBedFields } from "@/components/dashboard/population-bed-fields";
import { MultiSelectDropdown } from "@/components/onboarding/multi-select-dropdown";
import { OnboardingRecoveryCard } from "@/components/onboarding/onboarding-recovery-card";
import { Card } from "@/components/ui/card";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import { isClerkIdentityError } from "@/lib/current-user";
import { getOrCreateOnboardingDraft } from "@/lib/onboarding";
import { getActiveProfileOptionValues, mergeOptionValues } from "@/lib/profile-options";
import { prisma } from "@/lib/prisma";
import { richTextHtml } from "@/lib/rich-text";
import { cn } from "@/lib/utils";
import {
  averageLengthOptions,
  bedTypeOptions,
  drugTestingPolicyOptions,
  maxSoberLivingStep,
  medicationAdministrationOptions,
  preferredContactOptions,
  roomTypeOptions,
  soberLivingSteps,
} from "@/lib/sober-living-onboarding";
import { saveSoberLivingOnboardingStep } from "../../actions";

const photoReadinessOptions = ["Exterior", "Common areas", "Bedrooms", "Kitchen"];

function fieldClassName() {
  return "min-h-10 rounded-md border border-border bg-white px-3 text-sm";
}

function moneyFieldClassName() {
  return "flex min-h-10 items-center rounded-md border border-border bg-white px-3 text-sm focus-within:ring-2 focus-within:ring-ring";
}

function moneyInputClassName() {
  return "min-h-9 flex-1 border-0 bg-transparent px-2 text-sm outline-none";
}

function moneyValue(value: string | number | null | undefined) {
  const text = String(value ?? "").replace(/^\s*\$\s*/, "").trim();
  const match = text.match(/^\d+/);
  return match?.[0] ?? "";
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

  let draft: Awaited<ReturnType<typeof getOrCreateOnboardingDraft>>;

  try {
    draft = await getOrCreateOnboardingDraft("sober_living", false);
  } catch (error) {
    console.error("Sober living onboarding bootstrap failed", error);

    if (isClerkIdentityError(error)) {
      redirect("/sign-in");
    }

    return <OnboardingRecoveryCard />;
  }

  if (query.new === "1" && currentStep === 1) {
    await prisma.onboardingDraft.update({
      where: { id: draft.id },
      data: {
        soberLivingDraft: {},
        selectedAccountType: "sober_living",
        activeStep: 1,
        completedAt: null
      }
    });

    redirect("/onboarding/aftercare/sober-living/1");
  }

  const profile = draft.soberLivingDraft as Record<string, any> | null;

  if (!profile && currentStep > 1) {
    redirect("/onboarding/aftercare/sober-living/1");
  }

  const step = soberLivingSteps[currentStep - 1];
  const action = saveSoberLivingOnboardingStep.bind(null, currentStep);
  const profileOptions = await getActiveProfileOptionValues(ProfileType.sober_living);
  const selected = (values?: string[] | null) => values ?? [];
  const servedPopulations = selectedPopulation(profile?.populationServedOptions, profile?.populationServed);
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
            <form action={action} className="grid gap-5" encType="multipart/form-data">
              {currentStep === 1 ? (
                <>
                  <label className="grid gap-2 text-sm font-medium">
                    {requiredLabel("Residence name")}
                    <input name="programName" required defaultValue={profile?.programName ?? ""} className={fieldClassName()} />
                  </label>
                  <label className="grid gap-2 text-sm font-medium">
                    {requiredLabel("Main address")}
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
                  <label className="grid gap-2 text-sm font-medium">
                    Website URL
                    <input name="websiteUrl" type="url" placeholder="https://example.com" defaultValue={profile?.websiteUrl ?? ""} className={fieldClassName()} />
                  </label>
                  <div className="grid gap-2 text-sm font-medium">
                    {requiredLabel("Population served")}
                    {checkboxGroup(
                      "populationServed",
                      mergeOptionValues(profileOptions.populationServed, servedPopulations),
                      selectedPopulation(profile?.populationServedOptions, profile?.populationServed)
                    )}
                  </div>
                  <div className="grid gap-2 text-sm font-medium">
                    Specialty populations served
                    {checkboxGroup(
                      "specialtyPopulations",
                      mergeOptionValues(profileOptions.specialtyPopulations, selected(profile?.specialtyPopulations)),
                      selected(profile?.specialtyPopulations)
                    )}
                  </div>
                  <div className="grid gap-2 text-sm font-medium">
                    Certifications held
                    <MultiSelectDropdown
                      name="certificationsHeld"
                      options={mergeOptionValues(profileOptions.certificationsHeld, selected(profile?.certificationsHeld))}
                      selected={selected(profile?.certificationsHeld)}
                    />
                  </div>
                  <div className="grid gap-2 text-sm font-medium">
                    Accreditations
                    <MultiSelectDropdown
                      name="accreditations"
                      options={mergeOptionValues(profileOptions.accreditations, selected(profile?.accreditations))}
                      selected={selected(profile?.accreditations)}
                    />
                  </div>
                  <div className="grid gap-2 text-sm font-medium">
                    Clinical focus
                    <MultiSelectDropdown
                      name="clinicalFocus"
                      options={mergeOptionValues(profileOptions.clinicalFocus, selected(profile?.clinicalFocus))}
                      selected={selected(profile?.clinicalFocus)}
                    />
                  </div>
                  <label className="grid gap-2 text-sm font-medium">
                    {requiredLabel("Average length of stay")}
                    <select name="averageLengthOfStay" required defaultValue={profile?.averageLengthOfStay ?? "90 days"} className={fieldClassName()}>
                      {averageLengthOptions.map((option) => <option key={option}>{option}</option>)}
                    </select>
                  </label>
                </>
              ) : null}

              {currentStep === 2 ? (
                <>
                  <PopulationBedFields
                    initialPopulations={servedPopulations}
                    populationOptions={mergeOptionValues(profileOptions.populationServed, servedPopulations)}
                    values={{
                      bedsLgbtq: profile?.bedsLgbtq ?? null,
                      bedsLgbtqAvailable: profile?.bedsLgbtqAvailable ?? null,
                      bedsMen: profile?.bedsMen ?? null,
                      bedsMenAvailable: profile?.bedsMenAvailable ?? null,
                      bedsWomen: profile?.bedsWomen ?? null,
                      bedsWomenAvailable: profile?.bedsWomenAvailable ?? null,
                      totalBeds: profile?.totalBeds ?? null,
                      bedsAvailable: profile?.bedsAvailable ?? null
                    }}
                  />
                  <div className="grid gap-2 text-sm font-medium">
                    Room types
                    {checkboxGroup("roomTypes", roomTypeOptions, selected(profile?.roomTypes))}
                  </div>
                  <div className="grid gap-2 text-sm font-medium">
                    Bed types
                    {checkboxGroup("bedTypes", bedTypeOptions, selected(profile?.bedTypes))}
                  </div>
                  <label className="grid gap-2 text-sm font-medium">
                    Reserved beds notes
                    <input name="bedsReservedNotes" defaultValue={profile?.bedsReservedNotes ?? ""} className={fieldClassName()} />
                  </label>
                  <div className="grid gap-4 md:grid-cols-2">
                    <label className="grid gap-2 text-sm font-medium">
                      {requiredLabel("Wheelchair accessible beds?")}
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
                    <span className={moneyFieldClassName()}>
                      <span className="font-semibold text-muted-foreground">$</span>
                      <input name="pricePerWeek" type="number" inputMode="numeric" min="0" defaultValue={moneyValue(profile?.pricePerWeek)} className={moneyInputClassName()} />
                    </span>
                  </label>
                  <label className="grid gap-2 text-sm font-medium">
                    Cost to move in
                    <span className={moneyFieldClassName()}>
                      <span className="font-semibold text-muted-foreground">$</span>
                      <input name="moveInCost" type="number" inputMode="numeric" min="0" placeholder="600" defaultValue={moneyValue(profile?.moveInCost)} className={moneyInputClassName()} />
                    </span>
                  </label>
                </>
              ) : null}

              {currentStep === 3 ? (
                <>
                  <div className="grid gap-2 text-sm font-medium">
                    Support services
                    <MultiSelectDropdown
                      name="supportServices"
                      options={mergeOptionValues(profileOptions.supportServices, selected(profile?.supportServices))}
                      selected={selected(profile?.supportServices)}
                    />
                  </div>
                  <div className="grid gap-2 text-sm font-medium">
                    Amenities
                    <MultiSelectDropdown
                      name="amenities"
                      options={mergeOptionValues(profileOptions.amenities, selected(profile?.amenities))}
                      selected={selected(profile?.amenities)}
                    />
                  </div>
                  <div className="grid gap-2 text-sm font-medium">
                    Insurance/payment accepted
                    <MultiSelectDropdown
                      name="insuranceAccepted"
                      options={mergeOptionValues(profileOptions.insuranceAccepted, selected(profile?.insuranceAccepted))}
                      selected={selected(profile?.insuranceAccepted)}
                    />
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <label className="grid gap-2 text-sm font-medium">
                      {requiredLabel("Funding available?")}
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
                    {requiredLabel("Medication administration")}
                    <select name="medicationAdministration" required defaultValue={profile?.medicationAdministration ?? "Self-administered only"} className={fieldClassName()}>
                      {medicationAdministrationOptions.map((option) => <option key={option}>{option}</option>)}
                    </select>
                  </label>
                  <div className="grid gap-2 text-sm font-medium">
                    MAT accepted
                    <MultiSelectDropdown
                      name="matAccepted"
                      options={mergeOptionValues(profileOptions.matAccepted, selected(profile?.matAccepted))}
                      selected={selected(profile?.matAccepted)}
                    />
                  </div>
                  <label className="grid gap-2 text-sm font-medium">
                    Medication restrictions
                    <input name="medicationRestrictions" defaultValue={profile?.medicationRestrictions ?? ""} className={fieldClassName()} />
                  </label>
                  <label className="grid gap-2 text-sm font-medium">
                    {requiredLabel("Drug testing policy")}
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
                    <RichTextEditor initialValue={richTextHtml(profile?.description)} name="description" />
                  </label>
                  <label className="grid gap-2 text-sm font-medium">
                    House rules
                    <RichTextEditor initialValue={richTextHtml(profile?.houseRulesText)} name="houseRulesText" />
                  </label>
                  <div className="grid gap-2 text-sm font-medium">
                    Photo checklist
                    {checkboxGroup("photoReadiness", photoReadinessOptions, selected(profile?.photoReadiness))}
                  </div>
                  <div className="rounded-md border border-dashed border-border bg-muted/30 p-4 text-sm leading-6 text-muted-foreground">
                    You will add profile images after this form is complete, once the profile has been created.
                  </div>
                  {[0, 1, 2].map((index) => (
                    <label key={index} className="grid gap-2 text-sm font-medium">
                      Video URL {index + 1}
                      <input name="videoUrls" type="url" defaultValue={videoUrls[index] ?? ""} className={fieldClassName()} />
                    </label>
                  ))}
                  <label className="grid gap-2 text-sm font-medium">
                    {requiredLabel("Preferred contact method")}
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
                  <label className="ac-panel-card flex items-start gap-3 p-3 text-sm">
                    <input type="checkbox" name="goodNeighborPolicyAcknowledged" value="yes" defaultChecked={profile?.goodNeighborPolicyAcknowledged ?? false} required />
                    <span>{requiredLabel("I acknowledge that the home will follow a Good Neighbor Policy and keep public profile information accurate.")}</span>
                  </label>
                  <div className="ac-panel-card p-4 text-sm">
                    Review the previous steps, then finish to open the aftercare dashboard.
                  </div>
                </>
              ) : null}

              <div className="fixed inset-x-0 bottom-0 border-t border-border bg-white p-4 lg:left-[320px]">
                <div className="mx-auto flex max-w-3xl gap-3">
                  {currentStep > 1 && profile ? (
                    <Link className="focus-ring inline-flex min-h-11 flex-1 items-center justify-center rounded-md border border-border px-4 text-sm font-semibold" href={`/onboarding/aftercare/sober-living/${currentStep - 1}`}>
                      Back
                    </Link>
                  ) : (
                    <Link className="focus-ring inline-flex min-h-11 flex-1 items-center justify-center rounded-md border border-border px-4 text-sm font-semibold" href="/onboarding/account-type">
                      Back
                    </Link>
                  )}
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
