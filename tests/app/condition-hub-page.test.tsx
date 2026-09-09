import { describe, expect, it } from "vitest";
import { render } from "@testing-library/react";

// Next.js <Link> renders as a plain <a> in tests - no mock needed.
import ConditionHubPage, {
  generateMetadata,
  generateStaticParams,
} from "@/app/exercises/for/[condition]/page";
import {
  allConditionSlugs,
  getCondition,
  programForCondition,
  selfTestsForCondition,
} from "@/lib/exercise-library";

// rotator-cuff-tendinopathy is the first catalogue record: a full multi-stage
// programme, three condition-specific red flags plus the shared set, a
// serviceSlug, two relatedConditionSlugs and five FAQs.
const SLUG = "rotator-cuff-tendinopathy";
const condition = getCondition(SLUG)!;

async function renderPage(conditionSlug: string) {
  const ui = await ConditionHubPage({
    params: Promise.resolve({ condition: conditionSlug }),
  });
  return render(ui);
}

describe("app/exercises/for/[condition] generateStaticParams", () => {
  it("emits one { condition } object per condition record", () => {
    const params = generateStaticParams();
    expect(params).toHaveLength(allConditionSlugs().length);
    expect(params).toEqual(
      allConditionSlugs().map((conditionSlug) => ({ condition: conditionSlug })),
    );
  });
});

describe("app/exercises/for/[condition] page", () => {
  it("renders '<name> exercises' as the h1", async () => {
    const { container } = await renderPage(SLUG);
    expect(container.querySelector("h1")?.textContent).toBe(
      `${condition.name} exercises`,
    );
  });

  it("puts the <h1> before the CTA rail's <h2> in the heading outline", async () => {
    const { container } = await renderPage(SLUG);

    // The first heading anywhere in the hub must be the page <h1>, not the
    // rail's "Want this checked by a physiotherapist?" <h2>.
    const firstHeading = container.querySelector("h1, h2, h3");
    expect(firstHeading?.tagName).toBe("H1");

    const h1 = container.querySelector("h1")!;
    const railHeading = container.querySelector(".exlib-hub__rail h2")!;
    expect(railHeading).not.toBeNull();
    expect(
      h1.compareDocumentPosition(railHeading) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
  });

  it("renders the intro and who-it-helps copy as paragraphs", async () => {
    const { container } = await renderPage(SLUG);
    for (const source of [condition.intro, condition.whoItHelps]) {
      for (const para of source.split(/\n\n+/).map((p) => p.trim())) {
        expect(container).toHaveTextContent(para);
      }
    }
  });

  it("puts a [data-red-flags] region listing every red flag BEFORE the first stage", async () => {
    const { container } = await renderPage(SLUG);

    const redFlags = container.querySelector("[data-red-flags]");
    expect(redFlags).not.toBeNull();
    for (const flag of condition.redFlags) {
      expect(redFlags).toHaveTextContent(flag);
    }

    const firstStage = container.querySelector(".exlib-stage");
    expect(firstStage).not.toBeNull();
    // firstStage must FOLLOW the red-flags box in document order.
    expect(
      redFlags!.compareDocumentPosition(firstStage!) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
  });

  it("renders a [data-self-checks] block, before the first stage, for a condition with self-tests", async () => {
    // rotator-cuff-tendinopathy maps to Full Can + Hawkins-Kennedy + Painful Arc.
    const tests = selfTestsForCondition(SLUG);
    expect(tests.length).toBeGreaterThan(0);

    const { container } = await renderPage(SLUG);
    const block = container.querySelector("[data-self-checks]");
    expect(block).not.toBeNull();

    for (const test of tests) {
      expect(
        block!.querySelector(`a[href="/exercises/tests/${test.slug}"]`),
        `missing self-check link for ${test.slug}`,
      ).not.toBeNull();
    }
    expect(
      block!.querySelector('a[href="/exercises/tests/full-can-test"]'),
    ).not.toBeNull();

    const firstStage = container.querySelector(".exlib-stage");
    expect(firstStage).not.toBeNull();
    expect(
      block!.compareDocumentPosition(firstStage!) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
  });

  it("omits the [data-self-checks] block for a condition with no self-tests", async () => {
    const noTestsSlug = "after-hip-replacement";
    expect(selfTestsForCondition(noTestsSlug)).toHaveLength(0);

    const { container } = await renderPage(noTestsSlug);
    expect(container.querySelector("[data-self-checks]")).toBeNull();
  });

  it("renders one stage block per program entry, each carrying its blurb and its exercise cards", async () => {
    const { container } = await renderPage(SLUG);
    const stages = container.querySelectorAll(".exlib-stage");
    expect(stages).toHaveLength(condition.program.length);
    const program = programForCondition(SLUG);
    condition.program.forEach((stage, index) => {
      expect(stages[index]).toHaveTextContent(stage.blurb);
      // every exercise in the stage renders as a card linking to its page
      for (const exercise of program[index].exercises) {
        expect(
          stages[index].querySelector(`a[href="/exercises/${exercise.slug}"]`),
        ).not.toBeNull();
      }
    });
  });

  it("does not render its own <main> landmark (the layout owns the only one)", async () => {
    const { container } = await renderPage(SLUG);
    expect(container.querySelectorAll("main")).toHaveLength(0);
  });

  it("shows the recovery-timeline and progress-guidance copy", async () => {
    const { container } = await renderPage(SLUG);
    expect(container).toHaveTextContent(condition.recoveryTimeline);
    expect(container).toHaveTextContent(condition.progressGuidance);
  });

  it("renders a <details>/<summary> per FAQ", async () => {
    const { container } = await renderPage(SLUG);
    const details = container.querySelectorAll("details");
    expect(details).toHaveLength(condition.faqs.length);
    condition.faqs.forEach((faq, index) => {
      expect(details[index].querySelector("summary")).toHaveTextContent(faq.q);
    });
  });

  it("renders a TrackedBookLink to /book showing the online 'from' price", async () => {
    const { container } = await renderPage(SLUG);
    expect(container.querySelector('a[href="/book"]')).not.toBeNull();
    expect(container).toHaveTextContent("from £40");
  });

  it("renders a ConditionPdfForm with an email field and a honeypot", async () => {
    const { container } = await renderPage(SLUG);
    expect(container.querySelector('input[type="email"]')).not.toBeNull();
    const honeypot = container.querySelector('input[name="website"]');
    expect(honeypot).not.toBeNull();
    expect(honeypot).toHaveAttribute("tabindex", "-1");
  });

  it("links to every related condition hub and to the service page", async () => {
    const { container } = await renderPage(SLUG);
    for (const rel of condition.relatedConditionSlugs ?? []) {
      expect(
        container.querySelector(`a[href="/exercises/for/${rel}"]`),
        `missing related-hub link for ${rel}`,
      ).not.toBeNull();
    }
    expect(
      container.querySelector(`a[href="/services/${condition.serviceSlug}"]`),
    ).not.toBeNull();
  });

  it("emits MedicalWebPage + BreadcrumbList JSON-LD", async () => {
    const { container } = await renderPage(SLUG);
    const blocks = [
      ...container.querySelectorAll('script[type="application/ld+json"]'),
    ].map((node) => JSON.parse(node.textContent || "{}"));

    expect(blocks.some((json) => json["@type"] === "MedicalWebPage")).toBe(true);
    expect(blocks.some((json) => json["@type"] === "BreadcrumbList")).toBe(true);
  });

  it("calls notFound() for an unknown condition slug", async () => {
    await expect(
      ConditionHubPage({ params: Promise.resolve({ condition: "nope" }) }),
    ).rejects.toThrow(/NEXT_HTTP_ERROR_FALLBACK;404/);
  });

  it("gives the first related card the right exercise count", async () => {
    const { container } = await renderPage(SLUG);
    const [rel] = condition.relatedConditionSlugs ?? [];
    if (!rel) return;
    const count = programForCondition(rel).reduce(
      (n, stage) => n + stage.exercises.length,
      0,
    );
    const card = container.querySelector(`a[href="/exercises/for/${rel}"]`);
    expect(card).toHaveTextContent(`${count} exercises`);
  });
});

describe("app/exercises/for/[condition] generateMetadata", () => {
  it("returns the seoTitle/description, a relative canonical and a per-condition OG image", async () => {
    const meta = await generateMetadata({
      params: Promise.resolve({ condition: SLUG }),
    });

    expect(meta.title).toBe(condition.seoTitle);
    expect(meta.description).toBe(condition.seoDescription);
    expect(meta.alternates?.canonical).toBe(`/exercises/for/${SLUG}`);
    expect(JSON.stringify(meta.openGraph?.images)).toContain(
      `/condition-og/${SLUG}`,
    );
  });

  it("returns an empty object for an unknown slug", async () => {
    const meta = await generateMetadata({
      params: Promise.resolve({ condition: "nope" }),
    });
    expect(meta).toEqual({});
  });
});
