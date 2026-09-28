/* Plain-site navigation: works with JS off, crawlable, content in ~1 click.
   This is the fallback path the design law requires. In Phase 2 the IDE shell
   (file-tree explorer) layers over this on desktop; this nav stays for mobile
   and no-JS. Rendered inside the client Shell, and still server-rendered. */

import Link from "next/link";
import { profile } from "@/data/profile";
import { PAGES } from "@/data/pages";
import { ThemeSwatches } from "@/components/ide/ThemeSwatches";
import { tourAnchor } from "./tour";

// The compact subset each page declares in data/pages.ts, in its declared order.
const LINKS = PAGES.flatMap((p) => (p.compact ? [{ href: p.href, ...p.compact }] : [])).sort(
  (a, b) => a.order - b.order,
);

export function SiteNav() {
  return (
    <header
      className="site-nav px-4 sm:px-6 py-3 mono text-sm"
      style={{ borderBottom: "1px solid var(--border)", background: "var(--surface)" }}
    >
      {/* prefetch={false}: this is the mobile / no-JS fallback nav, hidden behind
          the IDE shell on desktop, whose Explorer already prefetches routes.
          Leaving it on double-fetched every route's RSC payload on load. */}
      <Link href="/" prefetch={false} className="no-underline shrink-0" style={{ color: "var(--muted)" }}>
        ~/edmond
      </Link>
      <nav aria-label="Primary" className="site-nav-links">
        {LINKS.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            prefetch={false}
            className="inline-flex min-h-9 items-center no-underline whitespace-nowrap hover:opacity-80"
            style={{ color: "var(--text)" }}
          >
            {l.label}
          </Link>
        ))}
      </nav>
      <div className="site-nav-actions">
        {/* The desktop switcher lives in the status bar, which is hidden here. */}
        <ThemeSwatches className="site-theme" swatchClassName="site-theme-swatch" {...tourAnchor("themes")} />
        <a
          href={profile.links.github}
          target="_blank"
          rel="noopener noreferrer"
          className="no-underline whitespace-nowrap hover:opacity-80"
          style={{ color: "var(--muted)" }}
        >
          GitHub ↗
        </a>
      </div>
    </header>
  );
}
