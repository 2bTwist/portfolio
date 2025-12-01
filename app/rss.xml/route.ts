import { generateRss } from "@/lib/rss";

export async function GET() {
  const feed = generateRss();
  return new Response(feed, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
    },
  });
}
