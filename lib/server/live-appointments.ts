import "server-only";
import { randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import type { NextRequest } from "next/server";
import type { BookingConfiguration } from "../live-appointments";
import { site } from "@/content/site";
import { AccountError, body, json, throttle } from "./http";
import {
  currentSession,
  pb,
  PocketBaseError,
  sessionCookie,
} from "./pocketbase";

const guestCookie =
  process.env.NODE_ENV === "production"
    ? "__Host-fairauto_guest"
    : "fairauto_guest";
const root = "/api/fairauto/appointments";
const messages: Record<string, string> = {
  rate_limited: "Túl sok kérés. Várj egy percet, majd próbáld újra.",
  booking_setup_required:
    "Az időpontkezeléshez telepíteni kell a PocketBase migrációt és a foglalási hook fájlokat.",
  invalid_details: "Ellenőrizd a megadott adatokat és az ÁSZF elfogadását.",
  slot_unavailable:
    "Ez az időpont már nem kérhető. Válassz másik szabad időpontot.",
  slot_taken: "Ez az időpont közben betelt. Válassz másik időpontot.",
  appointment_missing:
    "Az időpontkérés nem található vagy nem érhető el ebben a fiókban.",
  vehicle_missing:
    "A kiválasztott mentett jármű már nem érhető el. Válassz másikat, vagy add meg az adatait.",
  vehicle_changed:
    "A mentett jármű adatai közben megváltoztak. Ellenőrizd az autó adatait, majd nézd át újra a kérést.",
  transition_invalid:
    "Ez a módosítás a jelenlegi állapotban már nem végezhető el.",
  appointment_changed:
    "Az időpontkérés közben megváltozott. Frissítsd a részleteket és próbáld újra.",
  request_reused:
    "Ez a kérés már elküldésre került más adatokkal. Frissítsd az oldalt az új kéréshez.",
  terms_changed:
    "A foglalási feltételek frissültek. Töltsd újra az oldalt, és ellenőrizd az új feltételeket.",
  forbidden: "Ehhez a művelethez nincs jogosultságod.",
  session_expired: "A munkamenet lejárt. Jelentkezz be újra.",
  session_changed:
    "A bejelentkezett fiók megváltozott. Frissítsd az oldalt a folytatáshoz.",
  guest_session_required: "A vendégfoglalás indításához töltsd újra az oldalt.",
  pending_limit:
    "Már több egyeztetésre váró kérésed van. Új kéréshez keresd a szervizt telefonon.",
};
async function actor() {
  const jar = await cookies();
  const session = await currentSession();
  if (!session && jar.get(sessionCookie)?.value)
    throw new AccountError(401, messages.session_expired, "session_expired");
  const value = jar.get(guestCookie)?.value;
  return {
    session,
    guest: value && /^[a-f0-9]{64}$/.test(value) ? value : undefined,
  };
}
async function requestPB<T>(
  path: string,
  method: string,
  payload: unknown,
  auth: Awaited<ReturnType<typeof actor>>,
) {
  try {
    return await pb<T>(root + path, method, payload, auth.session?.token, {
      guestToken: auth.guest,
    });
  } catch (error) {
    if (error instanceof PocketBaseError) {
      if (error.code && messages[error.code])
        throw new AccountError(error.status, messages[error.code], error.code);
      if (error.status === 404 && !path.match(/^\/[a-z0-9]{15}(\/status)?$/))
        throw new AccountError(
          503,
          messages.booking_setup_required,
          "booking_setup_required",
        );
      if (error.status === 404)
        throw new AccountError(404, messages.appointment_missing);
      if ([400, 403, 409, 415, 429].includes(error.status))
        throw new AccountError(
          error.status,
          "Az időpontkérés nem teljesíthető. Ellenőrizd az adatokat és próbáld újra.",
        );
    }
    throw error;
  }
}
export async function bookingContext(request: NextRequest) {
  const auth = await actor();
  throttle(request, "appointments-context", auth.session?.user.id, 150, 1500);
  await body(request, []);
  const config = await requestPB<BookingConfiguration>(
    "/config",
    "GET",
    undefined,
    auth,
  );
  if (
    config.termsVersion !== site.legal.version ||
    !Number.isInteger(config.guestCookieDays) ||
    config.guestCookieDays < 1 ||
    config.guestCookieDays > 365
  )
    throw new AccountError(503, messages.booking_setup_required);
  const response = json({ config, viewer: auth.session?.user.id || "guest" });
  if (!auth.session)
    response.cookies.set(
      guestCookie,
      auth.guest || randomBytes(32).toString("hex"),
      {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: config.guestCookieDays * 86400,
      },
    );
  return response;
}
const createKeys = [
  "requestId",
  "service",
  "date",
  "time",
  "contact",
  "vehicle",
  "vehicleId",
  "note",
  "acceptTerms",
  "termsVersion",
  "organization",
  "companyName",
  "viewerId",
];
export async function appointmentProxy(
  request: NextRequest,
  action:
    | "list"
    | "availability"
    | "summary"
    | "dashboard"
    | "detail"
    | "create"
    | "reschedule"
    | "status"
    | "closures"
    | "close"
    | "open",
  identifier?: string,
) {
  const auth = await actor();
  const write = ["create", "reschedule", "status", "close", "open"].includes(
    action,
  );
  throttle(
    request,
    write ? "appointments-write" : "appointments-read",
    auth.session?.user.id || auth.guest || "guest",
    write ? 45 : 300,
    write ? 150 : 3000,
  );
  if (identifier && !/^[a-z0-9]{15}$/.test(identifier))
    throw new AccountError(400, "Érvénytelen időpontazonosító.");
  let path = "",
    method = "GET",
    payload: unknown;
  switch (action) {
    case "list":
      path = "";
      break;
    case "availability":
      path = "/availability";
      break;
    case "summary":
      path = "/summary";
      break;
    case "dashboard":
      path = "/dashboard";
      break;
    case "closures":
      path = "/closures";
      break;
    case "detail":
      path = `/${identifier}`;
      break;
    case "create":
      method = "POST";
      payload = await body(request, createKeys);
      break;
    case "reschedule":
      method = "PATCH";
      path = `/${identifier}`;
      payload = await body(
        request,
        createKeys.filter((k) => k !== "requestId").concat(["revision"]),
      );
      break;
    case "status":
      method = "POST";
      path = `/${identifier}/status`;
      payload = await body(request, ["status", "revision"]);
      break;
    case "close":
      method = "PUT";
      path = "/closures";
      payload = await body(request, ["date"]);
      break;
    case "open":
      method = "DELETE";
      path = "/closures";
      payload = await body(request, ["date"]);
      break;
  }
  if (!write) {
    const allowed =
      action === "list"
        ? ["scope", "page", "filter", "status", "q", "from", "to", "date"]
        : action === "availability"
          ? ["service", "exclude"]
          : action === "dashboard"
            ? ["days"]
            : [];
    const params = new URLSearchParams();
    for (const key of allowed) {
      const value = request.nextUrl.searchParams.get(key);
      if (value !== null) {
        if (value.length > 150 || /[\x00-\x1f\x7f]/.test(value))
          throw new AccountError(400, "Érvénytelen keresés.");
        params.set(key, value);
      }
    }
    if (params.size) path += "?" + params;
  }
  return json(
    await requestPB(path, method, payload, auth),
    action === "create" ? 201 : 200,
  );
}
