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
const source = readFileSync(handlerPath, "utf8");

const helper = `function(x){if(typeof require<"u")return require.apply(this,arguments);throw Error('Dynamic require of "'+x+'" is not supported')}`;
const patchedHelper = `function(x){if(x==="/.next/server/middleware-manifest.json")return ${manifestLiteral};if(typeof require<"u")return require.apply(this,arguments);throw Error('Dynamic require of "'+x+'" is not supported')}`;

if (!source.includes(helper)) {
  throw new Error("OpenNext require helper shape changed; middleware-manifest patch was not applied.");
}

writeFileSync(handlerPath, source.replace(helper, patchedHelper));
console.log("Patched OpenNext middleware manifest dynamic require.");
