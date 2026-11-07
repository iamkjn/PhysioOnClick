import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import CancellationPolicyPage from "@/app/cancellation-policy/page";

// A home visit is one whole price (lib/home-visit-pricing), so refunds are of
// that whole price: there is no separate travel fee to refund.
describe("cancellation policy: home-visit refunds", () => {
  it("refunds the whole home-visit price on a full refund", () => {
    render(<CancellationPolicyPage />);
    expect(
      screen.getByText(/A full refund for a\s+home visit is the whole home-visit price you paid\./),
    ).toBeInTheDocument();
  });

  it("refunds unused home-visit package sessions from the whole package price", () => {
    render(<CancellationPolicyPage />);
    expect(
      screen.getByText(/For a home-visit package, that is the whole\s+home-visit package price you paid\./),
    ).toBeInTheDocument();
  });

  it("never mentions a travel fee", () => {
    const { container } = render(<CancellationPolicyPage />);
    expect(container.textContent).not.toMatch(/travel fee/i);
    expect(container.textContent).not.toMatch(/£15/);
  });
});
