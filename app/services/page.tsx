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
        {services.map((service, i) => (
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
                <h4>Treatment Approach</h4>
                <p>{service.approach.join(", ")}.</p>
              </div>
              <div className="service-split-right">
                <div className="service-conditions-title">Conditions Treated</div>
                <div className="service-conditions-grid">
                  <div>
                    {service.conditions.slice(0, Math.ceil(service.conditions.length / 2)).map((condition) => (
                      <p key={condition}>✓ {condition}</p>
                    ))}
                  </div>
                  <div>
                    {service.conditions.slice(Math.ceil(service.conditions.length / 2)).map((condition) => (
                      <p key={condition}>✓ {condition}</p>
                    ))}
                  </div>
                </div>
                <div className="service-assessment-included">
                  <p className="service-assessment-title">What&apos;s included in your assessment</p>
                  <div className="service-assessment-list">
                    <p>✓ Full case history and symptom review</p>
                    <p>✓ Postural and movement analysis</p>
                    <p>✓ Strength, flexibility and function testing</p>
                    <p>✓ Clinical diagnosis explained clearly</p>
                    <p>✓ Personalised treatment plan</p>
                    <p>✓ Home exercise programme</p>
                    <p>✓ Follow-up guidance and progress tracking</p>
                  </div>
                </div>
                <Link className="button primary" href={`/book?service=${encodeURIComponent(service.title)}`}>
                  Book Assessment
                </Link>
              </div>
            </article>
          </Reveal>
        ))}
      </section>
    </div>
  );
}
