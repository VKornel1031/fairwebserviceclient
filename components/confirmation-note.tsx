import type { Appointment } from "@/lib/demo";
import { site } from "@/content/site";

export default function ConfirmationNote({
  appointment,
  internal = false,
}: {
  appointment: Appointment;
  internal?: boolean;
}) {
  if (appointment.status === "requested")
    return (
      <p className="info-box">
        {internal
          ? "Telefonos egyeztetésre vár. Az ügyféllel történt egyeztetés után a Visszaigazolás gombbal véglegesítheted az időpontot."
          : "Az időpont még telefonos egyeztetésre vár. A szerviz a megadott mobiltelefonszámon egyeztet veled, majd visszaigazolja az időpontot."}
      </p>
    );
  if (!appointment.confirmation) return null;
  const { at, actorName } = appointment.confirmation;
  return (
    <p className="demo-footnote">
      Telefonon visszaigazolva:{" "}
      <time dateTime={at}>
        {new Date(at).toLocaleString("hu-HU", {
          timeZone: site.booking.timeZone,
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
          hour: "2-digit",
          minute: "2-digit",
        })}
      </time>
      {internal && <> · {actorName}</>}
    </p>
  );
}
