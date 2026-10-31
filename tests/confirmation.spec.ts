import { test, expect } from "@playwright/test";
import { initialStore } from "../lib/demo";
import { changeAppointmentStatus } from "../lib/appointments";

test("reception, owner and admin can record phone confirmation exactly once", () => {
  for (const actorId of ["demo-reception", "demo-manager", "demo-admin"]) {
    const state = initialStore();
    state.appointments[0].status = "requested";
    const result = changeAppointmentStatus(
      state,
      "FA-MINTA01",
      "confirmed",
      actorId,
    );
    const appointment = result.appointments[0];
    expect(appointment.status).toBe("confirmed");
    expect(appointment.confirmation).toMatchObject({
      method: "phone",
      actorId,
      actorName: state.users.find((user) => user.id === actorId)!.name,
    });
    expect(Number.isNaN(Date.parse(appointment.confirmation!.at))).toBe(false);
    expect(state.appointments[0].status).toBe("requested");
    expect(
      changeAppointmentStatus(result, "FA-MINTA01", "confirmed", actorId),
    ).toBe(result);
  }
});

test("customer and partner cannot approve requests and reception cannot start repair work", () => {
  const state = initialStore();
  state.appointments[0].status = "requested";
  for (const actorId of ["demo-customer", "demo-partner", "missing-user"])
    expect(() =>
      changeAppointmentStatus(state, "FA-MINTA01", "confirmed", actorId),
    ).toThrow("jogosultság");
  const confirmed = changeAppointmentStatus(
    state,
    "FA-MINTA01",
    "confirmed",
    "demo-reception",
  );
  expect(() =>
    changeAppointmentStatus(
      confirmed,
      "FA-MINTA01",
      "progress",
      "demo-reception",
    ),
  ).toThrow("vezető");
  expect(
    changeAppointmentStatus(confirmed, "FA-MINTA01", "progress", "demo-manager")
      .appointments[0].status,
  ).toBe("progress");
});

test("confirmation cannot revive a cancelled appointment", () => {
  const state = initialStore();
  state.appointments[0].status = "cancelled";
  expect(() =>
    changeAppointmentStatus(state, "FA-MINTA01", "confirmed", "demo-reception"),
  ).toThrow("állapotváltás");
  expect(state.appointments[0].confirmation).toBeUndefined();
});
