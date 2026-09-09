import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { cookies } from "next/headers";

import { founder, testimonials } from "@/lib/site-data";
import { getPublicServices } from "@/lib/public-content";
import { HomeHeroSection } from "@/components/home-hero-section";
import { Reveal } from "@/components/reveal";
import { TrustpilotReviews } from "@/components/trustpilot-reviews";

// Title/description/openGraph are inherited from the root layout — metadata
// merges per field, so declaring only `alternates` here leaves those intact.
export const metadata: Metadata = {
  alternates: { canonical: "/" }
};

export default async function HomePage() {
  // Set by the header's auth observer on sign-in/out. Lets the hero render a
  // dashboard loader (not the logged-out hero) for returning patients, so the
  // signed-in home doesn't flash the marketing hero first. Signed-out visitors
  // have no cookie and get the marketing hero immediately.
  const initialSignedIn = (await cookies()).get("poc-auth")?.value === "1";
  const homeServices = getPublicServices().slice(0, 4);
  const founderInitials = founder.name
    .split(" ")
    .map((part) => part[0])
    .join("");

  return (
    <>
      <HomeHeroSection founderName={founder.name} initialSignedIn={initialSignedIn} />

      <Reveal direction="fade">
        <section className="trust-bar-section">
          <div className="site-shell trust-bar">
            <span>HCPC Registered</span>
            <span>CSP Member</span>
            <span>Online appointments across the UK</span>
          </div>
        </section>
      </Reveal>

      <section className="page-section simple-section">
        <Reveal direction="up">
          <div className="site-shell section-heading">
            <span className="eyebrow">Meet your physiotherapist</span>
            <h2>Care led by {founder.name}</h2>
            <p>Every session is delivered (or personally overseen) by the same HCPC registered physiotherapist, not passed between clinicians.</p>
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
          <TrustpilotReviews fallback={testimonials} />
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

      <section className="page-section simple-section">
        <Reveal direction="up">
          <div className="site-shell section-heading">
            <span className="eyebrow">No clinic visit required</span>
            <h2>How online physiotherapy works</h2>
            <p>
              A full assessment, a real diagnosis and a plan you can act on the same day &mdash; all
              over video, with the same physiotherapist reviewing your progress every session.
            </p>
          </div>
        </Reveal>
        <div className="site-shell simple-card-grid">
          <Reveal direction="up" delay={0}>
            <article className="simple-service-card">
              <h3>1. Book online</h3>
              <p>Choose a time that suits you and complete a short pre-session assessment so the first call starts with useful context, not a blank slate.</p>
            </article>
          </Reveal>
          <Reveal direction="up" delay={75}>
            <article className="simple-service-card">
              <h3>2. Video assessment</h3>
              <p>A 60-minute guided assessment: history, a movement or functional screen talked through over video, and red-flag screening to confirm online care is the right fit.</p>
            </article>
          </Reveal>
          <Reveal direction="up" delay={150}>
            <article className="simple-service-card">
              <h3>3. Personalised plan</h3>
              <p>You leave with a working diagnosis, a written explanation of what&rsquo;s going on, and exercises to start immediately &mdash; not a wait-and-see appointment.</p>
            </article>
          </Reveal>
          <Reveal direction="up" delay={225}>
            <article className="simple-service-card">
              <h3>4. Ongoing review</h3>
              <p>Follow-up sessions track progress and adjust loading and exercises &mdash; the same clinician throughout, so nothing gets lost between appointments.</p>
            </article>
          </Reveal>
        </div>
        <Reveal direction="up" delay={100}>
          <div className="site-shell section-button-center">
            <Link className="button secondary" href="/how-online-physiotherapy-works" prefetch>
              See the full process
            </Link>
          </div>
        </Reveal>
      </section>

      <section className="page-section simple-section">
        <Reveal direction="up">
          <div className="site-shell section-heading">
            <h2>Common questions</h2>
          </div>
        </Reveal>
        <div className="site-shell service-faqs">
          <details>
            <summary>Do I need a GP referral for online physiotherapy?</summary>
            <p>No. You can self-refer for private physiotherapy directly &mdash; book an initial assessment whenever you&rsquo;re ready.</p>
          </details>
          <details>
            <summary>Is online physiotherapy actually effective?</summary>
            <p>For the large majority of musculoskeletal and rehab concerns &mdash; back, neck, shoulder, tendon pain, and post-surgical recovery &mdash; a guided video assessment reaches an accurate working diagnosis and produces the same structured exercise-based treatment that in-person care would. See <Link href="/glasgow-physiotherapist" prefetch>how this works for Glasgow patients specifically</Link>.</p>
          </details>
          <details>
            <summary>What if online care isn&rsquo;t right for my situation?</summary>
            <p>You&rsquo;ll be told plainly at triage. Red-flag symptoms, suspected fractures, or conditions needing hands-on treatment as the primary intervention are pointed toward an in-person clinician or your GP rather than kept in an online plan that isn&rsquo;t the right fit.</p>
          </details>
          <details>
            <summary>Can I claim this back through insurance?</summary>
            <p>Yes &mdash; every paid session generates an insurance-ready receipt and invoice automatically, emailed to you and available any time from your account.</p>
          </details>
        </div>
      </section>

      <section className="simple-cta-band" id="book">
        <div className="site-shell simple-cta-inner">
          <span className="eyebrow">Ready when you are</span>
          <h2>Book your first session</h2>
          <p>Get a tailored physiotherapy plan from an HCPC registered specialist, delivered online across the UK.</p>
          <Link className="button secondary cta-white" href="/book">
            Book your session
          </Link>
        </div>
      </section>
    </>
  );
}
