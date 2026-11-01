// CommonJS helpers remain scoped to each PocketBase JS VM. No client-supplied rules or SQL.
const cfg = require(__hooks + "/fairauto-booking.json");
const staffRoles = ["reception", "manager", "admin"];
const statuses = [
  "requested",
  "confirmed",
  "progress",
  "completed",
  "cancelled",
];
const signedRule = '@request.auth.id != "" && @request.auth.active = true';
const staffRule =
  signedRule +
  ' && (@request.auth.role = "reception" || @request.auth.role = "manager" || @request.auth.role = "admin")';
const readRule =
  "(" + signedRule + " && owner = @request.auth.id) || (" + staffRule + ")";
function fail(status, code) {
  throw new ApiError(status, "Appointment request could not be completed.", {
    fairautoCode: new ValidationError(
      code,
      "Appointment request could not be completed.",
    ),
  });
}
function txt(value, max, min = 0, multiline = false) {
  if (
    typeof value !== "string" ||
    value.trim().length < min ||
    value.length > max ||
    (multiline ? /[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]/ : /[\x00-\x1f\x7f]/).test(
      value,
    )
  )
    fail(400, "invalid_details");
  return multiline ? value.replace(/\r\n?/g, "\n").trim() : value.trim();
}
function object(value, keys) {
  if (
    !value ||
    typeof value !== "object" ||
    Array.isArray(value) ||
    Object.keys(value).some((key) => keys.indexOf(key) < 0)
  )
    fail(400, "invalid_details");
  return value;
}
function body(e, keys) {
  if (
    !(e.request.header.get("Content-Type") || "")
      .toLowerCase()
      .startsWith("application/json")
  )
    fail(415, "invalid_details");
  return object(e.requestInfo().body, keys);
}
function id(value) {
  if (typeof value !== "string" || !/^[a-z0-9]{15}$/.test(value))
    fail(400, "invalid_details");
  return value;
}
function vin(value) {
  const result = txt(value, 30, 1).toUpperCase().replace(/\s/g, "");
  if (!/^[A-HJ-NPR-Z0-9]{17}$/.test(result)) fail(400, "invalid_details");
  return result;
}
function minute(value) {
  const a = value.split(":").map(Number);
  return a[0] * 60 + a[1];
}
function timeLabel(value) {
  return (
    String(Math.floor(value / 60)).padStart(2, "0") +
    ":" +
    String(value % 60).padStart(2, "0")
  );
}
function addDays(day, amount) {
  const date = new Date(day + "T12:00:00Z");
  date.setUTCDate(date.getUTCDate() + amount);
  return date.toISOString().slice(0, 10);
}
function validDate(value) {
  return (
    typeof value === "string" &&
    /^\d{4}-\d{2}-\d{2}$/.test(value) &&
    !isNaN(Date.parse(value + "T12:00:00Z")) &&
    new Date(value + "T12:00:00Z").toISOString().slice(0, 10) === value
  );
}
function clock() {
  const t = new DateTime().time().in(new Timezone(cfg.schedule.timeZone));
  return {
    day: t.format("2006-01-02"),
    time: t.format("15:04"),
    year: Number(t.format("2006")),
  };
}
function configuration() {
  const s = cfg.schedule;
  if (
    !Number.isInteger(cfg.guestCookieDays) ||
    cfg.guestCookieDays < 1 ||
    cfg.guestCookieDays > 365
  )
    fail(503, "booking_setup_required");
  if (
    cfg.version !== 1 ||
    !s ||
    s.timeZone !== "Europe/Budapest" ||
    !Number.isInteger(s.capacity) ||
    s.capacity < 1 ||
    s.capacity > 20 ||
    !Number.isInteger(s.horizonDays) ||
    s.horizonDays < 1 ||
    s.horizonDays > 180 ||
    !/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(s.opensAt) ||
    !/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(s.closesAt) ||
    minute(s.opensAt) < 0 ||
    minute(s.closesAt) > 1440 ||
    minute(s.opensAt) >= minute(s.closesAt) ||
    !Number.isInteger(s.slotMinutes) ||
    s.slotMinutes < 15 ||
    !Array.isArray(s.closedWeekdays) ||
    s.closedWeekdays.length > 6 ||
    s.closedWeekdays.some((d) => !Number.isInteger(d) || d < 0 || d > 6) ||
    s.reservationPolicy !== "phone-confirmation"
  )
    fail(503, "booking_setup_required");
  // Minimal Alpine images may lack tzdata; PocketBase silently falls back to UTC.
  // Reject that setup rather than allowing requests against the wrong local clock.
  const timezone = new Timezone(s.timeZone);
  if (
    new DateTime("2026-01-15 12:00:00.000Z")
      .time()
      .in(timezone)
      .format("Z07:00") !== "+01:00" ||
    new DateTime("2026-07-15 12:00:00.000Z")
      .time()
      .in(timezone)
      .format("Z07:00") !== "+02:00"
  )
    fail(503, "booking_setup_required");
  txt(cfg.termsVersion, 100, 1);
  if (
    !Array.isArray(cfg.services) ||
    cfg.services.length < 1 ||
    cfg.services.length > 30
  )
    fail(503, "booking_setup_required");
  const ids = [];
  cfg.services.forEach((item) => {
    if (
      !/^[a-z][a-z0-9_-]{0,39}$/.test(item.id) ||
      ids.indexOf(item.id) >= 0 ||
      !Number.isInteger(item.duration) ||
      item.duration < 15 ||
      item.duration > minute(s.closesAt) - minute(s.opensAt)
    )
      fail(503, "booking_setup_required");
    ids.push(item.id);
    txt(item.name, 100, 1);
    txt(item.priceLabel || "", 100);
  });
  if (
    !Number.isInteger(cfg.guestPendingLimit) ||
    cfg.guestPendingLimit < 1 ||
    cfg.guestPendingLimit > 20 ||
    !Number.isInteger(cfg.accountPendingLimit) ||
    cfg.accountPendingLimit < 1 ||
    cfg.accountPendingLimit > 100
  )
    fail(503, "booking_setup_required");
  return cfg;
}
function compact(rule) {
  return rule == null
    ? ""
    : String(rule).replace(
        /("(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*')|\s+/g,
        (match, quoted) => quoted || "",
      );
}
function setup(app) {
  configuration();
  let a, h, c, limits, mail;
  try {
    a = app.findCollectionByNameOrId("appointments");
    h = app.findCollectionByNameOrId("appointment_events");
    c = app.findCollectionByNameOrId("appointment_closures");
    limits = app.findCollectionByNameOrId("appointment_limits");
    mail = app.findCollectionByNameOrId("appointment_mail");
  } catch {
    fail(503, "booking_setup_required");
  }
  if (
    [a, h, c, limits, mail].some(
      (collection) =>
        collection.createRule != null ||
        collection.updateRule != null ||
        collection.deleteRule != null,
    ) ||
    compact(a.viewRule) !== compact(readRule) ||
    compact(a.listRule) !== compact(readRule) ||
    compact(h.listRule) !== compact(staffRule) ||
    compact(h.viewRule) !== compact(staffRule) ||
    compact(c.listRule) !== compact(staffRule) ||
    compact(c.viewRule) !== compact(staffRule) ||
    limits.listRule != null ||
    limits.viewRule != null ||
    mail.listRule != null ||
    mail.viewRule != null ||
    !a.fields.getByName("guestHash")?.hidden ||
    !a.fields.getByName("price")?.hidden
  )
    fail(503, "booking_setup_required");
}
function guard(app, e, write) {
  const actor = identity(app, e),
    now = Date.now(),
    window = Math.floor(now / 60000);
  const key = $security.sha256(
    (write ? "write:" : "read:") + e.realIP() + ":" + window,
  );
  app.runInTransaction((tx) => {
    tx.db()
      .newQuery("DELETE FROM appointment_limits WHERE expiresAt < {:now}")
      .bind({ now })
      .execute();
    let limit;
    try {
      limit = tx.findFirstRecordByData("appointment_limits", "key", key);
    } catch {
      limit = new Record(tx.findCollectionByNameOrId("appointment_limits"));
      limit.set("key", key);
      limit.set("count", 0);
    }
    if (limit.getInt("count") >= (write ? 120 : 1200))
      fail(429, "rate_limited");
    limit.set("count", limit.getInt("count") + 1);
    limit.set("expiresAt", now + 120000);
    tx.save(limit);
  });
  return actor;
}
function identity(app, e) {
  let user = null;
  if (!e.auth && e.request.header.get("Authorization"))
    fail(401, "session_expired");
  if (e.auth) {
    if (e.auth.collection().name !== "users") fail(403, "forbidden");
    try {
      user = app.findRecordById("users", e.auth.id);
    } catch {
      fail(401, "session_expired");
    }
    if (!user.getBool("active")) fail(401, "session_expired");
  }
  const token = e.request.header.get("X-Fairauto-Guest") || "";
  if (token && !/^[a-f0-9]{64}$/.test(token)) fail(400, "invalid_details");
  return {
    user,
    role: user ? user.getString("role") : "guest",
    guest: token ? $security.sha256(token) : "",
  };
}
function isStaff(actor) {
  return !!actor.user && staffRoles.indexOf(actor.role) >= 0;
}
function staff(actor, manager = false) {
  if (
    !isStaff(actor) ||
    (manager && ["manager", "admin"].indexOf(actor.role) < 0)
  )
    fail(403, "forbidden");
}
function json(record, field) {
  try {
    return JSON.parse(record.getString(field) || "null");
  } catch {
    fail(503, "booking_setup_required");
  }
}
function query(app, sql, params, shape) {
  const rows = arrayOf(new DynamicModel(shape));
  app
    .db()
    .newQuery(sql)
    .bind(params || {})
    .all(rows);
  return rows;
}
function count(app, where, params) {
  const result = new DynamicModel({ total: 0 });
  app
    .db()
    .newQuery("SELECT COUNT(*) AS total FROM appointments WHERE " + where)
    .bind(params || {})
    .one(result);
  return result.total;
}
function dto(record, actor) {
  const confirmed = json(record, "confirmation"),
    vehicle = json(record, "vehicle");
  if (vehicle && typeof vehicle.vin !== "string") vehicle.vin = "";
  return {
    id: record.id,
    bookingFor:
      record.getString("owner") || record.getString("guestHash")
        ? "self"
        : "customer",
    reference: record.getString("reference"),
    owner: record.getString("owner") || null,
    organization: record.getBool("organization"),
    companyName: record.getString("companyName"),
    service: record.getString("service"),
    serviceName: record.getString("serviceName"),
    priceLabel: record.getString("priceLabel"),
    price: json(record, "price"),
    date: record.getString("date"),
    time: record.getString("time"),
    duration: record.getInt("duration"),
    contact: json(record, "contact"),
    vehicle,
    vehicleId: record.getString("vehicleId"),
    note: record.getString("note"),
    status: record.getString("status"),
    revision: record.getInt("revision"),
    created: record.getString("created"),
    updated: record.getString("updated"),
    legalAcknowledgement: {
      termsVersion: record.getString("termsVersion"),
      privacyNoticeVersion: record.getString("termsVersion"),
      acceptedAt: record.getString("termsAcceptedAt"),
      mode: "live",
    },
    confirmation: confirmed
      ? {
          method: "phone",
          at: confirmed.at,
          actorId: isStaff(actor) ? confirmed.actorId : "",
          actorName: isStaff(actor) ? confirmed.actorName : "",
        }
      : undefined,
  };
}
function accessible(app, actor, identifier) {
  let record;
  try {
    record = app.findRecordById("appointments", id(identifier));
  } catch {
    fail(404, "appointment_missing");
  }
  if (
    !isStaff(actor) &&
    !(actor.user && record.getString("owner") === actor.user.id) &&
    !(
      !actor.user &&
      !record.getString("owner") &&
      actor.guest &&
      $security.equal(record.getString("guestHash"), actor.guest) &&
      Date.parse(record.getString("guestExpiresAt").replace(" ", "T")) >
        Date.now()
    )
  )
    fail(404, "appointment_missing");
  return record;
}
function audit(app, record, actor, action, change) {
  const event = new Record(app.findCollectionByNameOrId("appointment_events"));
  event.set("appointment", record.id);
  event.set("action", action);
  event.set("revision", record.getInt("revision"));
  event.set("actorId", actor.user?.id || "");
  event.set("actorName", actor.user?.getString("name") || "Vendég");
  event.set("actorRole", actor.role);
  event.set("change", change);
  app.save(event);
  require(__hooks + "/fairauto-mail.js").enqueue(app, record, action);
}
function openDay(app, day) {
  const now = clock();
  if (
    !validDate(day) ||
    day < now.day ||
    day > addDays(now.day, cfg.schedule.horizonDays) ||
    cfg.schedule.closedWeekdays.indexOf(
      new Date(day + "T12:00:00Z").getUTCDay(),
    ) >= 0
  )
    return false;
  const row = new DynamicModel({ total: 0 });
  app
    .db()
    .newQuery(
      "SELECT COUNT(*) AS total FROM appointment_closures WHERE date = {:day}",
    )
    .bind({ day })
    .one(row);
  return row.total === 0;
}
function occupied(app, day, exclude) {
  const condition = "status IN ('confirmed','progress','completed')";
  return query(
    app,
    "SELECT startMinute,endMinute FROM appointments WHERE date = {:day} AND id != {:exclude} AND " +
      condition,
    { day, exclude: exclude || "" },
    { startMinute: 0, endMinute: 0 },
  );
}
function hasCapacity(rows, start, duration) {
  const end = start + duration,
    overlapping = rows.filter(
      (r) => r.startMinute < end && r.endMinute > start,
    );
  const points = [start].concat(
    overlapping.map((r) => r.startMinute).filter((v) => v >= start),
  );
  return points.every(
    (point) =>
      overlapping.filter((r) => r.startMinute <= point && r.endMinute > point)
        .length < cfg.schedule.capacity,
  );
}
function slot(app, day, time, duration, exclude) {
  const s = cfg.schedule,
    now = clock(),
    start = minute(time);
  if (
    !/^\d{2}:\d{2}$/.test(time) ||
    !openDay(app, day) ||
    start < minute(s.opensAt) ||
    start + duration > minute(s.closesAt) ||
    (start - minute(s.opensAt)) % s.slotMinutes !== 0 ||
    (day === now.day && time <= now.time)
  )
    fail(409, "slot_unavailable");
  if (!hasCapacity(occupied(app, day, exclude), start, duration))
    fail(409, "slot_taken");
}
function bookingFor(actor, data) {
  const mode =
    data.bookingFor === undefined
      ? isStaff(actor)
        ? "customer"
        : "self"
      : data.bookingFor;
  if (["self", "customer"].indexOf(mode) < 0) fail(400, "invalid_details");
  if (mode === "customer" && !isStaff(actor)) fail(403, "forbidden");
  return mode;
}
function details(app, actor, data) {
  const mode = bookingFor(actor, data);
  if (data.viewerId !== (actor.user ? actor.user.id : "guest"))
    fail(409, "session_changed");
  const service = cfg.services.find((item) => item.id === data.service);
  if (!service || data.acceptTerms !== true) fail(400, "invalid_details");
  if (data.termsVersion !== cfg.termsVersion) fail(409, "terms_changed");
  const contact = object(data.contact, [
    "name",
    "email",
    "phone",
    "city",
    "reminders",
  ]);
  const email = txt(contact.email, 254, 3).toLowerCase(),
    phone = txt(contact.phone, 25, 7);
  if (
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
    !/^\+?[\d ()-]{7,25}$/.test(phone) ||
    phone.replace(/\D/g, "").length < 7
  )
    fail(400, "invalid_details");
  const cleanContact = {
    name: txt(contact.name, 100, 2),
    email,
    phone,
    city: txt(contact.city, 100, 1),
    reminders: false,
  };
  let car,
    vehicleId = "";
  if (data.vehicleId) {
    if (!actor.user || mode !== "self") fail(400, "invalid_details");
    let saved;
    try {
      saved = app.findRecordById("vehicles", id(data.vehicleId));
    } catch {
      fail(404, "vehicle_missing");
    }
    if (saved.getString("owner") !== actor.user.id)
      fail(404, "vehicle_missing");
    car = {
      plate: saved.getString("plate"),
      make: saved.getString("make"),
      model: saved.getString("model"),
      year: String(saved.getInt("year")),
      vin: vin(saved.getString("vin")),
    };
    const preview = object(data.vehicle, [
      "plate",
      "make",
      "model",
      "year",
      "vin",
    ]);
    if (
      typeof preview.plate !== "string" ||
      preview.plate.trim().toUpperCase().replace(/[\s-]/g, "") !== car.plate ||
      preview.make !== car.make ||
      preview.model !== car.model ||
      String(preview.year) !== car.year ||
      vin(preview.vin) !== car.vin
    )
      fail(409, "vehicle_changed");
    vehicleId = saved.id;
  } else {
    const vehicle = object(data.vehicle, [
      "plate",
      "make",
      "model",
      "year",
      "vin",
    ]);
    const plate = txt(vehicle.plate, 30, 3).toUpperCase().replace(/[\s-]/g, "");
    if (!(
      typeof vehicle.year === "number" ||
      (typeof vehicle.year === "string" && /^\d{4}$/.test(vehicle.year))
    ))
      fail(400, "invalid_details");
    const year = Number(vehicle.year);
    if (
      !/^[A-Z0-9]{3,15}$/.test(plate) ||
      !Number.isInteger(year) ||
      year < 1886 ||
      year > clock().year + 1
    )
      fail(400, "invalid_details");
    car = {
      plate,
      make: txt(vehicle.make, 60, 1),
      model: txt(vehicle.model, 60, 1),
      year: String(year),
      vin: vin(vehicle.vin),
    };
  }
  if (!validDate(data.date)) fail(400, "invalid_details");
  const time = txt(data.time, 5, 5),
    organization =
      actor.role === "partner" ||
      (isStaff(actor) && mode === "customer" && data.organization === true);
  if (data.organization !== undefined && typeof data.organization !== "boolean")
    fail(400, "invalid_details");
  if (data.organization === true && !organization) fail(403, "forbidden");
  return {
    service: service.id,
    serviceName: service.name,
    priceLabel: service.priceLabel || "",
    date: data.date,
    time,
    duration: service.duration,
    startMinute: minute(time),
    endMinute: minute(time) + service.duration,
    contact: cleanContact,
    vehicle: car,
    vehicleId,
    note: txt(data.note || "", 1500, 0, true),
    organization,
    companyName: organization
      ? isStaff(actor)
        ? txt(data.companyName || "", 120)
        : actor.user.getString("companyName") || actor.user.getString("name")
      : "",
    termsVersion: cfg.termsVersion,
  };
}
function setDetails(record, data) {
  Object.keys(data).forEach((key) => record.set(key, data[key]));
  record.set("termsAcceptedAt", new Date().toISOString());
}
function revision(data, record) {
  if (
    !Number.isInteger(data.revision) ||
    data.revision !== record.getInt("revision")
  )
    fail(409, "appointment_changed");
}
function future(record) {
  const now = clock();
  return (
    record.getString("date") > now.day ||
    (record.getString("date") === now.day &&
      record.getString("time") > now.time)
  );
}
// Hash the caller's intent before looking up mutable vehicles or current services.
// A retry of an already committed request must survive later profile/config changes.
function intent(data) {
  if (data.acceptTerms !== true) fail(400, "invalid_details");
  const c = object(data.contact, [
      "name",
      "email",
      "phone",
      "city",
      "reminders",
    ]),
    v = object(data.vehicle, ["plate", "make", "model", "year", "vin"]);
  if (!(
    typeof v.year === "number" ||
    (typeof v.year === "string" && /^\d{4}$/.test(v.year))
  ))
    fail(400, "invalid_details");
  return {
    viewerId: txt(data.viewerId, 15, 5),
    service: txt(data.service, 40, 1),
    date: txt(data.date, 10, 10),
    time: txt(data.time, 5, 5),
    contact: {
      name: txt(c.name, 100, 2),
      email: txt(c.email, 254, 3).toLowerCase(),
      phone: txt(c.phone, 25, 7),
      city: txt(c.city, 100, 1),
    },
    vehicle: {
      plate: txt(v.plate, 30, 3).toUpperCase().replace(/[\s-]/g, ""),
      make: txt(v.make, 60, 1),
      model: txt(v.model, 60, 1),
      year: String(v.year),
      vin: vin(v.vin),
    },
    vehicleId: txt(data.vehicleId || "", 15),
    note: txt(data.note || "", 1500, 0, true),
    termsVersion: txt(data.termsVersion, 100, 1),
    organization: data.organization === true,
    companyName: txt(data.companyName || "", 120),
    ...(data.bookingFor !== undefined
      ? { bookingFor: txt(data.bookingFor, 8, 4) }
      : {}),
  };
}
function scope(actor, all) {
  if (all) {
    staff(actor);
    return { where: "1=1", params: {} };
  }
  if (actor.user)
    return { where: "owner = {:viewer}", params: { viewer: actor.user.id } };
  return {
    where:
      "owner = '' AND guestHash = {:viewer} AND guestHash != '' AND julianday(guestExpiresAt) > julianday({:expiresNow})",
    params: { viewer: actor.guest, expiresNow: new Date().toISOString() },
  };
}
exports.configRoute = (e) => {
  setup($app);
  guard($app, e, false);
  return e.json(200, configuration());
};
exports.availabilityRoute = (e) => {
  setup($app);
  const actor = guard($app, e, false),
    q = e.request.url.query(),
    service = cfg.services.find((s) => s.id === q.get("service"));
  if (!service) fail(400, "invalid_details");
  const exclude = q.get("exclude") || "";
  if (exclude) accessible($app, actor, exclude);
  const now = clock(),
    days = {},
    times = [];
  for (
    let start = minute(cfg.schedule.opensAt);
    start < minute(cfg.schedule.closesAt);
    start += cfg.schedule.slotMinutes
  )
    times.push(timeLabel(start));
  for (let n = 0; n <= cfg.schedule.horizonDays; n++) {
    const day = addDays(now.day, n);
    days[day] = [];
    if (!openDay($app, day)) continue;
    const rows = occupied($app, day, exclude);
    days[day] = times.filter(
      (t) =>
        minute(t) + service.duration <= minute(cfg.schedule.closesAt) &&
        !(day === now.day && t <= now.time) &&
        hasCapacity(rows, minute(t), service.duration),
    );
  }
  return e.json(200, { days, times, today: now.day });
};
const detailKeys = [
  "viewerId",
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
];
exports.createRoute = (e) => {
  setup($app);
  guard($app, e, true);
  const data = body(e, detailKeys.concat(["requestId"]));
  if (
    typeof data.requestId !== "string" ||
    !/^[a-f0-9-]{36}$/.test(data.requestId)
  )
    fail(400, "invalid_details");
  let result;
  $app.runInTransaction((tx) => {
    const actor = identity(tx, e);
    if (!actor.user && !actor.guest) fail(400, "guest_session_required");
    if (data.viewerId !== (actor.user ? actor.user.id : "guest"))
      fail(409, "session_changed");
    const hash = $security.sha256(JSON.stringify(intent(data)));
    const requestHash = $security.sha256(
      (actor.user ? "user:" + actor.user.id : "guest:" + actor.guest) +
        ":" +
        data.requestId,
    );
    const existing = query(
      tx,
      "SELECT id FROM appointments WHERE requestHash = {:key}",
      { key: requestHash },
      { id: "" },
    );
    if (existing.length) {
      const record = accessible(tx, actor, existing[0].id);
      if (record.getString("payloadHash") !== hash) fail(409, "request_reused");
      result = dto(record, actor);
      return;
    }
    const clean = details(tx, actor, data);
    slot(tx, clean.date, clean.time, clean.duration);
    const contactKey = $security.sha256(
      clean.contact.email + ":" + clean.contact.phone.replace(/\D/g, ""),
    );
    const openCount = count(
      tx,
      "contactKey = {:key} AND date >= {:today} AND status IN ('requested','confirmed')",
      { key: contactKey, today: clock().day },
    );
    if (
      !isStaff(actor) &&
      openCount >=
        (actor.user ? cfg.accountPendingLimit : cfg.guestPendingLimit)
    )
      fail(429, "pending_limit");
    const record = new Record(tx.findCollectionByNameOrId("appointments"));
    record.id = $security.randomStringWithAlphabet(
      15,
      "abcdefghijklmnopqrstuvwxyz0123456789",
    );
    setDetails(record, clean);
    record.set("reference", "FA-" + record.id.toUpperCase());
    record.set(
      "owner",
      actor.user && bookingFor(actor, data) === "self" ? actor.user.id : "",
    );
    record.set("createdBy", actor.user?.id || "");
    record.set("guestHash", !actor.user ? actor.guest : "");
    if (!actor.user)
      record.set(
        "guestExpiresAt",
        new Date(Date.now() + cfg.guestCookieDays * 86400000).toISOString(),
      );
    record.set("requestHash", requestHash);
    record.set("payloadHash", hash);
    record.set("contactKey", contactKey);
    record.set("status", "requested");
    record.set("revision", 1);
    tx.save(record);
    audit(tx, record, actor, "requested", {
      date: clean.date,
      time: clean.time,
      status: "requested",
    });
    result = dto(record, actor);
  });
  return e.json(201, { appointment: result });
};
exports.rescheduleRoute = (e) => {
  setup($app);
  guard($app, e, true);
  const data = body(e, detailKeys.concat(["revision"]));
  let result;
  $app.runInTransaction((tx) => {
    const actor = identity(tx, e),
      record = accessible(tx, actor, e.request.pathValue("id"));
    revision(data, record);
    if (
      isStaff(actor) &&
      data.bookingFor !== undefined &&
      data.bookingFor !==
        (record.getString("owner") === actor.user.id ? "self" : "customer")
    )
      fail(403, "forbidden");
    if (
      ["requested", "confirmed"].indexOf(record.getString("status")) < 0 ||
      (!isStaff(actor) && !future(record))
    )
      fail(409, "transition_invalid");
    const clean = details(tx, actor, data);
    slot(tx, clean.date, clean.time, clean.duration, record.id);
    const before = {
      date: record.getString("date"),
      time: record.getString("time"),
      status: record.getString("status"),
    };
    setDetails(record, clean);
    if (!actor.user)
      record.set(
        "guestExpiresAt",
        new Date(Date.now() + cfg.guestCookieDays * 86400000).toISOString(),
      );
    record.set("status", "requested");
    record.set("confirmation", null);
    record.set("price", null);
    record.set("revision", record.getInt("revision") + 1);
    record.set(
      "contactKey",
      $security.sha256(
        clean.contact.email + ":" + clean.contact.phone.replace(/\D/g, ""),
      ),
    );
    tx.save(record);
    audit(tx, record, actor, "rescheduled", {
      before,
      after: { date: clean.date, time: clean.time, status: "requested" },
    });
    result = dto(record, actor);
  });
  return e.json(200, { appointment: result });
};
exports.statusRoute = (e) => {
  setup($app);
  guard($app, e, true);
  const data = body(e, ["status", "revision"]);
  let result;
  $app.runInTransaction((tx) => {
    const actor = identity(tx, e),
      record = accessible(tx, actor, e.request.pathValue("id")),
      next = data.status,
      current = record.getString("status");
    if (statuses.indexOf(next) < 0 || next === "requested")
      fail(400, "invalid_details");
    if (next !== "cancelled")
      staff(actor, ["progress", "completed"].indexOf(next) >= 0);
    if (current === next) {
      result = dto(record, actor);
      return;
    }
    if (
      !isStaff(actor) &&
      (!future(record) || ["requested", "confirmed"].indexOf(current) < 0)
    )
      fail(409, "transition_invalid");
    revision(data, record);
    const allowed = {
      requested: ["confirmed", "cancelled"],
      confirmed: ["progress", "cancelled"],
      progress: ["completed"],
      completed: [],
      cancelled: [],
    };
    if (allowed[current].indexOf(next) < 0) fail(409, "transition_invalid");
    if (next === "confirmed") {
      slot(
        tx,
        record.getString("date"),
        record.getString("time"),
        record.getInt("duration"),
        record.id,
      );
      record.set("confirmation", {
        method: "phone",
        at: new Date().toISOString(),
        actorId: actor.user.id,
        actorName: actor.user.getString("name"),
      });
    }
    record.set("status", next);
    record.set("revision", record.getInt("revision") + 1);
    tx.save(record);
    audit(tx, record, actor, next, { before: current, after: next });
    result = dto(record, actor);
  });
  return e.json(200, { appointment: result });
};
exports.listRoute = (e) => {
  setup($app);
  const actor = guard($app, e, false),
    q = e.request.url.query(),
    all = q.get("scope") === "staff",
    selection = scope(actor, all),
    params = selection.params;
  const page = Number(q.get("page") || 1),
    filter = q.get("filter") || "all",
    state = q.get("status") || "",
    search = txt(q.get("q") || "", 100);
  if (
    !Number.isInteger(page) ||
    page < 1 ||
    page > 10000 ||
    ["all", "upcoming", "past"].indexOf(filter) < 0 ||
    (state && statuses.indexOf(state) < 0)
  )
    fail(400, "invalid_details");
  let where = selection.where;
  params.today = clock().day;
  if (filter === "upcoming")
    where +=
      " AND date >= {:today} AND status NOT IN ('cancelled','completed')";
  if (filter === "past")
    where += " AND (date < {:today} OR status IN ('cancelled','completed'))";
  if (state) {
    where += " AND status = {:state}";
    params.state = state;
  }
  for (const key of ["from", "to", "date"]) {
    const value = q.get(key);
    if (value) {
      if (!validDate(value)) fail(400, "invalid_details");
      where +=
        " AND date " +
        (key === "from" ? ">=" : key === "to" ? "<=" : "=") +
        " {:" +
        key +
        "}";
      params[key] = value;
    }
  }
  if (search) {
    where +=
      " AND (reference LIKE {:search} OR json_extract(contact,'$.name') LIKE {:search} OR json_extract(vehicle,'$.plate') LIKE {:plate} OR json_extract(vehicle,'$.make') LIKE {:search})";
    params.search = "%" + search + "%";
    params.plate = "%" + search.toUpperCase().replace(/[\s-]/g, "") + "%";
  }
  const totalItems = count($app, where, params),
    direction = filter === "past" ? "DESC" : "ASC";
  const ids = query(
    $app,
    "SELECT id FROM appointments WHERE " +
      where +
      " ORDER BY date " +
      direction +
      ", time " +
      direction +
      ", id ASC LIMIT 24 OFFSET {:offset}",
    Object.assign({}, params, { offset: (page - 1) * 24 }),
    { id: "" },
  );
  return e.json(200, {
    page,
    totalItems,
    totalPages: Math.ceil(totalItems / 24),
    items: ids.map((row) =>
      dto($app.findRecordById("appointments", row.id), actor),
    ),
  });
};
exports.detailRoute = (e) => {
  setup($app);
  const actor = guard($app, e, false),
    record = accessible($app, actor, e.request.pathValue("id"));
  const history = query(
    $app,
    "SELECT action,created,change,actorName FROM appointment_events WHERE appointment = {:id} ORDER BY revision ASC,created ASC,id ASC",
    { id: record.id },
    { action: "", created: "", change: "", actorName: "" },
  );
  return e.json(200, {
    appointment: dto(record, actor),
    history: history.map((item) => ({
      action: item.action,
      at: item.created,
      change: JSON.parse(item.change),
      actorName: isStaff(actor) ? item.actorName : "",
    })),
  });
};
exports.summaryRoute = (e) => {
  setup($app);
  const actor = guard($app, e, false),
    selection = scope(actor, false),
    where =
      selection.where +
      " AND date >= {:today} AND status NOT IN ('cancelled','completed')",
    params = Object.assign({}, selection.params, { today: clock().day });
  const ids = query(
    $app,
    "SELECT id FROM appointments WHERE " +
      where +
      " ORDER BY date,time,id LIMIT 1",
    params,
    { id: "" },
  );
  return e.json(200, {
    viewer: actor.user?.id || "guest",
    upcomingCount: count($app, where, params),
    next: ids.length
      ? dto($app.findRecordById("appointments", ids[0].id), actor)
      : null,
  });
};
exports.closuresRoute = (e) => {
  setup($app);
  const actor = guard($app, e, false);
  staff(actor);
  return e.json(200, {
    dates: query(
      $app,
      "SELECT date FROM appointment_closures ORDER BY date",
      {},
      { date: "" },
    ).map((r) => r.date),
  });
};
function closureChange(e, close) {
  setup($app);
  guard($app, e, true);
  const data = body(e, ["date"]);
  if (!validDate(data.date)) fail(400, "invalid_details");
  $app.runInTransaction((tx) => {
    const actor = identity(tx, e);
    staff(actor, true);
    const existing = query(
      tx,
      "SELECT id FROM appointment_closures WHERE date = {:date}",
      { date: data.date },
      { id: "" },
    );
    if (close && !existing.length) {
      const record = new Record(
        tx.findCollectionByNameOrId("appointment_closures"),
      );
      record.set("date", data.date);
      record.set("actorId", actor.user.id);
      tx.save(record);
    } else if (!close && existing.length)
      tx.delete(tx.findRecordById("appointment_closures", existing[0].id));
  });
  return e.json(200, { ok: true });
}
exports.closeRoute = (e) => closureChange(e, true);
exports.openRoute = (e) => closureChange(e, false);
exports.dashboardRoute = (e) => {
  setup($app);
  const actor = guard($app, e, false);
  staff(actor, true);
  const period = Number(e.request.url.query().get("days") || 7);
  if ([7, 30].indexOf(period) < 0) fail(400, "invalid_details");
  const start = clock().day,
    end = addDays(start, period - 1),
    params = { start, end };
  const totals = new DynamicModel({
    active: 0,
    minutes: 0,
    reservedMinutes: 0,
    partners: 0,
    customers: 0,
    guests: 0,
  });
  $app
    .db()
    .newQuery(
      "SELECT COUNT(*) AS active,COALESCE(SUM(duration),0) AS minutes,COALESCE(SUM(CASE WHEN status IN ('confirmed','progress','completed') THEN duration ELSE 0 END),0) AS reservedMinutes,COALESCE(SUM(organization=1),0) AS partners,COALESCE(SUM(organization=0 AND owner!=''),0) AS customers,COALESCE(SUM(organization=0 AND owner=''),0) AS guests FROM appointments WHERE date >= {:start} AND date <= {:end} AND status != 'cancelled'",
    )
    .bind(params)
    .one(totals);
  const days = query(
    $app,
    "SELECT date,COUNT(*) AS total FROM appointments WHERE date >= {:start} AND date <= {:end} AND status != 'cancelled' GROUP BY date",
    params,
    { date: "", total: 0 },
  );
  const closures = query(
    $app,
    "SELECT date FROM appointment_closures WHERE date >= {:start} AND date <= {:end}",
    params,
    { date: "" },
  ).map((row) => row.date);
  let workingDays = 0;
  for (let i = 0; i < period; i++) {
    const day = addDays(start, i);
    if (
      cfg.schedule.closedWeekdays.indexOf(
        new Date(day + "T12:00Z").getUTCDay(),
      ) < 0 &&
      closures.indexOf(day) < 0
    )
      workingDays++;
  }
  return e.json(200, {
    start,
    end,
    totals,
    days,
    closures,
    workingDays,
    waiting: count($app, "status = 'requested'", {}),
    capacity: cfg.schedule.capacity,
    workMinutes: minute(cfg.schedule.closesAt) - minute(cfg.schedule.opensAt),
  });
};

exports.priceRoute = (e) => {
  setup($app);
  guard($app, e, true);
  const data = body(e, ["mode", "totalHuf", "items", "note", "revision"]);
  let result;
  $app.runInTransaction((tx) => {
    const actor = identity(tx, e);
    staff(actor);
    const record = accessible(tx, actor, e.request.pathValue("id"));
    revision(data, record);
    if (
      ["confirmed", "progress", "completed"].indexOf(
        record.getString("status"),
      ) < 0
    )
      fail(409, "transition_invalid");
    const money = (amount) => {
      if (!Number.isSafeInteger(amount) || amount < 0 || amount > 1000000000)
        fail(400, "invalid_details");
      return amount;
    };
    let total,
      items = [];
    if (data.mode === "total") {
      if (
        data.items !== undefined &&
        (!Array.isArray(data.items) || data.items.length)
      )
        fail(400, "invalid_details");
      total = money(data.totalHuf);
    } else if (data.mode === "itemized") {
      if (
        data.totalHuf !== undefined ||
        !Array.isArray(data.items) ||
        !data.items.length ||
        data.items.length > 30
      )
        fail(400, "invalid_details");
      items = data.items.map((input) => {
        const line = object(input, [
          "kind",
          "description",
          "quantity",
          "unitPriceHuf",
        ]);
        if (
          ["part", "labour", "other"].indexOf(line.kind) < 0 ||
          !Number.isInteger(line.quantity) ||
          line.quantity < 1 ||
          line.quantity > 1000
        )
          fail(400, "invalid_details");
        return {
          kind: line.kind,
          description: txt(line.description, 160, 1),
          quantity: line.quantity,
          unitPriceHuf: money(line.unitPriceHuf),
        };
      });
      total = money(
        items.reduce((sum, line) => sum + line.quantity * line.unitPriceHuf, 0),
      );
    } else fail(400, "invalid_details");
    const clean = {
      mode: data.mode,
      totalHuf: total,
      items,
      note: txt(data.note || "", 1000, 0, true),
    };
    const previous = json(record, "price");
    const fingerprint = (value) =>
      JSON.stringify({
        mode: value.mode,
        totalHuf: value.totalHuf,
        items: value.items.map((line) => ({
          kind: line.kind,
          description: line.description,
          quantity: line.quantity,
          unitPriceHuf: line.unitPriceHuf,
        })),
        note: value.note,
      });
    if (
      previous &&
      Array.isArray(previous.items) &&
      fingerprint(previous) === fingerprint(clean)
    ) {
      result = dto(record, actor);
      return;
    }
    record.set(
      "price",
      Object.assign({}, clean, { updatedAt: new Date().toISOString() }),
    );
    record.set("revision", record.getInt("revision") + 1);
    tx.save(record);
    audit(tx, record, actor, "price_updated", {
      before: previous,
      after: json(record, "price"),
    });
    result = dto(record, actor);
  });
  return e.json(200, { appointment: result });
};

exports.mailStatusRoute = (e) => {
  setup($app);
  const actor = guard($app, e, false);
  if (actor.role !== "admin") fail(403, "forbidden");
  return e.json(200, require(__hooks + "/fairauto-mail.js").status($app));
};
exports.mailRetryRoute = (e) => {
  setup($app);
  guard($app, e, true);
  body(e, []);
  let result;
  $app.runInTransaction((tx) => {
    const actor = identity(tx, e);
    if (actor.role !== "admin") fail(403, "forbidden");
    result = require(__hooks + "/fairauto-mail.js").retry(tx);
  });
  return e.json(200, result);
};
