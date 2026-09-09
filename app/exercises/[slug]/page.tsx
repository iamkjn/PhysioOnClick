import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import {
  conditionsForExercise,
  EXERCISE_LIBRARY_REVIEWED_ON,
  getExerciseBySlug,
  allExerciseSlugs,
  relatedExercises,
} from "@/lib/exercise-library";
import { formatDosage, resolveDosage } from "@/lib/exercises";
import { breadcrumbs, exerciseWebPage } from "@/lib/structured-data";
import { AddToPlanButton } from "@/components/exercise-library/add-to-plan-button";
import { ByLine } from "@/components/exercise-library/by-line";
import { ExerciseCard } from "@/components/exercise-library/exercise-card";
import { ExerciseImage } from "@/components/exercise-image";
import { ExerciseVideo } from "@/components/exercise-library/exercise-video";
import { Reveal } from "@/components/reveal";
import { TrackedBookLink } from "@/components/tracked-book-link";
import { TrackView } from "@/components/track-view";

// One statically-exported page per catalogue exercise. Same reasoning as the
// service and blog detail routes: without force-static the route re-runs the
// (static) catalogue lookup inside the Worker on every request. Deliberately no
// `dynamicParams = false` - on OpenNext that 404s every path on deploy.
export const dynamic = "force-static";

export function generateStaticParams() {
  return allExerciseSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const exercise = getExerciseBySlug(slug);

  if (!exercise) {
    return {};
  }

  const title = `${exercise.title} exercise: how to do it | PhysioOnClick`;
  const description = exercise.setup ?? exercise.description;

  return {
    title,
    description,
    alternates: { canonical: `/exercises/${slug}` },
    openGraph: {
      type: "article",
      title,
      description,
      url: `/exercises/${slug}`,
      images: [`/exercise-og/${slug}`],
    },
    twitter: {
      card: "summary_large_image",
      images: [`/exercise-og/${slug}`],
    },
  };
}

// The safety line is the final `mistakes` entry when it reads as a caution
// ("stop", "seek", "pain", "don't push"); otherwise every mistake renders
// normally and the callout carries a generic caution. Deterministic so the
// static export and the test agree.
const SAFETY_CAUTION = /\b(stop|seek|pain|don'?t push|do not push)\b/i;
const GENERIC_SAFETY =
  "Stop and seek advice if an exercise causes sharp or lasting pain.";

function splitMistakes(mistakes: string[]): {
  ordinary: string[];
  safety: string;
} {
  const last = mistakes[mistakes.length - 1];
  if (last && SAFETY_CAUTION.test(last)) {
    return { ordinary: mistakes.slice(0, -1), safety: last };
  }
  return { ordinary: mistakes, safety: GENERIC_SAFETY };
}

export default async function ExerciseDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const exercise = getExerciseBySlug(slug);

  if (!exercise) {
    notFound();
  }

  const path = `/exercises/${slug}`;
  const hubs = conditionsForExercise(slug);
  const related = relatedExercises(slug, 4);
  const dose = formatDosage(resolveDosage(exercise));
  const { ordinary: ordinaryMistakes, safety: safetyLine } = splitMistakes(
    exercise.mistakes ?? [],
  );

  return (
    <div className="site-shell">
      <TrackView event="library_exercise_view" slug={exercise.slug} />
      {/* Google retired HowTo and FAQPage rich results, so the step list rides
          along inside MedicalWebPage and is rendered as plain semantic HTML
          below. The practitioner node is shared sitewide by @id. */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(exerciseWebPage(exercise, path)),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            breadcrumbs([
              { name: "Home", path: "/" },
              { name: "Exercises", path: "/exercises" },
              { name: exercise.title, path },
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
          {exercise.title}
        </span>
      </nav>

      <section className="simple-page-hero">
        <span className="eyebrow">Exercise library</span>
        <ExerciseImage
          exerciseId={exercise.id}
          name={exercise.title}
          pose={exercise.pose}
          size={128}
        />
        <h1>{exercise.title}</h1>
        {exercise.aka?.length ? (
          <p className="muted">Also known as {exercise.aka.join(", ")}.</p>
        ) : null}
        <p>{exercise.description}</p>

        <ExerciseVideo exercise={exercise} />

        {hubs.length ? (
          <ul
            aria-label="Conditions this exercise helps with"
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "0.5rem",
              listStyle: "none",
              padding: 0,
            }}
          >
            {hubs.map((hub) => (
              <li key={hub.slug}>
                <Link className="pill-link" href={`/exercises/for/${hub.slug}`}>
                  {hub.name}
                </Link>
              </li>
            ))}
          </ul>
        ) : null}

        <p className="muted">
          <strong>Typical dose:</strong> {dose}. Always follow the plan your
          physiotherapist gave you.
        </p>

        <div className="simple-nav-actions">
          <TrackedBookLink
            className="button primary"
            href="/book"
            serviceSlug={exercise.slug}
            source="exercise-page"
            event="library_cta_click"
            params={{ slug: exercise.slug }}
          >
            Book a physiotherapy assessment
          </TrackedBookLink>
          <AddToPlanButton
            exerciseSlug={exercise.slug}
            exerciseTitle={exercise.title}
          />
        </div>
      </section>

      <section className="page-section stack">
        <Reveal direction="up">
          <article className="simple-service-card">
            <h2>How to do it</h2>
            {exercise.setup ? <p>{exercise.setup}</p> : null}

            {exercise.steps?.length ? (
              <ol data-steps>
                {exercise.steps.map((step, i) => (
                  <li key={i}>{step}</li>
                ))}
              </ol>
            ) : null}

            {exercise.cues?.length ? (
              <>
                <h3>Form cues</h3>
                <ul data-cues>
                  {exercise.cues.map((cue, i) => (
                    <li key={i}>{cue}</li>
                  ))}
                </ul>
              </>
            ) : null}

            {ordinaryMistakes.length ? (
              <>
                <h3>Common mistakes</h3>
                <ul data-mistakes>
                  {ordinaryMistakes.map((mistake, i) => (
                    <li key={i}>{mistake}</li>
                  ))}
                </ul>
              </>
            ) : null}

            <p className="muted" data-safety>
              <strong>Safety:</strong> {safetyLine}
            </p>
          </article>
        </Reveal>
      </section>

      {related.length ? (
        <section className="page-section stack">
          <Reveal direction="up">
            <div className="section-heading">
              <h2>Related exercises</h2>
              <p>Other exercises from the library that pair well with this one.</p>
            </div>
          </Reveal>
          <div className="exlib-ex-grid">
            {related.map((item) => (
              <ExerciseCard key={item.slug} exercise={item} />
            ))}
          </div>
        </section>
      ) : null}

      <section className="page-section">
        <ByLine reviewedOn={EXERCISE_LIBRARY_REVIEWED_ON} />
      </section>

      <section className="simple-cta-band">
        <div className="site-shell simple-cta-inner">
          <span className="eyebrow">Not sure this is the right exercise?</span>
          <h2>Get a plan built for you</h2>
          <p>
            Book an online assessment with an HCPC-registered physiotherapist and
            get a rehab plan matched to your condition and stage.
          </p>
          <TrackedBookLink
            className="button secondary cta-white"
            href="/book"
            serviceSlug="cta_band"
            source="exercise-page-cta-band"
          >
            Book assessment
          </TrackedBookLink>
        </div>
      </section>
    </div>
  );
}
