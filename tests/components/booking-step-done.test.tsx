import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { BookingStepDone } from "@/components/booking-step-done";

const base = { uid: "cal_1", start: "2999-01-01T10:00:00.000Z", serviceId: "initial-assessment" as const, name: "Ada Lovelace" };

describe("BookingStepDone", () => {
  it("tells a video patient to join the call", () => {
    render(<BookingStepDone confirmation={{ ...base, visitType: "video" }} />);
    expect(screen.getByText(/Join the video call/)).toBeInTheDocument();
  });

  it("never tells a home-visit patient to join a video call", () => {
    const { container } = render(<BookingStepDone confirmation={{ ...base, visitType: "home" }} />);
    expect(container.textContent).not.toMatch(/video|join the session/i);
    expect(container.textContent).toMatch(/home visit/i);
  });
});
