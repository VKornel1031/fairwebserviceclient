import "server-only";
import { createHash } from "node:crypto";
import type { LegalDocument } from "@/content/legal";
import { site } from "@/content/site";
import wordCopies from "@/content/legal-downloads.json";

export function legalDocumentText(doc: LegalDocument) {
  return [
    `${doc.label} – ${site.name}`,
    `Változat: ${site.legal.version}`,
    `Frissítve: ${site.legal.updatedAt}`,
    "Szerkeszthető dokumentum; az üzemeltetői felülvizsgálat állapotát a webhely jelzi.",
    ...doc.sections.flatMap((section) => [
      "",
      section.title,
      ...(section.facts || []).map((fact) => `${fact.label}: ${fact.value}`),
      ...(section.paragraphs || []),
      ...(section.items || []).map((item) => `- ${item}`),
      ...(section.links || []).map((link) => `${link.label}: ${link.href}`),
    ]),
  ].join("\r\n");
}
/** An outdated Word copy is never linked as the current document. */
export function currentWordCopy(doc: LegalDocument) {
  const hash = createHash("sha256")
    .update("\uFEFF" + legalDocumentText(doc))
    .digest("hex");
  return wordCopies.find(
    (copy) =>
      copy.slug === doc.slug &&
      copy.version === site.legal.version &&
      copy.sourceSha256 === hash,
  );
}
