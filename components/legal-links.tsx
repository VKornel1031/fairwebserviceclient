import Link from "next/link";
import { legalNavigation } from "@/content/site";
export default function LegalLinks({ current }: { current?: string }) {
  return (
    <nav className="legal-links" aria-label="Jogi tájékoztatók">
      {legalNavigation.map((doc) => (
        <Link
          key={doc.slug}
          href={`/${doc.slug}`}
          aria-current={current === doc.slug ? "page" : undefined}
        >
          {doc.label}
        </Link>
      ))}
    </nav>
  );
}
