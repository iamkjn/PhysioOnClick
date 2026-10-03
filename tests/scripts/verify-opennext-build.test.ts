import { describe, it, expect } from "vitest";
// @ts-expect-error - plain .mjs build script, no type declarations
import { buildProblems } from "../../scripts/verify-opennext-build.mjs";

const patched =
  "class S{getMiddlewareManifest(){return null}x(){let manifest=this.getMiddlewareManifest();return manifest?Object.keys(manifest.functions):[]}}";

describe("buildProblems", () => {
  it("passes a build where OpenNext stubbed getMiddlewareManifest", () => {
    expect(buildProblems({ handlerSource: patched, bundledSymlinks: [] })).toEqual([]);
  });

  it("fails when getMiddlewareManifest still does the dynamic require (the 2026-10-03 outage)", () => {
    const unpatched =
      'class S{getMiddlewareManifest(){return this.minimalMode?null:require(this.middlewareManifestPath)}}';
    const problems = buildProblems({ handlerSource: unpatched, bundledSymlinks: [] });
    expect(problems).toHaveLength(1);
    expect(problems[0]).toMatch(/middleware-manifest/);
  });

  it("fails when the method can't be found at all", () => {
    expect(buildProblems({ handlerSource: "nothing here", bundledSymlinks: [] })[0]).toMatch(
      /getMiddlewareManifest/,
    );
  });

  it("fails when the bundle contains symlinked packages", () => {
    const problems = buildProblems({ handlerSource: patched, bundledSymlinks: ["node_modules/next"] });
    expect(problems[0]).toMatch(/symlink/);
    expect(problems[0]).toContain("node_modules/next");
  });
});
