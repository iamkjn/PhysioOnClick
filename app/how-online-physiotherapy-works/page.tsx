import type { Metadata } from "next";
import Link from "next/link";

import { Reveal } from "@/components/reveal";
import { breadcrumbs, practiceRef } from "@/lib/structured-data";

export const metadata: Metadata = {
  alternates: { canonical: "/how-online-physiotherapy-works" },
  title: "How Online Physiotherapy Works | PhysioOnClick",
  description:
    "What actually happens when you book online physiotherapy with PhysioOnClick — from choosing a service through to your video consultation and exercise plan."
};

// Steps mirror the real booking flow (components/booking-flow.tsx) and payment/
// assessment pipeline (app/api/payments/webhook, functions/src/index.ts), not
// generic telehealth marketing copy. Session lengths and pricing come from
// lib/cal-services.ts rather than being restated by hand, so this page can't
// drift out of sync with what the booking flow actually does.
const steps = [
  {
    title: "Choose your service and a time",
    body: "Pick from an initial assessment, a follow-up, or a multi-session bundle, then choose an available slot. Everything runs on UK time and updates in real time as slots are booked."
  },
  {
    title: "Pay securely and get your receipt",
    body: "Payment is handled by Stripe before the appointment is confirmed. A payment receipt and a PDF invoice — suitable for a health insurance claim — are emailed automatically."
  },
  {
    title: "Complete a short assessment beforehand",
    body: "For paid bookings, a short pre-appointment assessment is emailed ahead of your session via a secure sign-in link, so your physiotherapist has the full picture before you speak. A reminder is sent roughly an hour before your appointment if it isn't finished yet."
  },
  {
    title: "Attend your video consultation",
    body: "Your confirmation email includes a secure video link for your appointment time. No separate app or account is required to join."
  },
  {
    title: "Get your plan and keep it in one place",
    body: "After your session you'll have a personalised exercise plan and a written summary, both saved in your patient portal alongside your booking and invoice history."
  }
] as const;

const practicalQuestions = [
  {
    question: "How long is a session?",
    answer: "An initial assessment is 60 minutes. Follow-up sessions are 30 minutes."
  },
  {
    question: "What do I need to join?",
    answer: "A device with a camera, microphone and a reasonably stable internet connection — no special equipment or app installation."
  },
  {
    question: "Can I reschedule?",
    answer: "Yes, free of charge up to 24 hours before your appointment."
  }
  // TODO(shivaliba): add a question in your own words on why an online
  // assessment works well for the conditions you treat, if you'd like one here
  // — deliberately left out rather than written for you, since that's a
  // clinical-confidence claim only you should make.
] as const;

export default function HowOnlinePhysiotherapyWorksPage() {
  return (
    <div className="site-shell">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify({ "@context": "https://schema.org", "@type": "WebPage", about: practiceRef() }) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            breadcrumbs([
              { name: "Home", path: "/" },
              { name: "How Online Physiotherapy Works", path: "/how-online-physiotherapy-works" }
            ])
          )
        }}
      />

      <Reveal direction="up">
        <section className="simple-page-hero">
          <h1>
            How Online <span>Physiotherapy</span> Works
          </h1>
          <p>
            No clinic visit, no waiting room — just a clear five-step process from booking through to a
            plan you can follow at home.
          </p>
        </section>
      </Reveal>

      <section className="page-section stack">
        {steps.map((step, index) => (
          <Reveal direction="up" delay={index * 60} key={step.title}>
            <article className="panel stack soft-panel" style={{ maxWidth: "70ch" }}>
              <span className="eyebrow">Step {index + 1} of {steps.length}</span>
              <h2>{step.title}</h2>
              <p>{step.body}</p>
            </article>
          </Reveal>
        ))}
      </section>

      <section className="page-section stack">
        <Reveal direction="up">
          <h2>Practical questions</h2>
        </Reveal>
        <Reveal direction="up" delay={60}>
          {/* Plain content, not FAQPage schema — Google retired FAQ rich
              results for all sites in May 2026, so there's no SERP benefit to
              marking this up, and it stays simpler to keep in sync this way. */}
          <div className="service-faqs">
            {practicalQuestions.map((item) => (
              <details key={item.question}>
                <summary>{item.question}</summary>
                <p>{item.answer}</p>
              </details>
            ))}
          </div>
        </Reveal>
      </section>

      <section className="simple-cta-band">
        <div className="site-shell simple-cta-inner">
          <span className="eyebrow">Ready to book?</span>
          <h2>Start with an assessment</h2>
          <p>
            Every plan starts with a full assessment, delivered online across the UK by an{" "}
            <Link href="/professional-standards">HCPC-registered physiotherapist</Link>.
          </p>
          <Link className="button secondary cta-white" href="/book">
            Book your session
          </Link>
        </div>
      </section>
    </div>
  );
}
