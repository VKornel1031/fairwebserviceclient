/// <reference path="../pb_data/types.d.ts" />
// Native PocketBase rules only: no pb_hooks or server credentials required.
migrate(
  (app) => {
    const users = app.findCollectionByNameOrId("users");
    if (
      !users.fields.getByName("active") ||
      !users.updateRule ||
      !users.createRule
    )
      throw new Error("Apply the account-management migration first.");
    let existing;
    try {
      existing = app.findCollectionByNameOrId("vehicles");
    } catch {}
    if (existing)
      throw new Error(
        "A vehicles collection already exists. Review its schema before applying this migration; no existing data was changed.",
      );
    const signed = '@request.auth.id != "" && @request.auth.active = true';
    const allowed =
      signed + ' && (owner = @request.auth.id || @request.auth.role = "admin")';
    const vehicles = new Collection({ type: "base", name: "vehicles" });
    for (const field of [
      new RelationField({
        name: "owner",
        collectionId: users.id,
        required: true,
        maxSelect: 1,
        cascadeDelete: true,
      }),
      new TextField({
        name: "plate",
        required: true,
        min: 3,
        max: 15,
        pattern: "^[A-Z0-9]{3,15}$",
      }),
      new TextField({
        name: "make",
        required: true,
        min: 1,
        max: 60,
        pattern: "^[^\\x00-\\x1F\\x7F]*\\S[^\\x00-\\x1F\\x7F]*$",
      }),
      new TextField({
        name: "model",
        required: true,
        min: 1,
        max: 60,
        pattern: "^[^\\x00-\\x1F\\x7F]*\\S[^\\x00-\\x1F\\x7F]*$",
      }),
      new NumberField({
        name: "year",
        required: true,
        onlyInt: true,
        min: 1886,
        max: 2100,
      }),
      new AutodateField({ name: "created", onCreate: true }),
      new AutodateField({ name: "updated", onCreate: true, onUpdate: true }),
    ])
      vehicles.fields.add(field);
    Object.assign(vehicles, {
      indexes: [
        "CREATE UNIQUE INDEX idx_vehicles_owner_plate ON vehicles (owner, plate)",
        "CREATE INDEX idx_vehicles_owner_created ON vehicles (owner, created)",
      ],
      listRule: allowed,
      viewRule: allowed,
      createRule:
        signed +
        ' && (@request.body.owner = @request.auth.id || @request.auth.role = "admin")',
      updateRule: allowed + " && @request.body.owner:isset = false",
      deleteRule: allowed,
    });
    app.save(vehicles);
    if (users.fields.getByName("defaultVehicle"))
      throw new Error(
        "users.defaultVehicle already exists. Review it before applying this migration.",
      );
    users.fields.add(
      new RelationField({
        name: "defaultVehicle",
        collectionId: vehicles.id,
        maxSelect: 1,
        cascadeDelete: false,
      }),
    );
    users.createRule =
      "(" +
      String(users.createRule) +
      ') && (@request.body.defaultVehicle:isset = false || @request.body.defaultVehicle = "")';
    // A single relation is an atomic default choice; no multi-record boolean updates.
    users.updateRule =
      "(" +
      String(users.updateRule) +
      ') && (@request.body.defaultVehicle:isset = false || @request.body.defaultVehicle = "" || @request.body.defaultVehicle.owner = id)';
    app.save(users);
  },
  () => {
    throw new Error(
      "Rollback is disabled to preserve saved vehicles. Use a reviewed forward migration or restore a backup.",
    );
  },
);
