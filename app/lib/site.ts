/* Canonical site origin, single source for metadata, sitemap, robots, RSS, and
   OpenGraph. Prefers NEXT_PUBLIC_SITE_URL (set it in Vercel), and falls back to
   the production domain so absolute URLs are correct even if the env is unset.
   Local dev gets localhost only when explicitly set. */
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://eddyb.dev").replace(/\/$/, "");
