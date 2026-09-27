"use client";

/* File-tree explorer. File rows are real prefetched <Link>s mapping file ->
   route, so they work with JS off (folders render expanded; file links navigate).
   Folder rows are toggle buttons: clicking the row expands/collapses it (editor
   behaviour); the projects index is still reachable via ⌘K / the "all projects"
   link. Active row = current pathname.

   Layout is a fixed grid: [indent][twistie slot][icon slot][name]. Both slots are
   fixed width so every row aligns deterministically and nothing shifts when the
   client-only icons mount.

   Resize: drag the right edge, or focus it and use the arrow keys (ResizeHandle
   owns the drag and writes the width straight to the DOM). Shove the pointer past
   the range and a scripted bouncer escalates, eventually revoking your privileges
   (a cooldown), then giving up. Keys stop at the limit and never set it off. */

import Link from "next/link";
import dynamic from "next/dynamic";
import { createPortal } from "react-dom";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import type { TreeNode } from "@/app/lib/catalogue-view";
import { useCatalogue } from "./CatalogueProvider";
import { useMounted } from "@/components/hooks/useMounted";
import { useSound } from "@/components/feel/SoundProvider";
import { FileIcon, FolderIcon } from "./FileIcon";
import { useTabSession } from "./store";
import { beginRowDrag, consumeSuppressClick } from "./rowDrag";
import { ResizeHandle } from "./ResizeHandle";
import { scrollEditorTop } from "./scroll";

// Lazy like the mobile dock's mount: ssr:false keeps the widget + player store
// chunk off the initial bundle (the size budget is tight); it renders null
// until playback starts, so it costs nothing when no music is playing.
const NowPlayingCard = dynamic(
  () => import("@/components/music/NowPlayingCard").then((m) => m.NowPlayingCard),
  { ssr: false },
);

const MIN_WIDTH = 170;
const MAX_WIDTH = 300;
const WON_MAX = 460; // once they "win", the cap relaxes
const DEFAULT_WIDTH = 220;
const SLOP = 28; // how far past the limit before the bouncer reacts
const COOLDOWN_MS = 8000;
const STORAGE_KEY = "ide:explorer-width";
// Widths (limits, default, the saved value) are base px at a 16px root. They
// render as rem so the sidebar grows with the large-monitor root scale in
// globals.css, and drag deltas are divided by that scale to stay in base px.
const widthRem = (px: number) => `${px / 16}rem`;
const INDENT_REM = 0.85;
const BASE_PAD_REM = 0.45;

// Escalating bouncer. `lock` revokes resizing for a cooldown; `won` gives up.
const SCRIPT: { msg: string; lock?: boolean; won?: boolean }[] = [
  { msg: "that's enough!" },
  { msg: "I said that's enough 😤" },
  { msg: "you don't listen, do you" },
  { msg: "right, privileges revoked 🔒", lock: true },
  { msg: "back at this again? 🙄" },
  { msg: "okay, I give up. you win 🏳️", won: true },
];

// The width saved on an earlier visit, read once per page load: null on the
// server, and when nothing valid is saved.
let savedWidth: number | null | undefined;
function readSavedWidth(): number | null {
  if (savedWidth === undefined) {
    try {
      const saved = Number(localStorage.getItem(STORAGE_KEY));
      savedWidth = saved >= MIN_WIDTH && saved <= WON_MAX ? saved : null;
    } catch {
      savedWidth = null;
    }
  }
  return savedWidth;
}
const neverChanges = () => () => {};

function Chevron({ open }: { open: boolean }) {
  return (
    <span className="ide-twistie" aria-hidden="true">
      <svg
        className="ide-twistie-icon"
        data-open={open}
        width="12"
        height="12"
        viewBox="0 0 16 16"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M6 4 L10 8 L6 12" />
      </svg>
    </span>
  );
}

export function Explorer({ className = "" }: { className?: string }) {
  const pathname = usePathname();
  const { tree } = useCatalogue();
  const mounted = useMounted();
  const { play } = useSound();
  const { openTab } = useTabSession();

  const saved = useSyncExternalStore(neverChanges, readSavedWidth, () => null);
  const [committed, setCommitted] = useState<number | null>(null);
  const width = committed ?? saved ?? DEFAULT_WIDTH;
  const [beatBouncer, setBeatBouncer] = useState(false);
  // A saved width only the won cap allows means they won on an earlier visit.
  const won = beatBouncer || (saved !== null && saved > MAX_WIDTH);
  const [locked, setLocked] = useState(false);
  const [shake, setShake] = useState(false);
  const [bubble, setBubble] = useState<{ msg: string; x: number; y: number } | null>(null);

  const asideRef = useRef<HTMLElement>(null);
  const bubbleRef = useRef<HTMLDivElement>(null);
  const pushing = useRef(false); // one reaction per shove
  const step = useRef(0);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const shakeTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const coolTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  // The aside follows the committed width; a drag writes it directly in between
  // (ResizeHandle's preview), so bouncer re-renders mid-drag never touch it.
  useEffect(() => {
    if (asideRef.current) asideRef.current.style.width = widthRem(width);
  }, [width]);

  // Keep the bubble glued to the cursor while it shows.
  useEffect(() => {
    if (!bubble) return;
    function follow(e: PointerEvent) {
      if (!bubbleRef.current) return;
      bubbleRef.current.style.left = `${e.clientX}px`;
      bubbleRef.current.style.top = `${e.clientY}px`;
    }
    window.addEventListener("pointermove", follow, { passive: true });
    return () => window.removeEventListener("pointermove", follow);
  }, [bubble]);

  useEffect(
    () => () => {
      clearTimeout(hideTimer.current);
      clearTimeout(shakeTimer.current);
      clearTimeout(coolTimer.current);
    },
    [],
  );

  function previewWidth(w: number) {
    if (asideRef.current) asideRef.current.style.width = widthRem(w);
  }
  function commitWidth(w: number) {
    setCommitted(w);
    try {
      localStorage.setItem(STORAGE_KEY, String(Math.round(w)));
    } catch {
      // Resizing still works for this session without persistence.
    }
  }

  function flash(msg: string, x: number, y: number) {
    setBubble({ msg, x, y });
    clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => {
      setBubble(null);
      if (step.current < 3) step.current = 0; // forgive shallow bumps
    }, 2600);
  }
  // One bouncer reaction. Returns true when it revokes resizing, which ends the
  // drag where it is.
  function shove(x: number, y: number): boolean {
    if (pushing.current || won) return false;
    pushing.current = true;
    const s = SCRIPT[Math.min(step.current, SCRIPT.length - 1)];
    flash(s.msg, x, y);
    play("bonk");
    setShake(true);
    clearTimeout(shakeTimer.current);
    shakeTimer.current = setTimeout(() => setShake(false), 420);
    if (s.won) setBeatBouncer(true);
    step.current = Math.min(step.current + 1, SCRIPT.length - 1);
    if (!s.lock) return false;
    pushing.current = false;
    setLocked(true);
    clearTimeout(coolTimer.current);
    coolTimer.current = setTimeout(() => setLocked(false), COOLDOWN_MS);
    return true;
  }
  function onOvershoot(raw: number, at: { x: number; y: number }) {
    if (!won && (raw > MAX_WIDTH + SLOP || raw < MIN_WIDTH - SLOP)) return shove(at.x, at.y);
    pushing.current = false;
    return false;
  }

  return (
    <aside
      ref={asideRef}
      id="ide-explorer"
      className={`${className}${shake ? " ide-explorer--shake" : ""}`}
      aria-label="File explorer"
    >
      {/* Inner scroll region so the pinned now-playing card below never
          scrolls away with a long tree. */}
      <div className="ide-explorer-scroll">
        <Breadcrumb pathname={pathname} onOpen={openTab} />

        <nav aria-label="Site files">
          {tree.map((node) => (
            <Node key={node.href} node={node} pathname={pathname} depth={0} mounted={mounted} />
          ))}
        </nav>
      </div>

      <NowPlayingCard />

      <ResizeHandle
        label="Resize file explorer"
        className="ide-resize-handle"
        controls="ide-explorer"
        orientation="vertical"
        pane="before"
        value={width}
        min={MIN_WIDTH}
        max={won ? WON_MAX : MAX_WIDTH}
        step={16}
        // Widths are base px; the large-monitor root scale stretches each CSS px.
        unitsPerPx={() => 16 / (Number.parseFloat(getComputedStyle(document.documentElement).fontSize) || 16)}
        preview={previewWidth}
        commit={commitWidth}
        onOvershoot={onOvershoot}
        locked={locked}
        onLockedPress={(at) => flash("🔒 you're on a timeout", at.x, at.y)}
      />

      {mounted && bubble
        ? createPortal(
            <div
              ref={bubbleRef}
              key={bubble.msg}
              className="ide-nudge"
              style={{ left: bubble.x, top: bubble.y }}
              role="status"
            >
              {bubble.msg}
            </div>,
            document.body,
          )
        : null}
    </aside>
  );
}

/* Clickable path crumbs in the explorer header: `~/edmond / projects / ledger`.
   Each crumb navigates to (and opens a tab for) its cumulative route. A crumb is
   only a link when that route is a page in the catalogue, so an intermediate
   non-route (e.g. `/blog/tag`) renders as plain text, not a 404. */
function Breadcrumb({
  pathname,
  onOpen,
}: {
  pathname: string;
  onOpen: (href: string) => void;
}) {
  const catalogue = useCatalogue();
  const segs = pathname === "/" ? [] : pathname.slice(1).split("/");
  return (
    <div className="ide-explorer-title">
      <Link href="/" prefetch={false} className="ide-crumb" onClick={() => onOpen("/")}>
        ~/edmond
      </Link>
      {segs.map((seg, i) => {
        const href = `/${segs.slice(0, i + 1).join("/")}`;
        const current = href === pathname;
        // The current crumb is NOT a link — you're already here. This also stops
        // it from prefetching its own route, which on a 404 (force-dynamic) left a
        // hanging RSC request. Other crumbs use hover prefetch.
        const navigable = !current && catalogue.find(href) !== undefined;
        return (
          <span key={href}>
            <span className="ide-crumb-sep">/</span>
            {navigable ? (
              <Link
                href={href}
                prefetch={false}
                className="ide-crumb"
                onClick={() => onOpen(href)}
              >
                {seg}
              </Link>
            ) : (
              <span
                className={current ? "ide-crumb ide-crumb--current" : "ide-crumb-static"}
                aria-current={current ? "page" : undefined}
              >
                {seg}
              </span>
            )}
          </span>
        );
      })}
    </div>
  );
}

function Node({
  node,
  pathname,
  depth,
  mounted,
}: {
  node: TreeNode;
  pathname: string;
  depth: number;
  mounted: boolean;
}) {
  const [open, setOpen] = useState(true);
  const { openTab } = useTabSession();
  const pad = { paddingLeft: `${BASE_PAD_REM + depth * INDENT_REM}rem` };

  if (node.type === "file") {
    const active = pathname === node.href;
    return (
      <Link
        href={node.href}
        aria-label={active ? `${node.name} (current file) — scroll to top` : undefined}
        // prefetch={false}: the whole file tree is in-viewport, so forced
        // prefetch fired a route RSC fetch for every row on load (~20+ requests).
        // false keeps Next's hover/touch prefetch — instant nav once you point at
        // a file — without the upfront request storm.
        prefetch={false}
        className="ide-row"
        style={pad}
        aria-current={active ? "page" : undefined}
        onPointerDown={(e) => beginRowDrag(e, node.href, node.name)}
        onClick={(e) => {
          if (consumeSuppressClick(e)) {
            e.preventDefault();
            return;
          }
          // Clicking the file you're already in scrolls it back to the top
          // (IDE muscle memory) instead of a no-op same-route navigation.
          if (active) {
            e.preventDefault();
            scrollEditorTop();
            return;
          }
          openTab(node.href);
        }}
      >
        <span className="ide-twistie" aria-hidden="true" />
        <span className="ide-row-icon">{mounted ? <FileIcon name={node.name} className="ide-file-icon" /> : null}</span>
        <span className="ide-row-name">{node.name}</span>
      </Link>
    );
  }

  const childActive = pathname.startsWith(node.href);
  return (
    <div>
      {/* Folder rows open their route (folders map to real pages) AND toggle the
          subtree open/closed on the same click. Keeps aria-expanded so the
          disclosure state (and the folder sound) still read. */}
      <Link
        href={node.href}
        // prefetch={false}: the whole file tree is in-viewport, so forced
        // prefetch fired a route RSC fetch for every row on load (~20+ requests).
        // false keeps Next's hover/touch prefetch — instant nav once you point at
        // a file — without the upfront request storm.
        prefetch={false}
        className="ide-row"
        style={pad}
        aria-expanded={open}
        aria-current={pathname === node.href ? "page" : undefined}
        onPointerDown={(e) => beginRowDrag(e, node.href, node.name)}
        onClick={(e) => {
          if (consumeSuppressClick(e)) {
            e.preventDefault();
            return;
          }
          setOpen((o) => !o);
          openTab(node.href);
        }}
      >
        {/* The chevron alone toggles the subtree (without navigating); clicking
            anywhere else on the row opens the folder's page and expands it. */}
        <span
          className="ide-twistie-hit"
          aria-hidden="true"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setOpen((o) => !o);
          }}
        >
          <Chevron open={open} />
        </span>
        <span className="ide-row-icon">{mounted ? <FolderIcon open={open} /> : null}</span>
        <span className="ide-row-name" style={childActive ? { color: "var(--accent)" } : undefined}>
          {node.name}/
        </span>
      </Link>
      <div className="ide-folder" data-open={open}>
        <div className="ide-folder-inner">
          {node.children.map((child) => (
            <Node key={child.href} node={child} pathname={pathname} depth={depth + 1} mounted={mounted} />
          ))}
        </div>
      </div>
    </div>
  );
}
