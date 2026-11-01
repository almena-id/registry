import type { NextConfig } from "next";

import { securityHeaders } from "./app/lib/security-headers";

const nextConfig: NextConfig = {
  // Self-contained server in .next/standalone, for the Docker image.
  output: "standalone",
  // `task dev` behind a proxy (../develop): let the portal's public origin
  // reach the dev server's resources (hot reload).
  allowedDevOrigins: [
    new URL(process.env.NEXT_PUBLIC_REGISTRY_WEB_URL ?? "http://localhost")
      .hostname,
  ],
  // On every response; each page's Content Security Policy is proxy.ts's.
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
  // The catalogue's screens moved to the templates' own entries: old links
  // land where they went (more specific first).
  async redirects() {
    const old = "/dashboard/catalogue";
    return [
      [`${old}/credentials/:rest*`, "/dashboard/credential-types/:rest*"],
      [`${old}/domains/:rest*`, "/dashboard/value-lists/:rest*"],
      [`${old}/categories/:rest*`, "/dashboard/categories/fields"],
      [`${old}/:rest*`, "/dashboard/fields/:rest*"],
    ].map(([source, destination]) => ({
      source,
      destination,
      permanent: true,
    }));
  },
};

export default nextConfig;
