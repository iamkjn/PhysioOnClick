import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { render } from "@testing-library/react";
import { durationFor, includedFor, minutesFor } from "@/lib/cal-services";
import { buildSystemPrompt } from "@/lib/chat-prompt";
import PricingPage from "@/app/pricing/page";

// Owner decision 2026-11-15: a home follow-up is 60 minutes; video follow-ups
// stay 30. The Cal.com event follow-up-home-visit-in-glasgow was set to 60 in
// both accounts the same day, so the site must say 60 too.
describe("home follow-up is 60 minutes", () => {
  it("books and describes 60 minutes at home, 30 by video", () => {
    expect(minutesFor("follow-up", "home")).toBe(60);
    expect(minutesFor("follow-up", "video")).toBe(30);
    expect(minutesFor("follow-up")).toBe(30);
    expect(minutesFor("initial-assessment", "home")).toBe(60);
    expect(durationFor("follow-up", "home")).toBe("60 min");
    expect(durationFor("follow-up", "video")).toBe("30 min");
    expect(durationFor("bundle-4", "home")).toBe("Flexible");
  });

  it("shows a 60-minute home visit in the booking rail", () => {
    expect(includedFor("follow-up", "home")[0]).toBe("60-minute home visit");
    expect(includedFor("follow-up", "video")[0]).toBe("30-minute video consultation");
  });

  it("shows 60 min on the pricing page's home follow-up card", () => {
    const { container } = render(<PricingPage />);
    const card = [...container.querySelectorAll(".simple-price-card")].find((c) =>
      /Follow-Up \(home visit\)/.test(c.querySelector("h3")?.textContent ?? ""),
    );
    expect(card?.textContent).toContain("60 min");
  });

  it("tells the chat and the how-it-works FAQ", () => {
    expect(buildSystemPrompt()).toContain("Every home visit, assessment or follow-up, is 60 minutes; video follow-ups are 30 minutes.");
    expect(readFileSync("components/chat-widget.tsx", "utf8")).toContain("every home visit is 60 minutes");
    expect(readFileSync("app/how-online-physiotherapy-works/page.tsx", "utf8")).toContain(
      "Follow-up sessions are 30 minutes by video, or 60 minutes at a home visit.",
    );
  });
});
