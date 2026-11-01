// Optional durable appointment notifications. Credentials stay in PocketBase mail settings.
const booking = require(__hooks + "/fairauto-booking.json");
let config,
  warned = false;
try {
  config = require(__hooks + "/fairauto-mail.json");
} catch {
  config = { enabled: false };
}
const events = [
  "requested",
  "confirmed",
  "rescheduled",
  "cancelled",
  "price_updated",
  "completed",
];
function enabled() {
  if (!config || config.enabled !== true) return false;
  if (
    !/^https:\/\/[a-z0-9.-]+(?::\d+)?\/?$/i.test(config.appUrl) ||
    typeof config.workshopAddress !== "string" ||
    config.workshopAddress.length < 1 ||
    config.workshopAddress.length > 200 ||
    typeof config.workshopPhone !== "string" ||
    config.workshopPhone.length > 30 ||
    !Array.isArray(config.staffRoles) ||
    config.staffRoles.some(
      (role) => ["manager", "reception", "admin"].indexOf(role) < 0,
    ) ||
    !Number.isInteger(config.maxAttempts) ||
    config.maxAttempts < 1 ||
    config.maxAttempts > 10 ||
    !Number.isInteger(config.batchSize) ||
    config.batchSize < 1 ||
    config.batchSize > 20
  ) {
    if (!warned) {
      $app.logger().error("fairauto_mail_configuration_invalid");
      warned = true;
    }
    return false;
  }
  return true;
}
function email(value) {
  return (
    typeof value === "string" &&
    value.length <= 254 &&
    /^[a-z0-9][a-z0-9._%+-]*@[a-z0-9][a-z0-9.-]*\.[a-z]{2,}$/i.test(value)
  );
}
function field(record, name) {
  return JSON.parse(record.getString(name) || "null");
}
exports.enqueue = (app, record, event) => {
  if (!enabled() || events.indexOf(event) < 0) return;
  const contact = field(record, "contact"),
    recipients = [];
  const addRecipient = (address, path, staffUser = "") => {
    const existing = recipients.find((item) => item.address === address);
    if (existing) {
      existing.path = path;
      existing.staffUser = staffUser;
    } else recipients.push({ address, path, staffUser });
  };
  if (email(contact.email))
    addRecipient(contact.email.toLowerCase(), "/foglalasaim");
  if (config.staffRoles.length) {
    const where =
      "active = true && (" +
      config.staffRoles.map((role) => 'role = "' + role + '"').join(" || ") +
      ")";
    for (const user of app.findRecordsByFilter("users", where, "id", 100, 0)) {
      const address = user.getString("email").toLowerCase();
      if (email(address))
        addRecipient(
          address,
          (user.getString("role") === "reception"
            ? "/munkafelvetel"
            : "/muhely") +
            "?appointment=" +
            record.id,
          user.id,
        );
    }
  }
  const snapshot = {
    reference: record.getString("reference"),
    serviceName: record.getString("serviceName"),
    date: record.getString("date"),
    time: record.getString("time"),
    duration: record.getInt("duration"),
    contact,
    vehicle: field(record, "vehicle"),
    organization: record.getBool("organization"),
    companyName: record.getString("companyName"),
    note: record.getString("note"),
    price: field(record, "price"),
  };
  const collection = app.findCollectionByNameOrId("appointment_mail");
  for (const recipient of recipients) {
    const job = new Record(collection);
    job.set("appointment", record.id);
    job.set(
      "eventKey",
      record.id +
        ":" +
        record.getInt("revision") +
        ":" +
        $security.sha256(recipient.address),
    );
    job.set("recipient", recipient.address);
    job.set("event", event);
    job.set(
      "snapshot",
      Object.assign({}, snapshot, {
        path: recipient.path,
        staffUser: recipient.staffUser,
      }),
    );
    job.set("status", "pending");
    job.set("nextAttempt", Date.now());
    app.save(job);
  }
};
const titles = {
  requested: "Időpontkérésedet rögzítettük",
  confirmed: "Időpontod telefonon visszaigazolva",
  rescheduled: "Új időpontkérés rögzítve",
  cancelled: "Időpont lemondva",
  price_updated: "Az időpontodhoz tartozó ár frissült",
  completed: "A szervizmunka elkészült",
};
function escape(value) {
  return String(value == null ? "" : value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
function message(job, app) {
  if (!email(job.recipient)) throw new Error("Invalid mail recipient.");
  const a = job.snapshot,
    waiting = ["requested", "rescheduled"].indexOf(job.event) >= 0;
  const info = waiting
    ? "A kérés telefonos egyeztetésre vár; a kapacitást a telefonos visszaigazolás biztosítja."
    : job.event === "cancelled"
      ? "Az időpontot lemondtuk."
      : job.event === "confirmed"
        ? "A telefonon egyeztetett időpontot visszaigazoltuk."
        : "Az időpontkérés adatai frissültek.";
  const lines = [
    titles[job.event],
    info,
    "Azonosító: " + a.reference,
    "Időpont: " + a.date + " " + a.time + " (budapesti idő)",
    "Szolgáltatás: " + a.serviceName,
    "Becsült időtartam: " + a.duration + " perc",
    "Kapcsolattartó: " + a.contact.name,
    "Telefon: " + a.contact.phone,
    "E-mail: " + a.contact.email,
    "Település: " + a.contact.city,
    "Jármű: " +
      a.vehicle.make +
      " " +
      a.vehicle.model +
      " · " +
      a.vehicle.plate +
      " · " +
      a.vehicle.year,
  ];
  if (a.vehicle.vin) lines.push("Alvázszám (VIN): " + a.vehicle.vin);
  if (a.organization) lines.push("Cég: " + a.companyName);
  lines.push(
    "Szerviz: " + config.workshopAddress,
    "Telefon: " +
      (booking.phoneContacts
        ? booking.phoneContacts.map((phone) => phone.label).join(" / ")
        : config.workshopPhone),
  );
  if (a.note) lines.push("Megjegyzés: " + a.note);
  if (a.price) {
    lines.push("Tájékoztató bruttó árbecslés: " + a.price.totalHuf + " Ft");
    a.price.items.forEach((line) =>
      lines.push(
        line.description +
          ": " +
          line.quantity +
          " × " +
          line.unitPriceHuf +
          " Ft = " +
          line.quantity * line.unitPriceHuf +
          " Ft",
      ),
    );
    if (a.price.note) lines.push(a.price.note);
  }
  lines.push(
    "A javítás tartalmát és végleges díját külön egyeztetitek. Ez nem számla vagy online javítási megrendelés.",
    "Részletek: " +
      config.appUrl.replace(/\/$/, "") +
      (a.path || "/foglalasaim"),
    "Fiókkal bejelentkezés után, vendégként a kéréshez használt böngészőben érhető el. Más esetben keresd a szervizt telefonon.",
  );
  const meta = app.settings().meta;
  if (!email(meta.senderAddress)) throw new Error("Invalid mail sender.");
  return new MailerMessage({
    from: { address: meta.senderAddress, name: meta.senderName },
    to: [{ address: job.recipient }],
    subject: "Fair Autószerviz · " + a.reference + " · " + titles[job.event],
    text: lines.join("\n\n"),
    html:
      '<div style="font-family:Arial,sans-serif;max-width:640px;margin:auto;color:#202427">' +
      lines
        .map((line) => "<p>" + escape(line).replace(/\n/g, "<br>") + "</p>")
        .join("") +
      "</div>",
  });
}
function transportCode(error) {
  const message = String(error).toLowerCase();
  if (message.indexOf("invalid mail sender") >= 0) return "invalid_sender";
  if (
    message.indexOf("locate a sendmail") >= 0 ||
    message.indexOf("executable file not found") >= 0
  )
    return "sendmail_missing";
  if (
    message.indexOf("connection refused") >= 0 ||
    message.indexOf("no such host") >= 0 ||
    message.indexOf("i/o timeout") >= 0
  )
    return "smtp_connection_failed";
  if (
    message.indexOf("535") >= 0 ||
    message.indexOf("authentication failed") >= 0
  )
    return "smtp_authentication_failed";
  return "transport_failed";
}
function recipientAllowed(job, app) {
  if (!job.snapshot.staffUser) return true;
  try {
    const user = app.findRecordById("users", job.snapshot.staffUser);
    return (
      user.getBool("active") &&
      config.staffRoles.indexOf(user.getString("role")) >= 0 &&
      user.getString("email").toLowerCase() === job.recipient
    );
  } catch {
    return false;
  }
}
exports.process = (app) => {
  if (!enabled()) return { processed: 0 };
  let processed = 0;
  for (let i = 0; i < config.batchSize; i++) {
    let job = null;
    app.runInTransaction((tx) => {
      const rows = arrayOf(new DynamicModel({ id: "" }));
      tx.db()
        .newQuery(
          "SELECT id FROM appointment_mail WHERE (status = 'pending' AND nextAttempt <= {:now}) OR (status = 'processing' AND lockedUntil <= {:now}) ORDER BY created,id LIMIT 1",
        )
        .bind({ now: Date.now() })
        .all(rows);
      if (!rows.length) return;
      const record = tx.findRecordById("appointment_mail", rows[0].id);
      if (record.getInt("attempts") >= config.maxAttempts) {
        record.set("status", "failed");
        record.set("errorCode", "attempts_exhausted");
        tx.save(record);
        return;
      }
      record.set("status", "processing");
      record.set("attempts", record.getInt("attempts") + 1);
      record.set("lockedUntil", Date.now() + 900000);
      record.set("leaseToken", $security.randomString(32));
      tx.save(record);
      job = {
        id: record.id,
        recipient: record.getString("recipient"),
        event: record.getString("event"),
        snapshot: field(record, "snapshot"),
        leaseToken: record.getString("leaseToken"),
      };
    });
    if (!job) break;
    let success = false,
      errorCode = "transport_failed";
    const allowed = recipientAllowed(job, app);
    try {
      if (allowed) {
        app.newMailClient().send(message(job, app));
        success = true;
      }
    } catch (error) {
      errorCode = transportCode(error);
      app.logger().warn("fairauto_mail_handoff_failed", "code", errorCode);
    }
    app.runInTransaction((tx) => {
      let record;
      try {
        record = tx.findRecordById("appointment_mail", job.id);
      } catch {
        return;
      }
      if (record.getString("leaseToken") !== job.leaseToken) return;
      record.set("lockedUntil", 0);
      record.set("leaseToken", "");
      if (!allowed) {
        record.set("status", "failed");
        record.set("errorCode", "recipient_changed");
      } else if (success) {
        record.set("status", "sent");
        record.set("sentAt", new Date().toISOString());
        record.set("errorCode", "");
      } else {
        record.set(
          "status",
          record.getInt("attempts") >= config.maxAttempts
            ? "failed"
            : "pending",
        );
        record.set(
          "nextAttempt",
          Date.now() +
            Math.min(
              3600000,
              60000 * Math.pow(2, record.getInt("attempts") - 1),
            ),
        );
        record.set("errorCode", errorCode);
      }
      tx.save(record);
    });
    processed++;
  }
  return { processed };
};

// Admin diagnostics contain no addresses, bodies or credentials.
exports.status = (app) => {
  const active = enabled();
  const counts = new DynamicModel({
    pending: 0,
    processing: 0,
    sent: 0,
    failed: 0,
    retryable: 0,
  });
  app
    .db()
    .newQuery(
      "SELECT COALESCE(SUM(status='pending'),0) AS pending,COALESCE(SUM(status='processing'),0) AS processing,COALESCE(SUM(status='sent'),0) AS sent,COALESCE(SUM(status='failed'),0) AS failed,COALESCE(SUM(status IN ('pending','failed') AND errorCode != '' AND errorCode != 'recipient_changed'),0) AS retryable FROM appointment_mail",
    )
    .one(counts);
  const errors = arrayOf(new DynamicModel({ errorCode: "", attempts: 0 }));
  app
    .db()
    .newQuery(
      "SELECT errorCode,attempts FROM appointment_mail WHERE errorCode != '' ORDER BY created DESC,id DESC LIMIT 1",
    )
    .all(errors);
  const errorCode = errors.length ? errors[0].errorCode : "";
  let sendmailAvailable = false;
  try {
    sendmailAvailable = !$os.stat("/usr/sbin/sendmail").isDir();
  } catch {}
  return {
    enabled: active,
    configuration: active
      ? "enabled"
      : config && config.enabled === true
        ? "invalid"
        : "disabled",
    transport: app.settings().smtp.enabled ? "smtp" : "sendmail",
    senderConfigured: email(app.settings().meta.senderAddress),
    sendmailAvailable,
    workerRegistered: app
      .cron()
      .jobs()
      .some((job) => job.id() === "fairauto-appointment-mail"),
    workerRunning: app.cron().hasStarted(),
    counts,
    lastError: /^[a-z_]{1,50}$/.test(errorCode) ? errorCode : "",
    attempts: errors.length ? errors[0].attempts : 0,
  };
};
exports.retry = (app) => {
  if (!enabled())
    throw new ApiError(409, "Notifications disabled.", {
      fairautoCode: new ValidationError(
        "mail_disabled",
        "Notifications disabled.",
      ),
    });
  let requeued = 0;
  app.runInTransaction((tx) => {
    const rows = arrayOf(new DynamicModel({ id: "" }));
    tx.db()
      .newQuery(
        "SELECT id FROM appointment_mail WHERE status IN ('pending','failed') AND errorCode IN ('transport_failed','attempts_exhausted','invalid_sender','sendmail_missing','smtp_connection_failed','smtp_authentication_failed','smtp_rejected') ORDER BY created,id LIMIT 100",
      )
      .all(rows);
    for (const row of rows) {
      const record = tx.findRecordById("appointment_mail", row.id);
      record.set("status", "pending");
      record.set("attempts", 0);
      record.set("nextAttempt", Date.now());
      record.set("lockedUntil", 0);
      record.set("leaseToken", "");
      record.set("errorCode", "");
      tx.save(record);
      requeued++;
    }
  });
  return { requeued };
};
