// Run after npm run build. Uses a separate loopback production server, without a backend.
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { once } from "node:events";
import { chromium } from "@playwright/test";

const port = 3102;
const origin = `http://127.0.0.1:${port}`;
const server = spawn(
  process.execPath,
  [
    "node_modules/next/dist/bin/next",
    "start",
    "--hostname",
    "127.0.0.1",
    "--port",
    String(port),
  ],
  {
    stdio: ["ignore", "pipe", "pipe"],
    env: {
      ...process.env,
      NODE_ENV: "production",
      NEXT_DIST_DIR: ".next",
      POCKETBASE_URL: "",
      AUTH_APP_ORIGIN: "https://production.example.test",
    },
  },
);
let output = "";
for (const stream of [server.stdout, server.stderr])
  stream.on("data", (chunk) => {
    output = (output + chunk).slice(-12000);
  });
let browser;
try {
  let ready = false;
  for (let attempt = 0; attempt < 120; attempt++) {
    if (server.exitCode !== null)
      throw new Error(`Production server exited: ${output}`);
    try {
      if ((await fetch(origin)).ok) {
        ready = true;
        break;
      }
    } catch {}
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  assert(ready, `Production server did not start: ${output}`);
  const first = await fetch(origin, {
    headers: {
      "x-nonce": "attacker-controlled",
      "Content-Security-Policy": "script-src 'unsafe-inline'",
    },
  });
  const policy = first.headers.get("content-security-policy") || "";
  const nonce = /'nonce-([^']+)'/.exec(policy)?.[1];
  assert(nonce && nonce !== "attacker-controlled");
  assert(policy.includes("'strict-dynamic'"));
  assert(
    !policy.split("script-src ")[1].split(";")[0].includes("'unsafe-inline'"),
  );
  assert(
    policy.includes("object-src 'none'") &&
      policy.includes("frame-ancestors 'none'"),
  );
  assert.match(first.headers.get("cache-control"), /no-store/);
  assert.equal(first.headers.get("x-frame-options"), "DENY");
  assert.equal(first.headers.get("x-powered-by"), null);
  assert.match(
    first.headers.get("strict-transport-security"),
    /max-age=31536000/,
  );
  const html = await first.text();
  assert(html.includes(`nonce="${nonce}"`));
  const second = await fetch(origin);
  assert.notEqual(
    /'nonce-([^']+)'/.exec(second.headers.get("content-security-policy"))?.[1],
    nonce,
  );
  for (const path of ["/aszf", "/impresszum", "/adatkezelesi-tajekoztato"]) {
    const response = await fetch(origin + path);
    assert.equal(response.status, 200);
    const nonce = /'nonce-([^']+)'/.exec(
      response.headers.get("content-security-policy"),
    )?.[1];
    assert(
      nonce && (await response.text()).includes(`nonce="${nonce}"`),
      `Missing matching nonce on ${path}`,
    );
    assert.match(response.headers.get("cache-control"), /no-store/);
  }
  const api = await fetch(origin + "/api/auth/session");
  assert.equal(api.status, 200);
  assert.match(api.headers.get("cache-control"), /no-store/);
  assert.match(
    api.headers.get("content-security-policy"),
    /default-src 'none'/,
  );
  assert.deepEqual((await api.json()).user, null);
  const csrf = await fetch(origin + "/api/auth/logout", {
    method: "POST",
    headers: { Origin: "https://attacker.invalid" },
  });
  assert.equal(csrf.status, 403);
  const logout = await fetch(origin + "/api/auth/logout", {
    method: "POST",
    headers: { Origin: "https://production.example.test" },
  });
  assert.equal(logout.status, 200);
  const cookie = logout.headers.get("set-cookie") || "";
  for (const flag of [
    "__Host-fairauto_session=",
    "HttpOnly",
    "Secure",
    "SameSite=lax",
    "Path=/",
  ])
    assert(cookie.toLowerCase().includes(flag.toLowerCase()), flag);
  assert(!cookie.toLowerCase().includes("domain="));
  assert.equal((await fetch(origin + "/api/admin/accounts")).status, 401);
  const unconfigured = await fetch(origin + "/api/auth/login", {
    method: "POST",
    headers: {
      Origin: "https://production.example.test",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email: "local-only@example.test",
      password: "incorrect",
    }),
  });
  assert.equal(unconfigured.status, 503); // Empty production backend must never fall back to a live default.

  browser = await chromium.launch({
    executablePath: process.env.CHROMIUM_PATH || "/usr/bin/chromium",
    args: ["--no-sandbox"],
  });
  const page = await browser.newPage();
  const errors = [],
    violations = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (/content security policy|violates.*directive/i.test(message.text()))
      violations.push(message.text());
  });
  await page.goto(origin);
  await page.getByRole("heading", { level: 1 }).waitFor();
  await page
    .getByRole("button", { name: /téma|megjelenés|sötét|világos/i })
    .click();
  assert.equal(await page.locator("html").getAttribute("data-theme"), "dark");
  await page.reload();
  assert.equal(await page.locator("html").getAttribute("data-theme"), "dark");
  await page.goto(origin + "/fiok");
  await page.locator('form button[type="submit"]').waitFor();
  await page.goto(origin + "/fiok-muvelet");
  await page.locator(".form-error").waitFor(); // Confirms React effects ran under the production CSP.
  assert.equal(violations.length, 0, violations.join("\n"));
  assert.deepEqual(errors, []);
  // Simulate HTML injection at parsing time, preserving the real response's CSP.
  // strict-dynamic intentionally trusts scripts created by an already trusted script.
  await page.route(origin + "/fiok-muvelet", async (route) => {
    const response = await route.fetch();
    const html = await response.text();
    await route.fulfill({
      response,
      body: html.replace(
        "</body>",
        '<script>window.untrustedScriptExecuted = true</script><button id="untrusted-handler" onclick="window.untrustedHandlerExecuted = true">Untrusted</button></body>',
      ),
    });
  });
  await page.reload();
  await page.locator("#untrusted-handler").click();
  assert.equal(
    await page.evaluate(
      () =>
        window.untrustedScriptExecuted ||
        window.untrustedHandlerExecuted ||
        false,
    ),
    false,
  );
  assert(violations.length >= 2);
  console.log(
    "PASS: production nonce rotation, cache isolation, browser hydration, theme persistence, inline-script blocking, security headers and CSRF rejection.",
  );
} finally {
  if (browser) await browser.close();
  server.kill("SIGTERM");
  if (server.exitCode === null) await once(server, "exit");
}
