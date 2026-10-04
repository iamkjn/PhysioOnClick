import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

const tracked = vi.hoisted(() => ({ track: vi.fn(), trackGrowthEvent: vi.fn() }));
vi.mock("@/lib/analytics", () => ({ track: tracked.track }));
vi.mock("@/lib/growth-tracking", () => ({ trackGrowthEvent: tracked.trackGrowthEvent }));
import PricingPage from "@/app/pricing/page";
import { formatPounds, sessionPricePence } from "@/lib/home-visit-pricing";

describe("pricing page home visits", () => {
  it("explains the travel fee, the area and shows home totals", () => {
    render(<PricingPage />);
    expect(screen.getByRole("heading", { name: /Home visits in Glasgow/ })).toBeInTheDocument();
    expect(screen.getByText(/£15 travel fee per visit/)).toBeInTheDocument();
    expect(screen.getByText(/Glasgow \(G1–G53\), Paisley \(PA1–PA3\) and Hamilton \(ML3\)/)).toBeInTheDocument();
    expect(screen.getByText(formatPounds(sessionPricePence("initial-assessment") + 1500))).toBeInTheDocument();
    expect(screen.getByText(formatPounds(sessionPricePence("bundle-8") + 12000))).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Book a home visit/ })).toHaveAttribute("href", "/book?visit=home");
  });

  it("derives the heading's travel fee from the constant", async () => {
    const { HOME_VISIT_TRAVEL_FEE_PENCE } = await import("@/lib/home-visit-pricing");
    const src = (await import("node:fs")).readFileSync("app/pricing/page.tsx", "utf8");
    expect(src).not.toMatch(/£15/);
    render(<PricingPage />);
    expect(screen.getByRole("heading", { name: /Home visits in Glasgow/ })).toHaveTextContent(
      `(video price + ${formatPounds(HOME_VISIT_TRAVEL_FEE_PENCE)} travel fee per visit)`,
    );
  });

  it("tracks the home-visit book link like the page's other book CTAs", () => {
    render(<PricingPage />);
    fireEvent.click(screen.getByRole("link", { name: /Book a home visit/ }));
    expect(tracked.trackGrowthEvent).toHaveBeenCalledWith("book_now_click", expect.objectContaining({ source: "pricing_page_home_visit" }));
    expect(tracked.track).toHaveBeenCalledWith("book_now_click", expect.objectContaining({ source: "pricing_page_home_visit" }));
  });
});
