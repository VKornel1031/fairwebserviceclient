/// <reference path="../pb_data/types.d.ts" />
// Booking writes are available only through the transactional appointment hooks.
migrate(
  (app) => {
    const users = app.findCollectionByNameOrId("users");
    const vehicles = app.findCollectionByNameOrId("vehicles");
    const signed = '@request.auth.id != "" && @request.auth.active = true';
    const staff =
      signed +
      ' && (@request.auth.role = "reception" || @request.auth.role = "manager" || @request.auth.role = "admin")';
    const appointment = new Collection({ name: "appointments", type: "base" });
    for (const field of [
      new RelationField({
        name: "owner",
        collectionId: users.id,
        maxSelect: 1,
        cascadeDelete: false,
      }),
      new RelationField({
        name: "vehicleId",
        collectionId: vehicles.id,
        maxSelect: 1,
        cascadeDelete: false,
      }),
      new RelationField({
        name: "createdBy",
        collectionId: users.id,
        maxSelect: 1,
        hidden: true,
        cascadeDelete: false,
      }),
      new TextField({ name: "reference", required: true, max: 24 }),
      new TextField({ name: "service", required: true, max: 40 }),
      new TextField({ name: "serviceName", required: true, max: 100 }),
      new TextField({ name: "priceLabel", max: 100 }),
      new TextField({
        name: "date",
        required: true,
        pattern: "^\\d{4}-\\d{2}-\\d{2}$",
        max: 10,
      }),
      new TextField({
        name: "time",
        required: true,
        pattern: "^\\d{2}:\\d{2}$",
        max: 5,
      }),
      new NumberField({
        name: "duration",
        required: true,
        min: 1,
        max: 1440,
        onlyInt: true,
      }),
      new NumberField({
        name: "startMinute",
        min: 0,
        max: 1439,
        onlyInt: true,
      }),
      new NumberField({ name: "endMinute", min: 1, max: 1440, onlyInt: true }),
      new SelectField({
        name: "status",
        required: true,
        maxSelect: 1,
        values: [
          "requested",
          "confirmed",
          "progress",
          "completed",
          "cancelled",
        ],
      }),
      new JSONField({ name: "contact", required: true, maxSize: 2048 }),
      new JSONField({ name: "vehicle", required: true, maxSize: 2048 }),
      new BoolField({ name: "organization" }),
      new TextField({ name: "companyName", max: 120 }),
      new TextField({ name: "note", max: 1500 }),
      new TextField({ name: "termsVersion", required: true, max: 100 }),
      new DateField({ name: "termsAcceptedAt", required: true }),
      new TextField({ name: "guestHash", hidden: true, max: 64 }),
      new DateField({ name: "guestExpiresAt", hidden: true }),
      new TextField({ name: "contactKey", hidden: true, max: 64 }),
      new TextField({
        name: "requestHash",
        required: true,
        hidden: true,
        max: 64,
      }),
      new TextField({
        name: "payloadHash",
        required: true,
        hidden: true,
        max: 64,
      }),
      new JSONField({ name: "confirmation", hidden: true, maxSize: 1024 }),
      new NumberField({
        name: "revision",
        required: true,
        min: 1,
        onlyInt: true,
      }),
      new AutodateField({ name: "created", onCreate: true }),
      new AutodateField({ name: "updated", onCreate: true, onUpdate: true }),
    ])
      appointment.fields.add(field);
    appointment.listRule =
      "(" + signed + " && owner = @request.auth.id) || (" + staff + ")";
    appointment.viewRule = appointment.listRule;
    appointment.indexes = [
      "CREATE UNIQUE INDEX idx_appointments_request ON appointments (requestHash)",
      "CREATE UNIQUE INDEX idx_appointments_reference ON appointments (reference)",
      "CREATE INDEX idx_appointments_date_status ON appointments (date, status)",
      "CREATE INDEX idx_appointments_owner_date ON appointments (owner, date)",
      "CREATE INDEX idx_appointments_guest ON appointments (guestHash)",
      "CREATE INDEX idx_appointments_contact_key ON appointments (contactKey)",
    ];
    app.save(appointment);
    const history = new Collection({
      name: "appointment_events",
      type: "base",
    });
    for (const field of [
      new RelationField({
        name: "appointment",
        collectionId: appointment.id,
        maxSelect: 1,
        required: true,
        cascadeDelete: true,
      }),
      new TextField({ name: "action", required: true, max: 30 }),
      new NumberField({
        name: "revision",
        required: true,
        min: 1,
        onlyInt: true,
      }),
      new TextField({ name: "actorId", max: 15, hidden: true }),
      new TextField({ name: "actorName", max: 100, hidden: true }),
      new TextField({ name: "actorRole", max: 20, hidden: true }),
      new JSONField({ name: "change", required: true, maxSize: 2048 }),
      new AutodateField({ name: "created", onCreate: true }),
    ])
      history.fields.add(field);
    // Exposed only through an authorized DTO that hides staff identities from customers.
    history.listRule = staff;
    history.viewRule = staff;
    history.indexes = [
      "CREATE INDEX idx_appointment_events_record ON appointment_events (appointment, created)",
      "CREATE UNIQUE INDEX idx_appointment_events_revision ON appointment_events (appointment, revision)",
    ];
    app.save(history);
    const closure = new Collection({
      name: "appointment_closures",
      type: "base",
    });
    closure.fields.add(
      new TextField({
        name: "date",
        required: true,
        max: 10,
        pattern: "^\\d{4}-\\d{2}-\\d{2}$",
      }),
    );
    closure.fields.add(
      new TextField({ name: "actorId", hidden: true, max: 15 }),
    );
    closure.fields.add(new AutodateField({ name: "created", onCreate: true }));
    closure.indexes = [
      "CREATE UNIQUE INDEX idx_appointment_closures_date ON appointment_closures (date)",
    ];
    closure.listRule = staff;
    closure.viewRule = staff;
    app.save(closure);
    const limits = new Collection({ name: "appointment_limits", type: "base" });
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
      "CREATE UNIQUE INDEX idx_appointment_limits_key ON appointment_limits (key)",
      "CREATE INDEX idx_appointment_limits_expiry ON appointment_limits (expiresAt)",
    ];
    app.save(limits);
  },
  () => {
    throw new Error(
      "Rollback is disabled to preserve appointment records and audit history.",
    );
  },
);
