import { fireEvent, render, screen } from "@testing-library/react";
import { createElement } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({ usePathname: () => "/" }));

import { CookieConsent } from "@/components/cookie-consent";
import { trackGrowthEvent } from "@/lib/growth-tracking";

const beacon = vi.fn(() => true);

describe("visit statistics honour the cookie banner", () => {
  beforeEach(() => {
    window.localStorage.clear();
    window.sessionStorage.clear();
    beacon.mockClear();
    Object.defineProperty(navigator, "sendBeacon", { value: beacon, configurable: true });
  });

  afterEach(() => {
    window.localStorage.clear();
  });

  it("counts a visit before any choice and after Accept all", () => {
    trackGrowthEvent("page_view");
    expect(beacon).toHaveBeenCalledTimes(1);
    window.localStorage.setItem("poc-cookie-consent", "granted");
    trackGrowthEvent("page_view");
    expect(beacon).toHaveBeenCalledTimes(2);
  });

  it("stops counting after Reject analytics and forgets the visitor id", () => {
    trackGrowthEvent("page_view");
    expect(window.localStorage.getItem("poc-growth-session-id")).toBeTruthy();
    beacon.mockClear();

    render(createElement(CookieConsent));
    fireEvent.click(screen.getByRole("button", { name: "Reject analytics" }));

    expect(window.localStorage.getItem("poc-cookie-consent")).toBe("denied");
    expect(window.localStorage.getItem("poc-growth-session-id")).toBeNull();
    trackGrowthEvent("page_view");
    trackGrowthEvent("book_now_click");
    expect(beacon).not.toHaveBeenCalled();
    expect(window.localStorage.getItem("poc-growth-session-id")).toBeNull();
  });

  it("tells visitors on the banner that Reject analytics turns the statistics off", () => {
    render(createElement(CookieConsent));
    expect(screen.getByText(/simple visit statistics/)).toBeInTheDocument();
    expect(screen.getByText(/turns both off/)).toBeInTheDocument();
  });
});
