import { act, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/firebase", () => ({ db: {} }));

type Constraint = { field?: string; op?: string; value?: string };

const h = vi.hoisted(() => {
  const events = [
    // Today (23 Nov): three people (two in the UK, one abroad), three page views.
    { id: "1", event: "page_view", path: "/pricing", sessionId: "s1", channel: "facebook", referrerHost: "m.facebook.com", countryName: "United Kingdom", countryCode: "GB", city: "Glasgow", region: "Scotland", postalDistrict: "G31", createdAtIso: "2026-11-23T10:01:00.000Z" },
    { id: "2", event: "page_view", path: "/", sessionId: "s1", channel: "facebook", referrerHost: "m.facebook.com", countryName: "United Kingdom", countryCode: "GB", city: "Glasgow", region: "Scotland", postalDistrict: "G31", createdAtIso: "2026-11-23T10:00:00.000Z" },
    // A third person today, from abroad.
    { id: "5", event: "library_view", path: "/exercises/wall-slide", sessionId: "s4", channel: "direct", referrerHost: "", countryName: "Türkiye", countryCode: "TR", city: "Istanbul", region: "Istanbul", createdAtIso: "2026-11-23T09:00:00.000Z" },
    { id: "3", event: "page_view", path: "/", sessionId: "s2", channel: "google", referrerHost: "www.google.com", countryName: "United Kingdom", countryCode: "GB", city: "Glasgow", region: "Scotland", postalDistrict: "G72", createdAtIso: "2026-11-23T00:05:00.000Z" },
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
    expect(within(stat).getByText("3")).toBeInTheDocument();
    expect(within(stat).getByText(/3 page views/)).toBeInTheDocument();
    expect(stat).toHaveAttribute("href", "/admin/growth/sessions");
    expect(screen.getByText("Live")).toBeInTheDocument();
  });

  it("counts different countries, not visitors", () => {
    render(<AdminGrowthDashboard />);
    const card = screen.getByRole("link", { name: /countries visitors came from/i });
    expect(within(card).getByText("2")).toBeInTheDocument();
    expect(within(card).getByText("Most from United Kingdom")).toBeInTheDocument();
    expect(card).toHaveAttribute("href", "/admin/growth/countries");
  });

  it("ranks UK towns by visitors, with the postcode areas seen", () => {
    render(<AdminGrowthDashboard />);
    const card = screen.getByRole("heading", { name: "UK towns and areas" }).closest("section")!;
    const glasgow = within(card).getByText("Glasgow, Scotland").closest("li")!;
    expect(within(glasgow).getByText("2")).toBeInTheDocument();
    expect(within(glasgow).getByText("Postcode areas: G31, G72")).toBeInTheDocument();
    expect(within(card).queryByText(/Istanbul/)).not.toBeInTheDocument();
    expect(within(card).getByRole("link", { name: /view records/i })).toHaveAttribute("href", "/admin/growth/areas");
  });

  it("shows each visitor's approximate town in the latest interactions", () => {
    render(<AdminGrowthDashboard />);
    const latest = screen.getByRole("heading", { name: "Latest interactions" }).closest("section")!;
    expect(within(latest).getAllByText(/Glasgow \(G31\), Scotland/)).toHaveLength(2);
    expect(within(latest).getByText(/Istanbul, Türkiye/)).toBeInTheDocument();
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
    expect(within(visitorsStat()).getByText("3")).toBeInTheDocument();
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
    expect(within(visitorsStat()).getByText("3")).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(30_000);
    });
    expect(h.ranges.at(-1)).toEqual({ start: "2026-11-24T00:00:00.000Z", end: "2026-11-25T00:00:00.000Z" });
    expect(within(visitorsStat()).getByText("People who visited today")).toBeInTheDocument();
    expect(within(visitorsStat()).getByText("0")).toBeInTheDocument();
  });
});
