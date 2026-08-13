import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";

const sendPasswordResetEmailMock = vi.fn();
const signInWithEmailAndPasswordMock = vi.fn();

vi.mock("firebase/auth", () => ({
  sendPasswordResetEmail: (...args: unknown[]) => sendPasswordResetEmailMock(...args),
  signInWithEmailAndPassword: (...args: unknown[]) => signInWithEmailAndPasswordMock(...args),
}));

vi.mock("@/lib/firebase", () => ({ auth: {} }));

import { AdminSignIn } from "@/components/admin-sign-in";

describe("AdminSignIn forgot password", () => {
  beforeEach(() => {
    sendPasswordResetEmailMock.mockReset();
    signInWithEmailAndPasswordMock.mockReset();
  });

  it("shows an error asking for an email before sending a reset link", async () => {
    render(<AdminSignIn />);
    fireEvent.click(screen.getByRole("button", { name: /forgot password/i }));
    await waitFor(() =>
      expect(screen.getByRole("alert")).toHaveTextContent(/enter your email address/i)
    );
    expect(sendPasswordResetEmailMock).not.toHaveBeenCalled();
  });

  it("sends a reset email and shows a confirmation message for a valid email", async () => {
    sendPasswordResetEmailMock.mockResolvedValue(undefined);
    render(<AdminSignIn />);
    fireEvent.change(screen.getByPlaceholderText("Email address"), {
      target: { value: "hello@physioonclick.co.uk" },
    });
    fireEvent.click(screen.getByRole("button", { name: /forgot password/i }));
    await waitFor(() =>
      expect(sendPasswordResetEmailMock).toHaveBeenCalledWith(
        expect.anything(),
        "hello@physioonclick.co.uk"
      )
    );
    expect(await screen.findByText(/password reset link has been sent/i)).toBeInTheDocument();
  });

  it("shows the same confirmation message even if the reset request fails, to avoid account enumeration", async () => {
    sendPasswordResetEmailMock.mockRejectedValue(new Error("user-not-found"));
    render(<AdminSignIn />);
    fireEvent.change(screen.getByPlaceholderText("Email address"), {
      target: { value: "nobody@example.com" },
    });
    fireEvent.click(screen.getByRole("button", { name: /forgot password/i }));
    expect(await screen.findByText(/password reset link has been sent/i)).toBeInTheDocument();
  });
});
