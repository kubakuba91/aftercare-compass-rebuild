export const referentPlans = {
  starter: {
    label: "Starter",
    monthlyPrice: 99,
    teamMembers: 3,
    messaging: false,
    savedSearches: false,
    referralStatusTracking: false
  },
  professional: {
    label: "Professional",
    monthlyPrice: 299,
    teamMembers: 15,
    messaging: true,
    savedSearches: true,
    referralStatusTracking: true
  },
  enterprise: {
    label: "Enterprise",
    monthlyPrice: null,
    teamMembers: "unlimited",
    messaging: true,
    savedSearches: true,
    referralStatusTracking: true
  }
} as const;

export const aftercarePlans = {
  basic: {
    label: "Basic",
    monthlyPrice: 149,
    profiles: 1,
    managers: 2,
    messaging: false,
    liveAvailability: false,
    verificationTierEligible: 1
  },
  verified: {
    label: "Verified",
    monthlyPrice: 349,
    profiles: 5,
    managers: 10,
    messaging: true,
    liveAvailability: true,
    verificationTierEligible: 2
  },
  network: {
    label: "Network",
    monthlyPrice: 699,
    profiles: "unlimited",
    managers: "unlimited",
    messaging: true,
    liveAvailability: true,
    verificationTierEligible: 3
  }
} as const;

