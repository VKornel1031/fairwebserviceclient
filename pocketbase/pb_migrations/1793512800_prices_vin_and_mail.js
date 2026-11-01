/// <reference path="../pb_data/types.d.ts" />
migrate(
  (app) => {
    const vehicles = app.findCollectionByNameOrId("vehicles");
    if (vehicles.fields.getByName("vin"))
      throw new Error(
        "vehicles.vin already exists; review it before applying this migration.",
      );
    vehicles.fields.add(
      new TextField({
        name: "vin",
        max: 17,
        pattern: "^([A-HJ-NPR-Z0-9]{17})?$",
      }),
    );
    app.save(vehicles);
    const appointments = app.findCollectionByNameOrId("appointments");
    appointments.fields.add(
      new JSONField({ name: "price", hidden: true, maxSize: 32768 }),
    );
    app.save(appointments);
    const history = app.findCollectionByNameOrId("appointment_events");
    history.fields.getByName("change").maxSize = 65536;
    app.save(history);
    const outbox = new Collection({ name: "appointment_mail", type: "base" });
    for (const field of [
      new RelationField({
        name: "appointment",
        collectionId: appointments.id,
        maxSelect: 1,
        cascadeDelete: true,
      }),
      new TextField({ name: "eventKey", required: true, max: 100 }),
      new EmailField({ name: "recipient", required: true }),
      new TextField({ name: "event", required: true, max: 30 }),
      new JSONField({ name: "snapshot", required: true, maxSize: 65536 }),
      new SelectField({
        name: "status",
        required: true,
        maxSelect: 1,
        values: ["pending", "processing", "sent", "failed"],
      }),
      new NumberField({ name: "attempts", min: 0, max: 10, onlyInt: true }),
      new NumberField({ name: "nextAttempt", min: 0, onlyInt: true }),
      new TextField({ name: "leaseToken", max: 32 }),
      new NumberField({ name: "lockedUntil", min: 0, onlyInt: true }),
      new DateField({ name: "sentAt" }),
      new TextField({ name: "errorCode", max: 50 }),
      new AutodateField({ name: "created", onCreate: true }),
    ])
      outbox.fields.add(field);
    outbox.indexes = [
      "CREATE UNIQUE INDEX idx_appointment_mail_event ON appointment_mail (eventKey)",
      "CREATE INDEX idx_appointment_mail_due ON appointment_mail (status, nextAttempt, lockedUntil)",
    ];
    // All native access stays locked; only the transactional hooks and mail worker use it.
    app.save(outbox);
  },
  () => {
    throw new Error(
      "Rollback disabled to preserve prices and notification history.",
    );
  },
);
