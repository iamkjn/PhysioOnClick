import { describe, expect, it } from "vitest";

import { allBookServices, bookServiceFor, isOnSale } from "@/lib/cal-services";
import { buildSystemPrompt } from "@/lib/chat-prompt";
import { getPublicPricing } from "@/lib/public-content";

describe("4 and 8 session packages are no longer sold (2026-11-27)", () => {
  it("are not offered anywhere a patient chooses a service", () => {
    expect(allBookServices().map((s) => s.id)).toEqual(["initial-assessment", "follow-up"]);
    expect(getPublicPricing().map((p) => p.id)).toEqual(["initial-assessment", "follow-up"]);
    expect(isOnSale("bundle-4")).toBe(false);
    expect(isOnSale("bundle-8")).toBe(false);
    expect(isOnSale("follow-up")).toBe(true);
  });

  it("can still be named on records of packages already bought", () => {
    expect(bookServiceFor("bundle-4").title).toBe("4 Session Bundle");
    expect(bookServiceFor("bundle-8").sessions).toBe(8);
  });

  it("are not mentioned by the chat assistant, which does mention cash", () => {
    const prompt = buildSystemPrompt();
    expect(prompt).not.toMatch(/bundle|package/i);
    expect(prompt).toMatch(/cash/i);
  });
});
