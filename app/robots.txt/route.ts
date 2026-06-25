import { SITE_URL } from "@/app/lib/site";

/* Custom robots route so we can leave a note for the curious (the metadata
   robots API can't emit comments). Still a valid robots.txt: open crawl + host
   + sitemap. */

export const dynamic = "force-static";

export function GET() {
  const body = `# Hi there, curious human (or unusually thorough bot).
# If you read robots.txt for fun, we'd probably get along.
# Recruiters welcome, no allowlist needed: ndanjiedmond@gmail.com
#
# Crawl away. Nothing here is off-limits.

User-agent: *
Allow: /

Host: ${SITE_URL}
Sitemap: ${SITE_URL}/sitemap.xml
`;
  return new Response(body, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
