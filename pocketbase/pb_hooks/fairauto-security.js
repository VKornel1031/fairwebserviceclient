// Shared SQLite counters cover native requests and every frontend server instance.
// Store only purpose-separated hashes, never email addresses, passwords or tokens.
function key(category, value) {
  return $security.sha256(category + ":" + value.trim().toLowerCase());
}
function clearCounter(app, category, value) {
  app
    .db()
    .newQuery("DELETE FROM security_limits WHERE key = {:key}")
    .bind({ key: key(category, value) })
    .execute();
}
exports.ready = (app) => {
  const limits = app.findCollectionByNameOrId("security_limits");
  const eligible = "@request.auth.emailVerificationRequired = false";
  return (
    app.settings().rateLimits.enabled &&
    !app.findCollectionByNameOrId("users").fields.getByName("adminPassword") &&
    !app.settings().batch.enabled &&
    ["listRule", "viewRule", "createRule", "updateRule", "deleteRule"].every(
      (name) => limits[name] == null,
    ) &&
    [
      "users",
      "vehicles",
      "appointments",
      "appointment_events",
      "appointment_closures",
    ].every(
      (name) =>
        String(app.findCollectionByNameOrId(name).viewRule).indexOf(
          eligible,
        ) !== -1,
    ) &&
    app
      .cron()
      .jobs()
      .some((job) => job.id() === "fairauto-security-cleanup")
  );
};
exports.consume = (app, category, value, maximum, seconds = 900) => {
  const hash = key(category, value),
    now = Date.now();
  let denied = false;
  app.runInTransaction((tx) => {
    tx.db()
      .newQuery("DELETE FROM security_limits WHERE expiresAt <= {:now}")
      .bind({ now })
      .execute();
    const rows = tx.findRecordsByFilter(
      "security_limits",
      "key = {:key}",
      "",
      1,
      0,
      { key: hash },
    );
    const record =
      rows[0] || new Record(tx.findCollectionByNameOrId("security_limits"));
    if (record.getInt("count") >= maximum) {
      denied = true;
      return;
    }
    record.set("key", hash);
    record.set("count", record.getInt("count") + 1);
    if (!rows.length) record.set("expiresAt", now + seconds * 1000);
    tx.save(record);
  });
  // Throw after committing: failed requests must not roll back their counters.
  if (denied)
    throw new TooManyRequestsError("Too many attempts. Try again later.");
};
exports.passwordAuth = (event) => {
  const category = "password:" + event.collection.name;
  exports.consume(event.app, category, event.identity, 8);
  const result = event.next();
  // A successful login clears its failures; refreshes never touch this budget.
  clearCounter(event.app, category, event.identity);
  return result;
};
function provePassword(event) {
  exports.consume(event.app, "password-proof", event.record.id, 8);
  const result = event.next();
  clearProof(event);
  return result;
}
function clearProof(event) {
  clearCounter(event.app, "password-proof", event.record.id);
}
exports.passwordProof = (event) => {
  const data = event.requestInfo().body || {};
  return event.auth &&
    event.auth.collection().name === "users" &&
    event.auth.id === event.record.id &&
    typeof data.oldPassword === "string" &&
    data.password !== undefined
    ? provePassword(event)
    : event.next();
};
exports.emailChangeProof = (event) => {
  const result = event.next();
  clearProof(event);
  return result;
};
exports.request = (event) => {
  const path = event.request.url.path;
  if (path.indexOf("/api/") === 0) {
    event.response
      .header()
      .set("Cache-Control", "private, no-store, max-age=0");
    event.response.header().set("X-Content-Type-Options", "nosniff");
    event.response.header().set("Referrer-Policy", "no-referrer");
  }
  if (path.indexOf("/api/collections/") !== 0) return event.next();
  const method = event.request.method;
  const action = path.slice(path.lastIndexOf("/") + 1);
  const mutation =
    (method === "POST" && action === "records") ||
    (["PATCH", "DELETE"].indexOf(method) !== -1 &&
      path.indexOf("/records/") !== -1);
  const mail =
    method === "POST" &&
    [
      "request-verification",
      "request-password-reset",
      "request-email-change",
      "confirm-email-change",
    ].indexOf(action) !== -1;
  if (!mutation && !mail) return event.next();
  let collection;
  try {
    collection = event.app.findCollectionByNameOrId(
      event.request.pathValue("collection"),
    );
  } catch {
    return event.next();
  }
  // Resolve collection IDs too; an alternate native URL must not bypass limits.
  if (collection.name !== "users") return event.next();
  if (mutation && collection.fields.getByName("adminPassword"))
    throw new ApiError(
      503,
      "Administrator proof must remain a transient request field.",
    );
  const data = event.requestInfo().body || {};
  const actor = event.auth;
  if (
    mutation &&
    !event.hasSuperuserAuth() &&
    actor &&
    actor.collection().name === "users" &&
    actor.getString("role") === "admin" &&
    event.request.pathValue("id") !== actor.id
  ) {
    if (
      !actor.getBool("active") ||
      (actor.getBool("emailVerificationRequired") && !actor.getBool("verified"))
    )
      throw new UnauthorizedError("Account is not eligible.");
    const category = "password:users",
      identity = actor.getString("email");
    exports.consume(event.app, category, identity, 8);
    if (
      typeof data.adminPassword !== "string" ||
      !data.adminPassword.length ||
      data.adminPassword.length > 256 ||
      !actor.validatePassword(data.adminPassword)
    )
      throw new ForbiddenError("Confirm the administrator's current password.");
    clearCounter(event.app, category, identity);
  }
  if (method !== "POST") return event.next();
  if (action === "confirm-email-change") {
    // Core validates the password before its confirmation hook. Reserve the budget
    // here, using PocketBase's signed-token verification to identify the account.
    if (typeof data.token !== "string" || data.token.length > 4096)
      return event.next();
    let user;
    try {
      user = event.app.findAuthRecordByToken(data.token, "emailChange");
    } catch {
      return event.next();
    }
    if (user.collection().id !== collection.id) return event.next();
    exports.consume(event.app, "password-proof", user.id, 8);
    return event.next();
  }
  const value = action === "request-email-change" ? data.newEmail : data.email;
  if (typeof value === "string" && value.length <= 254 && value.trim())
    exports.consume(
      event.app,
      action === "records" ? "registration" : "account-mail",
      value,
      action === "records" ? 5 : 4,
    );
  return event.next();
};
