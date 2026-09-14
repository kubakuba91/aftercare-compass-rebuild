"use client";

import { useEffect, useRef, useState } from "react";
import { ContinuedCareDeliveryFields } from "./continued-care-delivery-fields";

export function AdminDeliveryFields({ type, initial }: { type: string; initial?: React.ComponentProps<typeof ContinuedCareDeliveryFields>["initial"] }) {
  const root = useRef<HTMLDivElement>(null);
  const [profileType, setProfileType] = useState(type);
  useEffect(() => {
    const form = root.current?.closest("form");
    const select = form?.querySelector<HTMLSelectElement>('select[name="type"]');
    if (!select) return;
    const update = () => setProfileType(select.value);
    select.addEventListener("change", update);
    return () => select.removeEventListener("change", update);
  }, []);
  return <div ref={root} className="col-span-full">
    {profileType === "continued_care" ? <ContinuedCareDeliveryFields initial={initial} /> : <div className="grid gap-4 md:grid-cols-2">
      {([['streetAddress', 'Street address'], ['city', 'City'], ['state', 'State'], ['zip', 'ZIP']] as const).map(([name, label]) => <label key={name} className="grid gap-2 text-sm font-medium">{label}<input className="min-h-10 rounded-md border border-border bg-white px-3 text-sm" name={name} required={name === "city" || name === "state"} defaultValue={initial?.[name] || ""} /></label>)}
    </div>}
  </div>;
}
