import "server-only";
import { randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";
import type { BookingConfiguration } from "../live-appointments";
import { site, serviceOptions, contactPhones } from "@/content/site";
import { AccountError, body, json, throttle, readLimitedBody } from "./http";
import { servicePriceBody } from "./service-documents";
import { SERVICE_DOCUMENT_LIMIT } from "../service-documents";
import {
  currentSession,
  pb,
  pbDocument,
  PocketBaseError,
  sessionCookie,
} from "./pocketbase";

const guestCookie =
  process.env.NODE_ENV === "production"
    ? "__Host-fairauto_guest"
    : "fairauto_guest";
const root = "/api/fairauto/appointments";
const messages: Record<string, string> = {
  invalid_document:
    "Egy PDF, JPG vagy PNG melléklet tölthető fel, legfeljebb 3 MB méretben.",
  documents_setup_required:
    "A dokumentumfeltöltéshez telepítsd a legújabb PocketBase frissítést.",
  service_unavailable:
    "Ez a szolgáltatás nem foglalható online. Válassz másik szolgáltatást.",
  service_phone_only: `Műszaki vizsgára kizárólag telefonon kérhetsz időpontot: ${contactPhones.map((phone) => phone.label).join(" vagy ")}.`,
  mail_disabled:
    "Az időpontértesítések ki vannak kapcsolva. Előbb engedélyezd a levelezést.",
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
function requireOnlineService(id: unknown) {
  const service = serviceOptions.find((item) => item.id === id);
  if (!service)
    throw new AccountError(
      400,
      messages.service_unavailable,
      "service_unavailable",
    );
  if (service.bookingMode === "phone")
    throw new AccountError(
      400,
      messages.service_phone_only,
      "service_phone_only",
    );
}
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
      if (
        error.status === 404 &&
        !path.match(/^\/[a-z0-9]{15}(\/(status|price))?$/)
      )
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
  const user = auth.session?.user;
  // Apply the current website's catalogue while the homelab config is being updated.
  config.services = config.services.flatMap((service) => {
    const current = serviceOptions.find((item) => item.id === service.id);
    return current
      ? [
          {
            ...service,
            bookingMode: current.bookingMode,
            description: current.description,
          },
        ]
      : [];
  });
  config.phoneContacts = contactPhones;
  const response = json({
    config,
    viewer: user?.id || "guest",
    prefill: user
      ? {
          contact: {
            name: user.name,
            email: user.email,
            phone: user.phone,
            city: user.city,
            reminders: false,
          },
          companyName: user.companyName,
        }
      : null,
  });
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
  "bookingFor",
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
    | "mailStatus"
    | "mailRetry"
    | "dashboard"
    | "detail"
    | "create"
    | "reschedule"
    | "status"
    | "price"
    | "closures"
    | "close"
    | "open",
  identifier?: string,
) {
  const auth = await actor();
  const write = [
    "create",
    "reschedule",
    "status",
    "mailRetry",
    "price",
    "close",
    "open",
  ].includes(action);
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
      requireOnlineService(request.nextUrl.searchParams.get("service"));
      path = "/availability";
      break;
    case "summary":
      path = "/summary";
      break;
    case "mailStatus":
      path = "/mail-status";
      break;
    case "mailRetry":
      path = "/mail-retry";
      method = "POST";
      payload = await body(request, []);
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
      requireOnlineService((payload as Record<string, unknown>).service);
      break;
    case "reschedule":
      method = "PATCH";
      path = `/${identifier}`;
      payload = await body(
        request,
        createKeys.filter((k) => k !== "requestId").concat(["revision"]),
      );
      requireOnlineService((payload as Record<string, unknown>).service);
      break;
    case "status":
      method = "POST";
      path = `/${identifier}/status`;
      payload = await body(request, ["status", "revision"]);
      break;
    case "price":
      if (
        !auth.session ||
        !["reception", "manager", "admin"].includes(auth.session.user.role)
      )
        throw new AccountError(403, messages.forbidden);
      method = "PUT";
      path = `/${identifier}/price`;
      payload = await servicePriceBody(request);
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

export async function appointmentDocument(
  request: NextRequest,
  identifier: string,
  document: string,
) {
  if (![identifier, document].every((value) => /^[a-z0-9]{15}$/.test(value)))
    throw new AccountError(404, messages.appointment_missing);
  const auth = await actor();
  throttle(
    request,
    "appointment-documents",
    auth.session?.user.id || auth.guest || "guest",
    120,
    1200,
  );
  let response: Response;
  try {
    response = await pbDocument(
      `${root}/${identifier}/documents/${document}`,
      auth.session?.token,
      auth.guest,
    );
  } catch (error) {
    if (error instanceof PocketBaseError)
      throw new AccountError(error.status, messages.appointment_missing);
    throw error;
  }
  const bytes = await readLimitedBody(response.body, SERVICE_DOCUMENT_LIMIT);
  const disposition = response.headers.get("content-disposition") || "";
  return new NextResponse(new Uint8Array(bytes), {
    headers: {
      "Content-Type": response.headers.get("content-type")!,
      "Content-Disposition":
        /^attachment; filename="[a-zA-Z0-9._ -]{1,120}"$/.test(disposition)
          ? disposition
          : 'attachment; filename="document"',
      "Cache-Control": "private, no-store, max-age=0",
      Vary: "Cookie",
      "X-Content-Type-Options": "nosniff",
      "Content-Security-Policy": "default-src 'none'; sandbox",
      "Referrer-Policy": "no-referrer",
      "Cross-Origin-Resource-Policy": "same-origin",
    },
  });
}
