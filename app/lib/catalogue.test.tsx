import { readdirSync } from "node:fs";
import { join, relative, sep } from "node:path";
import type { ReactNode } from "react";
import { describe, it, expect, vi } from "vitest";
import { render } from "@testing-library/react";

// next/link needs a mounted app router; a plain anchor is enough to read the links.
vi.mock("next/link", () => ({
  default: ({ href, children }: { href: string; children: ReactNode }) => <a href={href}>{children}</a>,
}));

import { getCatalogue } from "@/app/lib/catalogue";
import { catalogueView } from "@/app/lib/catalogue-view";
import { getAllPosts } from "@/app/lib/posts";
import { SITE_URL } from "@/app/lib/site";
import sitemap from "@/app/sitemap";
import { PAGES } from "@/data/pages";
import { SiteNav } from "@/components/site/SiteNav";

/* Parity gate for the page catalogue (specs/decisions/2026-09-27-page-catalogue.md).
   Every route list is a view of the catalogue; these checks catch the drift
   that once dropped /music from the sitemap and gave blog posts no tab. */

// Routes that exist on purpose without being pages (none today).
const NOT_PAGES = new Set<string>([]);

// Every app/**/page.* as a route pattern ("/blog/[slug]") and the file behind it.
function appRoutes(): { route: string; file: string }[] {
  const appDir = join(process.cwd(), "app");
  const found: { route: string; file: string }[] = [];
  const walk = (dir: string) => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      if (entry.isDirectory() && !entry.name.startsWith("_")) walk(join(dir, entry.name));
      else if (/^page\.(tsx?|jsx?|mdx)$/.test(entry.name)) {
        const segments = relative(appDir, dir).split(sep).filter((s) => s && !s.startsWith("("));
        found.push({ route: `/${segments.join("/")}`, file: join(dir, entry.name) });
      }
    }
  };
  walk(appDir);
  return found.filter((r) => !NOT_PAGES.has(r.route));
}

const matches = (route: string, href: string) =>
  new RegExp(`^${route.replace(/\[[^\]]+\]/g, "[^/]+")}$`).test(href);

// The pages a dynamic route builds, from its generateStaticParams; null when it
// has none, so its pages cannot be listed.
async function builtHrefs(route: string, file: string): Promise<string[] | null> {
  const page = await import(/* @vite-ignore */ file);
  if (typeof page.generateStaticParams !== "function") return null;
  const params: Record<string, string>[] = await page.generateStaticParams();
  return params.map((p) => route.replace(/\[([^\]]+)\]/g, (_, name: string) => p[name]));
}

describe("page catalogue", () => {
  const catalogue = getCatalogue();
  const hrefs = catalogue.map((e) => e.href);

  it("gives every page one entry", () => {
    expect(new Set(hrefs).size).toBe(hrefs.length);
  });

  it("covers every app route, and every entry is a real route", () => {
    const routes = appRoutes().map((r) => r.route);
    const unlisted = routes.filter((r) => !r.includes("[") && !hrefs.includes(r));
    const orphaned = hrefs.filter((h) => !routes.some((r) => matches(r, h)));
    expect({ unlisted, orphaned }).toEqual({ unlisted: [], orphaned: [] });
  });

  it("has an entry for every page a dynamic route builds", async () => {
    const unenumerated: string[] = [];
    const missing: string[] = [];
    for (const { route, file } of appRoutes().filter((r) => r.route.includes("["))) {
      const built = await builtHrefs(route, file);
      if (built === null) unenumerated.push(route);
      else missing.push(...built.filter((h) => !hrefs.includes(h)));
    }
    expect({ unenumerated, missing }).toEqual({ unenumerated: [], missing: [] });
  });

  it("puts exactly the indexable pages in the sitemap", () => {
    const urls = sitemap().map((e) => e.url).sort();
    const indexable = catalogue
      .filter((e) => e.indexable)
      .map((e) => `${SITE_URL}${e.href === "/" ? "" : e.href}`)
      .sort();
    expect(urls).toEqual(indexable);
  });

  it("renders the declared compact subset as the phone nav, in order", () => {
    const { container } = render(<SiteNav />);
    const rendered = [...container.querySelectorAll('nav[aria-label="Primary"] a')].map((a) => [
      a.getAttribute("href"),
      a.textContent,
    ]);
    const declared = PAGES.flatMap((p) => (p.compact ? [p] : []))
      .sort((a, b) => a.compact.order - b.compact.order)
      .map((p) => [p.href, p.compact.label]);
    expect(rendered).toEqual(declared);
  });

  it("gives every published post a tab label and a place in the blog folder", () => {
    const view = catalogueView(catalogue);
    const posts = getAllPosts().map((p) => ({ href: `/blog/${p.slug}`, label: `${p.slug}.md` }));
    expect(posts.length).toBeGreaterThan(0);
    expect(posts.map((p) => ({ href: p.href, label: view.find(p.href)?.label }))).toEqual(posts);

    const blogFolder = view.tree.find((n) => n.type === "folder" && n.href === "/blog");
    expect(blogFolder?.type === "folder" ? blogFolder.children.map((c) => c.href) : null).toEqual(
      posts.map((p) => p.href),
    );
  });
});
