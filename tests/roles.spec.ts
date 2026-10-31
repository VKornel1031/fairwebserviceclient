import { test, expect, type Page } from "@playwright/test";
import { readFile } from "node:fs/promises";

async function enter(page: Page, name: string) {
  await page.goto("/attekintes");
  await page.getByRole("button", { name: "Demó mód" }).click();
  await page.getByRole("link", { name: new RegExp(`^${name}`) }).click();
  await expect(page).toHaveURL(
    new RegExp(
      name === "Céges partner"
        ? "/partnerek$"
        : name === "Tulajdonos / vezető"
          ? "/vezetes$"
          : "/attekintes$",
    ),
  );
}

test("customers get a small personal dashboard without business or management navigation", async ({
  page,
}) => {
  await enter(page, "Magánügyfél");
  await expect(page.locator(".customer-overview")).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Új időpontfoglalás", exact: true }),
  ).toBeVisible();
  await expect(page.locator(".customer-car-row")).toContainText("ABC-123");
  const nav = page.getByRole("navigation", {
    name: "Fő navigáció",
    exact: true,
  });
  await expect(
    nav.getByRole("link", { name: /Partnerközpont|Vezetői|Műhely/ }),
  ).toHaveCount(0);
  await expect(
    page.locator(".services-section,.hero-card,.management-stats"),
  ).toHaveCount(0);
  await page.goto("/vezetes");
  await expect(
    page.getByRole("heading", { name: "Ez a vezetői munkaterület." }),
  ).toBeVisible();
  await expect(page.locator(".management-bookings")).toHaveCount(0);
});

test("customer overview shows the real next appointment and links to its details", async ({
  page,
}) => {
  await enter(page, "Magánügyfél");
  await page.evaluate(() => {
    const s = JSON.parse(localStorage.getItem("fairauto-prototype-v1")!);
    s.appointments.push({
      ...s.appointments[0],
      id: "FA-CUSTOMER",
      owner: "demo-customer",
      organization: false,
      vehicle: {
        make: "Toyota",
        model: "Corolla",
        year: "2020",
        plate: "CUS-123",
      },
    });
    localStorage.setItem("fairauto-prototype-v1", JSON.stringify(s));
  });
  await page.reload();
  await expect(page.locator(".customer-next")).toContainText("CUS-123");
  await expect(page.locator(".customer-next")).toContainText("Visszaigazolva");
  await page.getByRole("link", { name: "Részletek és módosítás" }).click();
  await expect(page.locator(".appointment-card")).toHaveCount(1);
  await page.getByRole("button", { name: "Részletek" }).click();
  await expect(page.getByRole("dialog")).toContainText("FA-CUSTOMER");
});

test("partners search their fleet and export only their filtered company appointments", async ({
  page,
}) => {
  await enter(page, "Céges partner");
  await expect(page.locator(".vehicle-card")).toHaveCount(2);
  await page.getByLabel("Céges járművek keresése").fill("FLT-102");
  await expect(page.locator(".vehicle-card")).toHaveCount(1);
  await expect(page.locator(".vehicle-card")).toContainText("Transit");
  await page.evaluate(() => {
    const s = JSON.parse(localStorage.getItem("fairauto-prototype-v1")!);
    s.appointments.push({
      ...s.appointments[0],
      id: "FA-PRIVATE-OTHER",
      owner: "other-company",
      contact: { ...s.appointments[0].contact, name: "=SUM(1+1)" },
      vehicle: { ...s.appointments[0].vehicle, plate: "SECRET-999" },
    });
    localStorage.setItem("fairauto-prototype-v1", JSON.stringify(s));
  });
  await page.reload();
  await page
    .getByRole("button", { name: "Céges foglalások", exact: true })
    .click();
  await page.getByLabel("Céges foglalások állapota").selectOption("confirmed");
  await expect(page.locator(".appointment-card")).toHaveCount(1);
  const downloaded = page.waitForEvent("download");
  await page.getByRole("button", { name: "Foglalások exportálása" }).click();
  const file = await downloaded;
  const content = await readFile((await file.path())!, "utf8");
  expect(content).toContain("FLT-101");
  expect(content).not.toContain("SECRET-999");
  await page.getByLabel("Céges foglalások állapota").selectOption("requested");
  await expect(
    page.getByRole("button", { name: "Foglalások exportálása" }),
  ).toBeDisabled();
  await expect(page.locator(".appointment-card")).toHaveCount(0);
  await expect(
    page.getByRole("link", { name: "Vezetői áttekintés", exact: true }),
  ).toHaveCount(0);
});

test("management reports filter, export and open the selected workshop appointment", async ({
  page,
}) => {
  await enter(page, "Tulajdonos / vezető");
  await expect(page).toHaveURL(/\/vezetes$/);
  await expect(page.locator(".management-stats")).toBeVisible();
  await expect(page.locator(".workload-day")).toHaveCount(7);
  await expect(page.locator(".management-bookings tbody tr")).toHaveCount(1);
  await page.getByLabel("Riport keresése").fill("missing");
  await expect(
    page.getByRole("button", { name: "Riport letöltése" }),
  ).toBeDisabled();
  await page.getByLabel("Riport keresése").fill("FLT-101");
  await page.getByLabel("Riport időszaka").selectOption("30");
  const downloaded = page.waitForEvent("download");
  await page.getByRole("button", { name: "Riport letöltése" }).click();
  const file = await downloaded;
  const content = await readFile((await file.path())!, "utf8");
  expect(content).toContain("FA-MINTA01");
  await page.getByRole("link", { name: "FA-MINTA01 megnyitása" }).click();
  await expect(page.getByRole("dialog")).toContainText("FA-MINTA01");
  await expect(
    page.getByRole("button", { name: "Munka indítása" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Munka indítása" }).click();
  await expect(
    page.getByRole("dialog").locator(".status-progress"),
  ).toBeVisible();
});

test("legacy staff sessions move to reception and preserve saved records", async ({
  page,
}) => {
  await page.goto("/attekintes");
  await page.getByRole("button", { name: "Demó mód" }).click();
  await page.getByRole("link", { name: /^Magánügyfél/ }).click();
  await page.evaluate(() => {
    const s = JSON.parse(localStorage.getItem("fairauto-prototype-v1")!);
    s.users = s.users.filter(
      (u: { id: string }) =>
        !["demo-manager", "demo-reception", "demo-admin"].includes(u.id),
    );
    delete s.rolesRevision;
    s.users.push({
      ...s.users[0],
      id: "demo-staff",
      role: "staff",
      name: "Korábbi szerelő",
    });
    s.vehicles.push({
      ...s.vehicles[0],
      id: "preserved-car",
      owner: "demo-staff",
      plate: "KEEP-123",
    });
    s.appointments.push({
      ...s.appointments[0],
      id: "FA-PRESERVED",
      owner: "demo-staff",
      note: "Megőrzendő megjegyzés",
    });
    localStorage.setItem("fairauto-prototype-v1", JSON.stringify(s));
    localStorage.setItem("fairauto-session-v1", "demo-staff");
  });
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "Munkafelvétel, egyszerűen." }),
  ).toBeVisible();
  const saved = await page.evaluate(() => ({
    store: JSON.parse(localStorage.getItem("fairauto-prototype-v1")!),
    session: localStorage.getItem("fairauto-session-v1"),
  }));
  expect(saved.session).toBe("demo-reception");
  expect(
    saved.store.users.map((user: { role: string }) => user.role),
  ).not.toContain("staff");
  expect(saved.store.users).toHaveLength(5);
  expect(saved.store.vehicles).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        id: "preserved-car",
        owner: "demo-reception",
        plate: "KEEP-123",
      }),
    ]),
  );
  expect(saved.store.appointments).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        id: "FA-PRESERVED",
        owner: "demo-reception",
        note: "Megőrzendő megjegyzés",
      }),
      expect.objectContaining({ id: "FA-MINTA01", owner: "demo-partner" }),
    ]),
  );
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "Munkafelvétel, egyszerűen." }),
  ).toBeVisible();
});

test("owner controls the workshop and the remaining workspaces fit mobile", async ({
  page,
}) => {
  await enter(page, "Tulajdonos / vezető");
  await page
    .getByRole("link", { name: "Műhely és naptár", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Zárvatartás kezelése" }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Vezetői áttekintés", exact: true }),
  ).toBeVisible();
  await page
    .getByRole("link", { name: "Vezetői áttekintés", exact: true })
    .click();
  for (const width of [320, 390, 768, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
  }
  await page.getByRole("button", { name: "Demó mód" }).click();
  await page.getByRole("link", { name: /^Céges partner/ }).click();
  await page.setViewportSize({ width: 390, height: 844 });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});

test("demo menu has five profiles and resetting requires confirmation", async ({
  page,
}) => {
  await enter(page, "Céges partner");
  await page.getByRole("button", { name: "Sötét téma" }).click();
  await page.evaluate(() => {
    const store = JSON.parse(localStorage.getItem("fairauto-prototype-v1")!);
    store.vehicles.push({
      ...store.vehicles[0],
      id: "test-car",
      plate: "RESET-123",
    });
    store.users.push({
      ...store.users[0],
      id: "test-account",
      email: "reset@example.com",
    });
    store.appointments.push({ ...store.appointments[0], id: "FA-RESET" });
    store.blockedDates.push("2099-01-05");
    localStorage.setItem("fairauto-prototype-v1", JSON.stringify(store));
    localStorage.setItem("unrelated-setting", "keep");
  });
  await page.reload();
  await page.getByRole("button", { name: "Demó mód" }).click();
  const profiles = page.locator(".demo-options .demo-option");
  await expect(profiles).toHaveCount(5);
  await expect(profiles).toContainText([
    "Magánügyfél",
    "Céges partner",
    "Munkafelvevő",
    "Tulajdonos / vezető",
    "Adminisztrátor",
  ]);
  await page.getByRole("button", { name: "Demó újrakezdése" }).click();
  await page.getByRole("button", { name: "Mégse" }).click();
  expect(
    await page.evaluate(() => localStorage.getItem("fairauto-prototype-v1")),
  ).toContain("RESET-123");
  await page.getByRole("button", { name: "Demó mód" }).click();
  await page.getByRole("button", { name: "Demó újrakezdése" }).click();
  await page
    .getByRole("button", { name: "Mintaadatok visszaállítása" })
    .click();
  await expect(page).toHaveURL(/\/attekintes$/);
  await expect(page.getByRole("dialog")).toHaveCount(0);
  const saved = await page.evaluate(() => ({
    store: JSON.parse(localStorage.getItem("fairauto-prototype-v1")!),
    session: localStorage.getItem("fairauto-session-v1"),
    theme: localStorage.getItem("fairauto-theme"),
    unrelated: localStorage.getItem("unrelated-setting"),
  }));
  expect(saved.store.users).toHaveLength(5);
  expect(saved.store.vehicles).toHaveLength(3);
  expect(saved.store.appointments.map((a: { id: string }) => a.id)).toEqual([
    "FA-MINTA01",
  ]);
  expect(saved.store.blockedDates).toEqual([]);
  expect(saved.session).toBeNull();
  expect(saved.theme).toBe("dark");
  expect(saved.unrelated).toBe("keep");
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await page.getByRole("button", { name: "Demó mód" }).click();
  await page.getByRole("link", { name: /^Tulajdonos \/ vezető/ }).click();
  await expect(page.locator(".management-overview")).toBeVisible();
});
