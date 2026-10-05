import type { Metadata } from "next";
import Link from "next/link";
import { Reveal } from "@/components/reveal";
import { TrackedBookLink } from "@/components/tracked-book-link";
import { allOnlinePhysioSlugs, getOnlinePhysioPage } from "@/lib/online-physio-pages";
import { HOME_VISIT_AREA_LABEL } from "@/lib/home-visit-area";
import { formatPounds, sessionPricePence, travelFeePence } from "@/lib/home-visit-pricing";
import { practiceRef } from "@/lib/structured-data";
import { absoluteUrl } from "@/lib/utils";

// Home visits cost the video price plus a travel fee, so the two prices are
// derived separately from lib/home-visit-pricing.
const videoInitial = formatPounds(sessionPricePence("initial-assessment"));
const homeInitial = formatPounds(sessionPricePence("initial-assessment") + travelFeePence("initial-assessment", "home"));

// CLINICAL REVIEW GATE: draft copy pending Shivaliba Zala's sign-off
// (docs/seo/phase-b-clinical-review.md). Dev site only until then.

export const metadata: Metadata = {
  alternates: { canonical: "/online-physiotherapy-scotland" },
  title: "Online Physiotherapy in Scotland | PhysioOnClick",
  description: `Video physiotherapy across Scotland, plus home visits in the Glasgow area, with a Glasgow-based HCPC physiotherapist. No GP referral. ${videoInitial} video assessment.`,
};

const PHS_URL =
  "https://www.publichealthscotland.scot/publications/allied-health-professionals-musculoskeletal-waiting-times-in-nhs-scotland/allied-health-professionals-musculoskeletal-waiting-times-in-nhs-scotland-quarterly-and-monthly-data-to-31-march-2026/";
const NHS_INFORM_URL = "https://www.nhsinform.scot/illnesses-and-conditions/muscle-bone-and-joints/how-to-access-msk-services/";
const NHSGGC_URL =
  "https://www.nhsggc.scot/hospitals-services/services-a-to-z/musculoskeletal-msk-physiotherapy/self-referral-to-adult-msk-physiotherapy/";

const faqItems: { question: string; answer: React.ReactNode }[] = [
  {
    question: "Can I see you in person in Scotland?",
    answer: (
      <>
        Yes, through home visits in {HOME_VISIT_AREA_LABEL}. Elsewhere in Scotland, appointments are by video. We
        have no clinic or premises. When you book a home visit you enter your postcode and see straight away whether
        we cover it. If you need hands-on care and a home visit is not available to you, we will tell you at your
        assessment and suggest you look for an in-person service, for example through your GP or your health
        board&rsquo;s NHS MSK service. For emergencies, call 999 or go to A&amp;E.
      </>
    ),
  },
  {
    question: "Do you cover the Highlands and islands?",
    answer: (
      <>
        Our appointments are by video, so you can join from anywhere with a stable internet connection. You need a
        device with a camera and microphone, and a reasonably stable connection. We cannot promise your connection
        will be good enough where you live, so please check it before you book.
      </>
    ),
  },
  {
    question: "Can I claim on insurance?",
    answer: (
      <>
        Cover and rules vary, and we cannot promise that any insurer will pay. Check with your insurer before you
        book. Our guide on{" "}
        <Link href="/guides/claim-physiotherapy-on-health-insurance">claiming physiotherapy on health insurance</Link>{" "}
        explains what to ask.
      </>
    ),
  },
];

export default function ScotlandPage() {
  return (
    <div className="site-shell">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebPage",
            name: "Online Physiotherapy in Scotland",
            url: absoluteUrl("/online-physiotherapy-scotland"),
            about: practiceRef(),
          }),
        }}
      />
      <section className="page-hero page-hero-split">
        <div className="stack">
          <span className="eyebrow">Online Physiotherapy in Scotland</span>
          <h1>Online physiotherapy across Scotland</h1>
          <p className="lead">
            PhysioOnClick is run by a Glasgow-based, HCPC registered physiotherapist. Video appointments are
            available across Scotland with a stable internet connection, and home visits are available in the
            Glasgow area. You do not need a GP referral, and the initial assessment is {videoInitial} by
            video, or {homeInitial} as a home visit.
          </p>
          <div className="button-row">
            <TrackedBookLink
              className="button primary"
              href="/book?service=initial-assessment"
              source="scotland_page"
              event="book_now_click"
            >
              Book your session
            </TrackedBookLink>
          </div>
        </div>
        <div className="page-hero-aside checklist-panel">
          <h2>What to know first</h2>
          <ul className="clean-list">
            <li>Video appointments across Scotland, and home visits only in {HOME_VISIT_AREA_LABEL}.</li>
            <li>You need a camera, a microphone and a reasonably stable connection.</li>
            <li>
              Local to Glasgow? See our{" "}
              <Link href="/glasgow-physiotherapist">Glasgow physiotherapist page</Link> for home visits.
            </li>
            <li>
              <Link href="/services/neurological-rehabilitation">Neurological rehabilitation</Link> is also
              available by video. Before you start, your GP or specialist team must confirm it is safe for you to begin physiotherapy.
            </li>
          </ul>
        </div>
      </section>

      <Reveal direction="up">
        <section className="page-section stack">
          <h2>Waiting for NHS physiotherapy in Scotland</h2>
          <p>
            Public Health Scotland reports that between August 2025 and March 2026, on average 52.4% of completed
            waits for allied health professional musculoskeletal services were seen within four weeks. These
            figures cover all allied health professions in those services, not physiotherapy alone, and they
            describe people already seen.{" "}
            <a href={PHS_URL} target="_blank" rel="noopener noreferrer">
              Read the Public Health Scotland report
            </a>
            . Our guide to{" "}
            <Link href="/guides/nhs-physio-waiting-times-scotland">NHS physio waiting times in Scotland</Link>{" "}
            goes through the figures.
          </p>
          <p>
            NHS access depends on your health board.{" "}
            <a href={NHS_INFORM_URL} target="_blank" rel="noopener noreferrer">
              NHS inform
            </a>{" "}
            says each board decides how its MSK services are accessed. NHS Greater Glasgow and Clyde, for example,{" "}
            <a href={NHSGGC_URL} target="_blank" rel="noopener noreferrer">
              lets eligible adults self-refer
            </a>
            . You can try the NHS route first, and private video physiotherapy is another choice if you would rather
            book directly.
          </p>
        </section>
      </Reveal>

      <Reveal direction="up">
        <section className="page-section stack">
          <h2>Conditions we cover by video</h2>
          <p>
            Each page explains how a video appointment works for that problem and when you need to be seen in
            person or urgently instead.
          </p>
          <ul className="clean-list">
            {allOnlinePhysioSlugs().map((slug) => (
              <li key={slug}>
                <Link href={`/online-physiotherapy-for/${slug}`}>
                  {getOnlinePhysioPage(slug)?.h1 ?? slug}
                </Link>
              </li>
            ))}
          </ul>
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
            <h2>Book physiotherapy from anywhere in Scotland</h2>
            <p>Schedule your video appointment or Glasgow-area home visit now, or get in touch if you have a question first.</p>
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
