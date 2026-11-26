import { NoSnippet, noSnippetPrices } from "@/components/no-snippet";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ProtectedImageFrame } from "@/components/image-protection";
import { LibraryCopyrightNotice } from "@/components/exercise-library/library-copyright-notice";
import { ServiceReviews } from "@/components/service-reviews";
import { curatedReviewsForServicesOverview } from "@/lib/trustpilot-curated";

import { medicalImagePlaceholder } from "@/lib/image-placeholders";
import { getPublicServices } from "@/lib/public-content";
import { pricing } from "@/lib/site-data";
import { specialtyImagePath, specialtyPages } from "@/lib/specialty-pages";
import { formatCurrency } from "@/lib/utils";
import { Reveal } from "@/components/reveal";
import { TrackedBookLink } from "@/components/tracked-book-link";
import { TrackedContentLink } from "@/components/tracked-content-link";

export const metadata: Metadata = {
  alternates: { canonical: "/services" },
  title: "Physiotherapy Services | PhysioOnClick",
  description: "Physiotherapy at home around Glasgow or by video: musculoskeletal pain, post-surgical, neurological and paediatric care from an HCPC-registered physiotherapist."
};

export const dynamic = "force-static";

export default function ServicesPage() {
  const services = getPublicServices();
  const minOnlinePrice = Math.min(
    ...pricing.filter((item) => item.mode === "Online").map((item) => item.price)
  );

  return (
    <div className="site-shell">
      <section className="simple-page-hero">
        <h1>
          Our <span>Services</span>
        </h1>
        <p>Evidence-based physiotherapy at home around Glasgow, or by video anywhere in the UK.</p>
      </section>

      <section className="page-section stack simple-services-list">
        {services.map((service, i) => {
          const half = Math.ceil(service.conditions.length / 2);
          return (
          <Reveal key={service.slug} direction="up" delay={i * 80}>
          <article className="service-split-card" id={service.slug}>
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
                  // The first card's image is the LCP element on this page.
                  // next/image lazy-loads by default, which was costing ~2.6s of
                  // pure load delay on mobile before the paint could happen.
                  priority={i === 0}
                  placeholder="blur"
                  blurDataURL={medicalImagePlaceholder}
                />
              </ProtectedImageFrame>
              <h2>
                <TrackedContentLink
                  href={`/services/${service.slug}`}
                  event="service_click"
                  params={{
                    source: "services_title",
                    service_slug: service.slug,
                    service_title: service.title,
                  }}
                >
                  {service.title}
                </TrackedContentLink>
              </h2>
              <p>{service.summary}</p>
              <h3 className="service-subhead">Treatment Approach</h3>
              <ul className="service-approach-list">
                {service.approach.map((step) => (
                  <li key={step}>{step}</li>
                ))}
              </ul>
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
              {service.faqs?.length ? (
                <>
                  <h3 className="service-subhead">Common Questions</h3>
                  <div className="service-faqs">
                    {service.faqs.map((f) => (
                      <details key={f.question}>
                        <summary>{f.question}</summary>
                        <p>{noSnippetPrices(f.answer)}</p>
                      </details>
                    ))}
                  </div>
                </>
              ) : null}
              <div className="service-split-cta">
                <TrackedContentLink
                  className="button secondary"
                  href={`/services/${service.slug}`}
                  event="service_click"
                  params={{
                    source: "services_read_more",
                    service_slug: service.slug,
                    service_title: service.title,
                  }}
                >
                  Read more
                  <span className="sr-only"> about {service.title}</span>
                </TrackedContentLink>
                <TrackedBookLink
                  className="button primary"
                  href={`/book?service=initial-assessment`}
                  serviceSlug={service.slug}
                  source="service_card"
                >
                  Book Assessment
                  <span className="sr-only"> for {service.title}</span>
                </TrackedBookLink>
                <p className="muted">From <NoSnippet>{formatCurrency(minOnlinePrice)}</NoSnippet> online</p>
              </div>
            </div>
          </article>
          </Reveal>
          );
        })}
      </section>

      <section className="page-section stack">
        <h2>Home visits in Glasgow: more areas we help with</h2>
        <div className="two-col">
          {specialtyPages.map((page) => (
            <article className="panel stack" key={page.path}>
              <ProtectedImageFrame watermark>
                <Image
                  className="specialty-cover"
                  src={specialtyImagePath(page)}
                  alt={page.imageAlt}
                  width={900}
                  height={600}
                  unoptimized
                  draggable={false}
                />
              </ProtectedImageFrame>
              <h3>{page.name}</h3>
              <p>{page.lead}</p>
              <p>
                <Link className="button secondary" href={page.path}>
                  Read more<span className="sr-only"> about {page.name}</span>
                </Link>
              </p>
            </article>
          ))}
        </div>
      </section>

      <ServiceReviews reviews={curatedReviewsForServicesOverview()} />

      <section className="simple-cta-band" id="book">
        <div className="site-shell simple-cta-inner">
          <span className="eyebrow">Not sure which service fits?</span>
          <h2>Start with an assessment</h2>
          <p>Book an initial assessment and we&apos;ll map out the right plan, at home around Glasgow or by video anywhere in the UK.</p>
          <TrackedBookLink
            className="button secondary cta-white"
            href="/book?service=initial-assessment"
            serviceSlug="cta_band"
            source="services_cta_band"
            extraEvent="book_now_click"
            extraSource="service_list"
          >
            Book assessment
          </TrackedBookLink>
        </div>
      </section>

      <LibraryCopyrightNotice content="Our service descriptions and images are" inset />
    </div>
  );
}
