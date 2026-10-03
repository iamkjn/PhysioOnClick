#!/usr/bin/env node
// Runs first in `npm run deploy` (production). Refuses to build unless the
// checkout is exactly origin/master with no uncommitted website changes.
//
// Why: on 2026-10-02 production was overwritten three times by deploys from a
// checkout whose local master was six commits behind origin (old prices, no
// embeds), and once by a deploy built from code that wasn't pushed yet, so the
// next deploy from master silently dropped it. Both are caught here.
//
// Also: on 2026-10-03 every page 500'd for ~3.5h because prod was built in a
// worktree whose node_modules was a SYMLINK. OpenNext copies the link into the
// bundle instead of the real packages, so its next-server.js patch never applies
// and the Worker throws "Dynamic require of /.next/server/middleware-manifest.json".
// verify-opennext-build.mjs checks the built output for the same failure.
//
// Emergency override (prints a loud warning): ALLOW_UNSYNCED_DEPLOY=1 npm run deploy
// Rolling back a bad release doesn't need this: use `npx wrangler rollback <version>`.

import { execFileSync } from "node:child_process";
import { lstatSync } from "node:fs";
import { pathToFileURL } from "node:url";

/** Paths that never reach the website build, so uncommitted edits there are fine. */
export const IGNORED_PREFIXES = ["mobile_app/", "docs/", ".worktrees/", ".claude/"];

/**
 * Pure decision: given the git state, return the reasons this checkout must not
 * be deployed to production ([] means it's safe).
 */
export function deployBlockers({ head, originMaster, behind, ahead, dirtyPaths, nodeModulesSymlink = false }) {
  const reasons = [];
  if (nodeModulesSymlink) {
    reasons.push(
      "node_modules is a symlink. OpenNext would bundle the link instead of the real packages and every page " +
        "would 500 in production. Replace it with a real copy: rm node_modules && cp -cR <main checkout>/node_modules node_modules",
    );
  }
  if (!originMaster) {
    reasons.push(
      "Could not read origin/master (no network or no 'origin' remote), so freshness can't be checked.",
    );
  } else if (head !== originMaster) {
    if (behind > 0) {
      reasons.push(
        `This checkout is ${behind} commit(s) BEHIND origin/master. Deploying it would undo changes that are already live. Run: git pull`,
      );
    }
    if (ahead > 0) {
      reasons.push(
        `This checkout has ${ahead} commit(s) that are NOT on origin/master. A later deploy from master would silently drop them. Push first: git push origin HEAD:master`,
      );
    }
  }
  const relevant = dirtyPaths.filter((p) => !IGNORED_PREFIXES.some((prefix) => p.startsWith(prefix)));
  if (relevant.length > 0) {
    const shown = relevant.slice(0, 10).map((p) => `    ${p}`).join("\n");
    const more = relevant.length > 10 ? `\n    ...and ${relevant.length - 10} more` : "";
    reasons.push(
      `There are uncommitted website changes. They would go live without being saved to GitHub:\n${shown}${more}\n  Commit and push them, or stash them, before deploying.`,
    );
  }
  return reasons;
}

function git(args) {
  return execFileSync("git", args, { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim();
}

/** Paths from `git status --porcelain` (handles renames: "R  old -> new"). */
export function parsePorcelain(output) {
  return output
    .split("\n")
    .filter(Boolean)
    // Strip the 1-2 char status code by pattern, not position: git() trims the
    // output, which eats the leading space of the first " M path" line.
    .map((line) => line.replace(/^\s*\S{1,2}\s+/, "").split(" -> ").pop().replace(/^"|"$/g, ""));
}

function readGitState() {
  let originMaster = "";
  try {
    git(["fetch", "--quiet", "origin", "master"]);
    originMaster = git(["rev-parse", "origin/master"]);
  } catch {
    originMaster = "";
  }
  const head = git(["rev-parse", "HEAD"]);
  let behind = 0;
  let ahead = 0;
  if (originMaster && head !== originMaster) {
    const [b, a] = git(["rev-list", "--left-right", "--count", `origin/master...HEAD`]).split(/\s+/).map(Number);
    behind = b;
    ahead = a;
  }
  const dirtyPaths = parsePorcelain(git(["status", "--porcelain", "--untracked-files=all"]));
  let nodeModulesSymlink = false;
  try {
    nodeModulesSymlink = lstatSync("node_modules").isSymbolicLink();
  } catch {
    // A missing node_modules fails the build on its own.
  }
  return { head, originMaster, behind, ahead, dirtyPaths, nodeModulesSymlink };
}

function main() {
  const state = readGitState();
  const reasons = deployBlockers(state);
  if (reasons.length === 0) {
    console.log(`Deploy source check passed: building origin/master ${state.head.slice(0, 8)}.`);
    return;
  }
  const report = reasons.map((r) => `  - ${r}`).join("\n");
  if (process.env.ALLOW_UNSYNCED_DEPLOY === "1") {
    console.warn(`\n!!! ALLOW_UNSYNCED_DEPLOY=1: deploying anyway despite:\n${report}\n`);
    return;
  }
  console.error(
    `\nDEPLOY BLOCKED: production must be built from the latest origin/master.\n${report}\n\n` +
      `If you are sure (emergency only): ALLOW_UNSYNCED_DEPLOY=1 npm run deploy\n`,
  );
  process.exit(1);
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  main();
}
