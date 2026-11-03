import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import ts from "typescript";

// Control upstream completion order: security checks must overlap auth, and
// neither a login nor a session may succeed before both checks have passed.
const source = ts.transpileModule(
  readFileSync(new URL("../lib/server/pocketbase.ts", import.meta.url), "utf8"),
  {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
    },
  },
).outputText;
class AccountError extends Error {
  constructor(status, message, code) {
    super(message);
    Object.assign(this, { status, code });
  }
}
function fixture() {
  const requests = [];
  const exports = {};
  const original = "original.session.token";
  vm.runInNewContext(source, {
    exports,
    console,
    URL,
    FormData,
    AbortSignal,
    process: {
      env: { NODE_ENV: "test", POCKETBASE_URL: "http://127.0.0.1:3101" },
    },
    require(name) {
      if (name === "server-only") return {};
      if (name === "next/headers")
        return { cookies: async () => ({ get: () => ({ value: original }) }) };
      if (name === "../permissions")
        return { roleLabels: { partner: "Partner" } };
      if (name === "./http") return { AccountError };
      throw new Error(`Unexpected import: ${name}`);
    },
    fetch(url) {
      return new Promise((resolve) =>
        requests.push({
          path: new URL(url).pathname,
          finish(body, status = 200) {
            resolve(Response.json(body, { status }));
          },
        }),
      );
    },
  });
  return { api: exports, requests, original };
}
const record = {
  id: "localtestuser001",
  collectionName: "users",
  role: "partner",
  name: "Local Test",
  email: "local@example.test",
  active: true,
  verified: true,
};
const valid = { token: "refreshed.session.token", record };
const tick = () => new Promise(setImmediate);

for (const action of ["authenticate", "currentSession"]) {
  const { api, requests, original } = fixture();
  let settled = false;
  const pending = (
    action === "authenticate"
      ? api.authenticate(record.email, "Local-test-only-password")
      : api.currentSession()
  ).finally(() => {
    settled = true;
  });
  await tick();
  assert.equal(
    requests.length,
    2,
    `${action}: do not serialize the two backend round trips`,
  );
  assert.equal(requests[0].path, "/api/fairauto/security-policy");
  requests[1].finish(valid);
  await tick();
  assert.equal(
    settled,
    false,
    "Authentication must wait for security readiness",
  );
  requests[0].finish({ ready: true, version: 1 });
  const session = await pending;
  assert.equal(session.user.id, record.id);
  assert.equal(
    session.token,
    action === "currentSession" ? original : valid.token,
  );
}
for (const action of ["authenticate", "currentSession"]) {
  const { api, requests } = fixture();
  const pending =
    action === "authenticate"
      ? api.authenticate(record.email, "Local-test-only-password")
      : api.currentSession();
  const rejected = assert.rejects(
    pending,
    (e) => e.status === 503 && e.code === "security_setup_required",
  );
  await tick();
  requests[1].finish(valid);
  requests[0].finish({ ready: false, version: 1 });
  await rejected;
}
const { api, requests } = fixture();
for (const active of [true, false]) {
  const before = requests.length;
  const pending = api.currentSession();
  await tick();
  assert.equal(
    requests.length,
    before + 2,
    "Revalidate both checks on every request",
  );
  requests[before].finish({ ready: true, version: 1 });
  requests[before + 1].finish({ ...valid, record: { ...record, active } });
  assert.equal((await pending)?.user.id ?? null, active ? record.id : null);
}
console.log(
  "PASS: login and session checks overlap without caching identities or bypassing backend readiness, revocation, or token expiry.",
);
