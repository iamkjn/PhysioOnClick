import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";

const submitMock = vi.fn();

vi.mock("@/lib/assessment-forms", async () => {
  const actual = await vi.importActual<typeof import("@/lib/assessment-forms")>("@/lib/assessment-forms");
  return { ...actual, submitPatientAssessmentForm: (...a: unknown[]) => submitMock(...a) };
});
vi.mock("@/components/person-switcher", () => ({
  PersonSwitcher: () => <div data-testid="person-switcher" />,
}));
vi.mock("@/components/person-provider", () => ({
  usePerson: () => ({ personId: "self", personName: "Jane Doe" }),
}));

import { AssessmentWizard } from "@/components/assessment-wizard";

function renderWizard() {
  const onSubmitted = vi.fn();
  render(
    <AssessmentWizard
      uid="u1"
      personId="self"
      displayName="Jane Doe"
      personName="Jane Doe"
      bookingId="bk1"
      onSubmitted={onSubmitted}
    />
  );
  return { onSubmitted };
}

const next = () => fireEvent.click(screen.getByRole("button", { name: /continue/i }));

async function advanceToBody() {
  next(); // intro -> body
}

/** Walks all the way to a successful submit. */
async function completeHappyPath() {
  next(); // intro -> body
  fireEvent.click(screen.getByRole("button", { name: /^neck$/i }));
  next(); // body -> story
  fireEvent.change(screen.getByLabelText(/what.s going on/i), {
    target: { value: "Aching along the right side of my neck for a while now." },
  });
  fireEvent.click(screen.getByRole("button", { name: /a few weeks/i }));
  next(); // story -> impact
  fireEvent.change(screen.getByLabelText(/stopping you doing/i), {
    target: { value: "Can't turn my head to reverse the car." },
  });
  next(); // impact -> context
  next(); // context -> safety (optional step)
  fireEvent.click(screen.getByRole("button", { name: /none of these/i }));
  next(); // safety -> consent
  screen
    .getAllByRole("checkbox")
    .forEach((cb) => fireEvent.click(cb));
  fireEvent.change(screen.getByLabelText(/type your name/i), { target: { value: "Jane Doe" } });
}

describe("AssessmentWizard", () => {
  beforeEach(() => {
    submitMock.mockReset();
    submitMock.mockResolvedValue("form_1");
    try {
      localStorage.clear();
    } catch {
      /* ignore */
    }
  });

  it("cannot leave the body step without a region", async () => {
    renderWizard();
    await advanceToBody();
    expect(screen.getByRole("button", { name: /continue/i })).toBeDisabled();
    fireEvent.click(screen.getByRole("button", { name: /^neck$/i }));
    expect(screen.getByRole("button", { name: /continue/i })).toBeEnabled();
  });

  it("safety step blocks until resolved", async () => {
    renderWizard();
    next();
    fireEvent.click(screen.getByRole("button", { name: /^neck$/i }));
    next();
    fireEvent.change(screen.getByLabelText(/what.s going on/i), {
      target: { value: "Neck ache for a while now, worse in the mornings." },
    });
    fireEvent.click(screen.getByRole("button", { name: /a few weeks/i }));
    next();
    fireEvent.change(screen.getByLabelText(/stopping you doing/i), { target: { value: "Driving." } });
    next(); // -> context
    next(); // -> safety
    expect(screen.getByRole("button", { name: /continue/i })).toBeDisabled();
    fireEvent.click(screen.getByRole("button", { name: /none of these/i }));
    expect(screen.getByRole("button", { name: /continue/i })).toBeEnabled();
  });

  it("consent step blocks until all boxes ticked and name typed", async () => {
    renderWizard();
    await completeHappyPath();
    const submitBtn = screen.getByRole("button", { name: /submit/i });
    expect(submitBtn).toBeEnabled();
  });

  it("happy path submits a derived input and confirms", async () => {
    const { onSubmitted } = renderWizard();
    await completeHappyPath();
    fireEvent.click(screen.getByRole("button", { name: /submit/i }));

    await waitFor(() => expect(submitMock).toHaveBeenCalledTimes(1));
    const [, , input] = submitMock.mock.calls[0];
    expect(input.bodyRegions).toEqual(["neck"]);
    expect(input.bodyArea).toMatch(/neck/i);
    expect(input.subjective.clinicalArea).toBe("spine");
    expect(input.onsetPattern).toBe("gradual");
    expect(input.signature).toBe("Jane Doe");
    expect(input.consent.careConsent).toBe(true);
    // dropped fields fall back to defaults
    expect(input.outcomes.psfsActivity1).toBe("");
    expect(input.objectiveVideo.videoUrl).toBe("");

    await waitFor(() => expect(onSubmitted).toHaveBeenCalledWith("form_1"));
    expect(screen.getByText(/your physiotherapist will review/i)).toBeInTheDocument();
  });

  it("urgent red flag shows the escalation panel but still allows submit", async () => {
    renderWizard();
    next();
    fireEvent.click(screen.getByRole("button", { name: /^neck$/i }));
    next();
    fireEvent.change(screen.getByLabelText(/what.s going on/i), {
      target: { value: "Neck pain plus chest tightness for a few days now." },
    });
    fireEvent.click(screen.getByRole("button", { name: /a few days/i }));
    next();
    fireEvent.change(screen.getByLabelText(/stopping you doing/i), { target: { value: "Everything." } });
    next();
    next(); // -> safety
    fireEvent.click(screen.getByRole("button", { name: /chest pain/i }));
    expect(screen.getByRole("alert")).toHaveTextContent(/NHS 111/);
    next(); // -> consent (still allowed)
    screen.getAllByRole("checkbox").forEach((cb) => fireEvent.click(cb));
    fireEvent.change(screen.getByLabelText(/type your name/i), { target: { value: "Jane Doe" } });
    fireEvent.click(screen.getByRole("button", { name: /submit/i }));
    await waitFor(() => expect(submitMock).toHaveBeenCalledTimes(1));
    const [, , input] = submitMock.mock.calls[0];
    expect(input.redFlags.chestPainBreathlessness).toBe(true);
  });
});
