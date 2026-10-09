import type { Metadata } from "next";
import { UkServiceLinks } from "@/components/uk-service-links";
import Link from "next/link";
import { notFound } from "next/navigation";

import {
  conditionsForExercise,
  EXERCISE_LIBRARY_REVIEWED_ON,
  getExerciseBySlug,
  allExerciseSlugs,
  programmesForExercise,
  relatedExercises,
  bodyAreaForExercise,
  moreExercisesInArea,
} from "@/lib/exercise-library";
import { formatDosage, hasPrescribedDose, resolveDosage } from "@/lib/exercises";
import { splitMistakes } from "@/lib/exercise-safety-line";
import { buildEmbedSnippet, EMBEDS_ENABLED, embedPath } from "@/lib/exercise-embed";
import { initialAssessmentPrice } from "@/lib/site-data";
import { breadcrumbs, exerciseWebPage } from "@/lib/structured-data";
import { AddToPlanButton } from "@/components/exercise-library/add-to-plan-button";
import { ByLine } from "@/components/exercise-library/by-line";
import { ExerciseCard } from "@/components/exercise-library/exercise-card";
import { ExerciseSafetyNote } from "@/components/exercise-library/exercise-safety-note";
import { ReferenceOnlyNote } from "@/components/exercise-library/reference-only-label";
import { EmbedExerciseButton } from "@/components/exercise-library/embed-exercise-button";
import { ExerciseImage } from "@/components/exercise-image";
import { ExerciseVideo } from "@/components/exercise-library/exercise-video";
import { Reveal } from "@/components/reveal";
import { TrackedBookLink } from "@/components/tracked-book-link";
import { getOnlinePhysioPage, onlinePhysioPageForHub } from "@/lib/online-physio-pages";
import { TrackView } from "@/components/track-view";
import { exerciseImageUrl } from "@/lib/exercise-images";
import { hasUploadedImage } from "@/lib/exercise-image-prompts";
import { exerciseSearchTitle } from "@/lib/exercise-search-titles";

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

  // These pages rank around positions 6-10 for exercise-name searches but
  // earned ~0.7% CTR with a generic "how-to, sets & reps" title and a dosage
  // shorthand snippet. Lead with what the exercise is and does (its own plain
  // description), then the promise: steps, form tips and dose from a physio.
  const dosage = resolveDosage(exercise);
  const title = exerciseSearchTitle(slug, exercise.title);
  const promise = hasPrescribedDose(dosage)
    ? "Steps, form tips & sets/reps from a UK physio."
    : "Steps and form tips from a UK physio.";
  const description = `${clipAtWord(exercise.description, 158 - promise.length)} ${promise}`;
  // The SVG share card is noindex and Google won't use SVGs as result
  // thumbnails, so point at the real illustration (WebP) when one exists.
  const shareImage = hasUploadedImage(exercise.id)
    ? { url: exerciseImageUrl(exercise.id, "full"), width: 960, height: 960, alt: `${exercise.title} exercise demonstration` }
    : `/exercise-og/${slug}`;

  return {
    title,
    description,
    alternates: { canonical: `/exercises/${slug}` },
    openGraph: {
      type: "article",
      title,
      description,
      url: `/exercises/${slug}`,
      images: [shareImage],
    },
    twitter: {
      card: "summary_large_image",
      images: [shareImage],
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
  // Exercise pages carry most of the site's search traffic; send those
  // visitors (and link equity) on to the condition landing pages they map to.
  // Falls back to the body part when no hub maps to a landing page.
  const hubPages = hubs.map((hub) => onlinePhysioPageForHub(hub.slug)).filter((p) => p !== null);
  const bodyPartPage = BODY_PART_CARE_PAGE[exercise.bodyPart];
  const fallback = hubPages.length || !bodyPartPage ? [] : [getOnlinePhysioPage(bodyPartPage)].filter((p) => p !== null);
  const carePages = [...new Map([...hubPages, ...fallback].map((p) => [p.slug, p])).values()];
  const related = relatedExercises(slug, 4);
  const area = bodyAreaForExercise(slug);
  const moreInArea = moreExercisesInArea(slug, 12, new Set(related.map((item) => item.slug)));
  const programmes = programmesForExercise(slug);
  const helpsWith = exercise.helpsWith ?? [];
  const dose = formatDosage(resolveDosage(exercise));
  const usedFor = hubs.length
    ? hubs
        .slice(0, 3)
        // Mid-sentence items read lower-case; leave acronyms ("ACL ...") alone.
        .map((hub, i) => (i > 0 && /^[A-Z][a-z]/.test(hub.name) ? hub.name[0].toLowerCase() + hub.name.slice(1) : hub.name))
        .join(", ")
    : `${exercise.bodyPart} rehab`;
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
          <ReferenceOnlyNote />
          {exercise.aka?.length ? (
            <p className="muted">Also known as {exercise.aka.join(", ")}.</p>
          ) : null}
          {/* Quick answer: the what / how much / what for that a searcher wants,
              in the first lines under the H1 so it can be lifted as a
              snippet. Built only from reviewed catalogue fields. */}
          <section className="exlib-quick-answer" aria-labelledby="quick-answer-heading">
            <h2 id="quick-answer-heading" className="exlib-quick-answer__label">
              Quick answer
            </h2>
            <p>{exercise.description}</p>
            <dl>
              {hasPrescribedDose(resolveDosage(exercise)) ? (
                <div>
                  <dt>Typical starting dose</dt>
                  <dd>{dose}</dd>
                </div>
              ) : null}
              <div>
                <dt>Often used for</dt>
                <dd>{usedFor}</dd>
              </div>
            </dl>
          </section>

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

          {hasPrescribedDose(resolveDosage(exercise)) ? (
            <p className="muted">
              The dose above is a general starting point, not a plan matched to
              your condition or stage.
            </p>
          ) : null}

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
            {EMBEDS_ENABLED ? (
              <EmbedExerciseButton
                slug={exercise.slug}
                title={exercise.title}
                snippet={buildEmbedSnippet(exercise)}
                previewSrc={embedPath(exercise.slug)}
              />
            ) : null}
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

      {/* Booking prompt where most readers stop: straight after the steps. */}
      <section className="page-section">
        <aside className="exlib-next-step" aria-label="Book an assessment">
          <p>
            <strong>Not getting better, or not sure this is the right exercise for you?</strong>{" "}
            A £{initialAssessmentPrice} online assessment with an HCPC-registered
            physiotherapist gets you a plan matched to your condition and stage.
          </p>
          <TrackedBookLink
            className="button primary"
            href={bookingHref}
            serviceSlug="initial-assessment"
            source="exercise-page-after-steps"
            growthEvent="exercise_booking_intent"
            growthParams={{
              exercise_slug: exercise.slug,
              exercise_title: exercise.title,
              body_part: exercise.bodyPart,
              stage: exercise.stage,
              booking_context: "exercise_detail_after_steps",
            }}
          >
            Book a £{initialAssessmentPrice} assessment
          </TrackedBookLink>
        </aside>
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

      {area && moreInArea.length ? (
        <section className="page-section stack">
          <div className="section-heading">
            <h2>More {area.label.toLowerCase()} exercises</h2>
          </div>
          <ul className="exlib-link-list">
            {moreInArea.map((item) => (
              <li key={item.slug}>
                <Link href={`/exercises/${item.slug}`}>{item.title}</Link>
              </li>
            ))}
          </ul>
          <p>
            <Link href={`/exercises/area/${area.key}`}>
              See all {area.label.toLowerCase()} exercises
            </Link>
          </p>
        </section>
      ) : null}

      <section className="page-section">
        <ByLine reviewedOn={EXERCISE_LIBRARY_REVIEWED_ON} />
      </section>

      <section className="simple-cta-band">
        <div className="site-shell simple-cta-inner">
          <span className="eyebrow">This exercise is generic - you&apos;re not</span>
          <h2>Get a plan personalised to you</h2>
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
            Get my personalised plan
          </TrackedBookLink>
          {carePages.length ? (
            <p className="uk-service-links">
              Get physio help for:{" "}
              {carePages.map((page, i) => (
                <span key={page.slug}>
                  {i ? " · " : null}
                  <Link href={`/online-physiotherapy-for/${page.slug}`}>{page.name}</Link>
                </span>
              ))}
            </p>
          ) : null}
          <UkServiceLinks />
        </div>
      </section>
    </div>
  );
}

function clipAtWord(text: string, max: number): string {
  if (text.length <= max) return text;
  const cut = text.slice(0, max - 1);
  return `${cut.slice(0, cut.lastIndexOf(" ")).replace(/[\s,;:–-]+$/, "")}…`;
}

// Only body parts with one unambiguous condition landing page.
const BODY_PART_CARE_PAGE: Record<string, string> = {
  Knee: "knee-pain",
  Hip: "hip-pain",
  Shoulder: "shoulder-pain",
  "Lumbar spine": "low-back-pain",
  "Cervical spine": "neck-pain",
  Neck: "neck-pain",
};
