import {
  test,
  expect,
  request as playwrightRequest,
  type APIRequestContext,
  type Page,
} from "@playwright/test";
import { site } from "../content/site";

// These credentials belong only to scripts/test-pocketbase.py's disposable loopback database.
const testPassword = "Local-integration-only-928374!";
const origin = "http://127.0.0.1:3100";
const backend = "http://127.0.0.1:3101";
const uniqueEmail = (prefix: string) =>
  `${prefix}-${crypto.randomUUID()}@example.test`;
async function login(
  api: APIRequestContext,
  email: string,
  password = testPassword,
) {
  const result = await api.post("/api/auth/login", {
    headers: { Origin: origin },
    data: { email, password },
  });
  expect(result.status()).toBe(200);
  return (await result.json()).user;
}
async function register(api: APIRequestContext, prefix: string) {
  const email = uniqueEmail(prefix);
  const result = await api.post("/api/auth/register", {
    headers: { Origin: origin },
    data: {
      name: `Account ${prefix}`,
      email,
      password: testPassword,
      passwordConfirm: testPassword,
      acceptTerms: true,
    },
  });
  expect(result.status()).toBe(202);
  const user = await login(api, email);
  return { email, user };
}
async function write(
  api: APIRequestContext,
  path: string,
  data: unknown,
  method = "PATCH",
) {
  return api.fetch(path, { method, headers: { Origin: origin }, data });
}
async function rootToken() {
  const api = await playwrightRequest.newContext({ baseURL: backend });
  const response = await api.post(
    "/api/collections/_superusers/auth-with-password",
    { data: { identity: "root@fairauto.test", password: testPassword } },
  );
  expect(response.status()).toBe(200);
  const { token } = await response.json();
  await api.dispose();
  return token as string;
}
async function loaded(page: Page, path: string) {
  await page.goto(path);
  await expect(page.getByText("A műhely ajtaja nyílik…")).toHaveCount(0);
}

test("successful registration stays successful when its response omits internal fields", async ({
  request,
}) => {
  const email = `minimal-${crypto.randomUUID()}@minimal-response.example.test`;
  const response = await request.post("/api/auth/register", {
    headers: { Origin: origin },
    data: {
      name: "Minimal response account",
      email,
      password: testPassword,
      passwordConfirm: testPassword,
      acceptTerms: true,
    },
  });
  expect(response.status()).toBe(202);
  expect((await response.json()).message).toContain("most bejelentkezhetsz");
  const user = await login(request, email);
  expect(user).toMatchObject({
    email,
    role: "customer",
    active: true,
    setupReady: true,
  });
  expect(
    (await write(request, "/api/account", { city: "Veszprém" })).status(),
  ).toBe(200);
  const session = await (await request.get("/api/auth/session")).json();
  expect(session.user.city).toBe("Veszprém");
  const record = await request.get(
    `${backend}/api/collections/users/records/${user.id}`,
    {
      headers: { Authorization: await rootToken() },
    },
  );
  expect(await record.json()).toMatchObject({
    role: "customer",
    active: true,
    termsVersion: site.legal.version,
  });
});

test("registration, profile persistence and logout use PocketBase without verification or browser tokens", async ({
  page,
}) => {
  const email = uniqueEmail("browser");
  const external: string[] = [];
  page.on("request", (request) => {
    if (
      request.url().startsWith(backend) ||
      request.url().includes("pb.fairautoszervizkft.hu")
    )
      external.push(request.url());
  });
  await loaded(page, "/fiok?mode=register");
  await expect(page.getByRole("button", { name: "Demó mód" })).toHaveCount(0);
  await expect(page.getByRole("combobox")).toHaveCount(0);
  await page.getByLabel("Teljes név").fill("Valódi Fiók Teszt");
  await page.getByLabel(/^E\-mail\-cím(?:\s*\*)?$/).fill(email);
  await page.getByLabel(/^Jelszó(?:\s*\*)?$/).fill(testPassword);
  await page.getByLabel(/^Jelszó\ ismét(?:\s*\*)?$/).fill(testPassword);
  await expect(
    page.getByRole("checkbox", { name: /Elfogadom/ }),
  ).not.toBeChecked();
  await page.getByRole("checkbox", { name: /Elfogadom/ }).check();
  await page.getByRole("button", { name: "Regisztráció", exact: true }).click();
  await expect(page.getByRole("status")).toContainText("most bejelentkezhetsz");
  await page.getByLabel(/^E\-mail\-cím(?:\s*\*)?$/).fill(email);
  await page.getByLabel(/^Jelszó(?:\s*\*)?$/).fill(testPassword);
  await page
    .locator("form")
    .getByRole("button", { name: "Bejelentkezés", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Személyes adatok" }),
  ).toBeVisible();
  await page.getByLabel("Mobiltelefonszám").fill("+36301234567");
  await page.getByLabel(/^Település(?:\s*\*)?$/).fill("Veszprém");
  await page.getByRole("button", { name: "Változtatások mentése" }).click();
  await expect(page.getByRole("status")).toContainText("elmentettük");
  await page.reload();
  await expect(page.getByLabel(/^Település(?:\s*\*)?$/)).toHaveValue(
    "Veszprém",
  );
  const session = await (await page.request.get("/api/auth/session")).json();
  expect(session.user.role).toBe("customer");
  expect(session.user.verified).toBe(false);
  expect(session).not.toHaveProperty("token");
  const cookies = await page.context().cookies();
  expect(
    cookies.find((cookie) => cookie.name === "fairauto_session"),
  ).toMatchObject({ httpOnly: true, sameSite: "Lax", path: "/" });
  expect(await page.evaluate(() => document.cookie)).not.toContain(
    "fairauto_session",
  );
  expect(await page.evaluate(() => JSON.stringify(localStorage))).not.toContain(
    email,
  );
  expect(await page.evaluate(() => JSON.stringify(localStorage))).not.toContain(
    testPassword,
  );
  expect(external).toEqual([]);
  const root = await rootToken();
  const records = await page.request.get(
    `${backend}/api/collections/users/records`,
    {
      headers: { Authorization: root },
      params: { filter: `email = ${JSON.stringify(email)}` },
    },
  );
  const saved = (await records.json()).items[0];
  expect(saved.termsVersion).toBe(site.legal.version);
  expect(Number.isNaN(Date.parse(saved.termsAcceptedAt))).toBe(false);
  expect(saved).not.toHaveProperty("marketingConsent");
  await page.getByRole("button", { name: "Kijelentkezés" }).click();
  await expect(
    page.getByRole("heading", { name: "Jó újra találkozni." }),
  ).toBeVisible();
  expect(
    (await (await page.request.get("/api/auth/session")).json()).user,
  ).toBeNull();
});

test("PocketBase roles determine navigation and URL access; local demo identities cannot grant access", async ({
  page,
}) => {
  const cases = [
    ["customer", "/attekintes", "Járműveim"],
    ["partner", "/partnerek", "Járműpark"],
    ["reception", "/munkafelvetel", "Munkafelvétel"],
    ["manager", "/vezetes", "Vezetői áttekintés"],
    ["admin", "/admin", "Fiókkezelés"],
  ];
  for (const [role, path, label] of cases) {
    await login(page.request, `${role}@fairauto.test`);
    await loaded(page, path);
    await expect(
      page
        .getByRole("navigation", { name: "Fő navigáció" })
        .getByRole("link", { name: label, exact: true }),
    ).toBeVisible();
    await expect(page.getByRole("button", { name: /demó/i })).toHaveCount(0);
    if (role !== "admin")
      expect((await page.request.get("/api/admin/accounts")).status()).toBe(
        403,
      );
    await write(page.request, "/api/auth/logout", {}, "POST");
  }
  await loaded(page, "/fiok");
  await page.evaluate(() =>
    localStorage.setItem("fairauto-session-v1", "demo-admin"),
  );
  await loaded(page, "/admin");
  await expect(
    page.getByRole("heading", { name: "Ez az adminisztrátor munkaterülete." }),
  ).toBeVisible();
  expect((await page.request.get("/api/admin/accounts")).status()).toBe(401);
});

test("admin creates, assigns roles, suspends and deletes accounts; role changes apply to existing sessions", async ({
  page,
  playwright,
}) => {
  const email = uniqueEmail("managed"),
    name = "Kezelt Tesztfiók";
  await login(page.request, "admin@fairauto.test");
  await loaded(page, "/admin");
  await expect(page.getByRole("row", { name: /Test admin/ })).toBeVisible();
  for (const width of [320, 390]) {
    await page.setViewportSize({ width, height: 844 });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
  }
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.getByRole("button", { name: "Új fiók", exact: true }).click();
  const dialog = page.getByRole("dialog");
  await dialog.getByLabel("Teljes név").fill(name);
  await dialog.getByLabel(/^E\-mail\-cím(?:\s*\*)?$/).fill(email);
  await dialog.getByLabel(/^Fiók\ új\ jelszava(?:\s*\*)?$/).fill(testPassword);
  await dialog.getByLabel("Fiók új jelszava ismét").fill(testPassword);
  await dialog.getByLabel("Saját adminjelszavad").fill(testPassword);
  await dialog.getByRole("button", { name: "Fiók mentése" }).click();
  await expect(dialog).toHaveCount(0);
  await expect(page.getByRole("row", { name: new RegExp(name) })).toBeVisible();
  const customer = await playwright.request.newContext({ baseURL: origin });
  const user = await login(customer, email);
  await page.getByRole("button", { name: `${name} szerkesztése` }).click();
  await dialog.getByLabel("Szerepkör").selectOption("reception");
  await dialog.getByLabel("Saját adminjelszavad").fill(testPassword);
  await dialog.getByRole("button", { name: "Fiók mentése" }).click();
  await expect(dialog).toHaveCount(0);
  expect(
    (await (await customer.get("/api/auth/session")).json()).user.role,
  ).toBe("reception");
  await page.getByRole("button", { name: `${name} szerkesztése` }).click();
  await dialog.getByLabel("Aktív fiók").uncheck();
  await dialog.getByLabel("Saját adminjelszavad").fill(testPassword);
  await dialog.getByRole("button", { name: "Fiók mentése" }).click();
  await expect(dialog).toHaveCount(0);
  expect(
    (await (await customer.get("/api/auth/session")).json()).user,
  ).toBeNull();
  const disabledLogin = await write(
    customer,
    "/api/auth/login",
    { email, password: testPassword },
    "POST",
  );
  expect(disabledLogin.status()).toBe(401);
  await page.getByRole("button", { name: `${name} törlése` }).click();
  await dialog.getByLabel("Törlendő fiók e-mail-címe").fill(email);
  await dialog.getByLabel("Saját adminjelszavad").fill(testPassword);
  await dialog.getByRole("button", { name: "Fiók végleges törlése" }).click();
  await expect(dialog).toHaveCount(0);
  await expect(page.getByRole("row", { name: new RegExp(name) })).toHaveCount(
    0,
  );
  expect(
    (
      await write(
        page.request,
        `/api/admin/accounts/${user.id}`,
        { adminPassword: testPassword },
        "DELETE",
      )
    ).status(),
  ).not.toBe(200);
  await customer.dispose();
});

test("self email and password changes require the old password and revoke old password sessions", async ({
  request,
  playwright,
}) => {
  const { email } = await register(request, "credentials");
  const clone = await playwright.request.newContext({
    baseURL: origin,
    storageState: await request.storageState(),
  });
  expect(
    (
      await write(
        request,
        "/api/auth/change-email",
        { email: uniqueEmail("wrong-proof"), password: "wrong-password" },
        "POST",
      )
    ).status(),
  ).toBe(401);
  const updatedEmail = uniqueEmail("new-address");
  expect(
    (
      await write(
        request,
        "/api/auth/change-email",
        { email: updatedEmail, password: testPassword },
        "POST",
      )
    ).status(),
  ).toBe(200);
  const newPassword = "Replacement-passphrase-93847!";
  expect(
    (
      await write(
        request,
        "/api/auth/change-password",
        {
          oldPassword: testPassword,
          password: newPassword,
          passwordConfirm: newPassword,
        },
        "POST",
      )
    ).status(),
  ).toBe(200);
  expect((await (await clone.get("/api/auth/session")).json()).user).toBeNull();
  expect(
    (
      await write(
        request,
        "/api/auth/login",
        { email, password: testPassword },
        "POST",
      )
    ).status(),
  ).toBe(401);
  expect(
    (
      await write(
        request,
        "/api/auth/login",
        { email: updatedEmail, password: testPassword },
        "POST",
      )
    ).status(),
  ).toBe(401);
  await login(request, updatedEmail, newPassword);
  await clone.dispose();
});

test("account APIs reject CSRF, mass assignment, oversized input and non-admin access", async ({
  request,
}) => {
  const identity = uniqueEmail("csrf");
  const payload = { email: identity, password: testPassword };
  expect(
    (
      await request.post("/api/auth/login", {
        headers: { Origin: "https://attacker.example" },
        data: payload,
      })
    ).status(),
  ).toBe(403);
  expect(
    (await request.post("/api/auth/login", { data: payload })).status(),
  ).toBe(403);
  expect(
    (
      await request.post("/api/auth/login", {
        headers: { Origin: origin, "Content-Type": "text/plain" },
        data: JSON.stringify(payload),
      })
    ).status(),
  ).toBe(415);
  expect(
    (
      await write(
        request,
        "/api/auth/login",
        { ...payload, password: "a".repeat(9000) },
        "POST",
      )
    ).status(),
  ).toBe(413);
  expect(
    (
      await write(
        request,
        "/api/auth/register",
        {
          name: "Role Attack",
          ...payload,
          passwordConfirm: testPassword,
          acceptTerms: true,
          role: "admin",
        },
        "POST",
      )
    ).status(),
  ).toBe(400);
  const { user } = await register(request, "self-access");
  for (const change of [
    { role: "admin" },
    { active: false },
    { verified: true },
    { protectedRoot: true },
    { "role+": "admin" },
  ])
    expect((await write(request, "/api/account", change)).status()).toBe(400);
  expect((await request.get("/api/admin/accounts")).status()).toBe(403);
  expect(
    (
      await write(request, `/api/admin/accounts/${user.id}`, {
        role: "admin",
        adminPassword: testPassword,
      })
    ).status(),
  ).toBe(403);
  expect(
    (
      await request.post("/api/auth/request-verification", {
        headers: { Origin: origin },
        data: {},
      })
    ).status(),
  ).toBe(404);
});

test("native PocketBase rules prevent privilege escalation, cross-account reads and protected-root changes", async ({
  request,
}) => {
  const { email, user } = await register(request, "native-rules");
  const raw = await playwrightRequest.newContext({ baseURL: backend });
  const result = await raw.post("/api/collections/users/auth-with-password", {
    data: { identity: email, password: testPassword },
  });
  expect(result.status()).toBe(200);
  const { token } = await result.json();
  const headers = { Authorization: token };
  const path = `/api/collections/users/records/${user.id}`;
  expect(
    (
      await raw.patch(path, { headers, data: { name: "Updated profile" } })
    ).status(),
  ).toBe(200);
  for (const data of [
    { role: "admin" },
    { "role+": "admin" },
    { active: false },
    { protectedRoot: true },
    { verified: true },
    { termsVersion: "forged" },
  ]) {
    const changed = await raw.patch(path, { headers, data });
    if (changed.status() === 200)
      expect((await changed.json()).role).toBe("customer");
    else expect([400, 403, 404]).toContain(changed.status());
  }
  const unchanged = await raw.get(path, { headers });
  expect(await unchanged.json()).toMatchObject({
    role: "customer",
    active: true,
    protectedRoot: false,
    verified: false,
    termsVersion: site.legal.version,
  });
  const listing = await raw.get("/api/collections/users/records", { headers });
  expect(
    (await listing.json()).items.map((record: { id: string }) => record.id),
  ).toEqual([user.id]);
  expect((await raw.delete(path, { headers })).status()).not.toBe(204);
  const root = await login(request, "admin@fairauto.test");
  const created = await write(
    request,
    "/api/admin/accounts",
    {
      name: "Secondary Admin",
      email: uniqueEmail("secondary-admin"),
      password: testPassword,
      passwordConfirm: testPassword,
      role: "admin",
      active: true,
      adminPassword: testPassword,
    },
    "POST",
  );
  expect(created.status()).toBe(201);
  const other = (await created.json()).user;
  await login(request, other.email);
  expect(
    (
      await write(request, `/api/admin/accounts/${root.id}`, {
        role: "customer",
        adminPassword: testPassword,
      })
    ).status(),
  ).toBe(403);
  expect(
    (
      await write(request, `/api/admin/accounts/${other.id}`, {
        role: "customer",
        adminPassword: testPassword,
      })
    ).status(),
  ).toBe(403);
  const directAdmin = await raw.post(
    "/api/collections/users/auth-with-password",
    { data: { identity: other.email, password: testPassword } },
  );
  const adminHeaders = { Authorization: (await directAdmin.json()).token };
  expect(
    (
      await raw.patch(`/api/collections/users/records/${root.id}`, {
        headers: adminHeaders,
        data: {
          password: "Stolen-password-94857!",
          passwordConfirm: "Stolen-password-94857!",
        },
      })
    ).status(),
  ).not.toBe(200);
  expect(
    (
      await raw.delete(`/api/collections/users/records/${root.id}`, {
        headers: adminHeaders,
      })
    ).status(),
  ).not.toBe(204);
  await login(request, "admin@fairauto.test");
  expect(
    (
      await write(request, `/api/admin/accounts/${other.id}`, {
        role: "manager",
        adminPassword: "wrong-proof",
      })
    ).status(),
  ).toBe(401);
  expect(
    (
      await request.get("/api/admin/accounts", {
        params: { q: '\\" || role = "admin" || name ~ "' },
      })
    ).status(),
  ).toBe(200);
  await raw.dispose();
});

test("repeated invalid logins are throttled without exposing account existence", async ({
  request,
}) => {
  const email = uniqueEmail("throttle");
  for (let attempt = 0; attempt < 8; attempt++)
    expect(
      (
        await write(
          request,
          "/api/auth/login",
          { email, password: "invalid" },
          "POST",
        )
      ).status(),
    ).toBe(401);
  expect(
    (
      await write(
        request,
        "/api/auth/login",
        { email, password: "invalid" },
        "POST",
      )
    ).status(),
  ).toBe(429);
});
