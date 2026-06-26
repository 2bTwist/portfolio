import path from "node:path";
import type { NextConfig } from "next";
import withBundleAnalyzer from "@next/bundle-analyzer";

const nextConfig: NextConfig = {
  reactCompiler: true,
  // Native View Transitions: lets the router wrap route navigations in
  // document.startViewTransition, so elements sharing a `view-transition-name`
  // (the project card image and the detail-page banner) morph between routes.
  // No client JS on the cards; Firefox degrades to an instant nav.
  experimental: {
    viewTransition: true,
  },
  // Dev-only: allow the LAN IP so the containerized browser used for agent
  // smoke-testing can load dev resources (lazy chunks / HMR). No prod effect.
  allowedDevOrigins: ["192.168.1.185"],
  // next-mdx-remote ships untranspiled ESM that must share Turbopack's React
  // instance, or compileMDX renders against a second copy of React.
  transpilePackages: ["next-mdx-remote"],
  // Pin the workspace root so Turbopack never mis-infers it (it briefly
  // resolved `app/` as the root and failed to find the `next` package).
  turbopack: {
    root: path.resolve("."),
  },
  // Baseline security headers for every response (Vercel also adds HSTS).
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(), browsing-topics=()",
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
        ],
      },
    ];
  },
};

// `ANALYZE=true pnpm build` (or `pnpm analyze`) opens a bundle treemap.
export default withBundleAnalyzer({ enabled: process.env.ANALYZE === "true" })(nextConfig);
