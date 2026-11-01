/// <reference path="../pb_data/types.d.ts" />
migrate(
  (app) => {
    const appointments = app.findCollectionByNameOrId("appointments");
    if (appointments.fields.getByName("closedAt"))
      throw new Error(
        "appointments.closedAt already exists; review its schema before applying this migration.",
      );
    appointments.fields.add(new DateField({ name: "closedAt", hidden: true }));
    appointments.indexes.push(
      "CREATE INDEX idx_appointments_guest_cleanup ON appointments (status, closedAt) WHERE owner = '' AND createdBy = '' AND guestHash != ''",
    );
    app.save(appointments);
    // Backfill only actual guest-created terminal records. No deletion happens in a migration.
    const now = new Date().toISOString();
    while (true) {
      const records = app.findRecordsByFilter(
        "appointments",
        'owner = "" && createdBy = "" && guestHash != "" && closedAt = "" && (status = "completed" || status = "cancelled")',
        "id",
        200,
        0,
      );
      if (!records.length) break;
      for (const record of records) {
        const events = app.findRecordsByFilter(
          "appointment_events",
          "appointment = {:id} && action = {:status}",
          "-created,-revision",
          1,
          0,
          { id: record.id, status: record.getString("status") },
        );
        // An unknown closure gets a fresh grace period, never the original booking date.
        record.set(
          "closedAt",
          events.length ? events[0].getString("created") : now,
        );
        app.save(record);
      }
    }
  },
  () => {
    throw new Error(
      "Rollback disabled: restore a verified backup or use a reviewed forward migration.",
    );
  },
);
