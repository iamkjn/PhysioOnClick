import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/firebase", () => ({ db: {} }));

const events = [
  { id: "1", event: "whatsapp_click", path: "/physiotherapy-home-visits-glasgow", sessionId: "s1", params: { source: "contact_bar", topic: "home-visit" }, createdAtIso: "2026-11-21T10:00:00.000Z" },
  { id: "2", event: "email_click", path: "/contact", sessionId: "s2", params: { source: "contact_page", topic: "general" }, createdAtIso: "2026-11-21T09:00:00.000Z" },
  { id: "3", event: "page_view", path: "/", sessionId: "s3", createdAtIso: "2026-11-21T08:00:00.000Z" },
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

describe("AdminGrowthDashboard contact taps", () => {
  it("counts WhatsApp and email taps in their own card", () => {
    render(<AdminGrowthDashboard />);
    const card = screen.getByRole("link", { name: /whatsapp & email taps/i });
    expect(card).toHaveAttribute("href", "/admin/growth/contact-taps");
    expect(within(card).getByText("2")).toBeInTheDocument();
  });

  it("names the taps readably in the latest interactions", () => {
    render(<AdminGrowthDashboard />);
    const latest = screen.getByRole("heading", { name: "Latest interactions" }).closest("section")!;
    expect(within(latest).getByText("WhatsApp tapped")).toBeInTheDocument();
    expect(within(latest).getByText("Email tapped")).toBeInTheDocument();
  });
});
