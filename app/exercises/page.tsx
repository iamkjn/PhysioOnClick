import type { Metadata } from "next";
import Link from "next/link";

import {
  allConditionSlugs,
  allSelfTestSlugs,
  BODY_AREAS,
  getCondition,
  getExerciseBySlug,
  getSelfTest,
  librarySearchIndex,
  programForCondition,
} from "@/lib/exercise-library";
import { breadcrumbs } from "@/lib/structured-data";
import { ConditionCard } from "@/components/exercise-library/condition-card";
import { ExerciseCard } from "@/components/exercise-library/exercise-card";
import { LibrarySearch } from "@/components/exercise-library/library-search";
import { SavedPlanList } from "@/components/exercise-library/saved-plan-list";
import { TrackedBookLink } from "@/components/tracked-book-link";

// The library index is one static page: it reads only the static catalogue, so
// without force-static the Worker would re-run every lookup per request.
// Deliberately no `dynamicParams = false` - on OpenNext that 404s every path on
// deploy (known repo hazard). No generateStaticParams: this route has no params.
export const dynamic = "force-static";

const DESCRIPTION =
  "Staged home-exercise programmes and single-exercise guides, drafted and clinically reviewed by an HCPC-registered physiotherapist. Browse by condition or body area.";

export function generateMetadata(): Metadata {
  const title = "Exercise library | PhysioOnClick";
  return {
    title,
    description: DESCRIPTION,
    alternates: { canonical: "/exercises" },
    openGraph: {
      type: "website",
      title,
      description: DESCRIPTION,
      url: "/exercises",
    },
  };
}

// Well-known exercises with broad appeal, each verified against lib/exercises.ts.
// A missing slug is dropped rather than rendering a broken card.
const FEATURED_SLUGS = [
  "mckenzie-press-up",
  "bird-dog",
  "dead-bug",
  "hip-bridge",
  "chin-tuck",
];

function countExercises(slug: string): number {
  return programForCondition(slug).reduce(
    (total, stage) => total + stage.exercises.length,
    0,
  );
}

export default function ExerciseLibraryIndexPage() {
  const conditionHubs = allConditionSlugs()
    .map((slug) => getCondition(slug))
    .filter((condition): condition is NonNullable<typeof condition> =>
      condition !== null,
    );
  const featured = FEATURED_SLUGS.map((slug) => getExerciseBySlug(slug)).filter(
    (exercise): exercise is NonNullable<typeof exercise> => exercise !== null,
  );
  const selfTests = allSelfTestSlugs()
    .map((slug) => getSelfTest(slug))
    .filter((test): test is NonNullable<typeof test> => test !== null);

  return (
    <div className="site-shell">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            breadcrumbs([
              { name: "Home", path: "/" },
              { name: "Exercise library", path: "/exercises" },
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
        <span className="muted" aria-current="page">
          Exercise library
        </span>
      </nav>

      <section className="simple-page-hero">
        <span className="eyebrow">Exercise library</span>
        <h1>Exercise library</h1>
        <p>
          Clear, step-by-step physiotherapy exercises and staged recovery
          programmes for common aches, injuries and operations.
        </p>
        <p>
          Every exercise here is drafted to a shared house style and then
          clinically reviewed by an HCPC-registered physiotherapist before we
          publish it. It is a starting point, not a diagnosis. Always worth
          getting assessed if you&apos;re not sure what is going on or what is
          safe for you.{" "}
          <TrackedBookLink
            href="/book"
            serviceSlug="musculoskeletal-physiotherapy"
            source="exercise-library-hero"
          >
            Book an online assessment
          </TrackedBookLink>
          .
        </p>
      </section>

      <section className="exlib-index-section">
        <LibrarySearch items={librarySearchIndex()} />
      </section>

      <section className="exlib-index-section" id="my-plan">
        <h2>Your saved exercises</h2>
        <p className="muted">
          Exercises you save while browsing show up here. This list lives in
          this browser - sign in and book to turn it into a plan your
          physiotherapist can see.
        </p>
        <SavedPlanList items={librarySearchIndex().exercises} />
      </section>

      <section className="exlib-index-section">
        <div className="section-heading">
          <h2>Browse by condition</h2>
          <p>
            Staged programmes that take you from the early, sore phase through to
            getting back to full activity.
          </p>
        </div>
        <div className="exlib-cond-grid">
          {conditionHubs.map((condition) => (
            <ConditionCard
              key={condition.slug}
              condition={condition}
              exerciseCount={countExercises(condition.slug)}
            />
          ))}
        </div>
      </section>

      <section className="exlib-index-section">
        <div className="section-heading">
          <h2>Browse by body area</h2>
          <p>Jump straight to the exercises and programmes for one part of the body.</p>
        </div>
        <ul className="exlib-chip-row">
          {BODY_AREAS.map((area) => (
            <li key={area.key}>
              <Link className="exlib-chip" href={`/exercises/area/${area.key}`}>
                {area.label}
              </Link>
            </li>
          ))}
        </ul>
      </section>

      {selfTests.length ? (
        <section className="exlib-index-section">
          <div className="section-heading">
            <h2>Self-check tests</h2>
            <p>
              Quick movement tests you can try at home to see what your symptoms
              might point towards - a guide, not a diagnosis.
            </p>
          </div>
          <ul className="exlib-chip-row">
            {selfTests.map((test) => (
              <li key={test.slug}>
                <Link
                  className="exlib-chip"
                  href={`/exercises/tests/${test.slug}`}
                >
                  {test.name}
                </Link>
              </li>
            ))}
          </ul>
          <p className="exlib-selfcheck__index-link">
            <Link href="/exercises/tests">See all self-check tests</Link>
          </p>
        </section>
      ) : null}

      <section className="exlib-index-section">
        <div className="section-heading">
          <h2>Featured exercises</h2>
          <p>A handful of the exercises physiotherapists prescribe most often.</p>
        </div>
        <div className="exlib-ex-grid">
          {featured.map((exercise) => (
            <ExerciseCard key={exercise.slug} exercise={exercise} />
          ))}
        </div>
      </section>

      <section className="exlib-index-section exlib-index-section--links">
        <p className="muted">
          Want to know how this library is put together and reviewed? Read{" "}
          <Link href="/exercises/how-we-make-this">how we make this library</Link>.
        </p>
      </section>

      <section className="simple-cta-band">
        <div className="site-shell simple-cta-inner">
          <span className="eyebrow">Not sure where to start?</span>
          <h2>Get a plan built for you</h2>
          <p>
            Book an online assessment with an HCPC-registered physiotherapist and
            get a rehab plan matched to your condition and stage, wherever you
            are in the UK.
          </p>
          <TrackedBookLink
            className="button secondary cta-white"
            href="/book"
            serviceSlug="musculoskeletal-physiotherapy"
            source="exercise-library-index"
          >
            Book assessment
          </TrackedBookLink>
        </div>
      </section>
    </div>
  );
}
