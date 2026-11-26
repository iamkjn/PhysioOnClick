import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

let pathname = "/";
vi.mock("next/navigation", () => ({ usePathname: () => pathname }));
vi.mock("@/lib/growth-tracking", () => ({ trackGrowthEvent: vi.fn() }));
vi.mock("@/lib/analytics", () => ({ track: vi.fn() }));
// The bar shows to every reader, wherever they are. Pin the browser region
// (worked out from the time zone) to prove it doesn't change that.
const regionState = vi.hoisted(() => ({ region: "uk" as "uk" | "overseas" | "unknown" }));
vi.mock("@/lib/visitor-region", () => ({ browserRegion: () => regionState.region }));

const patientState = vi.hoisted(() => ({ existing: false }));
vi.mock("@/lib/use-existing-patient", () => ({ useExistingPatient: () => patientState.existing }));

import { ContactBar, contactBarMessage, showContactBar } from "@/components/contact-bar";
import { emailHref, whatsappHref } from "@/lib/practice-contact";

beforeEach(() => {
  regionState.region = "uk";
  patientState.existing = false;
});

// Every page with the bar, one per tab or section, so each message is checked.
const BAR_PAGES = [
  "/",
  "/about",
  "/pricing",
  "/contact",
  "/services",
  "/services/neurological-rehabilitation",
  "/services/back-pain",
  "/glasgow-physiotherapist",
  "/physiotherapy-home-visits-glasgow",
  "/manual-therapy-glasgow",
  "/guides",
  "/guides/some-guide",
  "/how-online-physiotherapy-works",
  "/online-physiotherapy-for/runners",
  "/online-physiotherapy-scotland",
  "/book",
  "/book/success",
  "/exercises",
  "/exercises/spanish-squat",
  "/exercises/area/knee",
  "/exercises/tests",
  "/blog",
  "/blog/some-post",
  "/pay/abc123",
  "/cancellation-policy",
];

describe("showContactBar", () => {
  it.each(BAR_PAGES)("shows on %s", (path) => {
    expect(showContactBar(path)).toBe(true);
  });

  it.each([
    "/book/receipt/cs_test_123",
    "/admin",
    "/patient",
    "/plan",
    "/request-visit",
    "/embed/exercises/clam-shell",
    "/privacy-policy",
    "/auth/verify",
  ])("stays off %s", (path) => {
    expect(showContactBar(path)).toBe(false);
  });
});

describe("contactBarMessage", () => {
  it.each(BAR_PAGES)("has a message for %s whose phone version fits one line", (path) => {
    const message = contactBarMessage(path);
    expect(message.title.length).toBeGreaterThan(0);
    expect(message.text.length).toBeGreaterThan(0);
    expect(message.short.length).toBeGreaterThan(0);
    // ~42 characters fit one line on a 320px-wide phone at the bar's text size.
    expect(message.short.length).toBeLessThanOrEqual(42);
  });

  it("offers to book for people who find booking hard", () => {
    expect(contactBarMessage("/book").title).toMatch(/finding it hard to book/i);
    expect(contactBarMessage("/book").text).toMatch(/leave it to us/i);
    expect(contactBarMessage("/book").short).toMatch(/leave it to us/i);
  });

  it("speaks to each tab differently", () => {
    const titles = new Set(
      ["/", "/about", "/services", "/exercises", "/exercises/tests", "/blog", "/pricing", "/book", "/contact"].map(
        (path) => contactBarMessage(path).title,
      ),
    );
    expect(titles.size).toBe(9);
  });

  it("gives the self-checks their own message, not the exercise one", () => {
    expect(contactBarMessage("/exercises/tests").title).not.toBe(contactBarMessage("/exercises/clam-shell").title);
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

  it("on the booking page, offers to book for them by WhatsApp or email", () => {
    pathname = "/book";
    render(<ContactBar />);
    expect(screen.getByRole("link", { name: /whatsapp/i })).toHaveAttribute("href", whatsappHref("booking"));
    expect(decodeURIComponent(whatsappHref("booking"))).toMatch(/book .*for me/i);
    expect(screen.getByRole("link", { name: /email/i })).toHaveAttribute("href", emailHref("booking"));
    expect(screen.getByRole("link", { name: /call me back/i })).toBeInTheDocument();
  });

  it("asks about the appointment after booking, not for help booking", () => {
    pathname = "/book/success";
    render(<ContactBar />);
    expect(screen.getByRole("link", { name: /whatsapp/i })).toHaveAttribute("href", whatsappHref("appointment"));
  });

  it("asks for help with paying on the payment page", () => {
    pathname = "/pay/abc123";
    render(<ContactBar />);
    expect(screen.getByRole("link", { name: /whatsapp/i })).toHaveAttribute("href", whatsappHref("payment"));
  });

  it("shows on blog posts for every reader, asking about their condition", () => {
    regionState.region = "overseas";
    pathname = "/blog/some-post";
    render(<ContactBar />);
    expect(screen.getByRole("link", { name: /whatsapp/i })).toHaveAttribute("href", whatsappHref("condition"));
  });

  it("shows on exercise pages, asking about their condition", () => {
    pathname = "/exercises/spanish-squat";
    render(<ContactBar />);
    expect(screen.getByRole("link", { name: /whatsapp/i })).toHaveAttribute("href", whatsappHref("condition"));
    expect(screen.getByRole("link", { name: /email/i })).toHaveAttribute("href", emailHref("condition"));
  });

  it.each(["overseas", "unknown"] as const)("also shows on exercise pages and self-checks when the region is %s", (region) => {
    regionState.region = region;
    pathname = "/exercises/spanish-squat";
    const { unmount } = render(<ContactBar />);
    expect(screen.getByRole("link", { name: /whatsapp/i })).toHaveAttribute("href", whatsappHref("condition"));
    expect(screen.getByRole("link", { name: /email/i })).toBeInTheDocument();
    unmount();
    pathname = "/exercises/tests";
    render(<ContactBar />);
    expect(screen.getByText(contactBarMessage("/exercises/tests").short)).toBeInTheDocument();
  });

  it("keeps showing on other pages for overseas readers", () => {
    regionState.region = "overseas";
    pathname = "/services/neurological-rehabilitation";
    render(<ContactBar />);
    expect(screen.getByRole("link", { name: /whatsapp/i })).toBeInTheDocument();
  });

  it("shows the page's message: full on wider screens, short on phones", () => {
    pathname = "/book";
    const message = contactBarMessage("/book");
    render(<ContactBar />);
    expect(screen.getByText(message.title)).toBeInTheDocument();
    expect(screen.getByText(message.text)).toBeInTheDocument();
    expect(screen.getByText(message.short)).toBeInTheDocument();
  });

  it.each(["/book", "/exercises/clam-shell", "/blog/some-post", "/physiotherapy-home-visits-glasgow"])(
    "hides Call me back for overseas readers on %s but keeps WhatsApp and Email",
    (path) => {
      regionState.region = "overseas";
      pathname = path;
      render(<ContactBar />);
      expect(screen.queryByRole("link", { name: /call me back/i })).not.toBeInTheDocument();
      expect(screen.getByRole("link", { name: /whatsapp/i })).toBeInTheDocument();
      expect(screen.getByRole("link", { name: /email/i })).toBeInTheDocument();
    },
  );

  it.each(["uk", "unknown"] as const)("keeps Call me back when the region is %s", (region) => {
    regionState.region = region;
    pathname = "/exercises/clam-shell";
    render(<ContactBar />);
    expect(screen.getByRole("link", { name: /call me back/i })).toBeInTheDocument();
  });

  it("doesn't promise a call back in the contact page message", () => {
    expect(contactBarMessage("/contact").text).not.toMatch(/call/i);
  });

  it("renders nothing on the printable receipt", () => {
    pathname = "/book/receipt/cs_test_123";
    const { container } = render(<ContactBar />);
    expect(container).toBeEmptyDOMElement();
  });
});

describe("existing patients", () => {
  it("shows no bar to a patient the physio added", () => {
    pathname = "/";
    patientState.existing = true;
    const { container } = render(<ContactBar />);
    expect(container).toBeEmptyDOMElement();
  });
});
