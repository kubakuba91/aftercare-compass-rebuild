import { z } from "zod";

export const referentSteps = [
  { number: 1, slug: "organization", label: "Organization", title: "Tell us about your organization" },
  { number: 2, slug: "referral-context", label: "Referral Context", title: "Set up your referral context" },
  { number: 3, slug: "plan", label: "Plan", title: "Choose your referent plan" },
  { number: 4, slug: "team", label: "Team", title: "Invite your team" }
] as const;

export const maxReferentStep = referentSteps.length;

export const referentOrgTypeOptions = [
  "Hospital / Health System",
  "Inpatient Residential Treatment Center",
  "Partial Hospitalization Program (PHP)",
  "Intensive Outpatient Program (IOP)",
  "Crisis Stabilization Center",
  "Community Mental Health Center",
  "Community Outreach Organization",
  "Other"
] as const;

export const ehrSystemOptions = ["Epic", "Cerner", "Athena", "eClinicalWorks", "Other", "None"] as const;

export const statesOperatedOptions = [
  "Alabama",
  "Alaska",
  "Arizona",
  "Arkansas",
  "California",
  "Colorado",
  "Connecticut",
  "Delaware",
  "Florida",
  "Georgia",
  "Hawaii",
  "Idaho",
  "Illinois",
  "Indiana",
  "Iowa",
  "Kansas",
  "Kentucky",
  "Louisiana",
  "Maine",
  "Maryland",
  "Massachusetts",
  "Michigan",
  "Minnesota",
  "Mississippi",
  "Missouri",
  "Montana",
  "Nebraska",
  "Nevada",
  "New Hampshire",
  "New Jersey",
  "New Mexico",
  "New York",
  "North Carolina",
  "North Dakota",
  "Ohio",
  "Oklahoma",
  "Oregon",
  "Pennsylvania",
  "Rhode Island",
  "South Carolina",
  "South Dakota",
  "Tennessee",
  "Texas",
  "Utah",
  "Vermont",
  "Virginia",
  "Washington",
  "West Virginia",
  "Wisconsin",
  "Wyoming",
  "Washington, DC"
] as const;

export const levelsOfCareOptions = [
  "Detox",
  "Residential (RTC)",
  "Partial Hospitalization (PHP)",
  "Intensive Outpatient (IOP)",
  "Outpatient",
  "Crisis Stabilization",
  "Community Outreach"
] as const;

export const placementMethodOptions = [
  "Phone calls",
  "Fax",
  "Email",
  "Spreadsheet",
  "EHR referral module",
  "Other"
] as const;

export const avgMonthlyReferralOptions = ["1-5", "6-15", "16-30", "30+"] as const;
export const referentPlanOptions = ["starter", "professional", "enterprise"] as const;
export const billingCycleOptions = ["monthly", "annual"] as const;

const requiredText = z.string().trim().min(1);
const optionalText = z.string().trim().optional();
const optionalUrl = z
  .string()
  .trim()
  .optional()
  .refine((value) => !value || /^https?:\/\/.+\..+/.test(value), "Enter a valid URL starting with http:// or https://");

export function valuesFromForm(formData: FormData, name: string) {
  return formData.getAll(name).map(String).filter(Boolean);
}

export function nullableText(value: string | undefined) {
  return value?.trim() ? value.trim() : null;
}

export function emailsFromText(value: string | undefined) {
  if (!value?.trim()) {
    return [];
  }

  return value
    .split(/[\n,]/)
    .map((email) => email.trim())
    .filter(Boolean);
}

export const referentStepOneSchema = z.object({
  organization: requiredText.max(160),
  orgTypeDetail: z.enum(referentOrgTypeOptions),
  streetAddress: requiredText.max(200),
  city: requiredText.max(120),
  state: requiredText.max(40),
  zip: requiredText.max(20),
  phone: requiredText.max(40),
  medicalRecordsFax: optionalText,
  website: optionalUrl,
  healthSystemAffiliation: optionalText,
  npiNumber: optionalText,
  stateLicenseNumber: optionalText,
  ehrSystem: z.enum(ehrSystemOptions),
  statesOperatedIn: z.array(z.enum(statesOperatedOptions)).min(1)
});

export const referentStepTwoSchema = z.object({
  levelsOfCare: z.array(z.enum(levelsOfCareOptions)).min(1),
  currentPlacementMethods: z.array(z.enum(placementMethodOptions)).default([]),
  avgMonthlyReferrals: z.enum(avgMonthlyReferralOptions)
});

export const referentStepThreeSchema = z.object({
  selectedPlan: z.enum(referentPlanOptions),
  billingCycle: z.enum(billingCycleOptions)
});

export const referentStepFourSchema = z.object({
  invitedTeamEmails: z.array(z.string().trim().email()).default([])
});
