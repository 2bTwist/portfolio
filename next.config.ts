import path from "node:path";
import type { NextConfig } from "next";
import withBundleAnalyzer from "@next/bundle-analyzer";

const nextConfig: NextConfig = {
  reactCompiler: true,
  // next-mdx-remote ships untranspiled ESM that must share Turbopack's React
  // instance, or compileMDX renders against a second copy of React.
  transpilePackages: ["next-mdx-remote"],
  // Pin the workspace root so Turbopack never mis-infers it (it briefly
  // resolved `app/` as the root and failed to find the `next` package).
  turbopack: {
    root: path.resolve("."),
  },
};

// `ANALYZE=true pnpm build` (or `pnpm analyze`) opens a bundle treemap.
export default withBundleAnalyzer({ enabled: process.env.ANALYZE === "true" })(nextConfig);
