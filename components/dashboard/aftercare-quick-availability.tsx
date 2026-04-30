"use client";

import { useMemo, useState } from "react";

type QuickAvailabilityProfile = {
  id: string;
  programName: string;
  type: "sober_living" | "continued_care";
  bedsMen: number | null;
  bedsMenAvailable: number | null;
  bedsWomen: number | null;
  bedsWomenAvailable: number | null;
  bedsLgbtq: number | null;
  bedsLgbtqAvailable: number | null;
  acceptingNewPatients: boolean | null;
  availabilityNotes: string | null;
};

type AftercareQuickAvailabilityProps = {
  profiles: QuickAvailabilityProfile[];
  error?: string;
  updateAction: (formData: FormData) => void;
};

function fieldClassName() {
  return "min-h-10 rounded-md border border-border bg-white px-3 text-sm";
}

function bedInput(
  label: string,
  name: string,
  total: number | null,
  available: number | null
) {
  if (!total) {
    return null;
  }

  return (
    <label className="grid gap-2 text-sm font-medium">
      <span>{label}</span>
      <span className="text-xs font-normal text-muted-foreground">{total} total beds</span>
      <input
        className={fieldClassName()}
        defaultValue={available ?? 0}
        max={total}
        min="0"
        name={name}
        type="number"
      />
    </label>
  );
}

export function AftercareQuickAvailability({
  profiles,
  error,
  updateAction
}: AftercareQuickAvailabilityProps) {
  const [selectedProfileId, setSelectedProfileId] = useState(profiles[0]?.id ?? "");
  const selectedProfile = useMemo(
    () => profiles.find((profile) => profile.id === selectedProfileId) ?? profiles[0],
    [profiles, selectedProfileId]
  );

  if (!profiles.length) {
    return (
      <div className="rounded-md border border-border bg-muted/40 p-4 text-sm text-muted-foreground">
        Add a home or program before using quick availability.
      </div>
    );
  }

  return (
    <div className="grid gap-4">
      {error ? (
        <div className="rounded-md border border-accent/30 bg-accent/10 p-3 text-sm">
          {error}
        </div>
      ) : null}
      <label className="grid gap-2 text-sm font-medium">
        Home or program
        <select
          className={fieldClassName()}
          onChange={(event) => setSelectedProfileId(event.target.value)}
          value={selectedProfile?.id ?? ""}
        >
          {profiles.map((profile) => (
            <option key={profile.id} value={profile.id}>
              {profile.programName}
            </option>
          ))}
        </select>
      </label>

      {selectedProfile ? (
        <form action={updateAction} className="grid gap-4 rounded-md border border-border bg-muted/40 p-4">
          <input type="hidden" name="profileId" value={selectedProfile.id} />
          {selectedProfile.type === "sober_living" ? (
            <>
              <div className="grid gap-3 md:grid-cols-3">
                {bedInput("Men", "bedsMenAvailable", selectedProfile.bedsMen, selectedProfile.bedsMenAvailable)}
                {bedInput("Women", "bedsWomenAvailable", selectedProfile.bedsWomen, selectedProfile.bedsWomenAvailable)}
                {bedInput("LGBTQ+", "bedsLgbtqAvailable", selectedProfile.bedsLgbtq, selectedProfile.bedsLgbtqAvailable)}
              </div>
              {!selectedProfile.bedsMen && !selectedProfile.bedsWomen && !selectedProfile.bedsLgbtq ? (
                <p className="text-sm text-muted-foreground">
                  This home does not have population-specific bed totals yet. Edit the home profile
                  to set totals before using quick updates.
                </p>
              ) : null}
            </>
          ) : (
            <label className="grid gap-2 text-sm font-medium">
              Accepting new patients
              <select
                className={fieldClassName()}
                defaultValue={selectedProfile.acceptingNewPatients ? "yes" : "no"}
                name="acceptingNewPatients"
              >
                <option value="yes">Yes</option>
                <option value="no">No</option>
              </select>
            </label>
          )}
          <label className="grid gap-2 text-sm font-medium">
            Availability notes
            <textarea
              className="min-h-20 rounded-md border border-border bg-white p-3 text-sm"
              defaultValue={selectedProfile.availabilityNotes ?? ""}
              name="availabilityNotes"
            />
          </label>
          <button className="focus-ring min-h-10 rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground md:w-fit">
            Update availability
          </button>
        </form>
      ) : null}
    </div>
  );
}
