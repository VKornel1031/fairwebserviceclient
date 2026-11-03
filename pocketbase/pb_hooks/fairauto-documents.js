// Private, immutable service documents. Never trust a caller-supplied storage key.
const maximum = 3145728;
function fail(status, code) {
  throw new ApiError(
    status,
    "Service document request could not be completed.",
    {
      fairautoCode: new ValidationError(
        code,
        "Service document request could not be completed.",
      ),
    },
  );
}
exports.setup = (app) => {
  let collection;
  try {
    collection = app.findCollectionByNameOrId("appointment_documents");
  } catch {
    fail(503, "documents_setup_required");
  }
  const file = collection.fields.getByName("file");
  if (
    ["listRule", "viewRule", "createRule", "updateRule", "deleteRule"].some(
      (key) => collection[key] != null,
    ) ||
    !file ||
    !file.protected ||
    file.maxSelect !== 1 ||
    file.maxSize !== maximum ||
    JSON.stringify(Array.from(file.mimeTypes).sort()) !==
      JSON.stringify(["application/pdf", "image/jpeg", "image/png"]) ||
    file.thumbs.length ||
    collection.fields.getByName("appointment")?.collectionId !==
      app.findCollectionByNameOrId("appointments").id ||
    !collection.fields.getByName("appointment")?.cascadeDelete
  )
    fail(503, "documents_setup_required");
  return collection;
};
exports.input = (e) => {
  const files = e.findUploadedFiles("document");
  const form = e.request.multipartForm;
  if (
    !form ||
    Object.keys(form.value).length !== 1 ||
    !form.value.payload ||
    form.value.payload.length !== 1 ||
    Object.keys(form.file).length !== 1 ||
    files.length !== 1 ||
    !files[0]
  )
    fail(400, "invalid_document");
  if (form.value.payload[0].length > 8192) fail(413, "invalid_document");
  let data;
  try {
    data = JSON.parse(form.value.payload[0]);
  } catch {
    fail(400, "invalid_details");
  }
  const file = files[0];
  if (file.size < 1 || file.size > maximum) fail(413, "invalid_document");
  const reader = file.reader.open();
  let bytes;
  try {
    bytes = toBytes(reader, 16);
  } finally {
    reader.close();
  }
  let mediaType, extension;
  if (
    bytes.length >= 8 &&
    bytes[0] === 37 &&
    bytes[1] === 80 &&
    bytes[2] === 68 &&
    bytes[3] === 70 &&
    bytes[4] === 45
  ) {
    mediaType = "application/pdf";
    extension = "pdf";
  } else if (
    bytes.length >= 3 &&
    bytes[0] === 255 &&
    bytes[1] === 216 &&
    bytes[2] === 255
  ) {
    mediaType = "image/jpeg";
    extension = "jpg";
  } else if (
    bytes.length >= 8 &&
    [137, 80, 78, 71, 13, 10, 26, 10].every((value, i) => bytes[i] === value)
  ) {
    mediaType = "image/png";
    extension = "png";
  } else fail(415, "invalid_document");
  const suffix = (file.originalName.split(".").pop() || "").toLowerCase();
  if ((extension === "jpg" ? ["jpg", "jpeg"] : [extension]).indexOf(suffix) < 0)
    fail(415, "invalid_document");
  const basename =
    file.originalName
      .replace(/\.[^.]*$/, "")
      .replace(/[^a-zA-Z0-9._ -]/g, "_")
      .replace(/^\.+/, "")
      .slice(0, 110) || "document";
  const name = basename + "." + extension;
  file.name = "document_" + $security.randomString(15) + "." + extension;
  return { data, upload: { file, name, mediaType, size: file.size } };
};
exports.save = (app, appointment, upload) => {
  const document = new Record(exports.setup(app));
  document.set("appointment", appointment.id);
  document.set("file", upload.file);
  document.set("name", upload.name);
  document.set("mediaType", upload.mediaType);
  document.set("size", upload.size);
  app.save(document);
  return {
    id: document.id,
    name: upload.name,
    mediaType: upload.mediaType,
    size: upload.size,
  };
};
exports.find = (app, appointment, identifier) => {
  exports.setup(app);
  if (!/^[a-z0-9]{15}$/.test(identifier || ""))
    fail(404, "appointment_missing");
  let document;
  try {
    document = app.findRecordById("appointment_documents", identifier);
  } catch {
    fail(404, "appointment_missing");
  }
  if (document.getString("appointment") !== appointment.id)
    fail(404, "appointment_missing");
  return document;
};
exports.key = (document) =>
  document.baseFilesPath() + "/" + document.getString("file");
