"use client";

/* Open-file tabs. Driven entirely by navigation (see store.tsx): visiting a
   known route opens a tab here. Clicking a tab navigates; the × closes it.

   Right-click a tab for a VS Code-style menu (Close / Close Others / Close All).
   Keyboard shortcuts use Alt instead of ⌘ because the browser reserves ⌘W /
   Ctrl+W (it closes the browser tab and can't be reliably intercepted):
     Alt+W → close active · Alt+Shift+W → close others · Alt+Shift+A → close all */

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useSession } from "./store";

type MenuState = { href: string; name: string; x: number; y: number } | null;

export function Tabs({ className = "" }: { className?: string }) {
  const pathname = usePathname();
  const { tabs, closeTab, closeOthers, closeAll } = useSession();
  const [menu, setMenu] = useState<MenuState>(null);

  const closeMenu = useCallback(() => setMenu(null), []);

  // Browser-safe keyboard shortcuts. Ignored while typing in a field so Option
  // key combos that produce characters don't also nuke tabs.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (!e.altKey) return;
      const el = document.activeElement;
      if (el && /^(INPUT|TEXTAREA)$/.test(el.tagName)) return;
      if ((el as HTMLElement | null)?.isContentEditable) return;
      // Use e.code, not e.key: on macOS Option+W composes to "∑", so e.key
      // wouldn't be "w". e.code ("KeyW") is layout- and compose-proof.
      if (e.shiftKey && e.code === "KeyA") {
        e.preventDefault();
        closeAll();
      } else if (e.shiftKey && e.code === "KeyW") {
        e.preventDefault();
        closeOthers(pathname);
      } else if (!e.shiftKey && e.code === "KeyW") {
        e.preventDefault();
        closeTab(pathname);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [pathname, closeTab, closeOthers, closeAll]);

  // Dismiss the context menu on any outside interaction / Escape / blur.
  useEffect(() => {
    if (!menu) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setMenu(null);
    }
    window.addEventListener("pointerdown", closeMenu);
    window.addEventListener("blur", closeMenu);
    window.addEventListener("resize", closeMenu);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("pointerdown", closeMenu);
      window.removeEventListener("blur", closeMenu);
      window.removeEventListener("resize", closeMenu);
      window.removeEventListener("keydown", onKey);
    };
  }, [menu, closeMenu]);

  if (tabs.length === 0) {
    return <div className={className} aria-hidden />;
  }

  const soloTab = tabs.length <= 1;

  return (
    <>
      <div className={className} aria-label="Open files">
        {tabs.map((tab) => {
          const active = tab.href === pathname;
          return (
            <div
              key={tab.href}
              className="ide-tab"
              data-active={active}
              onContextMenu={(e) => {
                e.preventDefault();
                setMenu({ href: tab.href, name: tab.name, x: e.clientX, y: e.clientY });
              }}
            >
              <Link href={tab.href} prefetch aria-current={active ? "page" : undefined}>
                {tab.name}
              </Link>
              <button
                type="button"
                className="ide-tab-close"
                aria-label={`Close ${tab.name}`}
                onClick={() => closeTab(tab.href)}
              >
                ×
              </button>
            </div>
          );
        })}

        {/* Editor action, right-aligned: download the real file on the resume page. */}
        {pathname === "/resume" ? (
          <a className="ide-tab-action" href="/resume/download">

            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M12 3v12" />
              <path d="M7 11l5 5 5-5" />
              <path d="M5 21h14" />
            </svg>
            Download PDF
          </a>
        ) : null}
      </div>

      {menu
        ? createPortal(
            <div
              className="ide-tab-menu"
              role="menu"
              // clamp so the menu never spills off-screen (~210px wide)
              style={{
                left: Math.min(menu.x, window.innerWidth - 218),
                top: Math.min(menu.y, window.innerHeight - 130),
              }}
              // keep the outside-click listener from firing before the item click
              onPointerDown={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                role="menuitem"
                className="ide-tab-menu-item"
                onClick={() => {
                  closeTab(menu.href);
                  closeMenu();
                }}
              >
                <span>Close</span>
                <span className="ide-tab-menu-key">⌥W</span>
              </button>
              <button
                type="button"
                role="menuitem"
                className="ide-tab-menu-item"
                disabled={soloTab}
                onClick={() => {
                  closeOthers(menu.href);
                  closeMenu();
                }}
              >
                <span>Close Others</span>
                <span className="ide-tab-menu-key">⌥⇧W</span>
              </button>
              <button
                type="button"
                role="menuitem"
                className="ide-tab-menu-item"
                onClick={() => {
                  closeAll();
                  closeMenu();
                }}
              >
                <span>Close All</span>
                <span className="ide-tab-menu-key">⌥⇧A</span>
              </button>
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
