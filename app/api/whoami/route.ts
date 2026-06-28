/* What the server sees about you, for the data-reveal card. Reads the IP and
   coarse geo that Vercel's edge attaches to every request as headers. Runs on
   the edge, never stores anything, and is never cached (each visitor is
   different). Locally these headers are absent, so the fields come back null
   and the card just shows the client-side data. */

export const runtime = "edge";
export const dynamic = "force-dynamic";

function decode(v: string | null): string | null {
  if (!v) return null;
  try {
    return decodeURIComponent(v);
  } catch {
    return v;
  }
}

export function GET(request: Request) {
  const h = request.headers;
  const ip =
    (h.get("x-forwarded-for")?.split(",")[0] || h.get("x-real-ip") || "").trim() || null;

  return Response.json(
    {
      ip,
      city: decode(h.get("x-vercel-ip-city")),
      region: decode(h.get("x-vercel-ip-country-region")),
      country: h.get("x-vercel-ip-country"),
      timezone: h.get("x-vercel-ip-timezone"),
    },
    { headers: { "cache-control": "no-store" } },
  );
}
