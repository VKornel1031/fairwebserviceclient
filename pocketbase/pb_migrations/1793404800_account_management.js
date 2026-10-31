/// <reference path="../pb_data/types.d.ts" />
// PocketBase 0.26.3. Back up pb_data before applying. Existing users/field IDs are preserved.
migrate(
  (app) => {
    const collection = app.findCollectionByNameOrId("users");
    const add = (field) => {
      if (!collection.fields.getByName(field.name))
        collection.fields.add(field);
    };
    const text = (name, max, min = 0) => {
      add(new TextField({ name }));
      const field = collection.fields.getByName(name);
      field.required = min > 0;
      field.min = min;
      field.max = max;
    };
    text("name", 100, 2);
    text("phone", 25);
    text("city", 100);
    add(new BoolField({ name: "reminders" }));
    let role = collection.fields.getByName("role");
    if (!role) {
      role = new SelectField({ name: "role" });
      collection.fields.add(role);
    }
    role.required = true;
    role.maxSelect = 1;
    role.values = ["customer", "partner", "reception", "manager", "admin"];
    text("companyName", 120);
    text("companyTax", 30);
    text("companyCity", 100);
    add(new BoolField({ name: "partnerRequested" }));
    add(new BoolField({ name: "protectedRoot" }));
    const addedActive = !collection.fields.getByName("active");
    add(new BoolField({ name: "active" }));
    text("termsVersion", 100);
    add(new DateField({ name: "termsAcceptedAt" }));
    const password = collection.fields.getByName("password");
    password.min = 12;
    password.max = 64;
    collection.passwordAuth = { enabled: true, identityFields: ["email"] };
    collection.authToken.duration = 28800;
    collection.authRule = "active = true";
    const signed = '@request.auth.id != "" && @request.auth.active = true';
    const administrator = signed + ' && @request.auth.role = "admin"';
    collection.listRule =
      signed + ' && (id = @request.auth.id || @request.auth.role = "admin")';
    collection.viewRule = collection.listRule;
    collection.createRule =
      '(@request.auth.id = "" && @request.body.role = "customer" && @request.body.active = true && @request.body.verified:isset = false && @request.body.protectedRoot:isset = false && @request.body.termsVersion:isset = true && @request.body.termsAcceptedAt:isset = true) || (' +
      administrator +
      " && @request.body.protectedRoot:isset = false && @request.body.verified:isset = false && @request.body.termsVersion:isset = false && @request.body.termsAcceptedAt:isset = false)";
    collection.updateRule =
      signed +
      ' && @request.body.protectedRoot:isset = false && @request.body.verified:isset = false && @request.body.termsVersion:isset = false && @request.body.termsAcceptedAt:isset = false && ((id = @request.auth.id && @request.body.role:isset = false && @request.body.verified:isset = false && @request.body.active:isset = false) || (@request.auth.role = "admin" && id != @request.auth.id && protectedRoot = false))';
    collection.deleteRule =
      administrator + " && id != @request.auth.id && protectedRoot = false";
    collection.manageRule = collection.deleteRule;
    app.save(collection);
    if (addedActive) {
      // Activate existing accounts once; never re-enable suspended accounts on later runs.
      const existing = app.findAllRecords("users");
      for (const record of existing) {
        record.set("active", true);
        app.save(record);
      }
    }
    // Protect the earliest existing active app admin. If none exists, mark your first admin manually.
    const admins = app.findRecordsByFilter(
      "users",
      'role = "admin" && active = true',
      "created,id",
      1,
      0,
    );
    if (admins.length) {
      admins[0].set("protectedRoot", true);
      app.save(admins[0]);
    }
  },
  () => {
    throw new Error(
      "Automatic rollback is disabled to preserve account data. Restore a verified backup or apply a reviewed forward migration.",
    );
  },
);
