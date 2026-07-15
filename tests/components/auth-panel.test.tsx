import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { UserCredential } from "firebase/auth";

// Use vi.hoisted so FirebaseError is available when vi.mock factories are hoisted
const { FirebaseError } = vi.hoisted(() => {
  class FirebaseError extends Error {
    code: string;
    constructor(code: string, message: string) {
      super(message);
      this.code = code;
    }
  }
  return { FirebaseError };
});

const signInWithEmailAndPassword = vi.fn();
const getRedirectResult = vi.fn();

vi.mock("firebase/app", () => ({ FirebaseError }));

vi.mock("firebase/auth", () => ({
  GoogleAuthProvider: vi.fn().mockImplementation(() => ({
    setCustomParameters: vi.fn(),
  })),
  createUserWithEmailAndPassword: vi.fn(),
  getRedirectResult: (...args: unknown[]) => getRedirectResult(...args),
  signInWithEmailAndPassword: (...args: unknown[]) => signInWithEmailAndPassword(...args),
  signInWithPopup: vi.fn(),
  signInWithRedirect: vi.fn(),
  updateProfile: vi.fn(),
  FirebaseError,
}));

vi.mock("@/lib/firebase", () => ({ auth: {}, firebaseEnabled: true }));

vi.mock("@/lib/patient-account", () => ({
  ensureAppUserRecord: vi.fn().mockResolvedValue(undefined),
  ensurePatientRecord: vi.fn().mockResolvedValue(undefined),
}));

const push = vi.fn();
const refresh = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push, refresh }),
}));

import { AuthPanel } from "@/components/auth-panel";

async function signInWithPassword() {
  const user = userEvent.setup();
  await user.type(screen.getByLabelText(/email/i), "jane@example.com");
  await user.type(screen.getByLabelText(/password/i), "supersecret1");
  await user.click(screen.getByRole("button", { name: /^continue$/i }));
  return user;
}

describe("AuthPanel", () => {
  beforeEach(() => {
    push.mockClear();
    refresh.mockClear();
    getRedirectResult.mockResolvedValue(null);
    signInWithEmailAndPassword.mockResolvedValue({
      user: { uid: "u1", displayName: "", providerData: [] },
    } as unknown as UserCredential);
    global.fetch = vi.fn().mockResolvedValue(new Response(JSON.stringify({ ok: true }), { status: 200 }));
    window.history.pushState({}, "", "/book");
  });

  it("does not redirect after sign-in when redirectTo is null (booking flow continuity)", async () => {
    render(<AuthPanel role="patient" redirectTo={null} />);
    await signInWithPassword();

    await waitFor(() => {
      expect(screen.getByText(/patient sign-in successful/i)).toBeInTheDocument();
    });
    expect(push).not.toHaveBeenCalled();
    expect(refresh).not.toHaveBeenCalled();
  });

  it("redirects to redirectTo after a successful sign-in when it is set", async () => {
    render(<AuthPanel role="patient" redirectTo="/patient" />);
    await signInWithPassword();

    await waitFor(() => {
      expect(push).toHaveBeenCalledWith("/patient");
    });
    expect(refresh).toHaveBeenCalled();
  });

  it("includes the current page path when requesting a magic sign-in link", async () => {
    render(<AuthPanel role="patient" redirectTo={null} />);
    const user = userEvent.setup();

    await user.click(screen.getByRole("button", { name: /send me a sign-in link/i }));
    await user.type(screen.getByLabelText(/email/i), "jane@example.com");
    await user.click(screen.getByRole("button", { name: /send sign-in link/i }));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        "/api/auth/magic-link",
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify({ email: "jane@example.com", returnTo: "/book" }),
        }),
      );
    });
  });
});
