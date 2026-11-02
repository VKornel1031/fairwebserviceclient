import type { Metadata } from "next";
import { headers } from "next/headers";
import { site } from "@/content/site";
import "./globals.css";
import "./fonts.css";
import "./legal-links.css";
import "./portal-roles.css";
export const metadata: Metadata = {
  title: `${site.shortName} · Ügyfélportál`,
  description: `Saját fiók, céges és munkatársi hozzáférés. ${site.name} – ügyfélportál.`,
};
export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const nonce = (await headers()).get("x-nonce") || undefined;
  return (
    <html lang="hu" suppressHydrationWarning>
      <head>
        <script
          nonce={nonce}
          dangerouslySetInnerHTML={{
            __html: `try{document.documentElement.dataset.theme=localStorage.getItem('fairauto-theme')||'light'}catch{}`,
          }}
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
