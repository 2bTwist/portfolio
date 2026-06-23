"use client";

/* Terminal drawer. Lazy-loaded (next/dynamic, ssr:false) and kept mounted after
   first open so history survives toggling. Commands map onto the shared NAV
   index: cd/open/cat navigate, theme switches palette, grep matches filenames
   (full-text post search lands in Phase 4). */

import { useEffect, useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { NAV } from "@/app/lib/nav";
import { PALETTES } from "@/app/lib/palette";
import { profile } from "@/data/profile";
import { TerminalIcon } from "@/components/feel/animated-icons";
import { useOverlay, useSession } from "./store";

type Line = { kind: "in" | "out"; text: string };

const STRIP_EXT = /\.(tsx?|md)$/;

export default function Terminal() {
  const router = useRouter();
  const { closeTerm } = useOverlay();
  const { setPaletteIndex, openTab } = useSession();
  const [lines, setLines] = useState<Line[]>([
    { kind: "out", text: "type `help` to get started" },
  ]);
  const [value, setValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const outRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);
  useEffect(() => {
    outRef.current?.scrollTo(0, outRef.current.scrollHeight);
  }, [lines]);

  function print(text: string) {
    setLines((l) => [...l, { kind: "out", text }]);
  }

  function resolve(arg: string) {
    const a = arg.replace(/^\.?\//, "").toLowerCase();
    const bare = a.replace(STRIP_EXT, "");
    return NAV.find(
      (n) =>
        n.name.toLowerCase() === a ||
        n.name.toLowerCase().replace(STRIP_EXT, "") === bare ||
        n.href.toLowerCase() === `/${bare}` ||
        n.href.toLowerCase() === a,
    );
  }

  function run(raw: string) {
    const [cmd, ...rest] = raw.trim().split(/\s+/);
    const arg = rest.join(" ");
    switch (cmd) {
      case "":
        break;
      case "help":
        print("commands: ls, open <file>, cd <path>, cat <file>, grep <term>, theme [name], whoami, pwd, clear");
        break;
      case "ls":
        print(NAV.map((n) => n.name).join("   "));
        break;
      case "pwd":
        print(window.location.pathname);
        break;
      case "whoami":
        print(`${profile.name} — ${profile.role}`);
        break;
      case "clear":
        setLines([]);
        return;
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
        const hits = NAV.filter((n) => n.name.toLowerCase().includes(arg.toLowerCase()));
        print(
          hits.length
            ? hits.map((h) => `${h.name}  ${h.href}`).join("\n")
            : `no matches for "${arg}" (full-text search lands with the blog)`,
        );
        break;
      }
      case "open":
      case "cd":
      case "cat": {
        const target = resolve(arg);
        if (!target) {
          print(`not found: ${arg || "(nothing)"}`);
          break;
        }
        print(`→ ${target.href}`);
        openTab(target.href);
        router.push(target.href);
        closeTerm();
        break;
      }
      default:
        print(`command not found: ${cmd} (try help)`);
    }
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLines((l) => [...l, { kind: "in", text: value }]);
    run(value);
    setValue("");
  }

  return (
    <div className="ide-terminal" aria-label="Terminal">
      <div className="ide-terminal-bar">
        <span className="ide-terminal-bar-icon" aria-hidden="true">
          <TerminalIcon />
        </span>
        <span className="mono text-xs" style={{ color: "var(--term-muted)" }}>
          zsh — ~/edmond
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
        {lines.map((l, i) => (
          <div key={i} className="ide-terminal-line" data-kind={l.kind}>
            {l.kind === "in" ? `$ ${l.text}` : l.text}
          </div>
        ))}
      </div>
      <form onSubmit={onSubmit} className="ide-terminal-form">
        <span aria-hidden>$</span>
        <input
          ref={inputRef}
          className="ide-terminal-input"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          aria-label="Terminal input"
          autoComplete="off"
          spellCheck={false}
        />
      </form>
    </div>
  );
}
