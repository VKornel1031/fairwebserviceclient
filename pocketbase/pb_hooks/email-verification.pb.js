/// <reference path="../pb_data/types.d.ts" />
onRecordCreateRequest((event) => {
  if (!event.hasSuperuserAuth())
    event.record.set("emailVerificationRequired", true);
  return event.next();
}, "users");
onRecordUpdateRequest((event) => {
  if (!event.hasSuperuserAuth()) {
    const original = event.record.original();
    if (
      event.record.getBool("emailVerificationRequired") !==
      original.getBool("emailVerificationRequired")
    )
      throw new ForbiddenError(
        "Verification policy cannot be changed through the record API.",
      );
    if (event.record.getString("email") !== original.getString("email")) {
      if (
        !event.auth ||
        event.auth.getString("role") !== "admin" ||
        event.auth.id === event.record.id
      )
        throw new BadRequestError(
          "Use the email confirmation flow to change your address.",
        );
      // An administrator may correct another account's address; the new address must be proved.
      event.record.set("verified", false);
      event.record.set("emailVerificationRequired", true);
    }
  }
  return event.next();
}, "users");
