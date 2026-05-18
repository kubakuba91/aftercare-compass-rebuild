export const referentPlans = {
  starter: {
    label: "Starter",
    monthlyPrice: 99,
    teamMembers: 3,
    submitReferrals: true,
    messaging: false,
    savedSearches: false,
    bedAlerts: false,
    referralStatusTracking: false,
    placementNotes: false
  },
  professional: {
    label: "Professional",
    monthlyPrice: 299,
    teamMembers: 15,
    submitReferrals: true,
    messaging: true,
    savedSearches: true,
    bedAlerts: true,
    referralStatusTracking: true,
    placementNotes: true
  },
  enterprise: {
    label: "Enterprise",
    monthlyPrice: null,
    teamMembers: "unlimited",
    submitReferrals: true,
    messaging: true,
    savedSearches: true,
    bedAlerts: true,
    referralStatusTracking: true,
    placementNotes: true
  }
} as const;

export const aftercarePlans = {
  claimed_listing: {
    label: "Claimed Listing",
    monthlyPrice: 0,
    profiles: 1,
    managers: 1,
    directReferralIntake: false,
    generalInquiryForm: true,
    messaging: false,
    liveAvailability: false,
    verificationEligible: false,
    placementTracking: false,
    photoGalleryLimit: 3,
    badge: "Self-Reported"
  },
  professional: {
    label: "Professional",
    monthlyPrice: 149,
    profiles: 1,
    managers: 3,
    directReferralIntake: true,
    generalInquiryForm: true,
    messaging: false,
    liveAvailability: true,
    verificationEligible: true,
    placementTracking: false,
    photoGalleryLimit: 12,
    badge: "Self-Reported"
  },
  verified: {
    label: "Verified",
    monthlyPrice: 499,
    profiles: 5,
    managers: 10,
    directReferralIntake: true,
    generalInquiryForm: true,
    messaging: true,
    liveAvailability: true,
    verificationEligible: true,
    placementTracking: true,
    photoGalleryLimit: 12,
    badge: "Aftercare Compass Verified"
  },
  network: {
    label: "Network",
    monthlyPrice: 999,
    profiles: "unlimited",
    managers: "unlimited",
    directReferralIntake: true,
    generalInquiryForm: true,
    messaging: true,
    liveAvailability: true,
    verificationEligible: true,
    placementTracking: true,
    photoGalleryLimit: 12,
    badge: "Enterprise Verified Network"
  }
} as const;
