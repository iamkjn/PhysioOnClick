import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/firebase", () => ({ db: {} }));

const events = [
  { id: "1", event: "whatsapp_click", path: "/physiotherapy-home-visits-glasgow", sessionId: "s1", params: { source: "contact_bar", topic: "home-visit" }, createdAtIso: "2026-11-21T10:00:00.000Z" },
  { id: "2", event: "email_click", path: "/contact", sessionId: "s2", params: { source: "contact_page", topic: "general" }, createdAtIso: "2026-11-21T09:00:00.000Z" },
  { id: "3", event: "page_view", path: "/", sessionId: "s3", createdAtIso: "2026-11-21T08:00:00.000Z" },
  { id: "4", event: "call_click", path: "/request-visit", sessionId: "s4", params: { source: "request_visit_steps" }, createdAtIso: "2026-11-21T07:00:00.000Z" },
  { id: "5", event: "visit_request_started", path: "/request-visit", sessionId: "s4", params: { source: "request_visit_page", step: "name" }, createdAtIso: "2026-11-21T06:00:00.000Z" },
  { id: "6", event: "visit_request_error", path: "/request-visit", sessionId: "s4", params: { source: "request_visit_page", fields: "phone:invalid" }, createdAtIso: "2026-11-21T05:00:00.000Z" },
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

describe("AdminGrowthDashboard contact taps", () => {
  it("counts phone, WhatsApp and email taps in their own card", () => {
    render(<AdminGrowthDashboard />);
    const card = screen.getByRole("link", { name: /call, whatsapp & email taps/i });
    expect(card).toHaveAttribute("href", "/admin/growth/contact-taps");
    expect(within(card).getByText("3")).toBeInTheDocument();
  });

  it("shows how many people started the call-back form without sending it", () => {
    render(<AdminGrowthDashboard />);
    const card = screen.getByRole("link", { name: /call-back requests/i });
    expect(card).toHaveAttribute("href", "/admin/growth/visit-requests");
    expect(within(card).getByText("0")).toBeInTheDocument();
    expect(within(card).getByText(/1 started the form/i)).toBeInTheDocument();
  });

  it("names the taps and form steps readably in the latest interactions", () => {
    render(<AdminGrowthDashboard />);
    const latest = screen.getByRole("heading", { name: "Latest interactions" }).closest("section")!;
    expect(within(latest).getByText("WhatsApp tapped")).toBeInTheDocument();
    expect(within(latest).getByText("Email tapped")).toBeInTheDocument();
    expect(within(latest).getByText("Phone number tapped")).toBeInTheDocument();
    expect(within(latest).getByText("Started the call-back form")).toBeInTheDocument();
    expect(within(latest).getByText("Call-back form stopped: phone number not accepted")).toBeInTheDocument();
  });
});
