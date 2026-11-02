import { expect, type APIRequestContext } from "@playwright/test";
const backend = "http://127.0.0.1:3101";
const origin = "http://127.0.0.1:3100";
// These credentials exist only in scripts/test-pocketbase.py's disposable database.
let rootToken: string | undefined;
export async function rootHeaders(api: APIRequestContext) {
  if (rootToken) return { Authorization: rootToken };
  const auth = await api.post(
    `${backend}/api/collections/_superusers/auth-with-password`,
    {
      data: {
        identity: "root@fairauto.test",
        password: "Local-integration-only-928374!",
      },
    },
  );
  expect(auth.status()).toBe(200);
  rootToken = (await auth.json()).token as string;
  return { Authorization: rootToken };
}
export async function accountMailLink(
  api: APIRequestContext,
  email: string,
  action: "verify" | "email" | "reset" = "verify",
) {
  const headers = await rootHeaders(api);
  let fragment = "";
  let html = "";
  await expect
    .poll(
      async () => {
        const response = await api.get(
          `${backend}/api/collections/test_mail_capture/records`,
          {
            headers,
            params: {
              filter: `recipient = ${JSON.stringify(email)}`,
              sort: "-created",
              perPage: "30",
            },
          },
        );
        expect(response.status()).toBe(200);
        for (const mail of (await response.json()).items) {
          const hrefs = String(mail.html).matchAll(/href="([^"]+)"/g);
          for (const match of hrefs) {
            const url = new URL(match[1].replaceAll("&amp;", "&"));
            if (
              url.pathname === "/fiok-muvelet" &&
              new URLSearchParams(url.hash.slice(1)).get("action") === action
            ) {
              fragment = url.hash;
              html = String(mail.html);
              return true;
            }
          }
        }
        return false;
      },
      { timeout: 8000 },
    )
    .toBe(true);
  // Never follow the production origin written into a test template.
  return {
    path: "/fiok-muvelet" + fragment,
    html,
    token: new URLSearchParams(fragment.slice(1)).get("token")!,
  };
}
export async function verifyAccount(api: APIRequestContext, email: string) {
  const mail = await accountMailLink(api, email);
  const confirmed = await api.post(origin + "/api/auth/confirm-verification", {
    headers: { Origin: origin },
    data: { token: mail.token },
  });
  expect(confirmed.status(), await confirmed.text()).toBe(200);
}
