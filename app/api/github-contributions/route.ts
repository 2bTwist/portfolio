import { fetchGitHubContributions } from "@/app/lib/github-contributions";
import { bundledGitHubContributions } from "@/data/github-contributions";

export const revalidate = 21600;

export async function GET() {
  try {
    const snapshot = await fetchGitHubContributions();
    const grid = {
      total: snapshot.total,
      activeDays: snapshot.activeDays,
      weeks: snapshot.weeks,
      months: snapshot.months,
    };
    return Response.json(grid, {
      headers: {
        "Cache-Control": "public, s-maxage=21600, stale-while-revalidate=86400",
      },
    });
  } catch (error) {
    console.error("Unable to refresh GitHub contributions", error);
    return Response.json(bundledGitHubContributions, {
      headers: {
        "Cache-Control": "public, s-maxage=300, stale-while-revalidate=86400",
        "X-Contribution-Source": "bundled",
      },
    });
  }
}
