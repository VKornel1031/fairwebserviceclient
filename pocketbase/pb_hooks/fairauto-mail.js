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
      "active = true && (verified = true || emailVerificationRequired = false) && (" +
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
function money(value) {
  return String(value).replace(/\B(?=(\d{3})+(?!\d))/g, " ") + " Ft";
}
function row(label, value) {
  return (
    '<tr><td style="padding:6px 12px 6px 0;color:#68726b;font-size:12px;vertical-align:top">' +
    escape(label) +
    '</td><td style="padding:6px 0;font-size:13px;line-height:1.6;word-break:break-word">' +
    escape(value).replace(/\n/g, "<br>") +
    "</td></tr>"
  );
}
function section(title, body) {
  return (
    '<h2 style="font-size:15px;line-height:1.5;margin:26px 0 10px">' +
    escape(title) +
    '</h2><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="width:100%;border-top:1px solid #e2e6df">' +
    body +
    "</table>"
  );
}
function designedMessage(job, info) {
  const a = job.snapshot;
  const waiting = ["requested", "rescheduled"].indexOf(job.event) >= 0;
  const badge = waiting
    ? "Telefonos egyeztetésre vár"
    : job.event === "cancelled"
      ? "Lemondva"
      : job.event === "price_updated"
        ? "Árbecslés frissítve"
        : job.event === "completed"
          ? "Elkészült"
          : "Visszaigazolva";
  const badgeColor = waiting
    ? "#fff0cf"
    : job.event === "cancelled"
      ? "#f7e7e3"
      : "#e6f0e7";
  const url = config.appUrl.replace(/\/$/, "") + (a.path || "/foglalasaim");
  let body =
    '<p style="font-size:13px;line-height:1.8;color:#68726b;margin:0 0 16px">' +
    escape(info) +
    "</p>";
  body +=
    '<p style="margin:0 0 20px"><span style="display:inline-block;padding:7px 12px;background:' +
    badgeColor +
    ';border-radius:30px;color:#364538;font-size:11px;font-weight:bold">' +
    badge +
    "</span></p>";
  body +=
    '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="width:100%;background:#f1f4ee;border:1px solid #dfe5da;border-radius:10px"><tr><td style="padding:18px 14px;width:55%;vertical-align:top"><p style="font-size:10px;color:#68726b;margin:0 0 7px;letter-spacing:1px">IDŐPONT</p><p style="font-size:19px;font-weight:bold;margin:0;line-height:1.4">' +
    escape(a.date.replace(/-/g, ". ") + ".") +
    '</p><p style="font-size:11px;color:#68726b;margin:6px 0 0">Budapesti idő szerint</p></td><td style="padding:18px 14px;vertical-align:top"><p style="font-size:10px;color:#68726b;margin:0 0 7px;letter-spacing:1px">ÉRKEZÉS</p><p style="font-size:24px;font-weight:bold;margin:0;line-height:1.2">' +
    escape(a.time) +
    '</p><p style="font-size:11px;color:#68726b;margin:7px 0 0">kb. ' +
    escape(a.duration) +
    " perc</p></td></tr></table>";
  body += section(
    "A kérés részletei",
    row("Azonosító", a.reference) +
      row("Szolgáltatás", a.serviceName) +
      (a.organization ? row("Cég", a.companyName) : ""),
  );
  body += section(
    "Gépjármű",
    row("Autó", a.vehicle.make + " " + a.vehicle.model) +
      row("Rendszám", a.vehicle.plate) +
      row("Gyártási év", a.vehicle.year) +
      (a.vehicle.vin ? row("Alvázszám (VIN)", a.vehicle.vin) : ""),
  );
  body += section(
    "Kapcsolattartó",
    row("Név", a.contact.name) +
      row("Telefon", a.contact.phone) +
      row("E-mail", a.contact.email) +
      row("Település", a.contact.city),
  );
  if (a.note) body += section("Megjegyzés", row("", a.note));
  if (a.price) {
    let prices =
      '<h2 style="font-size:15px;margin:26px 0 10px">Tájékoztató bruttó árbecslés</h2>';
    if (a.price.items.length) {
      prices +=
        '<table width="100%" cellpadding="0" cellspacing="0" style="width:100%;font-size:12px;border-collapse:collapse"><thead><tr style="background:#f1f4ee"><th scope="col" style="padding:10px 8px;text-align:left">Tétel</th><th scope="col" style="padding:10px 4px;text-align:center">Db</th><th scope="col" style="padding:10px 8px;text-align:right">Bruttó összeg</th></tr></thead><tbody>';
      for (const item of a.price.items)
        prices +=
          '<tr><td style="padding:12px 8px;border-bottom:1px solid #e2e6df;word-break:break-word">' +
          escape(item.description) +
          '<br><span style="font-size:10px;color:#68726b">Egységár: ' +
          escape(money(item.unitPriceHuf)) +
          '</span></td><td style="padding:12px 4px;text-align:center;border-bottom:1px solid #e2e6df">' +
          escape(item.quantity) +
          '</td><td style="padding:12px 8px;text-align:right;border-bottom:1px solid #e2e6df">' +
          escape(money(item.quantity * item.unitPriceHuf)) +
          "</td></tr>";
      prices += "</tbody></table>";
    }
    prices +=
      '<p style="text-align:right;font-size:23px;font-weight:bold;margin:16px 0 8px">' +
      escape(money(a.price.totalHuf)) +
      "</p>";
    if (a.price.note)
      prices +=
        '<p style="font-size:12px;line-height:1.7;color:#68726b">' +
        escape(a.price.note).replace(/\n/g, "<br>") +
        "</p>";
    body += prices;
  }
  body +=
    '<p style="font-size:11px;line-height:1.8;color:#68726b;margin:24px 0">A javítás tartalmát és végleges díját külön egyeztetitek. Ez nem számla vagy online javítási megrendelés.</p>';
  body +=
    '<table role="presentation" cellpadding="0" cellspacing="0"><tr><td bgcolor="#253c30" style="border-radius:6px"><a href="' +
    escape(url) +
    '" style="display:inline-block;padding:14px 20px;font-size:13px;font-weight:bold;color:#ffffff;text-decoration:none">Időpont részleteinek megnyitása</a></td></tr></table>';
  body +=
    '<p style="font-size:11px;line-height:1.8;color:#68726b;margin:14px 0 0">Fiókkal bejelentkezés után, vendégként a kéréshez használt böngészőben érhető el. Más esetben keresd a szervizt telefonon.</p>';
  const phones = booking.phoneContacts
    ? booking.phoneContacts
        .map(
          (phone) =>
            '<a href="' +
            escape(phone.href) +
            '" style="color:#364538;display:inline-block;margin:4px 14px 0 0">' +
            escape(phone.label) +
            "</a>",
        )
        .join(" ")
    : escape(config.workshopPhone);
  return (
    '<!doctype html><html lang="hu"><head><meta name="viewport" content="width=device-width,initial-scale=1"></head><body style="margin:0;padding:0;background:#f3f2ed;color:#202724;font-family:Arial,sans-serif"><div style="display:none;max-height:0;overflow:hidden">' +
    escape(titles[job.event] + " · " + a.reference) +
    '</div><table role="presentation" width="100%" cellpadding="0" cellspacing="0" bgcolor="#f3f2ed"><tr><td style="padding:24px 12px"><table role="presentation" align="center" width="100%" cellpadding="0" cellspacing="0" style="width:100%;max-width:640px;background:#ffffff;border:1px solid #e2e6df;border-radius:12px;overflow:hidden"><tr><td bgcolor="#f7f8f4" style="padding:25px 26px;color:#202724;border-top:5px solid #a9bea0"><a href="' +
    escape(config.appUrl.replace(/\/$/, "")) +
    '" style="display:inline-block;text-decoration:none"><img src="' +
    escape(config.appUrl.replace(/\/$/, "") + "/images/fair-logo.png") +
    '" width="156" height="69" alt="Fair Autószerviz" style="display:block;width:156px;max-width:100%;height:auto;border:0"></a><p style="font-size:10px;letter-spacing:2px;margin:9px 0 0;color:#68726b">SZÉKESFEHÉRVÁR · ÜGYFÉLPORTÁL</p></td></tr><tr><td style="padding:26px"><h1 style="font-size:25px;line-height:1.35;margin:0 0 14px;font-weight:600">' +
    escape(titles[job.event]) +
    "</h1>" +
    body +
    '</td></tr><tr><td bgcolor="#f7f8f4" style="padding:20px 26px;border-top:1px solid #e2e6df"><p style="font-size:12px;font-weight:bold;margin:0 0 6px">Fair Autószerviz Fehérvár</p><p style="font-size:11px;line-height:1.8;color:#68726b;margin:0">' +
    escape(config.workshopAddress) +
    "<br>" +
    phones +
    '</p><p style="font-size:10px;line-height:1.7;color:#68726b;margin:14px 0 0">Automatikus szolgáltatási értesítés. A kérés részleteit a portálon követheted; egyeztetéshez hívj minket.</p></td></tr></table></td></tr></table></body></html>'
  );
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
    html: designedMessage(job, info),
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
      (user.getBool("verified") ||
        !user.getBool("emailVerificationRequired")) &&
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
