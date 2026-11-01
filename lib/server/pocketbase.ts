import "server-only";
import { cookies } from "next/headers";
import type { NextResponse } from "next/server";
import type { Account, AccountCapabilities } from "../accounts";
import { roleLabels } from "../permissions";
import type { Role } from "../demo";
import { AccountError } from "./http";

export const sessionCookie =
  process.env.NODE_ENV === "production"
    ? "__Host-fairauto_session"
    : "fairauto_session";
const sessionOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
};
export const capabilities = (): AccountCapabilities => ({
  registration: process.env.AUTH_REGISTRATION_ENABLED === "true",
});
export class PocketBaseError extends Error {
  constructor(public status: number) {
    super("PocketBase request failed");
  }
}
function baseUrl() {
  let url: URL;
  try {
    url = new URL(
      process.env.POCKETBASE_URL || "https://pb.fairautoszervizkft.hu",
    );
  } catch {
    throw new AccountError(503, "A fiókszolgáltatás beállítása hiányos.");
  }
  const developmentLoopback =
    process.env.NODE_ENV !== "production" &&
    ["127.0.0.1", "localhost", "[::1]"].includes(url.hostname);
  if (
    (url.protocol !== "https:" &&
      !(url.protocol === "http:" && developmentLoopback)) ||
    url.username ||
    url.password ||
    url.search ||
    url.hash ||
    !["", "/"].includes(url.pathname)
  )
    throw new AccountError(503, "A fiókszolgáltatás beállítása hibás.");
  return url.origin;
}
async function pocketbaseResponse(
  path: string,
  method = "POST",
  data?: unknown,
  token?: string,
  accept = "application/json",
): Promise<Response> {
  const headers: Record<string, string> = {
    Accept: accept,
    // Identify the actual server client; generic runtime user agents can trigger Cloudflare 1010.
    "User-Agent": "FairautoszervizAccountServer/0.1",
  };
  if (data !== undefined && !(data instanceof FormData))
    headers["Content-Type"] = "application/json";
  if (token) headers.Authorization = token;
  const clientId = process.env.CF_ACCESS_CLIENT_ID,
    clientSecret = process.env.CF_ACCESS_CLIENT_SECRET;
  if (!!clientId !== !!clientSecret)
    throw new AccountError(
      503,
      "A fiókszolgáltatás kapcsolatbeállítása hiányos.",
    );
  if (clientId && clientSecret) {
    headers["CF-Access-Client-Id"] = clientId;
    headers["CF-Access-Client-Secret"] = clientSecret;
  }
  let response: Response;
  try {
    response = await fetch(baseUrl() + path, {
      method,
      headers,
      body:
        data instanceof FormData
          ? data
          : data === undefined
            ? undefined
            : JSON.stringify(data),
      cache: "no-store",
      redirect: "error",
      signal: AbortSignal.timeout(10_000),
    });
  } catch {
    throw new AccountError(
      503,
      "A fiókszolgáltatás nem érhető el. Próbáld újra később.",
    );
  }
  if (response.status === 429)
    throw new AccountError(429, "Túl sok próbálkozás. Próbáld újra később.");
  return response;
}
export async function pb<T = Record<string, unknown>>(
  path: string,
  method = "POST",
  data?: unknown,
  token?: string,
): Promise<T> {
  const response = await pocketbaseResponse(path, method, data, token);
  if (response.status === 204) return {} as T;
  if (!response.headers.get("content-type")?.includes("application/json")) {
    const media = response.headers
      .get("content-type")
      ?.split(";")[0]
      .trim()
      .toLowerCase();
    const server = response.headers.get("server")?.toLowerCase();
    const ray = response.headers.get("cf-ray");
    // Log only bounded infrastructure metadata, never credentials, URLs, tokens or bodies.
    console.error("[fairauto] account_backend_non_json", {
      status: response.status,
      format:
        media === "text/html"
          ? "html"
          : media === "text/plain"
            ? "text"
            : media
              ? "other"
              : "missing",
      gateway: server?.includes("cloudflare")
        ? "cloudflare"
        : server?.includes("vercel")
          ? "vercel"
          : "other",
      cloudflareChallenge: response.headers.get("cf-mitigated") === "challenge",
      cloudflareRay:
        ray && /^[a-f0-9]{16}-[A-Z0-9]{3}$/i.test(ray) ? ray : null,
    });
    throw new AccountError(
      503,
      "A fiókszolgáltatás kapcsolata most nem használható.",
      response.headers.get("cf-mitigated") === "challenge"
        ? "account_backend_cloudflare_challenge"
        : `account_backend_http_${response.status}_non_json`,
    );
  }
  if (!response.ok) {
    // Never expose upstream response bodies, credentials or internal URLs to the browser.
    if (response.status >= 500)
      throw new AccountError(503, "A fiókszolgáltatás most nem érhető el.");
    throw new PocketBaseError(response.status);
  }
  try {
    return (await response.json()) as T;
  } catch {
    throw new AccountError(503, "A fiókszolgáltatás hibás választ adott.");
  }
}
export async function pbImage(path: string): Promise<Response> {
  const response = await pocketbaseResponse(
    path,
    "GET",
    undefined,
    undefined,
    "image/webp,image/png,image/jpeg",
  );
  if (response.headers.get("cf-mitigated") === "challenge")
    throw new AccountError(
      503,
      "A profilkép szolgáltatásának elérése blokkolva van.",
    );
  if (!response.ok) {
    if (response.status >= 500)
      throw new AccountError(503, "A profilkép most nem tölthető be.");
    throw new PocketBaseError(response.status);
  }
  const media = response.headers
    .get("content-type")
    ?.split(";")[0]
    .trim()
    .toLowerCase();
  if (!media || !["image/webp", "image/png", "image/jpeg"].includes(media))
    throw new AccountError(
      503,
      "A profilkép szolgáltatása hibás választ adott.",
    );
  return response;
}
export function account(record: Record<string, unknown>): Account {
  if (
    !record ||
    typeof record !== "object" ||
    typeof record.id !== "string" ||
    record.collectionName !== "users" ||
    typeof record.role !== "string" ||
    !Object.hasOwn(roleLabels, record.role)
  )
    throw new AccountError(401, "A fiók nem használható ebben a rendszerben.");
  const field = (name: string) =>
    typeof record[name] === "string" ? (record[name] as string) : "";
  return {
    id: record.id,
    email: field("email"),
    name: field("name"),
    phone: field("phone"),
    city: field("city"),
    reminders: record.reminders === true,
    role: record.role as Role,
    verified: record.verified === true,
    active: record.active !== false,
    protectedRoot: record.protectedRoot === true,
    companyName: field("companyName"),
    avatar: field("avatar"),
    defaultVehicle: field("defaultVehicle"),
    companyTax: field("companyTax"),
    companyCity: field("companyCity"),
    partnerRequested: record.partnerRequested === true,
    setupReady:
      Object.hasOwn(record, "active") &&
      Object.hasOwn(record, "protectedRoot") &&
      Object.hasOwn(record, "termsVersion") &&
      Object.hasOwn(record, "companyName"),
  };
}
export type Session = { token: string; user: Account };
function authenticated(result: {
  token: string;
  record: Record<string, unknown>;
}): Session {
  if (
    typeof result.token !== "string" ||
    !/^[A-Za-z0-9._-]{16,4096}$/.test(result.token)
  )
    throw new AccountError(503, "A fiókszolgáltatás hibás választ adott.");
  const user = account(result.record);
  if (!user.active || !user.email)
    throw new AccountError(
      401,
      "A fiók le van tiltva, vagy a belépési adatok hibásak.",
    );
  return { token: result.token, user };
}
export async function authenticate(
  identity: string,
  password: string,
): Promise<Session> {
  try {
    return authenticated(
      await pb("/api/collections/users/auth-with-password", "POST", {
        identity,
        password,
      }),
    );
  } catch (error) {
    if (
      error instanceof PocketBaseError ||
      (error instanceof AccountError && error.status === 401)
    )
      throw new AccountError(
        401,
        "Hibás e-mail-cím vagy jelszó, illetve letiltott fiók.",
      );
    throw error;
  }
}
export async function currentSession(): Promise<Session | null> {
  const token = (await cookies()).get(sessionCookie)?.value;
  if (!token) return null;
  if (!/^[A-Za-z0-9._-]{16,4096}$/.test(token)) return null;
  try {
    const fresh = authenticated(
      await pb<{ token: string; record: Record<string, unknown> }>(
        "/api/collections/users/auth-refresh",
        "POST",
        undefined,
        token,
      ),
    );
    // Validate against PocketBase each time; keep the original token's expiry.
    return { token, user: fresh.user };
  } catch (error) {
    if (
      (error instanceof PocketBaseError &&
        [400, 401, 403, 404].includes(error.status)) ||
      (error instanceof AccountError && error.status === 401)
    )
      return null;
    throw error;
  }
}
export async function requireSession(admin = false): Promise<Session> {
  const session = await currentSession();
  if (!session)
    throw new AccountError(
      401,
      "A munkamenet lejárt. Jelentkezz be újra.",
      "session_expired",
    );
  if (admin && session.user.role !== "admin")
    throw new AccountError(403, "Ehhez adminisztrátori jogosultság szükséges.");
  return session;
}
export function setSession(response: NextResponse, token: string) {
  response.cookies.set(sessionCookie, token, {
    ...sessionOptions,
    maxAge: 8 * 60 * 60,
  });
  return response;
}
export function clearSession(response: NextResponse) {
  response.cookies.set(sessionCookie, "", { ...sessionOptions, maxAge: 0 });
  return response;
}
export async function reauthenticate(session: Session, password: string) {
  const proof = await authenticate(session.user.email, password);
  if (proof.user.id !== session.user.id)
    throw new AccountError(403, "A művelet nem engedélyezett.");
}
export function requireSetup(user: Account) {
  if (!user.setupReady)
    throw new AccountError(
      503,
      "A PocketBase fiókkezelési migrációját még alkalmazni kell.",
    );
}
