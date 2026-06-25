"use client";

/* Terminal drawer. Lazy-loaded (next/dynamic, ssr:false) and kept mounted after
   first open so history survives toggling.

   It models a real cwd over the file tree (nav.ts): `cd` walks folders, the
   prompt is zsh-style `<dir> %`, `ls` lists the current directory, and Tab
   completes commands / entries. Folders map to routes, so `cd`/`open` also
   navigate the IDE. */

import { useEffect, useRef, useState, type ChangeEvent, type FormEvent, type KeyboardEvent } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { TREE, type TreeNode, type TreeFolder } from "@/app/lib/nav";
import { searchStatic, searchPosts } from "@/app/lib/search";
import { PALETTES } from "@/app/lib/palette";
import { profile } from "@/data/profile";
import { TerminalIcon } from "@/components/feel/animated-icons";
import { playNote, FUR_ELISE } from "@/components/feel/sound";
import { BANNER } from "./banner";
import { useOverlay, useSession } from "./store";

const PIANO_GIF = "/images/grand-piano.gif";
const MEOW_GIF = "/images/meow-party.gif";

type Line = { kind: "in" | "out"; text: string; prompt?: string };

const STRIP_EXT = /\.(tsx?|md)$/;
const TERM_MIN_H = 90;
const TERM_STORAGE = "ide.terminal-height";
const GREETING: Line = { kind: "out", text: "type `help` to get started" };
const COMMANDS = ["help", "ls", "cd", "open", "cat", "pwd", "grep", "theme", "whoami", "clear"];

// The terminal is a singleton drawer. Hold its session (history + cwd) at module
// scope so it survives any remount of the lazy component — navigating, toggling,
// or a Suspense bounce can never wipe the scrollback.
let sessionLines: Line[] = [GREETING];
let sessionCwd: string[] = [];

// ── tiny filesystem over the nav tree, indexed by cwd (array of folder names) ──
function entriesAt(cwd: string[]): TreeNode[] {
  let nodes: TreeNode[] = TREE;
  for (const seg of cwd) {
    const f = nodes.find((n) => n.type === "folder" && n.name === seg) as TreeFolder | undefined;
    if (!f) return [];
    nodes = f.children;
  }
  return nodes;
}
function routeForCwd(cwd: string[]): string {
  let nodes: TreeNode[] = TREE;
  let href = "/";
  for (const seg of cwd) {
    const f = nodes.find((n) => n.type === "folder" && n.name === seg) as TreeFolder | undefined;
    if (!f) break;
    href = f.href;
    nodes = f.children;
  }
  return href;
}
// zsh `%1~`-style prompt: the basename of the cwd (root is the `edmond` workspace).
function promptFor(cwd: string[]): string {
  return `${cwd.length ? cwd[cwd.length - 1] : "edmond"} %`;
}
function listing(cwd: string[]): string[] {
  return entriesAt(cwd).map((n) => (n.type === "folder" ? `${n.name}/` : n.name));
}
function matchFile(cwd: string[], arg: string): TreeNode | undefined {
  const a = arg.replace(/^\.?\//, "").replace(/\/$/, "").toLowerCase();
  const bare = a.replace(STRIP_EXT, "");
  return entriesAt(cwd).find(
    (n) => n.name.toLowerCase() === a || n.name.toLowerCase().replace(STRIP_EXT, "") === bare,
  );
}
function candidatesFor(value: string, cwd: string[]): string[] {
  const tokens = value.split(" ");
  const cur = (tokens[tokens.length - 1] ?? "").toLowerCase();
  const pool = tokens.length === 1 ? COMMANDS : listing(cwd);
  return pool.filter((c) => c.toLowerCase().startsWith(cur));
}
function commonPrefix(xs: string[]): string {
  if (!xs.length) return "";
  let p = xs[0];
  for (const s of xs) {
    let i = 0;
    while (i < p.length && i < s.length && p[i].toLowerCase() === s[i].toLowerCase()) i++;
    p = p.slice(0, i);
  }
  return p;
}

export default function Terminal() {
  const router = useRouter();
  const { closeTerm, termOpen } = useOverlay();
  const { setPaletteIndex, openTab } = useSession();
  // Seed from the persisted session so a remount restores the scrollback + cwd.
  const [lines, setLines] = useState<Line[]>(sessionLines);
  const [value, setValue] = useState("");
  const [cwd, setCwd] = useState<string[]>(sessionCwd);
  const inputRef = useRef<HTMLInputElement>(null);
  const outRef = useRef<HTMLDivElement>(null);
  const handleRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef({ active: false, startY: 0, startH: 0, h: 0 });

  // ── Typing-as-piano + spaced, varied quips + a finale ─────────────────────
  // Each printable keystroke plays the next Für Elise note. Quips are spaced out
  // (min gap), varied (random, no immediate repeat), and only build up while you
  // PLAY continuously — running a command (Enter) resets it, so normal terminal
  // use shows no bubbles. Finishing the whole tune triggers the celebration +
  // a cooldown. The bubble follows the cursor.
  const [quip, setQuip] = useState<{ msg: string; gif?: string } | null>(null);
  const [celebrating, setCelebrating] = useState(false);
  const noteIdx = useRef(0);
  const streak = useRef(0);
  const nextQuipAt = useRef(30);
  const shownQuips = useRef<number[]>([]);
  const fastRun = useRef(0);
  const spaceShown = useRef(false);
  const lastKey = useRef(0);
  const lastQuipAt = useRef(0);
  const cooldownUntil = useRef(0);
  const quipTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const finaleTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const applauseRef = useRef<HTMLAudioElement | null>(null);
  const quipPos = useRef({ x: 0, y: 0 });
  const quipRef = useRef<HTMLDivElement>(null);

  const PLAY_QUIPS = [
    "ooh, someone can play",
    "Beethoven would be proud",
    "you're enjoying this way too much!",
    "is this a recital now?",
    "the neighbours can hear you",
    "Liszt is shaking",
    "ok, virtuoso",
    "save some for the encore",
  ];

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      quipPos.current.x = e.clientX;
      quipPos.current.y = e.clientY;
      const el = quipRef.current;
      if (el) {
        el.style.left = `${e.clientX}px`;
        el.style.top = `${e.clientY}px`;
      }
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => {
      window.removeEventListener("pointermove", onMove);
      clearTimeout(quipTimer.current);
      clearTimeout(finaleTimer.current);
    };
  }, []);

  // Show a bubble, but keep them well spaced: skip if one fired recently (unless
  // forced, for the finale / time-out).
  function showQuip(msg: string, gif?: string, force = false) {
    const now = performance.now();
    if (!force && now - lastQuipAt.current < 5000) return;
    lastQuipAt.current = now;
    setQuip({ msg, gif });
    clearTimeout(quipTimer.current);
    quipTimer.current = setTimeout(() => setQuip(null), 2800);
  }
  function playQuip() {
    if (shownQuips.current.length >= PLAY_QUIPS.length) shownQuips.current = [];
    let i = Math.floor(Math.random() * PLAY_QUIPS.length);
    while (shownQuips.current.includes(i)) i = Math.floor(Math.random() * PLAY_QUIPS.length);
    shownQuips.current.push(i);
    showQuip(PLAY_QUIPS[i], PIANO_GIF);
  }
  function resetPerformance() {
    noteIdx.current = 0;
    streak.current = 0;
    nextQuipAt.current = 30;
    shownQuips.current = [];
    fastRun.current = 0;
  }

  function finale() {
    try {
      if (!applauseRef.current) applauseRef.current = new Audio("/sounds/applause.mp3");
      applauseRef.current.currentTime = 0;
      applauseRef.current.volume = 0.7;
      void applauseRef.current.play();
    } catch {
      /* audio blocked — visual finale still runs */
    }
    setCelebrating(true);
    showQuip("congratulations!", MEOW_GIF, true);
    cooldownUntil.current = performance.now() + 25000;
    resetPerformance();
    clearTimeout(finaleTimer.current);
    finaleTimer.current = setTimeout(() => {
      setCelebrating(false);
      sessionLines = [GREETING];
      setLines([GREETING]);
      setValue("");
    }, 4200);
  }

  // Runs on each printable keystroke: plays the note + spaced/varied quips, and
  // fires the finale at the end of the tune.
  function onPlay() {
    const t = performance.now();
    if (t < cooldownUntil.current) {
      showQuip("nope, you're on a time out!", undefined, true);
      return;
    }
    const gap = t - lastKey.current;
    lastKey.current = t;
    if (gap > 2200) resetPerformance(); // paused -> fresh performance
    if (gap < 70) {
      fastRun.current += 1;
      if (fastRun.current >= 8) showQuip("heeeyyy!");
    } else {
      fastRun.current = 0;
    }
    playNote(FUR_ELISE[noteIdx.current]);
    noteIdx.current += 1;
    streak.current += 1;
    if (streak.current >= nextQuipAt.current) {
      playQuip();
      nextQuipAt.current = streak.current + 30 + Math.floor(Math.random() * 18);
    }
    if (noteIdx.current >= FUR_ELISE.length) finale();
  }

  function onInputChange(e: ChangeEvent<HTMLInputElement>) {
    const v = e.target.value;
    if (v.length > 96 && !spaceShown.current) {
      showQuip("we out of space!");
      spaceShown.current = true;
    } else if (v.length <= 96) {
      spaceShown.current = false;
    }
    setValue(v);
  }

  // Focus the input on mount AND every time the drawer opens, so it's always
  // ready for input the moment it appears.
  useEffect(() => {
    if (termOpen) requestAnimationFrame(() => inputRef.current?.focus());
  }, [termOpen]);
  useEffect(() => {
    outRef.current?.scrollTo(0, outRef.current.scrollHeight);
  }, [lines]);
  // Mirror state into the module-scope session so it outlives a remount.
  useEffect(() => {
    sessionLines = lines;
  }, [lines]);
  useEffect(() => {
    sessionCwd = cwd;
  }, [cwd]);

  // Drag-to-resize the output height. Imperative (refs + direct DOM writes),
  // never React state, so the drag tracks the pointer 1:1 — same pattern as the
  // explorer handle. Height persists in localStorage.
  useEffect(() => {
    const handle = handleRef.current;
    const out = outRef.current;
    if (!handle || !out) return;
    const maxH = () => Math.round(window.innerHeight * 0.7);
    const saved = Number(localStorage.getItem(TERM_STORAGE));
    if (saved >= TERM_MIN_H) out.style.height = `${Math.min(saved, maxH())}px`;

    const d = dragRef.current;
    function onDown(e: PointerEvent) {
      e.preventDefault();
      d.active = true;
      d.startY = e.clientY;
      d.startH = out!.offsetHeight;
      handle!.dataset.dragging = "true";
      // Capture the pointer to the handle so an <iframe> (e.g. the resume PDF
      // viewer) can't swallow pointermove/up mid-drag and leave it stuck.
      // body[data-dragging] also shields iframes from pointer events (CSS).
      handle!.setPointerCapture?.(e.pointerId);
      document.body.dataset.dragging = "true";
      // Show the (face-up) grabbing hand for the whole drag, even once the
      // pointer leaves the thin handle.
      const root = document.documentElement;
      root.dataset.cursorGrabbing = "true";
      root.dataset.cursorAxis = "y";
    }
    function onMove(e: PointerEvent) {
      if (!d.active) return;
      d.h = Math.max(TERM_MIN_H, Math.min(maxH(), d.startH + (d.startY - e.clientY)));
      out!.style.height = `${d.h}px`;
    }
    function onUp() {
      if (!d.active) return;
      d.active = false;
      delete handle!.dataset.dragging;
      delete document.body.dataset.dragging;
      delete document.documentElement.dataset.cursorGrabbing;
      localStorage.setItem(TERM_STORAGE, String(Math.round(out!.offsetHeight)));
    }
    handle.addEventListener("pointerdown", onDown);
    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerup", onUp, { passive: true });
    return () => {
      handle.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
  }, []);

  function print(text: string) {
    setLines((l) => [...l, { kind: "out", text }]);
  }

  function navigate(route: string) {
    openTab(route);
    router.push(route);
  }

  function run(raw: string) {
    const parts = raw.trim().split(/\s+/);
    const cmd = parts[0] ?? "";
    const arg = parts.slice(1).join(" ");
    switch (cmd) {
      case "":
        break;
      case "help":
        print("commands: ls, cd <dir>, open <file>, cat <file>, pwd, grep <term>, theme [name], whoami, clear");
        break;
      case "ls":
        print(listing(cwd).join("   "));
        break;
      case "pwd":
        print(`~/edmond${cwd.length ? "/" + cwd.join("/") : ""}`);
        break;
      case "whoami":
        print(`${profile.name} — ${profile.role}`);
        break;
      case "clear":
        setLines([GREETING]);
        return;
      case "cd": {
        // resolve the destination; the new prompt is the only feedback (no echo).
        let next: string[] | null = null;
        if (!arg || arg === "~" || arg === "/") next = [];
        else if (arg === ".") next = cwd;
        else if (arg === "..") next = cwd.slice(0, -1);
        else {
          const name = arg.replace(/\/$/, "");
          const node = entriesAt(cwd).find((n) => n.name.toLowerCase() === name.toLowerCase());
          if (!node) {
            print(`cd: no such file or directory: ${arg}`);
            break;
          }
          if (node.type !== "folder") {
            print(`cd: not a directory: ${arg}`);
            break;
          }
          next = [...cwd, node.name];
        }
        sessionCwd = next; // sync, before navigate may remount
        setCwd(next);
        navigate(routeForCwd(next));
        break;
      }
      case "open":
      case "cat": {
        const file = matchFile(cwd, arg);
        if (!file) {
          print(`${cmd}: no such file: ${arg || "(nothing)"}`);
          break;
        }
        navigate(file.href);
        break;
      }
      case "theme": {
        if (!arg) {
          print(`themes: ${PALETTES.map((p) => p.name).join(", ")}`);
          break;
        }
        const i = PALETTES.findIndex((p) => p.name.toLowerCase().startsWith(arg.toLowerCase()));
        if (i < 0) {
          print(`no theme "${arg}"`);
          break;
        }
        setPaletteIndex(i);
        print(`theme → ${PALETTES[i].name}`);
        break;
      }
      case "grep": {
        if (!arg) {
          print("usage: grep <term>");
          break;
        }
        const staticHits = searchStatic(arg);
        if (staticHits.length) print(staticHits.map((r) => `${r.name}  ${r.href}`).join("\n"));
        searchPosts(arg).then((postHits) => {
          if (postHits.length) print(postHits.map((p) => `${p.name}  ${p.href}`).join("\n"));
          else if (!staticHits.length) print(`no matches for "${arg}"`);
        });
        break;
      }
      default:
        print(`zsh: command not found: ${cmd}`);
    }
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    const entered = value;
    // Record the echo into the persisted session SYNCHRONOUSLY, before run() may
    // navigate — so a navigation-triggered remount can never drop the command.
    const echoed: Line[] = [...lines, { kind: "in", text: entered, prompt: promptFor(cwd) }];
    sessionLines = echoed;
    setLines(echoed);
    run(entered);
    setValue("");
    resetPerformance(); // running a command ends a "performance" -> no stray quips
  }

  // Tab → complete the current token to the longest common prefix (or fully, if
  // unique). Right/End → accept the ghost suggestion.
  function onKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key.length === 1) onPlay(); // printable key -> next piano note + quips
    if (e.key === "Tab") {
      e.preventDefault();
      const tokens = value.split(" ");
      const cur = tokens[tokens.length - 1] ?? "";
      const cands = candidatesFor(value, cwd);
      if (!cands.length) return;
      const target = cands.length === 1 ? cands[0] : commonPrefix(cands);
      if (target.length > cur.length) {
        tokens[tokens.length - 1] = target;
        setValue(tokens.join(" "));
      }
    } else if ((e.key === "ArrowRight" || e.key === "End") && ghost) {
      e.preventDefault();
      setValue(value + ghost);
    }
  }

  // Ghost completion: the remainder of the best match, shown dimmed after the
  // caret (fish-style). Empty when there's nothing to suggest.
  const tokens = value.split(" ");
  const cur = tokens[tokens.length - 1] ?? "";
  const cands = value && !value.endsWith(" ") ? candidatesFor(value, cwd) : [];
  const ghost = cands.length ? cands[0].slice(cur.length) : "";

  return (
    <div
      className="ide-terminal"
      aria-label="Terminal"
      onClick={(e) => {
        // Click anywhere in the terminal focuses the input — unless it's a
        // button/link or the user is selecting text.
        const t = e.target as HTMLElement;
        if (t.closest("button, a")) return;
        if (!window.getSelection()?.isCollapsed) return;
        inputRef.current?.focus();
      }}
    >
      <div
        ref={handleRef}
        className="ide-terminal-resize"
        role="separator"
        aria-orientation="horizontal"
        aria-label="Resize terminal"
      />
      {quip
        ? createPortal(
            <div
              ref={(el) => {
                quipRef.current = el;
                if (el) {
                  el.style.left = `${quipPos.current.x}px`;
                  el.style.top = `${quipPos.current.y}px`;
                }
              }}
              className="cursor-bubble"
              role="status"
            >
              {quip.gif ? (
                // eslint-disable-next-line @next/next/no-img-element -- animated gif must stay unoptimized
                <img className="cursor-bubble-gif" src={quip.gif} alt="" width={22} height={22} />
              ) : null}
              <span>{quip.msg}</span>
            </div>,
            document.body,
          )
        : null}
      {celebrating ? (
        <div className="term-finale" aria-hidden="true">
          {Array.from({ length: 9 }).map((_, i) => (
            <span
              key={i}
              className="fw-rocket"
              style={{ left: `${6 + i * 11}%`, animationDelay: `${(i % 5) * 0.32}s` }}
            />
          ))}
          {/* eslint-disable-next-line @next/next/no-img-element -- animated gif must stay unoptimized */}
          <img className="term-finale-gif" src={MEOW_GIF} alt="" width={76} height={76} />
          <div className="term-finale-title">congratulations!</div>
        </div>
      ) : null}
      <div className="ide-terminal-bar">
        <span className="ide-terminal-bar-icon" aria-hidden="true">
          <TerminalIcon />
        </span>
        <span className="mono text-xs" style={{ color: "var(--term-muted)" }}>
          zsh — ~/edmond{cwd.length ? "/" + cwd.join("/") : ""}
        </span>
        <button
          type="button"
          className="ide-tab-close ml-auto"
          aria-label="Close terminal"
          onClick={() => closeTerm()}
        >
          ×
        </button>
      </div>
      <div ref={outRef} className="ide-terminal-out">
        <pre className="ide-terminal-banner" aria-hidden="true">{BANNER}</pre>
        {lines.map((l, i) => (
          <div key={i} className="ide-terminal-line" data-kind={l.kind}>
            {l.kind === "in" ? `${l.prompt} ${l.text}` : l.text}
          </div>
        ))}
      </div>
      <form
        onSubmit={onSubmit}
        className="ide-terminal-form"
        onClick={() => inputRef.current?.focus()}
      >
        {/* Visible prompt: `<dir> %` + typed text + block caret + ghost, all on
            one inline line so they share a baseline. The input is the invisible
            keystroke sink (the block replaces the native caret). */}
        <span className="ide-terminal-live" aria-hidden="true">
          <span className="ide-terminal-prompt">{promptFor(cwd)}</span>
          <span className="ide-terminal-typed">{value}</span>
          {ghost ? (
            // cursor sits ON the first suggested char (no gap), rest dimmed
            <>
              <span className="ide-terminal-caret-char">{ghost.slice(0, 1)}</span>
              <span className="ide-terminal-ghost">{ghost.slice(1)}</span>
            </>
          ) : (
            <span className="ide-terminal-caret" />
          )}
        </span>
        <input
          ref={inputRef}
          className="ide-terminal-input"
          value={value}
          onChange={onInputChange}
          onKeyDown={onKeyDown}
          aria-label="Terminal input"
          autoComplete="off"
          spellCheck={false}
        />
      </form>
    </div>
  );
}
