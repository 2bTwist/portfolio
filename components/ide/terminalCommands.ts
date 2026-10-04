/* The terminal's shell, without the drawer: a tiny filesystem over the explorer
   tree (cwd is an array of folder names; root is the `edmond` workspace), Tab
   completion, and resolveCommand, which turns a typed line into the effects the
   Terminal component applies. Nothing here touches React, the router, or the
   network, so commands are unit-tested directly (terminalCommands.test.ts). */

import type { TreeNode, TreeFolder } from "@/app/lib/catalogue-view";
import { PALETTES } from "@/app/lib/palette";
import { profile } from "@/data/profile";

const STRIP_EXT = /\.(tsx?|md)$/;
export const COMMANDS = ["help", "ls", "cd", "open", "cat", "pwd", "grep", "theme", "whoami", "clear"];

/** What a command asks the drawer to do, in order. */
export type Effect =
  | { type: "print"; text: string }
  | { type: "clear" }
  // The new cwd, and the folder route it maps to.
  | { type: "cd"; cwd: string[]; route: string }
  | { type: "navigate"; route: string }
  | { type: "theme"; index: number }
  // Search the site for `term`; the drawer runs the (async) post search.
  | { type: "grep"; term: string };

function entriesAt(tree: TreeNode[], cwd: string[]): TreeNode[] {
  let nodes = tree;
  for (const seg of cwd) {
    const f = nodes.find((n) => n.type === "folder" && n.name === seg) as TreeFolder | undefined;
    if (!f) return [];
    nodes = f.children;
  }
  return nodes;
}

function routeForCwd(tree: TreeNode[], cwd: string[]): string {
  let nodes = tree;
  let href = "/";
  for (const seg of cwd) {
    const f = nodes.find((n) => n.type === "folder" && n.name === seg) as TreeFolder | undefined;
    if (!f) break;
    href = f.href;
    nodes = f.children;
  }
  return href;
}

// zsh `%1~`-style prompt: the basename of the cwd.
export function promptFor(cwd: string[]): string {
  return `${cwd.length ? cwd[cwd.length - 1] : "edmond"} %`;
}

function listing(tree: TreeNode[], cwd: string[]): string[] {
  return entriesAt(tree, cwd).map((n) => (n.type === "folder" ? `${n.name}/` : n.name));
}

function matchFile(tree: TreeNode[], cwd: string[], arg: string): TreeNode | undefined {
  const a = arg.replace(/^\.?\//, "").replace(/\/$/, "").toLowerCase();
  const bare = a.replace(STRIP_EXT, "");
  return entriesAt(tree, cwd).find(
    (n) => n.name.toLowerCase() === a || n.name.toLowerCase().replace(STRIP_EXT, "") === bare,
  );
}

/** Completions for the line's last token: commands first, then cwd entries. */
export function candidatesFor(tree: TreeNode[], value: string, cwd: string[]): string[] {
  const tokens = value.split(" ");
  const cur = (tokens[tokens.length - 1] ?? "").toLowerCase();
  const pool = tokens.length === 1 ? COMMANDS : listing(tree, cwd);
  return pool.filter((c) => c.toLowerCase().startsWith(cur));
}

/** The line after Tab: the last token completed to the candidates' common prefix. */
export function completeLine(tree: TreeNode[], value: string, cwd: string[]): string {
  const tokens = value.split(" ");
  const cur = tokens[tokens.length - 1] ?? "";
  const cands = candidatesFor(tree, value, cwd);
  if (!cands.length) return value;
  const target = cands.length === 1 ? cands[0] : commonPrefix(cands);
  if (target.length <= cur.length) return value;
  tokens[tokens.length - 1] = target;
  return tokens.join(" ");
}

function commonPrefix(xs: string[]): string {
  let p = xs[0];
  for (const s of xs) {
    let i = 0;
    while (i < p.length && i < s.length && p[i].toLowerCase() === s[i].toLowerCase()) i++;
    p = p.slice(0, i);
  }
  return p;
}

const print = (text: string): Effect[] => [{ type: "print", text }];

export function resolveCommand(raw: string, { tree, cwd }: { tree: TreeNode[]; cwd: string[] }): Effect[] {
  const parts = raw.trim().split(/\s+/);
  const cmd = parts[0] ?? "";
  const arg = parts.slice(1).join(" ");
  switch (cmd) {
    case "":
      return [];
    case "help":
      return print("commands: ls, cd <dir>, open <file>, cat <file>, pwd, grep <term>, theme [name], whoami, clear");
    case "ls":
      return print(listing(tree, cwd).join("   "));
    case "pwd":
      return print(`~/edmond${cwd.length ? "/" + cwd.join("/") : ""}`);
    case "whoami":
      return print(`${profile.name} — ${profile.role}`);
    case "clear":
      return [{ type: "clear" }];
    case "cd": {
      // The new prompt is the only feedback (no echo).
      let next: string[];
      if (!arg || arg === "~" || arg === "/") next = [];
      else if (arg === ".") next = cwd;
      else if (arg === "..") next = cwd.slice(0, -1);
      else {
        const name = arg.replace(/\/$/, "");
        const node = entriesAt(tree, cwd).find((n) => n.name.toLowerCase() === name.toLowerCase());
        if (!node) return print(`cd: no such file or directory: ${arg}`);
        if (node.type !== "folder") return print(`cd: not a directory: ${arg}`);
        next = [...cwd, node.name];
      }
      return [{ type: "cd", cwd: next, route: routeForCwd(tree, next) }];
    }
    case "open":
    case "cat": {
      const file = matchFile(tree, cwd, arg);
      if (!file) return print(`${cmd}: no such file: ${arg || "(nothing)"}`);
      return [{ type: "navigate", route: file.href }];
    }
    case "theme": {
      if (!arg) return print(`themes: ${PALETTES.map((p) => p.name).join(", ")}`);
      const i = PALETTES.findIndex((p) => p.name.toLowerCase().startsWith(arg.toLowerCase()));
      if (i < 0) return print(`no theme "${arg}"`);
      return [{ type: "theme", index: i }, ...print(`theme → ${PALETTES[i].name}`)];
    }
    case "grep":
      return arg ? [{ type: "grep", term: arg }] : print("usage: grep <term>");
    // Hidden easter eggs (not advertised in `help`).
    case "emacs":
      return print("emacs?? are you for real?! 😭 lol this is a vim household. try `vim`.");
    case "vim":
    case "vi":
      return print("a person of taste. :wq");
    case "sudo":
      return print("nice try. you don't have root on my portfolio 😌");
    default:
      return print(`zsh: command not found: ${cmd}`);
  }
}
