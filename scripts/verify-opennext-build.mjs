#!/usr/bin/env node
// Runs after `opennextjs-cloudflare build` and before deploy (prod and dev).
// Refuses to ship a bundle that would 500 on every page.
//
// Why: on 2026-10-03 production was down ~3.5h. The build ran in a worktree whose
// node_modules was a symlink; OpenNext copied the link into the bundle, so its
// ast-grep patch that stubs next-server's getMiddlewareManifest() never applied
// and every request threw "Dynamic require of /.next/server/middleware-manifest.json
// is not supported". The build itself reported success. This checks the output
// directly, so it catches that failure whatever caused it. No override: a bundle
// that fails here cannot work on Workers.

import { lstatSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

const SERVER_DIR = join(".open-next", "server-functions", "default");
const DEFINITION = "getMiddlewareManifest(){";
const STUBBED = "getMiddlewareManifest(){return null}";

/**
 * Pure decision: given the built handler source and any symlinks found in the
 * bundled node_modules, return the reasons this build must not ship ([] = ok).
 */
export function buildProblems({ handlerSource, bundledSymlinks }) {
  const problems = [];
  const definitions = handlerSource.split(DEFINITION).length - 1;
  const stubbed = handlerSource.split(STUBBED).length - 1;
  if (definitions === 0) {
    problems.push(
      "Could not find next-server's getMiddlewareManifest() in the built handler. OpenNext's output shape " +
        "changed; check the middleware-manifest patch still applies before deploying.",
    );
  } else if (stubbed !== definitions) {
    problems.push(
      "OpenNext's getMiddlewareManifest() patch was NOT applied: the Worker would throw " +
        '"Dynamic require of /.next/server/middleware-manifest.json" and every page would 500. ' +
        "Usually caused by a symlinked node_modules; rebuild with a real copy (cp -cR).",
    );
  }
  if (bundledSymlinks.length > 0) {
    problems.push(
      `The bundle contains symlinked packages, which won't exist on Workers:\n` +
        bundledSymlinks.slice(0, 10).map((p) => `    ${p}`).join("\n"),
    );
  }
  return problems;
}

/** Symlinks among bundled packages (top level and @scope/ level). */
function findBundledSymlinks() {
  const root = join(SERVER_DIR, "node_modules");
  const links = [];
  let entries;
  try {
    entries = readdirSync(root);
  } catch {
    return links;
  }
  for (const name of entries) {
    const path = join(root, name);
    const stat = lstatSync(path);
    if (stat.isSymbolicLink()) {
      links.push(join("node_modules", name));
    } else if (name.startsWith("@") && stat.isDirectory()) {
      for (const sub of readdirSync(path)) {
        if (lstatSync(join(path, sub)).isSymbolicLink()) links.push(join("node_modules", name, sub));
      }
    }
  }
  return links;
}

function main() {
  const handlerSource = readFileSync(join(SERVER_DIR, "handler.mjs"), "utf8");
  const problems = buildProblems({ handlerSource, bundledSymlinks: findBundledSymlinks() });
  if (problems.length === 0) {
    console.log("OpenNext build check passed: middleware-manifest patch applied, no symlinked packages.");
    return;
  }
  console.error(
    `\nDEPLOY BLOCKED: this build would fail on Cloudflare.\n${problems.map((p) => `  - ${p}`).join("\n")}\n`,
  );
  process.exit(1);
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  main();
}
