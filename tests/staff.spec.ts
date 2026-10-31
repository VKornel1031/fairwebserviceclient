import { test, expect, type Page } from "@playwright/test";

async function enter(page: Page, role: string) {
  await page.goto("/attekintes");
  await page.getByRole("button", { name: "Demó mód" }).click();
  await page.getByRole("link", { name: new RegExp(`^${role}`) }).click();
  const route: Record<string, string> = {
    Adminisztrátor: "/admin",
    Munkafelvevő: "/munkafelvetel",
    "Tulajdonos / vezető": "/vezetes",
  };
  await expect(page).toHaveURL(new RegExp(`${route[role]}$`));
  await expect(page.getByText("A műhely ajtaja nyílik…")).toHaveCount(0);
}
async function slot(page: Page, index = 0) {
  await page.locator(".calendar-day:not([disabled])").first().click();
  await page.locator(".time-grid button:not([disabled])").nth(index).click();
  await page.getByRole("button", { name: "Tovább az adatokhoz" }).click();
}

test("reception creates, confirms, reschedules and cancels a customer request without workshop privileges", async ({
  page,
}) => {
  await enter(page, "Munkafelvevő");
  await expect(page).toHaveURL(/\/munkafelvetel$/);
  await expect(
    page.getByRole("heading", { name: "Munkafelvétel, egyszerűen." }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Műhely és naptár", exact: true }),
  ).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "Zárvatartás kezelése" }),
  ).toHaveCount(0);
  await page
    .locator(".page-heading")
    .getByRole("link", { name: "Új időpont felvétele" })
    .click();
  await page.getByRole("button", { name: /Diagnosztika Pontos/ }).click();
  await page.getByRole("button", { name: "Tovább az időpontokhoz" }).click();
  await slot(page);
  await expect(page.getByLabel("Teljes név")).toHaveValue("");
  for (const [label, value] of Object.entries({
    "Teljes név": "Ügyfél Minta",
    Mobiltelefonszám: "+36 30 123 4567",
    "E-mail-cím": "intake@example.com",
    Település: "Székesfehérvár",
    Rendszám: "INT-123",
    "Gyártási év": "2020",
    Márka: "Toyota",
    Modell: "Corolla",
  }))
    await page.getByLabel(label).fill(value);
  await page.getByRole("button", { name: "Foglalás áttekintése" }).click();
  await page.getByRole("checkbox").check();
  await page.getByRole("button", { name: "Időpontkérés elküldése" }).click();
  await expect(
    page.getByRole("heading", {
      name: "Az ügyfél időpontkérését rögzítettük.",
    }),
  ).toBeVisible();
  await page.getByRole("link", { name: "Időpontkezelés megnyitása" }).click();
  await expect(page.getByRole("dialog")).toContainText("Ügyfél Minta");
  await expect(
    page.getByRole("dialog").locator(".status-requested"),
  ).toContainText("Telefonos egyeztetésre vár");
  await expect(
    page.getByRole("dialog").getByRole("link", { name: "intake@example.com" }),
  ).toHaveAttribute("href", "mailto:intake@example.com");
  await page
    .getByRole("button", { name: "Visszaigazolás", exact: true })
    .click();
  await expect(
    page.getByRole("dialog").locator(".status-confirmed"),
  ).toBeVisible();
  await expect(page.getByRole("dialog")).toContainText(
    "Telefonon visszaigazolva:",
  );
  await expect(page.getByRole("dialog")).toContainText("Fair munkafelvevő");
  await expect(
    page.getByRole("button", { name: "Munka indítása" }),
  ).toHaveCount(0);
  await page.getByRole("link", { name: "Új időpont egyeztetése" }).click();
  await slot(page, 1);
  await expect(page.getByLabel("Teljes név")).toHaveValue("Ügyfél Minta");
  await page.getByRole("button", { name: "Foglalás áttekintése" }).click();
  await page.getByRole("checkbox").check();
  await page.getByRole("button", { name: "Új időpont kérése" }).click();
  await expect(
    page.getByRole("heading", {
      name: "Az ügyfél időpontkérését rögzítettük.",
    }),
  ).toBeVisible();
  const requests = await page.evaluate(() =>
    JSON.parse(
      localStorage.getItem("fairauto-prototype-v1")!,
    ).appointments.filter(
      (appointment: { contact: { email: string } }) =>
        appointment.contact.email === "intake@example.com",
    ),
  );
  expect(requests).toHaveLength(1);
  expect(requests[0].owner).toBeNull();
  expect(requests[0].status).toBe("requested");
  expect(requests[0].confirmation).toBeUndefined();
  await page.getByRole("link", { name: "Időpontkezelés megnyitása" }).click();
  await page.getByRole("button", { name: "Lemondás / elutasítás" }).click();
  await expect(
    page.getByRole("dialog").locator(".status-cancelled"),
  ).toBeVisible();
  await page.goto("/muhely");
  await expect(
    page.getByRole("heading", { name: "Ez a vezetői műhelynézet." }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Zárvatartás kezelése" }),
  ).toHaveCount(0);
  await page.goto("/vezetes");
  await expect(page.locator(".management-stats")).toHaveCount(0);
  await page.goto("/admin");
  await expect(
    page.getByRole("heading", { name: "Ez az adminisztrátor munkaterülete." }),
  ).toBeVisible();
  await page.goto("/attekintes");
  for (const width of [320, 390, 768, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
  }
});

test("admin manages accounts and opens created profiles without a password", async ({
  page,
}) => {
  await enter(page, "Adminisztrátor");
  await expect(page).toHaveURL(/\/admin$/);
  await page.getByRole("button", { name: "Új fiók", exact: true }).click();
  await page.getByLabel("Teljes név").fill("Új Ügyfél");
  await page.getByLabel("E-mail-cím").fill("created@example.com");
  await expect(page.locator('input[type="password"]')).toHaveCount(0);
  await page.getByRole("button", { name: "Fiók mentése" }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await page
    .getByRole("button", {
      name: "created@example.com szerkesztése",
      exact: true,
    })
    .click();
  await page.getByLabel("Szerepkör", { exact: true }).selectOption("reception");
  await page.getByLabel("Teljes név").fill("Új Munkafelvevő");
  await page.getByRole("button", { name: "Fiók mentése" }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await page
    .getByRole("button", {
      name: "created@example.com profiljának kipróbálása",
      exact: true,
    })
    .click();
  await expect(
    page.getByRole("heading", { name: "Munkafelvétel, egyszerűen." }),
  ).toBeVisible();
  await enter(page, "Adminisztrátor");
  await expect(
    page.getByRole("button", {
      name: "admin@example.com törlése",
      exact: true,
    }),
  ).toBeDisabled();
  await page
    .getByRole("button", { name: "created@example.com törlése", exact: true })
    .click();
  await page.getByRole("button", { name: "Mégse", exact: true }).click();
  await expect(
    page.getByRole("button", {
      name: "created@example.com szerkesztése",
      exact: true,
    }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "created@example.com törlése", exact: true })
    .click();
  await page.getByRole("button", { name: "Fiók végleges törlése" }).click();
  await expect(
    page.getByRole("button", {
      name: "created@example.com szerkesztése",
      exact: true,
    }),
  ).toHaveCount(0);
  await page
    .getByRole("button", { name: "partner@example.com törlése", exact: true })
    .click();
  await page.getByRole("button", { name: "Fiók végleges törlése" }).click();
  await expect(
    page.getByRole("button", {
      name: "partner@example.com szerkesztése",
      exact: true,
    }),
  ).toHaveCount(0);
  await page.reload();
  await expect(
    page.getByRole("button", {
      name: "partner@example.com szerkesztése",
      exact: true,
    }),
  ).toHaveCount(0);
  const saved = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("fairauto-prototype-v1")!),
  );
  expect(
    saved.users.some(
      (account: { email: string }) => account.email === "created@example.com",
    ),
  ).toBe(false);
  expect(
    saved.vehicles.some(
      (vehicle: { owner: string }) => vehicle.owner === "demo-partner",
    ),
  ).toBe(false);
  expect(saved.appointments[0]).toMatchObject({
    id: "FA-MINTA01",
    owner: null,
    vehicle: { plate: "FLT-101" },
  });
  for (const [url, expected] of [
    ["/munkafelvetel", "Munkafelvétel, egyszerűen."],
    ["/muhely", "Jó munkát, jó napot!"],
  ]) {
    await page.goto(url);
    await expect(page.getByRole("heading", { name: expected })).toBeVisible();
  }
  await page.goto("/vezetes");
  await expect(page.locator(".management-stats")).toBeVisible();
  await enter(page, "Tulajdonos / vezető");
  await page.goto("/admin");
  await expect(
    page.getByRole("heading", { name: "Ez az adminisztrátor munkaterülete." }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Új fiók", exact: true }),
  ).toHaveCount(0);
});
