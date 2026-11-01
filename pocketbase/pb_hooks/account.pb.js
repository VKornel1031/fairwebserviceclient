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

// Only authenticated active users can inspect this non-sensitive upload capability.
routerAdd(
  "GET",
  "/api/fairauto/account/avatar-policy",
  (event) => {
    if (!event.auth.getBool("active"))
      throw new UnauthorizedError("Inactive account.");
    const collection = $app.findCollectionByNameOrId("users");
    const avatar = collection.fields.getByName("avatar");
    const allowed = ["image/jpeg", "image/png", "image/webp"];
    // Accept formatting changes while preserving string literals and rule semantics.
    const compact = (rule) =>
      rule != null
        ? String(rule).replace(
            /("(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*')|\s+/g,
            (match, quoted) => quoted || "",
          )
        : "";
    const privateView =
      '@request.auth.id != "" && @request.auth.active = true && (id = @request.auth.id || @request.auth.role = "admin")';
    const ready =
      compact(collection.authRule) === compact("active = true") &&
      compact(collection.viewRule) === compact(privateView) &&
      !!avatar &&
      avatar.type() === "file" &&
      avatar.protected &&
      avatar.maxSelect === 1 &&
      avatar.maxSize === 1048576 &&
      avatar.mimeTypes.length > 0 &&
      avatar.mimeTypes.indexOf("image/webp") !== -1 &&
      avatar.mimeTypes.every((type) => allowed.indexOf(type) !== -1);
    return event.json(200, { ready });
  },
  $apis.requireAuth("users"),
);
