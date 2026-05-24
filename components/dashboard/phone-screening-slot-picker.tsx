"use client";

import { useMemo, useState } from "react";
import { CalendarDays, Check, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

type PhoneScreeningSlotOption = {
  startsAtIso: string;
  label: string;
};

type DayGroup = {
  key: string;
  weekday: string;
  day: string;
  month: string;
  slots: PhoneScreeningSlotOption[];
};

const dayFormatter = new Intl.DateTimeFormat("en", {
  weekday: "short",
  month: "short",
  day: "numeric"
});

const weekdayFormatter = new Intl.DateTimeFormat("en", { weekday: "short" });
const dayNumberFormatter = new Intl.DateTimeFormat("en", { day: "numeric" });
const monthFormatter = new Intl.DateTimeFormat("en", { month: "short" });
const timeFormatter = new Intl.DateTimeFormat("en", {
  hour: "numeric",
  minute: "2-digit",
  timeZoneName: "short"
});

function slotDayKey(value: string) {
  const date = new Date(value);
  return dayFormatter.format(date);
}

export function PhoneScreeningSlotPicker({ slots }: { slots: PhoneScreeningSlotOption[] }) {
  const dayGroups = useMemo(() => {
    const groups = new Map<string, DayGroup>();

    for (const slot of slots) {
      const date = new Date(slot.startsAtIso);
      const key = slotDayKey(slot.startsAtIso);

      if (!groups.has(key)) {
        groups.set(key, {
          key,
          weekday: weekdayFormatter.format(date),
          day: dayNumberFormatter.format(date),
          month: monthFormatter.format(date),
          slots: []
        });
      }

      groups.get(key)?.slots.push(slot);
    }

    return Array.from(groups.values());
  }, [slots]);
  const [selectedDay, setSelectedDay] = useState(dayGroups[0]?.key ?? "");
  const [selectedSlot, setSelectedSlot] = useState(dayGroups[0]?.slots[0]?.startsAtIso ?? "");
  const activeDay = dayGroups.find((group) => group.key === selectedDay) ?? dayGroups[0];
  const selectedSlotLabel = selectedSlot ? timeFormatter.format(new Date(selectedSlot)) : "Choose a call time";

  if (!dayGroups.length) {
    return null;
  }

  return (
    <details className="group relative">
      <summary className="focus-ring flex min-h-9 cursor-pointer list-none items-center justify-center gap-2 rounded-md border border-border bg-white px-3 text-xs font-semibold text-foreground shadow-sm transition hover:border-primary/60 group-open:border-primary group-open:bg-primary/5 group-open:text-primary">
        <CalendarDays size={14} />
        {selectedSlotLabel}
      </summary>
      <div className="absolute right-0 z-20 mt-2 w-[min(360px,calc(100vw-2rem))] overflow-hidden rounded-lg border border-border bg-white text-left shadow-xl">
        <div className="border-b border-border bg-surface px-4 py-3">
          <p className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <CalendarDays size={16} className="text-primary" />
            Schedule phone screening
          </p>
          <p className="mt-1 text-xs leading-5 text-muted-foreground">Select a day and available call block.</p>
        </div>

        <div className="p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Choose a day</p>
        <div className="mt-2 grid grid-cols-3 gap-2 sm:grid-cols-4">
          {dayGroups.map((group) => (
            <button
              className={cn(
                "focus-ring rounded-md border border-border bg-white p-2 text-center text-xs shadow-sm transition hover:border-primary/70 hover:bg-primary/5",
                selectedDay === group.key && "border-primary bg-primary text-primary-foreground shadow-md"
              )}
              key={group.key}
              onClick={() => {
                setSelectedDay(group.key);
                setSelectedSlot(group.slots[0]?.startsAtIso ?? "");
              }}
              type="button"
            >
              <span className="block font-semibold">{group.weekday}</span>
              <span className="mt-1 block text-lg font-semibold leading-none">{group.day}</span>
              <span className={cn("mt-1 block text-muted-foreground", selectedDay === group.key && "text-primary-foreground/85")}>{group.month}</span>
            </button>
          ))}
        </div>

        {activeDay ? (
          <div className="mt-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Available call blocks</p>
            <div className="mt-2 grid max-h-64 gap-2 overflow-y-auto pr-1">
              {activeDay.slots.map((slot) => (
                <label
                  className={cn(
                    "flex cursor-pointer items-center justify-between gap-3 rounded-md border border-border bg-white px-3 py-2 text-xs font-semibold shadow-sm transition hover:border-primary/70 hover:bg-primary/5",
                    selectedSlot === slot.startsAtIso && "border-primary bg-primary/5 text-primary shadow-md"
                  )}
                  key={slot.startsAtIso}
                >
                  <span className="flex items-center gap-2">
                    <Clock size={14} className="text-muted-foreground" />
                    {timeFormatter.format(new Date(slot.startsAtIso))}
                  </span>
                  <input
                    checked={selectedSlot === slot.startsAtIso}
                    className="sr-only"
                    name="slot"
                    onChange={() => setSelectedSlot(slot.startsAtIso)}
                    required
                    type="radio"
                    value={slot.startsAtIso}
                  />
                  <span
                    className={cn(
                      "flex h-5 w-5 items-center justify-center rounded-full border border-border bg-white text-white",
                      selectedSlot === slot.startsAtIso && "border-primary bg-primary"
                    )}
                  >
                    {selectedSlot === slot.startsAtIso ? <Check size={13} /> : null}
                  </span>
                </label>
              ))}
            </div>
          </div>
        ) : null}
        </div>

        <div className="border-t border-border bg-white p-3 shadow-[0_-8px_20px_rgba(15,23,42,0.05)]">
          <button
            className="focus-ring min-h-10 w-full rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90"
            type="submit"
          >
            Book call
          </button>
        </div>
      </div>
    </details>
  );
}
