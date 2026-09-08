import type { Metadata } from "next";
import Link from "next/link";

import {
  allConditionSlugs,
  bodyAreas,
  getCondition,
  getExerciseBySlug,
  librarySearchIndex,
  programForCondition,
} from "@/lib/exercise-library";
import { breadcrumbs } from "@/lib/structured-data";
import { ConditionCard } from "@/components/exercise-library/condition-card";
import { ExerciseCard } from "@/components/exercise-library/exercise-card";
import { LibrarySearch } from "@/components/exercise-library/library-search";
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
  const areas = bodyAreas();
  const featured = FEATURED_SLUGS.map((slug) => getExerciseBySlug(slug)).filter(
    (exercise): exercise is NonNullable<typeof exercise> => exercise !== null,
  );

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
          Exercises you save while browsing the library show up here and in the
          plan tray at the bottom of the screen, so you can open them again in
          one place.
        </p>
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
          {areas.map((area) => (
            <li key={area}>
              <Link
                className="exlib-chip"
                href={`/exercises/area/${encodeURIComponent(area)}`}
              >
                {area}
              </Link>
            </li>
          ))}
        </ul>
      </section>

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
