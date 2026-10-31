import { services, statusNames, type Appointment } from "./demo";

export function downloadAppointments(rows: Appointment[], filename: string) {
  // Quote every field and neutralize spreadsheet formulas from user-entered values.
  const cell = (value: string) =>
    `"${(/^[\s]*[=+@\-]/.test(value) ? "'" + value : value).replaceAll('"', '""')}"`;
  const lines = [
    [
      "Azonosító",
      "Dátum",
      "Időpont",
      "Rendszám",
      "Jármű",
      "Szolgáltatás",
      "Állapot",
      "Kapcsolattartó",
      "Típus",
    ],
    ...rows.map((a) => [
      a.id,
      a.date,
      a.time,
      a.vehicle.plate,
      `${a.vehicle.make} ${a.vehicle.model}`,
      services.find((s) => s.id === a.service)?.name || a.service,
      statusNames[a.status],
      a.contact.name,
      a.organization ? "Céges" : a.owner ? "Magánügyfél" : "Vendég",
    ]),
  ];
  const url = URL.createObjectURL(
    new Blob(
      ["\uFEFF" + lines.map((row) => row.map(cell).join(";")).join("\r\n")],
      { type: "text/csv;charset=utf-8" },
    ),
  );
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
