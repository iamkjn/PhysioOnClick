import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import {
  bodyAreas,
  conditionsByBodyArea,
  exercisesByBodyArea,
  programForCondition,
} from "@/lib/exercise-library";
import { ConditionCard } from "@/components/exercise-library/condition-card";
import { ExerciseCard } from "@/components/exercise-library/exercise-card";
import { TrackedBookLink } from "@/components/tracked-book-link";

// One statically-exported page per body area. Same reasoning as the exercise and
// condition detail routes: without force-static the Worker re-runs the (static)
// catalogue lookup on every request. Deliberately no `dynamicParams = false` -
// on OpenNext that 404s every path on deploy (known repo hazard).
export const dynamic = "force-static";

export function generateStaticParams() {
  return bodyAreas().map((bodyArea) => ({ bodyArea }));
}

/** The decoded body area for `params`, or `null` when it is not a known area. */
function resolveArea(bodyArea: string): string | null {
  let decoded: string;
  try {
    decoded = decodeURIComponent(bodyArea);
  } catch {
    return null;
  }
  return bodyAreas().includes(decoded) ? decoded : null;
}

function countExercises(slug: string): number {
  return programForCondition(slug).reduce(
    (total, stage) => total + stage.exercises.length,
    0,
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ bodyArea: string }>;
}): Promise<Metadata> {
  const { bodyArea } = await params;
  const area = resolveArea(bodyArea);

  if (!area) {
    return {};
  }

  const title = `${area} exercises | PhysioOnClick`;
  const description = `Physiotherapy exercises and staged recovery programmes for the ${area.toLowerCase()} area, drafted and clinically reviewed by an HCPC-registered physiotherapist.`;

  return {
    title,
    description,
    // Thin filter pages: point the canonical at the library index rather than
    // letting each area URL compete for the same content (spec 5.4).
    alternates: { canonical: "/exercises" },
    openGraph: {
      type: "website",
      title,
      description,
      url: "/exercises",
    },
  };
}

export default async function ExerciseAreaPage({
  params,
}: {
  params: Promise<{ bodyArea: string }>;
}) {
  const { bodyArea } = await params;
  const area = resolveArea(bodyArea);

  if (!area) {
    notFound();
  }

  const areaExercises = exercisesByBodyArea(area);
  const areaConditions = conditionsByBodyArea(area);

  return (
    <div className="site-shell">
      <nav aria-label="Breadcrumb">
        <Link href="/">Home</Link>
        <span className="muted" aria-hidden="true">
          {" "}
          /{" "}
        </span>
        <Link href="/exercises">Exercise library</Link>
        <span className="muted" aria-hidden="true">
          {" "}
          /{" "}
        </span>
        <span className="muted" aria-current="page">
          {area}
        </span>
      </nav>

      <section className="simple-page-hero">
        <span className="eyebrow">Exercise library</span>
        <h1>{area} exercises</h1>
        <p>
          Single-exercise guides and staged recovery programmes for the{" "}
          {area.toLowerCase()} area. Every one is clinically reviewed by an
          HCPC-registered physiotherapist.
        </p>
      </section>

      <section className="exlib-index-section">
        <div className="section-heading">
          <h2>Individual exercises</h2>
        </div>
        {areaExercises.length ? (
          <div className="exlib-ex-grid">
            {areaExercises.map((exercise) => (
              <ExerciseCard key={exercise.slug} exercise={exercise} />
            ))}
          </div>
        ) : (
          <p className="muted">
            No individual exercises listed for this area yet - see the condition
            programmes below.
          </p>
        )}
      </section>

      {areaConditions.length ? (
        <section className="exlib-index-section">
          <div className="section-heading">
            <h2>Recovery programmes</h2>
            <p>Staged home-exercise programmes for conditions in this area.</p>
          </div>
          <div className="exlib-cond-grid">
            {areaConditions.map((condition) => (
              <ConditionCard
                key={condition.slug}
                condition={condition}
                exerciseCount={countExercises(condition.slug)}
              />
            ))}
          </div>
        </section>
      ) : null}

      <section className="exlib-index-section exlib-index-section--links">
        <p className="muted">
          <Link href="/exercises">Back to the full exercise library</Link>
        </p>
      </section>

      <section className="simple-cta-band">
        <div className="site-shell simple-cta-inner">
          <span className="eyebrow">Not sure which exercises are right?</span>
          <h2>Get a plan built for you</h2>
          <p>
            Book an online assessment with an HCPC-registered physiotherapist and
            get a rehab plan matched to your condition and stage.
          </p>
          <TrackedBookLink
            className="button secondary cta-white"
            href="/book"
            serviceSlug="musculoskeletal-physiotherapy"
            source="exercise-library-area"
          >
            Book assessment
          </TrackedBookLink>
        </div>
      </section>
    </div>
  );
}
