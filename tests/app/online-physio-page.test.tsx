import { render } from "@testing-library/react";
import OnlinePhysioPage, {
  generateMetadata,
  generateStaticParams,
} from "@/app/online-physiotherapy-for/[slug]/page";
import { onlinePhysioPages } from "@/lib/online-physio-pages";
import { initialAssessmentPrice } from "@/lib/site-data";

describe("app/online-physiotherapy-for/[slug]", () => {
  it("emits one param per record", () => {
    expect(generateStaticParams()).toEqual(onlinePhysioPages.map((p) => ({ slug: p.slug })));
  });

  it("never leaks link syntax into any landing page", async () => {
    for (const p of onlinePhysioPages) {
      const { container, unmount } = render(await OnlinePhysioPage({ params: Promise.resolve({ slug: p.slug }) }));
      expect(container.textContent).not.toContain("](/");
      unmount();
    }
  });

  for (const p of onlinePhysioPages) {
    it(`renders ${p.slug} correctly`, async () => {
      const { container } = render(await OnlinePhysioPage({ params: Promise.resolve({ slug: p.slug }) }));
      expect(container.querySelector("h1")?.textContent).toBe(p.h1);
      expect(container.textContent).toContain(p.answer.slice(0, 40));
      expect(container.querySelectorAll("[data-in-person] li").length).toBe(p.inPersonInstead.length);
      expect(container.querySelectorAll("[data-sources] a").length).toBe(p.sources.length);
      if (p.exerciseHubSlug) {
        expect(container.querySelector(`a[href="/exercises/for/${p.exerciseHubSlug}"]`)).not.toBeNull();
      }
      expect(container.querySelector(`a[href="/services/${p.serviceSlug}"]`)).not.toBeNull();
      const book = container.querySelector('a[href^="/book"]');
      expect(book).not.toBeNull();
      expect(book!.textContent).toContain(`£${initialAssessmentPrice}`);
      expect(container.textContent).not.toContain("{INITIAL_PRICE}");
    });

    it(`builds ${p.slug} metadata with a relative canonical`, async () => {
      const meta = await generateMetadata({ params: Promise.resolve({ slug: p.slug }) });
      expect(meta.title).toBe(p.seoTitle);
      expect(meta.alternates?.canonical).toBe(`/online-physiotherapy-for/${p.slug}`);
    });
  }

  it("returns {} metadata for an unknown slug", async () => {
    expect(await generateMetadata({ params: Promise.resolve({ slug: "nope" }) })).toEqual({});
  });
});
