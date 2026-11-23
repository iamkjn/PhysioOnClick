import { act, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/firebase", () => ({ db: {} }));

type Constraint = { field?: string; op?: string; value?: string };

const h = vi.hoisted(() => {
  const events = [
    // Today (23 Nov): two people, three page views.
    { id: "1", event: "page_view", path: "/pricing", sessionId: "s1", channel: "facebook", referrerHost: "m.facebook.com", createdAtIso: "2026-11-23T10:01:00.000Z" },
    { id: "2", event: "page_view", path: "/", sessionId: "s1", channel: "facebook", referrerHost: "m.facebook.com", createdAtIso: "2026-11-23T10:00:00.000Z" },
    { id: "3", event: "page_view", path: "/", sessionId: "s2", channel: "google", referrerHost: "www.google.com", createdAtIso: "2026-11-23T00:05:00.000Z" },
    // Yesterday (22 Nov): one person, typed the address in.
    { id: "4", event: "page_view", path: "/services", sessionId: "s3", channel: "direct", referrerHost: "", createdAtIso: "2026-11-22T21:00:00.000Z" },
  ];
  const ranges: Array<{ start: string; end: string }> = [];
  return { events, ranges };
});

vi.mock("firebase/firestore", () => ({
  collection: vi.fn(),
  limit: vi.fn(),
  orderBy: vi.fn(),
  where: (field: string, op: string, value: string) => ({ field, op, value }),
  query: (_collection: unknown, ...constraints: Constraint[]) => constraints,
  onSnapshot: (constraints: Constraint[], next: (snapshot: unknown) => void) => {
    const start = constraints.find((c) => c?.op === ">=")?.value ?? "";
    const end = constraints.find((c) => c?.op === "<")?.value ?? "";
    h.ranges.push({ start, end });
    const docs = h.events
      .filter((e) => e.createdAtIso >= start && e.createdAtIso < end)
      .map(({ id, ...data }) => ({ id, data: () => data }));
    next({ docs });
    return () => {};
  },
}));

import { AdminGrowthDashboard } from "@/components/admin-growth-dashboard";

function visitorsStat() {
  return screen.getByRole("link", { name: /people who visited/i });
}

describe("AdminGrowthDashboard daily counts", () => {
  beforeEach(() => {
    h.ranges.length = 0;
    vi.useFakeTimers({ toFake: ["Date", "setInterval", "clearInterval"] });
    vi.setSystemTime(new Date("2026-11-23T15:00:00.000Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("only counts today, from UK midnight", () => {
    render(<AdminGrowthDashboard />);
    expect(h.ranges.at(-1)).toEqual({ start: "2026-11-23T00:00:00.000Z", end: "2026-11-24T00:00:00.000Z" });
    const stat = visitorsStat();
    expect(within(stat).getByText("People who visited today")).toBeInTheDocument();
    expect(within(stat).getByText("2")).toBeInTheDocument();
    expect(within(stat).getByText(/3 page views/)).toBeInTheDocument();
    expect(stat).toHaveAttribute("href", "/admin/growth/sessions");
    expect(screen.getByText("Live")).toBeInTheDocument();
  });

  it("shows where each visitor came from in the latest interactions", () => {
    render(<AdminGrowthDashboard />);
    const latest = screen.getByRole("heading", { name: "Latest interactions" }).closest("section")!;
    expect(within(latest).getAllByText("From: Facebook (m.facebook.com)")).toHaveLength(2);
    expect(within(latest).getByText("From: Google (google.com)")).toBeInTheDocument();
  });

  it("looks back a day with the arrows, then returns to today", () => {
    render(<AdminGrowthDashboard />);
    expect(screen.getByRole("button", { name: "Next day" })).toBeDisabled();

    fireEvent.click(screen.getByRole("button", { name: "Previous day" }));
    expect(h.ranges.at(-1)).toEqual({ start: "2026-11-22T00:00:00.000Z", end: "2026-11-23T00:00:00.000Z" });
    const stat = visitorsStat();
    expect(within(stat).getByText("People who visited yesterday")).toBeInTheDocument();
    expect(within(stat).getByText("1")).toBeInTheDocument();
    expect(stat).toHaveAttribute("href", "/admin/growth/sessions?day=2026-11-22");
    expect(screen.queryByText("Live")).not.toBeInTheDocument();
    const latest = screen.getByRole("heading", { name: "Latest interactions" }).closest("section")!;
    expect(within(latest).getByText("From: Direct or unknown")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Back to today" }));
    expect(within(visitorsStat()).getByText("People who visited today")).toBeInTheDocument();
    expect(within(visitorsStat()).getByText("2")).toBeInTheDocument();
  });

  it("jumps to a date typed in the date box", () => {
    render(<AdminGrowthDashboard />);
    fireEvent.change(screen.getByLabelText("Pick a day"), { target: { value: "2026-11-20" } });
    expect(h.ranges.at(-1)).toEqual({ start: "2026-11-20T00:00:00.000Z", end: "2026-11-21T00:00:00.000Z" });
    expect(within(visitorsStat()).getByText("People who visited on Fri 20 Nov 2026")).toBeInTheDocument();
    expect(within(visitorsStat()).getByText("0")).toBeInTheDocument();
  });

  it("starts again from 0 when the date changes at midnight", () => {
    vi.setSystemTime(new Date("2026-11-23T23:59:50.000Z"));
    render(<AdminGrowthDashboard />);
    expect(within(visitorsStat()).getByText("2")).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(30_000);
    });
    expect(h.ranges.at(-1)).toEqual({ start: "2026-11-24T00:00:00.000Z", end: "2026-11-25T00:00:00.000Z" });
    expect(within(visitorsStat()).getByText("People who visited today")).toBeInTheDocument();
    expect(within(visitorsStat()).getByText("0")).toBeInTheDocument();
  });
});
