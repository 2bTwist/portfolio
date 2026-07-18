import path from "node:path";
import type { NextConfig } from "next";
import withBundleAnalyzer from "@next/bundle-analyzer";

const nextConfig: NextConfig = {
  reactCompiler: true,
  // Serve AVIF to browsers that accept it (20-40% smaller than WebP for
  // photographic content — the About portrait is the big win), WebP otherwise.
  // Negotiated per-request by the optimizer, so there's no compat risk.
  images: {
    formats: ["image/avif", "image/webp"],
  },
  // The card<->banner shared-element morph is hand-rolled (components/content/
  // MorphImage.tsx, FLIP via the Web Animations API) rather than Next/React
  // View Transitions, because those don't animate on the browser back button
  // (React skips popstate VTs for sync scroll restoration; vercel/next.js#94369).
  // The FLIP version works on every navigation, so no viewTransition flag.
  // Dev-only: allow the LAN IP so the containerized browser used for agent
  // smoke-testing can load dev resources (lazy chunks / HMR). No prod effect.
  allowedDevOrigins: ["192.168.1.185", "192.168.1.191", "100.98.111.54"],
  // next-mdx-remote ships untranspiled ESM that must share Turbopack's React
  // instance, or compileMDX renders against a second copy of React.
  transpilePackages: ["next-mdx-remote"],
  // Pin the workspace root so Turbopack never mis-infers it (it briefly
  // resolved `app/` as the root and failed to find the `next` package).
  turbopack: {
    root: path.resolve("."),
  },
  // The blog used to live at /writing; keep those URLs (and anything Google
  // indexed) alive with permanent redirects to the new /blog routes.
  async redirects() {
    return [
      { source: "/writing", destination: "/blog", permanent: true },
      { source: "/writing/:path*", destination: "/blog/:path*", permanent: true },
    ];
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
