import { test, expect } from "@playwright/test";
import { legalNavigation, site, address } from "../content/site";

test("all public footer documents load without an account and link back home", async ({
  page,
}) => {
  for (const doc of legalNavigation) {
    await page.goto("/");
    await page
      .getByRole("contentinfo")
      .getByRole("link", { name: doc.label, exact: true })
      .click();
    await expect(page).toHaveURL(new RegExp(`/${doc.slug}$`));
    await expect(
      page.getByRole("heading", { level: 1, name: doc.label, exact: true }),
    ).toBeVisible();
    await expect(page.locator(".legal-draft")).toHaveCount(0);
    await expect(page.locator(".legal-article")).toBeVisible();
    await page
      .getByRole("link", { name: "Vissza a főoldalra", exact: true })
      .click();
    await expect(page.getByRole("heading", { level: 1 })).toContainText(
      "Jó kezekben.",
    );
  }
});

test("portal footers and the registration form expose the legal documents", async ({
  page,
}) => {
  await page.goto("/attekintes");
  for (const doc of legalNavigation)
    await expect(
      page
        .locator(".app-footer")
        .getByRole("link", { name: doc.label, exact: true }),
    ).toHaveAttribute("href", `/${doc.slug}`);
  await page.goto("/fiok?mode=register");
  await expect(
    page
      .locator(".form-legal-note")
      .getByRole("link", { name: "Adatkezelési Tájékoztató" }),
  ).toHaveAttribute("target", "_blank");
  await expect(
    page
      .locator(".form-legal-note")
      .getByRole("link", { name: "ÁSZF", exact: true }),
  ).toHaveAttribute("href", "/aszf");
});

test("legal pages use configured company details, contents navigation and persistent theme", async ({
  page,
}) => {
  await page.goto("/impresszum");
  await expect(page.locator(".legal-article")).toContainText(
    site.legal.companyName,
  );
  await expect(page.locator(".legal-article")).toContainText(address);
  await expect(page.locator(".legal-article")).toContainText(
    "Kitöltés szükséges az éles használat előtt",
  );
  await page
    .getByRole("navigation", { name: "Tartalomjegyzék" })
    .getByRole("link", { name: /Kapcsolat/ })
    .click();
  await expect(page).toHaveURL(/#elerhetosegek$/);
  await page.getByRole("button", { name: "Sötét téma" }).click();
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  for (const width of [320, 390, 768, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
  }
  await page.goto("/adatkezelesi-tajekoztato");
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await expect(page.locator(".legal-article")).toContainText(
    "helyben szolgálja ki",
  );
  await expect(page.locator(".legal-article")).toContainText("PocketBase");
  await page.goto("/nem-letezo-jogi-oldal");
  await expect(page.getByText("This page could not be found.")).toBeVisible();
});
