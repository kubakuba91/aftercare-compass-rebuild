import { z } from "zod";

export const soberLivingSteps = [
  { number: 1, slug: "program-info", label: "Program Info", title: "Let's go over some program details" },
  { number: 2, slug: "housing-details", label: "Housing Details", title: "Set up beds and housing details" },
  { number: 3, slug: "services-amenities", label: "Services & Amenities", title: "Choose services and amenities" },
  { number: 4, slug: "profile-media", label: "Profile & Media", title: "Tell referents what makes this home a fit" },
  { number: 5, slug: "referral-preferences", label: "Referral Preferences", title: "Confirm referral preferences" }
] as const;

export const maxSoberLivingStep = soberLivingSteps.length;

export const populationOptions = [
  "Men",
  "Women",
  "LGBTQ+"
] as const;

export const specialtyPopulationOptions = [
  "First Responders / Veterans",
  "Professionals",
  "Young Adults (18-25)",
  "Seniors (55+)"
] as const;

export const certificationOptions = [
  "NARR Level 1",
  "NARR Level 2",
  "NARR Level 3",
  "Sober Living Network (SLN)",
  "Minnesota Association of Sober Homes (MASH)",
  "The Joint Commission",
  "CARF",
  "Oxford House",
  "State-specific license"
] as const;

export const averageLengthOptions = [
  "30 days",
  "60 days",
  "90 days",
  "6 months",
  "9 months",
  "12 months",
  "Flexible"
] as const;

export const roomTypeOptions = ["Private", "Double occupancy", "Triple occupancy", "Dormitory"] as const;

export const supportServiceOptions = [
  "12-Step Meetings",
  "AA/NA on-site",
  "Case Management",
  "Clinician on staff",
  "Legal Support",
  "Life Skills Training",
  "Vocational Support",
  "Transportation Assistance",
  "Peer Support Specialist",
  "Mental Health Services",
  "Trauma-Informed Care"
] as const;

export const amenityOptions = [
  "High-Speed WiFi",
  "Memory Foam Mattress",
  "Overnight Passes",
  "Pet Friendly",
  "Multiple Refrigerators",
  "Public Transportation Access",
  "In-unit Laundry",
  "Gym/Fitness Access",
  "Private Bathroom",
  "Outdoor Space",
  "TV in room",
  "Parking"
] as const;

export const insuranceOptions = [
  "Medicaid",
  "Medicare",
  "Commercial Insurance",
  "Private Pay / Self-Pay",
  "Sliding Scale"
] as const;

export const medicationAdministrationOptions = [
  "Self-administered only",
  "Staff-assisted",
  "Both"
] as const;

export const matOptions = [
  "Suboxone / Buprenorphine",
  "Vivitrol / Naltrexone",
  "Methadone",
  "All MAT accepted",
  "No MAT accepted"
] as const;

export const drugTestingPolicyOptions = [
  "Daily",
  "Random",
  "Weekly",
  "Upon suspicion",
  "Not conducted"
] as const;

export const preferredContactOptions = ["Phone", "Email", "In-app message", "Any"] as const;

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

export const stepOneSchema = z.object({
  programName: requiredText.max(160),
  streetAddress: requiredText.max(200),
  city: requiredText.max(120),
  state: requiredText.max(40),
  zip: requiredText.max(20),
  admissionsContactPhone: requiredText.max(40),
  admissionsContactEmail: z.string().trim().email(),
  websiteUrl: optionalUrl,
  populationServed: z.array(z.enum(populationOptions)).min(1),
  specialtyPopulations: z.array(z.string()).default([]),
  certificationsHeld: z.array(z.string()).default([]),
  averageLengthOfStay: requiredText.max(80)
});

export const stepTwoSchema = z.object({
  profileId: requiredText,
  bedsMen: z.coerce.number().int().nonnegative(),
  bedsMenAvailable: z.coerce.number().int().nonnegative(),
  bedsWomen: z.coerce.number().int().nonnegative(),
  bedsWomenAvailable: z.coerce.number().int().nonnegative(),
  bedsLgbtq: z.coerce.number().int().nonnegative(),
  bedsLgbtqAvailable: z.coerce.number().int().nonnegative(),
  roomTypes: z.array(z.string()).default([]),
  bedsReservedNotes: optionalText,
  wheelchairAccessible: z.enum(["yes", "no"]),
  wheelchairAccessibleBeds: z.coerce.number().int().nonnegative().optional(),
  pricePerWeek: z.coerce.number().int().nonnegative().optional()
});

export const stepThreeSchema = z.object({
  profileId: requiredText,
  supportServices: z.array(z.string()).default([]),
  amenities: z.array(z.string()).default([]),
  insuranceAccepted: z.array(z.string()).default([]),
  fundingAvailable: z.enum(["yes", "no"]),
  fundingNotes: optionalText,
  medicationAdministration: requiredText.max(80),
  matAccepted: z.array(z.string()).default([]),
  medicationRestrictions: optionalText,
  drugTestingPolicy: requiredText.max(80)
});

export const stepFourSchema = z.object({
  profileId: requiredText,
  description: requiredText.max(2000),
  houseRulesText: optionalText,
  photoReadiness: z.array(z.string()).default([]),
  videoUrls: z.array(z.string().trim().url()).max(3).default([]),
  preferredContactMethod: requiredText.max(80)
});

export const stepFiveSchema = z.object({
  profileId: requiredText,
  availabilityNotes: optionalText,
  referralFitNotes: optionalText,
  goodNeighborPolicyAcknowledged: z.literal("yes")
});
