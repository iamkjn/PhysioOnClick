import { render } from "@testing-library/react";
import GuidePage, { generateMetadata, generateStaticParams } from "@/app/guides/[slug]/page";
import GuidesIndex from "@/app/guides/page";
import { guides } from "@/lib/guides";
import { initialAssessmentPrice } from "@/lib/site-data";
import { PAGE_DISCLAIMER } from "@/lib/exercise-disclaimer";

const SLUG = guides[0]!.slug;

describe("app/guides/[slug]", () => {
  it("emits one param per guide", () => {
    expect(generateStaticParams()).toEqual(guides.map((g) => ({ slug: g.slug })));
  });
  it("renders the guide title as h1, the answer, sources and a booking CTA with the live price", async () => {
    const { container } = render(await GuidePage({ params: Promise.resolve({ slug: SLUG }) }));
    expect(container.querySelector("h1")?.textContent).toBe(guides[0]!.title);
    expect(container.textContent).toContain(guides[0]!.answer.slice(0, 40));
    expect(container.querySelectorAll("[data-sources] a").length).toBe(guides[0]!.sources.length);
    expect(container.textContent).toContain(`£${initialAssessmentPrice}`);
    expect(container.textContent).not.toContain("{INITIAL_PRICE}");
  });
  it("renders the shared page disclaimer exactly once on every guide", async () => {
    for (const g of guides) {
      const { container, unmount } = render(await GuidePage({ params: Promise.resolve({ slug: g.slug }) }));
      const notes = container.querySelectorAll("[data-page-disclaimer]");
      expect(notes.length, g.slug).toBe(1);
      expect(notes[0]!.textContent, g.slug).toBe(PAGE_DISCLAIMER);
      unmount();
    }
  });
  it("builds metadata with a relative canonical", async () => {
    const meta = await generateMetadata({ params: Promise.resolve({ slug: SLUG }) });
    expect(meta.title).toBe(guides[0]!.seoTitle);
    expect(meta.alternates?.canonical).toBe(`/guides/${SLUG}`);
  });
  it("returns {} metadata for an unknown slug", async () => {
    expect(await generateMetadata({ params: Promise.resolve({ slug: "nope" }) })).toEqual({});
  });
});

describe("link syntax", () => {
  it("never leaks into any rendered guide", async () => {
    for (const g of guides) {
      const { container, unmount } = render(await GuidePage({ params: Promise.resolve({ slug: g.slug }) }));
      expect(container.textContent).not.toContain("](/");
      unmount();
    }
    const { container } = render(<GuidesIndex />);
    expect(container.textContent).not.toContain("](/");
  });
});

describe("app/guides index", () => {
  it("links every guide once", () => {
    const { container } = render(<GuidesIndex />);
    for (const g of guides) {
      expect(container.querySelectorAll(`a[href="/guides/${g.slug}"]`).length).toBe(1);
    }
  });
});
