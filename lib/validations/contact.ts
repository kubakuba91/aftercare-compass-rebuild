import { z } from "zod";

export const contactInquirySchema = z.object({
  name: z.string().trim().min(1).max(120),
  email: z.string().trim().email().max(254),
  organization: z.string().trim().max(160).optional(),
  role: z.enum(["Provider", "Referent", "Partner", "Press", "Other"]),
  message: z.string().trim().min(1).max(3000),
  companyWebsite: z.string().max(0).optional()
});
