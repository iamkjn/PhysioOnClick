import type { Metadata } from "next";
import Link from "next/link";
import { Reveal } from "@/components/reveal";
import { ContactOptions } from "@/components/contact-options";
import { HomeVisitTownLinks } from "@/components/home-visit-town-links";
import { ServiceReviews } from "@/components/service-reviews";
import { TrackedBookLink } from "@/components/tracked-book-link";
import { curatedReviewsForServicesOverview } from "@/lib/trustpilot-curated";
import { APPOINTMENT_HOURS, APPOINTMENT_HOURS_SENTENCE, HOME_VISIT_NOTICE_SENTENCE } from "@/lib/appointment-hours";
import { HOME_VISIT_AREA_LABEL } from "@/lib/home-visit-area";
import { formatPounds, homeVisitPrices, sessionPricePence } from "@/lib/home-visit-pricing";
import { breadcrumbs, practiceRef } from "@/lib/structured-data";
import { VISIT_REQUEST_PATH } from "@/lib/visit-request";

// The home-visit page: what happens at a visit, who it suits and where we go.
// /glasgow-physiotherapist stays the general "physio in Glasgow" page (home
// visit or video); this one owns the home-visit intent. Every price is derived
// from lib/home-visit-pricing, never hardcoded.
const videoInitial = formatPounds(sessionPricePence("initial-assessment"));
const homeInitial = homeVisitPrices.initial;
const homeFollowUp = homeVisitPrices.followUp;
// NHSGGC's MSK self-referral form can't take anyone who needs a home visit
// (listed on this page, checked 2026-11-20). Only that fact is stated here.
const NHSGGC_SELF_REFERRAL_URL =
  "https://www.nhsggc.scot/hospitals-services/services-a-to-z/musculoskeletal-msk-physiotherapy/self-referral-to-adult-msk-physiotherapy/";

export const metadata: Metadata = {
  alternates: { canonical: "/physiotherapy-home-visits-glasgow" },
  title: "Home Physiotherapy Glasgow & Surrounding Areas | PhysioOnClick",
  description: `Home physiotherapy in Glasgow and up to an hour's drive away, 7 days 9am–9pm, from an HCPC registered physio. ${homeInitial} assessment, ${homeFollowUp} follow-ups, all in.`
};

const faqItems = [
  {
    question: "Which areas do your home visits cover?",
    answer: `Home visits cover ${HOME_VISIT_AREA_LABEL}. When you book, choose "Home visit in Glasgow" and enter your postcode: you'll see straight away whether we cover it. A home visit cannot be booked for a postcode outside the area, so we'll suggest a video appointment instead.`
  },
  {
    question: "When do home visits happen?",
    answer: `${APPOINTMENT_HOURS_SENTENCE} You don't need to take time off work, and someone who helps you at home can be there too. ${HOME_VISIT_NOTICE_SENTENCE} The booking page shows every free time.`
  },
  {
    question: "Can a family member or carer be there?",
    answer:
      "Yes. They're welcome to join and learn how to help with your exercises between visits, which often makes a real difference for neurological rehab after a stroke or with Parkinson's, MS or FND. Your written plan comes by email after the session, so it's easy to share with them."
  },
  {
    question: "How much does a physiotherapy home visit cost?",
    answer: `A home visit is one all-in price: ${homeInitial} for the initial assessment and ${homeFollowUp} for a follow-up, with nothing added at checkout (${videoInitial} for an assessment by video). Bundles booked as home visits cover every visit, paid when you book.`
  },
  {
    question: "Do I need a GP referral for a home visit?",
    answer:
      "No, you can book directly, even though NHS Greater Glasgow and Clyde's online physio self-referral can't be used for a home visit. For neurological rehabilitation, your GP or specialist team must confirm it is safe for you to begin physiotherapy before you start. After an operation, rehab with us starts once your surgical team has said you are ready for outpatient or community physiotherapy, and we follow any restrictions or precautions they give you."
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
          <h1>Physiotherapy home visits in Glasgow and the surrounding area</h1>
          <p className="lead">
            A Glasgow-based, HCPC registered physiotherapist comes to you. The initial home assessment is{" "}
            {homeInitial} all in, and follow-ups are {homeFollowUp}. Home visits cover {HOME_VISIT_AREA_LABEL}.
          </p>
          <p>
            Visits run {APPOINTMENT_HOURS.phrase}, evenings and weekends included, so you don&rsquo;t need
            to take time off work.
          </p>
          <ContactOptions
            topic="home-visit"
            source="home_visits_page"
            lead="Not sure if a home visit is right for you? Ask us first, with no obligation to book."
          />
          <div className="button-row">
            <TrackedBookLink
              className="button primary"
              href={VISIT_REQUEST_PATH}
              source="home_visits_page"
              event="book_now_click"
            >
              Request a home visit
            </TrackedBookLink>
            <TrackedBookLink
              className="button secondary"
              href="/book?pay=online&visit=home"
              source="home_visits_page_online"
              event="book_now_click"
            >
              Book and pay online
            </TrackedBookLink>
          </div>
        </div>
        <div className="page-hero-aside checklist-panel">
          <h2>Who home visits suit</h2>
          <ul className="clean-list">
            <li>People who work during the day: visits run until 9pm, and at weekends too</li>
            <li>Anyone who would rather not travel or find parking while in pain</li>
            <li>
              People who need physio at home:{" "}
              <a href={NHSGGC_SELF_REFERRAL_URL}>NHS Greater Glasgow and Clyde&rsquo;s physio self-referral</a> can&rsquo;t
              be used if you need a home visit, but you can book one with us directly
            </li>
            <li>
              Recovery after <Link href="/online-physiotherapy-for/knee-replacement-rehab">knee</Link> or{" "}
              <Link href="/online-physiotherapy-for/hip-replacement-rehab">hip replacement</Link>, once your surgical team says you are ready
            </li>
            <li>
              <Link href="/services/neurological-rehabilitation">Neurological physiotherapy at home</Link> for stroke or
              Parkinson&rsquo;s, with a family member or carer welcome to join and learn how to help
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
              <li>A 3D model of the body on screen, to show you the area involved and the muscles each of your exercises works</li>
              <li>
                Hands-on treatment (manual therapy) where appropriate:{" "}
                <Link href="/manual-therapy-glasgow">joint mobilisation, soft tissue work and stretching</Link>
              </li>
              <li>A tailored exercise plan with clear milestones, set up for the space you actually have</li>
              <li>A written summary after your session</li>
              <li>Family members or carers welcome to join and learn how to help with your exercises between visits</li>
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
            All of Glasgow and everywhere within about an hour&rsquo;s drive. That includes the city centre,
            the West End, the Southside, the East End and the North of Glasgow; Bearsden, Milngavie,
            Bishopbriggs, Kirkintilloch, Cumbernauld, Clydebank, Dumbarton and Helensburgh; Rutherglen,
            Cambuslang, East Kilbride, Newton Mearns, Giffnock and Barrhead; Paisley, Renfrew, Johnstone,
            Erskine, Greenock and Gourock; Hamilton, Motherwell, Wishaw, Coatbridge, Airdrie and Lanark;
            Kilmarnock, Ayr, Prestwick, Troon, Irvine and Largs; Falkirk, Stirling and Alloa; Livingston,
            Bathgate and Linlithgow; and Dunfermline. Enter your postcode when you book to confirm.
          </p>
          <HomeVisitTownLinks />
          <p>
            Outside these areas? <Link href="/online-physiotherapy-scotland">Online physiotherapy in Scotland</Link>{" "}
            and video appointments across the UK are available, or read about{" "}
            <Link href="/glasgow-physiotherapist">physiotherapy in Glasgow</Link> by home visit or video.
          </p>
        </section>
      </Reveal>

      <ServiceReviews reviews={curatedReviewsForServicesOverview()} />

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
            <p>Leave your name and number and we&rsquo;ll call you to arrange a time, or choose a time and pay online.</p>
            <div className="button-row" style={{ justifyContent: "center" }}>
              <Link className="button secondary cta-white" href={VISIT_REQUEST_PATH}>
                Request a home visit
              </Link>
              <Link className="button inverted" href="/book?pay=online&visit=home">
                Book and pay online
              </Link>
            </div>
          </div>
        </section>
      </Reveal>
    </div>
  );
}
