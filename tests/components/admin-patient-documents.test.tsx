import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/firebase", () => ({
  auth: { currentUser: { getIdToken: () => Promise.resolve("admin-token") } },
  db: null,
}));
const showToast = vi.fn();
vi.mock("@/components/toast-provider", () => ({ useToast: () => ({ show: showToast }) }));

import { AdminPatientDocuments } from "@/components/admin-patient-documents";

const UID = "patientUid123";
const listing = {
  history: [
    {
      id: "e1",
      personId: UID,
      type: "discharge-letter",
      title: "Immediate Discharge Letter",
      documentDate: "2026-11-03",
      source: "University Hospital Crosshouse",
      summary: "Bilateral proximal humerus fractures.",
      pastMedicalHistory: "T2DM.",
      physioFlags: "On apixaban for 90 days.",
      storagePath: `clinical-history/${UID}/letter.webp`,
      contentType: "image/webp",
      size: 1000,
    },
  ],
  uploads: [
    { name: "Plan.pdf", storagePath: `patient-uploads/${UID}/1794766060138-Plan.pdf`, size: 2048, contentType: "application/pdf", updated: "2026-11-15T10:00:00Z" },
  ],
};

let fetchMock: ReturnType<typeof vi.fn>;
beforeEach(() => {
  fetchMock = vi.fn(async () => new Response(JSON.stringify(listing), { status: 200 }));
  vi.stubGlobal("fetch", fetchMock);
});
afterEach(() => {
  vi.unstubAllGlobals();
  showToast.mockReset();
});

describe("AdminPatientDocuments", () => {
  it("loads with the admin token and shows the private history with its physio flags", async () => {
    render(<AdminPatientDocuments patientUid={UID} personId={UID} />);
    expect(await screen.findByText("Immediate Discharge Letter")).toBeTruthy();
    expect(screen.getByText(/Private · admins only/)).toBeTruthy();
    expect(screen.getByText(/On apixaban for 90 days/)).toBeTruthy();
    expect(screen.getByText(/Discharge letter · 3 Nov 2026 · University Hospital Crosshouse/)).toBeTruthy();

    const [url, init] = fetchMock.mock.calls[0];
    expect(String(url)).toBe(`/api/admin/patient-documents?uid=${UID}&person=${UID}`);
    expect((init as RequestInit).headers).toEqual({ Authorization: "Bearer admin-token" });
  });

  it("lists files on the account holder's own account", async () => {
    render(<AdminPatientDocuments patientUid={UID} personId={UID} />);
    expect(await screen.findByText("Plan.pdf")).toBeTruthy();
    expect(screen.getByText(/The patient can see these/)).toBeTruthy();
  });

  it("hides the account-uploads list on a dependent's view", async () => {
    fetchMock.mockImplementation(async () => new Response(JSON.stringify({ history: [], uploads: [] }), { status: 200 }));
    render(<AdminPatientDocuments patientUid={UID} personId="dependent99" />);
    expect(await screen.findByText("No history documents yet.")).toBeTruthy();
    expect(screen.queryByText("Files on their account")).toBeNull();
  });

  it("shows a retry when the listing fails", async () => {
    fetchMock.mockImplementation(async () => new Response("{}", { status: 500 }));
    render(<AdminPatientDocuments patientUid={UID} personId={UID} />);
    expect(await screen.findByText(/Could not load documents/)).toBeTruthy();
    expect(screen.getByRole("button", { name: "Retry" })).toBeTruthy();
  });

  it("opens the add-document form", async () => {
    render(<AdminPatientDocuments patientUid={UID} personId={UID} />);
    await screen.findByText("Immediate Discharge Letter");
    fireEvent.click(screen.getByRole("button", { name: "Add document" }));
    await waitFor(() => expect(screen.getByRole("button", { name: "Save to private history" })).toBeTruthy());
    expect(screen.getByLabelText(/Physio flags/)).toBeTruthy();
  });
});
