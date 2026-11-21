import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/firebase", () => ({ db: {} }));
vi.mock("@/components/toast-provider", () => ({ useToast: () => ({ show: vi.fn() }) }));

const docs = [
  {
    id: "r1",
    data: {
      name: "John Smith",
      email: "",
      phone: "07518 953611",
      postcode: "G72 8FE",
      covered: true,
      visitTimes: ["weekday-evening"],
      service: "Home visit: call back request",
      message: "Struggling to walk far",
      kind: "visit-request",
      channel: "fb-cambuslang",
      status: "new",
    },
  },
  { id: "c1", data: { name: "Ann", email: "ann@example.com", phone: "", service: "General", message: "A question about prices please", status: "new" } },
];

vi.mock("firebase/firestore", () => ({
  collection: vi.fn(),
  doc: vi.fn(),
  limit: vi.fn(),
  orderBy: vi.fn(),
  query: vi.fn(),
  updateDoc: vi.fn(),
  onSnapshot: (_q: unknown, next: (snapshot: unknown) => void) => {
    next({ docs: docs.map((d) => ({ id: d.id, data: () => d.data })) });
    return () => {};
  },
}));

import { AdminEnquiriesTable, addPatientHref } from "@/components/admin-enquiries-table";

describe("AdminEnquiriesTable call-back requests", () => {
  it("shows a tap-to-call number, the postcode, the times and an Add as patient shortcut", () => {
    render(<AdminEnquiriesTable />);
    const row = screen.getByText("John Smith").closest("tr")!;
    expect(within(row).getByRole("link", { name: "07518 953611" })).toHaveAttribute("href", "tel:+447518953611");
    expect(within(row).getByText(/G72 8FE \(in area\) · Suits: Weekday evening/)).toBeInTheDocument();
    expect(within(row).getByText(/From Facebook · Cambuslang/)).toBeInTheDocument();
    expect(within(row).getByRole("link", { name: "Add as patient" })).toHaveAttribute(
      "href",
      addPatientHref({ name: "John Smith", phone: "07518 953611" }),
    );
  });

  it("leaves contact-form messages as they were, with no Add as patient button", () => {
    render(<AdminEnquiriesTable />);
    const row = screen.getByText("Ann").closest("tr")!;
    expect(within(row).getByText("ann@example.com")).toBeInTheDocument();
    expect(within(row).queryByRole("link", { name: "Add as patient" })).toBeNull();
  });

  it("builds the pre-filled Add patient link", () => {
    expect(addPatientHref({ name: "John Smith", phone: "07518 953611" })).toBe(
      "/admin/patients?add=1&name=John+Smith&phone=07518+953611",
    );
  });
});
