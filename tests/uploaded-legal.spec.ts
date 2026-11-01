import { test, expect } from "@playwright/test";
import { readFile } from "node:fs/promises";
import { site } from "../content/site";

test("provided legal documents have styled pages, current company details and matching editable downloads", async ({
  page,
}) => {
  for (const [slug, label] of [
    ["adatkezelesi-tajekoztato", "Adatkezelési Tájékoztató"],
    [
      "adatvedelmi-es-adatbiztonsagi-szabalyzat",
      "Adatvédelmi és adatbiztonsági szabályzat",
    ],
  ]) {
    await page.goto(`/${slug}`);
    await expect(
      page.getByRole("heading", { level: 1, name: label, exact: true }),
    ).toBeVisible();
    const article = page.locator(".legal-article");
    await expect(article).toContainText(site.legal.companyName);
    await expect(article).toContainText("8105 Pétfürdő");
    await expect(article).toContainText("30 nap");
    const pending = page.waitForEvent("download");
    await page
      .getByRole("link", { name: `${label} letöltése (.txt)`, exact: true })
      .click();
    const file = await pending;
    const text = await readFile((await file.path())!, "utf8");
    expect(text).toContain(site.legal.version);
    expect(text).toContain(site.legal.companyName);
    const pendingWord = page.waitForEvent("download");
    await page
      .getByRole("link", {
        name: "Word változat letöltése (.docx)",
        exact: true,
      })
      .click();
    const word = await pendingWord;
    expect(word.suggestedFilename()).toContain(site.legal.version);
    const wordBytes = await readFile((await word.path())!);
    expect(wordBytes.subarray(0, 2).toString()).toBe("PK");
    expect(wordBytes.length).toBeGreaterThan(10000);
    if (slug.includes("szabalyzat")) {
      expect(text).toContain("72 órán");
      expect(text).not.toContain("74 órán");
      expect(text).toContain("nem adhatja meg");
    } else {
      expect(text).toContain("27277777-2-19");
      expect(text).toContain("Google");
      expect(text).toContain("főszabály szerint egy hónapon");
    }
    for (const width of [320, 390, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      ).toBe(true);
    }
    await page.screenshot({
      path: test.info().outputPath(`${slug}-desktop.png`),
      fullPage: false,
    });
  }
  expect((await page.request.get("/dokumentumok/unknown.txt")).status()).toBe(
    404,
  );
  expect(
    (
      await page.request.get(
        "/dokumentumok/adatkezelesi-tajekoztato.original.docx",
      )
    ).status(),
  ).toBe(404);
});
