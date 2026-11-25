import { fireEvent, render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const trackGrowthEvent = vi.fn();
vi.mock("@/lib/growth-tracking", () => ({ trackGrowthEvent: (...a: unknown[]) => trackGrowthEvent(...a) }));
vi.mock("@/lib/analytics", () => ({ track: vi.fn() }));

import { PricingChooser } from "@/components/pricing-chooser";
import { conditionEmailHref } from "@/lib/practice-contact";

function renderChooser() {
  render(<PricingChooser homeInitial="£80" homeFollowUp="£70" videoInitial="£50" />);
  const tile = (name: string) => screen.getByRole("heading", { name }).closest("div")!;
  return { home: tile("Home visit"), video: tile("Video appointment"), unsure: tile("Not sure?") };
}

describe("PricingChooser", () => {
  beforeEach(() => trackGrowthEvent.mockReset());

  it("answers 'which one do I need?' with three plain choices and their prices", () => {
    const { home, video, unsure } = renderChooser();
    expect(screen.getByRole("heading", { name: "Which one do I need?" })).toBeInTheDocument();
    expect(home).toHaveTextContent("£80");
    expect(home).toHaveTextContent("£70");
    expect(video).toHaveTextContent("£50");
    expect(video).toHaveTextContent("Anywhere in the UK");
    expect(unsure).toHaveTextContent(/no obligation/i);
  });

  it("leads home visits with a call back, keeping online booking as the second option", () => {
    const { home } = renderChooser();
    expect(within(home).getByRole("link", { name: /request a call back/i }).getAttribute("href")).toMatch(
      /^\/request-visit\?about=Home%20visit/,
    );
    expect(within(home).getByRole("link", { name: /pay online/i })).toHaveAttribute("href", "/book?pay=online&visit=home");
  });

  it("books video online and lets the unsure ask by email, logging each tap", () => {
    const { video, unsure } = renderChooser();
    expect(within(video).getByRole("link", { name: /book a video appointment/i })).toHaveAttribute(
      "href",
      "/book?service=initial-assessment",
    );
    const email = within(unsure).getByRole("link", { name: /email us about your condition/i });
    expect(email).toHaveAttribute("href", conditionEmailHref("which option suits me"));
    fireEvent.click(email);
    expect(trackGrowthEvent).toHaveBeenCalledWith("email_click", { source: "pricing_chooser_ask", topic: "condition" });
  });
});
