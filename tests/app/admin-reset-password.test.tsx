import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { FirebaseError } from "firebase/app";

const confirmPasswordResetMock = vi.fn();
const pushMock = vi.fn();

vi.mock("firebase/auth", () => ({
  confirmPasswordReset: (...args: unknown[]) => confirmPasswordResetMock(...args),
}));

vi.mock("@/lib/firebase", () => ({ auth: {} }));

let searchParamsValue = new URLSearchParams();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock }),
  useSearchParams: () => searchParamsValue,
}));

import ResetPasswordPage from "@/app/admin/reset-password/page";

describe("Admin reset-password page", () => {
  beforeEach(() => {
    confirmPasswordResetMock.mockReset();
    pushMock.mockReset();
    searchParamsValue = new URLSearchParams({ oobCode: "abc123" });
  });

  it("shows an error and does not call confirmPasswordReset when passwords are too short", async () => {
    render(<ResetPasswordPage />);
    fireEvent.change(screen.getByPlaceholderText("New password"), { target: { value: "short" } });
    fireEvent.change(screen.getByPlaceholderText("Confirm new password"), { target: { value: "short" } });
    fireEvent.click(screen.getByRole("button", { name: /update password/i }));

    expect(await screen.findByRole("alert")).toHaveTextContent(/at least 8 characters/i);
    expect(confirmPasswordResetMock).not.toHaveBeenCalled();
  });

  it("shows an error when the passwords don't match", async () => {
    render(<ResetPasswordPage />);
    fireEvent.change(screen.getByPlaceholderText("New password"), { target: { value: "longenoughpw1" } });
    fireEvent.change(screen.getByPlaceholderText("Confirm new password"), { target: { value: "longenoughpw2" } });
    fireEvent.click(screen.getByRole("button", { name: /update password/i }));

    expect(await screen.findByRole("alert")).toHaveTextContent(/do not match/i);
    expect(confirmPasswordResetMock).not.toHaveBeenCalled();
  });

  it("calls confirmPasswordReset with the oobCode and new password, then redirects on success", async () => {
    confirmPasswordResetMock.mockResolvedValue(undefined);
    render(<ResetPasswordPage />);
    fireEvent.change(screen.getByPlaceholderText("New password"), { target: { value: "longenoughpw1" } });
    fireEvent.change(screen.getByPlaceholderText("Confirm new password"), { target: { value: "longenoughpw1" } });
    fireEvent.click(screen.getByRole("button", { name: /update password/i }));

    await waitFor(() =>
      expect(confirmPasswordResetMock).toHaveBeenCalledWith(expect.anything(), "abc123", "longenoughpw1")
    );
    expect(await screen.findByText(/password updated/i)).toBeInTheDocument();
  });

  it("shows an expired-link message for auth/expired-action-code", async () => {
    confirmPasswordResetMock.mockRejectedValue(new FirebaseError("auth/expired-action-code", "expired"));
    render(<ResetPasswordPage />);
    fireEvent.change(screen.getByPlaceholderText("New password"), { target: { value: "longenoughpw1" } });
    fireEvent.change(screen.getByPlaceholderText("Confirm new password"), { target: { value: "longenoughpw1" } });
    fireEvent.click(screen.getByRole("button", { name: /update password/i }));

    expect(await screen.findByRole("alert")).toHaveTextContent(/expired or has already been used/i);
  });

  it("shows a generic error and does not call confirmPasswordReset when the link has no oobCode", async () => {
    searchParamsValue = new URLSearchParams();
    render(<ResetPasswordPage />);
    fireEvent.change(screen.getByPlaceholderText("New password"), { target: { value: "longenoughpw1" } });
    fireEvent.change(screen.getByPlaceholderText("Confirm new password"), { target: { value: "longenoughpw1" } });
    fireEvent.click(screen.getByRole("button", { name: /update password/i }));

    expect(await screen.findByRole("alert")).toHaveTextContent(/missing its reset code/i);
    expect(confirmPasswordResetMock).not.toHaveBeenCalled();
  });
});
