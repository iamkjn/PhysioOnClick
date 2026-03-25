import Image from "next/image";
import Link from "next/link";

import { founder } from "@/lib/site-data";
import { getPublicServices } from "@/lib/public-content";

export default async function HomePage() {
  const homeServices = getPublicServices().slice(0, 4);

  return (
    <>
      <section className="home-hero">
        <img className="home-hero-image" src="/home-hero-premium.svg" alt="Illustrated physiotherapy consultation banner" />
        <div className="home-hero-overlay" />
        <div className="site-shell home-hero-content">
          <span className="location-pill">Glasgow & Online Across the UK</span>
          <h1>
            Expert Physiotherapy,
            <span> One Click Away</span>
          </h1>
          <p className="home-hero-copy">
            Evidence-based physiotherapy by {founder.name}, HCPC registered physiotherapist. In-person in Glasgow or
            online consultations across the UK.
          </p>
          <div className="button-row">
            <Link className="button primary" href="/pricing#book" prefetch>
              Book Your Session
            </Link>
            <Link className="button secondary inverted" href="/symptom-checker" prefetch>
              AI Symptom Checker
            </Link>
          </div>
          <div className="hero-proof-grid">
            <div className="hero-proof-card">
              <strong>HCPC Registered</strong>
              <span>Safe, evidence-based assessment and rehabilitation planning.</span>
            </div>
            <div className="hero-proof-card">
              <strong>In-Person & Online</strong>
              <span>Glasgow appointments and UK-wide digital consultations.</span>
            </div>
            <div className="hero-proof-card">
              <strong>Tailored Rehab</strong>
              <span>Structured programmes for pain relief, recovery and confidence.</span>
            </div>
          </div>
        </div>
      </section>

      <section className="trust-bar-section">
        <div className="site-shell trust-bar">
          <span>HCPC Registered</span>
          <span>CSP Member</span>
          <span>Online & In-Person</span>
          <span>Glasgow, UK</span>
        </div>
      </section>

      <section className="page-section simple-section">
        <div className="site-shell section-heading">
          <h2>Our Services</h2>
          <p>Comprehensive physiotherapy services tailored to your needs, delivered by an experienced specialist.</p>
        </div>
        <div className="site-shell simple-card-grid">
          {homeServices.map((service) => (
            <article className="simple-service-card" key={service.slug}>
              <Image
                className="simple-service-image"
                src={service.image}
                alt={service.title}
                width={720}
                height={420}
                unoptimized
              />
              <h3>{service.title}</h3>
              <p>{service.summary}</p>
              <Link href={`/services#${service.slug}`} prefetch>Learn more →</Link>
            </article>
          ))}
        </div>
        <div className="site-shell section-button-center">
          <Link className="button secondary" href="/services" prefetch>
            View All Services
          </Link>
        </div>
      </section>
    </>
  );
}
