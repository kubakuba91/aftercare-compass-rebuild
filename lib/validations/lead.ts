import { z } from "zod";

export const publicLeadSchema = z.object({
  profileId: z.string().min(1),
  name: z.string().min(1).max(120),
  email: z.string().email(),
  phone: z.string().max(40).optional(),
  message: z.string().min(10).max(2000)
});

