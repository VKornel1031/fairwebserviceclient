/// <reference path="../pb_data/types.d.ts" />
// Reuse users.avatar and preserve existing field IDs and files. Back up pb_data first.
migrate(
  (app) => {
    const collection = app.findCollectionByNameOrId("users");
    let avatar = collection.fields.getByName("avatar");
    if (!avatar) {
      avatar = new FileField({ name: "avatar" });
      collection.fields.add(avatar);
    }
    if (avatar.type() !== "file")
      throw new Error("users.avatar must be a File field.");
    avatar.maxSelect = 1;
    avatar.required = false;
    avatar.maxSize = 1048576;
    avatar.mimeTypes = ["image/jpeg", "image/png", "image/webp"];
    avatar.protected = true;
    avatar.hidden = false;
    app.save(collection);
  },
  () => {
    throw new Error(
      "Automatic rollback is disabled to avoid publishing private account images. Restore a reviewed backup or apply a forward migration.",
    );
  },
);
