import { test, expect, type Page } from "@playwright/test";
import { site } from "../content/site";
async function ready(page: Page, path = "/attekintes") {
  await page.goto(path);
  await expect(page.getByText("A műhely ajtaja nyílik…")).toHaveCount(0);
}
async function chooseSlot(page: Page) {
  await page.locator(".calendar-day:not([disabled])").first().click();
  await page.locator(".time-grid button:not([disabled])").first().click();
  await page.getByRole("button", { name: "Tovább az adatokhoz" }).click();
}
async function fillDetails(page: Page) {
  await page.getByLabel("Teljes név").fill("Teszt Elek");
  await page.getByLabel("Mobiltelefonszám").fill("+36 30 123 4567");
  await page.getByLabel("E-mail-cím").fill("teszt@example.com");
  await page.getByLabel("Település").fill("Székesfehérvár");
  await page.getByLabel("Rendszám").fill("TST-123");
  await page.getByLabel("Gyártási év").fill("2020");
  await page.getByLabel("Alvázszám (VIN)").fill("WVWZZZ1JZXW000001");
  await page.getByLabel("Márka").fill("Toyota");
  await page.getByLabel("Modell").fill("Corolla");
}
test("guest booking persists, downloads a calendar file, reschedules and cancels", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await ready(page, "/idopont");
  await page.getByRole("button", { name: "Tovább az időpontokhoz" }).click();
  await expect(page.locator("main [role=alert]")).toContainText(
    "Válassz egy szolgáltatást",
  );
  await page.getByRole("button", { name: /Diagnosztika Pontos/ }).click();
  await page.getByRole("button", { name: "Tovább az időpontokhoz" }).click();
  await chooseSlot(page);
  await fillDetails(page);
  await page.getByRole("button", { name: "Foglalás áttekintése" }).click();
  await expect(
    page.getByRole("heading", { name: "Minden a helyén?" }),
  ).toBeVisible();
  await expect(page.locator("form .info-box")).toContainText(
    site.booking.requestNotice,
  );
  await page.getByRole("checkbox").check();
  const created = page.waitForResponse(
    (response) =>
      response.url().endsWith("/api/appointments") &&
      response.request().method() === "POST",
  );
  await page.getByRole("button", { name: "Időpontkérés elküldése" }).click();
  await expect(
    page.getByRole("heading", { name: "Köszönjük a bizalmat!" }),
  ).toBeVisible();
  const request = (await (await created).json()).appointment;
  expect(request.status).toBe("requested");
  expect(request.legalAcknowledgement.termsVersion).toBe(site.legal.version);
  expect(request.legalAcknowledgement.mode).toBe("live");
  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "Naptárba mentés" }).click();
  expect((await download).suggestedFilename()).toMatch(/^FA-.*\.ics$/);
  await page.getByRole("link", { name: "Foglalásaim megtekintése" }).click();
  await expect(page.locator(".appointment-card")).toHaveCount(1);
  await page.reload();
  await expect(page.locator(".appointment-card")).toHaveCount(1);
  await page.getByRole("button", { name: "Részletek" }).click();
  await page.getByRole("link", { name: "Új időpont", exact: true }).click();
  await chooseSlot(page);
  await expect(page.getByLabel("Teljes név")).toHaveValue("Teszt Elek");
  await page.getByRole("button", { name: "Foglalás áttekintése" }).click();
  await page.getByRole("checkbox").check();
  await page.getByRole("button", { name: "Új időpont kérése" }).click();
  await expect(
    page.getByRole("heading", { name: "Az új időpontodat rögzítettük." }),
  ).toBeVisible();
  await page.getByRole("link", { name: "Foglalásaim megtekintése" }).click();
  await page.getByRole("button", { name: "Részletek" }).click();
  await page.getByRole("button", { name: "Lemondás", exact: true }).click();
  await page.getByRole("button", { name: "Időpont lemondása" }).click();
  await expect(page.locator(".status-cancelled")).toBeVisible();
  expect(errors).toEqual([]);
});
test("desktop and mobile navigation, theme and no horizontal overflow", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await ready(page);
  await expect(
    page.getByRole("heading", { name: "Jó kezekben. Jó időben." }),
  ).toBeVisible();
  await page.screenshot({
    path: "test-results/home-desktop.png",
    fullPage: true,
    animations: "disabled",
  });
  await page.getByRole("button", { name: "Sötét téma" }).click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await page.getByRole("button", { name: "Világos téma" }).click();
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({
    path: "test-results/home-mobile.png",
    fullPage: true,
    animations: "disabled",
  });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await page.getByRole("button", { name: "Menü megnyitása" }).click();
  await page
    .getByRole("link", { name: "Időpontfoglalás", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Találjunk időt az autódra." }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
});

test("mobile guest can complete the entire booking form", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await ready(page, "/idopont?service=inspection");
  await page.getByRole("button", { name: "Tovább az időpontokhoz" }).click();
  await chooseSlot(page);
  await fillDetails(page);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.getByRole("button", { name: "Foglalás áttekintése" }).click();
  await page.getByRole("checkbox").check();
  await page.getByRole("button", { name: "Időpontkérés elküldése" }).click();
  await expect(
    page.getByRole("heading", { name: "Köszönjük a bizalmat!" }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});
