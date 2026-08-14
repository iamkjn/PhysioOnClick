import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";

const signInWithEmailAndPasswordMock = vi.fn();

vi.mock("firebase/auth", () => ({
  signInWithEmailAndPassword: (...args: unknown[]) => signInWithEmailAndPasswordMock(...args),
}));

vi.mock("@/lib/firebase", () => ({ auth: {} }));

import { AdminSignIn } from "@/components/admin-sign-in";

describe("AdminSignIn forgot password", () => {
  beforeEach(() => {
    signInWithEmailAndPasswordMock.mockReset();
    vi.stubGlobal("fetch", vi.fn());
  });

  it("shows an error asking for an email before sending a reset link", async () => {
    render(<AdminSignIn />);
    fireEvent.click(screen.getByRole("button", { name: /forgot password/i }));
    await waitFor(() =>
      expect(screen.getByRole("alert")).toHaveTextContent(/enter your email address/i)
    );
    expect(fetch).not.toHaveBeenCalled();
  });

  it("posts to the admin forgot-password endpoint and shows a confirmation message for a valid email", async () => {
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValue({ ok: true });
    render(<AdminSignIn />);
    fireEvent.change(screen.getByPlaceholderText("Email address"), {
      target: { value: "hello@physioonclick.co.uk" },
    });
    fireEvent.click(screen.getByRole("button", { name: /forgot password/i }));
    await waitFor(() =>
      expect(fetch).toHaveBeenCalledWith(
        "/api/admin/forgot-password",
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify({ email: "hello@physioonclick.co.uk" }),
        })
      )
    );
    expect(await screen.findByText(/password reset link has been sent/i)).toBeInTheDocument();
  });

  it("shows the same confirmation message even if the request fails, to avoid account enumeration", async () => {
    (fetch as ReturnType<typeof vi.fn>).mockRejectedValue(new Error("network error"));
    render(<AdminSignIn />);
    fireEvent.change(screen.getByPlaceholderText("Email address"), {
      target: { value: "nobody@example.com" },
    });
    fireEvent.click(screen.getByRole("button", { name: /forgot password/i }));
    expect(await screen.findByText(/password reset link has been sent/i)).toBeInTheDocument();
  });
});
