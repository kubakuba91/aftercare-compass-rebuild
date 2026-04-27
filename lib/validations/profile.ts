import { z } from "zod";

export const profileTypeSchema = z.enum(["sober_living", "continued_care"]);

export const soberLivingAvailabilitySchema = z
  .object({
    totalBeds: z.number().int().nonnegative(),
    bedsMen: z.number().int().nonnegative(),
    bedsWomen: z.number().int().nonnegative(),
    bedsLgbtq: z.number().int().nonnegative(),
    bedsAvailable: z.number().int().nonnegative()
  })
  .refine(
    (value) => value.bedsMen + value.bedsWomen + value.bedsLgbtq === value.totalBeds,
    "Bed breakdown must equal total beds."
  )
  .refine((value) => value.bedsAvailable <= value.totalBeds, "Available beds cannot exceed total beds.");

export const continuedCareAvailabilitySchema = z.object({
  acceptingNewPatients: z.boolean(),
  nextAvailableDate: z.string().optional(),
  availabilityNotes: z.string().max(1000).optional()
});

