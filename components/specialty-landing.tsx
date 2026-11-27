import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ProtectedImageFrame } from "@/components/image-protection";
import { Reveal } from "@/components/reveal";
import { NoSnippet, noSnippetPrices } from "@/components/no-snippet";
import { ContactOptions } from "@/components/contact-options";
import { TrackedBookLink } from "@/components/tracked-book-link";
import { VISIT_REQUEST_PATH } from "@/lib/visit-request";
import { APPOINTMENT_HOURS, HOME_VISIT_NOTICE_SENTENCE } from "@/lib/appointment-hours";
import { HOME_VISIT_AREA_LABEL } from "@/lib/home-visit-area";
import { homeVisitPrices } from "@/lib/home-visit-pricing";
import { specialtyImagePath, type SpecialtyPage } from "@/lib/specialty-pages";
import { absoluteUrl } from "@/lib/utils";
import { breadcrumbs, practiceRef } from "@/lib/structured-data";

export function specialtyMetadata(page: SpecialtyPage): Metadata {
  return { alternates: { canonical: page.path }, title: page.metaTitle, description: page.metaDescription };
}

function JsonLd({ data }: { data: object }) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />;
}

export function SpecialtyLanding({ page }: { page: SpecialtyPage }) {
  const source = page.path.slice(1).replace(/-/g, "_");
  return (
    <div className="site-shell">
      <JsonLd data={{
        "@context": "https://schema.org",
        "@type": "Service",
        name: page.h1,
        serviceType: page.name,
        description: page.lead,
        provider: practiceRef(),
        areaServed: { "@type": "City", name: "Glasgow" },
        url: absoluteUrl(page.path)      }} />
      <JsonLd data={breadcrumbs([
        { name: "Home", path: "/" },
        { name: "Home visits", path: "/physiotherapy-home-visits-glasgow" },
        { name: page.name, path: page.path }
      ])} />
      <JsonLd data={{
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: page.faqs.filter((faq) => !faq.answer.includes("£")).map((faq) => ({
          "@type": "Question",
          name: faq.question,
          acceptedAnswer: { "@type": "Answer", text: faq.answer }
        }))
      }} />

      <section className="page-hero page-hero-split">
        <div className="stack">
          <span className="eyebrow">{page.name}</span>
          <h1>{page.h1}</h1>
          <p className="lead">{page.lead}</p>
          <p>
            Home assessment <NoSnippet>{homeVisitPrices.initial}</NoSnippet>, follow-ups <NoSnippet>{homeVisitPrices.followUp}</NoSnippet>, depending on your postcode. Home visits
            cover {HOME_VISIT_AREA_LABEL}, and run {APPOINTMENT_HOURS.phrase}. {HOME_VISIT_NOTICE_SENTENCE}
          </p>
          <ContactOptions topic="condition" source={`${source}_page`} lead="Not sure it is right for you? Ask us first, with no obligation to book." />
          <div className="button-row">
            <TrackedBookLink className="button primary" href={VISIT_REQUEST_PATH} source={`${source}_page`} event="book_now_click">
              Request a home visit
            </TrackedBookLink>
            <TrackedBookLink className="button secondary" href="/book?pay=online&visit=home" source={`${source}_page_online`} event="book_now_click">
              Book and pay online
            </TrackedBookLink>
          </div>
        </div>
        <div className="page-hero-aside checklist-panel">
          <h2>Signs it may help</h2>
          <ul className="clean-list">
            {page.signs.map((sign) => <li key={sign}>{sign}</li>)}
          </ul>
        </div>
      </section>

      <section className="page-section">
        <ProtectedImageFrame watermark>
          <Image
            className="specialty-cover"
            src={specialtyImagePath(page)}
            alt={page.imageAlt}
            width={1536}
            height={1024}
            unoptimized
            draggable={false}
          />
        </ProtectedImageFrame>
      </section>

      <section className="page-section two-col">
        <Reveal direction="up">
          <div className="panel stack soft-panel">
            <h2>Who it is for</h2>
            <ul className="clean-list">
              {page.helps.map((item) => <li key={item}>{item}</li>)}
            </ul>
          </div>
        </Reveal>
        <Reveal direction="up" delay={80}>
          <div className="panel stack image-panel">
            <h2>What happens</h2>
            <ul className="clean-list">
              {page.visit.map((step) => <li key={step.title}><strong>{step.title}:</strong> {step.detail}</li>)}
            </ul>
          </div>
        </Reveal>
      </section>

      <Reveal direction="up">
        <section className="page-section stack">
          <h2>When to get medical help first</h2>
          <p>{page.urgent}</p>
          <p>
            Read more:{" "}
            {page.related.map((link, index) => (
              <span key={link.href}>
                {index > 0 ? ", " : null}
                <Link className="inline-link" href={link.href}>{link.label}</Link>
              </span>
            ))}
          </p>
        </section>
      </Reveal>

      <Reveal direction="up">
        <section className="page-section stack service-faqs">
          <h2>Common questions</h2>
          {page.faqs.map((faq) => (
            <details key={faq.question}>
              <summary>{faq.question}</summary>
              <p>{noSnippetPrices(faq.answer)}</p>
            </details>
          ))}
        </section>
      </Reveal>

      <Reveal direction="up">
        <section className="simple-cta-band">
          <div className="site-shell simple-cta-inner">
            <span className="eyebrow">Ready to start?</span>
            <h2>Request a physiotherapy home visit</h2>
            <p>Tell us what is going on and when suits you. A booking request needs no upfront payment.</p>
            <div className="button-row" style={{ justifyContent: "center" }}>
              <Link className="button secondary cta-white" href={VISIT_REQUEST_PATH}>Request a home visit</Link>
              <Link className="button inverted" href="/book?pay=online&visit=home">Book and pay online</Link>
            </div>
          </div>
        </section>
      </Reveal>
    </div>
  );
}
