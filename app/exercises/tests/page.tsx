import type { Metadata } from "next";
import Link from "next/link";

import { allSelfTestSlugs, getSelfTest } from "@/lib/exercise-library";
import type { SelfTest } from "@/lib/exercise-library";
import { breadcrumbs } from "@/lib/structured-data";
import { TrackedBookLink } from "@/components/tracked-book-link";

// The self-check index is one static page: it reads only the static records, so
// without force-static the Worker would re-run every lookup per request.
// Deliberately no `dynamicParams = false` - on OpenNext that 404s every path on
// deploy (known repo hazard). No generateStaticParams: this route has no params.
export const dynamic = "force-static";

const DESCRIPTION =
  "Simple, safe movement tests you can try at home to see what your symptoms might point towards. A guide, not a diagnosis - a positive result is your cue to get assessed.";

// Informational triage, not diagnosis (spec 11a "Positioning"). ASCII only.
const DISCLAIMER =
  "This is a guide, not a diagnosis. These tests cannot rule a problem in or out - a physiotherapist can. If your symptoms are severe, spreading, or you feel unwell, see a doctor.";

export function generateMetadata(): Metadata {
  const title = "Self-check tests | PhysioOnClick";
  return {
    title,
    description: DESCRIPTION,
    alternates: { canonical: "/exercises/tests" },
    openGraph: {
      type: "website",
      title,
      description: DESCRIPTION,
      url: "/exercises/tests",
    },
  };
}

/** Group the tests by `bodyArea`, keeping both the areas and the tests within
 *  them in source order so the static export is stable across builds. */
function groupByBodyArea(
  tests: SelfTest[],
): { area: string; tests: SelfTest[] }[] {
  const groups: { area: string; tests: SelfTest[] }[] = [];
  for (const test of tests) {
    let group = groups.find((entry) => entry.area === test.bodyArea);
    if (!group) {
      group = { area: test.bodyArea, tests: [] };
      groups.push(group);
    }
    group.tests.push(test);
  }
  return groups;
}

function lowerFirst(text: string): string {
  return text.charAt(0).toLowerCase() + text.slice(1);
}

export default function SelfTestsIndexPage() {
  const tests = allSelfTestSlugs()
    .map((slug) => getSelfTest(slug))
    .filter((test): test is NonNullable<typeof test> => test !== null);
  const groups = groupByBodyArea(tests);

  return (
    <div className="site-shell">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            breadcrumbs([
              { name: "Home", path: "/" },
              { name: "Exercises", path: "/exercises" },
              { name: "Self-checks", path: "/exercises/tests" },
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
        <span className="muted" aria-current="page">
          Self-checks
        </span>
      </nav>

      <section className="simple-page-hero">
        <span className="eyebrow">Exercise library</span>
        <h1>Self-check tests</h1>
        <p>
          Simple movement tests a physiotherapist might use, written so you can
          try them safely at home. Each one shows you what a normal result and a
          possible-problem result look like, and points you to the right next
          step.
        </p>
        <p className="exlib-selftest-disclaimer">{DISCLAIMER}</p>
      </section>

      {groups.map((group) => (
        <section className="exlib-index-section" key={group.area}>
          <div className="section-heading">
            <h2>{group.area}</h2>
          </div>
          <div className="exlib-cond-grid">
            {group.tests.map((test) => (
              <a
                key={test.slug}
                href={`/exercises/tests/${test.slug}`}
                className="exlib-cond-card"
              >
                <span className="exlib-cond-card__area">{test.bodyArea}</span>
                <span className="exlib-cond-card__name">{test.name}</span>
                <p className="exlib-cond-card__desc">
                  Checks {lowerFirst(test.assesses)}.
                </p>
              </a>
            ))}
          </div>
        </section>
      ))}

      <section className="exlib-index-section exlib-index-section--links">
        <p className="muted">
          <Link href="/exercises">Back to the full exercise library</Link>
        </p>
      </section>

      <section className="simple-cta-band">
        <div className="site-shell simple-cta-inner">
          <span className="eyebrow">Not sure what your result means?</span>
          <h2>Get it checked properly</h2>
          <p>
            Book an online assessment with an HCPC-registered physiotherapist and
            get a clear answer and a plan matched to your problem, wherever you
            are in the UK.
          </p>
          <TrackedBookLink
            className="button secondary cta-white"
            href="/book"
            serviceSlug="musculoskeletal-physiotherapy"
            source="self-test-index"
          >
            Book assessment
          </TrackedBookLink>
        </div>
      </section>
    </div>
  );
}
