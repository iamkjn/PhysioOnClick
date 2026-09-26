import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const submitMock = vi.fn();
const getFormsMock = vi.fn();

vi.mock("@/lib/assessment-forms", async () => {
  const actual = await vi.importActual<typeof import("@/lib/assessment-forms")>("@/lib/assessment-forms");
  return {
    ...actual,
    getPatientAssessmentForms: (...args: unknown[]) => getFormsMock(...args),
    submitPatientAssessmentForm: (...args: unknown[]) => submitMock(...args),
  };
});

import { AssessmentWizard } from "@/components/assessment-wizard";

function renderWizard(focusAreas: Array<"Back & neck" | "Shoulder"> = []) {
  const onSubmitted = vi.fn();
  render(
    <AssessmentWizard
      uid="u1"
      personId="self"
      displayName="Jane Doe"
      personName="Jane Doe"
      bookingId="bk1"
      focusAreas={focusAreas}
      onSubmitted={onSubmitted}
    />,
  );
  return { onSubmitted };
}

async function waitForWizard() {
  await screen.findByRole("heading", { name: /help us prepare for jane doe/i });
}

function fillConcern() {
  fireEvent.click(screen.getByRole("button", { name: /^neck$/i }));
  fireEvent.change(screen.getByLabelText(/what.s going on/i), {
    target: { value: "Aching along the right side of my neck for a while now." },
  });
  fireEvent.click(screen.getByRole("button", { name: /a few weeks/i }));
  fireEvent.change(screen.getByLabelText(/what is it stopping you doing/i), {
    target: { value: "I cannot turn my head to reverse the car." },
  });
}

function fillHealth() {
  fireEvent.change(screen.getByLabelText(/^name$/i), { target: { value: "John Doe" } });
  fireEvent.change(screen.getByLabelText(/uk phone number/i), { target: { value: "07123456789" } });
}

async function completeHappyPath() {
  await waitForWizard();
  fillConcern();
  fireEvent.click(screen.getByRole("button", { name: /continue to health details/i }));
  fillHealth();
  fireEvent.click(screen.getByRole("button", { name: /continue to safety check/i }));
  fireEvent.click(screen.getByRole("checkbox", { name: /none of these apply/i }));
  fireEvent.click(screen.getByRole("button", { name: /review my answers/i }));
  screen.getAllByRole("checkbox").forEach((checkbox) => fireEvent.click(checkbox));
}

describe("AssessmentWizard", () => {
  beforeEach(() => {
    submitMock.mockReset();
    submitMock.mockResolvedValue("form_1");
    getFormsMock.mockReset();
    getFormsMock.mockResolvedValue([]);
    localStorage.clear();
  });

  it("carries the selected booking focus into the assessment", async () => {
    renderWizard(["Back & neck", "Shoulder"]);
    await waitForWizard();
    expect(screen.getByText(/already added from your booking/i)).toBeInTheDocument();
    expect(screen.getByText("Back & neck, Shoulder")).toBeInTheDocument();
  });

  it("keeps the first stage blocked until the concern is complete", async () => {
    renderWizard();
    await waitForWizard();
    const continueButton = screen.getByRole("button", { name: /continue to health details/i });
    expect(continueButton).toBeDisabled();
    fillConcern();
    expect(continueButton).toBeEnabled();
  });

  it("keeps every assessment section directly accessible", async () => {
    renderWizard();
    await waitForWizard();

    const sectionButtons = [
      screen.getByRole("button", { name: /your concern.*needs attention/i }),
      screen.getByRole("button", { name: /health details.*needs attention/i }),
      screen.getByRole("button", { name: /safety check.*needs attention/i }),
      screen.getByRole("button", { name: /review.*needs attention/i }),
    ];
    sectionButtons.forEach((button) => expect(button).toBeEnabled());

    fireEvent.click(sectionButtons[3]);
    expect(screen.getByRole("heading", { name: /review and confirm/i })).toBeInTheDocument();
    expect(screen.getByText(/some sections still need attention/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /health details.*needs attention/i }));
    expect(screen.getByRole("heading", { name: /^health details$/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/^name$/i)).toBeEnabled();
  });

  it("does not show the old typed confirmation field", async () => {
    localStorage.setItem("poc-assessment-draft-bk1", JSON.stringify({ signature: "Jane Doe" }));
    renderWizard();
    await waitForWizard();
    fireEvent.click(screen.getByRole("button", { name: /review.*needs attention/i }));

    expect(screen.queryByLabelText(/type confirm to submit/i)).not.toBeInTheDocument();
  });

  it("prefills editable concern text from the booking focus and selected body area", async () => {
    renderWizard(["Shoulder"]);
    await waitForWizard();

    await waitFor(() => {
      expect(screen.getByLabelText(/what.s going on/i)).toHaveValue();
    });
    expect(screen.getByLabelText<HTMLInputElement | HTMLTextAreaElement>(/what.s going on/i).value).toMatch(
      /shoulder|rotator cuff|tendon/i,
    );
    expect(screen.getByLabelText<HTMLInputElement | HTMLTextAreaElement>(/what is it stopping you doing/i).value).toMatch(
      /reaching overhead|lifting/i,
    );

    fireEvent.click(screen.getByRole("button", { name: /^neck$/i }));
    await waitFor(() => {
      expect(screen.getByLabelText<HTMLInputElement | HTMLTextAreaElement>(/what.s going on/i).value).toMatch(
        /neck|posture|nerve/i,
      );
    });
    expect(screen.getByText(/suggested from your selected area/i)).toBeInTheDocument();
  });

  it("reuses stable details from the latest assessment", async () => {
    getFormsMock.mockResolvedValue([
      {
        medicalHistory: "Blood pressure medication",
        emergencyContactName: "John Doe",
        emergencyContactPhone: "07123456789",
      },
    ]);
    renderWizard();
    await waitForWizard();
    fillConcern();
    fireEvent.click(screen.getByRole("button", { name: /continue to health details/i }));
    expect(screen.getByText(/saved you some typing/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/relevant health information/i)).toHaveValue("Blood pressure medication");
    expect(screen.getByLabelText(/^name$/i)).toHaveValue("John Doe");
    expect(screen.getByLabelText(/uk phone number/i)).toHaveValue("07123456789");
  });

  it("requires an emergency contact before the safety check", async () => {
    renderWizard();
    await waitForWizard();
    fillConcern();
    fireEvent.click(screen.getByRole("button", { name: /continue to health details/i }));
    const continueButton = screen.getByRole("button", { name: /continue to safety check/i });
    expect(continueButton).toBeDisabled();
    fillHealth();
    expect(continueButton).toBeEnabled();
  });

  it("keeps the combined safety step blocked until it is resolved", async () => {
    renderWizard();
    await waitForWizard();
    fillConcern();
    fireEvent.click(screen.getByRole("button", { name: /continue to health details/i }));
    fillHealth();
    fireEvent.click(screen.getByRole("button", { name: /continue to safety check/i }));
    const reviewButton = screen.getByRole("button", { name: /review my answers/i });
    expect(reviewButton).toBeDisabled();
    fireEvent.click(screen.getByRole("checkbox", { name: /none of these apply/i }));
    expect(reviewButton).toBeEnabled();
  });

  it("submits the derived answers after review and consent", async () => {
    const { onSubmitted } = renderWizard();
    await completeHappyPath();
    fireEvent.click(screen.getByRole("button", { name: /submit assessment/i }));

    await waitFor(() => expect(submitMock).toHaveBeenCalledTimes(1));
    const [, , input] = submitMock.mock.calls[0];
    expect(input.bodyRegions).toEqual(["neck"]);
    expect(input.bodyArea).toMatch(/neck/i);
    expect(input.subjective.clinicalArea).toBe("spine");
    expect(input.onsetPattern).toBe("gradual");
    expect(input.emergencyContactName).toBe("John Doe");
    expect(input.signature).toBe("CONFIRM");
    expect(input.consent.careConsent).toBe(true);

    await waitFor(() => expect(onSubmitted).toHaveBeenCalledWith("form_1"));
    expect(screen.getByText(/your physiotherapist will review/i)).toBeInTheDocument();
  });

  it("shows urgent guidance but still allows review and submission", async () => {
    renderWizard();
    await waitForWizard();
    fillConcern();
    fireEvent.click(screen.getByRole("button", { name: /continue to health details/i }));
    fillHealth();
    fireEvent.click(screen.getByRole("button", { name: /continue to safety check/i }));
    fireEvent.click(screen.getByRole("checkbox", { name: /chest pain/i }));
    expect(screen.getByRole("alert")).toHaveTextContent(/NHS 111/);
    fireEvent.click(screen.getByRole("button", { name: /review my answers/i }));
    screen.getAllByRole("checkbox").forEach((checkbox) => fireEvent.click(checkbox));
    fireEvent.click(screen.getByRole("button", { name: /submit assessment/i }));
    await waitFor(() => expect(submitMock).toHaveBeenCalledTimes(1));
    const [, , input] = submitMock.mock.calls[0];
    expect(input.redFlags.chestPainBreathlessness).toBe(true);
  });

  it("requires every section before submission", async () => {
    renderWizard();
    await waitForWizard();
    fireEvent.click(screen.getByRole("button", { name: /review.*needs attention/i }));
    screen.getAllByRole("checkbox").forEach((checkbox) => fireEvent.click(checkbox));

    expect(screen.getByRole("button", { name: /submit assessment/i })).toBeDisabled();
    expect(screen.getByText(/complete your concern, health details, safety check/i)).toBeInTheDocument();
  });

  it("keeps submission disabled when a completed answer is changed", async () => {
    renderWizard();
    await completeHappyPath();
    expect(screen.getByRole("button", { name: /submit assessment/i })).toBeEnabled();

    fireEvent.click(screen.getByRole("button", { name: /edit your concern/i }));
    fireEvent.change(screen.getByLabelText(/what is it stopping you doing/i), { target: { value: "" } });
    fireEvent.click(screen.getByRole("button", { name: /review\./i }));

    expect(screen.getByRole("button", { name: /submit assessment/i })).toBeDisabled();
  });
});
