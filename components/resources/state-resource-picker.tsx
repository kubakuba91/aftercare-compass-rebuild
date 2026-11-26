"use client";

import { ComboBox, Input, Label, ListBox } from "@heroui/react";
import { MapPin } from "lucide-react";
import { useCallback, useState } from "react";
import type { Key } from "react";
import type { StateResource } from "@/lib/recovery-housing/types";
import { StateResourceSection } from "./state-resource-section";

/** Type-to-search state picker. Selecting a state shows its section and updates `?state=` for sharing. */
export function StateResourcePicker({ states, initialCode }: { states: StateResource[]; initialCode?: string }) {
  const [selectedCode, setSelectedCode] = useState<string | null>(initialCode ?? null);
  const selected = states.find((state) => state.code === selectedCode);

  const handleSelection = useCallback((key: Key | null) => {
    const code = key ? String(key) : null;
    setSelectedCode(code);
    const url = new URL(window.location.href);
    if (code) url.searchParams.set("state", code);
    else url.searchParams.delete("state");
    window.history.replaceState(null, "", `${url.pathname}${url.search}${url.hash}`);
  }, []);

  return (
    <div>
      <ComboBox
        allowsEmptyCollection
        className="w-full max-w-md"
        defaultItems={states}
        menuTrigger="focus"
        onSelectionChange={handleSelection}
        selectedKey={selectedCode}
      >
        <Label className="text-sm font-semibold text-[#17212b]">Choose your state</Label>
        <ComboBox.InputGroup className="mt-2 flex min-h-12 items-center gap-2 rounded-xl border border-border bg-white px-3 shadow-sm transition-colors focus-within:border-[#12185f]/40 hover:border-[#12185f]/40">
          <MapPin aria-hidden="true" className="shrink-0 text-muted-foreground" size={18} />
          <Input className="!min-h-0 min-w-0 flex-1 !border-0 !bg-transparent !p-0 text-base font-medium !shadow-none outline-none placeholder:text-muted-foreground" placeholder="Type a state, e.g. Pennsylvania" />
          <ComboBox.Trigger className="focus-ring rounded-md p-1 text-muted-foreground" />
        </ComboBox.InputGroup>
        <ComboBox.Popover className="max-h-80 min-w-[var(--trigger-width)] overflow-auto rounded-xl border border-border bg-white p-1.5 shadow-xl">
          <ListBox renderEmptyState={() => <p className="px-3 py-2 text-sm text-muted-foreground">No matching state yet.</p>}>
            {(state: StateResource) => (
              <ListBox.Item
                className="flex min-h-11 cursor-pointer items-center justify-between gap-4 rounded-lg px-3 py-2 text-sm outline-none data-[focused]:bg-[#12185f]/5 data-[selected]:bg-[#12185f]/5 data-[selected]:font-semibold data-[selected]:text-[#12185f]"
                id={state.code}
                key={state.code}
                textValue={state.name}
              >
                <span>{state.name}</span>
                <span className="text-xs text-muted-foreground">{state.code}</span>
              </ListBox.Item>
            )}
          </ListBox>
        </ComboBox.Popover>
      </ComboBox>
      <p className="mt-2 text-sm text-muted-foreground">
        Showing the states where Aftercare Compass lists programs today: {states.map((state) => state.code).join(", ")}.
      </p>

      {selected ? (
        <StateResourceSection state={selected} />
      ) : (
        <p className="mt-8 rounded-2xl border border-dashed border-border bg-[#f7f6f3] p-6 text-base text-muted-foreground">
          Pick a state to see its licensing or certification body, official links, local offices, NARR affiliate, and funding notes.
        </p>
      )}
    </div>
  );
}
