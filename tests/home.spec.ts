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
    .getByRole("button", { name: /Műszaki vizsga Felkészítés/ })
    .click();
  await page.getByRole("button", { name: "Tovább az időpontokhoz" }).click();
  await expect(
    page.getByRole("heading", { name: "Mikor találkozzunk?" }),
  ).toBeVisible();
  expect(errors).toEqual([]);
});

test("quiet account and partner links still reach their working flows", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("link", { name: "Saját fiók létrehozása" }).click();
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
  await page.getByRole("button", { name: "Partnerdemó kipróbálása" }).click();
  await page.goto("/");
  await page.getByRole("link", { name: "Saját portálom" }).click();
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
