import type { NextConfig } from "next";

/**
 * STANDALONE serving mode — full SSR, ISR, API routes, server actions.
 *
 * Dev:  next dev -p 8080, proxying Frappe endpoints to :8000.
 * Prod: `yarn build && yarn start` runs a Node server on :3000.
 *       nginx must route /__SPA__ → Next and keep /api, /assets, /files,
 *       /socket.io → Frappe (see README "Standalone mode" section).
 *
 * Server-side fetches to Frappe should use process.env.FRAPPE_URL
 * (e.g. http://127.0.0.1:8000) and forward the incoming cookies.
 */
const isProd = process.env.NODE_ENV === "production";
const frappe = process.env.FRAPPE_URL ?? "http://127.0.0.1:8000";

const nextConfig: NextConfig = {
  basePath: "/__SPA__",
  output: "standalone",
  ...(isProd
    ? {}
    : {
        async rewrites() {
          return ["api", "assets", "files", "private"].map((p) => ({
            source: `/${p}/:path*`,
            destination: `${frappe}/${p}/:path*`,
            basePath: false as const,
          }));
        },
      }),
};

export default nextConfig;
