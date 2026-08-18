import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { MultiSelectDropdown } from "@/components/onboarding/multi-select-dropdown";
import { OnboardingRecoveryCard } from "@/components/onboarding/onboarding-recovery-card";
import { BackLink } from "@/components/public/back-link";
import { Card } from "@/components/ui/card";
import { enterpriseSalesHref, getBillingPlansWithStripePrices } from "@/lib/billing";
import { isClerkIdentityError } from "@/lib/current-user";
import { getOrCreateOnboardingDraft } from "@/lib/onboarding";
import { referentPlans } from "@/lib/plans";
import {
  avgMonthlyReferralOptions,
  billingCycleOptions,
  ehrSystemOptions,
  maxReferentStep,
  placementMethodOptions,
  referentOrgTypeOptions,
  referentPlanOptions,
  referentSteps,
  roleOrganizationDescriptionOptions,
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
  const referentBillingPlans = currentStep === 3 ? await getBillingPlansWithStripePrices("referent") : [];
  const selected = (values?: string[] | null) => values ?? [];
  const invitedTeamEmails = Array.isArray(referentDetails?.invitedTeamEmails)
    ? referentDetails.invitedTeamEmails.map(String)
    : [];

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
                    <MultiSelectDropdown name="statesOperatedIn" options={statesOperatedOptions} selected={selected(referentDetails?.statesOperatedIn)} />
                  </div>
                </>
              ) : null}

              {currentStep === 2 ? (
                <>
                  <fieldset className="grid gap-3">
                    <legend className="text-sm font-medium">
                      {requiredLabel("What best describes your role and organization?")}
                    </legend>
                    <div className="grid gap-3">
                      {roleOrganizationDescriptionOptions.map((option) => (
                        <label key={option.label} className="flex min-h-16 items-start gap-3 rounded-md border border-border bg-white p-3 text-sm">
                          <input
                            className="mt-1"
                            defaultChecked={referentDetails?.roleOrganizationDescription === option.label}
                            name="roleOrganizationDescription"
                            required
                            type="radio"
                            value={option.label}
                          />
                          <span>
                            <span className="block font-semibold">{option.label}</span>
                            <span className="mt-1 block leading-5 text-muted-foreground">{option.description}</span>
                          </span>
                        </label>
                      ))}
                    </div>
                  </fieldset>
                  <div className="grid gap-2 text-sm font-medium">
                    How do you currently place patients?
                    <MultiSelectDropdown
                      name="currentPlacementMethods"
                      options={placementMethodOptions}
                      selected={selected(referentDetails?.currentPlacementMethods)}
                    />
                  </div>
                  <label className="grid gap-2 text-sm font-medium">
                    {requiredLabel("Referred to outpatient programming and/or supportive housing per month")}
                    <select name="avgMonthlyReferrals" required defaultValue={referentDetails?.avgMonthlyReferrals ?? ""} className={fieldClassName()}>
                      <option value="" disabled>Select one</option>
                      {avgMonthlyReferralOptions.map((option) => <option key={option}>{option}</option>)}
                    </select>
                  </label>
                </>
              ) : null}

              {currentStep === 3 ? (
                <>
                  <div className="text-sm font-medium">Plan preference</div>
                  <div className="ac-panel-card p-4 text-sm text-muted-foreground">
                    Billing is skipped during alpha onboarding. Choose a preference now, or continue with the default Professional plan.
                  </div>
                  <div className="grid gap-3">
                    {referentPlanOptions.map((planKey) => {
                      const plan = referentPlans[planKey];
                      const price = referentBillingPlans.find((billingPlan) => billingPlan.key === planKey)?.priceLabels.monthly ?? "Custom";

                      if (planKey === "enterprise") {
                        return (
                          <div key={planKey} className="ac-panel-card grid gap-3 p-4">
                            <div>
                              <span className="block font-semibold">{plan.label}</span>
                              <span className="mt-1 block text-sm text-muted-foreground">
                                Unlimited team members · Messaging included · Custom support
                              </span>
                            </div>
                            <a className="focus-ring ac-button ac-button--secondary w-fit" href={enterpriseSalesHref}>
                              Contact sales
                            </a>
                          </div>
                        );
                      }

                      return (
                        <label key={planKey} className="ac-panel-card grid gap-2 p-4">
                          <span className="flex items-start gap-3">
                            <input
                              type="radio"
                              name="selectedPlan"
                              value={planKey}
                              defaultChecked={(referentDetails?.selectedPlan === "enterprise" ? "professional" : referentDetails?.selectedPlan ?? "professional") === planKey}
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
                    Preferred billing cycle
                    <select name="billingCycle" defaultValue={referentDetails?.billingCycle ?? "monthly"} className={fieldClassName()}>
                      {billingCycleOptions.map((option) => <option key={option} value={option}>{option === "annual" ? "Annual" : "Monthly"}</option>)}
                    </select>
                  </label>
                </>
              ) : null}

              {currentStep === 4 ? (
                <>
                  <label className="grid gap-2 text-sm font-medium">
                    Team emails
                    <textarea
                      name="invitedTeamEmails"
                      placeholder="one@email.com&#10;two@email.com"
                      defaultValue={invitedTeamEmails.join("\n")}
                      className="min-h-36 rounded-md border border-border bg-white p-3 text-sm"
                    />
                  </label>
                  <div className="ac-panel-card p-4 text-sm text-muted-foreground">
                    You can skip this for now. Team invitations will be sent once the invite email workflow is enabled.
                  </div>
                </>
              ) : null}

              <div className="fixed inset-x-0 bottom-0 border-t border-border bg-white p-4 lg:left-[320px]">
                <div className="mx-auto flex max-w-3xl gap-3">
                  {currentStep > 1 ? (
                    <BackLink className="flex-1 justify-center" href={`/onboarding/referent/${currentStep - 1}`}>
                      Back
                    </BackLink>
                  ) : (
                    <BackLink className="flex-1 justify-center" href="/onboarding/account-type">
                      Back
                    </BackLink>
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
