import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

import { medicalImagePlaceholder } from "@/lib/image-placeholders";
import { getPublicServices } from "@/lib/public-content";
import { Reveal } from "@/components/reveal";

export const metadata: Metadata = {
  title: "Services | PhysioOnClick",
  description: "Physiotherapist Glasgow services, post knee replacement rehab UK and online physio UK support."
};

export const dynamic = "force-static";

export default function ServicesPage() {
  const services = getPublicServices();

  return (
    <div className="site-shell">
      <section className="simple-page-hero">
        <h1>
          Our <span>Services</span>
        </h1>
        <p>Comprehensive, evidence-based physiotherapy services delivered in-person in Glasgow or online across the UK.</p>
      </section>

      <section className="page-section stack simple-services-list">
        {services.map((service, i) => {
          const half = Math.ceil(service.conditions.length / 2);
          return (
          <Reveal key={service.slug} direction="up" delay={i * 80}>
          <article className="service-split-card" id={service.slug}>
            <div className="service-split-left">
              <Image
                className="service-split-image"
                src={service.image}
                alt={service.title}
                width={900}
                height={520}
                unoptimized
                placeholder="blur"
                blurDataURL={medicalImagePlaceholder}
              />
              <h2>{service.title}</h2>
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
                <div className="service-faqs">
                  {service.faqs.map((f) => (
                    <details key={f.question}>
                      <summary>{f.question}</summary>
                      <p>{f.answer}</p>
                    </details>
                  ))}
                </div>
              ) : null}
              <div className="service-split-cta">
                <Link className="button primary" href={`/book?service=initial-assessment`}>
                  Book Assessment
                </Link>
                <p className="muted">From £50 online</p>
              </div>
            </div>
          </article>
          </Reveal>
          );
        })}
      </section>

      <section className="simple-cta-band" id="book">
        <div className="site-shell simple-cta-inner">
          <span className="eyebrow">Not sure which service fits?</span>
          <h2>Start with an assessment</h2>
          <p>Book an initial assessment and we&apos;ll map out the right plan, in-person in Glasgow or online across the UK.</p>
          <Link className="button secondary cta-white" href="/book?service=initial-assessment">
            Book assessment
          </Link>
        </div>
      </section>
    </div>
  );
}
