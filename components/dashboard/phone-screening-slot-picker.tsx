"use client";

import { useMemo, useState } from "react";
import { CalendarDays } from "lucide-react";
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

  if (!dayGroups.length) {
    return null;
  }

  return (
    <details className="group relative">
      <summary className="focus-ring flex min-h-9 cursor-pointer list-none items-center justify-center gap-2 rounded-md border border-border bg-white px-3 text-xs font-semibold text-foreground shadow-sm transition hover:border-primary/60">
        <CalendarDays size={14} />
        Select call time
      </summary>
      <div className="absolute right-0 z-20 mt-2 w-[min(340px,calc(100vw-2rem))] rounded-md border border-border bg-white p-3 text-left shadow-lg">
        <p className="text-xs font-semibold text-muted-foreground">Choose a day</p>
        <div className="mt-2 grid grid-cols-3 gap-2">
          {dayGroups.map((group) => (
            <button
              className={cn(
                "focus-ring rounded-md border border-border bg-white p-2 text-center text-xs transition hover:border-primary/70",
                selectedDay === group.key && "border-primary bg-primary/5 text-primary"
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
              <span className="mt-1 block text-muted-foreground">{group.month}</span>
            </button>
          ))}
        </div>

        {activeDay ? (
          <div className="mt-3">
            <p className="text-xs font-semibold text-muted-foreground">Available call blocks</p>
            <div className="mt-2 grid gap-2">
              {activeDay.slots.map((slot) => (
                <label
                  className={cn(
                    "flex cursor-pointer items-center justify-between gap-2 rounded-md border border-border bg-white px-3 py-2 text-xs font-semibold transition hover:border-primary/70",
                    selectedSlot === slot.startsAtIso && "border-primary bg-primary/5 text-primary"
                  )}
                  key={slot.startsAtIso}
                >
                  <span>{timeFormatter.format(new Date(slot.startsAtIso))}</span>
                  <input
                    checked={selectedSlot === slot.startsAtIso}
                    className="h-4 w-4 accent-primary"
                    name="slot"
                    onChange={() => setSelectedSlot(slot.startsAtIso)}
                    required
                    type="radio"
                    value={slot.startsAtIso}
                  />
                </label>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </details>
  );
}
