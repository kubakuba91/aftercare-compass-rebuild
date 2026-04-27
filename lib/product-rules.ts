export const productRules = {
  betaFocus: "aftercare_supply_first",
  mvpDepth: "referral_ready",
  authProvider: "clerk",
  supabaseScope: ["database", "storage", "realtime"],
  reviewsAndRatingsInV1: false,
  videoUploadsInV1: false,
  videoUrlsInV1: true,
  publicLeadCapture: true,
  exactAddressesVisibleToReferents: false,
  exactAddressesVisibleToPublic: false,
  oneOrganizationPerEmail: true,
  enterpriseBilling: "stripe_custom_pricing"
} as const;

export const referralStatuses = [
  "pending",
  "viewed",
  "accepted",
  "declined",
  "waitlisted",
  "placed",
  "closed"
] as const;

export type ReferralStatus = (typeof referralStatuses)[number];

export const allowedReferralTransitions: Record<ReferralStatus, ReferralStatus[]> = {
  pending: ["viewed", "closed"],
  viewed: ["accepted", "declined", "waitlisted", "closed"],
  accepted: ["placed", "closed"],
  declined: ["closed"],
  waitlisted: ["accepted", "declined", "closed"],
  placed: ["closed"],
  closed: []
};

export function canTransitionReferral(from: ReferralStatus, to: ReferralStatus) {
  return allowedReferralTransitions[from].includes(to);
}

