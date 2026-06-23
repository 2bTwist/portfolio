/* RSS feed (Phase 4). Base URL comes from NEXT_PUBLIC_SITE_URL so the feed is
   correct across local / preview / prod, rather than a hardcoded domain. */

import { getAllPosts } from "./posts";
import { profile } from "@/data/profile";

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");

export function generateRss(): string {
  const posts = getAllPosts();

  const items = posts
    .map(
      (post) => `
    <item>
      <title><![CDATA[${post.title}]]></title>
      <link>${SITE_URL}/writing/${post.slug}</link>
      <pubDate>${new Date(post.date).toUTCString()}</pubDate>
      <description><![CDATA[${post.summary}]]></description>
      <guid>${SITE_URL}/writing/${post.slug}</guid>
    </item>`,
    )
    .join("");

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${profile.name} — Writing</title>
    <link>${SITE_URL}</link>
    <description>Software engineering, product development, and building in public</description>
    <language>en</language>
    <atom:link href="${SITE_URL}/rss.xml" rel="self" type="application/rss+xml" />
    ${items}
  </channel>
</rss>`;
}
