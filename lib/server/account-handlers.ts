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
import { normalizedCompanyTax, validCompany } from "../company";

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
  if (typeof result.companyTax === "string")
    result.companyTax = normalizedCompanyTax(result.companyTax);
  for (const key of ["reminders"] as const)
    if (data[key] !== undefined) {
      if (typeof data[key] !== "boolean")
        throw new AccountError(400, "Hibás beállítás.");
      result[key] = data[key];
    }
  return result;
}
function requireCompany(details: Record<string, unknown>) {
  if (!validCompany(details.companyName, details.companyTax))
    throw new AccountError(
      400,
      "Add meg a cég nevét és az adószámát (például: 12345678-2-19).",
    );
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
async function requestAccountMail(
  action: "request-verification" | "request-password-reset",
  identity: string,
) {
  await requireEmailSetup();
  try {
    await pb(`/api/collections/users/${action}`, "POST", { email: identity });
  } catch (error) {
    // Public results never reveal whether an address exists or is already verified.
    if (!(
      error instanceof PocketBaseError && [400, 404].includes(error.status)
    ))
      throw error;
  }
}
async function requireEmailSetup() {
  try {
    const policy = await pb<{ emailVerification: boolean }>(
      "/api/fairauto/account/registration-policy",
      "GET",
    );
    if (!policy.emailVerification) throw new PocketBaseError(404);
  } catch (error) {
    if (error instanceof PocketBaseError)
      throw new AccountError(
        503,
        "A fióklevelezéshez telepíteni kell az e-mailes fiókkezelési migrációt és a friss hookokat.",
      );
    throw error;
  }
}
function confirmationToken(data: Record<string, unknown>) {
  const value = text(data, "token", 4096, 20);
  if (!/^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(value))
    throw new AccountError(
      400,
      "A megerősítő hivatkozás hibás vagy lejárt. Kérj új levelet.",
    );
  return value;
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
  if (
    [
      "resend-verification",
      "request-password-reset",
      "request-verification",
    ].includes(action)
  ) {
    const data = await body(request, ["email"]);
    const identity = email(data);
    throttle(request, "account-mail", identity, 4, 30);
    await requestAccountMail(
      action === "request-password-reset"
        ? "request-password-reset"
        : "request-verification",
      identity,
    );
    return json(
      {
        message:
          "Ha a megadott címmel használható fiók van és levél küldhető, elküldtük a szükséges hivatkozást. Ellenőrizd a beérkezett és a levélszemét mappát is.",
      },
      202,
    );
  }
  if (
    [
      "confirm-verification",
      "confirm-password-reset",
      "confirm-email-change",
    ].includes(action)
  ) {
    const data = await body(
      request,
      action === "confirm-verification"
        ? ["token"]
        : action === "confirm-email-change"
          ? ["token", "password"]
          : ["token", "password", "passwordConfirm"],
    );
    const token = confirmationToken(data);
    throttle(request, "account-confirmation", token, 5, 100);
    const payload: Record<string, unknown> = { token };
    if (action === "confirm-password-reset") {
      payload.password = newPassword(data);
      payload.passwordConfirm = payload.password;
    }
    if (action === "confirm-email-change") payload.password = password(data);
    try {
      await pb(`/api/collections/users/${action}`, "POST", payload);
    } catch (error) {
      if (error instanceof PocketBaseError)
        throw new AccountError(
          400,
          "A hivatkozás hibás, lejárt vagy már nem használható, illetve a jelszó hibás. Kérj új levelet, vagy ellenőrizd a jelszavad.",
        );
      throw error;
    }
    return json({
      ok: true,
      message:
        action === "confirm-password-reset"
          ? "Az új jelszót elmentettük. Most bejelentkezhetsz."
          : "Az e-mail-címet megerősítettük. Most bejelentkezhetsz.",
    });
  }
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
    requireCompany(details);
    try {
      const policy = await pb<{
        companyOnly: boolean;
        emailVerification: boolean;
      }>("/api/fairauto/account/registration-policy", "GET");
      if (!policy.companyOnly || !policy.emailVerification)
        throw new PocketBaseError(404);
    } catch (error) {
      if (error instanceof PocketBaseError)
        throw new AccountError(
          503,
          "A céges regisztrációhoz az üzemeltetőnek telepítenie kell a fiókmigrációt és a hozzá tartozó hookot.",
        );
      throw error;
    }
    try {
      // PocketBase has already persisted the account on a successful create response.
      // Public responses may omit internal fields; they are not a schema-readiness probe.
      await pb("/api/collections/users/records", "POST", {
        ...details,
        email: identity,
        password: secret,
        passwordConfirm: secret,
        emailVisibility: false,
        role: "partner",
        active: true,
        emailVerificationRequired: true,
        termsVersion: site.legal.version,
        termsAcceptedAt: new Date().toISOString(),
      });
      try {
        await requestAccountMail("request-verification", identity);
      } catch {
        console.error("[fairauto] registration_verification_request_failed");
      }
    } catch (error) {
      // The same outward result for existing addresses; never reveal account existence.
      if (!(error instanceof PocketBaseError && error.status === 400))
        throw error;
    }
    return json(
      {
        pending: true,
        message:
          "Ha a megadott adatokkal új fiók hozható létre, megerősítő levelet küldtünk. Bejelentkezés előtt igazold az e-mail-címedet. Ha nem érkezik meg, kérj új megerősítő levelet.",
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
    await requireEmailSetup();
    await recordWrite(
      "/api/collections/users/request-email-change",
      "POST",
      { newEmail: identity },
      session.token,
    );
    return json(
      {
        user: session.user,
        message:
          "A megerősítő levelet az új címre kértük. Az e-mail-cím a levélben kapott hivatkozás megerősítése után változik meg.",
      },
      202,
    );
  }
  return json({ error: "Nem található." }, 404);
}
export async function updateProfile(request: NextRequest) {
  const session = await requireSession();
  const data = await body(request, profileFields);
  const details = profile(data);
  if (
    session.user.role === "partner" &&
    ((details.companyName !== undefined &&
      details.companyName !== session.user.companyName) ||
      (details.companyTax !== undefined &&
        details.companyTax !== session.user.companyTax))
  )
    requireCompany({ ...session.user, ...details });
  if (
    !session.user.setupReady &&
    Object.keys(details).some((key) =>
      ["companyName", "companyTax", "companyCity"].includes(key),
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
  const details = profile(data, true);
  const role = selectedRole(data);
  if (role === "partner") requireCompany(details);
  const result = await recordWrite<Record<string, unknown>>(
    "/api/collections/users/records",
    "POST",
    {
      ...details,
      email: email(data),
      role,
      active: flag(data, "active", true),
      emailVerificationRequired: true,
      emailVisibility: false,
      password: secret,
      passwordConfirm: secret,
    },
    session.token,
  );
  try {
    await requestAccountMail("request-verification", email(data));
  } catch {
    console.error("[fairauto] admin_verification_request_failed");
  }
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
  if (
    (details.role ?? target.role) === "partner" &&
    ((details.role !== undefined && details.role !== target.role) ||
      (details.companyName !== undefined &&
        details.companyName !== target.companyName) ||
      (details.companyTax !== undefined &&
        details.companyTax !== target.companyTax))
  )
    requireCompany({ ...target, ...details });
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
  if (details.email && details.email !== target.email) {
    try {
      await requestAccountMail("request-verification", details.email as string);
    } catch {
      console.error("[fairauto] admin_verification_request_failed");
    }
  }
  return json({ user: account(result) });
}
