import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const trackGrowthEvent = vi.fn();
vi.mock("@/lib/growth-tracking", () => ({ trackGrowthEvent: (...a: unknown[]) => trackGrowthEvent(...a) }));
vi.mock("@/lib/assessment-forms", async () => {
  const actual = await vi.importActual<typeof import("@/lib/assessment-forms")>("@/lib/assessment-forms");
  return { ...actual, getPatientAssessmentForms: vi.fn(async () => []), submitPatientAssessmentForm: vi.fn() };
});

import { AssessmentWizard } from "@/components/assessment-wizard";
import { contactTopic } from "@/lib/practice-contact";

function renderWizard(topic?: "home-visit" | "general") {
  render(
    <AssessmentWizard
      uid="u1"
      personId="self"
      displayName="Jane Doe"
      personName="Jane Doe"
      bookingId=""
      onSubmitted={vi.fn()}
      redirectingToPayment
      visitType="home"
      contactTopic={topic}
    />,
  );
}

describe("'Rather talk first?' on the pre-payment questionnaire", () => {
  beforeEach(() => {
    trackGrowthEvent.mockReset();
    localStorage.clear();
  });

  it("offers WhatsApp and email with the home-visit message when the booking flow asks for it", async () => {
    renderWizard("home-visit");
    await screen.findByRole("heading", { name: /help us prepare for jane doe/i });

    expect(screen.getByText(/rather talk to shivaliba first/i)).toBeInTheDocument();
    const whatsapp = screen.getByRole("link", { name: /whatsapp us/i });
    expect(new URL(whatsapp.getAttribute("href")!).searchParams.get("text")).toBe(contactTopic("home-visit").whatsapp);
    expect(screen.getByRole("link", { name: /email us/i }).getAttribute("href")).toMatch(/^mailto:/);
  });

  it("records the tap as coming from the questionnaire", async () => {
    renderWizard("home-visit");
    await screen.findByRole("heading", { name: /help us prepare for jane doe/i });
    fireEvent.click(screen.getByRole("link", { name: /email us/i }));
    expect(trackGrowthEvent).toHaveBeenCalledWith("email_click", { source: "booking_assessment", topic: "home-visit" });
  });

  it("stays out of the questionnaire everywhere else (e.g. the patient portal)", async () => {
    renderWizard(undefined);
    await screen.findByRole("heading", { name: /help us prepare for jane doe/i });
    expect(screen.queryByRole("link", { name: /whatsapp us/i })).toBeNull();
  });
});
