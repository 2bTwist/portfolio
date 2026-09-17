import { fetchGitHubContributions } from "@/app/lib/github-contributions";
import { bundledGitHubContributions } from "@/data/github-contributions";

export const revalidate = 21600;

function jsonResponse(data: unknown, headers: HeadersInit) {
  const body = JSON.stringify(data);
  return new Response(body, {
    headers: {
      "Content-Type": "application/json",
      "Content-Length": String(new TextEncoder().encode(body).byteLength),
      ...headers,
    },
  });
}

export async function GET() {
  try {
    const snapshot = await fetchGitHubContributions();
    const grid = {
      total: snapshot.total,
      activeDays: snapshot.activeDays,
      weeks: snapshot.weeks,
      months: snapshot.months,
    };
    return jsonResponse(grid, {
      "Cache-Control": "public, s-maxage=21600, stale-while-revalidate=86400",
    });
  } catch (error) {
    console.error("Unable to refresh GitHub contributions", error);
    return jsonResponse(bundledGitHubContributions, {
      "Cache-Control": "public, s-maxage=300, stale-while-revalidate=86400",
      "X-Contribution-Source": "bundled",
    });
  }
}
