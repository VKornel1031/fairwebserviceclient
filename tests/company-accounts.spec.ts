import { verifyAccount } from "./account-mail-helper";
import { test, expect } from "@playwright/test";

const origin = "http://127.0.0.1:3100";
const backend = "http://127.0.0.1:3101";
const password = "Local-integration-only-928374!"; // Disposable database only.
const headers = { Origin: origin };
const company = {
  companyName: "Céges Teszt Kft.",
  companyTax: "12345678-2-19",
};
const details = () => ({
  name: "Company Contact",
  email: `${crypto.randomUUID()}@example.test`,
  password,
  passwordConfirm: password,
  acceptTerms: true,
});

test("migrated personal accounts keep access and admins can suspend them without inventing company details", async ({
  request,
}) => {
  const data = { email: "legacy@fairauto.test", password };
  const login = await request.post("/api/auth/login", { headers, data });
  expect(login.status()).toBe(200);
  const user = (await login.json()).user;
  expect(user).toMatchObject({
    role: "partner",
    companyName: "",
    companyTax: "",
  });
  expect(
    (
      await request.patch("/api/account", { headers, data: { city: "Pákozd" } })
    ).status(),
  ).toBe(200);
  expect(
    (
      await request.post("/api/auth/login", {
        headers,
        data: { email: "admin@fairauto.test", password },
      })
    ).status(),
  ).toBe(200);
  const suspended = await request.patch(`/api/admin/accounts/${user.id}`, {
    headers,
    data: {
      role: "partner",
      companyName: "",
      companyTax: "",
      active: false,
      adminPassword: password,
    },
  });
  expect(suspended.status(), await suspended.text()).toBe(200);
  expect(
    (await request.post("/api/auth/login", { headers, data })).status(),
  ).toBe(401);
});

test("public registration requires company details and creates only a partner", async ({
  request,
}) => {
  for (const invalid of [
    {},
    { companyName: company.companyName },
    { ...company, companyName: "  " },
    { ...company, companyTax: "not-a-tax-number" },
  ]) {
    const result = await request.post("/api/auth/register", {
      headers,
      data: { ...details(), ...invalid },
    });
    expect(result.status()).toBe(400);
  }
  const data = { ...details(), ...company };
  expect(
    (await request.post("/api/auth/register", { headers, data })).status(),
  ).toBe(202);
  await verifyAccount(request, data.email);
  const login = await request.post("/api/auth/login", {
    headers,
    data: { email: data.email, password },
  });
  expect(login.status()).toBe(200);
  expect((await login.json()).user).toMatchObject({
    ...company,
    role: "partner",
    verified: true,
  });
  expect(
    (
      await request.patch("/api/account", { headers, data: { companyTax: "" } })
    ).status(),
  ).toBe(400);
  expect(
    (
      await request.patch("/api/account", {
        headers,
        data: { role: "customer" },
      })
    ).status(),
  ).toBe(400);
});

test("native PocketBase APIs reject personal signups and clearing a partner's company identity", async ({
  playwright,
}) => {
  const api = await playwright.request.newContext({ baseURL: backend });
  const data = {
    ...details(),
    ...company,
    active: true,
    role: "partner",
    emailVerificationRequired: true,
    termsVersion: "test",
    termsAcceptedAt: new Date().toISOString(),
  };
  delete (data as Partial<typeof data>).acceptTerms;
  for (const invalid of [
    { companyTax: "" },
    { companyName: "  " },
    { companyTax: "invalid" },
    { role: "customer" },
    { role: "admin" },
  ]) {
    expect(
      (
        await api.post("/api/collections/users/records", {
          data: { ...data, ...invalid, email: details().email },
        })
      ).status(),
    ).not.toBe(200);
  }
  const result = await api.post("/api/collections/users/records", {
    data: { ...data, companyTax: "12345678219" },
  });
  expect(result.status(), await result.text()).toBe(200);
  const user = await result.json();
  expect(user).toMatchObject({ ...company, role: "partner" });
  await api.post("/api/collections/users/request-verification", {
    data: { email: data.email },
  });
  await verifyAccount(api, data.email);
  const auth = await api.post("/api/collections/users/auth-with-password", {
    data: { identity: data.email, password },
  });
  const authHeaders = { Authorization: (await auth.json()).token };
  for (const change of [
    { companyTax: "" },
    { companyName: " " },
    { companyTax: "invalid" },
  ]) {
    expect(
      (
        await api.patch(`/api/collections/users/records/${user.id}`, {
          headers: authHeaders,
          data: change,
        })
      ).status(),
    ).toBe(400);
  }
  expect(
    (
      await api.patch(`/api/collections/users/records/${user.id}`, {
        headers: authHeaders,
        data: { city: "Veszprém" },
      })
    ).status(),
  ).toBe(200);
  await api.dispose();
});

test("staff accounts need no company tax number and cannot assign the removed role", async ({
  request,
}) => {
  const login = await request.post("/api/auth/login", {
    headers,
    data: { email: "admin@fairauto.test", password },
  });
  expect(login.status()).toBe(200);
  const data = {
    ...details(),
    role: "reception",
    active: true,
    adminPassword: password,
  };
  delete (data as Partial<typeof data>).acceptTerms;
  const created = await request.post("/api/admin/accounts", { headers, data });
  expect(created.status(), await created.text()).toBe(201);
  const user = (await created.json()).user;
  expect(user).toMatchObject({ role: "reception", companyTax: "" });
  expect(
    (
      await request.patch(`/api/admin/accounts/${user.id}`, {
        headers,
        data: { role: "customer", adminPassword: password },
      })
    ).status(),
  ).toBe(400);
  expect(
    (
      await request.patch(`/api/admin/accounts/${user.id}`, {
        headers,
        data: { role: "partner", adminPassword: password },
      })
    ).status(),
  ).toBe(400);
  expect(
    (
      await request.patch(`/api/admin/accounts/${user.id}`, {
        headers,
        data: { ...company, role: "partner", adminPassword: password },
      })
    ).status(),
  ).toBe(200);
});
