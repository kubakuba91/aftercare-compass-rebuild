import { z } from "zod";

export const referentSteps = [
  { number: 1, slug: "organization", label: "Organization", title: "Tell us about your organization" },
  { number: 2, slug: "referral-context", label: "Referral Context", title: "Set up your referral context" },
  { number: 3, slug: "plan", label: "Plan Preference", title: "Choose your starting plan" },
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

export const ehrSystemOptions = ["Epic", "Cerner", "Athena", "Kipu", "eClinicalWorks", "Other", "None"] as const;

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

export const placementMethodOptions = [
  "Phone calls",
  "Fax",
  "Email",
  "Spreadsheet",
  "EHR referral module",
  "Other"
] as const;

export const roleOrganizationDescriptionOptions = [
  {
    label: "Hospital Social Worker / Discharge Planner",
    description: "Referring patients from hospitals, emergency departments, psychiatric units, or medical detox."
  },
  {
    label: "Treatment Case Manager",
    description: "Coordinating discharge and aftercare from residential, inpatient, or detox programs."
  },
  {
    label: "Behavioral Health Clinician",
    description: "Therapist, counselor, psychologist, or other clinician referring clients who need additional support or recovery housing."
  },
  {
    label: "Psychiatric or Medical Provider",
    description: "Psychiatrist, physician, nurse practitioner, or MAT provider overseeing ongoing treatment."
  },
  {
    label: "Community Mental Health Professional",
    description: "Community support worker, care coordinator, crisis worker, or outreach specialist connecting clients to services."
  },
  {
    label: "Peer Recovery or Recovery Community Organization",
    description: "Peer specialists, recovery coaches, recovery community organizations, and nonprofit recovery support staff."
  },
  {
    label: "Veterans Services Professional",
    description: "VA Community Care coordinators, veteran service organizations, and veteran-focused case managers."
  },
  {
    label: "Court, Probation, or Justice Professional",
    description: "Drug court staff, probation/parole officers, corrections reentry specialists, and legal diversion programs."
  },
  {
    label: "Employee Assistance or Workplace Support Professional",
    description: "EAP coordinators, HR wellness programs, and employer-sponsored referral services."
  },
  {
    label: "Intervention or Placement Specialist",
    description: "Interventionists, treatment consultants, and professional placement coordinators."
  },
  {
    label: "Housing and Community Support Professional",
    description: "Homeless services, supportive housing, recovery housing operators, and housing navigators."
  },
  {
    label: "Other",
    description: "Another referral, care coordination, or placement role."
  }
] as const;

export const roleOrganizationDescriptionLabels = roleOrganizationDescriptionOptions.map((option) => option.label) as [
  string,
  ...string[]
];

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
  roleOrganizationDescription: z.enum(roleOrganizationDescriptionLabels),
  currentPlacementMethods: z.array(z.enum(placementMethodOptions)).default([]),
  avgMonthlyReferrals: z.enum(avgMonthlyReferralOptions)
});

export const referentStepThreeSchema = z.object({
  selectedPlan: z.enum(referentPlanOptions),
  billingCycle: z.enum(billingCycleOptions).default("monthly")
});

export const referentStepFourSchema = z.object({
  invitedTeamEmails: z.array(z.string().trim().email()).default([])
});
