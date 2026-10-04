// Round-2 sign-off Q7/Q8 (2026-10-04): home visits are offered for neuro and
// post-op care too, so every landing page shows the home-visit line, and it
// says hands-on treatment is available at a home visit. Neuro and post-op pages
// keep their clearance requirement alongside the line.
import { cleanup, render } from "@testing-library/react";
import OnlinePhysioPage from "@/app/online-physiotherapy-for/[slug]/page";
import { onlinePhysioPages } from "@/lib/online-physio-pages";
import { HOME_VISIT_AREA_LABEL } from "@/lib/home-visit";
import { formatPounds, HOME_VISIT_TRAVEL_FEE_PENCE } from "@/lib/home-visit-pricing";

const LINE = "book a home visit";
const NEURO = ["stroke-rehabilitation", "parkinsons", "multiple-sclerosis", "functional-neurological-disorder"];
const POSTOP = ["knee-replacement-rehab", "hip-replacement-rehab", "rotator-cuff-repair-rehab"];

async function homeVisit(slug: string) {
  const { container } = render(await OnlinePhysioPage({ params: Promise.resolve({ slug }) }));
  const block = container.querySelector("[data-home-visit]");
  return {
    text: block?.textContent ?? "",
    links: container.querySelectorAll('a[href="/book?visit=home"]').length,
  };
}

afterEach(() => cleanup());

describe("home-visit line on condition pages", () => {
  it.each(onlinePhysioPages.map((p) => p.slug))("appears once on %s, with area, fee and hands-on wording", async (slug) => {
    const r = await homeVisit(slug);
    expect(r.text).toContain(LINE);
    expect(r.links).toBe(1);
    expect(r.text).toContain(HOME_VISIT_AREA_LABEL);
    expect(r.text).toContain(`${formatPounds(HOME_VISIT_TRAVEL_FEE_PENCE)} travel fee`);
    expect(r.text).toMatch(/hands-on treatment \(manual therapy\)/);
    expect(r.text).toMatch(/Video sessions cannot include hands-on treatment/);
    expect(r.text).not.toContain("The same applies at home");
  });
  it.each(NEURO)("keeps the GP/specialist clearance alongside the line on %s", async (slug) => {
    const r = await homeVisit(slug);
    expect(r.text).toContain("Whether you choose a home visit or video, your GP or specialist team must confirm it is safe for you to begin physiotherapy before you start.");
  });
  it.each(POSTOP)("keeps the surgical-team readiness alongside the line on %s", async (slug) => {
    const r = await homeVisit(slug);
    expect(r.text).toContain("Whether you choose a home visit or video, rehab with us starts once your surgical team has said you are ready for outpatient or community physiotherapy");
  });
});
