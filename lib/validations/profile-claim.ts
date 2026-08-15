import { z } from "zod";

export const profileClaimRequestSchema = z.object({
  profileId: z.string().min(1),
  slug: z.string().min(1),
  claimantName: z.string().trim().min(2, "Name is required").max(120),
  claimantEmail: z.string().trim().email("Use a valid email").max(160),
  claimantPhone: z.string().trim().max(40).optional(),
  claimantRole: z.string().trim().min(2, "Role is required").max(120),
  claimantOrganization: z.string().trim().min(2, "Organization is required").max(160),
  relationshipToProgram: z.string().trim().min(2, "Relationship details are required").max(600),
  notes: z.string().trim().max(1200).optional(),
  claimOutreachToken: z.string().trim().max(160).optional()
});
