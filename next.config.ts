import path from "node:path";
import type { NextConfig } from "next";
import withBundleAnalyzer from "@next/bundle-analyzer";

const nextConfig: NextConfig = {
  reactCompiler: true,
  // Pin the workspace root so Turbopack never mis-infers it (it briefly
  // resolved `app/` as the root and failed to find the `next` package).
  turbopack: {
    root: path.resolve("."),
  },
};

// `ANALYZE=true pnpm build` (or `pnpm analyze`) opens a bundle treemap.
export default withBundleAnalyzer({ enabled: process.env.ANALYZE === "true" })(nextConfig);
