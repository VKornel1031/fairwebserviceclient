/// <reference path="../pb_data/types.d.ts" />
migrate(
  (app) => {
    const users = app.findCollectionByNameOrId("users");
    if (users.fields.getByName("adminPassword"))
      throw new Error(
        "Review users.adminPassword: administrator proof must never be a stored field.",
      );
    if (!users.fields.getByName("emailVerificationRequired"))
      throw new Error(
        "Apply the email-verification update before security hardening.",
      );
    let existing;
    try {
      existing = app.findCollectionByNameOrId("security_limits");
    } catch {}
    if (existing)
      throw new Error(
        "Review the existing security_limits collection before upgrading.",
      );
    const limits = new Collection({ name: "security_limits", type: "base" });
    limits.fields.add(new TextField({ name: "key", required: true, max: 64 }));
    limits.fields.add(
      new NumberField({ name: "count", required: true, min: 1, onlyInt: true }),
    );
    limits.fields.add(
      new NumberField({
        name: "expiresAt",
        required: true,
        min: 1,
        onlyInt: true,
      }),
    );
    limits.indexes = [
      "CREATE UNIQUE INDEX idx_security_limits_key ON security_limits (key)",
      "CREATE INDEX idx_security_limits_expiry ON security_limits (expiresAt)",
    ];
    // No native read/write access, including for normal users with the admin role.
    app.save(limits);

    // Native collection reads must reject a token after its owner loses email eligibility too.
    const signed = "@request.auth.active = true";
    const eligible =
      signed +
      " && (@request.auth.verified = true || @request.auth.emailVerificationRequired = false)";
    for (const name of [
      "users",
      "vehicles",
      "appointments",
      "appointment_events",
      "appointment_closures",
    ]) {
      const collection = app.findCollectionByNameOrId(name);
      if (name === "users") {
        const avatar = collection.fields.getByName("avatar");
        if (!avatar || avatar.type() !== "file")
          throw new Error(
            "Review the users.avatar file field before upgrading.",
          );
        // Protect historical uploads even when the optional avatar migration was skipped.
        avatar.protected = true;
        avatar.maxSelect = 1;
        avatar.maxSize = 1048576;
        avatar.mimeTypes = ["image/jpeg", "image/png", "image/webp"];
        avatar.thumbs = [];
      }
      for (const key of [
        "listRule",
        "viewRule",
        "createRule",
        "updateRule",
        "deleteRule",
        "manageRule",
      ]) {
        if (
          collection[key] != null &&
          String(collection[key]).indexOf(signed) !== -1
        )
          collection[key] = String(collection[key])
            .split(signed)
            .join(eligible);
      }
      app.save(collection);
    }
    const settings = app.settings();
    settings.rateLimits.enabled = true;
    const rules = settings.rateLimits.rules || [];
    const add = (label, maxRequests, duration) => {
      // Preserve an operator's existing rule for the same action.
      if (!rules.some((rule) => rule.label === label))
        rules.unshift({ label, maxRequests, duration, audience: "" });
    };
    // Website traffic shares server egress IPs; per-address limits live in SQLite hooks.
    add("users:authWithPassword", 120, 60);
    add("users:authRefresh", 1200, 60);
    add("users:create", 120, 60);
    add("users:requestVerification", 120, 60);
    add("users:requestPasswordReset", 120, 60);
    add("users:requestEmailChange", 60, 60);
    add("vehicles:create", 120, 60);
    add("GET /api/fairauto/security-policy", 1200, 60);
    settings.rateLimits.rules = rules;
    settings.batch.enabled = false;
    if (!settings.backups.cron) settings.backups.cron = "0 2 * * *";
    settings.backups.cronMaxKeep = Math.max(7, settings.backups.cronMaxKeep);
    // Preserve sender, SMTP credentials, proxy trust, and any configured backup destination.
    app.save(settings);
  },
  () => {
    throw new Error(
      "Security rollback is disabled. Use a reviewed forward migration or a verified backup.",
    );
  },
);
