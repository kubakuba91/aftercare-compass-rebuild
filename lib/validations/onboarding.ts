import { z } from "zod";

const shortText = z.string().trim().min(1);

export const aftercareProfileDraftSchema = z.object({
  profileType: z.enum(["sober_living", "continued_care"]),
  programName: shortText.max(160),
  streetAddress: shortText.max(200),
  city: shortText.max(120),
  state: shortText.max(40),
  zip: shortText.max(20),
  admissionsContactPhone: shortText.max(40),
  admissionsContactEmail: z.string().trim().email(),
  description: shortText.max(2000),
  populationServed: z.enum(["men", "women", "both", "lgbtq"]),
  totalBeds: z.coerce.number().int().nonnegative().optional(),
  bedsAvailable: z.coerce.number().int().nonnegative().optional(),
  acceptingNewPatients: z.enum(["yes", "no"]).optional()
});
