import { test, expect } from "@playwright/test";

test("the welcome page takes a guest into the complete booking flow", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    "Jó kezekben.",
  );
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
  await page
    .getByRole("button", { name: /Diagnosztika Pontos hibafeltárás/ })
    .click();
  await page.getByRole("button", { name: "Tovább az időpontokhoz" }).click();
  await expect(
    page.getByRole("heading", { name: "Mikor találkozzunk?" }),
  ).toBeVisible();
  expect(errors).toEqual([]);
});

test("inspection is phone-only with both call links and tire service is absent", async ({
  page,
}) => {
  await page.goto("/idopont?service=inspection");
  const card = page.getByRole("group", {
    name: "Műszaki vizsga – telefonos időpontegyeztetés",
  });
  await expect(card).toBeVisible();
  await expect(
    page.getByRole("button", { name: /Műszaki vizsga/ }),
  ).toHaveCount(0);
  await expect(
    card.getByRole("link", { name: "06 20 347 3705" }),
  ).toHaveAttribute("href", "tel:+36203473705");
  await expect(
    card.getByRole("link", { name: "06 20 405 6299" }),
  ).toHaveAttribute("href", "tel:+36204056299");
  await expect(page.locator(".service-options")).not.toContainText(
    /gumi|futómű/i,
  );
  await card.getByText("Műszaki vizsga", { exact: true }).click();
  await expect(
    page.locator('.service-options button[aria-pressed="true"]'),
  ).toHaveCount(0);
  await page.getByRole("button", { name: "Tovább az időpontokhoz" }).click();
  await expect(page.locator("main").getByRole("alert")).toContainText(
    "Válassz egy szolgáltatást",
  );
  for (const width of [320, 390, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await card.scrollIntoViewIfNeeded();
  await page.screenshot({
    path: test.info().outputPath("phone-inspection-mobile.png"),
  });
});

test("quiet account and partner links still reach their working flows", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("link", { name: "Céges fiók létrehozása" }).click();
  await expect(page).toHaveURL(/\/fiok\?mode=register$/);
  await expect(
    page.getByRole("heading", { name: "Ismerjük meg egymást." }),
  ).toBeVisible();
  await page.goto("/");
  await page
    .getByRole("link", { name: "Céges partnerek", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "A flottád is jó kezekben." }),
  ).toBeVisible();
  await page.getByRole("link", { name: /Céges fiók igénylése/ }).click();
  await expect(page).toHaveURL(/\/fiok\?mode=register$/);
  await page.goto("/");
  await page.getByRole("link", { name: "Bejelentkezés", exact: true }).click();
  await page.goto("/attekintes");
  await expect(page).toHaveURL(/\/attekintes$/);
  await page.getByRole("link", { name: "Fair Autószerviz – főoldal" }).click();
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    "Jó kezekben.",
  );
});

test("steps, responsive layout and persistent theme remain accessible", async ({
  page,
}) => {
  await page.goto("/");
  await page
    .getByRole("link", { name: "Hogyan működik?", exact: true })
    .click();
  await expect(page).toHaveURL(/#hogyan-mukodik$/);
  await expect(
    page.getByRole("heading", { name: "Három lépés. És már várunk." }),
  ).toBeVisible();
  await expect(page.locator(".home-steps li")).toHaveCount(3);
  for (const width of [320, 390, 768, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole("button", { name: "Sötét téma" }).click();
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await page.getByRole("link", { name: "Bejelentkezés", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Világos téma" }),
  ).toBeVisible();
});
