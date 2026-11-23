import { render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

type Constraint = { field?: string; op?: string; value?: string };

const h = vi.hoisted(() => {
  const events = [
    { id: "1", event: "page_view", path: "/pricing", sessionId: "s1", channel: "facebook", referrerHost: "m.facebook.com", createdAtIso: "2026-11-22T10:01:00.000Z" },
    { id: "2", event: "page_view", path: "/", sessionId: "s1", channel: "facebook", referrerHost: "m.facebook.com", createdAtIso: "2026-11-22T10:00:00.000Z" },
    { id: "3", event: "page_view", path: "/", sessionId: "s2", channel: "direct", referrerHost: "", countryCode: "GB", countryName: "United Kingdom", city: "Hamilton", region: "Scotland", postalDistrict: "ML3", createdAtIso: "2026-11-22T09:00:00.000Z" },
    { id: "4", event: "page_view", path: "/", sessionId: "s9", channel: "google", referrerHost: "www.google.com", createdAtIso: "2026-11-23T09:00:00.000Z" },
  ];
  const ranges: Array<{ start: string; end: string }> = [];
  return { events, ranges };
});

vi.mock("@/lib/firebase", () => ({ db: {}, auth: {} }));
vi.mock("firebase/auth", () => ({
  onAuthStateChanged: (_auth: unknown, next: (user: unknown) => void) => {
    next({ uid: "admin" });
    return () => {};
  },
  signOut: vi.fn(),
}));
vi.mock("@/lib/admin-auth", () => ({ isAdminUser: async () => true }));
vi.mock("@/components/admin-shell", () => ({
  AdminShell: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));
vi.mock("firebase/firestore", () => ({
  collection: vi.fn(),
  limit: vi.fn(),
  orderBy: vi.fn(),
  where: (field: string, op: string, value: string) => ({ field, op, value }),
  query: (_collection: unknown, ...constraints: Constraint[]) => constraints,
  getDocs: async (constraints: Constraint[]) => {
    const start = constraints.find((c) => c?.op === ">=")?.value ?? "";
    const end = constraints.find((c) => c?.op === "<")?.value ?? "";
    h.ranges.push({ start, end });
    return {
      docs: h.events
        .filter((e) => e.createdAtIso >= start && e.createdAtIso < end)
        .map(({ id, ...data }) => ({ id, data: () => data })),
    };
  },
}));

import { AdminGrowthMetricGate } from "@/components/admin-growth-metric-gate";

describe("Growth detail pages by day", () => {
  beforeEach(() => {
    h.ranges.length = 0;
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date("2026-11-23T15:00:00.000Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("opens on the day in the link and counts people once each", async () => {
    render(<AdminGrowthMetricGate metric="sessions" day="2026-11-22" />);
    expect(await screen.findByLabelText("2 yesterday")).toBeInTheDocument();
    expect(h.ranges.at(-1)).toEqual({ start: "2026-11-22T00:00:00.000Z", end: "2026-11-23T00:00:00.000Z" });
    expect(screen.getAllByText(/From: Facebook \(m\.facebook\.com\)/)).toHaveLength(2);
    expect(screen.getByText(/From: Direct or unknown/)).toBeInTheDocument();
  });

  it("lists UK towns for the day and counts each town once", async () => {
    render(<AdminGrowthMetricGate metric="areas" day="2026-11-22" />);
    expect(await screen.findByLabelText("1 yesterday")).toBeInTheDocument();
    expect(screen.getByText(/Hamilton \(ML3\), Scotland/)).toBeInTheDocument();
  });

  it("shows today when the link has no day or a bad one", async () => {
    render(<AdminGrowthMetricGate metric="page-views" day="not-a-day" />);
    expect(await screen.findByLabelText("1 today")).toBeInTheDocument();
    await waitFor(() =>
      expect(h.ranges.at(-1)).toEqual({ start: "2026-11-23T00:00:00.000Z", end: "2026-11-24T00:00:00.000Z" }),
    );
    expect(screen.getByText(/From: Google \(google\.com\)/)).toBeInTheDocument();
  });
});
