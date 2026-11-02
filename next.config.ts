import type { NextConfig } from "next";
const config: NextConfig = {
  devIndicators: false,
  poweredByHeader: false,
  distDir:
    process.env.NEXT_DIST_DIR ||
    (process.env.NODE_ENV === "development" ? ".next-dev" : ".next"),
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          ...(process.env.NODE_ENV === "production"
            ? [
                { key: "X-Frame-Options", value: "DENY" },
                { key: "Strict-Transport-Security", value: "max-age=31536000" },
                { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
              ]
            : []),
          {
            key: "Content-Security-Policy",
            value: `${process.env.NODE_ENV === "production" ? "frame-ancestors 'none'; " : ""}object-src 'none'; base-uri 'none'; form-action 'self'`,
          },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(), payment=()",
          },
        ],
      },
      {
        source: "/api/:path*",
        headers: [
          {
            key: "Content-Security-Policy",
            value: "default-src 'none'; frame-ancestors 'none'; sandbox",
          },
          { key: "Cross-Origin-Resource-Policy", value: "same-origin" },
          { key: "Cache-Control", value: "private, no-store, max-age=0" },
        ],
      },
      {
        source: "/fiok-muvelet",
        headers: [{ key: "Referrer-Policy", value: "no-referrer" }],
      },
    ];
  },
};
export default config;
