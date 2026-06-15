import { z } from "zod";
import {
  matOptions,
  nullableText,
  preferredContactOptions,
  valuesFromForm
} from "@/lib/sober-living-onboarding";
import { levelsOfCareOptions } from "@/lib/levels-of-care";

export { nullableText, valuesFromForm };
export { levelsOfCareOptions as levelOfCareOptions };

export const continuedCareSteps = [
  { number: 1, slug: "program-basics", label: "Program Basics", title: "Program Basics" },
  { number: 2, slug: "clinical-details", label: "Clinical Details", title: "Clinical Details" },
  { number: 3, slug: "intake-referral", label: "Intake & Referral", title: "Intake & Referral" },
  { number: 4, slug: "program-profile", label: "Program Profile", title: "Describe Your Program" },
  { number: 5, slug: "media-availability", label: "Media & Availability", title: "Media & Availability" }
] as const;

export const maxContinuedCareStep = continuedCareSteps.length;

export const telehealthModeOptions = ["In-person only", "Virtual only", "Hybrid"] as const;
export const programmingScheduleOptions = ["Mornings", "Afternoons", "Evenings", "Weekends", "24/7"] as const;
export const clientAcceptanceMethodOptions = ["Walk-ins welcome", "Same-day intake", "By appointment only"] as const;
export const medicationServiceOptions = [
  "Psychiatric medication management",
  "MAT / Addiction medication management",
  "None"
] as const;
export const continuedCareDurationOptions = [
  "30 days",
  "30-60 days",
  "60-90 days",
  "90+ days",
  "Ongoing / No set end date",
  "Ongoing / as needed"
] as const;
export const languageServedOptions = ["English only", "Spanish", "Other"] as const;

const requiredText = z.string().trim().min(1);
const optionalText = z.string().trim().optional();
const optionalUrl = z
  .string()
  .trim()
  .optional()
  .refine((value) => !value || /^https?:\/\/.+\..+/.test(value), "Enter a valid URL starting with http:// or https://");

export const continuedCareStepOneSchema = z.object({
  programName: requiredText.max(160),
  streetAddress: requiredText.max(200),
  city: requiredText.max(120),
  state: requiredText.max(40),
  zip: requiredText.max(20),
  websiteUrl: optionalUrl,
  telehealthMode: z.enum(telehealthModeOptions),
  additionalLocations: optionalText,
  stateLicenseNumber: optionalText,
  certificationsHeld: z.array(z.string()).default([]),
  accreditations: z.array(z.string()).default([]),
  clinicalFocus: z.array(z.string()).default([])
});

export const continuedCareStepTwoSchema = z.object({
  levelsOfCare: z.array(z.string()).min(1),
  programmingSchedule: z.array(z.string()).min(1),
  populationServed: z.array(z.string()).min(1),
  specialtyPopulations: z.array(z.string()).default([]),
  medicationServicesOffered: z.array(z.string()).min(1),
  matAccepted: z.array(z.string()).default([]),
  averageLengthOfStay: z.enum(continuedCareDurationOptions),
  languagesServed: z.array(z.string()).min(1)
});

export const continuedCareStepThreeSchema = z.object({
  intakeContactName: requiredText.max(160),
  admissionsContactPhone: requiredText.max(40),
  admissionsContactEmail: z.string().trim().email(),
  insuranceAccepted: z.array(z.string()).default([]),
  clientAcceptanceMethods: z.array(z.string()).min(1),
  referralProcessDescription: requiredText.max(2000),
  medicalRecordsFax: optionalText
});

export const continuedCareStepFourSchema = z.object({
  affiliatedSoberLivingHomes: optionalText,
  description: requiredText.max(2400),
  supportServices: z.array(z.string()).default([]),
  preferredContactMethod: z.enum(preferredContactOptions)
});

export const continuedCareStepFiveSchema = z.object({
  acceptingNewPatients: z.enum(["yes", "no"]),
  availabilityNotes: optionalText,
  photoReadiness: z.array(z.string()).default([]),
  videoUrls: z.array(z.string().trim().url()).max(3).default([])
});

export const continuedCareOptionGroups = {
  mat: matOptions,
  contact: preferredContactOptions
} as const;
