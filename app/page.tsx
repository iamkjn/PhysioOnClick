import type { Metadata } from "next";
import Image from "next/image";
import { ProtectedImageFrame } from "@/components/image-protection";
import Link from "next/link";
import { cookies } from "next/headers";

import { APPOINTMENT_HOURS, APPOINTMENT_HOURS_SENTENCE, HOME_VISIT_NOTICE_SENTENCE } from "@/lib/appointment-hours";
import { founder } from "@/lib/site-data";
import { formatPounds, homeVisitPrices, sessionPricePence } from "@/lib/home-visit-pricing";
import { getPublicServices } from "@/lib/public-content";
import { HomeHeroSection } from "@/components/home-hero-section";
import { Reveal } from "@/components/reveal";
import { TrustpilotReviews } from "@/components/trustpilot-reviews";

// Leads with Glasgow home visits (incl. neuro rehab) and keeps video across
// the UK as the second option: Search Console, Aug-Nov 2026, showed ~480
// impressions for physio + Glasgow/near me/home (~360 of them neuro, stroke,
// Parkinson's, MS or FND + Glasgow) against 14 for physio + online/video.
// Wording also borrows the "physiotherapy at home" phrasing the Glasgow
// home-physio competition ranks with (2026-11-07 comparison). Prices come from
// lib/home-visit-pricing, never hardcoded.
const videoPrice = formatPounds(sessionPricePence("initial-assessment"));
const homeVisitPrice = homeVisitPrices.initial;
const title = "Physio at Home in Glasgow & Neuro Rehab | PhysioOnClick";
// Evenings and weekends lead because they are the remarkable part: most
// people in pain, and the family who help them, work during the day.
const description = `Home physiotherapy in Glasgow on weekday evenings and weekends, including neuro rehab for stroke, Parkinson's, MS and FND. ${homeVisitPrice} home assessment, or ${videoPrice} by video.`;

export const metadata: Metadata = {
  alternates: { canonical: "/" },
  title,
  description,
  keywords: [
    "home physiotherapy Glasgow",
    "physiotherapy at home Glasgow",
    "physio home visits Glasgow",
    "neurological physiotherapy at home",
    "stroke rehabilitation at home Glasgow",
    "online physiotherapy UK",
    "private physiotherapy insurance invoice",
  ],
  // A page-level openGraph/twitter replaces the root layout's whole object, so
  // the share image is restated here alongside the homepage's own wording.
  openGraph: {
    type: "website",
    siteName: "PhysioOnClick",
    locale: "en_GB",
    url: "/",
    title,
    description,
    // alt describes the image as it is (its text still reads "online").
    images: [{ url: "/og-default.png", width: 1200, height: 630, alt: "PhysioOnClick — online physiotherapy across the UK" }],
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
    images: ["/og-default.png"],
  },
};

export default async function HomePage() {
  // Set by the header's auth observer on sign-in/out. Lets the hero render a
  // dashboard loader (not the logged-out hero) for returning patients, so the
  // signed-in home doesn't flash the marketing hero first. Signed-out visitors
  // have no cookie and get the marketing hero immediately.
  const initialSignedIn = (await cookies()).get("poc-auth")?.value === "1";
  const homeServices = getPublicServices().slice(0, 4);

  return (
    <>
      <HomeHeroSection
        founderName={founder.name}
        homeVisitPrice={homeVisitPrice}
        videoPrice={videoPrice}
        initialSignedIn={initialSignedIn}
      />

      <Reveal direction="fade">
        <section className="trust-bar-section">
          <div className="site-shell trust-bar">
            <span>HCPC Registered</span>
            <span>CSP Member</span>
            <span>Home visits in Glasgow</span>
            <span>Evenings &amp; weekends</span>
            <span>Video appointments across the UK</span>
          </div>
        </section>
      </Reveal>

      {/* The two things worth telling a friend about: visits outside working
          hours, and teaching the family who help at home. They reinforce each
          other: an evening or weekend visit is when that family can be there. */}
      <section className="page-section simple-section home-week-section" aria-labelledby="home-week-heading">
        <Reveal direction="up">
          <div className="site-shell section-heading">
            <span className="eyebrow">Built around your week</span>
            <h2 id="home-week-heading">Physio that fits around work and family</h2>
          </div>
        </Reveal>
        <div className="site-shell simple-card-grid">
          <Reveal direction="up">
            <article className="simple-service-card home-week-card">
              <h3>Evenings and weekends</h3>
              <p>
                Home visits and video appointments run {APPOINTMENT_HOURS.weekdays.phrase}, and{" "}
                {APPOINTMENT_HOURS.weekends.phrase}. No time off work, and no travelling across town while
                you&rsquo;re sore.
              </p>
              <Link href="/book?visit=home" prefetch>See free times →</Link>
            </article>
          </Reveal>
          <Reveal direction="up" delay={75}>
            <article className="simple-service-card home-week-card">
              <h3>We teach the family too</h3>
              <p>
                Living with a stroke, Parkinson&rsquo;s, MS or FND? Because we visit in the evening and at the
                weekend, the person who helps you at home can be there, even if they work during the day. We
                show them how to help with your exercises between visits, and your written plan comes by
                email afterwards, ready to share.
              </p>
              <Link href="/services/neurological-rehabilitation" prefetch>Neuro rehab at home →</Link>
            </article>
          </Reveal>
        </div>
      </section>

      <section className="page-section simple-section">
        <Reveal direction="up">
          <div className="site-shell section-heading">
            <span className="eyebrow">Meet your physiotherapist</span>
            <h2>Care led by {founder.name}</h2>
            <p>Every session is delivered (or personally overseen) by the same HCPC registered physiotherapist, not passed between clinicians.</p>
          </div>
        </Reveal>
        <div className="site-shell home-proof-grid">
          <Reveal direction="up">
            <article className="card home-founder-card">
              <Image
                className="home-founder-avatar"
                src="/images/shivaliba-zala-thumbnail.webp"
                alt={`${founder.name}, HCPC registered physiotherapist`}
                width={512}
                height={512}
              />
              <h3>{founder.name}</h3>
              <p className="muted">{founder.location}</p>
              <ul className="home-founder-credentials">
                {founder.credentials.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
              <Link className="button secondary" href="/about" prefetch>
                More about {founder.name.split(" ")[0]}
              </Link>
            </article>
          </Reveal>
          <TrustpilotReviews />
        </div>
      </section>

      <section className="page-section simple-section">
        <Reveal direction="up">
          <div className="site-shell section-heading">
            <h2>What we can help with</h2>
            <p>Physiotherapy at home in the Glasgow area, or by video anywhere in the UK, from one HCPC registered physiotherapist.</p>
          </div>
        </Reveal>
        <div className="site-shell simple-card-grid">
          {homeServices.map((service, i) => (
            <Reveal key={service.slug} direction="up" delay={i * 75}>
              <article className="simple-service-card">
                <ProtectedImageFrame>
                  <Image
                    className="simple-service-image"
                    src={service.image}
                    alt={service.title}
                    width={720}
                    height={420}
                    unoptimized
                    draggable={false}
                  />
                </ProtectedImageFrame>
                <h3>{service.title}</h3>
                <p>{service.summary}</p>
                <Link href={`/services#${service.slug}`} prefetch aria-label={`Learn more about ${service.title}`}>Learn more →</Link>
              </article>
            </Reveal>
          ))}
        </div>
        <Reveal direction="up" delay={100}>
          <div className="site-shell section-button-center">
            <Link className="button secondary" href="/services" prefetch>
              View All Services
            </Link>
          </div>
        </Reveal>
      </section>

      <section className="page-section simple-section">
        <Reveal direction="up">
          <div className="site-shell section-heading">
            <span className="eyebrow">Video anywhere in the UK, home visits in Glasgow</span>
            <h2>How online physiotherapy works</h2>
            <p>
              A full assessment, a real diagnosis and a plan you can act on the same day &mdash; over
              video anywhere in the UK, or as a home visit in the Glasgow area, with the same physiotherapist
              reviewing your progress every session.
            </p>
          </div>
        </Reveal>
        <div className="site-shell simple-card-grid">
          <Reveal direction="up" delay={0}>
            <article className="simple-service-card">
              <h3>1. Book online</h3>
              <p>Choose a time that suits you and complete a short pre-session assessment so the first call starts with useful context, not a blank slate.</p>
            </article>
          </Reveal>
          <Reveal direction="up" delay={75}>
            <article className="simple-service-card">
              <h3>2. Video assessment</h3>
              <p>A 60-minute guided assessment: history, a movement or functional screen (talked through over video, or done at your home for a Glasgow-area home visit), and red-flag screening to confirm this kind of care is the right fit.</p>
            </article>
          </Reveal>
          <Reveal direction="up" delay={150}>
            <article className="simple-service-card">
              <h3>3. Personalised plan</h3>
              <p>You leave with a working diagnosis, a written explanation of what&rsquo;s going on, and exercises to start immediately &mdash; not a wait-and-see appointment.</p>
            </article>
          </Reveal>
          <Reveal direction="up" delay={225}>
            <article className="simple-service-card">
              <h3>4. Ongoing review</h3>
              <p>Follow-up sessions track progress and adjust loading and exercises &mdash; the same clinician throughout, so nothing gets lost between appointments.</p>
            </article>
          </Reveal>
        </div>
        <Reveal direction="up" delay={100}>
          <div className="site-shell section-button-center">
            <Link className="button secondary" href="/how-online-physiotherapy-works" prefetch>
              See the full process
            </Link>
          </div>
        </Reveal>
      </section>

      <section className="page-section insurance-section">
        <Reveal direction="up">
          <div className="site-shell insurance-layout">
            <div className="insurance-copy">
              <span className="eyebrow">Private health insurance</span>
              <h2>Claiming your PhysioOnClick invoice</h2>
              <p>
                If your UK health insurance policy includes physiotherapy, you can usually submit
                your paid session invoice to your insurer for reimbursement. Every paid booking
                creates an insurance-ready PDF invoice and receipt automatically.
              </p>
            </div>
            <div className="insurance-steps" aria-label="Insurance claim steps">
              <article>
                <strong>1. Book and pay online</strong>
                <span>Your payment receipt and invoice are generated after the session is confirmed.</span>
              </article>
              <article>
                <strong>2. Download your invoice</strong>
                <span>Find it in your patient account under invoices, or use the copy sent by email.</span>
              </article>
              <article>
                <strong>3. Submit to your insurer</strong>
                <span>Upload the PDF through your insurer portal with any policy or claim reference they ask for.</span>
              </article>
            </div>
          </div>
        </Reveal>
      </section>

      <section className="page-section simple-section">
        <Reveal direction="up">
          <div className="site-shell section-heading">
            <h2>Common questions</h2>
          </div>
        </Reveal>
        <div className="site-shell service-faqs">
          <details>
            <summary>Do I need a GP referral for online physiotherapy?</summary>
            <p>No. You can self-refer for private physiotherapy directly &mdash; book an initial assessment whenever you&rsquo;re ready.</p>
          </details>
          <details>
            <summary>Can I be seen in person?</summary>
            <p>Yes, through home visits in the Glasgow area &mdash; choose &ldquo;Home visit in Glasgow&rdquo; when you book and enter your postcode to check we cover it, or <Link href="/glasgow-physiotherapist" prefetch>read about home visits in Glasgow</Link>. A home visit is {homeVisitPrices.initial} for the initial assessment and {homeVisitPrices.followUp} for a follow-up, all in, and can include hands-on treatment (manual therapy) where appropriate. We have no clinic or premises, and video appointments are available anywhere in the UK.</p>
          </details>
          <details>
            <summary>When are appointments available?</summary>
            <p>{APPOINTMENT_HOURS_SENTENCE} That&rsquo;s the same for home visits and video, so you can be seen without taking time off work. {HOME_VISIT_NOTICE_SENTENCE} The <Link href="/book" prefetch>booking page</Link> shows every free time.</p>
          </details>
          <details>
            <summary>Can a family member or carer be there?</summary>
            <p>Yes, and for neurological rehab it often makes a real difference. They&rsquo;re welcome to join and learn how to help with your exercises between sessions. Evening and weekend visits make it easier for someone who works during the day to be there.</p>
          </details>
          <details>
            <summary>Is online physiotherapy actually effective?</summary>
            <p>It depends on your condition. For many muscle and joint problems, a guided video assessment lets us reach a working diagnosis and set up an exercise-based plan, and we review your progress regularly and adjust it. If we think you need to be seen in person, we&rsquo;ll tell you plainly. See <Link href="/glasgow-physiotherapist" prefetch>how this works for Glasgow patients specifically</Link>.</p>
          </details>
          <details>
            <summary>What if online care isn&rsquo;t right for my situation?</summary>
            <p>You&rsquo;ll be told plainly at triage. Red-flag symptoms or suspected fractures are pointed toward your GP or urgent care rather than kept in a plan that isn&rsquo;t the right fit. Video sessions cannot include hands-on treatment; if you need it and you&rsquo;re in the Glasgow area, a home visit can include hands-on treatment (manual therapy) where appropriate, and elsewhere we&rsquo;ll point you to an in-person clinician.</p>
          </details>
          <details>
            <summary>Can I claim this back through insurance?</summary>
            <p>Yes &mdash; every paid session generates an insurance-ready receipt and PDF invoice automatically. Download it from your patient account, then submit it to your UK private health insurer through their claim portal or app. Check your policy first, because reimbursement depends on your insurer and level of cover.</p>
          </details>
        </div>
      </section>

      <section className="simple-cta-band" id="book">
        <div className="site-shell simple-cta-inner">
          <span className="eyebrow">Ready when you are</span>
          <h2>Book your first session</h2>
          <p>A home visit in Glasgow on a weekday evening or at the weekend, or a video appointment anywhere in the UK.</p>
          <Link className="button secondary cta-white" href="/book">
            Book your session
          </Link>
        </div>
      </section>
    </>
  );
}
