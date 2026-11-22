import { render } from "@testing-library/react";
import { readFileSync } from "node:fs";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/analytics", () => ({ track: vi.fn() }));
vi.mock("@/lib/growth-tracking", () => ({ trackGrowthEvent: vi.fn() }));

import PricingPage from "@/app/pricing/page";
import { buildSystemPrompt } from "@/lib/chat-prompt";

// The NEW10 new-patient code ended on 22 Nov 2026: nothing on the site may still offer it.
describe("NEW10 has ended", () => {
  it("is not offered on the pricing page", () => {
    const { container } = render(<PricingPage />);
    expect(container.textContent).not.toMatch(/NEW10|10% off|discount code|new patient offer/i);
  });

  it("is gone from the header strip, the booking step and the chat widget's price answer", () => {
    for (const file of ["components/site-header.tsx", "components/booking-step-time.tsx", "components/chat-widget.tsx"]) {
      expect(readFileSync(file, "utf8")).not.toMatch(/NEW10|discount code/i);
    }
  });

  it("tells the assistant there are no codes instead of offering one", () => {
    const prompt = buildSystemPrompt();
    expect(prompt).toMatch(/no discount codes/i);
    expect(prompt).not.toMatch(/NEW10 gives|code NEW10 for|NEW10 for 10% off/i);
  });
});
