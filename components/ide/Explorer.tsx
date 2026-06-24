"use client";

/* File-tree explorer. File rows are real prefetched <Link>s mapping file ->
   route, so they work with JS off (folders render expanded; file links navigate).
   Folder rows are toggle buttons: clicking the row expands/collapses it (editor
   behaviour); the projects index is still reachable via ⌘K / the "all projects"
   link. Active row = current pathname.

   Layout is a fixed grid: [indent][twistie slot][icon slot][name]. Both slots are
   fixed width so every row aligns deterministically and nothing shifts when the
   client-only icons mount.

   Resize: drag the right edge. Pointer move/up are NATIVE window listeners (not
   React synthetic events) and the width is written straight to the DOM, so it
   tracks the pointer 1:1 with no render lag — same technique as the custom
   cursor. Shove past the range and a scripted bouncer escalates, eventually
   revoking your privileges (a cooldown), then giving up. */

import Link from "next/link";
import { createPortal } from "react-dom";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { TREE, NAV, type TreeNode } from "@/app/lib/nav";
import { useMounted } from "@/components/hooks/useMounted";
import { useSound } from "@/components/feel/SoundProvider";
import { FileIcon, FolderIcon } from "./FileIcon";
import { useSession } from "./store";

const MIN_WIDTH = 170;
const MAX_WIDTH = 300;
const WON_MAX = 460; // once they "win", the cap relaxes
const DEFAULT_WIDTH = 220;
const SLOP = 28; // how far past the limit before the bouncer reacts
const COOLDOWN_MS = 8000;
const STORAGE_KEY = "ide:explorer-width";
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
  const mounted = useMounted();
  const { play } = useSound();
  const { openTab } = useSession();

  const [dragging, setDragging] = useState(false);
  const [locked, setLocked] = useState(false);
  const [shake, setShake] = useState(false);
  const [bubble, setBubble] = useState<{ msg: string; x: number; y: number } | null>(null);

  const asideRef = useRef<HTMLElement>(null);
  const handleRef = useRef<HTMLDivElement>(null);
  const bubbleRef = useRef<HTMLDivElement>(null);
  const playRef = useRef(play);
  playRef.current = play;
  const draggingRef = useRef(false);
  const startX = useRef(0);
  const startW = useRef(0);
  const widthRef = useRef(DEFAULT_WIDTH);
  const pushing = useRef(false); // one reaction per shove
  const step = useRef(0);
  const won = useRef(false);
  const lockedRef = useRef(false);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const shakeTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const coolTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  // Width is owned imperatively (not React state) so mid-drag re-renders from the
  // bouncer's setState never re-apply a stale width and fight the drag. CSS sets
  // the default; this restores any saved width on mount.
  useEffect(() => {
    const saved = Number(localStorage.getItem(STORAGE_KEY));
    if (saved >= MIN_WIDTH && saved <= WON_MAX) {
      widthRef.current = saved;
      if (asideRef.current) asideRef.current.style.width = `${saved}px`;
    }
  }, []);

  // All pointer handling via native listeners (mount-once) so the drag tracks the
  // pointer with zero React-event lag. Helpers below close only over refs +
  // stable setState, so capturing them once is safe.
  useEffect(() => {
    const handle = handleRef.current;
    if (!handle) return;

    function flash(msg: string, x: number, y: number) {
      setBubble({ msg, x, y });
      clearTimeout(hideTimer.current);
      hideTimer.current = setTimeout(() => {
        setBubble(null);
        if (!won.current && step.current < 3) step.current = 0; // forgive shallow bumps
      }, 2600);
    }
    function endDrag() {
      draggingRef.current = false;
      pushing.current = false;
      setDragging(false);
      delete document.documentElement.dataset.cursorGrabbing;
    }
    function onShove(x: number, y: number) {
      if (pushing.current || won.current) return;
      pushing.current = true;
      const s = SCRIPT[Math.min(step.current, SCRIPT.length - 1)];
      flash(s.msg, x, y);
      playRef.current("bonk");
      setShake(true);
      clearTimeout(shakeTimer.current);
      shakeTimer.current = setTimeout(() => setShake(false), 420);
      if (s.won) won.current = true;
      if (s.lock) {
        lockedRef.current = true;
        setLocked(true);
        endDrag();
        clearTimeout(coolTimer.current);
        coolTimer.current = setTimeout(() => {
          lockedRef.current = false;
          setLocked(false);
        }, COOLDOWN_MS);
      }
      step.current = Math.min(step.current + 1, SCRIPT.length - 1);
    }

    function onDown(e: PointerEvent) {
      e.preventDefault();
      if (lockedRef.current) {
        flash("🔒 you're on a timeout", e.clientX, e.clientY);
        return;
      }
      draggingRef.current = true;
      setDragging(true);
      startX.current = e.clientX;
      startW.current = widthRef.current;
      document.documentElement.dataset.cursorGrabbing = "true";
    }
    function onMove(e: PointerEvent) {
      // Keep the bubble glued to the cursor whenever it's showing.
      if (bubbleRef.current) {
        bubbleRef.current.style.left = `${e.clientX}px`;
        bubbleRef.current.style.top = `${e.clientY}px`;
      }
      if (!draggingRef.current) return;
      const maxW = won.current ? WON_MAX : MAX_WIDTH;
      const raw = startW.current + (e.clientX - startX.current);
      const w = Math.max(MIN_WIDTH, Math.min(maxW, raw));
      widthRef.current = w;
      if (asideRef.current) asideRef.current.style.width = `${w}px`;
      if (!won.current && (raw > maxW + SLOP || raw < MIN_WIDTH - SLOP)) onShove(e.clientX, e.clientY);
      else pushing.current = false;
    }
    function onUp() {
      if (!draggingRef.current) return;
      endDrag();
      localStorage.setItem(STORAGE_KEY, String(Math.round(widthRef.current)));
    }

    handle.addEventListener("pointerdown", onDown);
    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerup", onUp, { passive: true });
    return () => {
      handle.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      clearTimeout(hideTimer.current);
      clearTimeout(shakeTimer.current);
      clearTimeout(coolTimer.current);
      delete document.documentElement.dataset.cursorGrabbing;
    };
  }, []);

  return (
    <aside
      ref={asideRef}
      className={`${className}${shake ? " ide-explorer--shake" : ""}`}
      aria-label="File explorer"
    >
      <Breadcrumb pathname={pathname} onOpen={openTab} />

      <nav aria-label="Site files">
        {TREE.map((node) => (
          <Node key={node.href} node={node} pathname={pathname} depth={0} mounted={mounted} />
        ))}
      </nav>

      <div
        ref={handleRef}
        className="ide-resize-handle"
        data-dragging={dragging}
        data-locked={locked}
        role="separator"
        aria-orientation="vertical"
        aria-label="Resize file explorer"
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
   only a link when that route is real — in NAV or the current page — so an
   intermediate non-route (e.g. `/writing/tag`) renders as plain text, not a 404. */
const NAV_HREFS = new Set(NAV.map((n) => n.href));

function Breadcrumb({
  pathname,
  onOpen,
}: {
  pathname: string;
  onOpen: (href: string) => void;
}) {
  const segs = pathname === "/" ? [] : pathname.slice(1).split("/");
  let acc = "";
  return (
    <div className="ide-explorer-title">
      <Link href="/" prefetch className="ide-crumb" onClick={() => onOpen("/")}>
        ~/edmond
      </Link>
      {segs.map((seg) => {
        acc += `/${seg}`;
        const href = acc;
        const current = href === pathname;
        const navigable = current || NAV_HREFS.has(href);
        return (
          <span key={href}>
            <span className="ide-crumb-sep">/</span>
            {navigable ? (
              <Link
                href={href}
                prefetch
                className={`ide-crumb${current ? " ide-crumb--current" : ""}`}
                aria-current={current ? "page" : undefined}
                onClick={() => onOpen(href)}
              >
                {seg}
              </Link>
            ) : (
              <span className="ide-crumb-static">{seg}</span>
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
  const { openTab } = useSession();
  const pad = { paddingLeft: `${BASE_PAD_REM + depth * INDENT_REM}rem` };

  if (node.type === "file") {
    const active = pathname === node.href;
    return (
      <Link
        href={node.href}
        prefetch
        className="ide-row"
        style={pad}
        aria-current={active ? "page" : undefined}
        onClick={() => openTab(node.href)}
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
        prefetch
        className="ide-row"
        style={pad}
        aria-expanded={open}
        aria-current={pathname === node.href ? "page" : undefined}
        onClick={() => {
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
