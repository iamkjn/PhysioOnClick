import type { Metadata } from "next";
import Link from "next/link";
import { Reveal } from "@/components/reveal";

export const metadata: Metadata = {
  title: "Online Physiotherapist for Glasgow Patients | PhysioOnClick",
  description:
    "Online physiotherapy for patients in Glasgow — evidence-based rehab and assessments, booked securely online. No clinic visit required."
};

const faqItems = [
  {
    question: "Do you treat patients in Glasgow?",
    answer:
      "Yes. PhysioOnClick is run by a Glasgow-based, HCPC registered physiotherapist and works with patients in Glasgow (and across the UK) entirely online, through secure video assessments and structured rehab plans."
  },
  {
    question: "Can I book online physiotherapy if I live outside Glasgow?",
    answer: "Yes. Online physiotherapy assessments and follow-ups are available anywhere in the UK."
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
    "@type": "MedicalOrganization",
    name: "PhysioOnClick",
    areaServed: "Glasgow, UK",
    medicalSpecialty: "Physiotherapy"
  };

  return (
    <div className="site-shell">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: faqItems.map((f) => ({ "@type": "Question", name: f.question, acceptedAnswer: { "@type": "Answer", text: f.answer } }))
      }) }} />
      <section className="page-hero page-hero-split">
        <div className="stack">
          <span className="eyebrow">Physiotherapy in Glasgow</span>
          <h1>Online Physiotherapist for Glasgow Patients</h1>
          <p className="lead">
            PhysioOnClick provides calm, clinical physiotherapy for Glasgow patients — fully online, with
            transparent pricing, evidence-based rehabilitation and secure booking.
          </p>
          <div className="button-row">
            <Link className="button primary" href="/book">
              Book your session
            </Link>
          </div>
        </div>
        <div className="page-hero-aside checklist-panel">
          <h2>Local patient benefits</h2>
          <ul className="clean-list">
            <li>Glasgow-based, HCPC registered physiotherapist</li>
            <li>Every session delivered online</li>
            <li>Clear pricing and secure booking</li>
            <li>Same-week appointments</li>
          </ul>
        </div>
      </section>

      <section className="page-section two-col">
        <Reveal direction="up">
          <div className="panel stack soft-panel">
            <h2>Why Glasgow patients book PhysioOnClick</h2>
            <ul className="clean-list">
              <li>Online assessments for musculoskeletal and post-surgical care, wherever you are in Glasgow</li>
              <li>Structured rehabilitation planning with clear milestones and home exercise support</li>
              <li>Video follow-ups for continuity and convenience</li>
              <li>Straightforward pricing, no hidden fees</li>
            </ul>
          </div>
        </Reveal>
        <Reveal direction="up" delay={80}>
          <div className="panel stack image-panel">
            <h2>How online sessions work</h2>
            <ul className="clean-list">
              <li>Book a session online in a few minutes</li>
              <li>Join your assessment by secure video call</li>
              <li>Receive a personalised rehab plan and exercise prescription</li>
              <li>Track progress with follow-up sessions</li>
            </ul>
          </div>
        </Reveal>
      </section>

      <Reveal direction="up">
        <section className="page-section stack service-faqs">
          <h2>Frequently asked questions</h2>
          {faqItems.map((faq) => (
            <details key={faq.question}>
              <summary>{faq.question}</summary>
              <p>{faq.answer}</p>
            </details>
          ))}
        </section>
      </Reveal>

      <Reveal direction="up">
        <section className="simple-cta-band" id="book">
          <div className="site-shell simple-cta-inner">
            <span className="eyebrow">Ready to book?</span>
            <h2>Book physiotherapy in Glasgow</h2>
            <p>Schedule your online appointment now, or get in touch if you have a question first.</p>
            <div className="button-row" style={{ justifyContent: "center" }}>
              <Link className="button secondary cta-white" href="/book">
                Book your session
              </Link>
              <Link className="button inverted" href="/contact">
                Contact us
              </Link>
            </div>
          </div>
        </section>
      </Reveal>
    </div>
  );
}
