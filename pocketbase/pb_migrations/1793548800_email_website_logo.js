/// <reference path="../pb_data/types.d.ts" />
migrate(
  (app) => {
    const users = app.findCollectionByNameOrId("users");
    const oldLogo =
      '<p style="font-size:28px;font-weight:bold;letter-spacing:-1px;margin:0">fair<span style="font-size:15px;font-weight:normal;letter-spacing:0"> autószerviz</span></p>';
    const logo =
      '<a href="{APP_URL}" style="display:inline-block;text-decoration:none"><img src="{APP_URL}/images/fair-logo.png" width="156" height="69" alt="Fair Autószerviz" style="display:block;width:156px;max-width:100%;height:auto;border:0"></a>';
    for (const name of [
      "verificationTemplate",
      "resetPasswordTemplate",
      "confirmEmailChangeTemplate",
    ]) {
      const template = users[name];
      if (!template.body.includes(oldLogo))
        throw new Error(
          "Apply the email verification migration first; review any custom account email templates before replacing their logo.",
        );
      users[name] = {
        subject: template.subject,
        body: template.body
          .replace(oldLogo, logo)
          .replace(
            '<td bgcolor="#202724" style="padding:25px 26px;color:#ffffff;border-top:5px solid #a9bea0">',
            '<td bgcolor="#f7f8f4" style="padding:25px 26px;color:#202724;border-top:5px solid #a9bea0">',
          )
          .replace("color:#cad6c8", "color:#68726b"),
      };
    }
    // Only the branding changes; preserve authentication policy, links and SMTP settings.
    app.save(users);
  },
  () => {
    throw new Error("Use a forward migration to change email branding.");
  },
);
