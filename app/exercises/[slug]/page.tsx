import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import {
  conditionsForExercise,
  EXERCISE_LIBRARY_REVIEWED_ON,
  getExerciseBySlug,
  allExerciseSlugs,
  programmesForExercise,
  relatedExercises,
} from "@/lib/exercise-library";
import { formatDosage, hasPrescribedDose, resolveDosage } from "@/lib/exercises";
import { splitMistakes } from "@/lib/exercise-safety-line";
import { initialAssessmentPrice } from "@/lib/site-data";
import { breadcrumbs, exerciseWebPage } from "@/lib/structured-data";
import { AddToPlanButton } from "@/components/exercise-library/add-to-plan-button";
import { ByLine } from "@/components/exercise-library/by-line";
import { ExerciseCard } from "@/components/exercise-library/exercise-card";
import { ExerciseSafetyNote } from "@/components/exercise-library/exercise-safety-note";
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

  // These pages already rank on page 1 for exercise-name queries but earn few
  // clicks, so the snippet promises what the searcher wants: the how-to plus
  // the dose (sets/reps), from a named professional.
  const dosage = resolveDosage(exercise);
  const name = /exercise$/i.test(exercise.title) ? exercise.title : `${exercise.title} exercise`;
  const title = `${name}: how-to${hasPrescribedDose(dosage) ? ", sets & reps" : " guide"} | PhysioOnClick`;
  const description = hasPrescribedDose(dosage)
    ? `How to do the ${exercise.title}: steps, form cues, common mistakes and typical dose (${formatDosage(dosage)}). By an HCPC-registered physio.`
    : `How to do the ${exercise.title}: steps, form cues and common mistakes. By an HCPC-registered physiotherapist.`;

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
  const programmes = programmesForExercise(slug);
  const helpsWith = exercise.helpsWith ?? [];
  const dose = formatDosage(resolveDosage(exercise));
  const bookingHref = `/book?service=initial-assessment&source=exercise-detail&exercise=${encodeURIComponent(exercise.slug)}&body_part=${encodeURIComponent(exercise.bodyPart)}`;
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

      <section className="exlib-detail-hero">
        <div className="exlib-detail-hero__media">
          <ExerciseImage
            exerciseId={exercise.id}
            name={exercise.title}
            pose={exercise.pose}
            size={640}
            className="exlib-detail-hero__image"
            variant="full"
            decorative={false}
          />
        </div>

        <div className="exlib-detail-hero__copy">
          <span className="eyebrow">Exercise library</span>
          <h1>{exercise.title}</h1>
          {exercise.aka?.length ? (
            <p className="muted">Also known as {exercise.aka.join(", ")}.</p>
          ) : null}
          <p>{exercise.description}</p>

          <ExerciseVideo exercise={exercise} />

          <dl className="exlib-detail-hero__facts">
            <div>
              <dt>Area</dt>
              <dd>{exercise.bodyPart}</dd>
            </div>
            <div>
              <dt>Stage</dt>
              <dd>{exercise.stage}</dd>
            </div>
            <div>
              <dt>Equipment</dt>
              <dd>
                {exercise.equipment?.length
                  ? exercise.equipment.join(", ")
                  : "No equipment"}
              </dd>
            </div>
          </dl>

          {helpsWith.length ? (
            <ul
              data-helps-with
              aria-label="What this exercise helps with"
              className="exlib-ex-page__chips"
            >
              {helpsWith.map((item) => (
                <li key={item} className="exlib-ex-page__chip">
                  {item}
                </li>
              ))}
            </ul>
          ) : null}

          {hubs.length ? (
            <ul
              aria-label="Conditions this exercise helps with"
              className="exlib-detail-hero__hub-list"
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
            <strong>Typical dose:</strong> {dose}. This is a general starting
            point, not a plan matched to your condition or stage.
          </p>

          <div className="exlib-detail-hero__actions">
            <TrackedBookLink
              className="button primary"
              href={bookingHref}
              serviceSlug="initial-assessment"
              source="exercise-page"
              event="library_cta_click"
              params={{ slug: exercise.slug }}
              growthEvent="exercise_booking_intent"
              growthParams={{
                exercise_slug: exercise.slug,
                exercise_title: exercise.title,
                body_part: exercise.bodyPart,
                stage: exercise.stage,
                booking_context: "exercise_detail_primary",
              }}
            >
              Check if this is right for me
            </TrackedBookLink>
            <AddToPlanButton
              exerciseSlug={exercise.slug}
              exerciseTitle={exercise.title}
            />
          </div>
        </div>
      </section>

      <section className="page-section stack">
        <Reveal direction="up">
          <article className="simple-service-card">
            <h2>How to do it</h2>
            <p className="muted exlib-ex-page__equipment" data-equipment>
              {exercise.equipment?.length
                ? `You need: ${exercise.equipment.join(", ")}.`
                : "No equipment needed - just a bit of space."}
            </p>
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

      <section className="page-section stack">
        <ExerciseSafetyNote variant="compact" />
      </section>

      {programmes.length ? (
        <section className="page-section stack" data-programmes>
          <Reveal direction="up">
            <div className="section-heading">
              <h2>Part of these recovery programmes</h2>
              <p>
                This exercise is one step in a staged plan for the conditions
                below. Each link opens the full programme and shows where this
                exercise fits.
              </p>
            </div>
          </Reveal>
          <ul className="exlib-ex-page__programmes-list">
            {programmes.map(({ condition, stageName }) => (
              <li key={condition.slug} className="exlib-ex-page__programme">
                <Link
                  className="exlib-ex-page__programme-link"
                  href={`/exercises/for/${condition.slug}`}
                >
                  {condition.name} exercises
                </Link>
                <span className="exlib-ex-page__programme-stage">
                  {stageName}
                </span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

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
          <span className="eyebrow">This exercise is generic - you&apos;re not</span>
          <h2>Get a plan personalized to you</h2>
          <p>
            Book a £{initialAssessmentPrice} online assessment with an
            HCPC-registered physiotherapist and get a rehab plan matched to your
            condition and stage - not a generic starting point.
          </p>
          <TrackedBookLink
            className="button secondary cta-white"
            href={bookingHref}
            serviceSlug="initial-assessment"
            source="exercise-page-cta-band"
            growthEvent="exercise_booking_intent"
            growthParams={{
              exercise_slug: exercise.slug,
              exercise_title: exercise.title,
              body_part: exercise.bodyPart,
              stage: exercise.stage,
              booking_context: "exercise_detail_bottom",
            }}
          >
            Get my personalized plan
          </TrackedBookLink>
        </div>
      </section>
    </div>
  );
}
