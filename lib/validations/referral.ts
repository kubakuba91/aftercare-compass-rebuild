import { z } from "zod";

export const referralSchema = z.object({
  aftercareProfileId: z.string().min(1),
  caseManagerName: z.string().min(1),
  caseManagerEmail: z.string().email(),
  caseManagerPhone: z.string().min(7),
  caseManagerOrganization: z.string().min(1),
  clientAgeRange: z.enum(["18_25", "26_35", "36_45", "46_55", "55_plus"]),
  supportCategory: z.enum(["substance_use", "mental_health", "co_occurring", "other"]),
  insuranceCategory: z.enum(["medicaid", "medicare", "commercial", "self_pay"]),
  preferredStartWindow: z.enum(["within_1_week", "1_2_weeks", "2_4_weeks", "flexible"]),
  specialNeeds: z.array(z.string()).default([]),
  reasonForReferral: z.string().min(20).max(2000)
});

export const forbiddenDirectIdentifierFields = [
  "patientName",
  "patientDob",
  "patientEmail",
  "patientPhone",
  "patientAddress",
  "medicalRecordNumber"
] as const;

