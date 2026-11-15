import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const createUserWithEmailAndPassword = vi.fn();
const requestEmailVerification = vi.fn();

vi.mock("firebase/app", () => ({ FirebaseError: class extends Error {} }));
vi.mock("firebase/auth", () => ({
  GoogleAuthProvider: vi.fn().mockImplementation(() => ({ setCustomParameters: vi.fn() })),
  createUserWithEmailAndPassword: (...a: unknown[]) => createUserWithEmailAndPassword(...a),
  getRedirectResult: vi.fn().mockResolvedValue(null),
  signInWithEmailAndPassword: vi.fn(),
  signInWithPopup: vi.fn(),
  signInWithRedirect: vi.fn(),
  updateProfile: vi.fn().mockResolvedValue(undefined),
}));
vi.mock("@/lib/firebase", () => ({ auth: {}, firebaseEnabled: true }));
vi.mock("@/lib/analytics", () => ({ track: vi.fn() }));
vi.mock("@/lib/patient-account", () => ({
  ensureAppUserRecord: vi.fn().mockResolvedValue(undefined),
  ensurePatientRecord: vi.fn().mockResolvedValue(undefined),
}));
vi.mock("@/lib/email-verification", () => ({
  requestEmailVerification: (...a: unknown[]) => requestEmailVerification(...a),
}));
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }) }));

import { AuthPanel } from "@/components/auth-panel";

beforeEach(() => {
  createUserWithEmailAndPassword.mockReset();
  requestEmailVerification.mockReset().mockResolvedValue({ ok: true });
});

function fill(container: HTMLElement, name: string, value: string) {
  fireEvent.change(container.querySelector(`input[name="${name}"]`)!, { target: { value } });
}

describe("AuthPanel password sign-up", () => {
  it("asks for an email confirmation link for the new account", async () => {
    const newUser = { uid: "new-1", email: "carer@example.com", getIdToken: vi.fn() };
    createUserWithEmailAndPassword.mockResolvedValue({ user: newUser });

    const { container } = render(<AuthPanel role="patient" redirectTo={null} />);
    fireEvent.click(screen.getByRole("button", { name: "Create account" }));
    fill(container, "fullName", "Thomas Carer");
    fill(container, "dob", "1950-05-05");
    fill(container, "email", "carer@example.com");
    fill(container, "password", "a-long-test-value");
    fireEvent.submit(container.querySelector("form")!);

    await waitFor(() => expect(requestEmailVerification).toHaveBeenCalledWith(newUser));
    expect(await screen.findByText(/emailed you a link to confirm your address/)).toBeInTheDocument();
  });

  it("still completes sign-up if the confirmation email fails", async () => {
    createUserWithEmailAndPassword.mockResolvedValue({ user: { uid: "new-2", getIdToken: vi.fn() } });
    requestEmailVerification.mockRejectedValue(new Error("down"));
    vi.spyOn(console, "error").mockImplementation(() => {});

    const { container } = render(<AuthPanel role="patient" redirectTo={null} />);
    fireEvent.click(screen.getByRole("button", { name: "Create account" }));
    fill(container, "fullName", "Thomas Carer");
    fill(container, "dob", "1950-05-05");
    fill(container, "email", "carer2@example.com");
    fill(container, "password", "a-long-test-value");
    fireEvent.submit(container.querySelector("form")!);

    expect(await screen.findByText(/Patient account created/)).toBeInTheDocument();
  });
});
