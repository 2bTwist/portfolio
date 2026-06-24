/* Build-time git info for the status bar. Runs `git` (or reads Vercel's build
   env) while a Server Component prerenders, so the branch + commit are baked
   into the static output — no client work, no runtime git call. Server-only:
   imports node:child_process, so never import this from a client component. */

import { execSync } from "node:child_process";

export type GitInfo = {
  branch: string;
  shortSha: string;
  dirty: boolean;
  commitUrl: string;
  repoUrl: string;
};

function git(args: string): string | null {
  try {
    return execSync(`git ${args}`, { stdio: ["ignore", "pipe", "ignore"] })
      .toString()
      .trim();
  } catch {
    return null;
  }
}

function repoUrlFromRemote(remote: string | null): string {
  const fallback = "https://github.com/2bTwist/portfolio";
  if (!remote) return fallback;
  // git@github.com:owner/repo.git  |  https://github.com/owner/repo(.git)
  const m = remote.match(/github\.com[:/]([^/]+)\/(.+?)(?:\.git)?$/);
  return m ? `https://github.com/${m[1]}/${m[2]}` : fallback;
}

export function getGitInfo(): GitInfo {
  const branch =
    process.env.VERCEL_GIT_COMMIT_REF || git("rev-parse --abbrev-ref HEAD") || "main";
  const sha = process.env.VERCEL_GIT_COMMIT_SHA || git("rev-parse HEAD") || "";
  const shortSha = sha ? sha.slice(0, 7) : "";
  // Vercel checkouts are always clean; the working-tree flag only means
  // anything locally.
  const dirty = process.env.VERCEL ? false : Boolean(git("status --porcelain"));
  const repoUrl =
    process.env.VERCEL_GIT_REPO_OWNER && process.env.VERCEL_GIT_REPO_SLUG
      ? `https://github.com/${process.env.VERCEL_GIT_REPO_OWNER}/${process.env.VERCEL_GIT_REPO_SLUG}`
      : repoUrlFromRemote(git("config --get remote.origin.url"));
  const commitUrl = sha ? `${repoUrl}/commit/${sha}` : repoUrl;
  return { branch, shortSha, dirty, commitUrl, repoUrl };
}
