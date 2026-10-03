import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { allGuideSlugs, getGuide } from "@/lib/guides";
import { PAGE_DISCLAIMER } from "@/lib/exercise-disclaimer";
import { initialAssessmentPrice, withPrices } from "@/lib/site-data";
import { breadcrumbs, guideWebPage } from "@/lib/structured-data";
import { ByLine } from "@/components/exercise-library/by-line";
import { FaqAccordion } from "@/components/exercise-library/faq-accordion";
import { InlineText } from "@/components/inline-text";
import { TrackedBookLink } from "@/components/tracked-book-link";

// Statically generated per guide. Deliberately no `dynamicParams = false` - on
// OpenNext that 404s every path on deploy (known repo hazard).
export const dynamic = "force-static";

export function generateStaticParams() {
  return allGuideSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const guide = getGuide(slug);
  if (!guide) return {};

  const url = `/guides/${slug}`;
  return {
    title: guide.seoTitle,
    description: guide.seoDescription,
    alternates: { canonical: url },
    openGraph: {
      type: "article",
      title: guide.seoTitle,
      description: guide.seoDescription,
      url,
    },
  };
}

export default async function GuidePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const guide = getGuide(slug);
  if (!guide) notFound();

  const path = `/guides/${slug}`;
  const faqs = guide.faqs.map((f) => ({ q: withPrices(f.q), a: withPrices(f.a) }));

  return (
    <div className="site-shell">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(guideWebPage(guide, path)) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            breadcrumbs([
              { name: "Home", path: "/" },
              { name: "Guides", path: "/guides" },
              { name: guide.title, path },
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
        <Link href="/guides">Guides</Link>
        <span className="muted" aria-hidden="true">
          {" "}
          /{" "}
        </span>
        <span className="muted" aria-current="page">
          {guide.title}
        </span>
      </nav>

      <section className="simple-page-hero">
        <ByLine reviewedOn={guide.reviewedOn} />
        <h1>{guide.title}</h1>
      </section>

      <div className="page-section exlib-hub__prose">
        <p className="guide-answer">
          <InlineText text={withPrices(guide.answer)} />
        </p>

        {guide.sections.map((section) => (
          <section key={section.heading}>
            <h2>{section.heading}</h2>
            {section.paragraphs.map((p, i) => (
              <p key={i}>
                <InlineText text={withPrices(p)} />
              </p>
            ))}
          </section>
        ))}

        <section>
          <h2>Common questions</h2>
          <FaqAccordion faqs={faqs} />
        </section>

        <p className="exlib-selftest-disclaimer" data-page-disclaimer role="note">
          {PAGE_DISCLAIMER}
        </p>

        <section data-sources>
          <h2>Sources</h2>
          <ol>
            {guide.sources.map((s) => (
              <li key={s.url}>
                <a href={s.url} target="_blank" rel="noopener noreferrer">
                  {s.label}
                </a>
              </li>
            ))}
          </ol>
        </section>

        <section>
          <h2>Related</h2>
          <ul>
            {guide.related.map((r) => (
              <li key={r.href}>
                <Link href={r.href}>{r.label}</Link>
              </li>
            ))}
          </ul>
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
            href="/book?service=initial-assessment"
            serviceSlug="initial-assessment"
            source="guide-cta-band"
            extraEvent="book_now_click"
          >
            Book my assessment
          </TrackedBookLink>
        </div>
      </section>
    </div>
  );
}
