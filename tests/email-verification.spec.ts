import { test, expect, type APIRequestContext } from "@playwright/test";
import {
  accountMailLink,
  rootHeaders,
  verifyAccount,
} from "./account-mail-helper";
const backend = "http://127.0.0.1:3101",
  origin = "http://127.0.0.1:3100";
const headers = { Origin: origin },
  password = "Local-integration-only-928374!";
async function register(api: APIRequestContext) {
  const email = `${crypto.randomUUID()}@example.test`;
  const response = await api.post("/api/auth/register", {
    headers,
    data: {
      name: "Verification Contact",
      companyName: "Verification Kft.",
      companyTax: "12345678-2-19",
      email,
      password,
      passwordConfirm: password,
      acceptTerms: true,
    },
  });
  expect(response.status()).toBe(202);
  expect((await response.json()).pending).toBe(true);
  return email;
}
async function nativeUser(api: APIRequestContext, email: string) {
  const response = await api.get(`${backend}/api/collections/users/records`, {
    headers: await rootHeaders(api),
    params: { filter: `email = ${JSON.stringify(email)}` },
  });
  expect(response.status()).toBe(200);
  return (await response.json()).items[0];
}

test("new companies must prove their email; opening the link does not confirm or grant staff roles", async ({
  page,
}) => {
  const email = await register(page.request);
  expect(
    (
      await page.request.post("/api/auth/login", {
        headers,
        data: { email, password },
      })
    ).status(),
  ).toBe(401);
  expect(await nativeUser(page.request, email)).toMatchObject({
    verified: false,
    emailVerificationRequired: true,
    role: "partner",
  });
  const mail = await accountMailLink(page.request, email);
  const seen: string[] = [];
  page.on("request", (request) =>
    seen.push(request.url(), request.headers().referer || ""),
  );
  await page.goto(mail.path);
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    "E-mail-cím megerősítése",
  );
  expect(page.url()).not.toContain(mail.token);
  expect((await nativeUser(page.request, email)).verified).toBe(false);
  await page.getByRole("button", { name: "Megerősítés", exact: true }).click();
  await expect(page.getByRole("status")).toContainText("megerősítettük");
  expect(await nativeUser(page.request, email)).toMatchObject({
    verified: true,
    emailVerificationRequired: true,
    role: "partner",
  });
  expect(seen.join("\n")).not.toContain(mail.token);
  const login = await page.request.post("/api/auth/login", {
    headers,
    data: { email, password },
  });
  expect(login.status()).toBe(200);
  const auth = await page.request.post(
    `${backend}/api/collections/users/auth-with-password`,
    { data: { identity: email, password } },
  );
  const nativeHeaders = { Authorization: (await auth.json()).token };
  const user = await nativeUser(page.request, email);
  for (const forged of [
    { role: "admin" },
    { role: "manager" },
    { role: "reception" },
    { emailVerificationRequired: false },
  ])
    expect(
      (
        await page.request.patch(
          `${backend}/api/collections/users/records/${user.id}`,
          { headers: nativeHeaders, data: forged },
        )
      ).status(),
    ).not.toBe(200);
  expect(
    (
      await page.request.patch(
        `${backend}/api/collections/users/records/${user.id}`,
        {
          headers: nativeHeaders,
          data: { email: `bypass-${email}`, oldPassword: password },
        },
      )
    ).status(),
  ).not.toBe(200);
  expect(
    (
      await page.request.post(`${backend}/api/fairauto/account/email`, {
        headers: nativeHeaders,
        data: { email: `bypass-${email}`, password },
      })
    ).status(),
  ).toBe(410);
  await page.goto("/fiok");
  await expect(
    page.getByText("E-mail-cím megerősítve.", { exact: true }),
  ).toBeVisible();
  await page.route(
    "https://fairwebserviceclient.vercel.app/images/fair-logo.png",
    (route) =>
      route.fulfill({
        path: "public/images/fair-logo.png",
        contentType: "image/png",
      }),
  );
  await page.setContent(mail.html);
  await page.setViewportSize({ width: 390, height: 844 });
  const logo = page.getByRole("img", { name: "Fair Autószerviz", exact: true });
  await expect(logo).toHaveAttribute(
    "src",
    "https://fairwebserviceclient.vercel.app/images/fair-logo.png",
  );
  await expect(logo).toBeVisible();
  expect(
    await logo.evaluate((image: HTMLImageElement) => image.naturalWidth),
  ).toBe(1883);
  await expect(
    page.getByRole("link", { name: "E-mail-cím megerősítése", exact: true }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: test.info().outputPath("account-email-mobile.png"),
    fullPage: true,
  });
});

test("reset and verification requests hide account existence; reset tokens revoke sessions and cannot be replayed", async ({
  request,
  playwright,
}) => {
  const email = await register(request);
  await verifyAccount(request, email);
  expect(
    (
      await request.post("/api/auth/login", {
        headers,
        data: { email, password },
      })
    ).status(),
  ).toBe(200);
  const clone = await playwright.request.newContext({
    baseURL: origin,
    storageState: await request.storageState(),
  });
  for (const action of ["resend-verification", "request-password-reset"]) {
    const existing = await request.post(`/api/auth/${action}`, {
      headers,
      data: { email },
    });
    const missing = await request.post(`/api/auth/${action}`, {
      headers,
      data: { email: `${crypto.randomUUID()}@example.test` },
    });
    expect(existing.status()).toBe(202);
    expect(missing.status()).toBe(202);
    expect(await existing.json()).toEqual(await missing.json());
  }
  const mail = await accountMailLink(request, email, "reset");
  const secret = "New-secure-passphrase-984783!";
  const data = { token: mail.token, password: secret, passwordConfirm: secret };
  expect(
    (
      await request.post("/api/auth/confirm-password-reset", {
        headers: { Origin: "https://attacker.invalid" },
        data,
      })
    ).status(),
  ).toBe(403);
  expect(
    (
      await request.post("/api/auth/confirm-password-reset", { headers, data })
    ).status(),
  ).toBe(200);
  expect((await (await clone.get("/api/auth/session")).json()).user).toBeNull();
  expect(
    (
      await request.post("/api/auth/login", {
        headers,
        data: { email, password },
      })
    ).status(),
  ).toBe(401);
  expect(
    (
      await request.post("/api/auth/login", {
        headers,
        data: { email, password: secret },
      })
    ).status(),
  ).toBe(200);
  expect(
    (
      await request.post("/api/auth/confirm-password-reset", { headers, data })
    ).status(),
  ).toBe(400);
  expect((await nativeUser(request, email)).role).toBe("partner");
  await clone.dispose();
});

test("confirmation rejects malformed or wrong-purpose tokens and preserves legacy admin access", async ({
  request,
}) => {
  const email = await register(request),
    mail = await accountMailLink(request, email);
  expect(
    (
      await request.post("/api/auth/confirm-password-reset", {
        headers,
        data: { token: mail.token, password, passwordConfirm: password },
      })
    ).status(),
  ).toBe(400);
  expect(
    (
      await request.post("/api/auth/confirm-verification", {
        headers,
        data: { token: "not-a-valid-token" },
      })
    ).status(),
  ).toBe(400);
  expect((await nativeUser(request, email)).verified).toBe(false);
  await verifyAccount(request, email);
  const admin = await request.post("/api/auth/login", {
    headers,
    data: { email: "admin@fairauto.test", password },
  });
  expect(admin.status()).toBe(200);
  expect((await admin.json()).user).toMatchObject({
    role: "admin",
    emailVerificationRequired: false,
    verified: false,
  });
});
