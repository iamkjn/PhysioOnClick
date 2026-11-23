import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/firebase", () => ({ db: {} }));

const FB_UA = "Mozilla/5.0 (iPhone) Mobile/15E148 [FBAN/FBIOS;FBAV/530.0]";
const events = [
  { id: "1", event: "page_view", path: "/", sessionId: "s1", channel: "facebook", createdAtIso: "2026-11-22T10:00:00.000Z" },
  { id: "2", event: "page_view", path: "/pricing", sessionId: "s1", channel: "facebook", createdAtIso: "2026-11-22T10:01:00.000Z" },
  { id: "3", event: "page_view", path: "/", sessionId: "s2", channel: "google", createdAtIso: "2026-11-22T09:00:00.000Z" },
  // An event from before sources were recorded: recognised by its in-app browser.
  { id: "4", event: "page_view", path: "/", sessionId: "s3", userAgent: FB_UA, createdAtIso: "2026-11-21T00:10:00.000Z" },
];

vi.mock("firebase/firestore", () => ({
  collection: vi.fn(),
  limit: vi.fn(),
  orderBy: vi.fn(),
  query: vi.fn(),
  where: vi.fn(),
  onSnapshot: (_q: unknown, next: (snapshot: unknown) => void) => {
    next({ docs: events.map(({ id, ...data }) => ({ id, data: () => data })) });
    return () => {};
  },
}));

import { AdminGrowthDashboard } from "@/components/admin-growth-dashboard";

describe("AdminGrowthDashboard visitor sources", () => {
  it("counts visitors per source, including older Facebook-app visits", () => {
    render(<AdminGrowthDashboard />);
    const card = screen.getByRole("heading", { name: "Where visitors came from" }).closest("section")!;
    const facebook = within(card).getByText("Facebook").closest("li")!;
    expect(within(facebook).getByText("2")).toBeInTheDocument();
    const google = within(card).getByText("Google").closest("li")!;
    expect(within(google).getByText("1")).toBeInTheDocument();
    expect(within(card).getByRole("link", { name: /view|open|see|all/i })).toHaveAttribute("href", "/admin/growth/sources");
  });
});
