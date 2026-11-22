import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

let pathname = "/";
vi.mock("next/navigation", () => ({ usePathname: () => pathname }));
vi.mock("@/lib/growth-tracking", () => ({ trackGrowthEvent: vi.fn() }));
vi.mock("@/lib/analytics", () => ({ track: vi.fn() }));
// The exercise library shows the bar to UK readers only (worked out from the
// browser time zone). Pin it so the test machine's own time zone doesn't decide.
const regionState = vi.hoisted(() => ({ region: "uk" as "uk" | "overseas" | "unknown" }));
vi.mock("@/lib/visitor-region", () => ({ browserRegion: () => regionState.region }));

import { ContactBar, showContactBar } from "@/components/contact-bar";
import { emailHref, whatsappHref } from "@/lib/practice-contact";

beforeEach(() => {
  regionState.region = "uk";
});

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
    "/book",
    "/book/success",
    "/exercises",
    "/exercises/spanish-squat",
    "/exercises/area/knee",
  ])("shows on %s", (path) => {
    expect(showContactBar(path)).toBe(true);
  });

  it.each([
    "/book/receipt/cs_test_123",
    "/admin",
    "/patient",
    "/plan",
    "/request-visit",
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

  it("shows WhatsApp, Email and Call me back on the booking page, with a booking message", () => {
    pathname = "/book";
    render(<ContactBar />);
    expect(screen.getByRole("link", { name: /whatsapp/i })).toHaveAttribute("href", whatsappHref("booking"));
    expect(screen.getByRole("link", { name: /email/i })).toHaveAttribute("href", emailHref("booking"));
    expect(screen.getByRole("link", { name: /call me back/i })).toBeInTheDocument();
  });

  it("shows on exercise pages for UK readers, asking about their condition", () => {
    pathname = "/exercises/spanish-squat";
    render(<ContactBar />);
    expect(screen.getByRole("link", { name: /whatsapp/i })).toHaveAttribute("href", whatsappHref("condition"));
    expect(screen.getByRole("link", { name: /email/i })).toHaveAttribute("href", emailHref("condition"));
  });

  it.each(["overseas", "unknown"] as const)("renders nothing on exercise pages when the region is %s", (region) => {
    regionState.region = region;
    pathname = "/exercises/spanish-squat";
    const { container } = render(<ContactBar />);
    expect(container).toBeEmptyDOMElement();
  });

  it("keeps showing on other pages for overseas readers", () => {
    regionState.region = "overseas";
    pathname = "/services/neurological-rehabilitation";
    render(<ContactBar />);
    expect(screen.getByRole("link", { name: /whatsapp/i })).toBeInTheDocument();
  });

  it("has a short lead line for wider screens", () => {
    pathname = "/pricing";
    render(<ContactBar />);
    expect(screen.getByText(/ask the physio on whatsapp or by email/i)).toBeInTheDocument();
  });

  it("renders nothing on the printable receipt", () => {
    pathname = "/book/receipt/cs_test_123";
    const { container } = render(<ContactBar />);
    expect(container).toBeEmptyDOMElement();
  });
});
