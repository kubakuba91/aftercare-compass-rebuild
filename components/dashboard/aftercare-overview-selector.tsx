"use client";

type AftercareOverviewSelectorProps = {
  profiles: Array<{
    id: string;
    programName: string;
  }>;
  selectedProfileId?: string;
};

export function AftercareOverviewSelector({
  profiles,
  selectedProfileId
}: AftercareOverviewSelectorProps) {
  return (
    <label className="grid gap-2 text-sm font-medium md:max-w-md">
      Home or program
      <select
        className="min-h-11 rounded-md border border-border bg-white px-3 text-sm"
        onChange={(event) => {
          const params = new URLSearchParams();
          params.set("tab", "overview");

          if (event.target.value !== "all") {
            params.set("profileId", event.target.value);
          }

          window.location.href = `/dashboard/aftercare?${params.toString()}`;
        }}
        value={selectedProfileId || "all"}
      >
        <option value="all">All homes and programs</option>
        {profiles.map((profile) => (
          <option key={profile.id} value={profile.id}>
            {profile.programName}
          </option>
        ))}
      </select>
    </label>
  );
}
