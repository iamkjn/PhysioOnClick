import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import {
  allSelfTestSlugs,
  getCondition,
  getSelfTest,
} from "@/lib/exercise-library";
import { breadcrumbs, selfTestWebPage } from "@/lib/structured-data";
import { ByLine } from "@/components/exercise-library/by-line";
import { SelfTestResults } from "@/components/exercise-library/self-test-results";
import { SelfTestSteps } from "@/components/exercise-library/self-test-steps";
import { TrackedBookLink } from "@/components/tracked-book-link";
import { TrackView } from "@/components/track-view";

// One statically-exported page per self-check test record. Same reasoning as the
// exercise/condition detail routes: without force-static the Worker re-runs the
// (static) lookup on every request. Deliberately no `dynamicParams = false` - on
// OpenNext that 404s every path on deploy (known repo hazard).
export const dynamic = "force-static";

export function generateStaticParams() {
  return allSelfTestSlugs().map((slug) => ({ slug }));
}

// The one disclaimer, verbatim, on every test page. These pages are
// informational triage, not diagnosis (spec 11a "Positioning"). ASCII only.
const DISCLAIMER =
  "This is a guide, not a diagnosis. It cannot rule a problem in or out - a physiotherapist can. If your symptoms are severe, spreading, or you feel unwell, see a doctor.";

/** Trim `text` to one tidy ~155-char sentence for a meta description. Adds
 *  "..." (never the U+2026 glyph) only when it actually truncated. */
function shortSentence(text: string, max = 155): string {
  const clean = text.replace(/\s+/g, " ").trim();
  if (clean.length <= max) return clean;
  const slice = clean.slice(0, max);
  const cut = slice
    .slice(0, slice.lastIndexOf(" "))
    .trimEnd()
    .replace(/[.,;:]$/, "");
  return `${cut || slice.trimEnd()}...`;
}

// Every `whoShouldNotDoThis` string already opens "Do not do this test if ...".
// Strip that lead so it becomes the callout heading and the string does not read
// redundantly; fall back to a neutral heading if the lead is ever absent.
function contraindication(text: string): { heading: string; body: string } {
  const lead = /^do not do this test if\s+/i;
  if (lead.test(text)) {
    return { heading: "Do not do this test if", body: text.replace(lead, "") };
  }
  return { heading: "Before you try this test", body: text };
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const test = getSelfTest(slug);

  if (!test) {
    return {};
  }

  const title = `${test.name} self-check test | PhysioOnClick`;
  const description = shortSentence(test.whatItChecks);

  return {
    title,
    description,
    alternates: { canonical: `/exercises/tests/${slug}` },
    openGraph: {
      type: "article",
      title,
      description,
      url: `/exercises/tests/${slug}`,
      images: [`/self-test-og/${slug}`],
    },
    twitter: {
      card: "summary_large_image",
      images: [`/self-test-og/${slug}`],
    },
  };
}

export default async function SelfTestPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const test = getSelfTest(slug);

  if (!test) {
    notFound();
  }

  const path = `/exercises/tests/${slug}`;
  const hubs = test.conditionSlugs
    .map((conditionSlug) => getCondition(conditionSlug))
    .filter((condition): condition is NonNullable<typeof condition> => condition !== null);
  const noGo = contraindication(test.whoShouldNotDoThis);

  return (
    <div className="site-shell">
      <TrackView event="library_selftest_view" slug={test.slug} />
      {/* MedicalWebPage + BreadcrumbList only. NOT MedicalTest / Medical
          Guideline / HowTo - this content is triage, not a validated clinical
          instrument (spec 11a "Schema"). */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(selfTestWebPage(test, path)),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            breadcrumbs([
              { name: "Home", path: "/" },
              { name: "Exercises", path: "/exercises" },
              { name: "Self-checks", path: "/exercises/tests" },
              { name: test.name, path },
            ]),
          ),
        }}
      />

      <nav aria-label="Breadcrumb">
        <Link href="/">Home</Link>
        <span className="muted" aria-hidden="true">
          {" "}
          /{" "}
        </span>
        <Link href="/exercises">Exercises</Link>
        <span className="muted" aria-hidden="true">
          {" "}
          /{" "}
        </span>
        <Link href="/exercises/tests">Self-checks</Link>
        <span className="muted" aria-hidden="true">
          {" "}
          /{" "}
        </span>
        <span className="muted" aria-current="page">
          {test.name}
        </span>
      </nav>

      <section className="simple-page-hero">
        <span className="eyebrow">Self-check test</span>
        <h1>{test.name}</h1>
        {test.aka?.length ? (
          <p className="muted">Also known as {test.aka.join(", ")}.</p>
        ) : null}
        <p className="exlib-selftest-checks">
          <strong>Checks:</strong> {test.assesses}
        </p>
      </section>

      <section className="page-section stack exlib-selftest">
        <ByLine reviewedOn={test.reviewedOn} />

        <div className="exlib-selftest__prose">
          <h2>What this checks</h2>
          <p>{test.whatItChecks}</p>
        </div>

        {/* Coral tint. Sits before the steps so a skim reader meets the
            contraindications first. */}
        <div className="exlib-selftest-nogo" data-do-not>
          <h2 className="exlib-selftest-nogo__title">{noGo.heading}</h2>
          <p>{noGo.body}</p>
        </div>

        <div className="exlib-selftest__prose">
          <h2>How to do it</h2>
          <SelfTestSteps steps={test.steps} testName={test.name} />
        </div>

        <div className="exlib-selftest__prose">
          <h2>What your result means</h2>
          <SelfTestResults
            negative={test.negativeResult}
            positive={test.positiveResult}
            tips={test.tips}
          />
        </div>

        <div className="exlib-selftest__prose">
          <h2>How to read this</h2>
          <p>{test.interpretation}</p>
          <p className="exlib-selftest-disclaimer" data-disclaimer>
            {DISCLAIMER}
          </p>
        </div>

        {hubs.length ? (
          <div className="exlib-selftest__prose">
            <h2>Points towards</h2>
            <p>
              If your result points to a problem, these condition guides are a
              good place to start reading.
            </p>
            <ul className="exlib-selftest-hubs">
              {hubs.map((hub) => (
                <li key={hub.slug}>
                  <Link className="pill-link" href={`/exercises/for/${hub.slug}`}>
                    {hub.name} exercises
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        <div className="exlib-selftest-cta" data-selftest-cta>
          <h2 className="exlib-selftest-cta__title">Reproduced your pain?</h2>
          <p className="exlib-selftest-cta__body">
            A positive result is worth getting looked at. Book an online
            assessment with an HCPC-registered physiotherapist, wherever you are
            in the UK.
          </p>
          <TrackedBookLink
            className="button primary"
            href="/book"
            serviceSlug="musculoskeletal-physiotherapy"
            source="self-test"
            event="library_selftest_cta_click"
            params={{ slug: test.slug }}
          >
            Book an online assessment
          </TrackedBookLink>
        </div>
      </section>

      <section className="simple-cta-band">
        <div className="site-shell simple-cta-inner">
          <span className="eyebrow">Not sure what your result means?</span>
          <h2>Get it checked properly</h2>
          <p>
            Book an online assessment with an HCPC-registered physiotherapist and
            get a clear answer and a plan matched to your problem.
          </p>
          <TrackedBookLink
            className="button secondary cta-white"
            href="/book"
            serviceSlug="cta_band"
            source="self-test-cta-band"
          >
            Book assessment
          </TrackedBookLink>
        </div>
      </section>
    </div>
  );
}
