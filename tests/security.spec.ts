import { test, expect, request as apiRequest } from "@playwright/test";
import { createHash } from "node:crypto";
import { accountMailLink, rootHeaders } from "./account-mail-helper";

const backend = "http://127.0.0.1:3101";
const origin = "http://127.0.0.1:3100";
const password = "Local-integration-only-928374!";

test("native admin mutations require the actor's password, including collection aliases and deletes", async ({
  request,
}) => {
  const root = await rootHeaders(request);
  const schema = await (
    await request.get(`${backend}/api/collections/users`, { headers: root })
  ).json();
  async function seed(role: string) {
    const email = `${crypto.randomUUID()}@example.test`;
    const created = await request.post(
      `${backend}/api/collections/users/records`,
      {
        headers: root,
        data: {
          name: "Admin Proof",
          email,
          password:
            role === "partner" ? "Target-only-password-49387!" : password,
          passwordConfirm:
            role === "partner" ? "Target-only-password-49387!" : password,
          role,
          active: true,
          companyName: "Security Kft.",
          companyTax: "12345678-2-19",
        },
      },
    );
    expect(created.status()).toBe(200);
    return created.json();
  }
  const actor = await seed("admin"),
    target = await seed("partner");
  const login = await request.post(
    `${backend}/api/collections/users/auth-with-password`,
    { data: { identity: actor.email, password } },
  );
  expect(login.status()).toBe(200);
  const headers = { Authorization: (await login.json()).token };
  const create = {
    name: "Native Staff",
    email: `${crypto.randomUUID()}@example.test`,
    password,
    passwordConfirm: password,
    role: "reception",
    active: true,
    emailVerificationRequired: true,
  };
  for (const proof of [{}, { adminPassword: "incorrect" }]) {
    expect(
      (
        await request.post(`${backend}/api/collections/${schema.id}/records`, {
          headers,
          data: { ...create, ...proof },
        })
      ).status(),
    ).toBe(403);
    expect(
      (
        await request.patch(
          `${backend}/api/collections/users/records/${target.id}`,
          { headers, data: { name: "Forged", ...proof } },
        )
      ).status(),
    ).toBe(403);
    expect(
      (
        await request.delete(
          `${backend}/api/collections/${schema.id}/records/${target.id}`,
          { headers, data: proof },
        )
      ).status(),
    ).toBe(403);
  }
  const created = await request.post(
    `${backend}/api/collections/users/records`,
    { headers, data: { ...create, adminPassword: password } },
  );
  expect(created.status(), await created.text()).toBe(200);
  const newUser = await created.json();
  expect(JSON.stringify(newUser)).not.toContain(password);
  const changed = await request.patch(
    `${backend}/api/collections/${schema.id}/records/${target.id}`,
    {
      headers,
      data: { name: "Authorized", active: false, adminPassword: password },
    },
  );
  expect(changed.status(), await changed.text()).toBe(200);
  expect((await changed.json()).name).toBe("Authorized");
  expect(
    (
      await request.delete(
        `${backend}/api/collections/users/records/${newUser.id}`,
        { headers, data: { adminPassword: password } },
      )
    ).status(),
  ).toBe(204);
  expect(
    (
      await request.patch(
        `${backend}/api/collections/users/records/${actor.id}`,
        { headers, data: { city: "Pákozd" } },
      )
    ).status(),
  ).toBe(200);
  for (let attempt = 0; attempt < 8; attempt++)
    expect(
      (
        await request.patch(
          `${backend}/api/collections/users/records/${target.id}`,
          { headers, data: { name: "Forged", adminPassword: "incorrect" } },
        )
      ).status(),
    ).toBe(403);
  expect(
    (
      await request.post(
        `${backend}/api/collections/users/auth-with-password`,
        { data: { identity: actor.email, password } },
      )
    ).status(),
  ).toBe(429);
  expect(
    (
      await (
        await request.get(
          `${backend}/api/collections/users/records/${target.id}`,
          { headers: root },
        )
      ).json()
    ).name,
  ).toBe("Authorized");
});

test("native malformed email-change requests remain errors before any password proof", async ({
  request,
}) => {
  for (const token of [undefined, 123, "invalid", "x".repeat(5000)]) {
    expect(
      (
        await request.post(
          `${backend}/api/collections/users/confirm-email-change`,
          {
            data: { token, password: "incorrect" },
          },
        )
      ).status(),
    ).toBe(400);
  }
});

test("native email confirmation and password updates share the proof limit before password validation", async ({
  request,
}) => {
  const root = await rootHeaders(request);
  async function change() {
    const email = `${crypto.randomUUID()}@example.test`,
      newEmail = `${crypto.randomUUID()}@example.test`;
    const created = await request.post(
      `${backend}/api/collections/users/records`,
      {
        headers: root,
        data: {
          name: "Email Proof",
          email,
          password,
          passwordConfirm: password,
          role: "partner",
          active: true,
          companyName: "Security Kft.",
          companyTax: "12345678-2-19",
        },
      },
    );
    expect(created.status()).toBe(200);
    const user = await created.json();
    const auth = await request.post(
      `${backend}/api/collections/users/auth-with-password`,
      { data: { identity: email, password } },
    );
    expect(auth.status()).toBe(200);
    const headers = { Authorization: (await auth.json()).token };
    expect(
      (
        await request.post(
          `${backend}/api/collections/users/request-email-change`,
          { headers, data: { newEmail } },
        )
      ).status(),
    ).toBe(204);
    const mail = await accountMailLink(request, newEmail, "email");
    return { user, newEmail, headers, token: mail.token };
  }
  const blocked = await change();
  expect(
    (
      await request.post(
        `${backend}/api/collections/users/confirm-email-change`,
        { data: { token: blocked.token, password: "incorrect" } },
      )
    ).status(),
  ).toBe(400);
  for (let attempt = 0; attempt < 7; attempt++)
    expect(
      (
        await request.patch(
          `${backend}/api/collections/users/records/${blocked.user.id}`,
          {
            headers: blocked.headers,
            data: {
              oldPassword: "incorrect",
              password: "Replacement-secret-928374!",
              passwordConfirm: "Replacement-secret-928374!",
            },
          },
        )
      ).status(),
    ).toBe(400);
  expect(
    (
      await request.post(
        `${backend}/api/collections/users/confirm-email-change`,
        { data: { token: blocked.token, password } },
      )
    ).status(),
  ).toBe(429);
  expect(
    (
      await (
        await request.get(
          `${backend}/api/collections/users/records/${blocked.user.id}`,
          { headers: root },
        )
      ).json()
    ).email,
  ).toBe(blocked.user.email);
  const successful = await change();
  expect(
    (
      await request.post(
        `${backend}/api/collections/users/confirm-email-change`,
        { data: { token: successful.token, password: "incorrect" } },
      )
    ).status(),
  ).toBe(400);
  expect(
    (
      await request.post(
        `${backend}/api/collections/users/confirm-email-change`,
        { data: { token: successful.token, password } },
      )
    ).status(),
  ).toBe(204);
  const hash = createHash("sha256")
    .update("password-proof:" + successful.user.id)
    .digest("hex");
  expect(
    (
      await (
        await request.get(
          `${backend}/api/collections/security_limits/records`,
          {
            headers: root,
            params: { filter: `key = ${JSON.stringify(hash)}` },
          },
        )
      ).json()
    ).items,
  ).toEqual([]);
  expect(
    (
      await request.post(
        `${backend}/api/collections/users/auth-with-password`,
        { data: { identity: successful.newEmail, password } },
      )
    ).status(),
  ).toBe(200);
});

test("native password-change proofs have a separate persistent failure limit and clear on success", async ({
  request,
}) => {
  const root = await rootHeaders(request);
  const replacement = "Replacement-password-48573!";
  async function account() {
    const email = `${crypto.randomUUID()}@example.test`;
    const created = await request.post(
      `${backend}/api/collections/users/records`,
      {
        headers: root,
        data: {
          name: "Password Proof",
          email,
          password,
          passwordConfirm: password,
          role: "partner",
          active: true,
          companyName: "Security Kft.",
          companyTax: "12345678-2-19",
        },
      },
    );
    expect(created.status()).toBe(200);
    const user = await created.json();
    const login = await request.post(
      `${backend}/api/collections/users/auth-with-password`,
      { data: { identity: email, password } },
    );
    expect(login.status()).toBe(200);
    return { user, headers: { Authorization: (await login.json()).token } };
  }
  const blocked = await account();
  const payload = {
    oldPassword: "incorrect",
    password: replacement,
    passwordConfirm: replacement,
  };
  for (let attempt = 0; attempt < 8; attempt++)
    expect(
      (
        await request.patch(
          `${backend}/api/collections/users/records/${blocked.user.id}`,
          { headers: blocked.headers, data: payload },
        )
      ).status(),
    ).toBe(400);
  expect(
    (
      await request.patch(
        `${backend}/api/collections/users/records/${blocked.user.id}`,
        {
          headers: blocked.headers,
          data: { ...payload, oldPassword: password },
        },
      )
    ).status(),
  ).toBe(429);
  expect(
    (
      await request.post(
        `${backend}/api/collections/users/auth-with-password`,
        { data: { identity: blocked.user.email, password } },
      )
    ).status(),
  ).toBe(200);
  const successful = await account();
  expect(
    (
      await request.patch(
        `${backend}/api/collections/users/records/${successful.user.id}`,
        { headers: successful.headers, data: payload },
      )
    ).status(),
  ).toBe(400);
  expect(
    (
      await request.patch(
        `${backend}/api/collections/users/records/${successful.user.id}`,
        {
          headers: successful.headers,
          data: { ...payload, oldPassword: password },
        },
      )
    ).status(),
  ).toBe(200);
  const hash = createHash("sha256")
    .update("password-proof:" + successful.user.id)
    .digest("hex");
  const counters = await request.get(
    `${backend}/api/collections/security_limits/records`,
    { headers: root, params: { filter: `key = ${JSON.stringify(hash)}` } },
  );
  expect(counters.status()).toBe(200);
  expect((await counters.json()).items).toEqual([]);
  expect(
    (
      await request.post(
        `${backend}/api/collections/users/auth-with-password`,
        { data: { identity: successful.user.email, password: replacement } },
      )
    ).status(),
  ).toBe(200);
});

test("user password failures cannot lock a same-address superuser out", async ({
  request,
}) => {
  const root = await rootHeaders(request);
  const identity = "root@fairauto.test";
  const created = await request.post(
    `${backend}/api/collections/users/records`,
    {
      headers: root,
      data: {
        name: "Separate Auth Collection",
        email: identity,
        password,
        passwordConfirm: password,
        role: "partner",
        active: true,
        companyName: "Security Kft.",
        companyTax: "12345678-2-19",
      },
    },
  );
  expect(created.status()).toBe(200);
  for (let attempt = 0; attempt < 8; attempt++)
    expect(
      (
        await request.post(
          `${backend}/api/collections/users/auth-with-password`,
          { data: { identity, password: "incorrect" } },
        )
      ).status(),
    ).toBe(400);
  expect(
    (
      await request.post(
        `${backend}/api/collections/users/auth-with-password`,
        { data: { identity, password: "incorrect" } },
      )
    ).status(),
  ).toBe(429);
  expect(
    (
      await request.post(
        `${backend}/api/collections/_superusers/auth-with-password`,
        { data: { identity, password } },
      )
    ).status(),
  ).toBe(200);
});

test("native password limits follow the identity across collection URLs and frontend instances", async ({
  request,
}) => {
  const raw = await apiRequest.newContext({ baseURL: backend });
  try {
    const root = await rootHeaders(request);
    const users = await (
      await request.get(`${backend}/api/collections/users`, { headers: root })
    ).json();
    const identity = `${crypto.randomUUID()}@example.test`;
    for (let attempt = 0; attempt < 8; attempt++) {
      const response = await raw.post(
        `/api/collections/${attempt % 2 ? users.id : "users"}/auth-with-password`,
        {
          headers: { "X-Forwarded-For": `192.0.2.${attempt + 1}` },
          data: {
            identity: attempt % 2 ? identity.toUpperCase() : identity,
            password: "incorrect",
          },
        },
      );
      expect(response.status()).toBe(400);
    }
    const blocked = await raw.post(
      "/api/collections/users/auth-with-password",
      { data: { identity, password: "incorrect" } },
    );
    expect(blocked.status()).toBe(429);
    expect(
      (
        await request.post("/api/auth/login", {
          headers: { Origin: origin },
          data: { email: identity, password: "incorrect" },
        })
      ).status(),
    ).toBe(429);
    const rows = await (
      await request.get(`${backend}/api/collections/security_limits/records`, {
        headers: root,
      })
    ).json();
    expect(rows.items.length).toBeGreaterThan(0);
    for (const row of rows.items) expect(row.key).toMatch(/^[a-f0-9]{64}$/);
    expect(JSON.stringify(rows)).not.toContain(identity);
    for (const email of ["admin@fairauto.test", "partner@fairauto.test"]) {
      const login = await raw.post(
        "/api/collections/users/auth-with-password",
        { data: { identity: email, password } },
      );
      expect(login.status()).toBe(200);
      const headers = { Authorization: (await login.json()).token };
      expect(
        (
          await raw.get("/api/collections/security_limits/records", { headers })
        ).status(),
      ).toBe(403);
      expect(
        (
          await raw.post("/api/collections/security_limits/records", {
            headers,
            data: {
              key: "a".repeat(64),
              count: 1,
              expiresAt: Date.now() + 60000,
            },
          })
        ).status(),
      ).toBe(403);
    }
  } finally {
    await raw.dispose();
  }
});

test("mail request limits include nonexistent accounts and alternate collection IDs", async ({
  request,
}) => {
  const users = await (
    await request.get(`${backend}/api/collections/users`, {
      headers: await rootHeaders(request),
    })
  ).json();
  const email = `${crypto.randomUUID()}@example.test`;
  for (let attempt = 0; attempt < 4; attempt++) {
    const action =
      attempt % 2 ? "request-password-reset" : "request-verification";
    const response = await request.post(
      `${backend}/api/collections/${attempt % 2 ? users.id : "users"}/${action}`,
      { data: { email } },
    );
    expect(response.status()).toBe(204);
  }
  expect(
    (
      await request.post(
        `${backend}/api/collections/users/request-password-reset`,
        { data: { email } },
      )
    ).status(),
  ).toBe(429);
});

test("backend security settings are enabled and successful logins do not consume the failure budget", async ({
  request,
}) => {
  const root = await rootHeaders(request);
  const settings = await (
    await request.get(`${backend}/api/settings`, { headers: root })
  ).json();
  expect(settings.rateLimits.enabled).toBe(true);
  expect(settings.batch.enabled).toBe(false);
  expect(settings.backups.cron).toBeTruthy();
  expect(settings.backups.cronMaxKeep).toBeGreaterThanOrEqual(7);
  const email = `${crypto.randomUUID()}@example.test`;
  const created = await request.post(
    `${backend}/api/collections/users/records`,
    {
      headers: root,
      data: {
        name: "Security Test",
        email,
        password,
        passwordConfirm: password,
        role: "partner",
        active: true,
        companyName: "Security Kft.",
        companyTax: "12345678-2-19",
      },
    },
  );
  expect(created.status()).toBe(200);
  for (let attempt = 0; attempt < 10; attempt++)
    expect(
      (
        await request.post(
          `${backend}/api/collections/users/auth-with-password`,
          { data: { identity: email, password } },
        )
      ).status(),
    ).toBe(200);
});

test("email eligibility is enforced on direct appointment and collection reads with an old token", async ({
  request,
}) => {
  const root = await rootHeaders(request);
  const email = `${crypto.randomUUID()}@example.test`;
  const created = await request.post(
    `${backend}/api/collections/users/records`,
    {
      headers: root,
      data: {
        name: "Verification Revocation",
        email,
        password,
        passwordConfirm: password,
        role: "manager",
        active: true,
        verified: true,
        emailVerificationRequired: true,
      },
    },
  );
  expect(created.status()).toBe(200);
  const record = await created.json();
  const login = await request.post(
    `${backend}/api/collections/users/auth-with-password`,
    { data: { identity: email, password } },
  );
  expect(login.status()).toBe(200);
  const headers = { Authorization: (await login.json()).token };
  expect(
    (
      await request.get(`${backend}/api/fairauto/appointments/dashboard`, {
        headers,
      })
    ).status(),
  ).toBe(200);
  expect(
    (
      await request.patch(
        `${backend}/api/collections/users/records/${record.id}`,
        { headers: root, data: { verified: false } },
      )
    ).status(),
  ).toBe(200);
  expect(
    (
      await request.get(`${backend}/api/fairauto/appointments/dashboard`, {
        headers,
      })
    ).status(),
  ).toBe(401);
  const native = await request.get(
    `${backend}/api/collections/users/records/${record.id}`,
    { headers },
  );
  expect([401, 403, 404]).toContain(native.status());
});

test("direct booking rejects overflowing clock minutes and deceptive JSON media types", async ({
  request,
}) => {
  const config = await (
    await request.get(`${backend}/api/fairauto/appointments/config`)
  ).json();
  const availability = await (
    await request.get(
      `${backend}/api/fairauto/appointments/availability?service=other`,
    )
  ).json();
  const date = Object.keys(availability.days)
    .sort()
    .find((day) => day > availability.today && availability.days[day].length)!;
  const data = {
    requestId: crypto.randomUUID(),
    viewerId: "guest",
    service: "other",
    date,
    time: "05:60",
    contact: {
      name: "Clock Validation",
      email: `${crypto.randomUUID()}@example.test`,
      phone: "+36301234567",
      city: "Pákozd",
    },
    vehicle: {
      plate: "SEC123",
      make: "Ford",
      model: "Focus",
      year: 2020,
      vin: "WVWZZZ1JZXW000001",
    },
    acceptTerms: true,
    termsVersion: config.termsVersion,
  };
  const headers = {
    "X-Fairauto-Guest": crypto.randomUUID().replaceAll("-", "").repeat(2),
  };
  const invalid = await request.post(`${backend}/api/fairauto/appointments`, {
    headers,
    data,
  });
  expect(invalid.status()).toBe(409);
  expect((await invalid.json()).data.fairautoCode.code).toBe(
    "slot_unavailable",
  );
  expect(
    (
      await request.post(`${backend}/api/fairauto/appointments`, {
        headers: { ...headers, "Content-Type": "application/jsonp" },
        data: JSON.stringify(data),
      })
    ).status(),
  ).toBe(415);
});
