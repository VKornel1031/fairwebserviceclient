import { consumerForms } from "@/content/consumer-forms";
import { legalDocuments } from "@/content/legal";
import { site } from "@/content/site";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ filename: string }> },
) {
  const { filename } = await params;
  if (Object.prototype.hasOwnProperty.call(consumerForms, filename)) {
    const form = consumerForms[filename as keyof typeof consumerForms];
    return download(filename, form.text);
  }
  if (filename === "aszf.txt") {
    const doc = legalDocuments.find((d) => d.slug === "aszf")!;
    const text = [
      `${doc.label} – ${site.name}`,
      `Változat: ${site.legal.version}`,
      `Frissítve: ${site.legal.updatedAt}`,
      "Szerkeszthető dokumentum a helyi demó működéséhez.",
      ...doc.sections.flatMap((section) => [
        "",
        section.title,
        ...(section.facts || []).map((f) => `${f.label}: ${f.value}`),
        ...(section.paragraphs || []),
        ...(section.items || []).map((item) => `- ${item}`),
      ]),
    ].join("\r\n");
    return download(filename, text);
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
