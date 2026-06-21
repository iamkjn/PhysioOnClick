import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/firebase", () => ({
  auth: null,
  db: null,
  storage: null,
}));

const saveEnquiryMock = vi.fn();

vi.mock("@/lib/firestore-helpers", () => ({
  saveEnquiry: (...args: unknown[]) => saveEnquiryMock(...args),
}));

vi.mock("@/lib/patient-account", () => ({
  ensurePatientRecord: vi.fn(),
  mergePatientProfileDetails: vi.fn(),
}));

import { ContactForm } from "@/components/contact-form";

async function fillValidForm() {
  const user = userEvent.setup();

  await user.type(screen.getByPlaceholderText("Your name"), "Test Patient");
  await user.type(screen.getByPlaceholderText("your@email.com"), "patient@example.com");
  await user.type(screen.getByPlaceholderText("07xxx xxxxxx"), "07721904401");
  await user.selectOptions(screen.getByDisplayValue("Select service"), "Follow-Up Session");
  await user.type(
    screen.getByPlaceholderText("Tell us about your condition or question..."),
    "This is a valid enquiry message with enough detail.",
  );

  return user;
}

describe("ContactForm", () => {
  beforeEach(() => {
    saveEnquiryMock.mockReset();
    global.fetch = vi.fn();
  });

  it("shows email success when the API sends the notification", async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
      new Response(JSON.stringify({ ok: true, saved: true, emailSent: true }), { status: 200 }),
    );

    const user = userEvent.setup();
    render(<ContactForm />);
    await fillValidForm();

    await user.click(screen.getByRole("button", { name: /send enquiry/i }));

    await waitFor(() => {
      expect(screen.getByText(/notification has also been emailed/i)).toBeInTheDocument();
    });
    expect(screen.queryByText(/we could not save your enquiry/i)).not.toBeInTheDocument();
  });

  it("keeps email success even if optional client save fallback fails", async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
      new Response(JSON.stringify({ ok: true, saved: false, emailSent: true }), { status: 200 }),
    );
    saveEnquiryMock.mockRejectedValueOnce(new Error("Client Firestore unavailable"));

    const user = userEvent.setup();
    render(<ContactForm />);
    await fillValidForm();

    await user.click(screen.getByRole("button", { name: /send enquiry/i }));

    await waitFor(() => {
      expect(screen.getByText(/notification has also been emailed/i)).toBeInTheDocument();
    });
    expect(screen.queryByText(/we could not save your enquiry/i)).not.toBeInTheDocument();
  });
});
