// Guest-only retention. No public deletion endpoint, and no identifiers in logs.
const config = require(__hooks + "/fairauto-booking.json");
function eligible(record, cutoff) {
  const closed = Date.parse(record.getString("closedAt"));
  return (
    !record.getString("owner") &&
    !record.getString("createdBy") &&
    /^[a-f0-9]{64}$/.test(record.getString("guestHash")) &&
    ["completed", "cancelled"].indexOf(record.getString("status")) >= 0 &&
    Number.isFinite(closed) &&
    closed <= cutoff
  );
}
exports.process = (app, now = Date.now()) => {
  const days = config.guestRetentionDays;
  if (
    !Number.isInteger(days) ||
    days < 1 ||
    days > 365 ||
    !Number.isFinite(now)
  )
    throw new Error("Invalid guest retention configuration.");
  const schema = app.findCollectionByNameOrId("appointments");
  if (!schema.fields.getByName("closedAt"))
    throw new Error("Guest retention migration is required.");
  const cutoff = now - days * 86400000;
  let deleted = 0;
  app.runInTransaction((tx) => {
    const rows = arrayOf(new DynamicModel({ id: "" }));
    tx.db()
      .newQuery(
        "SELECT a.id FROM appointments a WHERE a.owner = '' AND a.createdBy = '' AND a.guestHash != '' AND a.status IN ('completed','cancelled') AND julianday(a.closedAt) <= julianday({:cutoff}) AND NOT EXISTS (SELECT 1 FROM appointment_mail m WHERE m.appointment = a.id AND m.status = 'processing' AND m.lockedUntil > {:now}) ORDER BY a.closedAt,a.id LIMIT 100",
      )
      .bind({ cutoff: new Date(cutoff).toISOString(), now })
      .all(rows);
    for (const row of rows) {
      const record = tx.findRecordById("appointments", row.id);
      if (!eligible(record, cutoff)) continue;
      // PocketBase relation cascades remove event and notification snapshots atomically.
      tx.delete(record);
      deleted++;
    }
  });
  app
    .store()
    .set("fairauto_guest_retention_last_run", new Date(now).toISOString());
  if (deleted)
    app.logger().info("fairauto_guest_retention_completed", "deleted", deleted);
  return { deleted };
};
