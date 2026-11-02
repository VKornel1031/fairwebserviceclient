import { rootHeaders, verifyAccount } from "./account-mail-helper";
import { test, expect, type APIRequestContext } from "@playwright/test";
import sharp from "sharp";
import { AVATAR_UPLOAD_LIMIT } from "../lib/avatar";

const origin = "http://127.0.0.1:3100";
const backend = "http://127.0.0.1:3101";
const password = "Local-integration-only-928374!"; // Disposable loopback database only.
const headers = { Origin: origin };
async function customer(api: APIRequestContext) {
  const email = `avatar-${crypto.randomUUID()}@example.test`;
  expect(
    (
      await api.post("/api/auth/register", {
        headers,
        data: {
          name: "Avatar Tester",
          email,
          password,
          passwordConfirm: password,
          acceptTerms: true,
          companyName: "Integration Test Kft.",
          companyTax: "12345678-2-19",
        },
      })
    ).status(),
  ).toBe(202);
  await verifyAccount(api, email);
  const result = await api.post("/api/auth/login", {
    headers,
    data: { email, password },
  });
  expect(result.status()).toBe(200);
  return (await result.json()).user;
}
async function picture(background = "#6b8592") {
  return sharp({ create: { width: 640, height: 480, channels: 3, background } })
    .withMetadata({ orientation: 6 })
    .png()
    .toBuffer();
}
async function upload(
  api: APIRequestContext,
  buffer: Buffer,
  mimeType = "image/png",
  extra: Record<string, string> = {},
) {
  return api.put("/api/account/avatar", {
    headers,
    multipart: { avatar: { name: "photo.png", mimeType, buffer }, ...extra },
  });
}

test("avatars persist in users.avatar, are processed safely and are private to the owner and admins", async ({
  request,
  playwright,
}) => {
  const user = await customer(request);
  expect(
    (await (await request.get("/api/account/avatar/policy")).json()).ready,
  ).toBe(true);
  expect((await request.get("/api/account/avatar")).status()).toBe(404);
  const result = await upload(request, await picture());
  expect(result.status()).toBe(200);
  const saved = (await result.json()).user;
  expect(saved.role).toBe("partner");
  expect(saved.avatar).toMatch(/\.webp$/);
  const image = await request.get("/api/account/avatar");
  expect(image.status()).toBe(200);
  expect(image.headers()["content-type"]).toBe("image/webp");
  expect(image.headers()["cache-control"]).toContain("no-store");
  expect(image.headers()["cross-origin-resource-policy"]).toBe("same-origin");
  const metadata = await sharp(await image.body()).metadata();
  expect(metadata.format).toBe("webp");
  expect(metadata.width).toBeLessThanOrEqual(512);
  expect(metadata.height).toBeLessThanOrEqual(512);
  expect(metadata.exif).toBeUndefined();
  const anonymous = await playwright.request.newContext({ baseURL: origin });
  expect((await anonymous.get("/api/account/avatar")).status()).toBe(401);
  expect(
    (
      await anonymous.get(
        `${backend}/api/files/users/${user.id}/${saved.avatar}`,
      )
    ).status(),
  ).toBe(404);
  const other = await playwright.request.newContext({ baseURL: origin });
  await customer(other);
  expect(
    (await other.get(`/api/admin/accounts/${user.id}/avatar`)).status(),
  ).toBe(403);
  expect((await other.get(`/api/account/avatar?id=${user.id}`)).status()).toBe(
    404,
  );
  const admin = await playwright.request.newContext({ baseURL: origin });
  expect(
    (
      await admin.post("/api/auth/login", {
        headers,
        data: { email: "admin@fairauto.test", password },
      })
    ).status(),
  ).toBe(200);
  expect(
    (await admin.get(`/api/admin/accounts/${user.id}/avatar`)).status(),
  ).toBe(200);
  const replacement = await upload(request, await picture("#c3ac91"));
  expect(replacement.status()).toBe(200);
  expect((await replacement.json()).user.avatar).not.toBe(saved.avatar);
  expect(
    (await request.delete("/api/account/avatar", { headers })).status(),
  ).toBe(200);
  expect(
    (await (await request.get("/api/auth/session")).json()).user.avatar,
  ).toBe("");
  expect((await request.get("/api/account/avatar")).status()).toBe(404);
  await anonymous.dispose();
  await other.dispose();
  await admin.dispose();
});

test("avatar uploads reject invalid files, oversize bodies, CSRF and extra account fields", async ({
  request,
}) => {
  await customer(request);
  const valid = await picture();
  const first = await upload(request, valid);
  expect(first.status()).toBe(200);
  const filename = (await first.json()).user.avatar;
  const svg = Buffer.from(
    '<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10"><rect width="10" height="10"/></svg>',
  );
  expect((await upload(request, svg, "image/svg+xml")).status()).toBe(415);
  expect((await upload(request, svg)).status()).toBe(400);
  expect((await upload(request, Buffer.from("not an image"))).status()).toBe(
    400,
  );
  expect(
    (await upload(request, Buffer.alloc(AVATAR_UPLOAD_LIMIT + 1))).status(),
  ).toBe(413);
  expect(
    (await upload(request, valid, "image/png", { role: "admin" })).status(),
  ).toBe(400);
  expect(
    (
      await request.put("/api/account/avatar", {
        headers: { Origin: "https://attacker.example" },
        multipart: {
          avatar: { name: "photo.png", mimeType: "image/png", buffer: valid },
        },
      })
    ).status(),
  ).toBe(403);
  expect(
    (
      await request.delete("/api/account/avatar", {
        headers: { Origin: "https://attacker.example" },
      })
    ).status(),
  ).toBe(403);
  expect(
    (await (await request.get("/api/auth/session")).json()).user,
  ).toMatchObject({ avatar: filename, role: "partner" });
});

test("the profile uses initials without picture controls or avatar requests", async ({
  page,
}) => {
  await customer(page.request);
  const avatarRequests: string[] = [];
  page.on("request", (request) => {
    if (request.url().includes("/avatar")) avatarRequests.push(request.url());
  });
  await page.goto("/fiok");
  await expect(page.locator(".user-menu .avatar")).toHaveText("AT");
  await expect(page.locator(".profile-aside .large-avatar")).toHaveText("AT");
  await expect(
    page.getByRole("button", { name: /Kép feltöltése/ }),
  ).toHaveCount(0);
  await expect(page.getByText(/profilképkezelés beállítása/)).toHaveCount(0);
  await page.reload();
  await expect(page.locator(".user-menu .avatar")).toHaveText("AT");
  expect(avatarRequests).toEqual([]);
});

test("uploads are refused before saving when the file or view rule is public", async ({
  request,
}) => {
  const user = await customer(request);
  const auth = await rootHeaders(request);
  const collection = await (
    await request.get(`${backend}/api/collections/users`, { headers: auth })
  ).json();
  const fields = collection.fields.map(
    (field: { name: string; protected?: boolean }) =>
      field.name === "avatar" ? { ...field, protected: false } : field,
  );
  try {
    const formatted = collection.viewRule.replaceAll(" && ", " &&\n  ");
    expect(
      (
        await request.patch(`${backend}/api/collections/users`, {
          headers: auth,
          data: { viewRule: formatted },
        })
      ).status(),
    ).toBe(200);
    expect(
      (await (await request.get("/api/account/avatar/policy")).json()).ready,
    ).toBe(true);
  } finally {
    expect(
      (
        await request.patch(`${backend}/api/collections/users`, {
          headers: auth,
          data: { viewRule: collection.viewRule },
        })
      ).status(),
    ).toBe(200);
  }
  for (const change of [{ fields }, { viewRule: "" }]) {
    try {
      expect(
        (
          await request.patch(`${backend}/api/collections/users`, {
            headers: auth,
            data: change,
          })
        ).status(),
      ).toBe(200);
      const policy = await request.get("/api/account/avatar/policy");
      if (change.viewRule === "") {
        expect(policy.status()).toBe(503);
        expect((await policy.json()).code).toBe("security_setup_required");
      } else {
        expect(policy.status()).toBe(200);
        expect((await policy.json()).ready).toBe(false);
      }
      const rejected = await upload(request, await picture());
      expect(rejected.status()).toBe(503);
      expect((await rejected.json()).code).toBe(
        change.viewRule === ""
          ? "security_setup_required"
          : "avatar_setup_required",
      );
      expect(
        (
          await (
            await request.get(
              `${backend}/api/collections/users/records/${user.id}`,
              { headers: auth },
            )
          ).json()
        ).avatar,
      ).toBe("");
    } finally {
      expect(
        (
          await request.patch(`${backend}/api/collections/users`, {
            headers: auth,
            data: { fields: collection.fields, viewRule: collection.viewRule },
          })
        ).status(),
      ).toBe(200);
    }
  }
});
