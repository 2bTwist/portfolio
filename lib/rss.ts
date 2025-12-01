import { getAllPosts } from "./posts";

export function generateRss() {
  const posts = getAllPosts();

  const items = posts
    .map(
      (post) => `
    <item>
      <title><![CDATA[${post.title}]]></title>
      <link>https://eddyb.dev/blog/${post.slug}</link>
      <pubDate>${new Date(post.date).toUTCString()}</pubDate>
      <description><![CDATA[${post.summary}]]></description>
      <guid>https://eddyb.dev/blog/${post.slug}</guid>
    </item>`
    )
    .join("");

  return `<?xml version="1.0" encoding="UTF-8"?>
  <rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
    <channel>
      <title>Edmond Ndanji — Blog</title>
      <link>https://eddyb.dev</link>
      <description>Software engineering, product development, and building in public</description>
      <language>en</language>
      <atom:link href="https://eddyb.dev/rss.xml" rel="self" type="application/rss+xml" />
      ${items}
    </channel>
  </rss>`;
}
