import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const handlerPath = join(".open-next", "server-functions", "default", "handler.mjs");
const middlewareManifestPath = join(
  ".open-next",
  "server-functions",
  "default",
  ".next",
  "server",
  "middleware-manifest.json",
);

const manifest = JSON.parse(readFileSync(middlewareManifestPath, "utf8"));
const manifestLiteral = JSON.stringify(manifest);
const workerPath = join(".open-next", "worker.js");

const helper = `function(x){if(typeof require<"u")return require.apply(this,arguments);throw Error('Dynamic require of "'+x+'" is not supported')}`;
const patchedHelper = `function(x){if(x==="/.next/server/middleware-manifest.json")return ${manifestLiteral};if(typeof require<"u")return require.apply(this,arguments);throw Error('Dynamic require of "'+x+'" is not supported')}`;

function patchFile(path, { required = false } = {}) {
  const source = readFileSync(path, "utf8");
  if (source.includes(patchedHelper)) return false;
  if (!source.includes(helper)) {
    if (!required) return false;
    throw new Error(`OpenNext require helper shape changed in ${path}; middleware-manifest patch was not applied.`);
  }
  writeFileSync(path, source.replace(helper, patchedHelper));
  return true;
}

const patched = [
  patchFile(handlerPath, { required: true }) && handlerPath,
  patchFile(workerPath) && workerPath,
].filter(Boolean);
console.log(`Patched OpenNext middleware manifest dynamic require in ${patched.join(", ")}.`);
