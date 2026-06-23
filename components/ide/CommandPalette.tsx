"use client";

/* ⌘K command palette. Lazy-loaded (next/dynamic, ssr:false) so its JS stays out
   of the initial bundle. Filters the shared NAV index and router.push()es.
   Full-text post search is wired in Phase 4. */

import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from "react";
import { useRouter } from "next/navigation";
import { NAV } from "@/app/lib/nav";
import { SearchIcon } from "@/components/feel/animated-icons";
import { useOverlay, useSession } from "./store";

export default function CommandPalette() {
  const router = useRouter();
  const { closeCmdk } = useOverlay();
  const { openTab } = useSession();
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return NAV;
    return NAV.filter((n) => n.name.toLowerCase().includes(q) || n.href.toLowerCase().includes(q));
  }, [query]);

  // Clamp during render rather than resetting via an effect.
  const current = results.length === 0 ? 0 : Math.min(active, results.length - 1);

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
      setActive(Math.min(current + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive(Math.max(current - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const r = results[current];
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
            placeholder="Go to file…"
            aria-label="Search files"
            autoComplete="off"
            spellCheck={false}
          />
        </div>
        <ul className="ide-palette-list" role="listbox" aria-label="Results">
          {results.map((r, i) => (
            <li key={r.href} role="option" aria-selected={i === current}>
              <button
                type="button"
                className="ide-palette-item"
                data-active={i === current}
                onMouseMove={() => setActive(i)}
                onClick={() => go(r.href)}
              >
                <span>{r.name}</span>
                <span className="ml-auto" style={{ color: "var(--muted)" }}>
                  {r.href}
                </span>
              </button>
            </li>
          ))}
          {results.length === 0 ? <li className="ide-palette-empty">no matches</li> : null}
        </ul>
      </div>
    </div>
  );
}
