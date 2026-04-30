import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { Card } from "@/components/ui/card";
import { isClerkIdentityError } from "@/lib/current-user";
import { getOrCreateOnboardingDraft } from "@/lib/onboarding";
import { referentPlans } from "@/lib/plans";
import {
  avgMonthlyReferralOptions,
  billingCycleOptions,
  ehrSystemOptions,
  levelsOfCareOptions,
  maxReferentStep,
  placementMethodOptions,
  referentOrgTypeOptions,
  referentPlanOptions,
  referentSteps,
  statesOperatedOptions
} from "@/lib/referent-onboarding";
import { cn } from "@/lib/utils";
import { saveReferentOnboardingStep } from "../actions";

function fieldClassName() {
  return "min-h-10 rounded-md border border-border bg-white px-3 text-sm";
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

function multiSelectDropdown(name: string, options: readonly string[], selected: string[] = []) {
  const summary = selected.length ? `${selected.length} selected` : "Select options";

  return (
    <details className="rounded-md border border-border bg-white">
      <summary className="flex min-h-10 cursor-pointer list-none items-center justify-between gap-3 px-3 text-sm">
        <span className="text-muted-foreground">{summary}</span>
        <span aria-hidden="true">▾</span>
      </summary>
      <div className="grid max-h-72 gap-2 overflow-auto border-t border-border p-3">
        {options.map((option) => (
          <label key={option} className="flex min-h-9 items-center gap-2 rounded-md px-2 text-sm hover:bg-muted">
            <input type="checkbox" name={name} value={option} defaultChecked={selected.includes(option)} />
            <span>{option}</span>
          </label>
        ))}
      </div>
    </details>
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
          <h1 className="text-3xl font-semibold">Create Referent Account</h1>
          <p className="mt-3 text-sm text-white/80">Complete these 4 steps to get started.</p>
        </div>
        <ol className="mt-12 grid gap-9">
          {referentSteps.map((step) => (
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
          Step {currentStep} of {maxReferentStep}
        </p>
        <p className="mt-1 font-semibold">{referentSteps[currentStep - 1]?.label}</p>
      </div>
    </>
  );
}

function OnboardingRecoveryCard() {
  return (
    <main className="shell flex min-h-screen items-center justify-center py-10">
      <Card className="max-w-xl">
        <h1 className="text-2xl font-semibold">Please sign in again</h1>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          Please sign back in to continue onboarding.
        </p>
        <Link
          className="focus-ring mt-5 inline-flex min-h-10 items-center rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground"
          href="/sign-in"
        >
          Sign in to continue
        </Link>
      </Card>
    </main>
  );
}

export default async function ReferentStepPage({
  params,
  searchParams
}: {
  params: Promise<{ step: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { step: stepParam } = await params;
  const query = await searchParams;
  const currentStep = Number(stepParam);

  if (!Number.isInteger(currentStep) || currentStep < 1 || currentStep > maxReferentStep) {
    notFound();
  }

  let draft: Awaited<ReturnType<typeof getOrCreateOnboardingDraft>>;

  try {
    draft = await getOrCreateOnboardingDraft("referent", false);
  } catch (error) {
    console.error("Referent onboarding bootstrap failed", error);

    if (isClerkIdentityError(error)) {
      redirect("/sign-in");
    }

    return <OnboardingRecoveryCard />;
  }

  const referentDetails = draft.referentDraft as Record<string, any> | null;

  if (!referentDetails && currentStep > 1) {
    redirect("/onboarding/referent/1");
  }

  const step = referentSteps[currentStep - 1];
  const action = saveReferentOnboardingStep.bind(null, currentStep);
  const selected = (values?: string[] | null) => values ?? [];

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
                    {requiredLabel("Organization name")}
                    <input name="organization" required defaultValue={referentDetails?.organization ?? ""} className={fieldClassName()} />
                  </label>
                  <label className="grid gap-2 text-sm font-medium">
                    {requiredLabel("Organization type")}
                    <select name="orgTypeDetail" required defaultValue={referentDetails?.orgTypeDetail ?? ""} className={fieldClassName()}>
                      <option value="" disabled>Select one</option>
                      {referentOrgTypeOptions.map((option) => <option key={option}>{option}</option>)}
                    </select>
                  </label>
                  <label className="grid gap-2 text-sm font-medium">
                    {requiredLabel("Primary address")}
                    <input name="streetAddress" required defaultValue={referentDetails?.streetAddress ?? ""} className={fieldClassName()} />
                  </label>
                  <div className="grid gap-4 md:grid-cols-3">
                    <label className="grid gap-2 text-sm font-medium">
                      {requiredLabel("City")}
                      <input name="city" required defaultValue={referentDetails?.city ?? ""} className={fieldClassName()} />
                    </label>
                    <label className="grid gap-2 text-sm font-medium">
                      {requiredLabel("State")}
                      <input name="state" required defaultValue={referentDetails?.state ?? ""} className={fieldClassName()} />
                    </label>
                    <label className="grid gap-2 text-sm font-medium">
                      {requiredLabel("Zip")}
                      <input name="zip" required defaultValue={referentDetails?.zip ?? ""} className={fieldClassName()} />
                    </label>
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <label className="grid gap-2 text-sm font-medium">
                      {requiredLabel("Main phone")}
                      <input name="phone" required defaultValue={referentDetails?.phone ?? ""} className={fieldClassName()} />
                    </label>
                    <label className="grid gap-2 text-sm font-medium">
                      Medical records fax
                      <input name="medicalRecordsFax" defaultValue={referentDetails?.medicalRecordsFax ?? ""} className={fieldClassName()} />
                    </label>
                  </div>
                  <label className="grid gap-2 text-sm font-medium">
                    Website URL
                    <input name="website" type="url" placeholder="https://example.com" defaultValue={referentDetails?.website ?? ""} className={fieldClassName()} />
                  </label>
                  <label className="grid gap-2 text-sm font-medium">
                    Health system affiliation
                    <input name="healthSystemAffiliation" defaultValue={referentDetails?.healthSystemAffiliation ?? ""} className={fieldClassName()} />
                  </label>
                  <div className="grid gap-4 md:grid-cols-2">
                    <label className="grid gap-2 text-sm font-medium">
                      NPI number
                      <input name="npiNumber" defaultValue={referentDetails?.npiNumber ?? ""} className={fieldClassName()} />
                    </label>
                    <label className="grid gap-2 text-sm font-medium">
                      State license number
                      <input name="stateLicenseNumber" defaultValue={referentDetails?.stateLicenseNumber ?? ""} className={fieldClassName()} />
                    </label>
                  </div>
                  <label className="grid gap-2 text-sm font-medium">
                    {requiredLabel("EHR system")}
                    <select name="ehrSystem" required defaultValue={referentDetails?.ehrSystem ?? "None"} className={fieldClassName()}>
                      {ehrSystemOptions.map((option) => <option key={option}>{option}</option>)}
                    </select>
                  </label>
                  <div className="grid gap-2 text-sm font-medium">
                    {requiredLabel("States operated in")}
                    {multiSelectDropdown("statesOperatedIn", statesOperatedOptions, selected(referentDetails?.statesOperatedIn))}
                  </div>
                </>
              ) : null}

              {currentStep === 2 ? (
                <>
                  <div className="grid gap-2 text-sm font-medium">
                    {requiredLabel("Level of care provided")}
                    {multiSelectDropdown("levelsOfCare", levelsOfCareOptions, selected(referentDetails?.levelsOfCare))}
                  </div>
                  <div className="grid gap-2 text-sm font-medium">
                    How do you currently place patients?
                    {multiSelectDropdown(
                      "currentPlacementMethods",
                      placementMethodOptions,
                      selected(referentDetails?.currentPlacementMethods)
                    )}
                  </div>
                  <label className="grid gap-2 text-sm font-medium">
                    {requiredLabel("Average patients referred to aftercare per month")}
                    <select name="avgMonthlyReferrals" required defaultValue={referentDetails?.avgMonthlyReferrals ?? ""} className={fieldClassName()}>
                      <option value="" disabled>Select one</option>
                      {avgMonthlyReferralOptions.map((option) => <option key={option}>{option}</option>)}
                    </select>
                  </label>
                </>
              ) : null}

              {currentStep === 3 ? (
                <>
                  <div className="text-sm font-medium">{requiredLabel("Plan")}</div>
                  <div className="grid gap-3">
                    {referentPlanOptions.map((planKey) => {
                      const plan = referentPlans[planKey];
                      const price = plan.monthlyPrice ? `$${plan.monthlyPrice}/mo` : "Custom";

                      return (
                        <label key={planKey} className="grid gap-2 rounded-md border border-border bg-white p-4">
                          <span className="flex items-start gap-3">
                            <input
                              type="radio"
                              name="selectedPlan"
                              value={planKey}
                              required
                              defaultChecked={(referentDetails?.selectedPlan ?? "professional") === planKey}
                            />
                            <span>
                              <span className="block font-semibold">{plan.label}</span>
                              <span className="mt-1 block text-sm text-muted-foreground">
                                {price} · {plan.teamMembers} team members · {plan.messaging ? "Messaging included" : "Messaging not included"}
                              </span>
                            </span>
                          </span>
                        </label>
                      );
                    })}
                  </div>
                  <label className="grid gap-2 text-sm font-medium">
                    {requiredLabel("Billing cycle")}
                    <select name="billingCycle" required defaultValue={referentDetails?.billingCycle ?? "monthly"} className={fieldClassName()}>
                      {billingCycleOptions.map((option) => <option key={option} value={option}>{option === "annual" ? "Annual" : "Monthly"}</option>)}
                    </select>
                  </label>
                  <div className="rounded-md border border-border bg-muted/60 p-4 text-sm text-muted-foreground">
                    Stripe checkout will be connected in the billing pass. This saves the selected plan for now.
                  </div>
                </>
              ) : null}

              {currentStep === 4 ? (
                <>
                  <label className="grid gap-2 text-sm font-medium">
                    Team emails
                    <textarea
                      name="invitedTeamEmails"
                      placeholder="one@email.com&#10;two@email.com"
                      defaultValue={referentDetails?.invitedTeamEmails.join("\n") ?? ""}
                      className="min-h-36 rounded-md border border-border bg-white p-3 text-sm"
                    />
                  </label>
                  <div className="rounded-md border border-border bg-muted/60 p-4 text-sm text-muted-foreground">
                    You can skip this for now. Team invitations will be sent once the invite email workflow is enabled.
                  </div>
                </>
              ) : null}

              <div className="fixed inset-x-0 bottom-0 border-t border-border bg-white p-4 lg:left-[320px]">
                <div className="mx-auto flex max-w-3xl gap-3">
                  {currentStep > 1 ? (
                    <Link className="focus-ring inline-flex min-h-11 flex-1 items-center justify-center rounded-md border border-border px-4 text-sm font-semibold" href={`/onboarding/referent/${currentStep - 1}`}>
                      Back
                    </Link>
                  ) : (
                    <Link className="focus-ring inline-flex min-h-11 flex-1 items-center justify-center rounded-md border border-border px-4 text-sm font-semibold" href="/onboarding/account-type">
                      Back
                    </Link>
                  )}
                  <button className="focus-ring min-h-11 flex-1 rounded-md bg-[#121b57] px-4 text-sm font-semibold text-white">
                    {currentStep === maxReferentStep ? "Finish" : "Next"}
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
