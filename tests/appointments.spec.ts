import {
  test,
  expect,
  type APIRequestContext,
  type Page,
} from "@playwright/test";
import { site } from "../content/site";
import type { LiveAppointment } from "../lib/live-appointments";
const origin = "http://127.0.0.1:3100",
  backend = "http://127.0.0.1:3101",
  password = "Local-integration-only-928374!";
const headers = { Origin: origin };
async function context(api: APIRequestContext) {
  const r = await api.post("/api/appointments/context", { headers, data: {} });
  expect(r.status(), await r.text()).toBe(200);
  return r.json();
}
async function login(api: APIRequestContext, role: string) {
  const r = await api.post("/api/auth/login", {
    headers,
    data: {
      email: role.includes("@") ? role : `${role}@fairauto.test`,
      password,
    },
  });
  expect(r.status()).toBe(200);
  return (await r.json()).user;
}
async function customer(api: APIRequestContext) {
  const email = `appointment-${crypto.randomUUID()}@example.test`;
  expect(
    (
      await api.post("/api/auth/register", {
        headers,
        data: {
          name: "Booking Customer",
          email,
          password,
          passwordConfirm: password,
          acceptTerms: true,
          companyName: "Integration Test Kft.",
          companyTax: "12345678-2-19",
        },
      })
    ).status(),
  ).toBe(202);
  const user = await login(api, email);
  await api.patch("/api/account", {
    headers,
    data: { phone: "+36301234567", city: "Veszprém" },
  });
  return { email, user };
}
async function payload(
  api: APIRequestContext,
  service = "diagnostics",
  target?: { date: string; time: string },
) {
  const ctx = await context(api);
  const a = await api.get(`/api/appointments/availability?service=${service}`);
  expect(a.status(), await a.text()).toBe(200);
  const available = await a.json();
  const date =
    target?.date ||
    Object.keys(available.days).find((day) => available.days[day].length)!;
  const time = target?.time || available.days[date][0];
  return {
    requestId: crypto.randomUUID(),
    viewerId: ctx.viewer,
    service,
    date,
    time,
    contact: {
      name: "Booking Tester",
      email: `booking-${crypto.randomUUID()}@example.test`,
      phone: "+36301234567",
      city: "Székesfehérvár",
      reminders: false,
    },
    vehicle: {
      plate: "TST123",
      make: "Ford",
      model: "Focus",
      year: "2020",
      vin: "WVWZZZ1JZXW000001",
    },
    note: "Teszt szervizigény\nIndításkor szokatlan hang hallható.",
    acceptTerms: true,
    termsVersion: ctx.config.termsVersion,
  };
}
async function create(api: APIRequestContext, data: unknown) {
  const r = await api.post("/api/appointments", { headers, data });
  expect(r.status(), await r.text()).toBe(201);
  return (await r.json()).appointment as LiveAppointment;
}
async function status(
  api: APIRequestContext,
  a: LiveAppointment,
  next: string,
) {
  return api.post(`/api/appointments/${a.id}/status`, {
    headers,
    data: { status: next, revision: a.revision },
  });
}
async function root(api: APIRequestContext) {
  const r = await api.post(
    `${backend}/api/collections/_superusers/auth-with-password`,
    { data: { identity: "root@fairauto.test", password } },
  );
  expect(r.status()).toBe(200);
  return { Authorization: (await r.json()).token };
}

test("guest requests persist without exposing capability cookies or importing local demo data; retries are idempotent", async ({
  request,
  playwright,
}) => {
  const data = await payload(request),
    a = await create(request, data),
    again = await create(request, data);
  expect(a.id).toBe(again.id);
  expect(a.status).toBe("requested");
  expect(a.note).toBe(data.note);
  expect(a.legalAcknowledgement).toMatchObject({
    mode: "live",
    termsVersion: site.legal.version,
  });
  expect(a.reference).toMatch(/^FA-/);
  const list = await (await request.get("/api/appointments")).json();
  expect(list.totalItems).toBe(1);
  const detail = await (await request.get(`/api/appointments/${a.id}`)).json();
  expect(detail.history).toHaveLength(1);
  const cookies = (await request.storageState()).cookies,
    capability = cookies.find((c) => c.name === "fairauto_guest");
  expect(capability).toMatchObject({
    httpOnly: true,
    sameSite: "Lax",
    path: "/",
  });
  expect(JSON.stringify(detail)).not.toContain(capability!.value);
  expect(JSON.stringify(detail)).not.toContain("guestHash");
  expect(
    (
      await request.post("/api/appointments", {
        headers,
        data: { ...data, note: "Different request" },
      })
    ).status(),
  ).toBe(409);
  const other = await playwright.request.newContext({ baseURL: origin });
  await context(other);
  expect((await other.get(`/api/appointments/${a.id}`)).status()).toBe(404);
  expect((await (await other.get("/api/appointments")).json()).totalItems).toBe(
    0,
  );
  const native = await other.get(
    `${backend}/api/collections/appointments/records?perPage=1`,
  );
  expect((await native.json()).items || []).toHaveLength(0);
  await other.dispose();
});

test("capacity is reserved on confirmation atomically; overlaps, cancellations and repeated confirmations stay consistent", async ({
  request,
  playwright,
}) => {
  const aData = await payload(request, "maintenance"),
    a = await create(request, aData);
  const b = await create(request, {
    ...(await payload(request, "diagnostics", { date: a.date, time: a.time })),
    requestId: crypto.randomUUID(),
  });
  const c = await create(request, {
    ...(await payload(request, "diagnostics", { date: a.date, time: a.time })),
    requestId: crypto.randomUUID(),
  });
  const staff = await playwright.request.newContext({ baseURL: origin });
  await login(staff, "reception");
  const results = await Promise.all(
    [a, b, c].map((row) => status(staff, row, "confirmed")),
  );
  expect(results.filter((r) => r.status() === 200)).toHaveLength(2);
  expect(results.filter((r) => r.status() === 409)).toHaveLength(1);
  const confirmed = (await results.find((r) => r.status() === 200)!.json())
    .appointment as LiveAppointment;
  const repeated = await status(staff, confirmed, "confirmed");
  expect(repeated.status()).toBe(200);
  expect((await repeated.json()).appointment.confirmation).toEqual(
    confirmed.confirmation,
  );
  const detail = await (
    await staff.get(`/api/appointments/${confirmed.id}`)
  ).json();
  expect(
    detail.history.filter((e: { action: string }) => e.action === "confirmed"),
  ).toHaveLength(1);
  const blocked = await (
    await request.get("/api/appointments/availability?service=diagnostics")
  ).json();
  expect(blocked.days[a.date]).not.toContain(a.time);
  const cancelled = await status(staff, confirmed, "cancelled");
  expect(cancelled.status()).toBe(200);
  const free = await (
    await request.get("/api/appointments/availability?service=diagnostics")
  ).json();
  expect(free.days[a.date]).toContain(a.time);
  await staff.dispose();
});

test("owner, reception and manager permissions protect snapshots, transitions, rescheduling and audit history", async ({
  request,
  playwright,
}) => {
  const { user } = await customer(request);
  const carResponse = await request.post("/api/vehicles", {
    headers,
    data: {
      plate: "BOOK123",
      make: "Škoda",
      model: "Octavia",
      year: 2018,
      vin: "WVWZZZ1JZXW000001",
    },
  });
  expect(carResponse.status()).toBe(201);
  const vehicle = (await carResponse.json()).vehicle;
  const data = {
    ...(await payload(request)),
    vehicleId: vehicle.id,
    vehicle: {
      plate: vehicle.plate,
      make: vehicle.make,
      model: vehicle.model,
      year: vehicle.year,
      vin: vehicle.vin,
    },
  };
  let a = await create(request, data);
  expect(a.owner).toBe(user.id);
  expect(a.vehicle.model).toBe("Octavia");
  expect((await status(request, a, "confirmed")).status()).toBe(403);
  const reception = await playwright.request.newContext({ baseURL: origin });
  await login(reception, "reception");
  let r = await status(reception, a, "confirmed");
  expect(r.status()).toBe(200);
  a = (await r.json()).appointment;
  expect((await status(reception, a, "progress")).status()).toBe(403);
  const stale = await request.patch(`/api/appointments/${a.id}`, {
    headers,
    data: { ...data, requestId: undefined, revision: 1 },
  });
  expect(stale.status()).toBe(409);
  const newData = {
    ...(await payload(request, "tyres")),
    requestId: undefined,
    revision: a.revision,
  };
  r = await request.patch(`/api/appointments/${a.id}`, {
    headers,
    data: newData,
  });
  expect(r.status(), await r.text()).toBe(200);
  a = (await r.json()).appointment;
  expect(a.status).toBe("requested");
  expect(a.confirmation).toBeNull();
  r = await status(reception, a, "confirmed");
  expect(r.status()).toBe(200);
  a = (await r.json()).appointment;
  const manager = await playwright.request.newContext({ baseURL: origin });
  await login(manager, "manager");
  r = await status(manager, a, "progress");
  expect(r.status()).toBe(200);
  a = (await r.json()).appointment;
  expect((await status(request, a, "cancelled")).status()).toBe(409);
  r = await status(manager, a, "completed");
  expect(r.status()).toBe(200);
  a = (await r.json()).appointment;
  expect((await status(manager, a, "confirmed")).status()).toBe(409);
  const detail = await (await request.get(`/api/appointments/${a.id}`)).json();
  expect(detail.history.map((e: { action: string }) => e.action)).toEqual([
    "requested",
    "confirmed",
    "rescheduled",
    "confirmed",
    "progress",
    "completed",
  ]);
  expect(detail.history.every((e: { actorName: string }) => !e.actorName)).toBe(
    true,
  );
  await request.delete(`/api/vehicles/${vehicle.id}`, { headers });
  expect(
    (await (await request.get(`/api/appointments/${a.id}`)).json()).appointment
      .vehicle.model,
  ).toBe(a.vehicle.model);
  const replay = await request.post("/api/appointments", { headers, data });
  expect(replay.status(), await replay.text()).toBe(201);
  expect((await replay.json()).appointment).toMatchObject({
    id: a.id,
    status: "completed",
  });
  await reception.dispose();
  await manager.dispose();
});

test("direct PocketBase calls cannot forge owners, durations or states; guest capability expiry is enforced", async ({
  request,
  playwright,
}) => {
  const data = await payload(request),
    a = await create(request, data),
    cookies = (await request.storageState()).cookies,
    guest = cookies.find((c) => c.name === "fairauto_guest")!.value;
  const attacker = await playwright.request.newContext({ baseURL: origin });
  const { email, user } = await customer(attacker);
  expect((await attacker.get(`/api/appointments/${a.id}`)).status()).toBe(404);
  const rawAuth = await attacker.post(
    `${backend}/api/collections/users/auth-with-password`,
    { data: { identity: email, password } },
  );
  const auth = { Authorization: (await rawAuth.json()).token };
  expect(
    (
      await attacker.post(`${backend}/api/collections/appointments/records`, {
        headers: auth,
        data: { owner: user.id, status: "confirmed" },
      })
    ).status(),
  ).toBe(403);
  for (const extra of [
    { owner: user.id },
    { duration: 1 },
    { status: "confirmed" },
    { guestHash: "x" },
    { confirmation: { method: "phone" } },
  ]) {
    expect(
      (
        await request.post("/api/appointments", {
          headers,
          data: { ...data, ...extra },
        })
      ).status(),
    ).toBe(400);
    expect(
      (
        await request.post(`${backend}/api/fairauto/appointments`, {
          headers: { "X-Fairauto-Guest": guest },
          data: { ...data, ...extra },
        })
      ).status(),
    ).toBe(400);
  }
  expect(
    (
      await request.post("/api/appointments", {
        headers: { Origin: "https://evil.example" },
        data,
      })
    ).status(),
  ).toBe(403);
  expect(
    (
      await request.post("/api/appointments", {
        headers,
        data: { ...data, note: "x".repeat(9000) },
      })
    ).status(),
  ).toBe(413);
  expect(
    (
      await request.post("/api/appointments", {
        headers,
        data: { ...data, acceptTerms: false },
      })
    ).status(),
  ).toBe(400);
  const rootHeaders = await root(request);
  expect(
    (
      await request.patch(
        `${backend}/api/collections/appointments/records/${a.id}`,
        {
          headers: rootHeaders,
          data: { guestExpiresAt: "2020-01-01 00:00:00.000Z" },
        },
      )
    ).status(),
  ).toBe(200);
  expect((await request.get(`/api/appointments/${a.id}`)).status()).toBe(404);
  expect(
    (await (await request.get("/api/appointments")).json()).totalItems,
  ).toBe(0);
  expect(
    (await request.post("/api/appointments", { headers, data })).status(),
  ).toBe(404);
  await attacker.dispose();
});

test("closures are manager-only and prevent requests and confirmations; reports use persisted data", async ({
  request,
  playwright,
}) => {
  const data = await payload(request),
    a = await create(request, data);
  const reception = await playwright.request.newContext({ baseURL: origin });
  await login(reception, "reception");
  expect(
    (
      await reception.put("/api/appointments/closures", {
        headers,
        data: { date: a.date },
      })
    ).status(),
  ).toBe(403);
  expect((await reception.get("/api/appointments/dashboard")).status()).toBe(
    403,
  );
  const manager = await playwright.request.newContext({ baseURL: origin });
  await login(manager, "manager");
  expect(
    (
      await manager.put("/api/appointments/closures", {
        headers,
        data: { date: a.date },
      })
    ).status(),
  ).toBe(200);
  expect(
    (
      await request.post("/api/appointments", {
        headers,
        data: { ...data, requestId: crypto.randomUUID() },
      })
    ).status(),
  ).toBe(409);
  expect((await status(reception, a, "confirmed")).status()).toBe(409);
  expect(
    (
      await (
        await request.get("/api/appointments/availability?service=diagnostics")
      ).json()
    ).days[a.date],
  ).toEqual([]);
  expect(
    (
      await manager.delete("/api/appointments/closures", {
        headers,
        data: { date: a.date },
      })
    ).status(),
  ).toBe(200);
  expect((await status(reception, a, "confirmed")).status()).toBe(200);
  const report = await manager.get("/api/appointments/dashboard?days=7");
  expect(report.status(), await report.text()).toBe(200);
  expect((await report.json()).totals.reservedMinutes).toBeGreaterThan(0);
  await reception.dispose();
  await manager.dispose();
});

async function uiSlot(page: Page, target?: { date: string; time: string }) {
  await page.getByRole("button", { name: "Tovább az időpontokhoz" }).click();
  if (target) {
    await page.locator(`.calendar-day[data-date="${target.date}"]`).click();
    await page
      .locator(".time-grid")
      .getByRole("button", { name: target.time, exact: true })
      .click();
  } else {
    await page.locator(".calendar-day:not([disabled])").first().click();
    await page.locator(".time-grid button:not([disabled])").first().click();
  }
  const date = (await page
    .locator(".calendar-day[aria-pressed=true]")
    .getAttribute("data-date"))!;
  const time = (
    await page.locator(".time-grid button[aria-pressed=true]").innerText()
  ).trim();
  await page.getByRole("button", { name: "Tovább az adatokhoz" }).click();
  return { date, time };
}
test("saved customer details book a real appointment; staff confirm and complete it through the UI", async ({
  page,
}) => {
  await customer(page.request);
  expect(
    (
      await page.request.post("/api/vehicles", {
        headers,
        data: {
          plate: "APPT123",
          make: "Škoda",
          model: "Octavia",
          year: 2020,
          vin: "WVWZZZ1JZXW000001",
        },
      })
    ).status(),
  ).toBe(201);
  await page.goto("/idopont?service=inspection");
  await uiSlot(page);
  await expect(page.getByLabel("Teljes név")).toHaveValue("Booking Customer");
  await expect(page.getByLabel("Mobiltelefonszám")).toHaveValue("+36301234567");
  await expect(page.getByLabel("Település")).toHaveValue("Veszprém");
  await expect(page.getByLabel("Rendszám")).toHaveValue("APPT123");
  await expect(page.getByLabel("Modell")).toHaveValue("Octavia");
  await expect(page.getByLabel("Alvázszám (VIN)")).toHaveValue(
    "WVWZZZ1JZXW000001",
  );
  await page.getByRole("button", { name: "Foglalás áttekintése" }).click();
  await page.getByRole("checkbox").check();
  const created = page.waitForResponse(
    (r) =>
      r.url().endsWith("/api/appointments") && r.request().method() === "POST",
  );
  await page.getByRole("button", { name: "Időpontkérés elküldése" }).click();
  const a = (await (await created).json()).appointment as LiveAppointment;
  await expect(
    page.getByRole("heading", { name: "Köszönjük a bizalmat!" }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => localStorage.getItem("fairauto-prototype-v1") || "",
    ),
  ).not.toContain("APPT123");
  await page.getByRole("link", { name: "Foglalásaim megtekintése" }).click();
  await expect(page.locator(".appointment-card")).toContainText("APPT123");
  await login(page.request, "reception");
  await page.goto(`/munkafelvetel?filter=requests&appointment=${a.id}`);
  const modal = page.getByRole("dialog");
  await expect(modal).toContainText("APPT123");
  await expect(
    modal.getByRole("button", { name: "Munka indítása" }),
  ).toHaveCount(0);
  await modal
    .getByRole("button", { name: "Visszaigazolás", exact: true })
    .click();
  await expect(modal.locator(".status-confirmed")).toBeVisible();
  await page.screenshot({
    path: test.info().outputPath("appointment-staff-desktop.png"),
    fullPage: true,
  });
  await login(page.request, "manager");
  await page.goto(`/muhely?appointment=${a.id}`);
  await modal.getByRole("button", { name: "Munka indítása" }).click();
  await modal.getByRole("button", { name: "Elkészült", exact: true }).click();
  await expect(modal.locator(".status-completed")).toBeVisible();
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({
    path: test.info().outputPath("appointment-staff-mobile.png"),
    fullPage: true,
  });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});

test("the booking UI recovers when staff fill a slot while the customer reviews the request", async ({
  page,
  playwright,
}) => {
  await context(page.request);
  const available = await (
    await page.request.get("/api/appointments/availability?service=diagnostics")
  ).json();
  const date = Object.keys(available.days)
    .filter((day) => available.days[day].length)
    .sort()
    .at(-1)!;
  const target = { date, time: available.days[date][0] as string };
  await page.goto(`/idopont?service=diagnostics&date=${target.date}`);
  await uiSlot(page, target);
  await page.getByLabel("Teljes név").fill("Late Request");
  await page.getByLabel("Mobiltelefonszám").fill("+36301234567");
  await page
    .getByLabel("E-mail-cím")
    .fill(`late-${crypto.randomUUID()}@example.test`);
  await page.getByLabel("Település").fill("Veszprém");
  await page.getByLabel("Rendszám").fill("LATE123");
  await page.getByLabel("Gyártási év").fill("2020");
  await page.getByLabel("Alvázszám (VIN)").fill("WVWZZZ1JZXW000001");
  await page.getByLabel("Márka").fill("Ford");
  await page.getByLabel("Modell").fill("Focus");
  await page.getByRole("button", { name: "Foglalás áttekintése" }).click();
  await page.getByRole("checkbox").check();
  const staff = await playwright.request.newContext({ baseURL: origin });
  await login(staff, "reception");
  const rows: LiveAppointment[] = [];
  for (let n = 0; n < 2; n++) {
    const a = await create(staff, await payload(staff, "diagnostics", target));
    const response = await status(staff, a, "confirmed");
    expect(response.status()).toBe(200);
    rows.push((await response.json()).appointment);
  }
  await page.getByRole("button", { name: "Időpontkérés elküldése" }).click();
  await expect(
    page.getByRole("heading", { name: "Mikor találkozzunk?" }),
  ).toBeVisible();
  await expect(page.locator("main [role=alert]")).toContainText(
    "Ez az időpont közben betelt",
  );
  for (const row of rows)
    expect((await status(staff, row, "cancelled")).status()).toBe(200);
  await staff.dispose();
});

test("prices require staff and phone confirmation; totals are computed on the server and stale edits are rejected", async ({
  request,
  playwright,
}) => {
  await customer(request);
  const data = await payload(request),
    a = await create(request, data);
  const reception = await playwright.request.newContext({ baseURL: origin });
  await login(reception, "reception");
  const save = (api: APIRequestContext, revision: number, input: unknown) =>
    api.put(`/api/appointments/${a.id}/price`, {
      headers,
      data: { revision, ...(input as object) },
    });
  const total = { mode: "total", totalHuf: 45000, note: "Tájékoztató ár" };
  expect((await save(request, a.revision, total)).status()).toBe(403);
  expect((await save(reception, a.revision, total)).status()).toBe(409);
  const confirmed = (await (await status(reception, a, "confirmed")).json())
    .appointment as LiveAppointment;
  let response = await save(reception, confirmed.revision, total);
  expect(response.status(), await response.text()).toBe(200);
  let current = (await response.json()).appointment as LiveAppointment;
  expect(current.price?.totalHuf).toBe(45000);
  expect(
    (await (await request.get(`/api/appointments/${a.id}`)).json()).appointment
      .price.totalHuf,
  ).toBe(45000);
  expect((await save(reception, confirmed.revision, total)).status()).toBe(409);
  const items = [
    { kind: "part", description: "Olajszűrő", quantity: 2, unitPriceHuf: 7500 },
    {
      kind: "labour",
      description: "Munkadíj",
      quantity: 1,
      unitPriceHuf: 20000,
    },
  ];
  for (const bad of [
    { mode: "total", totalHuf: -1 },
    { mode: "total", totalHuf: 1.5 },
    { mode: "itemized", totalHuf: 1, items },
    { mode: "itemized", items: [{ ...items[0], quantity: 0 }] },
    { mode: "itemized", items: [{ ...items[0], unitPriceHuf: 1000000000 }] },
  ])
    expect((await save(reception, current.revision, bad)).status()).toBe(400);
  response = await save(reception, current.revision, {
    mode: "itemized",
    items,
    note: "Alkatrészek és munkadíj\nBruttó összegek",
  });
  expect(response.status(), await response.text()).toBe(200);
  current = (await response.json()).appointment;
  expect(current.price).toMatchObject({
    mode: "itemized",
    totalHuf: 35000,
    items,
  });
  // Same data with the current revision is a no-op, including its notification event.
  response = await save(reception, current.revision, {
    mode: "itemized",
    items,
    note: current.price!.note,
  });
  expect((await response.json()).appointment.revision).toBe(current.revision);
  const other = await playwright.request.newContext({ baseURL: origin });
  await context(other);
  expect((await other.get(`/api/appointments/${a.id}`)).status()).toBe(404);
  const auth = await root(request);
  const native = await request.get(
    `${backend}/api/collections/appointments/records/${a.id}`,
    { headers: auth },
  );
  expect((await native.json()).price.totalHuf).toBe(35000);
  expect(
    (
      await other.get(`${backend}/api/collections/appointment_mail/records`)
    ).status(),
  ).toBe(403);
  // Rescheduling invalidates the old price as well as the phone confirmation.
  response = await request.patch(`/api/appointments/${a.id}`, {
    headers,
    data: { ...data, requestId: undefined, revision: current.revision },
  });
  expect(response.status(), await response.text()).toBe(200);
  expect((await response.json()).appointment.price).toBeNull();
  await reception.dispose();
  await other.dispose();
});

test("multiple saved cars require a choice, guests stay blank, and a new guest request clears the previous details", async ({
  page,
}) => {
  await customer(page.request);
  for (const [plate, model] of [
    ["FIRST123", "Focus"],
    ["SECOND123", "Fiesta"],
  ]) {
    expect(
      (
        await page.request.post("/api/vehicles", {
          headers,
          data: { plate, make: "Ford", model, year: 2020 },
        })
      ).status(),
    ).toBe(201);
  }
  // Booking context uses fresh server data even if the portal has not refreshed its profile cache.
  await page.request.patch("/api/account", {
    headers,
    data: { city: "Pákozd" },
  });
  await page.goto("/idopont?service=other");
  await uiSlot(page);
  await expect(page.getByLabel("Teljes név")).toHaveValue("Booking Customer");
  await expect(page.getByLabel("Település")).toHaveValue("Pákozd");
  await expect(page.getByLabel("Rendszám")).toHaveValue("");
  await page
    .getByLabel("Jármű a céges flottából")
    .selectOption({ label: "Ford Fiesta · SECOND123" });
  await expect(page.getByLabel("Rendszám")).toHaveValue("SECOND123");
  await expect(page.getByLabel("Modell")).toHaveValue("Fiesta");
  await page.request.post("/api/auth/logout", { headers, data: {} });
  await page.goto("/idopont?service=other");
  await uiSlot(page);
  for (const field of [
    "Teljes név",
    "Mobiltelefonszám",
    "E-mail-cím",
    "Település",
    "Rendszám",
    "Modell",
  ])
    await expect(page.getByLabel(field)).toHaveValue("");
  await expect(page.getByLabel("E-mail-cím")).toHaveAttribute(
    "autocomplete",
    "off",
  );
  await page.getByLabel("Teljes név").fill("Guest Blank");
  await page.getByLabel("Mobiltelefonszám").fill("+36301234567");
  await page
    .getByLabel("E-mail-cím")
    .fill(`blank-${crypto.randomUUID()}@example.test`);
  await page.getByLabel("Település").fill("Pákozd");
  await page.getByLabel("Rendszám").fill("BLANK123");
  await page.getByLabel("Gyártási év").fill("2020");
  await page.getByLabel("Alvázszám (VIN)").fill("WVWZZZ1JZXW000001");
  await page.getByLabel("Márka").fill("Ford");
  await page.getByLabel("Modell").fill("Focus");
  await page.getByRole("button", { name: "Foglalás áttekintése" }).click();
  await page.getByRole("checkbox").check();
  await page.getByRole("button", { name: "Időpontkérés elküldése" }).click();
  await page.getByRole("button", { name: "Másik időpontot kérek" }).click();
  await page.getByRole("button", { name: /Egyéb szervizigény/ }).click();
  await uiSlot(page);
  await expect(page.getByLabel("Teljes név")).toHaveValue("");
  await expect(page.getByLabel("Rendszám")).toHaveValue("");
});

test("staff edit detailed prices through the UI and customers see a read-only breakdown on mobile", async ({
  page,
}) => {
  await customer(page.request);
  const a = await create(page.request, await payload(page.request));
  await login(page.request, "reception");
  const confirmed = await status(page.request, a, "confirmed");
  expect(confirmed.status()).toBe(200);
  await page.goto(`/munkafelvetel?appointment=${a.id}`);
  const dialog = page.getByRole("dialog");
  await dialog.getByRole("button", { name: "Ár hozzáadása" }).click();
  await dialog.getByLabel("Árazás módja").selectOption("itemized");
  await dialog.getByLabel("1. tétel megnevezése").fill("Fékbetét");
  await dialog.getByLabel("1. tétel mennyisége").fill("2");
  await dialog.getByLabel("1. tétel bruttó egységára (Ft)").fill("15000");
  await dialog.getByRole("button", { name: "Új tétel", exact: true }).click();
  await dialog.getByLabel("2. tétel típusa").selectOption("labour");
  await dialog.getByLabel("2. tétel megnevezése").fill("Beszerelés");
  await dialog.getByLabel("2. tétel bruttó egységára (Ft)").fill("20000");
  await dialog.getByRole("button", { name: "Ár mentése", exact: true }).click();
  await expect(dialog.locator(".price-total")).toContainText(/50\s*000/);
  await expect(dialog.locator(".price-lines")).toContainText("Fékbetét");
  await expect(dialog.locator(".price-lines")).toContainText("Beszerelés");
  await page.setViewportSize({ width: 390, height: 844 });
  await dialog.locator(".appointment-price").scrollIntoViewIfNeeded();
  await page.screenshot({
    path: test.info().outputPath("price-breakdown-mobile.png"),
  });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  // A separate guest owns the record below and receives the same read-only breakdown.
  await page.request.post("/api/auth/logout", { headers, data: {} });
  const guest = await create(page.request, await payload(page.request));
  await login(page.request, "manager");
  let current = (await (await status(page.request, guest, "confirmed")).json())
    .appointment;
  expect(
    (
      await page.request.put(`/api/appointments/${guest.id}/price`, {
        headers,
        data: { mode: "total", totalHuf: 80000, revision: current.revision },
      })
    ).status(),
  ).toBe(200);
  await page.request.post("/api/auth/logout", { headers, data: {} });
  await page.goto(`/foglalasaim?appointment=${guest.id}`);
  await expect(dialog.locator(".price-total")).toContainText(/80\s*000/);
  await expect(
    dialog.getByRole("button", { name: "Ár módosítása" }),
  ).toHaveCount(0);
});

test("mail uses durable snapshots, separate recipients and retries; repeated events never create duplicate jobs", async ({
  request,
  playwright,
}) => {
  const auth = await root(request);
  expect(
    (
      await request.post(`${backend}/api/fairauto-test/mail`, {
        headers: auth,
        data: { clear: true, fail: true },
      })
    ).status(),
  ).toBe(200);
  const data = await payload(request),
    a = await create(request, { ...data, note: '<script>alert("x")</script>' });
  const list = async () =>
    (
      await (
        await request.get(
          `${backend}/api/collections/appointment_mail/records?perPage=100`,
          { headers: auth },
        )
      ).json()
    ).items as Array<{
      id: string;
      event: string;
      status: string;
      attempts: number;
      recipient: string;
      snapshot: { reference: string };
      nextAttempt: number;
    }>;
  let jobs = await list();
  expect(
    jobs.filter((job) => job.snapshot.reference === a.reference),
  ).toHaveLength(3);
  expect(new Set(jobs.map((job) => job.recipient)).size).toBe(3);
  await create(request, { ...data, note: '<script>alert("x")</script>' });
  expect((await list()).length).toBe(3);
  expect(
    (
      await request.post(`${backend}/api/fairauto-test/mail`, {
        headers: auth,
        data: { fail: true },
      })
    ).status(),
  ).toBe(200);
  jobs = await list();
  expect(
    jobs.every((job) => job.status === "pending" && job.attempts >= 1),
  ).toBe(true);
  expect((await request.get(`/api/appointments/${a.id}`)).status()).toBe(200);
  for (const job of jobs)
    expect(
      (
        await request.patch(
          `${backend}/api/collections/appointment_mail/records/${job.id}`,
          { headers: auth, data: { nextAttempt: 1 } },
        )
      ).status(),
    ).toBe(200);
  expect(
    (
      await request.post(`${backend}/api/fairauto-test/mail`, {
        headers: auth,
        data: { fail: false },
      })
    ).status(),
  ).toBe(200);
  jobs = await list();
  expect(jobs.every((job) => job.status === "sent")).toBe(true);
  const captures = await (
    await request.get(
      `${backend}/api/collections/test_mail_capture/records?perPage=100`,
      { headers: auth },
    )
  ).json();
  expect(captures.items).toHaveLength(3);
  for (const mail of captures.items) {
    expect(mail.html).toContain("8000 Székesfehérvár");
    expect(mail.html).not.toContain("<script>");
    expect(mail.html).toContain("&lt;script&gt;");
    expect(mail.html).not.toContain("manager@fairauto.test");
    expect(mail.html).not.toContain("reception@fairauto.test");
  }
  const staff = await playwright.request.newContext({ baseURL: origin });
  const staffUser = await login(staff, "reception");
  await request.post(`${backend}/api/fairauto-test/mail`, {
    headers: auth,
    data: { fail: true },
  });
  const confirmed = (await (await status(staff, a, "confirmed")).json())
    .appointment;
  await status(staff, confirmed, "confirmed");
  expect(
    (await list()).filter((job) => job.event === "confirmed"),
  ).toHaveLength(3);
  try {
    expect(
      (
        await request.patch(
          `${backend}/api/collections/users/records/${staffUser.id}`,
          { headers: auth, data: { active: false } },
        )
      ).status(),
    ).toBe(200);
    await request.post(`${backend}/api/fairauto-test/mail`, {
      headers: auth,
      data: { fail: false },
    });
    const latest = await (
      await request.get(
        `${backend}/api/collections/appointment_mail/records?perPage=100`,
        { headers: auth },
      )
    ).json();
    expect(
      latest.items.find(
        (job: { recipient: string; event: string }) =>
          job.recipient === staffUser.email && job.event === "confirmed",
      ),
    ).toMatchObject({ status: "failed", errorCode: "recipient_changed" });
    const delivered = await (
      await request.get(
        `${backend}/api/collections/test_mail_capture/records?perPage=100`,
        { headers: auth },
      )
    ).json();
    expect(
      delivered.items.filter(
        (mail: { recipient: string }) => mail.recipient === staffUser.email,
      ),
    ).toHaveLength(1);
  } finally {
    await request.patch(
      `${backend}/api/collections/users/records/${staffUser.id}`,
      { headers: auth, data: { active: true } },
    );
  }
  await staff.dispose();
});

test("guest bookings require a valid VIN; historical appointments can still be read without one", async ({
  request,
}) => {
  const data = await payload(request);
  expect(
    (
      await request.post("/api/appointments", {
        headers,
        data: { ...data, bookingFor: "customer" },
      })
    ).status(),
  ).toBe(403);
  for (const vin of [undefined, "", "INVALID", "WVWZZZ1JZXW00000O"]) {
    const r = await request.post("/api/appointments", {
      headers,
      data: { ...data, vehicle: { ...data.vehicle, vin } },
    });
    expect(r.status(), await r.text()).toBe(400);
  }
  const a = await create(request, data);
  expect(a.vehicle.vin).toBe(data.vehicle.vin);
  const auth = await root(request);
  const { vin: _, ...historical } = data.vehicle;
  expect(
    (
      await request.patch(
        `${backend}/api/collections/appointments/records/${a.id}`,
        { headers: auth, data: { vehicle: historical } },
      )
    ).status(),
  ).toBe(200);
  const r = await request.get(`/api/appointments/${a.id}`);
  expect(r.status()).toBe(200);
  expect((await r.json()).appointment.vehicle.vin).toBe("");
});

test("admin, reception and manager accounts autofill their own profile and car; staff customer bookings stay blank", async ({
  page,
}) => {
  test.setTimeout(60000);
  for (const [index, role] of ["admin", "reception", "manager"].entries()) {
    const user = await login(page.request, role);
    expect(
      (
        await page.request.patch("/api/account", {
          headers,
          data: { phone: "+36301234567", city: "Pákozd" },
        })
      ).status(),
    ).toBe(200);
    const carResponse = await page.request.post("/api/vehicles", {
      headers,
      data: {
        plate: `STAFF${index}`,
        make: "Ford",
        model: "Focus",
        year: 2020,
        vin: "WVWZZZ1JZXW000001",
      },
    });
    expect(carResponse.status()).toBe(201);
    const ownCar = (await carResponse.json()).vehicle;
    await page.goto("/idopont?service=other");
    await expect(page.getByLabel("Ügyfélnek foglalok")).not.toBeChecked();
    await uiSlot(page);
    await expect(page.getByLabel("Teljes név")).toHaveValue(user.name);
    await expect(page.getByLabel("E-mail-cím")).toHaveValue(user.email);
    await expect(page.getByLabel("Mobiltelefonszám")).toHaveValue(
      "+36301234567",
    );
    await expect(page.getByLabel("Település")).toHaveValue("Pákozd");
    await expect(page.getByLabel("Rendszám")).toHaveValue(`STAFF${index}`);
    await expect(page.getByLabel("Alvázszám (VIN)")).toHaveValue(
      "WVWZZZ1JZXW000001",
    );
    await page.getByRole("button", { name: "Foglalás áttekintése" }).click();
    await page.getByRole("checkbox", { name: /Elfogadom az ÁSZF/ }).check();
    const submitted = page.waitForResponse(
      (r) =>
        r.url().endsWith("/api/appointments") &&
        r.request().method() === "POST",
    );
    await page.getByRole("button", { name: "Időpontkérés elküldése" }).click();
    const response = await submitted;
    expect(response.status(), await response.text()).toBe(201);
    const a = (await response.json()).appointment;
    expect(a).toMatchObject({ owner: user.id, bookingFor: "self" });
    expect(
      (await (await page.request.get("/api/appointments")).json()).items.some(
        (item: { id: string }) => item.id === a.id,
      ),
    ).toBe(true);
    await page.goto("/idopont?for=customer&service=other");
    await expect(page.getByLabel("Ügyfélnek foglalok")).toBeChecked();
    await uiSlot(page);
    await expect(page.getByLabel("Teljes név")).toHaveValue("");
    await expect(page.getByLabel("E-mail-cím")).toHaveValue("");
    await expect(page.getByLabel("Rendszám")).toHaveValue("");
    expect(
      (
        await page.request.post("/api/appointments", {
          headers,
          data: {
            ...(await payload(page.request)),
            bookingFor: "customer",
            vehicleId: ownCar.id,
          },
        })
      ).status(),
    ).toBe(400);
    const onBehalf = await create(page.request, {
      ...(await payload(page.request)),
      bookingFor: "customer",
    });
    expect(onBehalf).toMatchObject({ owner: null, bookingFor: "customer" });
  }
});

test("mail diagnostics and retry are admin-only; retry preserves sent messages and revoked recipients", async ({
  page,
  playwright,
}) => {
  const request = page.request;
  expect((await request.get("/api/appointments/mail-status")).status()).toBe(
    403,
  );
  const auth = await root(request);
  expect(
    (
      await request.post(`${backend}/api/fairauto-test/mail`, {
        headers: auth,
        data: { clear: true, fail: true },
      })
    ).status(),
  ).toBe(200);
  await create(request, await payload(request));
  await request.post(`${backend}/api/fairauto-test/mail`, {
    headers: auth,
    data: { fail: true },
  });
  const jobs = (
    await (
      await request.get(
        `${backend}/api/collections/appointment_mail/records?perPage=100`,
        { headers: auth },
      )
    ).json()
  ).items;
  expect(jobs).toHaveLength(3);
  expect(
    (
      await request.patch(
        `${backend}/api/collections/appointment_mail/records/${jobs[0].id}`,
        { headers: auth, data: { status: "failed", attempts: 5 } },
      )
    ).status(),
  ).toBe(200);
  expect(
    (
      await request.patch(
        `${backend}/api/collections/appointment_mail/records/${jobs[2].id}`,
        {
          headers: auth,
          data: { status: "failed", errorCode: "recipient_changed" },
        },
      )
    ).status(),
  ).toBe(200);
  const delivered = await request.post(
    `${backend}/api/collections/appointment_mail/records`,
    {
      headers: auth,
      data: {
        appointment: jobs[0].appointment,
        eventKey: crypto.randomUUID(),
        event: "requested",
        recipient: jobs[0].recipient,
        snapshot: jobs[0].snapshot,
        status: "sent",
        attempts: 1,
      },
    },
  );
  expect(delivered.status()).toBe(200);
  const deliveredJob = await delivered.json();
  const unauthorized = await playwright.request.newContext({ baseURL: origin });
  await login(unauthorized, "reception");
  expect(
    (await unauthorized.get("/api/appointments/mail-status")).status(),
  ).toBe(403);
  expect(
    (
      await unauthorized.post("/api/appointments/mail-retry", {
        headers,
        data: {},
      })
    ).status(),
  ).toBe(403);
  await unauthorized.dispose();
  await login(request, "admin");
  const result = await request.get("/api/appointments/mail-status");
  expect(result.status(), await result.text()).toBe(200);
  const diagnostic = await result.json();
  expect(diagnostic).toMatchObject({
    enabled: true,
    transport: "sendmail",
    workerRegistered: true,
  });
  expect(typeof diagnostic.workerRunning).toBe("boolean");
  expect(JSON.stringify(diagnostic)).not.toContain("@fairauto.test");
  expect(diagnostic).not.toHaveProperty("recipient");
  expect(diagnostic).not.toHaveProperty("snapshot");
  expect(
    (
      await request.post("/api/appointments/mail-retry", {
        headers: { Origin: "https://attacker.invalid" },
        data: {},
      })
    ).status(),
  ).toBe(403);
  await page.goto("/admin");
  await page.getByText("E-mail értesítések állapota", { exact: true }).click();
  const panel = page.locator(".mail-status-panel");
  await expect(panel).toContainText("Bekapcsolva");
  await panel
    .getByRole("button", { name: "Sikertelen küldések újrapróbálása" })
    .click();
  await expect(panel).toContainText("2 értesítés újra küldésre vár");
  const after = (
    await (
      await request.get(
        `${backend}/api/collections/appointment_mail/records?perPage=100`,
        { headers: auth },
      )
    ).json()
  ).items;
  expect(
    after.find((job: { id: string }) => job.id === jobs[0].id),
  ).toMatchObject({ status: "pending", attempts: 0, errorCode: "" });
  expect(
    after.find((job: { id: string }) => job.id === jobs[2].id),
  ).toMatchObject({ status: "failed", errorCode: "recipient_changed" });
  expect(
    after.find((job: { id: string }) => job.id === deliveredJob.id),
  ).toMatchObject({ status: "sent", attempts: 1 });
});
