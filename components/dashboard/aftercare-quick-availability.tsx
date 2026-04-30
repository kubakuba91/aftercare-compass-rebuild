"use client";

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
  profile: QuickAvailabilityProfile | null;
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
  profile,
  error,
  updateAction
}: AftercareQuickAvailabilityProps) {
  if (!profile) {
    return (
      <div className="rounded-md border border-border bg-muted/40 p-4 text-sm text-muted-foreground">
        Select a home or program above to make quick availability updates.
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
      <form action={updateAction} className="grid gap-4 rounded-md border border-border bg-muted/40 p-4">
        <input type="hidden" name="profileId" value={profile.id} />
        {profile.type === "sober_living" ? (
          <>
            <div className="grid gap-3 md:grid-cols-3">
              {bedInput("Men", "bedsMenAvailable", profile.bedsMen, profile.bedsMenAvailable)}
              {bedInput("Women", "bedsWomenAvailable", profile.bedsWomen, profile.bedsWomenAvailable)}
              {bedInput("LGBTQ+", "bedsLgbtqAvailable", profile.bedsLgbtq, profile.bedsLgbtqAvailable)}
            </div>
            {!profile.bedsMen && !profile.bedsWomen && !profile.bedsLgbtq ? (
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
              defaultValue={profile.acceptingNewPatients ? "yes" : "no"}
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
            defaultValue={profile.availabilityNotes ?? ""}
            name="availabilityNotes"
          />
        </label>
        <button className="focus-ring min-h-10 rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground md:w-fit">
          Update availability
        </button>
      </form>
    </div>
  );
}
