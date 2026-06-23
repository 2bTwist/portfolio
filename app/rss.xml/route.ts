import { generateRss } from "@/app/lib/rss";

export const dynamic = "force-static";

export function GET() {
  return new Response(generateRss(), {
    headers: { "Content-Type": "application/xml; charset=utf-8" },
  });
}
