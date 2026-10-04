"use client";

/* Open-file tabs. Driven entirely by navigation (see store.tsx): visiting a
   known route opens a tab here. Clicking a tab navigates; the × closes it.

   Right-click a tab, or press Shift+F10 / the context-menu key on it, for a VS
   Code-style menu (Close / Close Others / Close All). The menu follows the
   WAI-ARIA menu pattern: focus moves to its first item, Up/Down/Home/End move
   between enabled items, and Escape or Tab closes it and returns focus to the
   tab it was opened from (or to the current tab if that one was closed).
   Keyboard shortcuts use Alt instead of ⌘ because the browser reserves ⌘W /
   Ctrl+W (it closes the browser tab and can't be reliably intercepted):
     Alt+W → close active · Alt+Shift+W → close others · Alt+Shift+A → close all */

import Link from "@/components/site/Link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState, type KeyboardEvent as ReactKeyboardEvent } from "react";
import { createPortal } from "react-dom";
import { FileIcon } from "./FileIcon";
import { useTabSession } from "./store";
import { beginRowDrag, consumeSuppressClick } from "./rowDrag";
import { isBrowserOwnedClick } from "./linkActivation";
import { useIsMac, chord } from "./keys";
import { scrollEditorTop } from "./scroll";

type MenuState = { href: string; name: string; x: number; y: number } | null;

export function Tabs({ className = "" }: { className?: string }) {
  const pathname = usePathname();
  const { tabs, closeTab, closeOthers, closeAll } = useTabSession();
  const [menu, setMenu] = useState<MenuState>(null);
  const isMac = useIsMac();

  const menuRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLElement | null>(null);

  const restoreFocusRef = useRef(false);

  // Closing from the keyboard or an item returns focus to the tab that opened
  // the menu, or to the current tab when an item just closed that one.
  const dismissMenu = () => {
    restoreFocusRef.current = true;
    setMenu(null);
  };
  // After the commit, so a tab the item closed is already gone.
  useEffect(() => {
    if (menu || !restoreFocusRef.current) return;
    restoreFocusRef.current = false;
    const trigger = triggerRef.current;
    const target = trigger?.isConnected
      ? trigger
      : document.querySelector<HTMLElement>('[aria-label="Open files"] a[aria-current="page"]');
    target?.focus();
  }, [menu, tabs]);

  // Opens the menu for `tab`, at the pointer or, from the keyboard, under the tab.
  function openMenu(tab: { href: string; name: string }, tabEl: HTMLElement, at?: { x: number; y: number }) {
    triggerRef.current = tabEl.querySelector("a");
    const box = tabEl.getBoundingClientRect();
    setMenu({ href: tab.href, name: tab.name, x: at?.x ?? box.left, y: at?.y ?? box.bottom });
  }

  // Focus the first enabled item as the menu opens.
  useEffect(() => {
    if (menu) menuRef.current?.querySelector<HTMLElement>('[role="menuitem"]:not(:disabled)')?.focus();
  }, [menu]);

  function onMenuKeyDown(e: ReactKeyboardEvent<HTMLDivElement>) {
    const items = [...e.currentTarget.querySelectorAll<HTMLElement>('[role="menuitem"]:not(:disabled)')];
    const at = items.indexOf(document.activeElement as HTMLElement);
    const move = (i: number) => {
      e.preventDefault();
      items[(i + items.length) % items.length]?.focus();
    };
    if (e.key === "ArrowDown") move(at + 1);
    else if (e.key === "ArrowUp") move(at - 1);
    else if (e.key === "Home") move(0);
    else if (e.key === "End") move(items.length - 1);
    else if (e.key === "Escape" || e.key === "Tab") {
      e.preventDefault();
      e.stopPropagation();
      dismissMenu();
    }
  }

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
    const closeMenu = () => setMenu(null);
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
  }, [menu]);

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
              data-sound="view"
              data-active={active}
              onPointerDown={(e) => beginRowDrag(e, tab.href, tab.name)}
              onContextMenu={(e) => {
                e.preventDefault();
                // A context-menu event without a pointer position on the tab
                // (a screen reader's menu command) opens under the tab instead.
                const box = e.currentTarget.getBoundingClientRect();
                const onTab = e.clientX >= box.left && e.clientX <= box.right && e.clientY >= box.top && e.clientY <= box.bottom;
                openMenu(tab, e.currentTarget, onTab ? { x: e.clientX, y: e.clientY } : undefined);
              }}
              // Shift+F10 and the context-menu key open the menu the same way on
              // every platform (browsers only map Shift+F10 off macOS).
              onKeyDown={(e) => {
                if ((e.key === "F10" && e.shiftKey) || e.key === "ContextMenu") {
                  e.preventDefault();
                  openMenu(tab, e.currentTarget);
                }
              }}
            >
              <Link
                href={tab.href}
                prefetch={false}
                aria-current={active ? "page" : undefined}
                onClick={(e) => {
                  if (consumeSuppressClick(e)) {
                    e.preventDefault();
                    return;
                  }
                  // Re-clicking the active tab scrolls its page back to top;
                  // a modified click still opens it in a new browser tab.
                  if (active && !isBrowserOwnedClick(e)) {
                    e.preventDefault();
                    scrollEditorTop();
                  }
                }}
              >
                <FileIcon name={tab.name} className="ide-file-icon" />
                {tab.name}
              </Link>
              <button
                type="button"
                className="ide-tab-close"
                data-sound="close"
                aria-label={`Close ${tab.name}`}
                onClick={() => closeTab(tab.href)}
              >
                <span aria-hidden="true">×</span>
              </button>
            </div>
          );
        })}

        {/* Right-aligned resume actions: a fixed "hire me" bubble + the download. */}
        {pathname === "/resume" ? (
          <div className="ide-tab-cta">
            <span className="ide-hire" aria-hidden="true">
              {/* eslint-disable-next-line @next/next/no-img-element -- animated gif must stay unoptimized */}
              <img
                className="ide-hire-gif"
                src="/images/shaking-fist.gif"
                alt=""
                width={22}
                height={22}
              />
              <span className="ide-hire-text">you better hire me!</span>
            </span>
            <a className="ide-tab-action" href="/resume/download" data-sound="press">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M12 3v12" />
                <path d="M7 11l5 5 5-5" />
                <path d="M5 21h14" />
              </svg>
              Download PDF
            </a>
          </div>
        ) : null}
      </div>

      {menu
        ? createPortal(
            <div
              ref={menuRef}
              className="ide-tab-menu"
              role="menu"
              aria-label={`${menu.name} tab`}
              onKeyDown={onMenuKeyDown}
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
                tabIndex={-1}
                className="ide-tab-menu-item"
                onClick={() => {
                  closeTab(menu.href);
                  dismissMenu();
                }}
              >
                <span>Close</span>
                <span className="ide-tab-menu-key">{chord(isMac, ["alt"], "W")}</span>
              </button>
              <button
                type="button"
                role="menuitem"
                tabIndex={-1}
                className="ide-tab-menu-item"
                disabled={soloTab}
                onClick={() => {
                  closeOthers(menu.href);
                  dismissMenu();
                }}
              >
                <span>Close Others</span>
                <span className="ide-tab-menu-key">{chord(isMac, ["alt", "shift"], "W")}</span>
              </button>
              <button
                type="button"
                role="menuitem"
                tabIndex={-1}
                className="ide-tab-menu-item"
                onClick={() => {
                  closeAll();
                  dismissMenu();
                }}
              >
                <span>Close All</span>
                <span className="ide-tab-menu-key">{chord(isMac, ["alt", "shift"], "A")}</span>
              </button>
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
