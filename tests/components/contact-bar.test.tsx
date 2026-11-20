import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

let pathname = "/";
vi.mock("next/navigation", () => ({ usePathname: () => pathname }));
vi.mock("@/lib/growth-tracking", () => ({ trackGrowthEvent: vi.fn() }));
vi.mock("@/lib/analytics", () => ({ track: vi.fn() }));

import { ContactBar, showContactBar } from "@/components/contact-bar";
import { whatsappHref } from "@/lib/practice-contact";

describe("showContactBar", () => {
  it.each([
    "/",
    "/about",
    "/pricing",
    "/contact",
    "/services",
    "/services/neurological-rehabilitation",
    "/glasgow-physiotherapist",
    "/physiotherapy-home-visits-glasgow",
    "/manual-therapy-glasgow",
  ])("shows on %s", (path) => {
    expect(showContactBar(path)).toBe(true);
  });

  it.each([
    "/exercises",
    "/exercises/spanish-squat",
    "/book",
    "/book/success",
    "/admin",
    "/patient",
    "/plan",
    "/embed/exercises/clam-shell",
    "/blog/some-post",
  ])("stays off %s", (path) => {
    expect(showContactBar(path)).toBe(false);
  });
});

describe("ContactBar", () => {
  it("links the home-visit pages to a home-visit WhatsApp message", () => {
    pathname = "/physiotherapy-home-visits-glasgow";
    render(<ContactBar />);
    expect(screen.getByRole("link", { name: /whatsapp/i })).toHaveAttribute("href", whatsappHref("home-visit"));
    expect(screen.getByRole("link", { name: /email/i })).toBeInTheDocument();
  });

  it("uses the neuro message on the neuro service page", () => {
    pathname = "/services/neurological-rehabilitation";
    render(<ContactBar />);
    expect(screen.getByRole("link", { name: /whatsapp/i })).toHaveAttribute("href", whatsappHref("neuro"));
  });

  it("renders nothing on exercise pages", () => {
    pathname = "/exercises/spanish-squat";
    const { container } = render(<ContactBar />);
    expect(container).toBeEmptyDOMElement();
  });
});
