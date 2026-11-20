import type { Metadata } from "next";
import Link from "next/link";
import { Reveal } from "@/components/reveal";
import { ContactOptions } from "@/components/contact-options";
import { TrackedBookLink } from "@/components/tracked-book-link";
import { APPOINTMENT_HOURS, HOME_VISIT_NOTICE_SENTENCE } from "@/lib/appointment-hours";
import { serviceLabelFor } from "@/lib/cal-services";
import { HOME_VISIT_AREA_LABEL } from "@/lib/home-visit-area";
import { formatPounds, homeVisitPrices, sessionPricePence } from "@/lib/home-visit-pricing";
import { pricing } from "@/lib/site-data";
import { absoluteUrl } from "@/lib/utils";
import { breadcrumbs, practiceRef } from "@/lib/structured-data";

// Owns the "manual therapy Glasgow" search intent. Hands-on treatment only
// happens at home visits (never by video). The three techniques named here
// were confirmed by Shivaliba on 2026-11-15 (owner relayed); never add another
// (no spinal manipulation, no acupuncture or needles). Every price is derived
// from lib/home-visit-pricing, never hardcoded.
const PATH = "/manual-therapy-glasgow";
const homeInitial = homeVisitPrices.initial;
const homeFollowUp = homeVisitPrices.followUp;

const TECHNIQUES = [
  {
    name: "Joint mobilisation",
    detail:
      "Gentle, graded movement of a stiff joint, such as a knee, hip, shoulder or the back, to ease pain and help it move more freely."
  },
  {
    name: "Soft tissue work",
    detail: "Hands-on work on tight, sore or overworked muscles to ease tension and discomfort."
  },
  {
    name: "Stretching and muscle energy techniques",
    detail:
      "Assisted stretches, and techniques where you gently push against her hand and then relax, to improve how far a joint or muscle can move."
  }
] as const;

export const metadata: Metadata = {
  alternates: { canonical: PATH },
  title: "Manual Therapy at Home in Glasgow | PhysioOnClick",
  description: `Hands-on manual therapy at home in Glasgow: joint mobilisation, soft tissue work and stretching, with exercise. HCPC physio. ${homeInitial} assessment, ${homeFollowUp} follow-ups.`,
  keywords: [
    "manual therapy Glasgow",
    "manual therapy at home",
    "hands-on physiotherapy Glasgow",
    "joint mobilisation Glasgow",
    "home physiotherapy Glasgow"
  ]
};

const faqItems = [
  {
    question: "What is manual therapy?",
    answer:
      "Manual therapy is hands-on treatment by a physiotherapist: moving a stiff joint, working on tight or sore muscles, or assisted stretching. It is used to ease pain and stiffness so that you can move and exercise more comfortably."
  },
  {
    question: "Which manual therapy techniques do you use?",
    answer:
      "Joint mobilisation, soft tissue work, and assisted stretching including muscle energy techniques. Which of them, if any, are right for you depends on your assessment. We do not offer acupuncture or needles."
  },
  {
    question: "Is manual therapy included in the price of a home visit?",
    answer: `Yes. A home visit is one all-in price: ${homeInitial} for the initial assessment and ${homeFollowUp} for a follow-up. Hands-on treatment, when it is appropriate, is part of the visit, with nothing added at checkout.`
  },
  {
    question: "Can I have manual therapy by video?",
    answer: `No. Video sessions cannot include hands-on treatment, so manual therapy is only available at a home visit. Home visits cover ${HOME_VISIT_AREA_LABEL}; enter your postcode when you book to check.`
  },
  {
    question: "Does manual therapy hurt?",
    answer:
      "It should feel no more than mildly uncomfortable. Your physiotherapist explains each technique first, checks how it feels as she goes, and stops or changes it if you ask. Some people feel a little sore for a day or so afterwards."
  },
  {
    question: "Do I need a GP referral?",
    answer:
      "No, you can book directly. For neurological rehabilitation, your GP or specialist team must confirm it is safe for you to begin physiotherapy before you start. After an operation, rehab with us starts once your surgical team has said you are ready for outpatient or community physiotherapy, and we follow any restrictions or precautions they give you."
  }
];

const homeOffers = pricing.map((item) => ({
  "@type": "Offer",
  name: serviceLabelFor(item.id, "home"),
  price: sessionPricePence(item.id, "home") / 100,
  priceCurrency: "GBP",
  url: absoluteUrl("/book?visit=home")
}));

export default function ManualTherapyGlasgowPage() {
  return (
    <div className="site-shell">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
        "@context": "https://schema.org",
        "@type": "MedicalWebPage",
        name: "Manual therapy at home in Glasgow",
        url: absoluteUrl(PATH),
        about: {
          "@type": "MedicalTherapy",
          name: "Manual therapy",
          alternateName: "Hands-on physiotherapy"
        },
        mentions: practiceRef()
      }) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
        "@context": "https://schema.org",
        "@type": "Service",
        name: "Manual therapy at home in Glasgow",
        serviceType: "Manual therapy",
        description:
          "Hands-on treatment (manual therapy) at a physiotherapy home visit where appropriate: joint mobilisation, soft tissue work and assisted stretching, alongside an exercise plan.",
        provider: practiceRef(),
        areaServed: { "@type": "City", name: "Glasgow" },
        url: absoluteUrl(PATH),
        offers: homeOffers
      }) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(
        breadcrumbs([
          { name: "Home", path: "/" },
          { name: "Home visits", path: "/physiotherapy-home-visits-glasgow" },
          { name: "Manual therapy", path: PATH }
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
          <span className="eyebrow">Manual therapy</span>
          <h1>Manual therapy at home in Glasgow</h1>
          <p className="lead">
            Hands-on treatment from an HCPC registered physiotherapist, in your own home. Manual therapy is part
            of a home visit where it&rsquo;s appropriate, alongside exercise and advice. The initial home
            assessment is {homeInitial} all in, and follow-ups are {homeFollowUp}, with no extra charge for
            hands-on treatment.
          </p>
          <p>
            Home visits cover {HOME_VISIT_AREA_LABEL}, and run {APPOINTMENT_HOURS.weekdays.phrase}, and{" "}
            {APPOINTMENT_HOURS.weekends.phrase}. {HOME_VISIT_NOTICE_SENTENCE}
          </p>
          <ContactOptions
            topic="manual-therapy"
            source="manual_therapy_page"
            lead="Not sure if hands-on treatment would help? Ask us first, with no obligation to book."
          />
          <div className="button-row">
            <TrackedBookLink
              className="button primary"
              href="/book?visit=home"
              source="manual_therapy_page"
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
          <h2>What manual therapy can include</h2>
          <ul className="clean-list">
            {TECHNIQUES.map((technique) => (
              <li key={technique.name}>
                <strong>{technique.name}:</strong> {technique.detail}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="page-section two-col">
        <Reveal direction="up">
          <div className="panel stack soft-panel">
            <h2>Always alongside exercise</h2>
            <p>
              Hands-on treatment can ease pain and stiffness and make it easier to move, but on its own the
              effect usually fades. NICE guidance on low back pain, for example, recommends manual therapy only as
              part of a treatment package that includes exercise.
            </p>
            <p>
              So every visit also includes a tailored exercise plan, set up for the space you actually have, and a
              written summary afterwards. Family members or carers are welcome to join and learn how to help
              between visits.
            </p>
          </div>
        </Reveal>
        <Reveal direction="up" delay={80}>
          <div className="panel stack image-panel">
            <h2>Problems it&rsquo;s often used for</h2>
            <ul className="clean-list">
              <li>Back and neck pain and stiffness</li>
              <li>Stiff or painful joints, such as a shoulder, hip or knee</li>
              <li>
                Recovery after a <Link href="/online-physiotherapy-for/knee-replacement-rehab">knee</Link> or{" "}
                <Link href="/online-physiotherapy-for/hip-replacement-rehab">hip replacement</Link>, once your surgical
                team says you are ready
              </li>
              <li>
                Tight muscles and stiffness alongside{" "}
                <Link href="/services/neurological-rehabilitation">neurological rehabilitation</Link>, for example
                after a stroke or with Parkinson&rsquo;s or MS
              </li>
              <li>Muscle tension from work, posture or a sports injury</li>
            </ul>
          </div>
        </Reveal>
      </section>

      <Reveal direction="up">
        <section className="page-section stack">
          <h2>When hands-on treatment isn&rsquo;t the right choice</h2>
          <p>
            At your assessment, your physiotherapist checks whether hands-on treatment is safe and suitable for
            you. Each technique is explained first, and you can say no to any part of it. If there are red-flag
            symptoms (unexplained weight loss, night pain that doesn&rsquo;t ease, saddle numbness, progressive
            weakness) or a suspected fracture, you&rsquo;ll be told plainly and pointed toward your GP or urgent
            care.
          </p>
          <p>
            Video sessions cannot include hands-on treatment. We do not offer acupuncture or needles. Outside the
            home-visit area, <Link href="/online-physiotherapy-scotland">video physiotherapy</Link> is available
            anywhere in the UK, and you can read more about{" "}
            <Link href="/physiotherapy-home-visits-glasgow">physiotherapy home visits</Link>.
          </p>
        </section>
      </Reveal>

      <Reveal direction="up">
        <section className="page-section stack service-faqs">
          <h2>Manual therapy questions</h2>
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
            <h2>Book a home visit with hands-on treatment</h2>
            <p>
              {formatPounds(sessionPricePence("initial-assessment", "home"))} for the assessment, all in. Choose
              &ldquo;Home visit in Glasgow&rdquo;, enter your postcode and pick a time.
            </p>
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
