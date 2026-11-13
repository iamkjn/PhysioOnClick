import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const getIdToken = vi.fn();
const authMock: { currentUser: { getIdToken: typeof getIdToken } | null } = {
  currentUser: { getIdToken },
};
vi.mock("@/lib/firebase", () => ({
  get auth() {
    return authMock;
  },
  db: null,
  storage: null,
}));

const showToast = vi.fn();
vi.mock("@/components/toast-provider", () => ({ useToast: () => ({ show: showToast }) }));

import { AdminPrintPlanButton } from "@/components/admin-print-plan-button";

// jsdom's Blob can't back a real Response body, so stand in for one.
function pdfResponse() {
  return { ok: true, status: 200, blob: async () => new Blob(["%PDF-1.7"], { type: "application/pdf" }) };
}

type FakeTab = { location: { href: string }; close: ReturnType<typeof vi.fn> };

describe("AdminPrintPlanButton", () => {
  let fakeTab: FakeTab;
  let openSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    getIdToken.mockReset().mockResolvedValue("admin-token");
    authMock.currentUser = { getIdToken };
    showToast.mockReset();
    fakeTab = { location: { href: "" }, close: vi.fn() };
    openSpy = vi.spyOn(window, "open").mockReturnValue(fakeTab as unknown as Window);
    URL.createObjectURL = vi.fn(() => "blob:plan-pdf");
    URL.revokeObjectURL = vi.fn();
    global.fetch = vi.fn();
  });

  afterEach(() => {
    openSpy.mockRestore();
  });

  it("renders nothing without a summary id", () => {
    const { container } = render(<AdminPrintPlanButton summaryId={null} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("opens the stored plan PDF in a new tab, authorised as the admin", async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(pdfResponse());
    render(<AdminPrintPlanButton summaryId="sum-123" />);

    await userEvent.click(screen.getByRole("button", { name: "Print plan" }));

    await waitFor(() => expect(fakeTab.location.href).toBe("blob:plan-pdf"));
    // The tab is opened inside the click, before the fetch, so pop-up
    // blockers treat it as user-initiated.
    expect(openSpy).toHaveBeenCalledWith("", "_blank");
    expect(global.fetch).toHaveBeenCalledWith("/api/exercise-plan/sum-123/pdf", {
      headers: { Authorization: "Bearer admin-token" },
    });
    expect(fakeTab.close).not.toHaveBeenCalled();
    expect(showToast).not.toHaveBeenCalled();
  });

  it("explains how to rebuild the plan when no PDF has been stored yet", async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
      new Response(JSON.stringify({ error: "Not found" }), { status: 404 }),
    );
    render(<AdminPrintPlanButton summaryId="sum-123" />);

    await userEvent.click(screen.getByRole("button", { name: "Print plan" }));

    await waitFor(() => expect(showToast).toHaveBeenCalled());
    expect(showToast).toHaveBeenCalledWith(expect.stringMatching(/isn.t ready yet.*Resend plan email/i), "warning");
    expect(fakeTab.close).toHaveBeenCalled();
  });

  it("closes the tab and shows an error when the download fails", async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(new Response("nope", { status: 500 }));
    render(<AdminPrintPlanButton summaryId="sum-123" />);

    await userEvent.click(screen.getByRole("button", { name: "Print plan" }));

    await waitFor(() => expect(showToast).toHaveBeenCalledWith(expect.stringMatching(/could not open/i), "error"));
    expect(fakeTab.close).toHaveBeenCalled();
  });

  it("downloads the PDF instead when pop-ups are blocked", async () => {
    openSpy.mockReturnValue(null);
    const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(pdfResponse());
    render(<AdminPrintPlanButton summaryId="sum-123" />);

    await userEvent.click(screen.getByRole("button", { name: "Print plan" }));

    await waitFor(() => expect(clickSpy).toHaveBeenCalled());
    expect(showToast).toHaveBeenCalledWith(expect.stringMatching(/downloaded/i), "info");
    clickSpy.mockRestore();
  });

  it("asks the admin to sign in again when there is no signed-in user", async () => {
    authMock.currentUser = null;
    render(<AdminPrintPlanButton summaryId="sum-123" />);

    await userEvent.click(screen.getByRole("button", { name: "Print plan" }));

    expect(showToast).toHaveBeenCalledWith(expect.stringMatching(/sign in again/i), "error");
    expect(global.fetch).not.toHaveBeenCalled();
    expect(openSpy).not.toHaveBeenCalled();
  });
});
