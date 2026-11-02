/// <reference path="../pb_data/types.d.ts" />
// Retired direct-change route. Never validate a password through a deprecated API.
routerAdd(
  "POST",
  "/api/fairauto/account/email",
  () => {
    throw new ApiError(410, "Use the email confirmation flow.");
  },
  $apis.requireAuth("users"),
  $apis.bodyLimit(8192),
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
      '@request.auth.id != "" && @request.auth.active = true && (@request.auth.verified = true || @request.auth.emailVerificationRequired = false) && (id = @request.auth.id || @request.auth.role = "admin")';
    const ready =
      compact(collection.authRule) ===
        compact(
          "active = true && (verified = true || emailVerificationRequired = false)",
        ) &&
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
