import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

let region: "uk" | "overseas" | "unknown" = "uk";
vi.mock("@/lib/visitor-region", () => ({ browserRegion: () => region }));
const trackGrowthEvent = vi.fn();
vi.mock("@/lib/growth-tracking", () => ({ trackGrowthEvent: (...args: unknown[]) => trackGrowthEvent(...args) }));
vi.mock("@/lib/analytics", () => ({ track: vi.fn() }));

import { QuickChatCard } from "@/components/exercise-library/quick-chat-card";

const card = () => screen.queryByRole("complementary", { name: "Free 10-minute chat" });
const wait = (ms: number) => act(() => void vi.advanceTimersByTime(ms));

describe("QuickChatCard", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    region = "uk";
    trackGrowthEvent.mockClear();
    localStorage.clear();
    sessionStorage.clear();
    document.body.innerHTML = "";
  });
  afterEach(() => vi.useRealTimers());

  it("appears after 10 seconds for UK visitors, and says it was shown", () => {
    render(<QuickChatCard exerciseTitle="Clamshell" />);
    wait(9_000);
    expect(card()).toBeNull();
    wait(1_000);
    expect(card()).toBeInTheDocument();
    expect(trackGrowthEvent).toHaveBeenCalledWith("quick_chat_shown", { source: "quick_chat_card" });
    expect(screen.getByRole("link", { name: /whatsapp/i }).getAttribute("href")).toContain("10-minute");
    expect(screen.getByRole("link", { name: /call me back/i }).getAttribute("href")).toContain("Clamshell");
  });

  it("appears sooner once the reader scrolls past the steps", () => {
    const steps = document.body.appendChild(document.createElement("ol"));
    steps.setAttribute("data-steps", "");
    steps.getBoundingClientRect = () => ({ bottom: -10 }) as DOMRect;
    render(<QuickChatCard exerciseTitle="Clamshell" />);
    act(() => void window.dispatchEvent(new Event("scroll")));
    expect(card()).toBeInTheDocument();
  });

  it("never appears for overseas visitors", () => {
    region = "overseas";
    render(<QuickChatCard exerciseTitle="Clamshell" />);
    wait(60_000);
    expect(card()).toBeNull();
  });

  it("waits while the cookie banner is still open", () => {
    const banner = document.body.appendChild(document.createElement("div"));
    banner.className = "cookie-consent";
    render(<QuickChatCard exerciseTitle="Clamshell" />);
    wait(15_000);
    expect(card()).toBeNull();
    banner.remove();
    wait(1_000);
    expect(card()).toBeInTheDocument();
  });

  it("stays closed for a week once dismissed", () => {
    const first = render(<QuickChatCard exerciseTitle="Clamshell" />);
    wait(10_000);
    fireEvent.click(screen.getByRole("button", { name: "Close" }));
    expect(card()).toBeNull();
    expect(trackGrowthEvent).toHaveBeenCalledWith("quick_chat_closed", { source: "quick_chat_card" });
    first.unmount();
    sessionStorage.clear();
    vi.advanceTimersByTime(6 * 86_400_000);
    const second = render(<QuickChatCard exerciseTitle="Clamshell" />);
    wait(10_000);
    expect(card()).toBeNull();
    second.unmount();
    vi.advanceTimersByTime(2 * 86_400_000);
    render(<QuickChatCard exerciseTitle="Clamshell" />);
    wait(10_000);
    expect(card()).toBeInTheDocument();
  });

  it("asks which exercise on the library page", () => {
    render(<QuickChatCard />);
    wait(10_000);
    expect(screen.getByText("Not sure which exercise is right for you?")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /call me back/i }).getAttribute("href")).toContain("exercise%20library");
  });

  it("shows only once per visit", () => {
    const first = render(<QuickChatCard exerciseTitle="Clamshell" />);
    wait(10_000);
    first.unmount();
    render(<QuickChatCard exerciseTitle="Bridge" />);
    wait(10_000);
    expect(card()).toBeNull();
  });
});
