import type { Metadata } from "next";
import Link from "next/link";
import { Reveal } from "@/components/reveal";
import { TrackedBookLink } from "@/components/tracked-book-link";
import { initialAssessmentPrice } from "@/lib/site-data";
import { practiceRef } from "@/lib/structured-data";

export const metadata: Metadata = {
  alternates: { canonical: "/glasgow-physiotherapist" },
  title: "Physiotherapist Glasgow: Home Visits & Online | PhysioOnClick",
  description: `Physiotherapist in Glasgow offering home visits in the Glasgow area, plus video appointments across the UK. No GP referral needed. £${initialAssessmentPrice} initial assessment.`
};

const faqItems = [
  {
    question: "Do you treat patients in Glasgow?",
    answer:
      "Yes. PhysioOnClick is run by a Glasgow-based, HCPC registered physiotherapist. Glasgow-area patients can choose a home visit or a video appointment, and video appointments are available anywhere in the UK."
  },
  {
    question: "Can I be seen in person in Glasgow?",
    answer:
      "Yes, through home visits in the Glasgow area. We do not have a clinic or premises, so all in-person care happens at your home. Choose \"Home visit (Glasgow area)\" when you book. We'll confirm by email if your address is outside the area we cover."
  },
  {
    question: "How much does a home visit cost?",
    answer: `Home visits cost the same as video appointments. The initial assessment is £${initialAssessmentPrice}, and follow-up and bundle prices are the same as for video. See the pricing page for the full list.`
  },
  {
    question: "Can I book a video appointment if I live outside Glasgow?",
    answer: "Yes. Video appointments for assessments and follow-ups are available anywhere in the UK. Home visits are for the Glasgow area only."
  },
  {
    question: "What conditions do you treat?",
    answer:
      "Common areas include back pain, knee injuries, shoulder rehab, post-surgical recovery, neurological rehabilitation and mobility concerns. After an operation, rehab starts once your surgical team has confirmed you have no restrictions."
  },
  {
    question: "Do you offer neurological physiotherapy for Glasgow patients?",
    answer:
      "Yes, by video or as a home visit in the Glasgow area, with a family member or carer welcome to join. Sessions cover stroke recovery, Parkinson's-related mobility, balance and falls risk. Before you start, your GP or specialist team must confirm it is safe for you to begin physiotherapy. We'll tell you at triage if another service would suit you better."
  }
];

export default function GlasgowPage() {
  return (
    <div className="site-shell">
      {/* Was a standalone MedicalOrganization node with its own (inconsistent)
          areaServed — that competed with the sitewide practice entity from
          app/layout.tsx. Reference the same practice by @id instead of
          declaring a second, unlinked organization for this page. */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
        "@context": "https://schema.org",
        "@type": "WebPage",
        about: practiceRef()
      }) }} />
      {/* FAQPage left exactly as-is — untouched by this refactor. */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: faqItems.map((f) => ({ "@type": "Question", name: f.question, acceptedAnswer: { "@type": "Answer", text: f.answer } }))
      }) }} />
      <section className="page-hero page-hero-split">
        <div className="stack">
          <span className="eyebrow">Physiotherapy in Glasgow</span>
          <h1>Physiotherapist in Glasgow: home visits and online appointments</h1>
          <p className="lead">
            PhysioOnClick is run by a Glasgow-based, HCPC registered physiotherapist. If you are in the
            Glasgow area you can book a home visit, and video appointments are available anywhere in the UK.
            Prices are the same for both, and the initial assessment is £{initialAssessmentPrice}.
          </p>
          <div className="button-row">
            <TrackedBookLink
              className="button primary"
              href="/book?visit=home"
              source="glasgow_page_home_visit"
              event="book_now_click"
            >
              Book a home visit
            </TrackedBookLink>
            <TrackedBookLink
              className="button secondary"
              href="/book"
              source="glasgow_page_video"
              event="book_now_click"
            >
              Book a video appointment
            </TrackedBookLink>
          </div>
        </div>
        <div className="page-hero-aside checklist-panel">
          <h2>Two ways to be seen</h2>
          <ul className="clean-list">
            <li>Glasgow-based, HCPC registered physiotherapist</li>
            <li>Home visits in the Glasgow area, with no clinic or premises</li>
            <li>Video appointments anywhere in the UK</li>
            <li>Same prices and the same booking flow for both</li>
            <li>
              Living elsewhere in Scotland?{" "}
              <Link href="/online-physiotherapy-scotland" prefetch>
                Online physio in Scotland
              </Link>
            </li>
            <li>
              <Link href="/services/neurological-rehabilitation" prefetch>
                Neurological physiotherapy
              </Link>{" "}
              by video or home visit, for stroke, Parkinson&rsquo;s and balance problems. Before you start, your GP or specialist team must confirm it is safe for you to begin physiotherapy.
            </li>
          </ul>
        </div>
      </section>

      <section className="page-section two-col">
        <Reveal direction="up">
          <div className="panel stack soft-panel">
            <h2>What a home visit includes</h2>
            <ul className="clean-list">
              <li>A physiotherapy assessment at your home, covering your history and how you move</li>
              <li>A tailored exercise plan with clear milestones</li>
              <li>A written summary after your session</li>
              <li>The same HCPC registered physiotherapist, with follow-ups by home visit or video</li>
            </ul>
            <p>
              Home visits are for the Glasgow area. We have no clinic or premises. When you book, choose
              &ldquo;Home visit (Glasgow area)&rdquo; and enter your address. We&rsquo;ll confirm by email if your
              address is outside the area we cover.
            </p>
          </div>
        </Reveal>
        <Reveal direction="up" delay={80}>
          <div className="panel stack image-panel">
            <h2>How video sessions work</h2>
            <ul className="clean-list">
              <li>Book a session online in a few minutes</li>
              <li>Join your assessment by secure video call from anywhere in the UK</li>
              <li>Receive a personalised rehab plan and exercise prescription</li>
              <li>Track progress with follow-up sessions</li>
            </ul>
          </div>
        </Reveal>
      </section>

      <Reveal direction="up">
        <section className="page-section stack">
          <h2>Prices are the same for home visits and video</h2>
          <p>
            The initial assessment is £{initialAssessmentPrice} whether you choose a home visit or a video call.
            Follow-ups and bundles are priced the same way for both. See{" "}
            <Link href="/pricing">pricing</Link> for the full list. If you are not sure which suits you, the{" "}
            <Link href="/how-online-physiotherapy-works">how it works</Link> page explains the booking steps.
          </p>
        </section>
      </Reveal>

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
            <h2>Book a physiotherapy home visit in Glasgow</h2>
            <p>Choose a home visit or a video appointment, or get in touch if you have a question first.</p>
            <div className="button-row" style={{ justifyContent: "center" }}>
              <Link className="button secondary cta-white" href="/book?visit=home">
                Book a home visit
              </Link>
              <Link className="button secondary cta-white" href="/book">
                Book a video appointment
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
