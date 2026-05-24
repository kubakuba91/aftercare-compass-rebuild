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
  const [selectedSlot, setSelectedSlot] = useState("");
  const activeDay = dayGroups.find((group) => group.key === selectedDay) ?? dayGroups[0];
  const selectedSlotLabel = selectedSlot ? timeFormatter.format(new Date(selectedSlot)) : "";

  if (!dayGroups.length) {
    return null;
  }

  return (
    <details className="group relative">
      <summary
        className={cn(
          "focus-ring flex min-h-9 cursor-pointer list-none items-center justify-center gap-2 rounded-full border px-3 text-xs font-semibold shadow-sm transition group-open:border-[#13205d] group-open:bg-[#eef3ff] group-open:text-[#13205d]",
          selectedSlot
            ? "border-[#13205d] bg-[#eef3ff] text-[#13205d]"
            : "border-[#13205d] bg-[#13205d] text-white hover:bg-[#0f1848]"
        )}
      >
        <CalendarDays size={14} />
        {selectedSlot ? (
          selectedSlotLabel
        ) : (
          "Schedule intake call"
        )}
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
            {dayGroups.map((group) => {
              const isSelected = selectedDay === group.key;

              return (
                <button
                  className={cn(
                    "focus-ring rounded-md border border-border bg-white p-2 text-center text-xs shadow-sm transition hover:border-[#13205d] hover:bg-[#eef3ff]",
                    isSelected && "border-[#13205d] bg-[#13205d] text-white shadow-md ring-2 ring-[#7fb2ff]"
                  )}
                  key={group.key}
                  onClick={() => {
                    setSelectedDay(group.key);
                  }}
                  type="button"
                >
                  <span className="block font-semibold">{group.weekday}</span>
                  <span className="mt-1 block text-lg font-semibold leading-none">{group.day}</span>
                  <span className={cn("mt-1 block text-muted-foreground", isSelected && "text-white/85")}>{group.month}</span>
                </button>
              );
            })}
          </div>

          {activeDay ? (
            <div className="mt-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Available call blocks</p>
              <div className="mt-2 grid max-h-64 gap-2 overflow-y-auto pr-1">
                {activeDay.slots.map((slot) => {
                  const isSelected = selectedSlot === slot.startsAtIso;

                  return (
                    <label
                      className={cn(
                        "flex cursor-pointer items-center justify-between gap-3 rounded-md border border-border bg-white px-3 py-2 text-xs font-semibold shadow-sm transition hover:border-[#13205d] hover:bg-[#eef3ff]",
                        isSelected && "border-[#13205d] bg-[#eef3ff] text-[#13205d] shadow-md ring-2 ring-[#7fb2ff]"
                      )}
                      key={slot.startsAtIso}
                    >
                      <span className="flex items-center gap-2">
                        <Clock size={14} className={cn("text-muted-foreground", isSelected && "text-[#13205d]")} />
                        {timeFormatter.format(new Date(slot.startsAtIso))}
                      </span>
                      <input
                        checked={isSelected}
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
                          isSelected && "border-[#13205d] bg-[#13205d]"
                        )}
                      >
                        {isSelected ? <Check size={13} /> : null}
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>
          ) : null}
        </div>

        <div className="border-t border-border bg-white p-3 shadow-[0_-8px_20px_rgba(15,23,42,0.08)]">
          <button
            className="focus-ring min-h-11 w-full rounded-md bg-[#13205d] px-4 text-sm font-semibold text-white shadow-md transition hover:bg-[#0f1848] disabled:cursor-not-allowed disabled:bg-muted disabled:text-muted-foreground disabled:shadow-none"
            disabled={!selectedSlot}
            type="submit"
          >
            Book call
          </button>
        </div>
      </div>
    </details>
  );
}
