import "server-only";
import type { NextRequest } from "next/server";
import type { GarageSummary, SavedVehicle } from "../vehicles";
import { normalisePlate } from "../vehicles";
import { AccountError, body, json, text, throttle } from "./http";
import {
  pb,
  PocketBaseError,
  requireSession,
  type Session,
} from "./pocketbase";

type RecordData = Record<string, unknown>;
type Records = {
  items: RecordData[];
  page: number;
  totalItems: number;
  totalPages: number;
};
const recordsPath = "/api/collections/vehicles/records";
const idPattern = /^[a-z0-9]{15}$/;
function identifier(id: string) {
  if (!idPattern.test(id))
    throw new AccountError(400, "Érvénytelen járműazonosító.");
  return id;
}
function vehicle(record: RecordData, defaultId = ""): SavedVehicle {
  const field = (key: string) =>
    typeof record[key] === "string" ? (record[key] as string) : "";
  const expanded = record.expand as { owner?: { name?: unknown } } | undefined;
  return {
    id: field("id"),
    owner: field("owner"),
    plate: field("plate"),
    make: field("make"),
    model: field("model"),
    year: String(record.year ?? ""),
    vin: field("vin"),
    isDefault: record.id === defaultId,
    updated: field("updated"),
    ownerName:
      typeof expanded?.owner?.name === "string" ? expanded.owner.name : "",
  };
}
function filterValue(value: string) {
  return JSON.stringify(value);
}
async function list(
  session: Session,
  filter: string,
  page = 1,
  perPage = 24,
  expand = false,
) {
  const params = new URLSearchParams({
    filter,
    page: String(page),
    perPage: String(perPage),
    sort: "created,id",
  });
  if (expand) params.set("expand", "owner");
  try {
    return await pb<Records>(
      `${recordsPath}?${params}`,
      "GET",
      undefined,
      session.token,
    );
  } catch (error) {
    if (error instanceof PocketBaseError && error.status === 404)
      throw new AccountError(
        503,
        "A járművek mentéséhez az üzemeltetőnek telepítenie kell a járműkezelési migrációt.",
        "vehicles_setup_required",
      );
    throw error;
  }
}
async function ownSummary(session: Session): Promise<GarageSummary> {
  const own = `owner = ${filterValue(session.user.id)}`;
  const listing = await list(session, own, 1, 1);
  let selected = listing.items[0];
  if (
    session.user.defaultVehicle &&
    selected?.id !== session.user.defaultVehicle
  ) {
    const chosen = await list(
      session,
      `${own} && id = ${filterValue(session.user.defaultVehicle)}`,
      1,
      1,
    );
    selected = chosen.items[0] || selected;
  }
  return {
    ownerId: session.user.id,
    totalItems: listing.totalItems,
    defaultVehicle: selected ? vehicle(selected, String(selected.id)) : null,
  };
}
export async function garageSummary(request: NextRequest) {
  const session = await requireSession();
  throttle(request, "vehicles-read", session.user.id, 200, 2000);
  return json(await ownSummary(session));
}
export async function listVehicles(request: NextRequest) {
  const session = await requireSession();
  throttle(request, "vehicles-read", session.user.id, 200, 2000);
  const params = request.nextUrl.searchParams;
  const scope = params.get("scope") || "own";
  if (!["own", "all"].includes(scope))
    throw new AccountError(400, "Érvénytelen lista.");
  if (scope === "all" && session.user.role !== "admin")
    throw new AccountError(403, "Ehhez adminisztrátori jogosultság szükséges.");
  const query = (params.get("q") || "").trim();
  const page = Number(params.get("page") || 1);
  if (
    query.length > 100 ||
    /[\x00-\x1f\x7f]/.test(query) ||
    !Number.isInteger(page) ||
    page < 1 ||
    page > 10000
  )
    throw new AccountError(400, "Érvénytelen keresés vagy oldalszám.");
  let filter =
    scope === "all" ? 'id != ""' : `owner = ${filterValue(session.user.id)}`;
  if (query)
    filter += ` && (plate ~ ${filterValue(normalisePlate(query))} || vin ~ ${filterValue(normalisePlate(query))} || make ~ ${filterValue(query)} || model ~ ${filterValue(query)})`;
  const [result, summary] = await Promise.all([
    list(session, filter, page, 24, scope === "all"),
    ownSummary(session),
  ]);
  return json({
    ...result,
    items: result.items.map((record) =>
      vehicle(record, summary.defaultVehicle?.id),
    ),
  });
}
async function editable(session: Session, id: string) {
  let record: RecordData;
  try {
    record = await pb(
      `${recordsPath}/${identifier(id)}`,
      "GET",
      undefined,
      session.token,
    );
  } catch (error) {
    if (error instanceof PocketBaseError && [403, 404].includes(error.status))
      throw new AccountError(
        404,
        "A jármű nem található vagy nem kezelhető ebben a fiókban.",
      );
    throw error;
  }
  if (record.owner !== session.user.id && session.user.role !== "admin")
    throw new AccountError(
      404,
      "A jármű nem található vagy nem kezelhető ebben a fiókban.",
    );
  return record;
}
async function details(request: NextRequest) {
  const input = await body(request, ["plate", "make", "model", "year", "vin"]);
  const plate = normalisePlate(text(input, "plate", 30, 3));
  const make = text(input, "make", 60, 1),
    model = text(input, "model", 60, 1);
  const year =
    typeof input.year === "number" ||
    (typeof input.year === "string" && /^\d{4}$/.test(input.year))
      ? Number(input.year)
      : NaN;
  if (
    !/^[A-Z0-9]{3,15}$/.test(plate) ||
    !Number.isInteger(year) ||
    year < 1886 ||
    year > new Date().getFullYear() + 1
  )
    throw new AccountError(400, "Ellenőrizd a rendszámot és a gyártási évet.");
  const vin =
    input.vin === undefined
      ? undefined
      : text(input, "vin", 30).toUpperCase().replace(/\s/g, "");
  if (vin && !/^[A-HJ-NPR-Z0-9]{17}$/.test(vin))
    throw new AccountError(
      400,
      "Az alvázszám 17 betű vagy szám; az I, O és Q betű nem használható.",
    );
  return { plate, make, model, year, ...(vin !== undefined ? { vin } : {}) };
}
async function writeVehicle(
  session: Session,
  path: string,
  method: string,
  data?: unknown,
) {
  try {
    return await pb<RecordData>(path, method, data, session.token);
  } catch (error) {
    if (error instanceof PocketBaseError) {
      if (error.status === 404 && method === "POST" && path === recordsPath)
        throw new AccountError(
          503,
          "A járművek mentéséhez az üzemeltetőnek telepítenie kell a járműkezelési migrációt.",
          "vehicles_setup_required",
        );
      if (error.status === 400)
        throw new AccountError(
          400,
          "Nem sikerült menteni. Ellenőrizd az adatokat; ezt a rendszámot már elmenthetted ebben a fiókban.",
        );
      if ([403, 404].includes(error.status))
        throw new AccountError(
          404,
          "A jármű nem található vagy nem kezelhető ebben a fiókban.",
        );
    }
    throw error;
  }
}
export async function createVehicle(request: NextRequest) {
  const session = await requireSession();
  throttle(request, "vehicles-write", session.user.id, 40);
  const data = await details(request);
  // Ownership always comes from the validated session, never the request body.
  const created = await writeVehicle(session, recordsPath, "POST", {
    ...data,
    owner: session.user.id,
  });
  return json({ vehicle: vehicle(created) }, 201);
}
export async function updateVehicle(request: NextRequest, id: string) {
  const session = await requireSession();
  throttle(request, "vehicles-write", session.user.id, 40);
  await editable(session, id);
  const data = await details(request);
  const updated = await writeVehicle(
    session,
    `${recordsPath}/${id}`,
    "PATCH",
    data,
  );
  return json({ vehicle: vehicle(updated) });
}
export async function deleteVehicle(request: NextRequest, id: string) {
  const session = await requireSession();
  throttle(request, "vehicles-write", session.user.id, 40);
  await editable(session, id);
  await writeVehicle(session, `${recordsPath}/${id}`, "DELETE");
  return json({ ok: true });
}
export async function chooseDefaultVehicle(request: NextRequest) {
  const session = await requireSession();
  throttle(request, "vehicles-write", session.user.id, 40);
  const data = await body(request, ["vehicleId"]);
  const id = text(data, "vehicleId", 15, 15);
  const target = await editable(session, id);
  if (target.owner !== session.user.id)
    throw new AccountError(403, "Csak a saját járműved lehet alapértelmezett.");
  try {
    await pb(
      `/api/collections/users/records/${session.user.id}`,
      "PATCH",
      { defaultVehicle: id },
      session.token,
    );
  } catch (error) {
    if (error instanceof PocketBaseError)
      throw new AccountError(
        400,
        "Nem sikerült kiválasztani a járművet. Frissítsd a listát és próbáld újra.",
      );
    throw error;
  }
  return json({ ok: true });
}
