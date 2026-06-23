import { execFile } from "node:child_process";
import { promisify } from "node:util";

const run = promisify(execFile);

function sumKB(stdout: string): number | null {
  const start = stdout.indexOf("[");
  if (start === -1) return null;
  try {
    const json: Array<{ size?: number }> = JSON.parse(stdout.slice(start));
    return json.reduce((s, e) => s + (e.size ?? 0), 0) / 1024;
  } catch {
    return null;
  }
}

// Bundle bytes via size-limit (reads .size-limit.js → budgets.json). Requires a
// prior `pnpm build`. size-limit exits non-zero when over budget but still
// prints JSON to stdout, so we parse stdout on both success and failure.
export async function measureBundleKB(): Promise<number | null> {
  try {
    const { stdout } = await run("pnpm", ["exec", "size-limit", "--json"], {
      maxBuffer: 10 * 1024 * 1024,
    });
    return sumKB(stdout);
  } catch (e) {
    const stdout = (e as { stdout?: string }).stdout ?? "";
    return sumKB(stdout);
  }
}
