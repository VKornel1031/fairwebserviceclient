import type { NextConfig } from "next";
const config: NextConfig = {
  devIndicators: false,
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
            ? [{ key: "X-Frame-Options", value: "DENY" }]
            : []),
          {
            key: "Content-Security-Policy",
            value: `${process.env.NODE_ENV === "production" ? "frame-ancestors 'none'; " : ""}base-uri 'self'; form-action 'self'`,
          },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(), payment=()",
          },
        ],
      },
    ];
  },
};
export default config;
