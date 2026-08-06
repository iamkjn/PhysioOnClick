import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

import { medicalImagePlaceholder } from "@/lib/image-placeholders";
import { pricing, services } from "@/lib/site-data";
import { breadcrumbs, serviceSchema } from "@/lib/structured-data";
import { formatCurrency } from "@/lib/utils";
import { Reveal } from "@/components/reveal";
import { TrackedBookLink } from "@/components/tracked-book-link";

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

  return {
    title: service.seoTitle,
    description: service.seoDescription,
    alternates: { canonical: `/services/${slug}` }
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

  const half = Math.ceil(service.conditions.length / 2);
  const minOnlinePrice = Math.min(
    ...pricing.filter((item) => item.mode === "Online").map((item) => item.price)
  );

  return (
    <div className="site-shell">
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
        <h1>{service.title}</h1>
        <p>{service.summary}</p>
      </section>

      <section className="page-section stack simple-services-list">
        <Reveal direction="up">
          <article className="service-split-card">
            <div className="service-split-left">
              <Image
                className="service-split-image"
                src={service.image}
                alt=""
                width={900}
                height={520}
                unoptimized
                priority
                placeholder="blur"
                blurDataURL={medicalImagePlaceholder}
              />
              <h3 className="service-subhead">Treatment Approach</h3>
              <ul className="service-approach-list">
                {service.approach.map((step) => (
                  <li key={step}>{step}</li>
                ))}
              </ul>
              {/* TODO(shivaliba): expand — what a first session involves, typical timeline */}
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
              {/* TODO(shivaliba): expand — typical outcomes / what progress looks like for this condition group */}
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
          >
            Book assessment
          </TrackedBookLink>
        </div>
      </section>
    </div>
  );
}
