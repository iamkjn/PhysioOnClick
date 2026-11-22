import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const trackGrowthEvent = vi.fn();
const track = vi.fn();
vi.mock("@/lib/growth-tracking", () => ({ trackGrowthEvent: (...a: unknown[]) => trackGrowthEvent(...a) }));
vi.mock("@/lib/analytics", () => ({ track: (...a: unknown[]) => track(...a) }));

import { CallTapTracker } from "@/components/call-tap-tracker";

// jsdom can't follow tel: links; stop the navigation after the tracker has seen the tap.
const stopNavigation = (event: Event) => event.preventDefault();

function page() {
  return (
    <>
      <CallTapTracker />
      <div data-contact-source="request_visit_steps">
        <a href="tel:+447557684395">
          <span>07557 684395</span>
        </a>
      </div>
      <footer>
        <a href="tel:+447557684395">Footer number</a>
      </footer>
      <main>
        <a href="tel:+447557684395">Plain number</a>
        <a href="/book">Book online</a>
      </main>
    </>
  );
}

describe("CallTapTracker", () => {
  beforeEach(() => {
    trackGrowthEvent.mockReset();
    track.mockReset();
    document.addEventListener("click", stopNavigation);
  });
  afterEach(() => document.removeEventListener("click", stopNavigation));

  it("records a tap on a phone number with the block it sits in", () => {
    render(page());
    fireEvent.click(screen.getByText("07557 684395"));
    expect(trackGrowthEvent).toHaveBeenCalledWith("call_click", { source: "request_visit_steps" });
    expect(track).toHaveBeenCalledWith("contact_click", { method: "call", source: "request_visit_steps" });
  });

  it("names footer and other phone links by where they are", () => {
    render(page());
    fireEvent.click(screen.getByText("Footer number"));
    fireEvent.click(screen.getByText("Plain number"));
    expect(trackGrowthEvent).toHaveBeenNthCalledWith(1, "call_click", { source: "footer" });
    expect(trackGrowthEvent).toHaveBeenNthCalledWith(2, "call_click", { source: "page" });
  });

  it("ignores every other link", () => {
    render(page());
    fireEvent.click(screen.getByText("Book online"));
    expect(trackGrowthEvent).not.toHaveBeenCalled();
  });

  it("stops listening when it unmounts", () => {
    const { unmount } = render(page());
    unmount();
    render(
      <a href="tel:+447557684395" onClick={(event) => event.preventDefault()}>
        After unmount
      </a>,
    );
    fireEvent.click(screen.getByText("After unmount"));
    expect(trackGrowthEvent).not.toHaveBeenCalled();
  });
});
