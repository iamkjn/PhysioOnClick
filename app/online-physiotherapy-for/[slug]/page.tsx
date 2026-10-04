import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { getArticle } from "@/lib/blog";
import { getCondition, getSelfTest } from "@/lib/exercise-library";
import { getGuide } from "@/lib/guides";
import { PAGE_DISCLAIMER } from "@/lib/exercise-disclaimer";
import { HOME_VISIT_AREA_LABEL } from "@/lib/home-visit";
import { formatPounds, HOME_VISIT_TRAVEL_FEE_PENCE } from "@/lib/home-visit-pricing";
import {
  allOnlinePhysioSlugs,
  getOnlinePhysioPage,
  sentenceName,
} from "@/lib/online-physio-pages";
import { initialAssessmentPrice, services, withPrices } from "@/lib/site-data";
import { breadcrumbs, onlinePhysioWebPage } from "@/lib/structured-data";
import { ByLine } from "@/components/exercise-library/by-line";
import { FaqAccordion } from "@/components/exercise-library/faq-accordion";
import { InlineText } from "@/components/inline-text";
import { TrackedBookLink } from "@/components/tracked-book-link";

// Statically generated per condition. Deliberately no `dynamicParams = false` -
// on OpenNext that 404s every path on deploy (known repo hazard).
export const dynamic = "force-static";

// Every landing page shows the home-visit line (clinical sign-off round 2,
// Q7/Q8, 2026-10-04: home visits are offered for neuro and post-op care too,
// and include hands-on treatment where appropriate). Neuro and post-op care
// still need clearance first, so those pages repeat it next to the line.
const POSTOP_READINESS =
  "Rehab with us starts once your surgical team has said you are ready for outpatient or community physiotherapy, and we follow any restrictions or precautions they give you.";

function homeVisitClearance(serviceSlug: string): string | null {
  if (serviceSlug === "neurological-rehabilitation") return "Whether you choose a home visit or video, your GP or specialist team must confirm it is safe for you to begin physiotherapy before you start.";
  if (serviceSlug === "post-surgical-rehabilitation") return `Whether you choose a home visit or video, ${POSTOP_READINESS.charAt(0).toLowerCase()}${POSTOP_READINESS.slice(1)}`;
  return null;
}

export function generateStaticParams() {
  return allOnlinePhysioSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const page = getOnlinePhysioPage(slug);
  if (!page) return {};

  const url = `/online-physiotherapy-for/${slug}`;
  return {
    title: page.seoTitle,
    description: page.seoDescription,
    alternates: { canonical: url },
    openGraph: {
      type: "website",
      title: page.seoTitle,
      description: page.seoDescription,
      url,
    },
  };
}

export default async function OnlinePhysioLandingPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const page = getOnlinePhysioPage(slug);
  if (!page) notFound();

  const path = `/online-physiotherapy-for/${slug}`;
  const faqs = page.faqs.map((f) => ({ q: withPrices(f.q), a: withPrices(f.a) }));
  const bookHref = `/book?service=initial-assessment&source=online-physio-landing&condition=${slug}`;

  const hub = page.exerciseHubSlug ? getCondition(page.exerciseHubSlug) : null;
  const selfTests = (page.selfTestSlugs ?? [])
    .map((s) => getSelfTest(s))
    .filter((t): t is NonNullable<typeof t> => t !== null && t !== undefined);
  const guides = (page.guideSlugs ?? [])
    .map((s) => getGuide(s))
    .filter((g): g is NonNullable<typeof g> => g !== null);
  const articles = (page.blogSlugs ?? [])
    .map((s) => getArticle(s))
    .filter((a): a is NonNullable<typeof a> => a !== undefined);
  const service = services.find((s) => s.slug === page.serviceSlug);

  return (
    <div className="site-shell">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(onlinePhysioWebPage(page, path)) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            breadcrumbs([
              { name: "Home", path: "/" },
              { name: "Services", path: "/services" },
              { name: page.h1, path },
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
        <Link href="/services">Services</Link>
        <span className="muted" aria-hidden="true">
          {" "}
          /{" "}
        </span>
        <span className="muted" aria-current="page">
          {page.h1}
        </span>
      </nav>

      <section className="simple-page-hero">
        <ByLine reviewedOn={page.reviewedOn} />
        <h1>{page.h1}</h1>
      </section>

      <div className="page-section exlib-hub__prose">
        <p className="guide-answer">
          <InlineText text={withPrices(page.answer)} />
        </p>

        <p>
          <TrackedBookLink
            className="button"
            href={bookHref}
            serviceSlug="initial-assessment"
            source="online-physio-landing"
            params={{ slug }}
            extraEvent="book_now_click"
          >
            Book a £{initialAssessmentPrice} video assessment
          </TrackedBookLink>
        </p>

        <p data-home-visit>
          If you live in {HOME_VISIT_AREA_LABEL}, you can{" "}
          <Link href="/book?visit=home">book a home visit</Link> instead of a video call. A home visit
          costs the video price plus a {formatPounds(HOME_VISIT_TRAVEL_FEE_PENCE)} travel fee per visit,
          and can include hands-on treatment (manual therapy) where appropriate. Video sessions cannot
          include hands-on treatment.
          {homeVisitClearance(page.serviceSlug) ? <> {homeVisitClearance(page.serviceSlug)}</> : null}
        </p>

        <section>
          <h2>How online physiotherapy works {page.h1.startsWith("Online physiotherapy after ") ? "after" : "for"} {sentenceName(page)}</h2>
          {page.howOnlineWorks.map((p, i) => (
            <p key={i}>
              <InlineText text={withPrices(p)} />
            </p>
          ))}
        </section>

        <section>
          <h2>What the video assessment checks</h2>
          <ul>
            {page.assessmentChecks.map((c, i) => (
              <li key={i}>
                <InlineText text={withPrices(c)} />
              </li>
            ))}
          </ul>
        </section>

        <section>
          <h2>What treatment usually involves</h2>
          {page.typicalPlan.map((p, i) => (
            <p key={i}>
              <InlineText text={withPrices(p)} />
            </p>
          ))}
        </section>

        <section>
          <h2>How long recovery usually takes</h2>
          <p>
            <InlineText text={withPrices(page.timeline)} />
          </p>
        </section>

        <section>
          <h2>When you need to be seen in person instead</h2>
          <p>
            A video appointment is not the right route for the situations
            below, and a home visit is not a substitute for urgent care.
          </p>
          <div className="exlib-redflags" data-in-person>
            <ul className="exlib-redflags__list">
              {page.inPersonInstead.map((item, i) => (
                <li key={i}>
                  <InlineText text={withPrices(item)} />
                </li>
              ))}
            </ul>
          </div>
        </section>

        {hub || selfTests.length ? (
          <section>
            <h2>Exercises and self-checks</h2>
            <ul>
              {hub ? (
                <li>
                  <Link href={`/exercises/for/${hub.slug}`}>
                    {hub.name} exercises
                  </Link>
                </li>
              ) : null}
              {selfTests.map((t) => (
                <li key={t.slug}>
                  <Link href={`/exercises/tests/${t.slug}`}>{t.name}</Link>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        <section>
          <h2>Common questions</h2>
          <FaqAccordion faqs={faqs} />
        </section>

        <section>
          <h2>Further reading</h2>
          <ul>
            {guides.map((g) => (
              <li key={g.slug}>
                <Link href={`/guides/${g.slug}`}>{g.title}</Link>
              </li>
            ))}
            {articles.map((a) => (
              <li key={a.slug}>
                <Link href={`/blog/${a.slug}`}>{a.title}</Link>
              </li>
            ))}
            <li>
              <Link href={`/services/${page.serviceSlug}`}>
                {service?.title ?? "Our physiotherapy service"}
              </Link>
            </li>
          </ul>
        </section>

        <p className="exlib-selftest-disclaimer" data-page-disclaimer role="note">
          {PAGE_DISCLAIMER}
        </p>

        <section data-sources>
          <h2>Sources</h2>
          <ol>
            {page.sources.map((s) => (
              <li key={s.url}>
                <a href={s.url} target="_blank" rel="noopener noreferrer">
                  {s.label}
                </a>
              </li>
            ))}
          </ol>
        </section>
      </div>

      <section className="simple-cta-band">
        <div className="site-shell simple-cta-inner">
          <h2>Book an online assessment</h2>
          <p>
            A 60-minute video assessment with an HCPC-registered physiotherapist
            is £{initialAssessmentPrice}.
          </p>
          <TrackedBookLink
            className="button secondary cta-white"
            href={`/book?service=initial-assessment&source=online-physio-cta-band&condition=${slug}`}
            serviceSlug="initial-assessment"
            source="online-physio-cta-band"
            params={{ slug }}
            extraEvent="book_now_click"
          >
            Book my assessment
          </TrackedBookLink>
        </div>
      </section>
    </div>
  );
}
