import { render, screen, within } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";

vi.mock("@/lib/firebase", () => ({ db: {} }));

const events = [
  { id: "1", event: "page_view", path: "/", device: "mobile", createdAtIso: "2026-10-03T12:30:00.000Z" },
  { id: "2", event: "page_view", path: "/book", device: "desktop", createdAtIso: "2026-10-03T12:29:00.000Z" },
  { id: "3", event: "page_view", path: "/", device: "desktop", createdAtIso: "2026-10-03T12:28:00.000Z" },
];

vi.mock("firebase/firestore", () => ({
  collection: vi.fn(),
  limit: vi.fn(),
  orderBy: vi.fn(),
  query: vi.fn(),
  onSnapshot: (_q: unknown, next: (snapshot: unknown) => void) => {
    next({ docs: events.map(({ id, ...data }) => ({ id, data: () => data })) });
    return () => {};
  },
}));

import { AdminGrowthDashboard } from "@/components/admin-growth-dashboard";

describe("AdminGrowthDashboard page labels", () => {
  it("titles page views by page name instead of a generic 'Page view'", () => {
    render(<AdminGrowthDashboard />);
    const latest = screen.getByRole("heading", { name: "Latest interactions" }).closest("section")!;
    expect(within(latest).getAllByText("Home page viewed")).toHaveLength(2);
    expect(within(latest).getByText("Booking page viewed")).toBeInTheDocument();
    expect(within(latest).queryByText(/^Page view$/)).not.toBeInTheDocument();
  });

  it("names top pages readably while still showing the path", () => {
    render(<AdminGrowthDashboard />);
    const top = screen.getByRole("heading", { name: "Top pages" }).closest("section")!;
    expect(within(top).getByText("Home")).toBeInTheDocument();
    expect(within(top).getByText("Booking")).toBeInTheDocument();
    expect(within(top).getByText("/book")).toBeInTheDocument();
  });
});
