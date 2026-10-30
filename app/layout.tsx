import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = {
  title: "Fair Autószerviz · Ügyfélportál",
  description:
    "Időpontfoglalás, saját járművek és céges flottakezelés. Fair Autószerviz Fehérvár – működő demó.",
};
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="hu" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;450;500;550;600;650;700&family=Outfit:wght@400;450;500;550;600;650;700&display=swap"
          rel="stylesheet"
        />
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
