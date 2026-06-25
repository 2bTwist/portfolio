/* Plain-site navigation: works with JS off, crawlable, content in ~1 click.
   This is the fallback path the design law requires. In Phase 2 the IDE shell
   (file-tree explorer) layers over this on desktop; this nav stays for mobile
   and no-JS. Server component. */

import Link from "next/link";
import { profile } from "@/data/profile";

const LINKS = [
  { href: "/", label: "README" },
  { href: "/projects", label: "projects" },
  { href: "/about", label: "about" },
  { href: "/experience", label: "experience" },
  { href: "/writing", label: "writing" },
];

export function SiteNav() {
  return (
    <header
      className="sticky top-0 z-30 flex items-center gap-4 px-4 sm:px-6 py-3 mono text-sm"
      style={{ borderBottom: "1px solid var(--border)", background: "var(--surface)" }}
    >
      <Link href="/" className="no-underline shrink-0" style={{ color: "var(--muted)" }}>
        ~/edmond
      </Link>
      <nav aria-label="Primary" className="flex items-center gap-3 sm:gap-4 overflow-x-auto">
        {LINKS.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            className="no-underline whitespace-nowrap hover:opacity-80"
            style={{ color: "var(--text)" }}
          >
            {l.label}
          </Link>
        ))}
      </nav>
      <a
        href={profile.links.github}
        target="_blank"
        rel="noopener noreferrer"
        className="ml-auto no-underline whitespace-nowrap hover:opacity-80"
        style={{ color: "var(--muted)" }}
      >
        GitHub ↗
      </a>
    </header>
  );
}
