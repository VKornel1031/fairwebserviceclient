import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowUpRight, FileText } from "lucide-react";
import { legalDocuments } from "@/content/legal";
import { site } from "@/content/site";
import LegalLinks from "@/components/legal-links";
import ThemeToggle from "@/components/theme-toggle";
import { currentWordCopy } from "@/lib/legal-downloads";

export function generateStaticParams() {
  return legalDocuments.map((doc) => ({ document: doc.slug }));
}
export async function generateMetadata({
  params,
}: {
  params: Promise<{ document: string }>;
}): Promise<Metadata> {
  const { document } = await params;
  const doc = legalDocuments.find((d) => d.slug === document);
  if (!doc) return {};
  return {
    title: `${doc.label} · ${site.shortName}`,
    description: doc.description,
  };
}
export default async function LegalPage({
  params,
}: {
  params: Promise<{ document: string }>;
}) {
  const { document } = await params;
  const doc = legalDocuments.find((d) => d.slug === document);
  if (!doc) notFound();
  const wordCopy = currentWordCopy(doc);
  const updated = new Date(
    `${site.legal.updatedAt}T12:00:00`,
  ).toLocaleDateString("hu-HU", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  return (
    <div className="legal-page">
      <a href="#legal-main" className="skip-link">
        Ugrás a tartalomra
      </a>
      <header className="legal-header legal-container">
        <Link
          href="/"
          className="legal-brand"
          aria-label={`${site.shortName} – főoldal`}
        >
          <img src={site.logo} alt={site.name} width={139} height={62} />
        </Link>
        <div>
          <Link href="/attekintes" className="text-link">
            Ügyfélportál <ArrowUpRight size={15} />
          </Link>
          <ThemeToggle />
        </div>
      </header>
      <main id="legal-main" className="legal-container">
        <Link href="/" className="legal-back">
          <ArrowLeft size={14} /> Vissza a főoldalra
        </Link>
        <div className="legal-intro">
          <p className="eyebrow">
            {site.shortName.toLocaleUpperCase("hu")} · TÁJÉKOZTATÓK
          </p>
          <h1>{doc.label}</h1>
          <p>{doc.description}</p>
          <div className="legal-meta">
            <span>
              Frissítve: <time dateTime={site.legal.updatedAt}>{updated}</time>
            </span>
          </div>
        </div>
        <div className="legal-layout">
          <aside className="legal-navigation">
            <p className="eyebrow">DOKUMENTUMOK</p>
            <LegalLinks current={doc.slug} />
            <details className="legal-contents" open>
              <summary>Ezen az oldalon</summary>
              <nav aria-label="Tartalomjegyzék">
                {doc.sections.map((section, i) => (
                  <a key={section.id} href={`#${section.id}`}>
                    <span>{String(i + 1).padStart(2, "0")}</span>
                    {section.title}
                  </a>
                ))}
              </nav>
            </details>
          </aside>
          <article className="legal-article">
            <div className="legal-article-title">
              <FileText size={22} strokeWidth={1.3} />
              <h2>{doc.title}</h2>
            </div>
            {doc.download && (
              <div className="legal-downloads">
                <a
                  className="legal-download"
                  href={`/dokumentumok/${doc.download.filename}`}
                  download
                >
                  {doc.download.label} <ArrowUpRight size={14} />
                </a>
                {wordCopy && (
                  <a
                    className="legal-download"
                    href={`/dokumentumok/jogi/${wordCopy.filename}`}
                    download
                  >
                    Word változat letöltése (.docx) <ArrowUpRight size={14} />
                  </a>
                )}
              </div>
            )}
            {doc.sections.map((section, i) => (
              <section
                key={section.id}
                id={section.id}
                className="legal-section"
              >
                <h3>
                  <span>{String(i + 1).padStart(2, "0")}</span>
                  {section.title}
                </h3>
                {section.facts && (
                  <dl className="legal-facts">
                    {section.facts.map((fact) => (
                      <div key={fact.label}>
                        <dt>{fact.label}</dt>
                        <dd>{fact.value}</dd>
                      </div>
                    ))}
                  </dl>
                )}
                {section.paragraphs?.map((p) => (
                  <p key={p}>{p}</p>
                ))}
                {section.items && (
                  <ul>
                    {section.items.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                )}
                {section.links && (
                  <ul className="legal-section-links">
                    {section.links.map((link) => (
                      <li key={link.href}>
                        <a
                          href={link.href}
                          download={link.download || undefined}
                          target={
                            link.href.startsWith("https://")
                              ? "_blank"
                              : undefined
                          }
                          rel={
                            link.href.startsWith("https://")
                              ? "noreferrer"
                              : undefined
                          }
                        >
                          {link.label}
                          <ArrowUpRight size={13} />
                        </a>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            ))}
            <div className="legal-contact">
              <p>Kérdésed van a tájékoztatóval kapcsolatban?</p>
              <a href={`mailto:${site.legal.privacyEmail}`}>
                {site.legal.privacyEmail} <ArrowUpRight size={15} />
              </a>
            </div>
          </article>
        </div>
      </main>
      <footer className="legal-footer legal-container">
        <span>
          © {new Date().getFullYear()} {site.name}
        </span>
        <LegalLinks current={doc.slug} />
      </footer>
    </div>
  );
}
