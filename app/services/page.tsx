import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

import { medicalImagePlaceholder } from "@/lib/image-placeholders";
import { getPublicServices } from "@/lib/public-content";

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
        {services.map((service) => (
          <article className="service-split-card" id={service.slug} key={service.slug}>
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
              <Link className="button primary" href="/pricing#book">
                Book Assessment
              </Link>
            </div>
          </article>
        ))}
      </section>
    </div>
  );
}
