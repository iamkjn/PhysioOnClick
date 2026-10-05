import type { Metadata } from "next";
import Image from "next/image";
import { ProtectedImageFrame } from "@/components/image-protection";
import { LibraryCopyrightNotice } from "@/components/exercise-library/library-copyright-notice";
import Link from "next/link";
import { notFound } from "next/navigation";

import { articlesForServiceSlug } from "@/lib/blog";
import { getCondition } from "@/lib/exercise-library";
import { getOnlinePhysioPage } from "@/lib/online-physio-pages";
import { medicalImagePlaceholder } from "@/lib/image-placeholders";
import { founder, initialAssessmentPrice, pricing, services } from "@/lib/site-data";
import { breadcrumbs, serviceSchema } from "@/lib/structured-data";
import { formatCurrency } from "@/lib/utils";
import { Reveal } from "@/components/reveal";
import { ServiceReviews } from "@/components/service-reviews";
import { curatedReviewsForService } from "@/lib/trustpilot-curated";
import { TrackGrowthView } from "@/components/track-view";
import { TrackedBookLink } from "@/components/tracked-book-link";
import { TrackedContentLink } from "@/components/tracked-content-link";

// Same reasoning as /blog/[slug]: build the six service pages once so the
// route never re-runs the (static) content lookup per-request.
export const dynamic = "force-static";

export function generateStaticParams() {
  return services.map((service) => ({ slug: service.slug }));
}

export async function generateMetadata({
  params
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const service = services.find((item) => item.slug === slug);

  if (!service) {
    return {};
  }

  const description = `${service.seoDescription} Video assessment £${initialAssessmentPrice}, no GP referral needed.`;

  return {
    title: service.seoTitle,
    description,
    alternates: { canonical: `/services/${slug}` },
    openGraph: {
      type: "website",
      title: service.seoTitle,
      description,
      url: `/services/${slug}`
    }
  };
}

export default async function ServiceDetailPage({
  params
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const service = services.find((item) => item.slug === slug);

  if (!service) {
    notFound();
  }

  const relatedArticles = articlesForServiceSlug(service.slug, 4);
  const half = Math.ceil(service.conditions.length / 2);
  const minOnlinePrice = Math.min(
    ...pricing.filter((item) => item.mode === "Online").map((item) => item.price)
  );

  return (
    <div className="site-shell">
      <TrackGrowthView event="service_view" params={{ service_slug: service.slug }} />
      {/* MedicalTherapy links back to the practice entity by @id (declared once
          sitewide in app/layout.tsx), so the six service pages read as one
          business offering six services rather than six unrelated entities.
          Deliberately no FAQPage: Google retired FAQ rich results for every
          site in May 2026, so the visible FAQ content below stands on its own. */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceSchema(service)) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            breadcrumbs([
              { name: "Home", path: "/" },
              { name: "Services", path: "/services" },
              { name: service.title, path: `/services/${service.slug}` }
            ])
          )
        }}
      />
      <nav aria-label="Breadcrumb">
        <Link href="/">Home</Link>
        <span className="muted" aria-hidden="true">
          {" "}
          /{" "}
        </span>
        <Link href="/services">Services</Link>
        <span className="muted" aria-hidden="true">
          {" "}
          /{" "}
        </span>
        <span className="muted" aria-current="page">
          {service.title}
        </span>
      </nav>

      <section className="simple-page-hero">
        <span>Physiotherapy Service</span>
        <h1>{service.headline ?? service.title}</h1>
        <p>{service.summary}</p>
      </section>

      <section className="page-section stack simple-services-list">
        <Reveal direction="up">
          <article className="service-split-card">
            <div className="service-split-left">
              <ProtectedImageFrame watermark>
                <Image
                  className="service-split-image"
                  src={service.image}
                  alt=""
                  width={900}
                  height={520}
                  unoptimized
                  draggable={false}
                  priority
                  placeholder="blur"
                  blurDataURL={medicalImagePlaceholder}
                />
              </ProtectedImageFrame>
              <h3 className="service-subhead">Treatment Approach</h3>
              <ul className="service-approach-list">
                {service.approach.map((step) => (
                  <li key={step}>{step}</li>
                ))}
              </ul>
              <h3 className="service-subhead">Your First Session</h3>
              <p>{service.firstSession}</p>
            </div>
            <div className="service-split-right">
              <h3 className="service-subhead">Conditions Treated</h3>
              <div className="service-conditions-grid">
                <div>
                  {service.conditions.slice(0, half).map((condition) => (
                    <p key={condition}>{condition}</p>
                  ))}
                </div>
                <div>
                  {service.conditions.slice(half).map((condition) => (
                    <p key={condition}>{condition}</p>
                  ))}
                </div>
              </div>
              <h3 className="service-subhead">What Progress Looks Like</h3>
              <p>{service.typicalOutcomes}</p>
              <h3 className="service-subhead">When In-Person Care Is a Better Fit</h3>
              <p>{service.whenInPersonInstead}</p>
              {service.faqs?.length ? (
                <>
                  <h3 className="service-subhead">Common Questions</h3>
                  <div className="service-faqs">
                    {service.faqs.map((f) => (
                      <details key={f.question}>
                        <summary>{f.question}</summary>
                        <p>{f.answer}</p>
                      </details>
                    ))}
                  </div>
                </>
              ) : null}
              <div className="service-split-cta">
                <TrackedBookLink
                  className="button primary"
                  href="/book?service=initial-assessment"
                  serviceSlug={service.slug}
                  source="service_detail_page"
                >
                  Book Assessment
                  <span className="sr-only"> for {service.title}</span>
                </TrackedBookLink>
                <p className="muted">From {formatCurrency(minOnlinePrice)} online</p>
              </div>
            </div>
          </article>
        </Reveal>
      </section>

      <ServiceReviews reviews={curatedReviewsForService(service.slug)} />

      {service.relatedConditionSlugs?.length ? (
        <section className="page-section stack simple-services-list">
          <Reveal direction="up">
            <div className="section-heading">
              <h2>Exercises for these conditions</h2>
              <p>Staged home-exercise programmes from the PhysioOnClick library for conditions treated in this service.</p>
            </div>
          </Reveal>
          <ul className="service-approach-list">
            {service.relatedConditionSlugs.map((conditionSlug) => (
              <li key={conditionSlug}>
                <TrackedContentLink
                  href={`/exercises/for/${conditionSlug}`}
                  prefetch
                  event="condition_click"
                  params={{
                    source: "service_detail_related_condition",
                    service_slug: service.slug,
                    service_title: service.title,
                    condition_slug: conditionSlug,
                    condition_name: getCondition(conditionSlug)?.name,
                  }}
                >
                  {getCondition(conditionSlug)?.name} exercises
                </TrackedContentLink>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {service.onlinePhysioSlugs?.length ? (
        <section className="page-section stack simple-services-list">
          <Reveal direction="up">
            <div className="section-heading">
              <h2>Online physiotherapy pages</h2>
              <p>More detail on how video sessions work for specific conditions and recovery after surgery.</p>
            </div>
          </Reveal>
          <ul className="service-approach-list">
            {service.onlinePhysioSlugs.map((physioSlug) => {
              const page = getOnlinePhysioPage(physioSlug);
              return page ? (
                <li key={physioSlug}>
                  <Link href={`/online-physiotherapy-for/${physioSlug}`} prefetch>
                    {page.name}
                  </Link>
                </li>
              ) : null;
            })}
          </ul>
        </section>
      ) : null}

      {relatedArticles.length ? (
        <section className="page-section stack simple-services-list">
          <Reveal direction="up">
            <div className="section-heading">
              <h2>Related reading</h2>
              <p>Evidence-based guides from {founder.name.split(" ")[0]} on conditions treated in this service.</p>
            </div>
          </Reveal>
          <ul className="service-approach-list">
            {relatedArticles.map((article) => (
              <li key={article.slug}>
                <Link href={`/blog/${article.slug}`} prefetch>
                  {article.title}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className="simple-cta-band">
        <div className="site-shell simple-cta-inner">
          <span className="eyebrow">Not sure which service fits?</span>
          <h2>Start with an assessment</h2>
          <p>Book an initial assessment and we&apos;ll map out the right plan, delivered online across the UK.</p>
          <TrackedBookLink
            className="button secondary cta-white"
            href="/book?service=initial-assessment"
            serviceSlug="cta_band"
            source="service_detail_cta_band"
            extraEvent="book_now_click"
            extraSource="service_detail"
          >
            Book assessment
          </TrackedBookLink>
        </div>
      </section>

      <LibraryCopyrightNotice content="This page and its images are" inset />
    </div>
  );
}
