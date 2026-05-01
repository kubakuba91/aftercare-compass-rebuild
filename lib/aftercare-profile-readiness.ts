type AftercareReadinessProfile = {
  type: string;
  programName: string | null;
  city: string | null;
  state: string | null;
  admissionsContactEmail: string | null;
  admissionsContactPhone: string | null;
  description: string | null;
  populationServed: string | null;
  populationServedOptions: string[];
  totalBeds: number | null;
  bedsAvailable: number | null;
  acceptingNewPatients: boolean | null;
  programTypes?: string[];
  levelsOfCare?: string[];
  goodNeighborPolicyAcknowledged: boolean;
  photoReadiness: string[];
};

export function getAftercareProfileReadiness(profile: AftercareReadinessProfile) {
  const blockers: string[] = [];
  const warnings: string[] = [];

  if (!profile.programName?.trim()) {
    blockers.push("Program name is required.");
  }

  if (!profile.city?.trim() || !profile.state?.trim()) {
    blockers.push("Public city and state are required.");
  }

  if (!profile.admissionsContactEmail?.trim() && !profile.admissionsContactPhone?.trim()) {
    blockers.push("Add at least one admissions contact method.");
  }

  if (!profile.description?.trim()) {
    blockers.push("Profile description is required.");
  }

  if (!profile.populationServedOptions.length && !profile.populationServed?.trim()) {
    blockers.push("Population served is required.");
  }

  if (profile.type === "sober_living") {
    if (profile.totalBeds === null || profile.bedsAvailable === null) {
      blockers.push("Sober living bed totals and availability are required.");
    }

    if (!profile.goodNeighborPolicyAcknowledged) {
      blockers.push("Good Neighbor Policy acknowledgment is required.");
    }
  } else {
    if (profile.acceptingNewPatients === null) {
      blockers.push("Patient availability status is required.");
    }

    if (!profile.programTypes?.length) {
      blockers.push("Program type is required.");
    }

    if (!profile.levelsOfCare?.length) {
      blockers.push("Level of care is required.");
    }
  }

  if (!profile.photoReadiness.length) {
    warnings.push("Photos are not ready yet.");
  }

  const totalChecks = blockers.length + warnings.length + 7;
  const percent = Math.max(0, Math.round(((totalChecks - blockers.length - warnings.length) / totalChecks) * 100));

  return {
    blockers,
    warnings,
    canPublish: blockers.length === 0,
    percent
  };
}
