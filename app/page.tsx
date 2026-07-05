import Image from "next/image";
import Link from "next/link";

import { founder } from "@/lib/site-data";
import { getPublicServices } from "@/lib/public-content";
import { HomeHeroSection } from "@/components/home-hero-section";
import { Reveal } from "@/components/reveal";

export default async function HomePage() {
  const homeServices = getPublicServices().slice(0, 4);

  return (
    <>
      <HomeHeroSection founderName={founder.name} />

      <Reveal direction="fade">
        <section className="trust-bar-section">
          <div className="site-shell trust-bar">
            <span>HCPC Registered</span>
            <span>CSP Member</span>
            <span>Home visits in Glasgow</span>
            <span>Online appointments across the UK</span>
          </div>
        </section>
      </Reveal>

      <section className="page-section simple-section">
        <Reveal direction="up">
          <div className="site-shell section-heading">
            <h2>Our Services</h2>
            <p>Comprehensive physiotherapy services tailored to your needs, delivered by an experienced specialist.</p>
          </div>
        </Reveal>
        <div className="site-shell simple-card-grid">
          {homeServices.map((service, i) => (
            <Reveal key={service.slug} direction="up" delay={i * 75}>
              <article className="simple-service-card">
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
            </Reveal>
          ))}
        </div>
        <Reveal direction="up" delay={100}>
          <div className="site-shell section-button-center">
            <Link className="button secondary" href="/services" prefetch>
              View All Services
            </Link>
          </div>
        </Reveal>
      </section>
    </>
  );
}
