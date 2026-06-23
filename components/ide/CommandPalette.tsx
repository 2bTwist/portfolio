"use client";

/* ⌘K command palette. Lazy-loaded (next/dynamic, ssr:false) so its JS stays out
   of the initial bundle. Filters the shared NAV index for files and queries the
   lazily-loaded post search index (Fuse + /search-index.json, both fetched on
   first keystroke) for full-text post matches, then router.push()es. */

import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from "react";
import { useRouter } from "next/navigation";
import { NAV } from "@/app/lib/nav";
import { searchPosts, type PostHit } from "@/app/lib/search";
import { SearchIcon } from "@/components/feel/animated-icons";
import { useOverlay, useSession } from "./store";

type Item = { kind: "file" | "post"; name: string; sub: string; href: string };

export default function CommandPalette() {
  const router = useRouter();
  const { closeCmdk } = useOverlay();
  const { openTab } = useSession();
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  // Post hits are tagged with the query they belong to, so a stale in-flight
  // result is simply ignored at render time (no setState-in-effect to clear it).
  const [postHits, setPostHits] = useState<{ q: string; hits: PostHit[] }>({ q: "", hits: [] });
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Query the lazy post index whenever the search text changes (race-guarded).
  useEffect(() => {
    const q = query.trim();
    if (!q) return;
    let stale = false;
    searchPosts(q).then((hits) => {
      if (!stale) setPostHits({ q, hits });
    });
    return () => {
      stale = true;
    };
  }, [query]);

  const items = useMemo<Item[]>(() => {
    const trimmed = query.trim();
    const q = trimmed.toLowerCase();
    const files: Item[] = (q ? NAV.filter((n) => n.name.toLowerCase().includes(q) || n.href.toLowerCase().includes(q)) : NAV).map(
      (n) => ({ kind: "file", name: n.name, sub: n.href, href: n.href }),
    );
    const posts: Item[] =
      trimmed && postHits.q === trimmed
        ? postHits.hits.map((p) => ({ kind: "post", name: p.title, sub: p.summary, href: `/writing/${p.slug}` }))
        : [];
    return [...files, ...posts];
  }, [query, postHits]);

  // Clamp during render rather than resetting via an effect.
  const current = items.length === 0 ? 0 : Math.min(active, items.length - 1);

  function onChangeQuery(v: string) {
    setQuery(v);
    setActive(0);
  }

  function go(href: string) {
    closeCmdk();
    openTab(href);
    router.push(href);
  }

  function onKeyDown(e: KeyboardEvent) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive(Math.min(current + 1, items.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive(Math.max(current - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const r = items[current];
      if (r) go(r.href);
    }
  }

  return (
    <div className="ide-overlay" onClick={() => closeCmdk()}>
      <div
        className="ide-palette"
        role="dialog"
        aria-modal="true"
        aria-label="Command palette"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="ide-palette-input-row">
          <span className="ide-palette-search" aria-hidden="true">
            <SearchIcon />
          </span>
          <input
            ref={inputRef}
            className="ide-palette-input"
            value={query}
            onChange={(e) => onChangeQuery(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Go to file or search posts…"
            aria-label="Search files and posts"
            autoComplete="off"
            spellCheck={false}
          />
        </div>
        <ul className="ide-palette-list" role="listbox" aria-label="Results">
          {items.map((r, i) => (
            <li key={`${r.kind}:${r.href}`} role="option" aria-selected={i === current}>
              <button
                type="button"
                className="ide-palette-item"
                data-active={i === current}
                onMouseMove={() => setActive(i)}
                onClick={() => go(r.href)}
              >
                <span>{r.name}</span>
                <span className="ml-auto truncate pl-4" style={{ color: "var(--muted)" }}>
                  {r.kind === "post" ? "post" : r.sub}
                </span>
              </button>
            </li>
          ))}
          {items.length === 0 ? <li className="ide-palette-empty">no matches</li> : null}
        </ul>
      </div>
    </div>
  );
}
