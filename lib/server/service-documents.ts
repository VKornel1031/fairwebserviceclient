import "server-only";
import type { NextRequest } from "next/server";
import { AccountError, body, readLimitedBody } from "./http";
import { SERVICE_DOCUMENT_LIMIT } from "../service-documents";

const keys = [
  "mode",
  "totalHuf",
  "items",
  "note",
  "revision",
  "removeDocument",
];
export async function servicePriceBody(request: NextRequest) {
  const type = request.headers.get("content-type") || "";
  if (type.split(";")[0].trim().toLowerCase() !== "multipart/form-data")
    return body(request, keys);
  const bytes = await readLimitedBody(
    request.body,
    SERVICE_DOCUMENT_LIMIT + 16384,
  );
  let form: FormData;
  try {
    form = await new Request("http://service-document.invalid", {
      method: "POST",
      headers: { "Content-Type": type },
      body: new Uint8Array(bytes),
    }).formData();
  } catch {
    throw new AccountError(400, "Hibás feltöltési kérés.");
  }
  const entries = [...form.entries()];
  const payload = form.get("payload"),
    document = form.get("document");
  if (
    entries.length !== 2 ||
    form.getAll("payload").length !== 1 ||
    form.getAll("document").length !== 1 ||
    typeof payload !== "string" ||
    payload.length > 8192 ||
    !(document instanceof File)
  )
    throw new AccountError(400, "Egy dokumentumot és az ár adatait add meg.");
  let data: Record<string, unknown>;
  try {
    data = JSON.parse(payload);
  } catch {
    throw new AccountError(400, "Hibás árazási adatok.");
  }
  if (
    !data ||
    typeof data !== "object" ||
    Array.isArray(data) ||
    Object.keys(data).some((key) => !keys.includes(key))
  )
    throw new AccountError(400, "Nem engedélyezett árazási adatok.");
  if (document.size < 1 || document.size > SERVICE_DOCUMENT_LIMIT)
    throw new AccountError(413, "A melléklet legfeljebb 3 MB lehet.");
  const buffer = Buffer.from(await document.arrayBuffer());
  const mediaType =
    buffer.subarray(0, 5).toString() === "%PDF-"
      ? "application/pdf"
      : buffer[0] === 255 && buffer[1] === 216 && buffer[2] === 255
        ? "image/jpeg"
        : buffer
              .subarray(0, 8)
              .equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))
          ? "image/png"
          : "";
  const extension = document.name.split(".").pop()?.toLowerCase();
  if (
    !mediaType ||
    !(
      mediaType === "application/pdf"
        ? ["pdf"]
        : mediaType === "image/jpeg"
          ? ["jpg", "jpeg"]
          : ["png"]
    ).includes(extension || "")
  )
    throw new AccountError(415, "PDF, JPG vagy PNG dokumentumot válassz.");
  const upload = new FormData();
  upload.set("payload", JSON.stringify(data));
  upload.set(
    "document",
    new Blob([new Uint8Array(buffer)], { type: mediaType }),
    document.name,
  );
  return upload;
}
