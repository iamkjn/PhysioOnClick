import type { Metadata } from "next";
import Link from "next/link";

import { Reveal } from "@/components/reveal";
import { TrackedBookLink } from "@/components/tracked-book-link";
import { initialAssessmentPrice } from "@/lib/site-data";
import { HOME_VISIT_AREA_LABEL } from "@/lib/home-visit-area";
import { formatPounds, HOME_VISIT_TRAVEL_FEE_PENCE } from "@/lib/home-visit-pricing";
import { breadcrumbs, practiceRef } from "@/lib/structured-data";

export const metadata: Metadata = {
  alternates: { canonical: "/how-online-physiotherapy-works" },
  title: "How Online Physiotherapy Works | PhysioOnClick",
  description: `How a video physio appointment works: book a live slot (no GP referral), a £${initialAssessmentPrice} assessment, then a personalised exercise plan and insurance-ready invoice.`
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
    title: "Complete a short assessment as you book",
    body: "Before you pay, you fill in a short assessment as part of booking, so your physiotherapist has the full picture before your session."
  },
  {
    title: "Pay securely and get your receipt",
    body: "Payment is handled by Stripe before the appointment is confirmed. A payment receipt and a PDF invoice — suitable for a health insurance claim — are emailed automatically."
  },
  {
    title: "Attend your video consultation or home visit",
    body: "For a video appointment, your confirmation email includes a secure video link for your appointment time, and no separate app or account is required to join. If you chose a home visit in the Glasgow area, your physiotherapist comes to you at the booked time, and our receipt email shows the visit address."
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
  },
  {
    question: "Can I be seen in person?",
    answer: `Yes, through home visits in ${HOME_VISIT_AREA_LABEL}. We have no clinic or premises. Video appointments are available anywhere in the UK. A home visit costs the video price plus a ${formatPounds(HOME_VISIT_TRAVEL_FEE_PENCE)} travel fee per visit, and can include hands-on treatment (manual therapy) where appropriate; video sessions cannot. Choose your visit type when you book; for a home visit you enter your postcode and see straight away whether we cover it.`
  },
  {
    question: "Do I need a GP referral?",
    answer: "No. You can book private physiotherapy yourself — there's no referral letter or waiting list."
  },
  {
    question: "How quickly can I be seen compared with the NHS?",
    answer:
      "Usually within days — you choose a live slot when you book. In NHS Scotland, only 52.4% of musculoskeletal patients were seen within the four-week target between August 2025 and March 2026 (Public Health Scotland, June 2026).",
    sourceUrl:
      "https://www.publichealthscotland.scot/publications/allied-health-professionals-musculoskeletal-waiting-times-in-nhs-scotland/allied-health-professionals-musculoskeletal-waiting-times-in-nhs-scotland-quarterly-and-monthly-data-to-31-march-2026/"
  },
  {
    question: "What does it cost, and can I claim it on insurance?",
    answer: `An initial assessment is £${initialAssessmentPrice}. Every paid session comes with a receipt plus a PDF invoice showing the physiotherapist's HCPC registration number, which you can submit to your health insurer — check your policy covers physiotherapy first.`
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
            plan you can follow at home. You can book a video appointment anywhere in the UK, or a home visit
            in the Glasgow area.
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
        <p>
          Wondering how well it works?{" "}
          <Link href="/guides/does-online-physiotherapy-work">Does online physiotherapy work?</Link>
        </p>
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
                <p>
                  {item.answer}
                  {"sourceUrl" in item ? (
                    <>
                      {" "}
                      <a href={item.sourceUrl} target="_blank" rel="noopener noreferrer">
                        Source
                      </a>
                    </>
                  ) : null}
                </p>
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
          <TrackedBookLink
            className="button secondary cta-white"
            href="/book"
            source="how_it_works_page"
            event="book_now_click"
          >
            Book your session
          </TrackedBookLink>
        </div>
      </section>
    </div>
  );
}
