import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";

import { founder } from "@/lib/site-data";
import { medicalImagePlaceholder } from "@/lib/image-placeholders";

export const metadata: Metadata = {
  title: "About Shivaliba Zala | PhysioOnClick",
  description: "Learn about Shivaliba Zala, HCPC registered physiotherapist and founder of PhysioOnClick."
};

const specialisms = [
  {
    slug: "arthroplasty-rehabilitation",
    title: "Arthroplasty Rehabilitation",
    text: "Expert in total knee and hip replacement recovery, guiding patients from surgery to full function.",
    detail: "TKR, THR and structured orthopaedic progression"
  },
  {
    slug: "neurological-rehabilitation",
    title: "Neurological Rehabilitation",
    text: "Evidence-based treatment for stroke, Parkinson's disease and multiple sclerosis.",
    detail: "Mobility, gait confidence and functional recovery"
  },
  {
    slug: "paediatric-physiotherapy",
    title: "Paediatric Physiotherapy",
    text: "Gentle, effective physiotherapy for children with developmental and musculoskeletal conditions.",
    detail: "Play-based movement support and family-led rehab"
  },
  {
    slug: "research-and-innovation",
    title: "Research & Innovation",
    text: "MSc thesis on VR versus traditional exercise, combining clinical rigour with innovative approaches.",
    detail: "EMG, motion analysis and rehab technology insight"
  }
];

const highlights = [
  "4+ years of clinical physiotherapy experience",
  "NHS Tayside placement and orthopaedic rehab exposure",
  "In-person care in Glasgow and online support across the UK",
  "Evidence-based approach with calm, practical treatment planning"
];

export default function AboutPage() {
  return (
    <div className="site-shell">
      <section className="simple-page-hero about-page-hero">
        <span>About Shivaliba</span>
        <h1>Clinical physiotherapy with calm communication, structured rehabilitation and evidence-based care.</h1>
        <p>
          Learn more about {founder.name}, the clinical background behind PhysioOnClick and the specialist areas that
          shape every treatment plan.
        </p>
      </section>

      <section className="page-section about-overview-grid">
        <article className="about-overview-card">
          <span className="eyebrow">Founder profile</span>
          <h2>{founder.name}</h2>
          <p>
            {founder.name} is an HCPC registered physiotherapist and CSP member with a background spanning
            arthroplasty rehab, neurological rehabilitation, paediatric physiotherapy and rehabilitation technology.
          </p>
          <p>
            Her approach combines clear communication, practical rehabilitation planning and evidence-based clinical
            decision making, both in-person in Glasgow and through online appointments across the UK.
          </p>
          <div className="about-highlight-list">
            {highlights.map((item) => (
              <span className="about-highlight-pill" key={item}>
                {item}
              </span>
            ))}
          </div>
          <div className="button-row">
            <Link className="button primary" href="/pricing#book">
              Book Assessment
            </Link>
            <Link className="button secondary" href="/services">
              Explore Services
            </Link>
          </div>
        </article>

        <aside className="about-profile-card">
          <Image
            className="about-profile-image"
            src="https://images.unsplash.com/photo-1666214280391-8ff5bd3c0bf0?auto=format&fit=crop&w=1200&q=80"
            alt="Clinical physiotherapy consultation"
            width={1200}
            height={980}
            placeholder="blur"
            blurDataURL={medicalImagePlaceholder}
          />
          <div className="about-profile-body">
            <strong>{founder.name}</strong>
            <p>{founder.location}</p>
            <div className="about-credential-grid">
              {founder.credentials.map((item) => (
                <span key={item}>{item}</span>
              ))}
            </div>
          </div>
        </aside>
      </section>

      <section className="page-section stack">
        <div className="section-heading about-section-heading">
          <h2>Areas of Specialism</h2>
          <p>Focused rehabilitation pathways built around function, confidence and measurable progress.</p>
        </div>
        <div className="about-specialism-grid">
          {specialisms.map((item) => (
            <article className="about-specialism-card" key={item.title}>
              <Image
                className="about-specialism-image"
                src={`/specialism-images/${item.slug}`}
                alt={item.title}
                width={900}
                height={520}
                unoptimized
                placeholder="blur"
                blurDataURL={medicalImagePlaceholder}
              />
              <div className="about-specialism-body">
                <span className="about-specialism-detail">{item.detail}</span>
                <h3>{item.title}</h3>
                <p>{item.text}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="about-story-band">
        <div className="about-story-copy">
          <span className="eyebrow">Clinical background</span>
          <h2>From movement analysis research to practical rehab that patients can actually follow.</h2>
          <p>
            Shivaliba&apos;s background includes NHS training exposure, EMG and motion analysis research, and an MSc in
            Orthopaedic & Rehabilitation Technology from the University of Dundee. That combination helps PhysioOnClick
            balance clinical rigour with clear, realistic rehabilitation plans.
          </p>
        </div>
        <div className="about-story-stats">
          <div className="about-stat-card">
            <strong>4+</strong>
            <span>Years of experience</span>
          </div>
          <div className="about-stat-card">
            <strong>MSc</strong>
            <span>Orthopaedic & Rehabilitation Technology</span>
          </div>
          <div className="about-stat-card">
            <strong>NHS</strong>
            <span>Tayside placement experience</span>
          </div>
          <div className="about-stat-card">
            <strong>UK-wide</strong>
            <span>Online consultations alongside Glasgow clinic care</span>
          </div>
        </div>
      </section>

      <section className="simple-cta-band">
        <div className="site-shell simple-cta-inner">
          <h2>Book a Consultation</h2>
          <p>Ready to discuss your symptoms and treatment options? Book an in-person or online assessment today.</p>
          <Link className="button secondary cta-white" href="/pricing#book">
            Book Assessment
          </Link>
        </div>
      </section>
    </div>
  );
}
