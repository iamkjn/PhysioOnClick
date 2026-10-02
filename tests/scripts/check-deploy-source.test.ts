import { describe, it, expect } from "vitest";
// @ts-expect-error - plain .mjs build script, no type declarations
import { deployBlockers, parsePorcelain } from "../../scripts/check-deploy-source.mjs";

const clean = { head: "abc", originMaster: "abc", behind: 0, ahead: 0, dirtyPaths: [] as string[] };

describe("deployBlockers", () => {
  it("allows a clean checkout that is exactly origin/master", () => {
    expect(deployBlockers(clean)).toEqual([]);
  });

  it("blocks a checkout that is behind origin/master (the stale-checkout regression)", () => {
    const reasons = deployBlockers({ ...clean, head: "old", behind: 6 });
    expect(reasons).toHaveLength(1);
    expect(reasons[0]).toMatch(/6 commit\(s\) BEHIND/);
  });

  it("blocks unpushed commits, which a later deploy from master would drop", () => {
    const reasons = deployBlockers({ ...clean, head: "new", ahead: 2 });
    expect(reasons[0]).toMatch(/NOT on origin\/master/);
  });

  it("reports both when the checkout has diverged", () => {
    expect(deployBlockers({ ...clean, head: "x", behind: 1, ahead: 1 })).toHaveLength(2);
  });

  it("blocks uncommitted website changes", () => {
    const reasons = deployBlockers({ ...clean, dirtyPaths: ["lib/structured-data.ts", "app/about/page.tsx"] });
    expect(reasons[0]).toMatch(/uncommitted website changes/);
    expect(reasons[0]).toContain("lib/structured-data.ts");
  });

  it("ignores changes that never reach the website build", () => {
    expect(
      deployBlockers({
        ...clean,
        dirtyPaths: ["mobile_app/lib/main.dart", "docs/seo/outreach.md", ".worktrees/x/.claude-flow", ".claude/launch.json"],
      }),
    ).toEqual([]);
  });

  it("blocks when origin/master can't be read", () => {
    expect(deployBlockers({ ...clean, originMaster: "" })[0]).toMatch(/Could not read origin\/master/);
  });
});

describe("parsePorcelain", () => {
  it("extracts paths, including renames and untracked files", () => {
    expect(parsePorcelain(" M app/page.tsx\n?? docs/new.md\nR  old.ts -> lib/new.ts\n")).toEqual([
      "app/page.tsx",
      "docs/new.md",
      "lib/new.ts",
    ]);
  });

  it("keeps the first path intact when the output was trimmed", () => {
    expect(parsePorcelain("M app/about/page.tsx\n M CLAUDE.md\nMM lib/a.ts")).toEqual([
      "app/about/page.tsx",
      "CLAUDE.md",
      "lib/a.ts",
    ]);
  });
});
