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
  const checks = [
    {
      label: "Program name",
      complete: Boolean(profile.programName?.trim()),
      required: true,
      message: "Program name is required."
    },
    {
      label: "Public city and state",
      complete: Boolean(profile.city?.trim() && profile.state?.trim()),
      required: true,
      message: "Public city and state are required."
    },
    {
      label: "Admissions contact",
      complete: Boolean(profile.admissionsContactEmail?.trim() || profile.admissionsContactPhone?.trim()),
      required: true,
      message: "Add at least one admissions contact method."
    },
    {
      label: "Profile description",
      complete: Boolean(profile.description?.trim()),
      required: true,
      message: "Profile description is required."
    },
    {
      label: "Population served",
      complete: Boolean(profile.populationServedOptions.length || profile.populationServed?.trim()),
      required: true,
      message: "Population served is required."
    },
    ...(profile.type === "sober_living"
      ? [
          {
            label: "Bed totals and availability",
            complete: profile.totalBeds !== null && profile.bedsAvailable !== null,
            required: true,
            message: "Sober living bed totals and availability are required."
          },
          {
            label: "Good Neighbor Policy",
            complete: profile.goodNeighborPolicyAcknowledged,
            required: true,
            message: "Good Neighbor Policy acknowledgment is required."
          }
        ]
      : [
          {
            label: "Patient availability status",
            complete: profile.acceptingNewPatients !== null,
            required: true,
            message: "Patient availability status is required."
          },
          {
            label: "Program type",
            complete: Boolean(profile.programTypes?.length),
            required: true,
            message: "Program type is required."
          },
          {
            label: "Level of care",
            complete: Boolean(profile.levelsOfCare?.length),
            required: true,
            message: "Level of care is required."
          }
        ]),
    {
      label: "Photo readiness",
      complete: Boolean(profile.photoReadiness.length),
      required: false,
      message: "Photos are not ready yet."
    }
  ];

  const blockers = checks
    .filter((check) => check.required && !check.complete)
    .map((check) => check.message);
  const warnings = checks
    .filter((check) => !check.required && !check.complete)
    .map((check) => check.message);
  const percent = Math.round((checks.filter((check) => check.complete).length / checks.length) * 100);

  return {
    blockers,
    checks,
    warnings,
    canPublish: blockers.length === 0,
    percent
  };
}
