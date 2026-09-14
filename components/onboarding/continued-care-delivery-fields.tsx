"use client";

import { useState } from "react";
import { virtualStates, virtualTimeZones } from "@/lib/virtual-care";

export function ContinuedCareDeliveryFields({ initial = {} }: { initial?: {
  telehealthMode?: string | null; statesServed?: string[]; programmingTimeZone?: string | null;
  hoursOfOperation?: string | null;
  additionalLocations?: string | null;
  streetAddress?: string | null; city?: string; state?: string; zip?: string | null;
} }) {
  const [mode, setMode] = useState(initial.telehealthMode || "In-person only");
  const [states, setStates] = useState(initial.statesServed || []);
  const [query, setQuery] = useState("");
  const virtual = mode === "Virtual only";
  const field = "min-h-10 rounded-md border border-border bg-white px-3 text-sm";
  return <div className="col-span-full grid gap-4">
    <label className="grid gap-2 text-sm font-medium">How is this program delivered?
      <select className={field} name="telehealthMode" value={mode} onChange={(event) => setMode(event.target.value)}>
        <option>In-person only</option><option>Virtual only</option>
        {initial.telehealthMode === "Hybrid" ? <option>Hybrid</option> : null}
      </select>
    </label>
    <label className="grid gap-2 text-sm font-medium">Programming hours<input className={field} name="hoursOfOperation" defaultValue={initial.hoursOfOperation || ""} placeholder="For example: Monday–Thursday, 6–9 pm" /></label>
    {virtual ? <>
      <fieldset className="grid gap-3 rounded-lg border border-border p-4">
        <legend className="px-2 font-semibold">States served (required)</legend>
        <p className="text-sm">Select where this program can currently accept clients. Coverage determines the eligible virtual plan.</p>
        <div className="flex gap-4 text-sm">
          <button type="button" className="underline" onClick={() => setStates([...virtualStates])}>Select all / Nationwide</button>
          <button type="button" className="underline" onClick={() => setStates([])}>Clear all</button>
        </div>
        <input aria-label="Find a state" className={field} placeholder="Find a state" value={query} onChange={(event) => setQuery(event.target.value)} />
        <p aria-live="polite" className="text-sm">{states.length} of 51 selected</p>
        {states.map((state) => <input key={state} type="hidden" name="statesServed" value={state} />)}
        <div className="grid max-h-56 gap-2 overflow-y-auto sm:grid-cols-2">
          {virtualStates.filter((state) => state.toLowerCase().includes(query.toLowerCase())).map((state) => <label key={state} className="flex min-h-9 items-center gap-2 text-sm">
            <input type="checkbox" checked={states.includes(state)} onChange={(event) => setStates((current) => event.target.checked ? [...current, state] : current.filter((value) => value !== state))} />{state}
          </label>)}
        </div>
      </fieldset>
      <label className="grid gap-2 text-sm font-medium">Programming time zone
        <select className={field} required name="programmingTimeZone" defaultValue={initial.programmingTimeZone || ""}>
          <option value="">Select a time zone</option>{virtualTimeZones.map((zone, index) => <option key={zone} value={zone}>{["Eastern time", "Central time", "Mountain time", "Arizona time", "Pacific time", "Alaska time", "Hawaii time"][index]}</option>)}
        </select>
      </label>
    </> : <div className="grid gap-4 sm:grid-cols-2">
      {([['streetAddress', 'Street address'], ['city', 'City'], ['state', 'State'], ['zip', 'ZIP']] as const).map(([name, label]) => <label key={name} className="grid gap-2 text-sm font-medium">{label}<input className={field} name={name} required defaultValue={initial[name] || ""} /></label>)}
      <label className="col-span-full grid gap-2 text-sm font-medium">Additional locations<textarea className={field} name="additionalLocations" defaultValue={initial.additionalLocations || ""} /></label>
    </div>}
  </div>;
}
