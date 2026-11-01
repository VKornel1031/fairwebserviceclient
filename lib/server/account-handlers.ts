import "server-only";
import type { NextRequest, NextResponse } from "next/server";
import {
  AccountError,
  accountError,
  body,
  checkOrigin,
  email,
  json,
  password,
  text,
  throttle,
} from "./http";
import {
  account,
  authenticate,
  capabilities,
  clearSession,
  currentSession,
  pb,
  PocketBaseError,
  reauthenticate,
  requireSession,
  requireSetup,
  setSession,
} from "./pocketbase";
import { site } from "@/content/site";
import { roleLabels } from "../permissions";
import type { Role } from "../demo";

export async function handle(
  request: NextRequest,
  action: () => Promise<NextResponse>,
  write = false,
) {
  try {
    if (write) checkOrigin(request);
    return await action();
  } catch (error) {
    // An older in-flight request must not clear a newer login's cookie in another tab.
    // Invalid tokens cannot authorize requests; only explicit logout clears the cookie.
    return accountError(error);
  }
}
const profileFields = [
  "name",
  "phone",
  "city",
  "reminders",
  "companyName",
  "companyTax",
  "companyCity",
  "partnerRequested",
] as const;
function profile(data: Record<string, unknown>, required = false) {
  const result: Record<string, unknown> = {};
  for (const [key, max] of [
    ["name", 100],
    ["phone", 25],
    ["city", 100],
    ["companyName", 120],
    ["companyTax", 30],
    ["companyCity", 100],
  ] as const)
    if ((required && key === "name") || data[key] !== undefined)
      result[key] = text(data, key, max, key === "name" ? 2 : 0);
  for (const key of ["reminders", "partnerRequested"] as const)
    if (data[key] !== undefined) {
      if (typeof data[key] !== "boolean")
        throw new AccountError(400, "Hibás beállítás.");
      result[key] = data[key];
    }
  return result;
}
function newPassword(data: Record<string, unknown>) {
  const value = password(data, "password", true);
  if (value !== data.passwordConfirm)
    throw new AccountError(400, "A két jelszó nem egyezik.");
  return value;
}
function flag(data: Record<string, unknown>, key: string, fallback = false) {
  if (data[key] === undefined) return fallback;
  if (typeof data[key] !== "boolean")
    throw new AccountError(400, "Hibás beállítás.");
  return data[key] as boolean;
}
function selectedRole(data: Record<string, unknown>) {
  if (typeof data.role !== "string" || !Object.hasOwn(roleLabels, data.role))
    throw new AccountError(400, "Érvénytelen szerepkör.");
  return data.role as Role;
}
async function recordWrite<T>(
  path: string,
  method: string,
  data: unknown,
  token: string,
): Promise<T> {
  try {
    return await pb<T>(path, method, data, token);
  } catch (error) {
    if (error instanceof PocketBaseError)
      throw new AccountError(
        error.status === 403 || error.status === 404 ? 403 : 400,
        "A módosítás nem menthető. Ellenőrizd az adatokat és a PocketBase jogosultsági beállításait.",
      );
    throw error;
  }
}
export async function authGet(action: string) {
  if (action !== "session") return json({ error: "Nem található." }, 404);
  const session = await currentSession();
  return json({
    user: session?.user || null,
    capabilities: capabilities(),
  });
}
export async function authPost(request: NextRequest, action: string) {
  if (action === "logout") return clearSession(json({ ok: true }));
  if (action === "login") {
    const data = await body(request, ["email", "password"]);
    const identity = email(data);
    throttle(request, "login", identity, 8);
    const result = await authenticate(identity, password(data));
    return setSession(
      json({ user: result.user, capabilities: capabilities() }),
      result.token,
    );
  }
  if (action === "register") {
    if (!capabilities().registration)
      throw new AccountError(
        503,
        "A nyilvános regisztráció még nincs engedélyezve. Kérj fiókot az üzemeltetőtől.",
      );
    const data = await body(request, [
      ...profileFields,
      "email",
      "password",
      "passwordConfirm",
      "acceptTerms",
    ]);
    const identity = email(data);
    throttle(request, "registration", identity, 5);
    const secret = newPassword(data);
    if (data.acceptTerms !== true)
      throw new AccountError(
        400,
        "A regisztrációhoz fogadd el a használati feltételeket.",
      );
    const details = profile(data, true);
    if (data.partnerRequested === true && !details.companyName)
      throw new AccountError(400, "Céges fiókigényhez add meg a cég nevét.");
    try {
      // PocketBase has already persisted the account on a successful create response.
      // Public responses may omit internal fields; they are not a schema-readiness probe.
      await pb("/api/collections/users/records", "POST", {
        ...details,
        email: identity,
        password: secret,
        passwordConfirm: secret,
        emailVisibility: false,
        role: "customer",
        active: true,
        termsVersion: site.legal.version,
        termsAcceptedAt: new Date().toISOString(),
      });
    } catch (error) {
      // The same outward result for existing addresses; never reveal account existence.
      if (!(error instanceof PocketBaseError && error.status === 400))
        throw error;
    }
    return json(
      {
        pending: false,
        message:
          "Ha a megadott adatokkal új fiók hozható létre, most bejelentkezhetsz. Ha már van fiókod, a meglévő jelszavaddal lépj be.",
      },
      202,
    );
  }
  if (action === "change-password") {
    const session = await requireSession();
    const data = await body(request, [
      "oldPassword",
      "password",
      "passwordConfirm",
    ]);
    throttle(request, "password-change", session.user.id, 8);
    const oldPassword = password(data, "oldPassword"),
      secret = newPassword(data);
    await reauthenticate(session, oldPassword);
    await recordWrite(
      `/api/collections/users/records/${encodeURIComponent(session.user.id)}`,
      "PATCH",
      { oldPassword, password: secret, passwordConfirm: secret },
      session.token,
    );
    const updated = await authenticate(session.user.email, secret);
    return setSession(json({ user: updated.user }), updated.token);
  }
  if (action === "change-email") {
    const session = await requireSession();
    const data = await body(request, ["email", "password"]);
    throttle(request, "email-change", session.user.id, 5);
    const secret = password(data),
      identity = email(data);
    await reauthenticate(session, secret);
    await recordWrite(
      "/api/fairauto/account/email",
      "POST",
      { email: identity, password: secret },
      session.token,
    );
    const updated = await authenticate(identity, secret);
    return setSession(json({ user: updated.user }), updated.token);
  }
  return json({ error: "Nem található." }, 404);
}
export async function updateProfile(request: NextRequest) {
  const session = await requireSession();
  const data = await body(request, profileFields);
  const details = profile(data);
  if (
    !session.user.setupReady &&
    Object.keys(details).some((key) =>
      ["companyName", "companyTax", "companyCity", "partnerRequested"].includes(
        key,
      ),
    )
  )
    requireSetup(session.user);
  const updated = await recordWrite<Record<string, unknown>>(
    `/api/collections/users/records/${encodeURIComponent(session.user.id)}`,
    "PATCH",
    details,
    session.token,
  );
  return json({ user: account(updated) });
}
export async function listAccounts(request: NextRequest) {
  const session = await requireSession(true);
  requireSetup(session.user);
  const query = request.nextUrl.searchParams.get("q")?.trim() || "";
  if (query.length > 100 || /[\u0000-\u001f]/.test(query))
    throw new AccountError(400, "Túl hosszú keresés.");
  const page = Math.max(
    1,
    Math.min(10000, Number(request.nextUrl.searchParams.get("page")) || 1),
  );
  const params = new URLSearchParams({
    page: String(Math.floor(page)),
    perPage: "30",
    sort: "-created",
  });
  if (query) {
    const literal = JSON.stringify(query);
    params.set("filter", `(name ~ ${literal} || email ~ ${literal})`);
  }
  const result = await pb<{
    items: Record<string, unknown>[];
    totalItems: number;
    totalPages: number;
  }>(
    `/api/collections/users/records?${params}`,
    "GET",
    undefined,
    session.token,
  );
  return json({
    items: result.items.map(account),
    totalItems: result.totalItems,
    totalPages: result.totalPages,
    page,
  });
}
export async function createAccount(request: NextRequest) {
  const session = await requireSession(true);
  requireSetup(session.user);
  const data = await body(request, [
    ...profileFields,
    "email",
    "role",
    "active",
    "password",
    "passwordConfirm",
    "adminPassword",
  ]);
  throttle(request, "admin-write", session.user.id, 40);
  await reauthenticate(session, password(data, "adminPassword"));
  const secret = newPassword(data);
  const result = await recordWrite<Record<string, unknown>>(
    "/api/collections/users/records",
    "POST",
    {
      ...profile(data, true),
      email: email(data),
      role: selectedRole(data),
      active: flag(data, "active", true),
      emailVisibility: false,
      password: secret,
      passwordConfirm: secret,
    },
    session.token,
  );
  return json({ user: account(result) }, 201);
}
export async function modifyAccount(
  request: NextRequest,
  id: string,
  remove = false,
) {
  const session = await requireSession(true);
  requireSetup(session.user);
  if (!/^[a-z0-9]{15}$/.test(id))
    throw new AccountError(400, "Érvénytelen fiókazonosító.");
  if (id === session.user.id)
    throw new AccountError(
      403,
      "A saját fiókodat a Saját fiók oldalon szerkesztheted; itt nem törölheted vagy módosíthatod a szerepét.",
    );
  const data = await body(
    request,
    remove
      ? ["adminPassword", "confirmEmail"]
      : [
          ...profileFields,
          "email",
          "role",
          "active",
          "password",
          "passwordConfirm",
          "adminPassword",
        ],
  );
  throttle(request, "admin-write", session.user.id, 40);
  await reauthenticate(session, password(data, "adminPassword"));
  const path = `/api/collections/users/records/${encodeURIComponent(id)}`;
  const target = account(
    await pb<Record<string, unknown>>(path, "GET", undefined, session.token),
  );
  if (target.protectedRoot)
    throw new AccountError(
      403,
      "Ez védett adminisztrátori fiók. A szerepe és aktiválása itt nem változtatható meg.",
    );
  if (remove) {
    if (email(data, "confirmEmail") !== target.email.toLowerCase())
      throw new AccountError(400, "A megerősítő e-mail-cím nem egyezik.");
    await recordWrite(path, "DELETE", undefined, session.token);
    return json({ ok: true });
  }
  const details: Record<string, unknown> = profile(data);
  if (data.email !== undefined) details.email = email(data);
  if (data.role !== undefined) details.role = selectedRole(data);
  if (data.active !== undefined) details.active = flag(data, "active");
  if (data.password !== undefined && data.password !== "") {
    const secret = newPassword(data);
    details.password = secret;
    details.passwordConfirm = secret;
  }
  const result = await recordWrite<Record<string, unknown>>(
    path,
    "PATCH",
    details,
    session.token,
  );
  return json({ user: account(result) });
}
