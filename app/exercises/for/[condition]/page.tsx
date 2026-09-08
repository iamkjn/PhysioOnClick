import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import {
  allConditionSlugs,
  getCondition,
  programForCondition,
} from "@/lib/exercise-library";
import { pricing } from "@/lib/site-data";
import { breadcrumbs, conditionWebPage } from "@/lib/structured-data";
import { ByLine } from "@/components/exercise-library/by-line";
import { ConditionCard } from "@/components/exercise-library/condition-card";
import { ConditionPdfForm } from "@/components/exercise-library/condition-pdf-form";
import { FaqAccordion } from "@/components/exercise-library/faq-accordion";
import { StagedProgram } from "@/components/exercise-library/staged-program";
import { TrackedBookLink } from "@/components/tracked-book-link";

// One statically-exported page per condition record. Same reasoning as the
// exercise/service/blog detail routes: without force-static the route re-runs
// the (static) catalogue lookup inside the Worker on every request.
// Deliberately no `dynamicParams = false` - on OpenNext that 404s every path
// on deploy (known repo hazard).
export const dynamic = "force-static";

export function generateStaticParams() {
  return allConditionSlugs().map((condition) => ({ condition }));
}

// Same derivation as app/services/[slug]/page.tsx: the online "from" price is
// the cheapest Online pricing item (currently the £40 follow-up).
const ONLINE_FROM_PRICE = Math.min(
  ...pricing.filter((item) => item.mode === "Online").map((item) => item.price),
);

function brandedTitle(seoTitle: string): string {
  return seoTitle.includes("| PhysioOnClick")
    ? seoTitle
    : `${seoTitle} | PhysioOnClick`;
}

function paragraphsOf(text: string): string[] {
  return text
    .split(/\n\n+/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ condition: string }>;
}): Promise<Metadata> {
  const { condition: slug } = await params;
  const condition = getCondition(slug);

  if (!condition) {
    return {};
  }

  const title = brandedTitle(condition.seoTitle);

  return {
    title,
    description: condition.seoDescription,
    alternates: { canonical: `/exercises/for/${slug}` },
    openGraph: {
      type: "article",
      title,
      description: condition.seoDescription,
      url: `/exercises/for/${slug}`,
      images: [`/condition-og/${slug}`],
    },
    twitter: {
      card: "summary_large_image",
      images: [`/condition-og/${slug}`],
    },
  };
}

export default async function ConditionHubPage({
  params,
}: {
  params: Promise<{ condition: string }>;
}) {
  const { condition: slug } = await params;
  const condition = getCondition(slug);

  if (!condition) {
    notFound();
  }

  const path = `/exercises/for/${slug}`;
  const program = programForCondition(slug);
  const related = (condition.relatedConditionSlugs ?? [])
    .map((relatedSlug) => getCondition(relatedSlug))
    .filter((item): item is NonNullable<typeof item> => item !== null);
  const priceLabel = `from £${ONLINE_FROM_PRICE}`;

  return (
    <div className="site-shell">
      {/* Google retired HowTo and FAQPage rich results, so the FAQ rides along
          inside MedicalWebPage as bare Question/Answer nodes and renders as
          plain <details> HTML below. Practitioner node is shared sitewide by
          @id. */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(conditionWebPage(condition, path)),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            breadcrumbs([
              { name: "Home", path: "/" },
              { name: "Exercises", path: "/exercises" },
              { name: `${condition.name} exercises`, path },
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
          {condition.name} exercises
        </span>
      </nav>

      <div className="exlib-hub">
        {/* Rail is first in source order so it stacks above the programme on
            mobile; on desktop the grid rules below pin it into column 2 and
            make it sticky. Pure CSS, no JS. */}
        <aside className="exlib-hub__rail">
          <div className="exlib-cta-card">
            <h2 className="exlib-cta-card__title">
              Want this checked by a physiotherapist?
            </h2>
            <p className="exlib-cta-card__body">
              Book an online assessment with an HCPC-registered physiotherapist
              and get a plan matched to your shoulder, knee or back - wherever
              you are in the UK.
            </p>
            <TrackedBookLink
              className="button primary"
              href="/book"
              serviceSlug={condition.serviceSlug ?? "musculoskeletal-physiotherapy"}
              source="condition-hub"
            >
              Book an assessment
            </TrackedBookLink>
            <p className="exlib-cta-card__price">
              Online physiotherapy {priceLabel} a session.
            </p>
            <ConditionPdfForm
              conditionSlug={condition.slug}
              conditionName={condition.name}
            />
          </div>
        </aside>

        <main className="exlib-hub__main">
          <ByLine reviewedOn={condition.reviewedOn} />

          <h1 className="exlib-hub__title">{condition.name} exercises</h1>

          <div className="exlib-hub__prose">
            {paragraphsOf(condition.intro).map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </div>

          <div className="exlib-hub__prose">
            <h2>Who this programme is for</h2>
            {paragraphsOf(condition.whoItHelps).map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </div>

          {/* Coral/danger tint. Must sit in the DOM before the programme so a
              screen-reader or a skim reader meets the safety net first. */}
          <div className="exlib-redflags" data-red-flags>
            <h2 className="exlib-redflags__title">
              Get checked by a clinician first if
            </h2>
            <ul className="exlib-redflags__list">
              {condition.redFlags.map((flag) => (
                <li key={flag}>{flag}</li>
              ))}
            </ul>
          </div>

          <section className="exlib-hub__section">
            <h2>The staged programme</h2>
            <StagedProgram program={program} />
          </section>

          <div className="exlib-guidance">
            <div className="exlib-guidance__card">
              <h2 className="exlib-guidance__heading">How long recovery takes</h2>
              <p>{condition.recoveryTimeline}</p>
            </div>
            <div className="exlib-guidance__card">
              <h2 className="exlib-guidance__heading">Knowing when to progress</h2>
              <p>{condition.progressGuidance}</p>
            </div>
          </div>

          <section className="exlib-hub__section">
            <h2>Common questions</h2>
            <FaqAccordion faqs={condition.faqs} />
          </section>

          {related.length || condition.serviceSlug ? (
            <section className="exlib-hub__section">
              <h2>Related</h2>
              {related.length ? (
                <div className="exlib-ex-grid">
                  {related.map((item) => (
                    <ConditionCard
                      key={item.slug}
                      condition={item}
                      exerciseCount={programForCondition(item.slug).reduce(
                        (total, stage) => total + stage.exercises.length,
                        0,
                      )}
                    />
                  ))}
                </div>
              ) : null}
              {condition.serviceSlug ? (
                <p className="exlib-hub__service-link">
                  <Link href={`/services/${condition.serviceSlug}`} prefetch>
                    See the physiotherapy service for this condition
                  </Link>
                </p>
              ) : null}
            </section>
          ) : null}
        </main>
      </div>

      <section className="simple-cta-band">
        <div className="site-shell simple-cta-inner">
          <span className="eyebrow">Not sure this is the right programme?</span>
          <h2>Get a plan built for you</h2>
          <p>
            Book an online assessment with an HCPC-registered physiotherapist and
            get a rehab plan matched to your condition and stage.
          </p>
          <TrackedBookLink
            className="button secondary cta-white"
            href="/book"
            serviceSlug="cta_band"
            source="condition-hub-cta-band"
          >
            Book assessment
          </TrackedBookLink>
        </div>
      </section>
    </div>
  );
}
