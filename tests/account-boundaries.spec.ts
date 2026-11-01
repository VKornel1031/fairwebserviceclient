import { verifyAccount } from "./account-mail-helper";
import { test, expect, request as apiRequest } from "@playwright/test";
const origin = "http://127.0.0.1:3100";
const backend = "http://127.0.0.1:3101";
const password = "Local-integration-only-928374!"; // Disposable local test DB only.

test("the SMTP-free email hook rejects missing auth, forged targets and wrong passwords", async ({
  request,
}) => {
  const raw = await apiRequest.newContext({ baseURL: backend });
  const customer = await raw.post("/api/collections/users/auth-with-password", {
    data: { identity: "partner@fairauto.test", password },
  });
  expect(customer.status()).toBe(200);
  const { token, record } = await customer.json();
  const path = "/api/fairauto/account/email";
  const data = { email: "forged@example.test", password };
  expect((await raw.post(path, { data })).status()).toBe(401);
  expect(
    (
      await raw.post(path, {
        headers: { Authorization: token },
        data: { ...data, password: "wrong-password" },
      })
    ).status(),
  ).toBe(401);
  expect(
    (
      await raw.post(path, {
        headers: { Authorization: token },
        data: { ...data, id: "otheraccount123" },
      })
    ).status(),
  ).toBe(400);
  const session = await request.post("/api/auth/login", {
    headers: { Origin: origin },
    data: { email: record.email, password },
  });
  expect(session.status()).toBe(200);
  expect(
    (await (await request.get("/api/auth/session")).json()).user.email,
  ).toBe(record.email);
  const rootLogin = await raw.post(
    "/api/collections/users/auth-with-password",
    { data: { identity: "admin@fairauto.test", password } },
  );
  const root = (await rootLogin.json()).record;
  expect(
    (
      await raw.get(`/api/collections/users/records/${root.id}`, {
        headers: { Authorization: token },
      })
    ).status(),
  ).toBe(404);
  await raw.dispose();
});

test("native public registration cannot create privileged, preverified or protected accounts", async () => {
  const raw = await apiRequest.newContext({ baseURL: backend });
  const details = {
    name: "Native Registration",
    password,
    passwordConfirm: password,
    active: true,
    emailVerificationRequired: true,
    termsVersion: "test",
    termsAcceptedAt: new Date().toISOString(),
    companyName: "Native Test Kft.",
    companyTax: "12345678-2-19",
  };
  for (const forged of [
    { role: "admin" },
    { role: "manager" },
    { role: "customer" },
    { role: "reception" },
    { role: "partner", verified: true },
    { role: "partner", protectedRoot: true },
    { role: "partner", active: false },
  ]) {
    const result = await raw.post("/api/collections/users/records", {
      data: {
        ...details,
        email: `${crypto.randomUUID()}@example.test`,
        ...forged,
      },
    });
    expect(result.status()).not.toBe(200);
  }
  const result = await raw.post("/api/collections/users/records", {
    data: {
      ...details,
      email: `${crypto.randomUUID()}@example.test`,
      role: "partner",
      "role+": "admin",
    },
  });
  if (result.status() === 200)
    expect((await result.json()).role).toBe("partner");
  else expect([400, 403]).toContain(result.status());
  await raw.dispose();
});

test("deleting an active account and resetting a password invalidate existing sessions", async ({
  request,
  playwright,
}) => {
  const email = `${crypto.randomUUID()}@example.test`;
  await request.post("/api/auth/register", {
    headers: { Origin: origin },
    data: {
      name: "Revocation Check",
      email,
      password,
      passwordConfirm: password,
      acceptTerms: true,
      companyName: "Integration Test Kft.",
      companyTax: "12345678-2-19",
    },
  });
  await verifyAccount(request, email);
  const loggedIn = await request.post("/api/auth/login", {
    headers: { Origin: origin },
    data: { email, password },
  });
  expect(loggedIn.status()).toBe(200);
  const { user } = await loggedIn.json();
  const clone = await playwright.request.newContext({
    baseURL: origin,
    storageState: await request.storageState(),
  });
  const admin = await playwright.request.newContext({ baseURL: origin });
  expect(
    (
      await admin.post("/api/auth/login", {
        headers: { Origin: origin },
        data: { email: "admin@fairauto.test", password },
      })
    ).status(),
  ).toBe(200);
  const replacement = "Admin-reset-password-94857!";
  const reset = await admin.patch(`/api/admin/accounts/${user.id}`, {
    headers: { Origin: origin },
    data: {
      password: replacement,
      passwordConfirm: replacement,
      adminPassword: password,
    },
  });
  expect(reset.status()).toBe(200);
  expect((await (await clone.get("/api/auth/session")).json()).user).toBeNull();
  expect(
    (
      await request.post("/api/auth/login", {
        headers: { Origin: origin },
        data: { email, password: replacement },
      })
    ).status(),
  ).toBe(200);
  expect(
    (
      await admin.delete(`/api/admin/accounts/${user.id}`, {
        headers: { Origin: origin },
        data: { confirmEmail: email, adminPassword: password },
      })
    ).status(),
  ).toBe(200);
  expect(
    (await (await request.get("/api/auth/session")).json()).user,
  ).toBeNull();
  expect(
    (
      await request.patch("/api/account", {
        headers: { Origin: origin },
        data: { name: "Should fail" },
      })
    ).status(),
  ).toBe(401);
  await clone.dispose();
  await admin.dispose();
});
