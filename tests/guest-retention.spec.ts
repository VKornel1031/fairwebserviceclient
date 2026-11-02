import { test, expect } from "@playwright/test";
import { rootHeaders } from "./account-mail-helper";
const backend = "http://127.0.0.1:3101";
const headers = { Origin: "http://127.0.0.1:3100" };

test("guest cleanup removes only due terminal records and their personal-data copies", async ({
  request,
}) => {
  const root = await rootHeaders(request);
  const context = await request.post("/api/appointments/context", {
    headers,
    data: {},
  });
  expect(context.status(), await context.text()).toBe(200);
  const config = await context.json();
  const available = await (
    await request.get("/api/appointments/availability?service=other")
  ).json();
  const date = Object.keys(available.days)
    .sort()
    .find((day) => available.days[day].length)!;
  const users = (
    await (
      await request.get(`${backend}/api/collections/users/records`, {
        headers: root,
      })
    ).json()
  ).items;
  const partner = users.find(
    (user: { email: string }) => user.email === "partner@fairauto.test",
  );
  const reception = users.find(
    (user: { email: string }) => user.email === "reception@fairauto.test",
  );
  const now = Date.now(),
    day = 86400000,
    cutoff = now - 30 * day;
  async function create(label: string, changes: Record<string, unknown> = {}) {
    const availability = await (
      await request.get("/api/appointments/availability?service=other")
    ).json();
    const openDate = Object.keys(availability.days)
      .sort()
      .find((day) => availability.days[day].length)!;
    const response = await request.post("/api/appointments", {
      headers,
      data: {
        requestId: crypto.randomUUID(),
        viewerId: "guest",
        service: "other",
        date: openDate,
        time: availability.days[openDate][0],
        contact: {
          name: "Retention " + label,
          email: `${crypto.randomUUID()}@example.test`,
          phone: "+36301234567",
          city: "Pákozd",
          reminders: false,
        },
        vehicle: {
          plate: "RET123",
          make: "Ford",
          model: "Focus",
          year: 2020,
          vin: "WVWZZZ1JZXW000001",
        },
        note: "",
        acceptTerms: true,
        termsVersion: config.config.termsVersion,
      },
    });
    expect(response.status(), await response.text()).toBe(201);
    const record = (await response.json()).appointment;
    if (label === "cancelled") {
      const cancelled = await request.post(
        `/api/appointments/${record.id}/status`,
        { headers, data: { status: "cancelled", revision: record.revision } },
      );
      expect(cancelled.status()).toBe(200);
      const closed = (
        await (
          await request.get(
            `${backend}/api/collections/appointments/records/${record.id}`,
            { headers: root },
          )
        ).json()
      ).closedAt;
      expect(Math.abs(Date.parse(closed) - Date.now())).toBeLessThan(5000);
      expect(
        (
          await request.post(`/api/appointments/${record.id}/status`, {
            headers,
            data: { status: "cancelled", revision: record.revision },
          })
        ).status(),
      ).toBe(200);
      expect(
        (
          await (
            await request.get(
              `${backend}/api/collections/appointments/records/${record.id}`,
              { headers: root },
            )
          ).json()
        ).closedAt,
      ).toBe(closed);
    }
    if (Object.keys(changes).length)
      expect(
        (
          await request.patch(
            `${backend}/api/collections/appointments/records/${record.id}`,
            { headers: root, data: changes },
          )
        ).status(),
      ).toBe(200);
    return record;
  }
  const due = [];
  for (const [label, status, at] of [
    ["cancelled", "cancelled", cutoff - 1],
    ["completed", "completed", cutoff - day],
    ["boundary", "cancelled", cutoff],
  ] as const)
    due.push(
      await create(label, { status, closedAt: new Date(at).toISOString() }),
    );
  const retained = [];
  retained.push(
    await create("recent", {
      status: "completed",
      closedAt: new Date(cutoff + 1).toISOString(),
    }),
  );
  for (const status of ["requested", "confirmed", "progress"])
    retained.push(
      await create(status, {
        status,
        closedAt: new Date(cutoff - day).toISOString(),
      }),
    );
  retained.push(
    await create("account", {
      owner: partner.id,
      createdBy: partner.id,
      guestHash: "",
      status: "completed",
      closedAt: new Date(cutoff - day).toISOString(),
    }),
  );
  retained.push(
    await create("deleted-account", {
      owner: "",
      createdBy: partner.id,
      guestHash: "",
      status: "cancelled",
      closedAt: new Date(cutoff - day).toISOString(),
    }),
  );
  retained.push(
    await create("staff-intake", {
      owner: "",
      createdBy: reception.id,
      guestHash: "",
      status: "cancelled",
      closedAt: new Date(cutoff - day).toISOString(),
    }),
  );
  retained.push(
    await create("unknown-closure", { status: "completed", closedAt: "" }),
  );
  const locked = await create("mail-in-flight", {
    status: "cancelled",
    closedAt: new Date(cutoff - day).toISOString(),
  });
  const jobs = await (
    await request.get(`${backend}/api/collections/appointment_mail/records`, {
      headers: root,
      params: { filter: `appointment = "${locked.id}"` },
    })
  ).json();
  expect(jobs.items.length).toBeGreaterThan(0);
  const job = jobs.items[0];
  expect(
    (
      await request.patch(
        `${backend}/api/collections/appointment_mail/records/${job.id}`,
        {
          headers: root,
          data: { status: "processing", lockedUntil: now + 600000 },
        },
      )
    ).status(),
  ).toBe(200);
  const first = await request.post(`${backend}/api/fairauto-test/retention`, {
    headers: root,
    data: { now },
  });
  expect(first.status(), await first.text()).toBe(200);
  expect(await first.json()).toEqual({ deleted: 3 });
  for (const record of due) {
    expect(
      (
        await request.get(
          `${backend}/api/collections/appointments/records/${record.id}`,
          { headers: root },
        )
      ).status(),
    ).toBe(404);
    for (const collection of ["appointment_events", "appointment_mail"]) {
      const rows = await request.get(
        `${backend}/api/collections/${collection}/records`,
        { headers: root, params: { filter: `appointment = "${record.id}"` } },
      );
      expect((await rows.json()).totalItems).toBe(0);
    }
  }
  for (const record of [...retained, locked])
    expect(
      (
        await request.get(
          `${backend}/api/collections/appointments/records/${record.id}`,
          { headers: root },
        )
      ).status(),
    ).toBe(200);
  await request.patch(
    `${backend}/api/collections/appointment_mail/records/${job.id}`,
    { headers: root, data: { lockedUntil: now - 1 } },
  );
  expect(
    await (
      await request.post(`${backend}/api/fairauto-test/retention`, {
        headers: root,
        data: { now },
      })
    ).json(),
  ).toEqual({ deleted: 1 });
  expect(
    await (
      await request.post(`${backend}/api/fairauto-test/retention`, {
        headers: root,
        data: { now },
      })
    ).json(),
  ).toEqual({ deleted: 0 });
});
