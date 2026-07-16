import Image from "next/image";
import Link from "next/link";

import { founder, testimonials } from "@/lib/site-data";
import { getPublicServices } from "@/lib/public-content";
import { HomeHeroSection } from "@/components/home-hero-section";
import { Reveal } from "@/components/reveal";

export default async function HomePage() {
  const homeServices = getPublicServices().slice(0, 4);
  const founderInitials = founder.name
    .split(" ")
    .map((part) => part[0])
    .join("");
  const homeTestimonials = testimonials.slice(0, 2);

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
            <span className="eyebrow">Meet your physiotherapist</span>
            <h2>Care led by {founder.name}</h2>
            <p>Every session is delivered — or personally overseen — by the same HCPC registered physiotherapist, not passed between clinicians.</p>
          </div>
        </Reveal>
        <div className="site-shell home-proof-grid">
          <Reveal direction="up">
            <article className="card home-founder-card">
              <span className="home-founder-avatar" aria-hidden="true">
                {founderInitials}
              </span>
              <h3>{founder.name}</h3>
              <p className="muted">{founder.location}</p>
              <ul className="home-founder-credentials">
                {founder.credentials.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
              <Link className="button secondary" href="/about" prefetch>
                More about {founder.name.split(" ")[0]}
              </Link>
            </article>
          </Reveal>
          <div className="home-testimonial-stack">
            {homeTestimonials.map((testimonial, i) => (
              <Reveal key={testimonial.name} direction="up" delay={75 + i * 75}>
                <blockquote className="card home-testimonial-card">
                  <p>&ldquo;{testimonial.quote}&rdquo;</p>
                  <footer>
                    <strong>{testimonial.name}</strong>
                    <span>
                      {testimonial.location} &middot; {testimonial.focus}
                    </span>
                  </footer>
                </blockquote>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

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
                <Link href={`/services#${service.slug}`} prefetch aria-label={`Learn more about ${service.title}`}>Learn more →</Link>
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

      <section className="simple-cta-band" id="book">
        <div className="site-shell simple-cta-inner">
          <span className="eyebrow">Ready when you are</span>
          <h2>Book your first session</h2>
          <p>Get a tailored physiotherapy plan from an HCPC registered specialist, in-person in Glasgow or online across the UK.</p>
          <Link className="button secondary cta-white" href="/book">
            Book your session
          </Link>
        </div>
      </section>
    </>
  );
}
