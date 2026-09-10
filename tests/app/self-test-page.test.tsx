import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";
import { render } from "@testing-library/react";

// Stub TrackView (a client component that renders null) with a marker element so
// the page's mount-time analytics wiring is assertable in the DOM.
vi.mock("@/components/track-view", () => ({
  TrackView: ({ event, slug }: { event: string; slug: string }) => (
    <span data-testid="track-view" data-event={event} data-slug={slug} />
  ),
}));

// Surface the analytics `event` the CTA is wired with as a DOM attribute so the
// tracking contract is assertable without simulating a click.
vi.mock("@/components/tracked-book-link", () => ({
  TrackedBookLink: ({
    href,
    className,
    event = "service_book_click",
    source,
    children,
  }: {
    href: string;
    className?: string;
    event?: string;
    source: string;
    children: ReactNode;
  }) => (
    <a href={href} className={className} data-event={event} data-source={source}>
      {children}
    </a>
  ),
}));

// Next.js <Link> renders as a plain <a> in tests - no mock needed.
import SelfTestPage, {
  generateMetadata,
  generateStaticParams,
} from "@/app/exercises/tests/[slug]/page";
import TestsIndexPage from "@/app/exercises/tests/page";
import { allSelfTestSlugs, getSelfTest } from "@/lib/exercise-library";

// full-can-test is the first record: four numbered steps, two mapped condition
// hubs (rotator-cuff-tendinopathy + shoulder-impingement) and a full
// contraindication string.
const SLUG = "full-can-test";
const test = getSelfTest(SLUG)!;

async function renderPage(slug: string) {
  const ui = await SelfTestPage({ params: Promise.resolve({ slug }) });
  return render(ui);
}

describe("app/exercises/tests/[slug] generateStaticParams", () => {
  it("emits one { slug } object per self-check test record", () => {
    const params = generateStaticParams();
    expect(params).toHaveLength(allSelfTestSlugs().length);
    expect(params).toEqual(allSelfTestSlugs().map((slug) => ({ slug })));
  });
});

describe("app/exercises/tests/[slug] page", () => {
  it("renders the test name as the h1", async () => {
    const { container } = await renderPage(SLUG);
    expect(container.querySelector("h1")?.textContent).toContain("Full Can Test");
  });

  it("shows the 'Checks:' sub-line", async () => {
    const { container } = await renderPage(SLUG);
    expect(container).toHaveTextContent(`Checks: ${test.assesses}`);
  });

  it("renders every step label inside an ordered list with visible Step markers", async () => {
    const { container } = await renderPage(SLUG);
    expect(container.querySelector("ol")).not.toBeNull();
    for (const step of test.steps) {
      expect(container).toHaveTextContent(step.label);
    }
    for (let i = 1; i <= test.steps.length; i += 1) {
      expect(container).toHaveTextContent(`Step ${i}`);
    }
  });

  it("renders all three result panels, each carrying its first bullet", async () => {
    const { container } = await renderPage(SLUG);

    const negative = container.querySelector('[data-result="negative"]');
    const positive = container.querySelector('[data-result="positive"]');
    const tips = container.querySelector('[data-result="tips"]');

    expect(negative).not.toBeNull();
    expect(positive).not.toBeNull();
    expect(tips).not.toBeNull();

    expect(negative).toHaveTextContent(test.negativeResult[0]);
    expect(positive).toHaveTextContent(test.positiveResult[0]);
    expect(tips).toHaveTextContent(test.tips[0]);
  });

  it("renders the 'do not do this test if' callout with a distinctive phrase", async () => {
    const { container } = await renderPage(SLUG);
    const callout = container.querySelector("[data-do-not]");
    expect(callout).not.toBeNull();
    expect(callout).toHaveTextContent("you feel unwell with the pain");
  });

  it("carries the guide-not-a-diagnosis disclaimer", async () => {
    const { container } = await renderPage(SLUG);
    expect(container).toHaveTextContent("not a diagnosis");
  });

  it("links to every mapped condition hub", async () => {
    const { container } = await renderPage(SLUG);
    for (const slug of test.conditionSlugs) {
      expect(
        container.querySelector(`a[href="/exercises/for/${slug}"]`),
        `missing hub link for ${slug}`,
      ).not.toBeNull();
    }
    expect(
      container.querySelector(`a[href="/exercises/for/rotator-cuff-tendinopathy"]`),
    ).not.toBeNull();
    expect(
      container.querySelector(`a[href="/exercises/for/shoulder-impingement"]`),
    ).not.toBeNull();
  });

  it("renders a TrackedBookLink to /book", async () => {
    const { container } = await renderPage(SLUG);
    expect(container.querySelector('a[href="/book"]')).not.toBeNull();
  });

  it("wires the primary 'Book an online assessment' CTA to the library_selftest_cta_click event", async () => {
    const { container } = await renderPage(SLUG);
    const cta = [...container.querySelectorAll('a[href="/book"]')].find((a) =>
      /Book an online assessment/i.test(a.textContent ?? ""),
    );
    expect(cta).toBeTruthy();
    expect(cta?.getAttribute("data-event")).toBe("library_selftest_cta_click");
    expect(cta?.getAttribute("data-source")).toBe("self-test");
  });

  it("fires a library_selftest_view TrackView for this test on mount", async () => {
    const { container } = await renderPage(SLUG);
    const tracker = container.querySelector('[data-testid="track-view"]');
    expect(tracker).not.toBeNull();
    expect(tracker).toHaveAttribute("data-event", "library_selftest_view");
    expect(tracker).toHaveAttribute("data-slug", SLUG);
  });

  it("emits MedicalWebPage + BreadcrumbList JSON-LD and never a MedicalTest node", async () => {
    const { container } = await renderPage(SLUG);
    const scripts = [
      ...container.querySelectorAll('script[type="application/ld+json"]'),
    ];
    const blocks = scripts.map((node) => JSON.parse(node.textContent || "{}"));

    expect(blocks.some((json) => json["@type"] === "MedicalWebPage")).toBe(true);
    expect(blocks.some((json) => json["@type"] === "BreadcrumbList")).toBe(true);

    for (const node of scripts) {
      expect(node.textContent).not.toContain("MedicalTest");
      expect(node.textContent).not.toContain("MedicalGuideline");
      expect(node.textContent).not.toContain("HowTo");
      expect(node.textContent).not.toContain("FAQPage");
    }
  });

  it("calls notFound() for an unknown slug", async () => {
    await expect(
      SelfTestPage({ params: Promise.resolve({ slug: "nope" }) }),
    ).rejects.toThrow(/NEXT_HTTP_ERROR_FALLBACK;404/);
  });
});

describe("app/exercises/tests/[slug] generateMetadata", () => {
  it("builds a branded title, a relative canonical and a per-test OG image", async () => {
    const meta = await generateMetadata({
      params: Promise.resolve({ slug: SLUG }),
    });

    expect(typeof meta.title).toBe("string");
    expect((meta.title as string).endsWith("| PhysioOnClick")).toBe(true);
    expect(meta.alternates?.canonical).toBe(`/exercises/tests/${SLUG}`);
    expect(JSON.stringify(meta.openGraph?.images)).toContain(
      `/self-test-og/${SLUG}`,
    );
  });

  it("returns an empty object for an unknown slug", async () => {
    const meta = await generateMetadata({
      params: Promise.resolve({ slug: "nope" }),
    });
    expect(meta).toEqual({});
  });
});

describe("app/exercises/tests index page", () => {
  it("renders 'Self-check tests' as the h1", () => {
    const { container } = render(<TestsIndexPage />);
    expect(container.querySelector("h1")?.textContent).toContain(
      "Self-check tests",
    );
  });

  it("links to every self-check test exactly once", () => {
    const { container } = render(<TestsIndexPage />);
    for (const slug of allSelfTestSlugs()) {
      const links = container.querySelectorAll(
        `a[href="/exercises/tests/${slug}"]`,
      );
      expect(links.length, `card link for ${slug}`).toBe(1);
    }
  });

  it("carries the guide-not-a-diagnosis disclaimer", () => {
    const { container } = render(<TestsIndexPage />);
    expect(container).toHaveTextContent("not a diagnosis");
  });
});
