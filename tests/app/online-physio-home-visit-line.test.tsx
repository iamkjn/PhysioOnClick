import { render } from "@testing-library/react";
import OnlinePhysioPage from "@/app/online-physiotherapy-for/[slug]/page";

const LINE = "book a home visit";

async function text(slug: string) {
  const { container } = render(await OnlinePhysioPage({ params: Promise.resolve({ slug }) }));
  return { text: container.textContent ?? "", link: container.querySelector('a[href="/book?visit=home"]') };
}

describe("home-visit line on condition pages", () => {
  it("appears once on an MSK page", async () => {
    const r = await text("sciatica");
    expect(r.text).toContain(LINE);
    expect(r.link).not.toBeNull();
  });
  it.each(["knee-replacement-rehab", "stroke-rehabilitation"])("is absent on %s", async (slug) => {
    const r = await text(slug);
    expect(r.text).not.toContain(LINE);
    expect(r.link).toBeNull();
  });
});
