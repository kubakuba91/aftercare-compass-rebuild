import { z } from "zod";
import {
  certificationOptions,
  insuranceOptions,
  matOptions,
  nullableText,
  populationOptions,
  preferredContactOptions,
  specialtyPopulationOptions,
  supportServiceOptions,
  valuesFromForm
} from "@/lib/sober-living-onboarding";

export { nullableText, valuesFromForm };

export const continuedCareSteps = [
  { number: 1, slug: "program-info", label: "Program Info", title: "Tell us about your program" },
  { number: 2, slug: "clinical-details", label: "Clinical Details", title: "Add clinical details" },
  { number: 3, slug: "intake-referral", label: "Intake & Referral", title: "Set intake and referral details" },
  { number: 4, slug: "profile-partnerships", label: "Profile", title: "Describe the program" },
  { number: 5, slug: "media-availability", label: "Media & Availability", title: "Finish program setup" }
] as const;

export const maxContinuedCareStep = continuedCareSteps.length;

export const programTypeOptions = [
  "Partial Hospitalization Program (PHP)",
  "Intensive Outpatient Program (IOP)",
  "Standard Outpatient (OP)",
  "MAT Clinic",
  "Dual Diagnosis Program"
] as const;

export const telehealthModeOptions = ["In-person only", "Telehealth only", "Hybrid"] as const;
export const levelOfCareOptions = ["PHP", "IOP", "OP"] as const;
export const continuedCareDurationOptions = [
  "30 days",
  "30-60 days",
  "60-90 days",
  "90+ days",
  "Ongoing / as needed"
] as const;

const requiredText = z.string().trim().min(1);
const optionalText = z.string().trim().optional();
const optionalUrl = z
  .string()
  .trim()
  .optional()
  .refine((value) => !value || /^https?:\/\/.+\..+/.test(value), "Enter a valid URL starting with http:// or https://");

export const continuedCareStepOneSchema = z.object({
  programName: requiredText.max(160),
  programTypes: z.array(z.enum(programTypeOptions)).min(1),
  streetAddress: requiredText.max(200),
  city: requiredText.max(120),
  state: requiredText.max(40),
  zip: requiredText.max(20),
  websiteUrl: optionalUrl,
  telehealthMode: z.enum(telehealthModeOptions),
  additionalLocations: optionalText,
  stateLicenseNumber: requiredText.max(120),
  certificationsHeld: z.array(z.string()).default([])
});

export const continuedCareStepTwoSchema = z.object({
  levelsOfCare: z.array(z.enum(levelOfCareOptions)).min(1),
  hoursOfOperation: requiredText.max(500),
  populationServed: z.array(z.enum(populationOptions)).min(1),
  specialtyPopulations: z.array(z.string()).default([]),
  matServicesOffered: z.enum(["yes", "no"]),
  matAccepted: z.array(z.string()).default([]),
  coOccurringTreatment: z.enum(["yes", "no"]),
  averageLengthOfStay: z.enum(continuedCareDurationOptions)
});

export const continuedCareStepThreeSchema = z.object({
  intakeContactName: requiredText.max(160),
  admissionsContactPhone: requiredText.max(40),
  admissionsContactEmail: z.string().trim().email(),
  insuranceAccepted: z.array(z.string()).default([]),
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
  certifications: certificationOptions,
  insurance: insuranceOptions,
  mat: matOptions,
  population: populationOptions,
  specialty: specialtyPopulationOptions,
  support: supportServiceOptions,
  contact: preferredContactOptions
} as const;
