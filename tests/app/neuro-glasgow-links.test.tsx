import { describe, expect, it } from "vitest";
import { render } from "@testing-library/react";

import ServicePage, { generateMetadata } from "@/app/services/[slug]/page";
import ExercisePage from "@/app/exercises/[slug]/page";
import OnlinePhysioPage from "@/app/online-physiotherapy-for/[slug]/page";
import AreaPage from "@/app/exercises/area/[bodyArea]/page";
import { exercises } from "@/lib/exercises";
import { APPOINTMENT_HOURS_SENTENCE } from "@/lib/appointment-hours";
import { HOME_VISIT_AREA_LABEL } from "@/lib/home-visit";
import { homeVisitPrices } from "@/lib/home-visit-pricing";

// "neurological physiotherapy glasgow" and its variants are the site's main
// local searches; these pin the page that ranks for them and the links into it.
const NEURO = "/services/neurological-rehabilitation";

describe("neuro physiotherapy Glasgow page", () => {
  it("leads the title with the searched phrase", async () => {
    const meta = await generateMetadata({ params: Promise.resolve({ slug: "neurological-rehabilitation" }) });
    expect(meta.title).toMatch(/^Neurological Physiotherapy Glasgow/);
  });

  it("has a home-visits-across-Glasgow section built from the shared area, hours and prices", async () => {
    const { container } = render(
      await ServicePage({ params: Promise.resolve({ slug: "neurological-rehabilitation" }) }),
    );
    const section = container.querySelector("#glasgow-home-visits")?.closest("section");
    expect(section).not.toBeNull();
    expect(section).toHaveTextContent(HOME_VISIT_AREA_LABEL);
    expect(section).toHaveTextContent(APPOINTMENT_HOURS_SENTENCE);
    expect(section).toHaveTextContent(`${homeVisitPrices.initial} for the home assessment`);
    expect(section).toHaveTextContent(/GP or specialist team must confirm/);
    expect(section?.querySelector('a[href="/book?visit=home"]')).not.toBeNull();
  });

  it("is the only service page with that section", async () => {
    const { container } = render(
      await ServicePage({ params: Promise.resolve({ slug: "musculoskeletal-physiotherapy" }) }),
    );
    expect(container.querySelector("#glasgow-home-visits")).toBeNull();
  });
});

describe("links into the neuro Glasgow page", () => {
  it("neuro exercise pages link to it, other exercises don't", async () => {
    const neuro = exercises.find((e) => e.clinicalArea === "neuro" && !e.retired)!;
    const other = exercises.find((e) => e.clinicalArea === "lower_limb" && !e.retired)!;
    const a = render(await ExercisePage({ params: Promise.resolve({ slug: neuro.slug }) }));
    expect(a.container.querySelector(`.exlib-next-step a[href="${NEURO}"]`)?.textContent).toMatch(/in Glasgow/);
    a.unmount();
    const b = render(await ExercisePage({ params: Promise.resolve({ slug: other.slug }) }));
    expect(b.container.querySelector(`.exlib-next-step a[href="${NEURO}"]`)).toBeNull();
  });

  it("the neuro condition pages link to it from the home-visit paragraph", async () => {
    for (const slug of ["stroke-rehabilitation", "parkinsons", "multiple-sclerosis", "functional-neurological-disorder"]) {
      const { container, unmount } = render(await OnlinePhysioPage({ params: Promise.resolve({ slug }) }));
      expect(container.querySelector(`[data-home-visit] a[href="${NEURO}"]`), slug).not.toBeNull();
      unmount();
    }
    const { container } = render(await OnlinePhysioPage({ params: Promise.resolve({ slug: "knee-pain" }) }));
    expect(container.querySelector(`[data-home-visit] a[href="${NEURO}"]`)).toBeNull();
  });

  it("the neuro exercise area page links to it", async () => {
    const { container } = render(await AreaPage({ params: Promise.resolve({ bodyArea: "neuro" }) }));
    expect(container.querySelector(`[data-neuro-local] a[href="${NEURO}"]`)).not.toBeNull();
  });
});
