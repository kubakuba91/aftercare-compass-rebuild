import { z } from "zod";

export const aftercareProfileDraftSchema = z.object({
  profileType: z.enum(["sober_living", "continued_care"]),
  programName: z.string().min(2).max(160),
  streetAddress: z.string().min(2).max(200),
  city: z.string().min(2).max(120),
  state: z.string().min(2).max(40),
  zip: z.string().min(5).max(20),
  admissionsContactPhone: z.string().min(7).max(40),
  admissionsContactEmail: z.string().email(),
  description: z.string().min(20).max(2000),
  populationServed: z.enum(["men", "women", "both", "lgbtq"]),
  totalBeds: z.coerce.number().int().nonnegative().optional(),
  bedsAvailable: z.coerce.number().int().nonnegative().optional(),
  acceptingNewPatients: z.enum(["yes", "no"]).optional()
});

