/// <reference path="../pb_data/types.d.ts" />
migrate(
  (app) => {
    const users = app.findCollectionByNameOrId("users");
    if (users.fields.getByName("emailVerificationRequired"))
      throw new Error(
        "users.emailVerificationRequired already exists; review before applying.",
      );
    users.fields.add(new BoolField({ name: "emailVerificationRequired" }));
    // Existing accounts keep their access without falsely marking their address as verified.
    users.authRule =
      "active = true && (verified = true || emailVerificationRequired = false)";
    users.createRule =
      "(" +
      users.createRule +
      ") && @request.body.emailVerificationRequired = true";
    users.updateRule =
      "(" +
      users.updateRule +
      ") && @request.body.emailVerificationRequired:isset = false";
    users.verificationToken.duration = 86400;
    users.passwordResetToken.duration = 1800;
    users.emailChangeToken.duration = 1800;
    const template = (title, action, description) => {
      const label =
        action === "verify"
          ? "E-mail-cím megerősítése"
          : action === "reset"
            ? "Új jelszó megadása"
            : "Címváltoztatás megerősítése";
      const body =
        '<!doctype html><html lang="hu"><head><meta name="viewport" content="width=device-width,initial-scale=1"></head><body style="margin:0;padding:0;background:#f3f2ed;font-family:Arial,sans-serif;color:#202724"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" bgcolor="#f3f2ed"><tr><td style="padding:24px 12px"><table role="presentation" align="center" width="100%" cellpadding="0" cellspacing="0" style="width:100%;max-width:600px;background:#ffffff;border:1px solid #e2e6df;border-radius:12px;overflow:hidden"><tr><td bgcolor="#202724" style="padding:25px 26px;color:#ffffff;border-top:5px solid #a9bea0"><p style="font-size:28px;font-weight:bold;letter-spacing:-1px;margin:0">fair<span style="font-size:15px;font-weight:normal;letter-spacing:0"> autószerviz</span></p><p style="font-size:10px;letter-spacing:2px;color:#cad6c8;margin:9px 0 0">ÜGYFÉLPORTÁL · FIÓKBIZTONSÁG</p></td></tr><tr><td style="padding:28px 26px"><h1 style="font-size:25px;line-height:1.35;margin:0 0 16px">' +
        title +
        '</h1><p style="font-size:14px;line-height:1.85;color:#68726b;margin:0 0 22px">' +
        description +
        '</p><table role="presentation" cellpadding="0" cellspacing="0"><tr><td bgcolor="#253c30" style="border-radius:6px"><a href="{APP_URL}/fiok-muvelet#action=' +
        action +
        '&amp;token={TOKEN}" style="display:inline-block;padding:15px 20px;font-size:13px;font-weight:bold;color:#ffffff;text-decoration:none">' +
        label +
        '</a></td></tr></table><div style="margin-top:24px;padding:15px;background:#f1f4ee;border-left:3px solid #a9bea0"><p style="font-size:12px;line-height:1.8;margin:0">A hivatkozás megnyitása után a portálon erősítheted meg a műveletet. A szerepköröd ettől nem változik meg.</p></div><p style="font-size:11px;line-height:1.8;color:#68726b;margin:22px 0 0">Ha nem te kezdeményezted, hagyd figyelmen kívül ezt a levelet. A hivatkozást és a jelszavadat ne oszd meg másokkal.</p></td></tr><tr><td bgcolor="#f7f8f4" style="padding:20px 26px;border-top:1px solid #e2e6df"><p style="font-size:12px;font-weight:bold;margin:0 0 7px">{APP_NAME}</p><a href="{APP_URL}" style="font-size:11px;color:#364538">Ügyfélportál megnyitása</a><p style="font-size:10px;color:#68726b;line-height:1.7;margin:12px 0 0">Automatikus fiókbiztonsági üzenet.</p></td></tr></table></td></tr></table></body></html>';
      return { subject: "Fair Autószerviz · " + title, body };
    };
    users.verificationTemplate = template(
      "E-mail-cím megerősítése",
      "verify",
      "A céges fiók aktiválásához erősítsd meg az e-mail-címedet. A hivatkozás 24 óráig érvényes; a cím igazolása nem ad munkatársi szerepet.",
    );
    users.resetPasswordTemplate = template(
      "Új jelszó beállítása",
      "reset",
      "Új jelszót kértél a fiókodhoz. A hivatkozás 30 percig érvényes.",
    );
    users.confirmEmailChangeTemplate = template(
      "E-mail-cím módosítása",
      "email",
      "A fiókod e-mail-címének módosítását kérted. A megerősítéshez a jelenlegi jelszavad is szükséges. A hivatkozás 30 percig érvényes.",
    );
    app.save(users);
    const settings = app.settings();
    settings.meta.appName = "Fair Autószerviz";
    settings.meta.appURL = "https://fairwebserviceclient.vercel.app";
    // Keep the operator's working sender and SMTP credentials intact.
    app.save(settings);
  },
  () => {
    throw new Error(
      "Rollback disabled to preserve authentication policy; use a reviewed forward migration.",
    );
  },
);
