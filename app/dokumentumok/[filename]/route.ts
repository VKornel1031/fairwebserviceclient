import { consumerForms } from "@/content/consumer-forms";
import { legalDocuments } from "@/content/legal";
import { legalDocumentText } from "@/lib/legal-downloads";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ filename: string }> },
) {
  const { filename } = await params;
  if (Object.prototype.hasOwnProperty.call(consumerForms, filename)) {
    const form = consumerForms[filename as keyof typeof consumerForms];
    return download(filename, form.text);
  }
  const doc = legalDocuments.find((d) => d.download?.filename === filename);
  if (doc) {
    return download(filename, legalDocumentText(doc));
  }
  return new Response("A dokumentum nem található.", { status: 404 });
}
function download(filename: string, text: string) {
  return new Response("\uFEFF" + text, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "X-Content-Type-Options": "nosniff",
    },
  });
}
