import { expect, test, type APIRequestContext } from "@playwright/test";
import { PAGES } from "@/data/pages";

/* Every shareable route unfurls as itself. A page's openGraph or twitter object
   replaces the layout's whole object, so a page that sets neither unfurls as the
   homepage and one that sets them partially loses the card image. Routes come from
   the sitemap, the page registry (which adds the noindex pages), and the tag links on
   each post (tag pages are in neither), not a list. */

async function sharePaths(request: APIRequestContext): Promise<string[]> {
  const xml = await (await request.get("/sitemap.xml")).text();
  const fromSitemap = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => new URL(m[1]).pathname);
  const tagPages: string[] = [];
  for (const post of fromSitemap.filter((p) => /^\/blog\/[^/]+$/.test(p))) {
    const html = await (await request.get(post)).text();
    tagPages.push(...[...html.matchAll(/href="(\/blog\/tag\/[^"#?]+)"/g)].map((m) => m[1]));
  }
  expect(tagPages.length, "tag links on posts").toBeGreaterThan(0);
  return [...new Set([...fromSitemap, ...PAGES.map((p) => p.href), ...tagPages])];
}

function tags(html: string) {
  const meta = (attr: "property" | "name", key: string) =>
    html.match(new RegExp(`<meta ${attr}="${key}" content="([^"]*)"`))?.[1];
  return {
    canonical: html.match(/<link rel="canonical" href="([^"]*)"/)?.[1],
    description: meta("name", "description"),
    ogTitle: meta("property", "og:title"),
    ogDescription: meta("property", "og:description"),
    ogUrl: meta("property", "og:url"),
    ogSiteName: meta("property", "og:site_name"),
    ogImage: meta("property", "og:image"),
    twitterTitle: meta("name", "twitter:title"),
    twitterImage: meta("name", "twitter:image"),
  };
}

test("every shareable route unfurls with its own title, url, and a working card image", async ({ request }) => {
  const home = tags(await (await request.get("/")).text());
  const paths = await sharePaths(request);
  expect(paths.length).toBeGreaterThan(PAGES.length);

  for (const path of paths) {
    const t = tags(await (await request.get(path)).text());
    expect.soft(t.ogUrl, `${path} og:url`).toBe(t.canonical);
    expect.soft(t.ogSiteName, `${path} og:site_name`).toBe("Edmond Ndanji");
    expect.soft(t.ogDescription, `${path} og:description`).toBe(t.description);
    expect.soft(t.twitterTitle, `${path} twitter:title`).toBe(t.ogTitle);
    if (path !== "/") expect.soft(t.ogTitle, `${path} og:title`).not.toBe(home.ogTitle);

    for (const [key, url] of [["og:image", t.ogImage], ["twitter:image", t.twitterImage]] as const) {
      expect.soft(url, `${path} ${key}`).toBeTruthy();
      if (!url) continue;
      // Absolute URLs name production; fetch the same path from the server under test.
      const { pathname, search } = new URL(url);
      const res = await request.get(pathname + search);
      expect.soft(res.status(), `${path} ${key} status`).toBe(200);
      expect.soft(res.headers()["content-type"], `${path} ${key} type`).toMatch(/^image\//);
    }
  }
});
