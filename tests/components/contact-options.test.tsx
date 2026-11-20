import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const trackGrowthEvent = vi.fn();
const track = vi.fn();
vi.mock("@/lib/growth-tracking", () => ({ trackGrowthEvent: (...a: unknown[]) => trackGrowthEvent(...a) }));
vi.mock("@/lib/analytics", () => ({ track: (...a: unknown[]) => track(...a) }));

import { ContactOptions } from "@/components/contact-options";
import { PRACTICE_EMAIL, PRACTICE_PHONE, emailHref, whatsappHref } from "@/lib/practice-contact";

describe("ContactOptions", () => {
  beforeEach(() => {
    trackGrowthEvent.mockClear();
    track.mockClear();
  });

  it("offers WhatsApp and email with the topic's prefilled message", () => {
    render(<ContactOptions topic="home-visit" source="home_visits_page" lead="Not sure yet?" />);
    const wa = screen.getByRole("link", { name: /whatsapp us/i });
    expect(wa).toHaveAttribute("href", whatsappHref("home-visit"));
    expect(wa).toHaveAttribute("target", "_blank");
    expect(wa.getAttribute("rel")).toContain("noopener");
    expect(screen.getByRole("link", { name: /email us/i })).toHaveAttribute("href", emailHref("home-visit"));
    expect(screen.getByText("Not sure yet?")).toBeInTheDocument();
  });

  it("shows the email address and phone number as plain text too", () => {
    const { container } = render(<ContactOptions topic="general" source="contact_page" />);
    expect(container.textContent).toContain(PRACTICE_EMAIL);
    expect(container.textContent).toContain(PRACTICE_PHONE);
  });

  it("records which option was tapped and where", () => {
    render(<ContactOptions topic="neuro" source="service_detail_page" />);
    fireEvent.click(screen.getByRole("link", { name: /whatsapp us/i }));
    expect(trackGrowthEvent).toHaveBeenCalledWith("whatsapp_click", { source: "service_detail_page", topic: "neuro" });
    expect(track).toHaveBeenCalledWith("contact_click", { method: "whatsapp", source: "service_detail_page", topic: "neuro" });
    fireEvent.click(screen.getByRole("link", { name: /email us/i }));
    expect(trackGrowthEvent).toHaveBeenCalledWith("email_click", { source: "service_detail_page", topic: "neuro" });
  });
});
