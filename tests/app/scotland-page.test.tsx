import { render } from "@testing-library/react";
import ScotlandPage, { metadata } from "@/app/online-physiotherapy-scotland/page";
import { allOnlinePhysioSlugs } from "@/lib/online-physio-pages";
import { initialAssessmentPrice } from "@/lib/site-data";

describe("app/online-physiotherapy-scotland", () => {
  it("renders the h1", () => {
    const { container } = render(<ScotlandPage />);
    expect(container.querySelector("h1")?.textContent).toBe("Online physiotherapy across Scotland");
  });

  it("links every online physiotherapy condition page", () => {
    const { container } = render(<ScotlandPage />);
    expect(allOnlinePhysioSlugs().length).toBeGreaterThanOrEqual(8);
    for (const slug of allOnlinePhysioSlugs()) {
      expect(container.querySelector(`a[href="/online-physiotherapy-for/${slug}"]`), slug).not.toBeNull();
    }
  });

  it("links the key internal pages and the PHS source", () => {
    const { container } = render(<ScotlandPage />);
    for (const href of [
      "/guides/nhs-physio-waiting-times-scotland",
      "/guides/claim-physiotherapy-on-health-insurance",
      "/services/neurological-rehabilitation",
      "/glasgow-physiotherapist",
    ]) {
      expect(container.querySelector(`a[href="${href}"]`), href).not.toBeNull();
    }
    expect(container.querySelector('a[href^="https://www.publichealthscotland.scot/"]')).not.toBeNull();
  });

  it("states the PHS figure and the price", () => {
    const { container } = render(<ScotlandPage />);
    expect(container.textContent).toContain("52.4%");
    expect(container.textContent).toContain(`£${initialAssessmentPrice}`);
  });

  it("has no FAQPage JSON-LD and a WebPage node", () => {
    const { container } = render(<ScotlandPage />);
    const ld = [...container.querySelectorAll('script[type="application/ld+json"]')].map((s) => s.textContent ?? "");
    expect(ld.join("")).not.toContain("FAQPage");
    expect(ld.join("")).toContain('"WebPage"');
  });

  it("has canonical and length-limited metadata", () => {
    expect(metadata.alternates?.canonical).toBe("/online-physiotherapy-scotland");
    expect(metadata.title).toBe("Online Physiotherapy in Scotland | PhysioOnClick");
    const d = String(metadata.description);
    expect(d.length).toBeGreaterThanOrEqual(120);
    expect(d.length).toBeLessThanOrEqual(160);
    expect(d).toContain(`£${initialAssessmentPrice}`);
  });
});
