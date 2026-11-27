import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/growth-tracking", () => ({
  trackGrowthEvent: vi.fn(),
  currentVisitSource: () => ({ channel: "", referrerHost: "" }),
}));
vi.mock("@/lib/analytics", () => ({ track: vi.fn() }));

import { VisitRequestForm } from "@/components/visit-request-form";

const next = () => fireEvent.click(screen.getByRole("button", { name: /continue/i }));
const type = (label: RegExp | string, value: string) => fireEvent.change(screen.getByLabelText(label), { target: { value } });
const pick = (name: RegExp) => fireEvent.click(screen.getByRole("radio", { name }));

async function sendFor(postcode: string) {
  next();
  type(/^postcode/i, postcode);
  type(/town/i, "Town");
  next();
  pick(/this week/i);
  next();
  type(/preferred date/i, "2099-01-05");
  pick(/evening/i);
  next();
  type(/full name/i, "John Smith");
  pick(/^male/i);
  type(/date of birth/i, "1950-04-02");
  type("Phone", "07518 953611");
  type("Email", "john@example.com");
  next();
  screen.getAllByRole("checkbox").forEach((box) => fireEvent.click(box));
  fireEvent.click(screen.getByRole("button", { name: /send booking request/i }));
  await screen.findByRole("heading", { name: /thanks, john/i });
}

describe("request confirmation shows the price again", () => {
  beforeEach(() => {
    window.sessionStorage.clear();
    vi.stubGlobal("fetch", vi.fn(() => Promise.resolve({ ok: true, json: async () => ({ ok: true }) })));
  });
  afterEach(() => vi.unstubAllGlobals());

  it("repeats the postcode's home-visit prices", async () => {
    const { container } = render(<VisitRequestForm />);
    await sendFor("fk16 5aa");
    expect(container.textContent).toContain("First visit £110, follow-ups £100.");
  });

  it("offers to talk, with no price and no 'outside' wording, elsewhere", async () => {
    const { container } = render(<VisitRequestForm />);
    await sendFor("eh6 4sy");
    expect(container.textContent).toMatch(/talk about the options for EH6/i);
    expect(container.textContent).not.toMatch(/outside|£/i);
  });
});
