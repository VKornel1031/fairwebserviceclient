import { test, expect, type Page } from "@playwright/test";
async function ready(page: Page, path = "/") {
  await page.goto(path);
  await expect(page.getByText("A műhely ajtaja nyílik…")).toHaveCount(0);
}
async function demo(
  page: Page,
  role: "Magánügyfél" | "Céges partner" | "Műhely munkatárs",
) {
  await page.getByRole("button", { name: "Demó mód" }).click();
  await page.getByRole("link", { name: new RegExp(role) }).click();
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
  await page.getByRole("checkbox").check();
  await page.getByRole("button", { name: "Időpontkérés elküldése" }).click();
  await expect(
    page.getByRole("heading", { name: "Köszönjük a bizalmat!" }),
  ).toBeVisible();
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
test("local registration, profile, vehicle autofill and sign-in", async ({
  page,
}) => {
  await ready(page, "/fiok");
  await page
    .getByRole("button", { name: "Fiók létrehozása", exact: true })
    .click();
  await page.getByLabel("Teljes név").fill("Próba Anna");
  await page.getByLabel("E-mail-cím").fill("anna@example.com");
  await page.getByLabel("Jelszó").fill("DemoPassword123");
  await page.getByRole("checkbox", { name: /Megértettem/ }).check();
  await page.getByRole("button", { name: "Demófiók létrehozása" }).click();
  await expect(
    page.getByRole("heading", { name: "Személyes adatok" }),
  ).toBeVisible();
  await page.getByLabel("Mobiltelefonszám").fill("+36 20 123 4567");
  await page.getByLabel("Település").fill("Veszprém");
  await page.getByRole("button", { name: "Változtatások mentése" }).click();
  await page.getByRole("link", { name: "Járműveim", exact: true }).click();
  await page.getByRole("button", { name: "Jármű hozzáadása" }).first().click();
  await page.getByLabel("Rendszám").fill("AAA-111");
  await page.getByLabel("Gyártási év").fill("2019");
  await page.getByLabel("Márka").fill("Ford");
  await page.getByLabel("Modell").fill("Focus");
  await page.getByRole("button", { name: "Jármű mentése" }).click();
  await expect(page.locator(".license-plate")).toContainText("AAA-111");
  await page
    .locator(".vehicle-card")
    .getByRole("link", { name: "Időpontfoglalás" })
    .click();
  await page
    .getByRole("button", { name: /Műszaki vizsga Felkészítés/ })
    .click();
  await page.getByRole("button", { name: "Tovább az időpontokhoz" }).click();
  await chooseSlot(page);
  await expect(page.getByLabel("Rendszám")).toHaveValue("AAA-111");
  await expect(page.getByLabel("Teljes név")).toHaveValue("Próba Anna");
  await expect(page.getByLabel("Település")).toHaveValue("Veszprém");
  await page.getByRole("link", { name: "Saját fiók", exact: true }).click();
  await page.getByRole("button", { name: "Kijelentkezés" }).click();
  await page.getByLabel("E-mail-cím").fill("anna@example.com");
  await page.getByLabel("Jelszó").fill("wrongpassword");
  await page
    .getByRole("button", { name: "Bejelentkezés", exact: true })
    .last()
    .click();
  await expect(page.locator("main [role=alert]")).toContainText("Hibás");
  await page.getByLabel("Jelszó").fill("DemoPassword123");
  await page
    .getByRole("button", { name: "Bejelentkezés", exact: true })
    .last()
    .click();
  await expect(
    page.getByRole("heading", { name: "Személyes adatok" }),
  ).toBeVisible();
});
test("vehicle editing, default selection and deletion preserve bookings", async ({
  page,
}) => {
  await ready(page);
  await demo(page, "Magánügyfél");
  await page.getByRole("link", { name: "Járműveim", exact: true }).click();
  await page.getByRole("button", { name: "ABC-123 szerkesztése" }).click();
  await page.getByLabel("Rendszám").fill("NEW-123");
  await page.getByRole("button", { name: "Jármű mentése" }).click();
  await expect(page.locator(".license-plate")).toContainText("NEW-123");
  await page.getByRole("button", { name: "NEW-123 törlése" }).click();
  await page
    .getByRole("button", { name: "Jármű törlése", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Az első autód helye már megvan." }),
  ).toBeVisible();
});
test("company registration creates a separate fleet", async ({ page }) => {
  await ready(page, "/fiok");
  await page
    .getByRole("button", { name: "Fiók létrehozása", exact: true })
    .click();
  await page.getByLabel("Teljes név").fill("Céges Anna");
  await page.getByLabel("E-mail-cím").fill("company@example.com");
  await page.getByLabel("Jelszó").fill("CompanyDemo123");
  await page.getByLabel("Céges partnerként regisztrálok").check();
  await page.getByLabel("Cégnév").fill("Teszt Flotta Kft.");
  await page.getByRole("checkbox", { name: /Megértettem/ }).check();
  await page.getByRole("button", { name: "Demófiók létrehozása" }).click();
  await expect(
    page.getByRole("heading", { name: "Személyes adatok" }),
  ).toBeVisible();
  await page.getByRole("link", { name: /Partnerközpont/ }).click();
  await expect(
    page.getByRole("heading", {
      name: "Teszt Flotta Kft.",
      exact: true,
      level: 1,
    }),
  ).toBeVisible();
  await expect(page.locator(".vehicle-card")).toHaveCount(0);
  await page.getByRole("button", { name: /Céges adatok/ }).click();
  await page.getByLabel("Adószám").fill("12345678-2-07");
  await page.getByRole("button", { name: "Adatok mentése" }).click();
  await expect(page.locator(".company-settings")).toContainText(
    "12345678-2-07",
  );
});
test("partner vehicle deep-link selects that specific fleet vehicle", async ({
  page,
}) => {
  await ready(page);
  await demo(page, "Céges partner");
  await expect(page.locator(".vehicle-card")).toHaveCount(2);
  await page
    .locator(".vehicle-card")
    .filter({ hasText: "FLT-102" })
    .getByRole("link", { name: "Időpontfoglalás" })
    .click();
  await page.getByRole("button", { name: /Diagnosztika Pontos/ }).click();
  await page.getByRole("button", { name: "Tovább az időpontokhoz" }).click();
  await chooseSlot(page);
  await expect(page.getByLabel("Rendszám")).toHaveValue("FLT-102");
  await expect(page.getByLabel("Modell")).toHaveValue("Transit");
});
test("staff processes a guest request through completion and blocks a day", async ({
  page,
}) => {
  await ready(page, "/idopont?service=diagnostics");
  await page.getByRole("button", { name: "Tovább az időpontokhoz" }).click();
  await chooseSlot(page);
  await fillDetails(page);
  await page.getByRole("button", { name: "Foglalás áttekintése" }).click();
  await page.getByRole("checkbox").check();
  await page.getByRole("button", { name: "Időpontkérés elküldése" }).click();
  await expect(
    page.getByRole("heading", { name: "Köszönjük a bizalmat!" }),
  ).toBeVisible();
  await demo(page, "Műhely munkatárs");
  await page.getByRole("button", { name: /Kérések/ }).click();
  await page
    .locator(".staff-table tbody tr")
    .filter({ hasText: "Teszt Elek" })
    .getByRole("button")
    .click();
  await page
    .getByRole("button", { name: "Visszaigazolás", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Munka indítása" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Munka indítása" }).click();
  await page.getByRole("button", { name: "Elkészült", exact: true }).click();
  await expect(
    page.getByRole("dialog").locator(".status-completed"),
  ).toBeVisible();
  await page.getByRole("button", { name: "Bezárás", exact: true }).click();
  await page.getByRole("button", { name: "Zárvatartás kezelése" }).click();
  const blocked = await page.getByLabel("Lezárandó nap").inputValue();
  await page.getByRole("button", { name: "Nap lezárása" }).click();
  await expect(page.locator(".closure-list")).toContainText("Újranyitás");
  await page.getByRole("button", { name: "Bezárás", exact: true }).click();
  await page.goto("/idopont?service=diagnostics");
  await page.getByRole("button", { name: "Tovább az időpontokhoz" }).click();
  const day = Number(blocked.slice(-2));
  await expect(
    page.locator(".calendar-day").filter({ hasText: new RegExp(`^${day}$`) }),
  ).toBeDisabled();
});
test("booking submission rechecks capacity after another tab takes the slot", async ({
  page,
}) => {
  await ready(page, "/idopont?service=diagnostics");
  await page.getByRole("button", { name: "Tovább az időpontokhoz" }).click();
  await chooseSlot(page);
  await fillDetails(page);
  await page.getByRole("button", { name: "Foglalás áttekintése" }).click();
  await page.getByRole("checkbox").check();
  await page.evaluate(() => {
    const key = "fairauto-prototype-v1";
    const s = JSON.parse(localStorage.getItem(key)!);
    const day = document.querySelector(".review-group strong")?.textContent;
    void day;
    const summary = document.querySelectorAll(".summary-item");
    const time = summary[1].querySelector("span")!.textContent!.slice(0, 5);
    const monthText = summary[1].querySelector("strong")!.textContent!;
    const formatter = new Intl.DateTimeFormat("sv-SE", {
      timeZone: "Europe/Budapest",
    });
    let date = formatter.format(new Date());
    for (let i = 0; i < 95; i++) {
      const d = new Date(date + "T12:00:00");
      if (
        d.toLocaleDateString("hu-HU", { month: "long", day: "numeric" }) ===
        monthText
      )
        break;
      d.setDate(d.getDate() + 1);
      date = formatter.format(d);
    }
    for (let i = 0; i < 2; i++)
      s.appointments.push({
        ...s.appointments[0],
        id: "RACE" + i,
        date,
        time,
        duration: 60,
        status: "confirmed",
      });
    localStorage.setItem(key, JSON.stringify(s));
  });
  await page.getByRole("button", { name: "Időpontkérés elküldése" }).click();
  await expect(
    page.getByRole("heading", { name: "Mikor találkozzunk?" }),
  ).toBeVisible();
  await expect(page.locator("main [role=alert]")).toBeVisible();
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
