/// <reference path="../pb_data/types.d.ts" />
routerAdd("GET", "/api/fairauto/appointments/config", (e) =>
  require(__hooks + "/fairauto-appointments.js").configRoute(e),
);
routerAdd("GET", "/api/fairauto/appointments/availability", (e) =>
  require(__hooks + "/fairauto-appointments.js").availabilityRoute(e),
);
routerAdd("GET", "/api/fairauto/appointments", (e) =>
  require(__hooks + "/fairauto-appointments.js").listRoute(e),
);
routerAdd(
  "POST",
  "/api/fairauto/appointments",
  (e) => require(__hooks + "/fairauto-appointments.js").createRoute(e),
  $apis.bodyLimit(16384),
);
routerAdd("GET", "/api/fairauto/appointments/summary", (e) =>
  require(__hooks + "/fairauto-appointments.js").summaryRoute(e),
);
routerAdd("GET", "/api/fairauto/appointments/dashboard", (e) =>
  require(__hooks + "/fairauto-appointments.js").dashboardRoute(e),
);
routerAdd("GET", "/api/fairauto/appointments/closures", (e) =>
  require(__hooks + "/fairauto-appointments.js").closuresRoute(e),
);
routerAdd(
  "PUT",
  "/api/fairauto/appointments/closures",
  (e) => require(__hooks + "/fairauto-appointments.js").closeRoute(e),
  $apis.bodyLimit(2048),
);
routerAdd(
  "DELETE",
  "/api/fairauto/appointments/closures",
  (e) => require(__hooks + "/fairauto-appointments.js").openRoute(e),
  $apis.bodyLimit(2048),
);
routerAdd("GET", "/api/fairauto/appointments/{id}", (e) =>
  require(__hooks + "/fairauto-appointments.js").detailRoute(e),
);
routerAdd(
  "PATCH",
  "/api/fairauto/appointments/{id}",
  (e) => require(__hooks + "/fairauto-appointments.js").rescheduleRoute(e),
  $apis.bodyLimit(16384),
);
routerAdd(
  "POST",
  "/api/fairauto/appointments/{id}/status",
  (e) => require(__hooks + "/fairauto-appointments.js").statusRoute(e),
  $apis.bodyLimit(2048),
);
routerAdd(
  "PUT",
  "/api/fairauto/appointments/{id}/price",
  (e) => require(__hooks + "/fairauto-appointments.js").priceRoute(e),
  $apis.bodyLimit(16384),
);
cronAdd("fairauto-appointment-mail", "* * * * *", () =>
  require(__hooks + "/fairauto-mail.js").process($app),
);
cronAdd("fairauto-guest-retention", "* * * * *", () =>
  require(__hooks + "/fairauto-retention.js").process($app),
);
routerAdd("GET", "/api/fairauto/appointments/mail-status", (e) =>
  require(__hooks + "/fairauto-appointments.js").mailStatusRoute(e),
);
routerAdd(
  "POST",
  "/api/fairauto/appointments/mail-retry",
  (e) => require(__hooks + "/fairauto-appointments.js").mailRetryRoute(e),
  $apis.bodyLimit(1024),
);
