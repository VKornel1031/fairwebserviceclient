/// <reference path="../pb_data/types.d.ts" />
// Self-service address changes without SMTP. No superuser credential is involved.
// Install on the PocketBase server alongside the account-management migration.
routerAdd(
  "POST",
  "/api/fairauto/account/email",
  (event) => {
    const body = event.requestInfo().body;
    if (
      !body ||
      Object.keys(body).some((key) => !["email", "password"].includes(key)) ||
      typeof body.email !== "string" ||
      body.email.length > 254 ||
      typeof body.password !== "string" ||
      body.password.length < 1 ||
      body.password.length > 256
    )
      throw new BadRequestError("Invalid account request.");
    const identity = body.email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(identity))
      throw new BadRequestError("Invalid email address.");
    $app.runInTransaction((tx) => {
      const record = tx.findRecordById("users", event.auth.id);
      if (!record.getBool("active") || !record.validatePassword(body.password))
        throw new UnauthorizedError("Invalid account credentials.");
      record.set("email", identity);
      record.set("verified", false);
      tx.save(record);
    });
    return event.json(200, { ok: true });
  },
  $apis.requireAuth("users"),
);
