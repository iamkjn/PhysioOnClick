import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";

import { founder } from "@/lib/site-data";
import { medicalImagePlaceholder } from "@/lib/image-placeholders";
import { Reveal } from "@/components/reveal";

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
  "Over 4 years of specialist orthopaedic, neurological & paediatric rehab experience",
  "NHS Tayside clinical placement at Ninewells Hospital & Kings Cross Hospital",
  "Certified in manual therapy, cupping therapy & kinesiology taping",
  "MSc-level research in EMG analysis and digital rehabilitation technology"
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

      <Reveal direction="up">
        <section className="page-section about-overview-grid">
          <article className="about-overview-card">
            <span className="eyebrow">Founder profile</span>
            <h2>{founder.name}</h2>
            <p>
              {founder.name} is an HCPC-registered physiotherapist and CSP member with over four years of clinical
              experience in musculoskeletal, orthopaedic, neurological, and paediatric rehabilitation. She holds an
              MSc in Orthopaedic &amp; Rehabilitation Technology from the University of Dundee and a Bachelor of
              Physiotherapy from Shree Sahajanand Institute of Physiotherapy, Bhavnagar University, India.
            </p>
            <p>
              Her specialist career includes four years as a physiotherapist in a dedicated arthroplasty unit at
              Krishna Shalby Multispeciality Hospital, delivering post-operative rehabilitation for patients
              recovering from total knee replacement, total hip replacement, shoulder arthroplasty, and spinal
              procedures. She has also completed an NHS Tayside clinical placement at Ninewells Hospital and Kings
              Cross Hospital, gaining specialist exposure in gait analysis, biomechanical assessment, and complex
              mobility rehabilitation.
            </p>
            <p>
              Alongside her clinical work, Shivaliba holds professional certifications in manual therapy and spinal
              techniques, cupping therapy, and kinesiology taping. Her MSc research — a within-subject EMG study
              comparing virtual reality exergaming with traditional exercise — reflects her commitment to
              evidence-based, technology-informed physiotherapy practice.
            </p>
            <div className="about-highlight-list">
              {highlights.map((item) => (
                <span className="about-highlight-pill" key={item}>
                  {item}
                </span>
              ))}
            </div>
            <div className="button-row">
              <Link className="button primary" href="/book">
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
      </Reveal>

      <section className="page-section stack">
        <Reveal direction="up">
          <div className="section-heading about-section-heading">
            <h2>Areas of Specialism</h2>
            <p>Focused rehabilitation pathways built around function, confidence and measurable progress.</p>
          </div>
        </Reveal>
        <div className="about-specialism-grid">
          {specialisms.map((item, i) => (
            <Reveal key={item.slug} direction="up" delay={i * 75}>
              <article className="about-specialism-card">
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
            </Reveal>
          ))}
        </div>
      </section>

      <Reveal direction="up">
        <section className="about-story-band">
          <div className="about-story-copy">
            <span className="eyebrow">Clinical background</span>
            <h2>From post-operative rehab and mobility science to structured plans built around what patients can actually do.</h2>
            <p>
              Shivaliba&apos;s background spans four years of specialist arthroplasty unit experience in a multispeciality
              hospital, an NHS Tayside placement in gait analysis and biomechanical assessment, and MSc-level research
              using electromyographic analysis to compare virtual reality exergaming with traditional exercise. This
              blend of clinical depth and research evidence underpins every treatment plan at PhysioOnClick — grounded
              in what works, adapted to each patient&apos;s realistic goals.
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
      </Reveal>

      <Reveal direction="up">
        <section className="simple-cta-band">
          <div className="site-shell simple-cta-inner">
            <h2>Book a Consultation</h2>
            <p>Ready to discuss your symptoms and treatment options? Book an in-person or online assessment today.</p>
            <Link className="button secondary cta-white" href="/book">
              Book Assessment
            </Link>
          </div>
        </section>
      </Reveal>
    </div>
  );
}
