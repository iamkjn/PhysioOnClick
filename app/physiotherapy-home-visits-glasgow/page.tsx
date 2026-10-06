import type { Metadata } from "next";
import Link from "next/link";
import { Reveal } from "@/components/reveal";
import { TrackedBookLink } from "@/components/tracked-book-link";
import { HOME_VISIT_AREA_LABEL } from "@/lib/home-visit-area";
import { formatPounds, HOME_VISIT_TRAVEL_FEE_PENCE, sessionPricePence, travelFeePence } from "@/lib/home-visit-pricing";
import { breadcrumbs, PRACTICE_PHONE, PRACTICE_PHONE_HREF, practiceRef } from "@/lib/structured-data";

// The home-visit page: what happens at a visit, who it suits and where we go.
// /glasgow-physiotherapist stays the general "physio in Glasgow" page (home
// visit or video); this one owns the home-visit intent. Every price is derived
// from lib/home-visit-pricing, never hardcoded.
const videoInitial = formatPounds(sessionPricePence("initial-assessment"));
const homeInitial = formatPounds(sessionPricePence("initial-assessment") + travelFeePence("initial-assessment", "home"));
const travelFee = formatPounds(HOME_VISIT_TRAVEL_FEE_PENCE);

export const metadata: Metadata = {
  alternates: { canonical: "/physiotherapy-home-visits-glasgow" },
  title: "Physio Home Visits Glasgow, Paisley & Hamilton | PhysioOnClick",
  description: `Physiotherapy home visits across Glasgow (G1–G53), Paisley and Hamilton by an HCPC registered physio. ${homeInitial} home assessment, hands-on treatment where appropriate.`
};

const faqItems = [
  {
    question: "Which areas do your home visits cover?",
    answer: `Home visits cover ${HOME_VISIT_AREA_LABEL}. When you book, choose "Home visit in Glasgow" and enter your postcode: you'll see straight away whether we cover it. A home visit cannot be booked for a postcode outside the area, so we'll suggest a video appointment instead.`
  },
  {
    question: "How much does a physiotherapy home visit cost?",
    answer: `A home visit costs the video appointment price plus a ${travelFee} travel fee per visit. The initial assessment is ${homeInitial} as a home visit (${videoInitial} by video). Bundles booked as home visits include the travel fee for every visit, paid when you book.`
  },
  {
    question: "Do I need a GP referral for a home visit?",
    answer:
      "No, you can book directly. For neurological rehabilitation, your GP or specialist team must confirm it is safe for you to begin physiotherapy before you start. After an operation, rehab with us starts once your surgical team has said you are ready for outpatient or community physiotherapy, and we follow any restrictions or precautions they give you."
  },
  {
    question: "Can a home visit include hands-on treatment?",
    answer:
      "Yes. A home visit can include hands-on treatment (manual therapy) where appropriate, alongside exercise and advice. Video sessions cannot include hands-on treatment. We do not offer acupuncture or needles."
  },
  {
    question: "Do you have a clinic I can come to instead?",
    answer:
      "No. We have no clinic or premises, so all in-person care happens at your home. If you are outside the home-visit area, video appointments are available anywhere in the UK."
  },
  {
    question: "Can you visit a child at home?",
    answer:
      "For a patient under 18, a parent, guardian or another responsible adult must be present for the whole visit."
  }
];

export default function HomeVisitsGlasgowPage() {
  return (
    <div className="site-shell">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
        "@context": "https://schema.org",
        "@type": "WebPage",
        name: "Physiotherapy home visits in Glasgow",
        about: practiceRef()
      }) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(
        breadcrumbs([
          { name: "Home", path: "/" },
          { name: "Physiotherapy in Glasgow", path: "/glasgow-physiotherapist" },
          { name: "Home visits", path: "/physiotherapy-home-visits-glasgow" }
        ])
      ) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: faqItems.map((faq) => ({
          "@type": "Question",
          name: faq.question,
          acceptedAnswer: { "@type": "Answer", text: faq.answer }
        }))
      }) }} />

      <section className="page-hero page-hero-split">
        <div className="stack">
          <span className="eyebrow">Home visits</span>
          <h1>Physiotherapy home visits in Glasgow, Paisley and Hamilton</h1>
          <p className="lead">
            A Glasgow-based, HCPC registered physiotherapist comes to you. The initial home assessment is{" "}
            {homeInitial}: the {videoInitial} assessment price plus a {travelFee} travel fee. Home visits
            cover {HOME_VISIT_AREA_LABEL}.
          </p>
          {PRACTICE_PHONE && PRACTICE_PHONE_HREF ? (
            <p>
              Not sure if a home visit is right for you? Call or text <a href={PRACTICE_PHONE_HREF}>{PRACTICE_PHONE}</a>.
            </p>
          ) : null}
          <div className="button-row">
            <TrackedBookLink
              className="button primary"
              href="/book?visit=home"
              source="home_visits_page"
              event="book_now_click"
            >
              Book a home visit
            </TrackedBookLink>
            <Link className="button secondary" href="/pricing" prefetch>
              See all prices
            </Link>
          </div>
        </div>
        <div className="page-hero-aside checklist-panel">
          <h2>Who home visits suit</h2>
          <ul className="clean-list">
            <li>Anyone who would rather not travel or find parking while in pain</li>
            <li>
              Recovery after <Link href="/online-physiotherapy-for/knee-replacement-rehab">knee</Link> or{" "}
              <Link href="/online-physiotherapy-for/hip-replacement-rehab">hip replacement</Link>, once your surgical team says you are ready
            </li>
            <li>
              <Link href="/services/neurological-rehabilitation">Neurological rehabilitation</Link> such as stroke or
              Parkinson&rsquo;s, with a family member or carer welcome to join
            </li>
            <li>Balance, mobility and falls-risk concerns, practised in your own home</li>
            <li>Problems where hands-on treatment may help alongside exercise</li>
          </ul>
        </div>
      </section>

      <section className="page-section two-col">
        <Reveal direction="up">
          <div className="panel stack soft-panel">
            <h2>What happens at a home visit</h2>
            <ul className="clean-list">
              <li>An assessment at your home, covering your history, goals and how you move</li>
              <li>Hands-on treatment (manual therapy) where appropriate</li>
              <li>A tailored exercise plan with clear milestones, set up for the space you actually have</li>
              <li>A written summary after your session</li>
              <li>Follow-ups by home visit or video with the same physiotherapist</li>
            </ul>
          </div>
        </Reveal>
        <Reveal direction="up" delay={80}>
          <div className="panel stack image-panel">
            <h2>How to prepare</h2>
            <ul className="clean-list">
              <li>A safe, clear space for the session and safe, reasonable access to it</li>
              <li>Comfortable clothing that lets you move the area being treated</li>
              <li>Any letters or instructions from your GP, consultant or surgical team</li>
              <li>For a patient under 18, a parent, guardian or another responsible adult present for the whole visit</li>
            </ul>
          </div>
        </Reveal>
      </section>

      <Reveal direction="up">
        <section className="page-section stack">
          <h2>Postcodes and areas we visit</h2>
          <p>
            Every Glasgow postcode from G1 to G53, plus Paisley (PA1 to PA3) and Hamilton (ML3). That
            includes the city centre and Merchant City, the West End (Partick, Hyndland, Hillhead), the
            Southside (Shawlands, Pollokshields, Govanhill), the East End (Dennistoun, Parkhead, Shettleston),
            the North (Springburn, Maryhill), and areas such as Bearsden, Milngavie, Bishopbriggs, Rutherglen,
            Cambuslang, Newton Mearns, Giffnock and Clarkston. Enter your postcode when you book to confirm.
          </p>
          <p>
            Outside these areas? <Link href="/online-physiotherapy-scotland">Online physiotherapy in Scotland</Link>{" "}
            and video appointments across the UK are available, or read about{" "}
            <Link href="/glasgow-physiotherapist">physiotherapy in Glasgow</Link> by home visit or video.
          </p>
        </section>
      </Reveal>

      <Reveal direction="up">
        <section className="page-section stack service-faqs">
          <h2>Home visit questions</h2>
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
            <h2>Book a physiotherapy home visit</h2>
            <p>Choose &ldquo;Home visit in Glasgow&rdquo;, enter your postcode and pick a time.</p>
            <div className="button-row" style={{ justifyContent: "center" }}>
              <Link className="button secondary cta-white" href="/book?visit=home">
                Book a home visit
              </Link>
              <Link className="button inverted" href="/contact">
                Ask a question first
              </Link>
            </div>
          </div>
        </section>
      </Reveal>
    </div>
  );
}
