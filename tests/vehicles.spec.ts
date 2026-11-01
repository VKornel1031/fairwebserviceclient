import { test, expect, type APIRequestContext } from "@playwright/test";
const origin = "http://127.0.0.1:3100",
  backend = "http://127.0.0.1:3101";
const password = "Local-integration-only-928374!"; // Disposable loopback database only.
const headers = { Origin: origin };
const car = {
  plate: "AB CD-123",
  make: "Toyota",
  model: "Corolla",
  year: "2020",
};
async function login(api: APIRequestContext, email: string) {
  const result = await api.post("/api/auth/login", {
    headers,
    data: { email, password },
  });
  expect(result.status()).toBe(200);
  return (await result.json()).user;
}
async function customer(api: APIRequestContext) {
  const email = `garage-${crypto.randomUUID()}@example.test`;
  expect(
    (
      await api.post("/api/auth/register", {
        headers,
        data: {
          name: "Garage Tester",
          email,
          password,
          passwordConfirm: password,
          acceptTerms: true,
        },
      })
    ).status(),
  ).toBe(202);
  return { email, user: await login(api, email) };
}
async function create(api: APIRequestContext, data = car) {
  const result = await api.post("/api/vehicles", { headers, data });
  expect(result.status(), await result.text()).toBe(201);
  return (await result.json()).vehicle;
}
async function native(api: APIRequestContext, email: string) {
  const auth = await api.post(
    `${backend}/api/collections/users/auth-with-password`,
    { data: { identity: email, password } },
  );
  expect(auth.status()).toBe(200);
  return { Authorization: (await auth.json()).token };
}

test("saved cars persist across sessions; duplicates, defaults and default deletion are handled", async ({
  request,
  playwright,
}) => {
  const { email, user } = await customer(request);
  const first = await create(request);
  expect(first).toMatchObject({
    owner: user.id,
    plate: "ABCD123",
    year: "2020",
  });
  expect(
    (
      await request.post("/api/vehicles", {
        headers,
        data: { ...car, plate: "abcd123" },
      })
    ).status(),
  ).toBe(400);
  const second = await create(request, {
    ...car,
    plate: "XYZ-987",
    model: "Yaris",
  });
  let summary = await (await request.get("/api/vehicles/summary")).json();
  expect(summary).toMatchObject({
    totalItems: 2,
    defaultVehicle: { id: first.id },
  });
  expect(
    (
      await request.put("/api/vehicles/default", {
        headers,
        data: { vehicleId: second.id },
      })
    ).status(),
  ).toBe(200);
  const anotherDevice = await playwright.request.newContext({
    baseURL: origin,
  });
  await login(anotherDevice, email);
  summary = await (await anotherDevice.get("/api/vehicles/summary")).json();
  expect(summary.defaultVehicle.id).toBe(second.id);
  expect(
    (
      await anotherDevice.patch(`/api/vehicles/${second.id}`, {
        headers,
        data: { ...car, plate: "XYZ987", model: "Yaris Hybrid", year: 2021 },
      })
    ).status(),
  ).toBe(200);
  const results = await (await request.get("/api/vehicles?q=Yaris")).json();
  expect(results.totalItems).toBe(1);
  expect(results.items[0]).toMatchObject({
    model: "Yaris Hybrid",
    isDefault: true,
  });
  expect(
    (await request.delete(`/api/vehicles/${second.id}`, { headers })).status(),
  ).toBe(200);
  summary = await (await request.get("/api/vehicles/summary")).json();
  expect(summary).toMatchObject({
    totalItems: 1,
    defaultVehicle: { id: first.id },
  });
  expect(
    (await request.delete(`/api/vehicles/${first.id}`, { headers })).status(),
  ).toBe(200);
  expect(
    await (await request.get("/api/vehicles/summary")).json(),
  ).toMatchObject({ totalItems: 0, defaultVehicle: null });
  await anotherDevice.dispose();
});

test("customers are isolated; admin can edit all cars; forged owners and preferences are rejected natively", async ({
  request,
  playwright,
}) => {
  const a = await customer(request),
    first = await create(request);
  const other = await playwright.request.newContext({ baseURL: origin });
  const b = await customer(other),
    second = await create(other);
  expect((await other.get("/api/vehicles?scope=all")).status()).toBe(403);
  expect(
    (
      await other.patch(`/api/vehicles/${first.id}`, { headers, data: car })
    ).status(),
  ).toBe(404);
  expect(
    (await other.delete(`/api/vehicles/${first.id}`, { headers })).status(),
  ).toBe(404);
  expect(
    (
      await other.put("/api/vehicles/default", {
        headers,
        data: { vehicleId: first.id },
      })
    ).status(),
  ).toBe(404);
  expect(
    (
      await other.post("/api/vehicles", {
        headers,
        data: { ...car, owner: a.user.id },
      })
    ).status(),
  ).toBe(400);
  const auth = await native(other, b.email);
  const raw = `${backend}/api/collections/vehicles/records`;
  expect(
    (await other.get(`${raw}/${first.id}`, { headers: auth })).status(),
  ).toBe(404);
  expect(
    (
      await other.post(raw, {
        headers: auth,
        data: { ...car, year: 2020, plate: "BAD123", owner: a.user.id },
      })
    ).status(),
  ).toBe(400);
  for (const forged of [
    { owner: a.user.id },
    { "owner+": a.user.id },
    { "owner-": b.user.id },
    { owner: b.user.id, "owner+": a.user.id },
  ]) {
    await other.patch(`${raw}/${second.id}`, { headers: auth, data: forged });
    expect(
      (await (await other.get(`${raw}/${second.id}`, { headers: auth })).json())
        .owner,
    ).toBe(b.user.id);
  }
  expect(
    (
      await other.put("/api/vehicles/default", {
        headers,
        data: { vehicleId: second.id },
      })
    ).status(),
  ).toBe(200);
  for (const forged of [
    { defaultVehicle: first.id },
    { "defaultVehicle+": first.id },
    { defaultVehicle: second.id, "defaultVehicle+": first.id },
  ]) {
    await other.patch(`${backend}/api/collections/users/records/${b.user.id}`, {
      headers: auth,
      data: forged,
    });
    const account = await (await other.get("/api/auth/session")).json();
    expect(account.user.defaultVehicle).not.toBe(first.id);
  }
  for (const forged of [
    { defaultVehicle: first.id },
    { "defaultVehicle+": first.id },
  ]) {
    const result = await request.post(
      `${backend}/api/collections/users/records`,
      {
        data: {
          name: "Forged default",
          email: `forged-${crypto.randomUUID()}@example.test`,
          password,
          passwordConfirm: password,
          role: "customer",
          active: true,
          termsVersion: "test",
          termsAcceptedAt: new Date().toISOString(),
          ...forged,
        },
      },
    );
    expect(result.status()).toBe(400);
  }
  const own = await (
    await other.get(
      "/api/vehicles?q=%22%20%7C%7C%20owner%20!%3D%20%22%22%20%7C%7C%20plate%20~%20%22",
    )
  ).json();
  expect(own.items.every((v: { owner: string }) => v.owner === b.user.id)).toBe(
    true,
  );
  const admin = await playwright.request.newContext({ baseURL: origin });
  await login(admin, "admin@fairauto.test");
  const all = await (await admin.get("/api/vehicles?scope=all")).json();
  expect(all.items.some((v: { id: string }) => v.id === first.id)).toBe(true);
  expect(
    (
      await admin.patch(`/api/vehicles/${first.id}`, {
        headers,
        data: { ...car, model: "Admin edited" },
      })
    ).status(),
  ).toBe(200);
  expect(
    (
      await admin.put("/api/vehicles/default", {
        headers,
        data: { vehicleId: first.id },
      })
    ).status(),
  ).toBe(403);
  expect(
    (await admin.delete(`/api/vehicles/${first.id}`, { headers })).status(),
  ).toBe(200);
  await other.dispose();
  await admin.dispose();
});

test("car APIs enforce authentication, CSRF and input bounds", async ({
  request,
}) => {
  expect((await request.get("/api/vehicles")).status()).toBe(401);
  const { user } = await customer(request);
  const saved = await create(request);
  for (const invalid of [
    { ...car, year: 1600 },
    { ...car, year: 9999 },
    { ...car, year: 2020.5 },
    { ...car, make: "  " },
    { ...car, model: "x".repeat(61) },
    { ...car, plate: "<script>" },
    { ...car, isDefault: true },
    { ...car, owner: user.id },
  ])
    expect(
      (
        await request.post("/api/vehicles", { headers, data: invalid })
      ).status(),
    ).toBe(400);
  expect(
    (
      await request.post("/api/vehicles", {
        headers,
        data: { ...car, plate: "x".repeat(9000) },
      })
    ).status(),
  ).toBe(413);
  expect(
    (
      await request.post("/api/vehicles", {
        headers: { Origin: "https://evil.example" },
        data: car,
      })
    ).status(),
  ).toBe(403);
  expect(
    (
      await request.delete(`/api/vehicles/${saved.id}`, {
        headers: { Origin: "https://evil.example" },
      })
    ).status(),
  ).toBe(403);
  expect(
    (
      await request.put("/api/vehicles/default", {
        data: { vehicleId: saved.id },
      })
    ).status(),
  ).toBe(403);
  expect((await request.get("/api/vehicles?page=NaN")).status()).toBe(400);
  expect(
    (await request.get("/api/vehicles?q=" + "x".repeat(101))).status(),
  ).toBe(400);
});

test("customer and partner screens save cars, edit and delete them, update summaries and work on mobile", async ({
  page,
}) => {
  await customer(page.request);
  await page.goto("/jarmuvek");
  await expect(page.getByText("Az első autód helye már megvan.")).toBeVisible();
  await page.getByRole("button", { name: "Jármű hozzáadása" }).first().click();
  const dialog = page.getByRole("dialog");
  await dialog.getByLabel("Rendszám").fill("ABC-123");
  await dialog.getByLabel("Gyártási év").fill("2018");
  await dialog.getByLabel("Márka").fill("Škoda");
  await dialog.getByLabel("Modell").fill("Octavia");
  await dialog.getByRole("button", { name: "Jármű mentése" }).click();
  await expect(page.locator(".vehicle-card")).toContainText("Octavia");
  await page.reload();
  await expect(page.locator(".vehicle-card")).toContainText("ABC-123");
  await page.getByRole("button", { name: "ABC-123 szerkesztése" }).click();
  await dialog.getByLabel("Modell").fill("Superb");
  await dialog.getByRole("button", { name: "Jármű mentése" }).click();
  await expect(page.locator(".vehicle-card")).toContainText("Superb");
  await page
    .locator(".sidebar")
    .getByRole("link", { name: "Áttekintés", exact: true })
    .click();
  await expect(page.locator(".customer-car-row")).toContainText("Škoda Superb");
  expect(
    await page.evaluate(
      () => localStorage.getItem("fairauto-prototype-v1") || "",
    ),
  ).not.toContain("Superb");
  await page
    .locator(".sidebar")
    .getByRole("link", { name: "Járműveim", exact: true })
    .click();
  await page.screenshot({
    path: test.info().outputPath("vehicles-desktop.png"),
    fullPage: true,
  });
  for (const width of [320, 390]) {
    await page.setViewportSize({ width, height: 844 });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
  }
  await page.screenshot({
    path: test.info().outputPath("vehicles-mobile.png"),
    fullPage: true,
  });
  await page.getByRole("button", { name: "ABC-123 törlése" }).click();
  await dialog.getByRole("button", { name: "Jármű törlése" }).click();
  await expect(page.locator(".vehicle-card")).toHaveCount(0);
  await login(page.request, "partner@fairauto.test");
  await page.goto("/partnerek");
  await page.getByRole("button", { name: "Jármű hozzáadása" }).first().click();
  await dialog.getByLabel("Rendszám").fill("PART123");
  await dialog.getByLabel("Gyártási év").fill("2022");
  await dialog.getByLabel("Márka").fill("Ford");
  await dialog.getByLabel("Modell").fill("Transit");
  await dialog.getByRole("button", { name: "Jármű mentése" }).click();
  await expect(page.locator(".vehicle-card")).toContainText("Transit");
  await expect(page.locator(".stats-grid > div").first()).toContainText("01");
});

test("fleet pagination, search and concurrent default selections preserve one valid default", async ({
  page,
}) => {
  const { email, user } = await customer(page.request);
  const auth = await native(page.request, email);
  const cars: { id: string }[] = [];
  for (let index = 0; index < 25; index++) {
    const result = await page.request.post(
      `${backend}/api/collections/vehicles/records`,
      {
        headers: auth,
        data: {
          owner: user.id,
          plate: `PAGE${String(index).padStart(3, "0")}`,
          make: "Ford",
          model: "Transit",
          year: 2020,
        },
      },
    );
    expect(result.status()).toBe(200);
    cars.push(await result.json());
  }
  const selection = await Promise.all(
    [cars[0], cars[24]].map((car) =>
      page.request.put("/api/vehicles/default", {
        headers,
        data: { vehicleId: car.id },
      }),
    ),
  );
  expect(selection.every((result) => result.status() === 200)).toBe(true);
  const one = await (await page.request.get("/api/vehicles")).json();
  const two = await (await page.request.get("/api/vehicles?page=2")).json();
  expect(one).toMatchObject({ totalItems: 25, totalPages: 2 });
  expect(one.items).toHaveLength(24);
  expect(two.items).toHaveLength(1);
  expect(
    [...one.items, ...two.items].filter((car) => car.isDefault),
  ).toHaveLength(1);
  await page.goto("/jarmuvek");
  await expect(page.locator(".vehicle-card")).toHaveCount(24);
  await page.getByRole("button", { name: "Következő", exact: true }).click();
  await expect(page.locator(".vehicle-card")).toHaveCount(1);
  await page.getByLabel("Járművek keresése").fill("page 012");
  await page.getByRole("button", { name: "Keresés", exact: true }).click();
  await expect(page.locator(".vehicle-card")).toHaveCount(1);
  await expect(page.locator(".vehicle-card")).toContainText("PAGE012");
});

test("suspended accounts lose vehicle access, and deleting an account also removes its saved cars", async ({
  request,
  playwright,
}) => {
  const { email, user } = await customer(request);
  const saved = await create(request);
  expect(
    (
      await request.put("/api/vehicles/default", {
        headers,
        data: { vehicleId: saved.id },
      })
    ).status(),
  ).toBe(200);
  const auth = await native(request, email);
  const admin = await playwright.request.newContext({ baseURL: origin });
  await login(admin, "admin@fairauto.test");
  expect(
    (
      await admin.patch(`/api/admin/accounts/${user.id}`, {
        headers,
        data: { active: false, adminPassword: password },
      })
    ).status(),
  ).toBe(200);
  expect((await request.get("/api/vehicles")).status()).toBe(401);
  expect(
    (
      await request.get(
        `${backend}/api/collections/vehicles/records/${saved.id}`,
        { headers: auth },
      )
    ).status(),
  ).toBe(404);
  expect(
    (
      await admin.delete(`/api/admin/accounts/${user.id}`, {
        headers,
        data: { confirmEmail: email, adminPassword: password },
      })
    ).status(),
  ).toBe(200);
  expect(
    (
      await admin.patch(`/api/vehicles/${saved.id}`, { headers, data: car })
    ).status(),
  ).toBe(404);
  await admin.dispose();
});

test("changing accounts never shows the previous account's cars while the new garage is loading", async ({
  page,
  playwright,
}) => {
  await customer(page.request);
  await create(page.request, { ...car, model: "Private previous car" });
  const other = await playwright.request.newContext({ baseURL: origin });
  const next = await customer(other);
  expect(
    (
      await other.patch("/api/account", {
        headers,
        data: { name: "Second Driver" },
      })
    ).status(),
  ).toBe(200);
  await page.goto("/attekintes");
  await expect(page.locator(".customer-car-row")).toContainText(
    "Private previous car",
  );
  let release!: () => void;
  const pending = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.route("**/api/vehicles/summary", async (route) => {
    await pending;
    await route.continue();
  });
  await login(page.request, next.email);
  await page.evaluate(() => window.dispatchEvent(new Event("focus")));
  await expect(page.locator(".user-menu")).toContainText("Second Driver");
  await expect(page.locator(".customer-car-row")).not.toContainText(
    "Private previous car",
  );
  release();
  await expect(page.locator(".customer-car-row")).toContainText(
    "Mentsd el a járműved",
  );
  await other.dispose();
});
