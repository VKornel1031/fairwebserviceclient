import type { Metadata } from "next";
import { site } from "@/content/site";
import "./globals.css";
import "./fonts.css";
import "./legal-links.css";
import "./portal-roles.css";
export const metadata: Metadata = {
  title: `${site.shortName} · Ügyfélportál`,
  description: `Saját fiók, céges és munkatársi hozzáférés. ${site.name} – ügyfélportál.`,
};
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="hu" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `try{document.documentElement.dataset.theme=localStorage.getItem('fairauto-theme')||'light'}catch{}`,
          }}
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
