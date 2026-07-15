import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Physiotherapist in Glasgow | PhysioOnClick",
  description:
    "Looking for a physiotherapist in Glasgow? Book evidence-based physiotherapy and rehabilitation with PhysioOnClick."
};

const faqItems = [
  {
    question: "Do you offer in-person physiotherapy in Glasgow?",
    answer: "Yes. PhysioOnClick offers in-person appointments in Glasgow alongside UK-wide online consultations."
  },
  {
    question: "Can I book online physiotherapy if I live outside Glasgow?",
    answer: "Yes. Online physiotherapy assessments and follow-ups are available across the UK."
  },
  {
    question: "What conditions do you treat?",
    answer:
      "Common areas include back pain, knee injuries, shoulder rehab, post-surgical recovery, neurological rehabilitation and mobility concerns."
  }
];

export default function GlasgowPage() {
  const schema = {
    "@context": "https://schema.org",
    "@type": "MedicalBusiness",
    name: "PhysioOnClick",
    areaServed: "Glasgow, UK",
    medicalSpecialty: "Physiotherapy",
    address: {
      "@type": "PostalAddress",
      addressLocality: "Glasgow",
      addressCountry: "GB"
    }
  };

  return (
    <div className="site-shell">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />
      <section className="page-hero page-hero-split">
        <div className="stack">
          <span className="eyebrow">Physiotherapy in Glasgow</span>
          <h1>Physiotherapist in Glasgow</h1>
          <p className="lead">
            PhysioOnClick provides calm, clinical physiotherapy in Glasgow with transparent pricing, evidence-based
            rehabilitation and secure online booking for local patients.
          </p>
        </div>
        <div className="page-hero-aside checklist-panel">
          <h3>Local patient benefits</h3>
          <ul className="clean-list">
            <li>In-person care in Glasgow</li>
            <li>Online follow-up if needed</li>
            <li>Clear pricing and secure booking</li>
            <li>Trust-focused healthcare UX</li>
          </ul>
        </div>
      </section>

      <section className="page-section two-col">
        <div className="panel stack soft-panel">
          <h2>Why local patients book PhysioOnClick</h2>
          <ul className="clean-list">
            <li>In-person assessments in Glasgow for musculoskeletal and post-surgical care</li>
            <li>Structured rehabilitation planning with clear milestones and home exercise support</li>
            <li>Online follow-up options for continuity and convenience</li>
            <li>Clear healthcare tone, clinical documentation and accessible design</li>
          </ul>
        </div>
        <div className="panel stack image-panel">
          <h2>Clinic map</h2>
          <div className="map-frame">
            <iframe
              title="Glasgow map"
              src="https://www.google.com/maps?q=Glasgow%20UK&output=embed"
              loading="lazy"
            />
          </div>
        </div>
      </section>

      <section className="page-section card-grid">
        {faqItems.map((faq) => (
          <article className="card stack info-card" key={faq.question}>
            <h3>{faq.question}</h3>
            <p className="muted">{faq.answer}</p>
          </article>
        ))}
      </section>

      {/* Google Business Profile review embed goes here */}
    </div>
  );
}
