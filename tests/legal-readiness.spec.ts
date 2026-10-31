import { test, expect } from "@playwright/test";
import { readFile } from "node:fs/promises";
import { site } from "../content/site";
import { legalSetupIssues } from "../lib/legal";

test("hiding the draft flag cannot hide missing company and operational requirements", () => {
  const altered = { ...site.legal, isDraft: false };
  const issues = legalSetupIssues(altered);
  expect(issues.some((issue) => issue.includes("Székhely"))).toBe(true);
  expect(issues.some((issue) => issue.includes("adatfeldolgozók"))).toBe(true);
  expect(
    legalSetupIssues({
      ...altered,
      bookingModel: "online-service-contract",
    }).some((issue) => issue.includes("szerződéskötési")),
  ).toBe(true);
});

test("consumer notice has working, non-submitting document downloads", async ({
  page,
}) => {
  await page.goto("/fogyasztoi-tajekoztato");
  await expect(
    page.getByRole("heading", { level: 1, name: "Fogyasztói tájékoztató" }),
  ).toBeVisible();
  await expect(page.locator(".legal-article")).toContainText("30 napon");
  await expect(page.locator(".legal-article")).toContainText("20 000 Ft");
  await expect(page.locator(".legal-article")).toContainText("6 hónap");
  for (const label of [
    "Panaszbejelentő minta letöltése (.txt)",
    "Elállási / felmondási nyilatkozatminta letöltése (.txt)",
  ]) {
    const pending = page.waitForEvent("download");
    await page.getByRole("link", { name: label, exact: true }).click();
    const download = await pending;
    const text = await readFile((await download.path())!, "utf8");
    expect(text).toContain(site.legal.companyName);
    expect(text).toContain("letöltés");
  }
  await page.goto("/aszf");
  const pending = page.waitForEvent("download");
  await page
    .getByRole("link", { name: "ÁSZF letöltése szöveges fájlként" })
    .click();
  const download = await pending;
  const text = await readFile((await download.path())!, "utf8");
  expect(text).toContain(site.legal.version);
});

test("public pages load fonts locally and do not initialize a demo account database", async ({
  page,
}) => {
  const external: string[] = [];
  page.on("request", (request) => {
    if (/fonts\.googleapis|fonts\.gstatic/.test(request.url()))
      external.push(request.url());
  });
  await page.goto("/");
  await page.evaluate(() => document.fonts.ready);
  expect(
    await page.evaluate(() => localStorage.getItem("fairauto-prototype-v1")),
  ).toBeNull();
  await page.goto("/impresszum");
  await page.evaluate(() => document.fonts.ready);
  expect(
    await page.evaluate(() => localStorage.getItem("fairauto-prototype-v1")),
  ).toBeNull();
  expect(external).toEqual([]);
  const font = await page.request.get("/fonts/inter-variable.ttf");
  expect(font.ok()).toBe(true);
});

test("registration records explicit terms acceptance without calling it marketing consent", async ({
  page,
}) => {
  await page.goto("/fiok?mode=register");
  await page.getByLabel("Teljes név").fill("Minta Ügyfél");
  await page.getByLabel("E-mail-cím").fill("legal-test@example.com");
  await page.getByLabel("Jelszó").fill("DemoPassword123");
  const terms = page.getByRole("checkbox", { name: /Megértettem/ });
  await expect(terms).not.toBeChecked();
  await terms.check();
  await page.getByRole("button", { name: "Demófiók létrehozása" }).click();
  await expect(
    page.getByRole("heading", { name: "Személyes adatok" }),
  ).toBeVisible();
  const acknowledgement = await page.evaluate(
    () =>
      JSON.parse(localStorage.getItem("fairauto-prototype-v1")!).users.find(
        (u: { email: string }) => u.email === "legal-test@example.com",
      ).legalAcknowledgement,
  );
  expect(acknowledgement.termsVersion).toBe(site.legal.version);
  expect(acknowledgement.privacyNoticeVersion).toBe(site.legal.version);
  expect(acknowledgement.mode).toBe("demo");
  expect(Number.isNaN(Date.parse(acknowledgement.acceptedAt))).toBe(false);
  expect(acknowledgement).not.toHaveProperty("marketingConsent");
});
