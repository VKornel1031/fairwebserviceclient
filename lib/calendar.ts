import { site, address } from "@/content/site";
import { services, endTime, type Appointment } from "./demo";
export function calendarFile(a: Appointment) {
  const esc = (s: string) =>
    s
      .replace(/\\/g, "\\\\")
      .replace(/\n/g, "\\n")
      .replace(/,/g, "\\,")
      .replace(/;/g, "\\;");
  const stamp = (t: string) =>
    a.date.replaceAll("-", "") + "T" + t.replace(":", "") + "00";
  const content = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Fair Auto//Booking Demo//HU",
    "BEGIN:VEVENT",
    `UID:${a.id}@fairauto-demo`,
    `DTSTAMP:${new Date()
      .toISOString()
      .replace(/[-:]/g, "")
      .replace(/\.\d{3}/, "")}`,
    `DTSTART;TZID=${site.booking.timeZone}:${stamp(a.time)}`,
    `DTEND;TZID=${site.booking.timeZone}:${stamp(endTime(a.time, a.duration))}`,
    `SUMMARY:${esc(`DEMÓ · ${site.shortName} – ` + services.find((s) => s.id === a.service)?.short)}`,
    `LOCATION:${esc(address)}`,
    `DESCRIPTION:${esc("Helyi prototípus foglalás – nem valódi időpont. Azonosító: " + a.id)}`,
    "STATUS:TENTATIVE",
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
  const url = URL.createObjectURL(
    new Blob([content], { type: "text/calendar;charset=utf-8" }),
  );
  const link = document.createElement("a");
  link.href = url;
  link.download = `${a.id}.ics`;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
