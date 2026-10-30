import { test, expect } from "@playwright/test";

test("welcome page leads guests into booking and service-specific requests", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "Jó kezekben.Már az elsőidőponttól.",
  );
  await expect(page.locator(".sidebar")).toHaveCount(0);
  await expect(
    page.getByText("Vendégként is foglalhatsz. Regisztráció nélkül."),
  ).toBeVisible();
  await page
    .getByRole("link", { name: "Időpontot foglalok", exact: true })
    .click();
  await expect(page).toHaveURL(/\/idopont$/);
  await expect(
    page.getByRole("heading", { name: "Miben segíthetünk?" }),
  ).toBeVisible();
  await page.goto("/");
  await page
    .locator(".home-service-card")
    .filter({ hasText: "Műszaki vizsga" })
    .click();
  await expect(page).toHaveURL(/service=inspection/);
  await expect(
    page.getByRole("button", { name: /Műszaki vizsga Felkészítés/ }),
  ).toHaveAttribute("aria-pressed", "true");
  expect(errors).toEqual([]);
});

test("quick booking uses current availability and carries the chosen time into the calendar", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page.getByLabel("Miben segíthetünk?")).toBeEnabled();
  await page.getByLabel("Miben segíthetünk?").selectOption("diagnostics");
  const slot = page.locator(".home-quick-times button").last();
  const chosenTime = (await slot.textContent())!.trim();
  await slot.click();
  await expect(slot).toHaveAttribute("aria-pressed", "true");
  const href = await page.locator(".home-quick-cta").getAttribute("href");
  const date = new URL(href!, "http://localhost").searchParams.get("date")!;
  await page.locator(".home-quick-cta").click();
  await expect(page).toHaveURL(/service=diagnostics/);
  await page.getByRole("button", { name: "Tovább az időpontokhoz" }).click();
  await expect(page.locator(".time-grid button[aria-pressed=true]")).toHaveText(
    chosenTime,
  );
  await expect(page.locator(".calendar-day[aria-pressed=true]")).toHaveText(
    String(Number(date.slice(-2))),
  );
});

test("account and partner invitations open their working flows", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("link", { name: "Saját fiókot hozok létre" }).click();
  await expect(page).toHaveURL(/\/fiok\?mode=register$/);
  await expect(
    page.getByRole("heading", { name: "Ismerjük meg egymást." }),
  ).toBeVisible();
  await expect(page.getByLabel("Teljes név")).toBeVisible();
  await page.goto("/");
  await page.getByRole("link", { name: "Megnézem a partnerközpontot" }).click();
  await expect(
    page.getByRole("heading", { name: "A flottád is jó kezekben." }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Partnerdemó kipróbálása" }).click();
  await page.goto("/");
  await page.getByRole("link", { name: "Saját portálom" }).click();
  await expect(page).toHaveURL(/\/attekintes$/);
  await page.getByRole("link", { name: "Fair Autószerviz – főoldal" }).click();
  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    "Jó kezekben.",
  );
});

test("homepage FAQ, mobile navigation and theme work without horizontal scrolling", async ({
  page,
}) => {
  await page.goto("/");
  for (const width of [320, 390, 768, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole("button", { name: "Menü megnyitása" }).click();
  await expect(
    page.getByRole("navigation", { name: "Főoldal navigáció" }),
  ).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(
    page.getByRole("button", { name: "Menü megnyitása" }),
  ).toBeFocused();
  await expect(
    page.getByRole("navigation", { name: "Főoldal navigáció" }),
  ).toBeHidden();
  await page.getByRole("button", { name: "Menü megnyitása" }).click();
  await page
    .getByRole("link", { name: "Hogyan működik?", exact: true })
    .click();
  await expect(page).toHaveURL(/#hogyan-mukodik$/);
  await expect(
    page.getByRole("navigation", { name: "Főoldal navigáció" }),
  ).toBeHidden();
  await page.getByText("Fiók nélkül is foglalhatok?", { exact: true }).click();
  await expect(page.locator("details[open]")).toContainText("Igen.");
  await page.getByRole("button", { name: "Sötét téma" }).click();
  await page.getByRole("link", { name: "Ügyfélportál megnyitása" }).click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await expect(
    page.getByRole("button", { name: "Világos téma" }),
  ).toBeVisible();
});
