import { describe, expect, it } from "vitest";

import { buildSystemPrompt } from "@/lib/chat-prompt";

describe("buildSystemPrompt - exercise library awareness", () => {
  const prompt = buildSystemPrompt();

  it("keeps the existing ## Services anchor (no accidental clobber)", () => {
    expect(prompt).toContain("## Services");
    expect(prompt).toContain("## Rules");
  });

  it("tells the assistant about the public /exercises library and its hub URLs", () => {
    expect(prompt).toContain("/exercises");
    expect(prompt).toContain("/exercises/for/");
  });

  it("instructs the assistant it may link a condition hub / exercise page via redirect", () => {
    expect(prompt).toMatch(/redirect/i);
    expect(prompt).toMatch(/self-management|what exercises|exercises for/i);
  });
});
