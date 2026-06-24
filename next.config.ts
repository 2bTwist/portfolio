import path from "node:path";
import type { NextConfig } from "next";
import withBundleAnalyzer from "@next/bundle-analyzer";

const nextConfig: NextConfig = {
  reactCompiler: true,
  // Dev-only: allow the LAN IP so the containerized browser used for agent
  // smoke-testing can load dev resources (lazy chunks / HMR). No prod effect.
  allowedDevOrigins: ["192.168.1.185"],
  // next-mdx-remote ships untranspiled ESM that must share Turbopack's React
  // instance, or compileMDX renders against a second copy of React. three /
  // @react-three ship modern ESM that Next transpiles for the bundler.
  transpilePackages: ["next-mdx-remote", "three", "@react-three/fiber", "@react-three/drei"],
  // Pin the workspace root so Turbopack never mis-infers it (it briefly
  // resolved `app/` as the root and failed to find the `next` package).
  turbopack: {
    root: path.resolve("."),
  },
};

// `ANALYZE=true pnpm build` (or `pnpm analyze`) opens a bundle treemap.
export default withBundleAnalyzer({ enabled: process.env.ANALYZE === "true" })(nextConfig);
