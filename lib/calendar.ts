import { site, address } from "@/content/site";
import { services, endTime, type Appointment } from "./demo";
export function calendarFile(a: Appointment) {
  const demo = a.demo === true || a.legalAcknowledgement?.mode === "demo";
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
    "PRODID:-//Fair Auto//Appointments//HU",
    "BEGIN:VEVENT",
    `UID:${a.id}@fairauto`,
    `DTSTAMP:${new Date()
      .toISOString()
      .replace(/[-:]/g, "")
      .replace(/\.\d{3}/, "")}`,
    `DTSTART;TZID=${site.booking.timeZone}:${stamp(a.time)}`,
    `DTEND;TZID=${site.booking.timeZone}:${stamp(endTime(a.time, a.duration))}`,
    `SUMMARY:${esc(`${demo ? "DEMÓ · " : ""}${site.shortName} – ` + (a.serviceName || services.find((s) => s.id === a.service)?.short || a.service))}`,
    `LOCATION:${esc(address)}`,
    `DESCRIPTION:${esc((demo ? "Helyi prototípus foglalás. " : a.status === "cancelled" ? "Lemondott időpontkérés. " : a.status === "requested" ? "Telefonos visszaigazolásra váró időpontkérés. " : "Telefonon visszaigazolt szervizidőpont. ") + "Azonosító: " + (a.reference || a.id))}`,
    `STATUS:${a.status === "cancelled" ? "CANCELLED" : a.status === "requested" ? "TENTATIVE" : "CONFIRMED"}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
  const url = URL.createObjectURL(
    new Blob([content], { type: "text/calendar;charset=utf-8" }),
  );
  const link = document.createElement("a");
  link.href = url;
  link.download = `${a.reference || a.id}.ics`;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
