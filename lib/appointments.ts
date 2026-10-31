import type { Status, Store } from "./demo";
import { canCoordinateAppointments, canManageWorkshop } from "./permissions";

/** Shared local demo rule for reception, owner and admin appointment actions. */
export function changeAppointmentStatus(
  store: Store,
  appointmentId: string,
  next: Status,
  actorId: string,
): Store {
  const actor = store.users.find((user) => user.id === actorId);
  if (!actor || !canCoordinateAppointments(actor.role))
    throw new Error("Ehhez munkafelvevői vagy vezetői jogosultság szükséges.");
  if (
    ["progress", "completed"].includes(next) &&
    !canManageWorkshop(actor.role)
  )
    throw new Error("A műhelyfolyamatokat a vezető kezelheti.");
  const current = store.appointments.find(
    (appointment) => appointment.id === appointmentId,
  );
  if (!current) throw new Error("A foglalás már nem található.");
  if (current.status === next) return store;
  const allowed: Record<Status, Status[]> = {
    requested: ["confirmed", "cancelled"],
    confirmed: ["progress", "cancelled"],
    progress: ["completed"],
    completed: [],
    cancelled: [],
  };
  if (!allowed[current.status].includes(next))
    throw new Error("Ez az állapotváltás már nem elérhető.");
  const updated = {
    ...current,
    status: next,
    confirmation:
      next === "confirmed"
        ? {
            method: "phone" as const,
            at: new Date().toISOString(),
            actorId: actor.id,
            actorName: actor.name,
          }
        : current.confirmation,
  };
  return {
    ...store,
    appointments: store.appointments.map((appointment) =>
      appointment.id === appointmentId ? updated : appointment,
    ),
  };
}
