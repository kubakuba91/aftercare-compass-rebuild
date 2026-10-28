import type { ProfileOwnershipStatus, ProfileType } from "@prisma/client";
import { canUseLiveAvailability, type OrganizationGateContext } from "@/lib/feature-gates";

export function popularProgramAvailability(profile: {
  type: ProfileType;
  ownershipStatus: ProfileOwnershipStatus;
  bedsAvailable: number | null;
  acceptingNewPatients: boolean | null;
  organization: OrganizationGateContext | null;
}) {
  // Continued care uses its accepting-patients flag, just like search and profiles.
  const isAvailable = profile.type === "continued_care"
    ? profile.acceptingNewPatients === true
    : canUseLiveAvailability(profile.organization, profile) && Boolean(profile.bedsAvailable && profile.bedsAvailable > 0);
  return {
    isAvailable,
    availabilityLabel: isAvailable
      ? profile.type === "continued_care" ? "Accepting patients" : `${profile.bedsAvailable} bed${profile.bedsAvailable === 1 ? "" : "s"} open`
      : "Call for availability"
  };
}
