/// <reference path="../pb_data/types.d.ts" />
routerAdd("GET", "/api/fairauto/security-policy", (event) =>
  event.json(200, {
    version: 1,
    ready: require(__hooks + "/fairauto-security.js").ready(event.app),
  }),
);
routerUse((event) => require(__hooks + "/fairauto-security.js").request(event));
onRecordAuthWithPasswordRequest(
  (event) => require(__hooks + "/fairauto-security.js").passwordAuth(event),
  "users",
  "_superusers",
);
cronAdd("fairauto-security-cleanup", "*/15 * * * *", () => {
  $app
    .db()
    .newQuery("DELETE FROM security_limits WHERE expiresAt <= {:now}")
    .bind({ now: Date.now() })
    .execute();
});
onRecordUpdateRequest(
  (event) => require(__hooks + "/fairauto-security.js").passwordProof(event),
  "users",
);
onRecordConfirmEmailChangeRequest(
  (event) => require(__hooks + "/fairauto-security.js").emailChangeProof(event),
  "users",
);
