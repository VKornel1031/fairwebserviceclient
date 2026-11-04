import { test, expect } from "@playwright/test";

const origin = "http://127.0.0.1:3100";
const password = "Local-integration-only-928374!"; // Disposable loopback database only.

test("admin sidebar navigation preserves the session and never renders customer controls", async ({
  page,
}) => {
  // The integration server compiles routes on first use. Keep its compilation
  // budget separate from the session and authorization assertions below.
  test.setTimeout(90_000);
  expect(
    (
      await page.request.post("/api/auth/login", {
        headers: { Origin: origin },
        data: { email: "admin@fairauto.test", password },
      })
    ).status(),
  ).toBe(200);
  let sessionRequests = 0;
  let release!: () => void;
  const pending = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.route("**/api/auth/session", async (route) => {
    sessionRequests++;
    if (sessionRequests === 1) await pending;
    await route.continue();
  });
  await page.goto("/admin");
  await expect(page.getByText("A műhely ajtaja nyílik…")).toBeVisible();
  await expect(page.locator(".sidebar, .user-menu")).toHaveCount(0);
  release();
  await expect(page.locator(".brand span")).toHaveText("ADMINISZTRÁCIÓ");
  await page.evaluate(() => {
    const audit = { flashes: [] as string[] };
    Object.assign(window, { navigationAudit: audit });
    new MutationObserver(() => {
      if (
        document
          .querySelector(".sidebar")
          ?.textContent?.includes("Járműveim") ||
        document.querySelector(".user-menu")?.textContent?.includes("Vendég") ||
        document.querySelector(".loading")
      )
        audit.flashes.push("Account reset during navigation");
    }).observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true,
    });
  });
  for (const [label, path] of [
    ["Saját fiók", "/fiok"],
    ["Vezetői áttekintés", "/vezetes"],
    ["Munkafelvétel", "/munkafelvetel"],
    ["Új időpont", "/idopont"],
    ["Műhely és naptár", "/muhely"],
    ["Fiókkezelés", "/admin"],
  ]) {
    await page
      .locator(".sidebar")
      .getByRole("link", { name: label, exact: true })
      .click();
    await expect(page).toHaveURL(origin + path, { timeout: 15_000 });
    await expect(page.locator(".brand span")).toHaveText("ADMINISZTRÁCIÓ");
  }
  expect(sessionRequests).toBe(1);
  expect(
    await page.evaluate(
      () =>
        (window as unknown as { navigationAudit: { flashes: string[] } })
          .navigationAudit.flashes,
    ),
  ).toEqual([]);
});
