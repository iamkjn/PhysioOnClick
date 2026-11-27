import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

const tracked = vi.hoisted(() => ({ track: vi.fn(), trackGrowthEvent: vi.fn() }));
vi.mock("@/lib/analytics", () => ({ track: tracked.track }));
vi.mock("@/lib/growth-tracking", () => ({ trackGrowthEvent: tracked.trackGrowthEvent }));
import PricingPage from "@/app/pricing/page";
import { formatPounds, homeVisitPricePence, sessionPricePence } from "@/lib/home-visit-pricing";

describe("pricing page home visits", () => {
  // A home visit has one whole price (lib/home-visit-pricing), shown as such.
  it("explains the all-in price, the area and shows whole home prices", () => {
    render(<PricingPage />);
    expect(screen.getByRole("heading", { name: /Home visits in Glasgow/ })).toBeInTheDocument();
    expect(screen.getByText(/Your price is confirmed before you book\. For a home visit/)).toBeInTheDocument();
    expect(screen.getByText(/Glasgow and the surrounding area \(Lanarkshire/)).toBeInTheDocument();
    // Scoped to the full price list: the "Which one do I need?" chooser above it repeats £80 / £70.
    const list = within(document.querySelector(".pricing-sections") as HTMLElement);
    for (const id of ["initial-assessment", "follow-up"] as const) {
      expect(list.getByText(`from ${formatPounds(homeVisitPricePence(id))}*`)).toBeInTheDocument();
    }
    expect(screen.getByRole("link", { name: /Book a home visit/ })).toHaveAttribute("href", "/book?visit=home");
  });

  it("shows no travel fee and no video-plus-fee breakdown", async () => {
    const src = (await import("node:fs")).readFileSync("app/pricing/page.tsx", "utf8");
    expect(src).not.toMatch(/£15\b/);
    expect(src).not.toMatch(/travel fee|HOME_VISIT_TRAVEL_FEE_PENCE|travelFeePence/i);
    const { container } = render(<PricingPage />);
    expect(screen.getByRole("heading", { name: /Home visits in Glasgow/ })).toHaveTextContent("Home visits in Glasgow and nearby");
    expect(container.textContent).not.toMatch(/travel fee/i);
    expect(container.textContent).not.toMatch(/\+ £\d+ travel/i);
    expect(container.textContent).not.toMatch(/video price \+/i);
    // The video part of a home price is never printed beside it.
    const homeCards = [...container.querySelectorAll(".simple-price-card")].filter((card) =>
      /home visit/i.test(card.querySelector("h3")?.textContent ?? ""),
    );
    expect(homeCards).toHaveLength(2);
    for (const card of homeCards) expect(card.querySelectorAll("strong")).toHaveLength(1);
    expect(homeCards.map((card) => card.querySelector("strong")?.textContent)).toEqual(
      (["initial-assessment", "follow-up"] as const).map((id) =>
        `from ${formatPounds(sessionPricePence(id, "home"))}*`,
      ),
    );
  });

  it("lists home visits before video appointments", () => {
    render(<PricingPage />);
    const home = screen.getByRole("heading", { name: /Home visits in Glasgow/ });
    const video = screen.getByRole("heading", { name: /Video appointments/ });
    expect(home.compareDocumentPosition(video) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it("tracks the home-visit book link like the page's other book CTAs", () => {
    render(<PricingPage />);
    fireEvent.click(screen.getByRole("link", { name: /Book a home visit/ }));
    expect(tracked.trackGrowthEvent).toHaveBeenCalledWith("book_now_click", expect.objectContaining({ source: "pricing_page_home_visit" }));
    expect(tracked.track).toHaveBeenCalledWith("book_now_click", expect.objectContaining({ source: "pricing_page_home_visit" }));
  });
});
