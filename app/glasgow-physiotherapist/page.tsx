import type { Metadata } from "next";
import Link from "next/link";
import { Reveal } from "@/components/reveal";
import { TrackedBookLink } from "@/components/tracked-book-link";
import { HOME_VISIT_AREA_LABEL } from "@/lib/home-visit-area";
import { formatPounds, HOME_VISIT_TRAVEL_FEE_PENCE, sessionPricePence, travelFeePence } from "@/lib/home-visit-pricing";
import { PRACTICE_PHONE, PRACTICE_PHONE_HREF, practiceRef } from "@/lib/structured-data";

// Home visits cost the video price plus a travel fee per visit, so every
// figure here is derived from lib/home-visit-pricing rather than hardcoded.
const videoInitial = formatPounds(sessionPricePence("initial-assessment"));
const homeInitial = formatPounds(sessionPricePence("initial-assessment") + travelFeePence("initial-assessment", "home"));
const travelFee = formatPounds(HOME_VISIT_TRAVEL_FEE_PENCE);

export const metadata: Metadata = {
  alternates: { canonical: "/glasgow-physiotherapist" },
  title: "Physiotherapist Glasgow: Home Visits & Online | PhysioOnClick",
  description: `Physiotherapist in Glasgow offering home visits in the Glasgow area, plus video appointments UK-wide. No GP referral. ${videoInitial} video assessment, ${homeInitial} home visit.`
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
      `Yes, through home visits in the Glasgow area. We do not have a clinic or premises, so all in-person care happens at your home. Choose "Home visit in Glasgow" when you book and enter your postcode, and you'll see straight away whether we cover it. Home visits cover ${HOME_VISIT_AREA_LABEL}.`
  },
  {
    question: "How much does a home visit cost?",
    answer: `A home visit costs the video appointment price plus a ${travelFee} travel fee per visit. The initial assessment is ${videoInitial} by video or ${homeInitial} as a home visit. Bundles booked as home visits include the travel fee for every visit, paid when you book. See the pricing page for the full list.`
  },
  {
    question: "Can I book a video appointment if I live outside Glasgow?",
    answer: `Yes. Video appointments for assessments and follow-ups are available anywhere in the UK. Home visits are only in the covered area: ${HOME_VISIT_AREA_LABEL}.`
  },
  {
    question: "What conditions do you treat?",
    answer:
      "Common areas include back pain, knee injuries, shoulder rehab, post-surgical recovery, neurological rehabilitation and mobility concerns, by video or as a home visit. After an operation, rehab with us starts once your surgical team has said you are ready for outpatient or community physiotherapy, and we follow any restrictions or precautions they give you."
  },
  {
    question: "Do you offer hands-on treatment?",
    answer:
      "Yes, at home visits. A home visit can include hands-on treatment (manual therapy) where appropriate, alongside exercise and advice. Video sessions cannot include hands-on treatment. We do not offer acupuncture or needles."
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
      <section className="page-hero page-hero-split">
        <div className="stack">
          <span className="eyebrow">Physiotherapy in Glasgow</span>
          <h1>Physiotherapist in Glasgow: home visits and online appointments</h1>
          <p className="lead">
            PhysioOnClick is run by a Glasgow-based, HCPC registered physiotherapist. If you are in the
            Glasgow area you can book a home visit, and video appointments are available anywhere in the UK.
            The initial assessment is {videoInitial} by video, or {homeInitial} as a home visit (the video
            price plus a {travelFee} travel fee).
          </p>
          {PRACTICE_PHONE && PRACTICE_PHONE_HREF ? (
            <p>
              Prefer to talk first? Call or text <a href={PRACTICE_PHONE_HREF}>{PRACTICE_PHONE}</a>.
            </p>
          ) : null}
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
            <li>The same booking flow for both; home visits add a {travelFee} travel fee per visit</li>
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
              <li>Hands-on treatment (manual therapy) where appropriate</li>
              <li>A tailored exercise plan with clear milestones</li>
              <li>A written summary after your session</li>
              <li>The same HCPC registered physiotherapist, with follow-ups by home visit or video</li>
            </ul>
            <p>
              Home visits cover {HOME_VISIT_AREA_LABEL}. We have no clinic or premises. When you book,
              choose &ldquo;Home visit in Glasgow&rdquo; and enter your postcode: you&rsquo;ll see straight away
              whether we cover it, then add your address. More on{" "}
              <Link href="/physiotherapy-home-visits-glasgow">physiotherapy home visits</Link>, including how to prepare.
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
              <li>Video sessions cannot include hands-on treatment; choose a home visit if you need it</li>
            </ul>
          </div>
        </Reveal>
      </section>

      <Reveal direction="up">
        <section className="page-section stack">
          <h2>Home visit and video prices</h2>
          <p>
            The initial assessment is {videoInitial} by video or {homeInitial} as a home visit. A home visit
            costs the video price plus a {travelFee} travel fee per visit, shown as its own line at checkout.
            Bundles booked as home visits include the travel fee for every visit, paid when you book. See{" "}
            <Link href="/pricing">pricing</Link> for the full list. If you are not sure which suits you, the{" "}
            <Link href="/how-online-physiotherapy-works">how it works</Link> page explains the booking steps.
          </p>
        </section>
      </Reveal>

      <Reveal direction="up">
        <section className="page-section stack">
          <h2>Areas we cover for home visits</h2>
          <p>
            Home visits cover every Glasgow postcode from G1 to G53, plus Paisley (PA1 to PA3) and
            Hamilton (ML3). That includes the city centre and Merchant City, the West End (Partick,
            Hyndland, Hillhead), the Southside (Shawlands, Pollokshields, Govanhill), the East End
            (Dennistoun, Parkhead, Shettleston), the North (Springburn, Maryhill), and areas such as
            Bearsden, Milngavie, Bishopbriggs, Rutherglen, Cambuslang, Newton Mearns, Giffnock and
            Clarkston. Enter your postcode when you book to confirm.
          </p>
          <h2>Common problems we treat in Glasgow</h2>
          <ul className="clean-list">
            <li><Link href="/online-physiotherapy-for/low-back-pain">Low back pain</Link> and <Link href="/online-physiotherapy-for/sciatica">sciatica</Link></li>
            <li><Link href="/online-physiotherapy-for/neck-pain">Neck pain</Link> and <Link href="/online-physiotherapy-for/shoulder-pain">shoulder pain</Link></li>
            <li><Link href="/online-physiotherapy-for/knee-pain">Knee pain</Link> and <Link href="/online-physiotherapy-for/hip-pain">hip pain</Link></li>
            <li>Rehab after <Link href="/online-physiotherapy-for/knee-replacement-rehab">knee replacement</Link> or <Link href="/online-physiotherapy-for/hip-replacement-rehab">hip replacement</Link></li>
            <li><Link href="/online-physiotherapy-for/stroke-rehabilitation">Stroke rehabilitation</Link> and <Link href="/online-physiotherapy-for/parkinsons">Parkinson&rsquo;s</Link></li>
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
