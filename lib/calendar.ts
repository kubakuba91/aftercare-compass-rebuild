type CalendarEventInput = {
  uid: string;
  title: string;
  description?: string;
  location?: string;
  startsAt: Date;
  endsAt: Date;
};

function calendarDate(value: Date) {
  return value.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
}

function escapeCalendarText(value: string | null | undefined) {
  return String(value || "")
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\r?\n/g, "\\n");
}

function foldCalendarLine(line: string) {
  const maxLength = 74;

  if (line.length <= maxLength) {
    return line;
  }

  const lines: string[] = [];
  let remaining = line;

  while (remaining.length > maxLength) {
    lines.push(remaining.slice(0, maxLength));
    remaining = ` ${remaining.slice(maxLength)}`;
  }

  lines.push(remaining);
  return lines.join("\r\n");
}

export function createCalendarEvent(input: CalendarEventInput) {
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Aftercare Compass//Phone Screening//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${escapeCalendarText(input.uid)}`,
    `DTSTAMP:${calendarDate(new Date())}`,
    `DTSTART:${calendarDate(input.startsAt)}`,
    `DTEND:${calendarDate(input.endsAt)}`,
    `SUMMARY:${escapeCalendarText(input.title)}`,
    `LOCATION:${escapeCalendarText(input.location || "Phone call")}`,
    `DESCRIPTION:${escapeCalendarText(input.description || "")}`,
    "END:VEVENT",
    "END:VCALENDAR"
  ];

  return `${lines.map(foldCalendarLine).join("\r\n")}\r\n`;
}
