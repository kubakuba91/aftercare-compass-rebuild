export const phoneScreeningDayOptions = [
  { value: 0, label: "Sunday" },
  { value: 1, label: "Monday" },
  { value: 2, label: "Tuesday" },
  { value: 3, label: "Wednesday" },
  { value: 4, label: "Thursday" },
  { value: 5, label: "Friday" },
  { value: 6, label: "Saturday" }
] as const;

export const phoneScreeningTimezone = "America/New_York";

export type PhoneScreeningWindowInput = {
  id: string;
  dayOfWeek: number;
  startMinute: number;
  endMinute: number;
  slotMinutes: number;
  timezone: string;
};

export type PhoneScreeningAppointmentInput = {
  startsAt: Date;
  endsAt: Date;
  status: string;
};

export type PhoneScreeningSlot = {
  windowId: string;
  startsAt: Date;
  endsAt: Date;
  label: string;
};

const timeFormatter = new Intl.DateTimeFormat("en", {
  weekday: "short",
  month: "short",
  day: "numeric",
  hour: "numeric",
  minute: "2-digit",
  timeZone: phoneScreeningTimezone,
  timeZoneName: "short"
});

function zonedParts(date: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23"
  }).formatToParts(date);
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));

  return {
    year: Number(values.year),
    month: Number(values.month),
    day: Number(values.day),
    hour: Number(values.hour),
    minute: Number(values.minute),
    second: Number(values.second)
  };
}

function zonedDateTimeToUtc(input: {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  timeZone: string;
}) {
  const utcGuess = new Date(Date.UTC(input.year, input.month - 1, input.day, input.hour, input.minute, 0));
  const actual = zonedParts(utcGuess, input.timeZone);
  const actualAsUtc = Date.UTC(actual.year, actual.month - 1, actual.day, actual.hour, actual.minute, actual.second);
  const targetAsUtc = Date.UTC(input.year, input.month - 1, input.day, input.hour, input.minute, 0);

  return new Date(utcGuess.getTime() - (actualAsUtc - targetAsUtc));
}

function localDateForOffset(offsetDays: number, timeZone: string) {
  const nowParts = zonedParts(new Date(), timeZone);
  const localNoon = new Date(Date.UTC(nowParts.year, nowParts.month - 1, nowParts.day + offsetDays, 12, 0, 0));
  return zonedParts(localNoon, timeZone);
}

function overlapsExistingSlot(
  startsAt: Date,
  endsAt: Date,
  appointments: PhoneScreeningAppointmentInput[]
) {
  return appointments.some((appointment) => {
    if (appointment.status !== "scheduled") {
      return false;
    }

    return startsAt < appointment.endsAt && endsAt > appointment.startsAt;
  });
}

export function formatPhoneScreeningMinute(value: number) {
  const hours = Math.floor(value / 60);
  const minutes = value % 60;
  const hour12 = hours % 12 || 12;
  const suffix = hours >= 12 ? "PM" : "AM";

  return `${hour12}:${minutes.toString().padStart(2, "0")} ${suffix}`;
}

export function formatPhoneScreeningWindow(window: Pick<PhoneScreeningWindowInput, "dayOfWeek" | "startMinute" | "endMinute">) {
  const day = phoneScreeningDayOptions.find((option) => option.value === window.dayOfWeek)?.label || "Weekly";

  return `${day}, ${formatPhoneScreeningMinute(window.startMinute)}-${formatPhoneScreeningMinute(window.endMinute)}`;
}

export function formatPhoneScreeningDateTime(value: Date, timeZone = phoneScreeningTimezone) {
  return new Intl.DateTimeFormat("en", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone,
    timeZoneName: "short"
  }).format(value);
}

export function generatePhoneScreeningSlots(input: {
  windows: PhoneScreeningWindowInput[];
  appointments: PhoneScreeningAppointmentInput[];
  daysAhead?: number;
  maxSlots?: number;
}) {
  const daysAhead = input.daysAhead ?? 21;
  const maxSlots = input.maxSlots ?? 12;
  const now = new Date();
  const earliest = new Date(now.getTime() + 60 * 60 * 1000);
  const slots: PhoneScreeningSlot[] = [];

  for (let offset = 0; offset < daysAhead; offset += 1) {
    const localDate = localDateForOffset(offset, phoneScreeningTimezone);
    const dayOfWeek = new Date(Date.UTC(localDate.year, localDate.month - 1, localDate.day)).getUTCDay();
    const matchingWindows = input.windows.filter((window) => window.dayOfWeek === dayOfWeek);

    for (const window of matchingWindows) {
      const slotMinutes = Math.max(15, window.slotMinutes || 30);

      for (let minute = window.startMinute; minute + slotMinutes <= window.endMinute; minute += slotMinutes) {
        const startsAt = zonedDateTimeToUtc({
          year: localDate.year,
          month: localDate.month,
          day: localDate.day,
          hour: Math.floor(minute / 60),
          minute: minute % 60,
          timeZone: window.timezone || phoneScreeningTimezone
        });
        const endsAt = new Date(startsAt.getTime() + slotMinutes * 60 * 1000);

        if (startsAt <= earliest || overlapsExistingSlot(startsAt, endsAt, input.appointments)) {
          continue;
        }

        slots.push({
          windowId: window.id,
          startsAt,
          endsAt,
          label: timeFormatter.format(startsAt)
        });
      }
    }
  }

  return slots
    .sort((first, second) => first.startsAt.getTime() - second.startsAt.getTime())
    .slice(0, maxSlots);
}
