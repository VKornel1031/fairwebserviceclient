import "server-only";
import { createHash } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";

export class AccountError extends Error {
  constructor(
    public status: number,
    message: string,
    public code?: string,
  ) {
    super(message);
  }
}
export function json(data: unknown, status = 200) {
  return NextResponse.json(data, {
    status,
    headers: {
      "Cache-Control": "private, no-store, max-age=0",
      Pragma: "no-cache",
      Vary: "Cookie",
      "X-Content-Type-Options": "nosniff",
      "Referrer-Policy": "no-referrer",
    },
  });
}
export function accountError(error: unknown) {
  return error instanceof AccountError
    ? json(
        { error: error.message, ...(error.code ? { code: error.code } : {}) },
        error.status,
      )
    : json(
        { error: "A fiókszolgáltatás most nem érhető el. Próbáld újra." },
        503,
      );
}
export function checkOrigin(request: NextRequest) {
  const configured =
    process.env.AUTH_APP_ORIGIN ||
    (process.env.NODE_ENV === "production"
      ? "https://fairwebserviceclient.vercel.app"
      : request.nextUrl.origin);
  let expected: URL;
  try {
    expected = new URL(configured);
  } catch {
    throw new AccountError(503, "A fiókszolgáltatás beállítása hiányos.");
  }
  if (
    (process.env.NODE_ENV === "production" && expected.protocol !== "https:") ||
    request.headers.get("origin") !== expected.origin ||
    request.headers.get("sec-fetch-site") === "cross-site"
  )
    throw new AccountError(
      403,
      "Ez a kérés nem engedélyezett erről a webhelyről.",
    );
}
export async function body(
  request: NextRequest,
  allowed: readonly string[],
): Promise<Record<string, unknown>> {
  if (
    request.headers.get("content-type")?.split(";")[0].trim().toLowerCase() !==
    "application/json"
  )
    throw new AccountError(415, "JSON formátumú kérés szükséges.");
  const reader = request.body?.getReader();
  if (!reader) throw new AccountError(400, "Hiányzó adatok.");
  const chunks: Uint8Array[] = [];
  let length = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    length += value.length;
    if (length > 8192) {
      await reader.cancel();
      throw new AccountError(413, "A kérés túl nagy.");
    }
    chunks.push(value);
  }
  let value: unknown;
  try {
    value = JSON.parse(
      new TextDecoder("utf-8", { fatal: true }).decode(Buffer.concat(chunks)),
    );
  } catch {
    throw new AccountError(400, "Hibás kérésformátum.");
  }
  if (
    !value ||
    typeof value !== "object" ||
    Array.isArray(value) ||
    Object.keys(value).some((key) => !allowed.includes(key))
  )
    throw new AccountError(400, "Nem engedélyezett vagy hiányzó adatok.");
  return value as Record<string, unknown>;
}
export function text(
  data: Record<string, unknown>,
  key: string,
  max: number,
  min = 0,
) {
  const value = data[key];
  if (
    typeof value !== "string" ||
    value.trim().length < min ||
    value.length > max ||
    /[\u0000-\u001f]/.test(value)
  )
    throw new AccountError(400, "Ellenőrizd a megadott adatokat.");
  return value.trim();
}
export function email(data: Record<string, unknown>, key = "email") {
  const value = text(data, key, 254, 3).toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value))
    throw new AccountError(400, "Adj meg érvényes e-mail-címet.");
  return value;
}
export function password(
  data: Record<string, unknown>,
  key = "password",
  isNew = false,
) {
  const value = data[key];
  if (
    typeof value !== "string" ||
    value.length < (isNew ? 12 : 1) ||
    value.length > (isNew ? 64 : 256) ||
    (isNew && Buffer.byteLength(value, "utf8") > 72)
  )
    throw new AccountError(
      400,
      isNew
        ? "A jelszó legalább 12, legfeljebb 64 karakter legyen; nagyon hosszú ékezetes jelszó helyett használj rövidebb jelmondatot."
        : "Add meg a jelszavad.",
    );
  return value;
}
type Bucket = { count: number; expires: number };
const buckets = new Map<string, Bucket>();
/** Per-process defence only; PocketBase/edge limits are also required on serverless hosts. */
export function throttle(
  request: NextRequest,
  category: string,
  identity = "",
  limit = 12,
) {
  const now = Date.now();
  if (buckets.size > 4000)
    for (const [key, bucket] of buckets)
      if (bucket.expires < now) buckets.delete(key);
  const ip =
    process.env.VERCEL === "1"
      ? request.headers.get("x-vercel-forwarded-for")?.split(",")[0].trim() ||
        "unknown"
      : "local";
  for (const [suffix, maximum] of [
    ["ip", 80],
    [identity.trim().toLowerCase(), limit],
  ] as const) {
    const key = createHash("sha256")
      .update(`${category}:${ip}:${suffix}`)
      .digest("hex");
    const current = buckets.get(key);
    if (current && current.expires > now) {
      if (current.count >= maximum)
        throw new AccountError(
          429,
          "Túl sok próbálkozás. Próbáld újra 15 perc múlva.",
        );
      current.count++;
    } else {
      if (buckets.size >= 5000) buckets.delete(buckets.keys().next().value!);
      buckets.set(key, { count: 1, expires: now + 15 * 60_000 });
    }
  }
}
