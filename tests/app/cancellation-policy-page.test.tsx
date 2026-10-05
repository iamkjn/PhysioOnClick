import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import CancellationPolicyPage from "@/app/cancellation-policy/page";

describe("cancellation policy: home-visit travel fees", () => {
  it("refunds a home visit's travel fee along with the session", () => {
    render(<CancellationPolicyPage />);
    expect(screen.getByText(/Any full refund for a home visit includes its travel fee\./)).toBeInTheDocument();
  });

  it("refunds the travel fee of each unused home-visit package session", () => {
    render(<CancellationPolicyPage />);
    expect(
      screen.getByText(/For a home-visit package, the refund for each unused session also includes that session's £15 travel fee\./),
    ).toBeInTheDocument();
  });
});
