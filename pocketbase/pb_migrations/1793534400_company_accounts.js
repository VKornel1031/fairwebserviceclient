/// <reference path="../pb_data/types.d.ts" />
// Forward-only: retain all users, ownership relations and suspension states.
migrate(
  (app) => {
    const users = app.findCollectionByNameOrId("users");
    // Convert before narrowing the enum, so existing records remain valid.
    for (const record of app.findAllRecords(
      "users",
      $dbx.hashExp({ role: "customer" }),
    )) {
      record.set("role", "partner");
      app.save(record);
    }
    users.fields.getByName("role").values = [
      "partner",
      "reception",
      "manager",
      "admin",
    ];
    const administrator =
      '@request.auth.id != "" && @request.auth.active = true && @request.auth.role = "admin"';
    const company =
      '@request.body.companyName != "" && @request.body.companyTax != ""';
    users.createRule =
      '(@request.auth.id = "" && @request.body.role = "partner" && ' +
      company +
      " && @request.body.active = true && @request.body.verified:isset = false && @request.body.protectedRoot:isset = false && @request.body.termsVersion:isset = true && @request.body.termsAcceptedAt:isset = true) || (" +
      administrator +
      ' && (@request.body.role != "partner" || (' +
      company +
      ")) && @request.body.protectedRoot:isset = false && @request.body.verified:isset = false && @request.body.termsVersion:isset = false && @request.body.termsAcceptedAt:isset = false)";
    if (users.fields.getByName("defaultVehicle"))
      users.createRule =
        "(" +
        users.createRule +
        ') && (@request.body.defaultVehicle:isset = false || @request.body.defaultVehicle = "")';
    app.save(users);
  },
  () => {
    throw new Error(
      "Automatic rollback is disabled to preserve accounts. Restore a verified backup or apply a reviewed forward migration.",
    );
  },
);
