/// <reference path="../pb_data/types.d.ts" />
migrate(
  (app) => {
    const appointments = app.findCollectionByNameOrId("appointments");
    const documents = new Collection({
      name: "appointment_documents",
      type: "base",
    });
    documents.fields.add(
      new RelationField({
        name: "appointment",
        required: true,
        collectionId: appointments.id,
        maxSelect: 1,
        cascadeDelete: true,
      }),
    );
    documents.fields.add(
      new FileField({
        name: "file",
        required: true,
        maxSelect: 1,
        maxSize: 3145728,
        mimeTypes: ["application/pdf", "image/jpeg", "image/png"],
        protected: true,
        thumbs: [],
      }),
    );
    documents.fields.add(
      new TextField({ name: "name", required: true, max: 120 }),
    );
    documents.fields.add(
      new TextField({ name: "mediaType", required: true, max: 30 }),
    );
    documents.fields.add(
      new NumberField({
        name: "size",
        required: true,
        min: 1,
        max: 3145728,
        onlyInt: true,
      }),
    );
    documents.fields.add(
      new AutodateField({ name: "created", onCreate: true }),
    );
    documents.indexes = [
      "CREATE INDEX idx_appointment_documents_parent ON appointment_documents (appointment)",
    ];
    // No native read/write rules: custom routes authorize against the live parent.
    // Records are immutable so an older queued price email keeps its own document.
    app.save(documents);
  },
  () => {
    throw new Error("Rollback disabled to preserve service documents.");
  },
);
