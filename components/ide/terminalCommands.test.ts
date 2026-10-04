import { describe, expect, it } from "vitest";
import type { TreeNode } from "@/app/lib/catalogue-view";
import { PALETTES } from "@/app/lib/palette";
import { candidatesFor, completeLine, promptFor, resolveCommand } from "./terminalCommands";

const tree: TreeNode[] = [
  { type: "file", name: "README.md", href: "/" },
  { type: "file", name: "about.md", href: "/about" },
  {
    type: "folder",
    name: "projects",
    href: "/projects",
    children: [
      { type: "file", name: "cogito.tsx", href: "/projects/cogito" },
      { type: "file", name: "cisco-mcp.ts", href: "/projects/cisco-mcp" },
    ],
  },
];

const run = (raw: string, cwd: string[] = []) => resolveCommand(raw, { tree, cwd });
const printed = (raw: string, cwd: string[] = []) => {
  const [effect, ...rest] = run(raw, cwd);
  expect(rest).toEqual([]);
  expect(effect.type).toBe("print");
  return effect.type === "print" ? effect.text : "";
};

describe("resolveCommand", () => {
  it("does nothing for a blank line", () => {
    expect(run("   ")).toEqual([]);
  });

  it("lists the cwd, marking folders", () => {
    expect(printed("ls")).toBe("README.md   about.md   projects/");
    expect(printed("ls", ["projects"])).toBe("cogito.tsx   cisco-mcp.ts");
  });

  it("prints the working directory under ~/edmond", () => {
    expect(printed("pwd")).toBe("~/edmond");
    expect(printed("pwd", ["projects"])).toBe("~/edmond/projects");
  });

  it("cd walks folders case-insensitively and navigates to the folder's route", () => {
    expect(run("cd Projects/")).toEqual([{ type: "cd", cwd: ["projects"], route: "/projects" }]);
    expect(run("cd ..", ["projects"])).toEqual([{ type: "cd", cwd: [], route: "/" }]);
    expect(run("cd", ["projects"])).toEqual([{ type: "cd", cwd: [], route: "/" }]);
    expect(run("cd ~", ["projects"])).toEqual([{ type: "cd", cwd: [], route: "/" }]);
    expect(run("cd .", ["projects"])).toEqual([{ type: "cd", cwd: ["projects"], route: "/projects" }]);
  });

  it("cd refuses missing entries and files", () => {
    expect(printed("cd nowhere")).toBe("cd: no such file or directory: nowhere");
    expect(printed("cd about.md")).toBe("cd: not a directory: about.md");
  });

  it("open and cat match a file with or without its extension or ./ prefix", () => {
    expect(run("open cogito", ["projects"])).toEqual([{ type: "navigate", route: "/projects/cogito" }]);
    expect(run("cat ./cogito.tsx", ["projects"])).toEqual([{ type: "navigate", route: "/projects/cogito" }]);
    expect(run("open ABOUT.MD")).toEqual([{ type: "navigate", route: "/about" }]);
    expect(printed("open")).toBe("open: no such file: (nothing)");
    expect(printed("cat cogito")).toBe("cat: no such file: cogito");
  });

  it("theme lists palettes, switches by name prefix, and rejects unknown names", () => {
    expect(printed("theme")).toBe(`themes: ${PALETTES.map((p) => p.name).join(", ")}`);
    const [name] = PALETTES[1].name;
    const index = PALETTES.findIndex((p) => p.name.toLowerCase().startsWith(name.toLowerCase()));
    expect(run(`theme ${name}`)).toEqual([
      { type: "theme", index },
      { type: "print", text: `theme → ${PALETTES[index].name}` },
    ]);
    expect(printed("theme zzz")).toBe('no theme "zzz"');
  });

  it("grep asks the drawer to search the whole argument, or prints usage", () => {
    expect(run("grep design systems")).toEqual([{ type: "grep", term: "design systems" }]);
    expect(printed("grep")).toBe("usage: grep <term>");
  });

  it("clear resets the scrollback", () => {
    expect(run("clear")).toEqual([{ type: "clear" }]);
  });

  it("reports unknown commands the way zsh does", () => {
    expect(printed("rm -rf /")).toBe("zsh: command not found: rm");
  });
});

describe("completion", () => {
  it("completes commands on the first token and cwd entries after it", () => {
    expect(candidatesFor(tree, "c", [])).toEqual(["cd", "cat", "clear"]);
    expect(candidatesFor(tree, "open c", ["projects"])).toEqual(["cogito.tsx", "cisco-mcp.ts"]);
  });

  it("Tab extends to the unique match, or to the longest common prefix", () => {
    expect(completeLine(tree, "pw", [])).toBe("pwd");
    expect(completeLine(tree, "cd pro", [])).toBe("cd projects/");
    expect(completeLine(tree, "open c", ["projects"])).toBe("open c");
    expect(completeLine(tree, "open co", ["projects"])).toBe("open cogito.tsx");
    expect(completeLine(tree, "zzz", [])).toBe("zzz");
  });
});

it("prompts with the cwd's basename, zsh-style", () => {
  expect(promptFor([])).toBe("edmond %");
  expect(promptFor(["projects"])).toBe("projects %");
});
