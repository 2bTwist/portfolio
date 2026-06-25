"use client";

/* ⌘K command palette. Lazy-loaded (next/dynamic, ssr:false) so its JS stays out
   of the initial bundle. Fuzzy-searches files + project content instantly and
   merges lazily-loaded full-text post hits into one score-ranked list, then
   router.push()es. */

import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from "react";
import { useRouter } from "next/navigation";
import { searchStatic, searchPosts, type SearchResult } from "@/app/lib/search";
import { SearchIcon } from "@/components/feel/animated-icons";
import { useOverlay, useSession } from "./store";

export default function CommandPalette() {
  const router = useRouter();
  const { closeCmdk } = useOverlay();
  const { openTab } = useSession();
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  // Post hits are tagged with the query they belong to, so a stale in-flight
  // result is ignored at render time (no setState-in-effect to clear it).
  const [postHits, setPostHits] = useState<{ q: string; hits: SearchResult[] }>({ q: "", hits: [] });
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus the input on open and restore focus to the trigger on close.
  useEffect(() => {
    const prev = document.activeElement as HTMLElement | null;
    inputRef.current?.focus();
    return () => prev?.focus?.();
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

  const staticHits = useMemo(() => searchStatic(query), [query]);

  const items = useMemo<SearchResult[]>(() => {
    const trimmed = query.trim();
    if (!trimmed) return staticHits; // default listing, no post noise
    const posts = postHits.q === trimmed ? postHits.hits : [];
    return [...staticHits, ...posts].sort((a, b) => a.score - b.score);
  }, [staticHits, postHits, query]);

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
    } else if (e.key === "Escape") {
      e.preventDefault();
      closeCmdk();
    } else if (e.key === "Tab") {
      // Trap focus: the input is the only tab stop (results are navigated with
      // the arrow keys via aria-activedescendant), so keep focus in the dialog.
      e.preventDefault();
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
            placeholder="Search files, projects, posts…"
            aria-label="Search files, projects, and posts"
            role="combobox"
            aria-expanded={items.length > 0}
            aria-controls="cmdk-listbox"
            aria-activedescendant={items.length > 0 ? `cmdk-opt-${current}` : undefined}
            aria-autocomplete="list"
            autoComplete="off"
            spellCheck={false}
          />
        </div>
        <ul id="cmdk-listbox" className="ide-palette-list" role="listbox" aria-label="Results">
          {items.map((r, i) => (
            <li key={`${r.kind}:${r.href}`} id={`cmdk-opt-${i}`} role="option" aria-selected={i === current}>
              <button
                type="button"
                className="ide-palette-item"
                data-active={i === current}
                tabIndex={-1}
                onMouseMove={() => setActive(i)}
                onClick={() => go(r.href)}
              >
                <span className="ide-palette-name">{r.name}</span>
                <span className="ide-palette-sub">{r.sub}</span>
                <span className="ide-palette-kind" data-kind={r.kind}>
                  {r.kind}
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
