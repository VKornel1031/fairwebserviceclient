/// <reference path="../pb_data/types.d.ts" />
// Enforce company-only partner creation even through PocketBase's native API.
// Legacy records are preserved; unrelated password/contact changes remain available.
routerAdd("GET", "/api/fairauto/account/registration-policy", (event) => {
  const users = $app.findCollectionByNameOrId("users");
  const roles = users.fields.getByName("role");
  return event.json(200, {
    companyOnly:
      roles.values.length === 4 &&
      roles.values.indexOf("customer") === -1 &&
      roles.values.indexOf("partner") !== -1,
  });
});

onRecordCreateRequest((event) => {
  // New accounts cannot already own a saved car; inspect the parsed record too.
  if (event.record.getString("defaultVehicle"))
    throw new BadRequestError(
      "A new account cannot select an existing vehicle.",
    );
  if (event.record.getString("role") === "partner") {
    const name = event.record.getString("companyName").trim();
    let tax = event.record.getString("companyTax").trim().replace(/\s/g, "");
    if (/^[0-9]{11}$/.test(tax))
      tax = tax.slice(0, 8) + "-" + tax.slice(8, 9) + "-" + tax.slice(9);
    if (
      name.length < 2 ||
      name.length > 120 ||
      !/^[0-9]{8}-[1-5]-[0-9]{2}$/.test(tax)
    )
      throw new BadRequestError(
        "Company name and a correctly formatted Hungarian tax number are required.",
      );
    event.record.set("companyName", name);
    event.record.set("companyTax", tax);
  }
  return event.next();
}, "users");

onRecordUpdateRequest((event) => {
  const original = event.record.original();
  if (
    event.record.getString("role") === "partner" &&
    (original.getString("role") !== "partner" ||
      original.getString("companyName") !==
        event.record.getString("companyName") ||
      original.getString("companyTax") !== event.record.getString("companyTax"))
  ) {
    const name = event.record.getString("companyName").trim();
    let tax = event.record.getString("companyTax").trim().replace(/\s/g, "");
    if (/^[0-9]{11}$/.test(tax))
      tax = tax.slice(0, 8) + "-" + tax.slice(8, 9) + "-" + tax.slice(9);
    if (
      name.length < 2 ||
      name.length > 120 ||
      !/^[0-9]{8}-[1-5]-[0-9]{2}$/.test(tax)
    )
      throw new BadRequestError(
        "Company name and a correctly formatted Hungarian tax number are required.",
      );
    event.record.set("companyName", name);
    event.record.set("companyTax", tax);
  }
  return event.next();
}, "users");
