import type { NextConfig } from "next";

const isProd = process.env.NODE_ENV === "production";

/**
 * Dev: Next runs on :8080 and proxies Frappe endpoints to the bench
 * web server on :8000 (realtime socket connects directly to :9000).
 *
 * Prod: static export. `yarn build` runs `next build` and then
 * `scripts/copy-export.mjs`, which places assets in
 * `__APP__/public/__SPA__` (served at /assets/__APP__/__SPA__) and
 * HTML entry points in `__APP__/www`, so Frappe serves the app at /__SPA__.
 */
const nextConfig: NextConfig = {
  basePath: "/__SPA__",
  ...(isProd
    ? {
        output: "export" as const,
        assetPrefix: "/assets/__APP__/__SPA__",
        images: { unoptimized: true },
      }
    : {
        async rewrites() {
          const frappe = "http://127.0.0.1:8000";
          return ["api", "assets", "files", "private"].map((p) => ({
            source: `/${p}/:path*`,
            destination: `${frappe}/${p}/:path*`,
            basePath: false as const,
          }));
        },
      }),
};

export default nextConfig;
