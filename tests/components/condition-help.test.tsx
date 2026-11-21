import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const trackGrowthEvent = vi.fn();
vi.mock("@/lib/growth-tracking", () => ({ trackGrowthEvent: (...a: unknown[]) => trackGrowthEvent(...a) }));
vi.mock("@/lib/analytics", () => ({ track: vi.fn() }));

import { ConditionHelp, visitRequestHrefAbout } from "@/components/condition-help";
import { conditionEmailHref, conditionWhatsappHref } from "@/lib/practice-contact";

describe("ConditionHelp", () => {
  beforeEach(() => trackGrowthEvent.mockReset());

  it("offers email, a call back and WhatsApp, all naming what the visitor was reading", () => {
    render(<ConditionHelp about="Neurological rehabilitation" source="service_detail_condition" />);
    expect(screen.getByRole("heading", { name: "Not sure if this is right for you?" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /email us about your condition/i })).toHaveAttribute(
      "href",
      conditionEmailHref("Neurological rehabilitation"),
    );
    expect(screen.getByRole("link", { name: /request a call back/i })).toHaveAttribute(
      "href",
      "/request-visit?about=Neurological%20rehabilitation",
    );
    expect(screen.getByRole("link", { name: /whatsapp/i })).toHaveAttribute(
      "href",
      conditionWhatsappHref("Neurological rehabilitation"),
    );
  });

  it("logs each tap to the Growth tab with where it happened", () => {
    render(<ConditionHelp about="Clamshell (exercise)" source="exercise_condition" inline />);
    fireEvent.click(screen.getByRole("link", { name: /email us about your condition/i }));
    expect(trackGrowthEvent).toHaveBeenCalledWith("email_click", { source: "exercise_condition", topic: "condition" });
    fireEvent.click(screen.getByRole("link", { name: /request a call back/i }));
    expect(trackGrowthEvent).toHaveBeenCalledWith("book_now_click", { source: "exercise_condition_callback" });
  });

  it("hides the heading in the inline version", () => {
    render(<ConditionHelp source="x" inline />);
    expect(screen.queryByRole("heading")).toBeNull();
  });

  it("builds a plain request link when there's no topic", () => {
    expect(visitRequestHrefAbout()).toBe("/request-visit");
  });
});

describe("condition email template", () => {
  it("names the topic in the subject and asks what a physio needs to reply", () => {
    const href = conditionEmailHref("Clamshell (exercise)");
    expect(href).not.toContain("+");
    const params = new URLSearchParams(href.split("?")[1]);
    expect(params.get("subject")).toBe("Question about my condition: Clamshell (exercise)");
    const body = params.get("body")!;
    expect(body).toContain("I'm asking about: Clamshell (exercise)");
    expect(body).toMatch(/what's going on, and for how long/i);
    expect(body).toMatch(/postcode/i);
    expect(body).toMatch(/best phone number/i);
  });
});
