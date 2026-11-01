/// <reference path="../pb_data/types.d.ts" />
migrate(
  (app) => {
    const users = app.findCollectionByNameOrId("users");
    for (const name of [
      "verificationTemplate",
      "resetPasswordTemplate",
      "confirmEmailChangeTemplate",
    ]) {
      const template = users[name];
      users[name] = {
        subject: template.subject,
        body: template.body.replace(
          "ÜGYFÉLPORTÁL · FIÓKBIZTONSÁG",
          "ÜGYFÉLPORTÁL",
        ),
      };
    }
    app.save(users);
  },
  () => {
    throw new Error("Use a forward migration to change email branding.");
  },
);
