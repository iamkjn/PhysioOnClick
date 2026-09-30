import { describe, it, expect, vi, afterEach } from "vitest";
import { render } from "@testing-library/react";

afterEach(() => {
  vi.unstubAllEnvs();
});

async function renderReviews() {
  vi.resetModules();
  const { TrustpilotReviews } = await import("@/components/trustpilot-reviews");
  return render(await TrustpilotReviews({ limit: 4 }));
}

describe("TrustpilotReviews", () => {
  it("falls back to the owner-confirmed curated reviews without the paid API", async () => {
    vi.stubEnv("TRUSTPILOT_API_KEY", "");
    vi.stubEnv("TRUSTPILOT_BUSINESS_UNIT_ID", "");
    const { container } = await renderReviews();

    expect(container).toHaveTextContent("Seena Rachel George");
    expect(container).toHaveTextContent("Anish Thomas");
    expect(container).toHaveTextContent("Hemal Patel");
    expect(container).toHaveTextContent("Selected patient reviews from Trustpilot");
    // No hardcoded score, and no "verified" claim Trustpilot doesn't make.
    expect(container).not.toHaveTextContent(/Verified/);
    expect(container.querySelector(".tp-summary-score")).toBeNull();
    expect(container.querySelector('a[href="https://uk.trustpilot.com/review/physioonclick.co.uk"]')).not.toBeNull();
  });
});

describe("curatedTrustpilotReviews", () => {
  it("only contains the three owner-confirmed patients", async () => {
    const { curatedTrustpilotReviews } = await import("@/lib/trustpilot-curated");
    expect(curatedTrustpilotReviews.map((r) => r.author)).toEqual([
      "Seena Rachel George",
      "Anish Thomas",
      "Hemal Patel",
    ]);
  });
});
