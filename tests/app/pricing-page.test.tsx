import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
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
});
