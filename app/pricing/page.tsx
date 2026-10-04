import type { Metadata } from "next";
import Link from "next/link";

import { serviceLabelFor } from "@/lib/cal-services";
import { HOME_VISIT_AREA_LABEL } from "@/lib/home-visit-area";
import {
  HOME_VISIT_TRAVEL_FEE_PENCE,
  formatPounds,
  sessionPricePence,
  travelFeePence
} from "@/lib/home-visit-pricing";
import { getPublicPricing } from "@/lib/public-content";
import { bundleSessionCount, initialAssessmentPrice, payAsYouGoPrice, pricing } from "@/lib/site-data";
import { formatCurrency } from "@/lib/utils";
import { Reveal } from "@/components/reveal";
import { TrackedBookLink } from "@/components/tracked-book-link";

const followUp = pricing.find((item) => item.id === "follow-up")?.price ?? 0;

// Price-led title: nearly every online competitor that ranks shows its price
// in the snippet, and ours undercuts most of them.
export const metadata: Metadata = {
  alternates: { canonical: "/pricing" },
  title: `Online Physio Prices: £${initialAssessmentPrice} Assessment, £${followUp} Follow-Up | PhysioOnClick`,
  description: `Online physio with an HCPC-registered physio: £${initialAssessmentPrice} video assessment, £${followUp} follow-ups, bundles to save more. No GP referral; insurance-ready invoices.`
};

export const dynamic = "force-static";

export default function PricingPage() {
  const pricing = getPublicPricing();
  const online = pricing.filter((item) => item.mode === "Online");
  const packages = pricing.filter((item) => item.mode === "Package");
  const included = [
    "Personalised treatment plan",
    "Email support between sessions",
    "Exercise prescription",
    "Clear pricing confirmed before your session",
    "Progress tracking",
    "Free to reschedule with 24 hours' notice"
  ];

  return (
    <div className="site-shell">
      <section className="simple-page-hero">
        <h1>
          Transparent <span>Pricing</span>
        </h1>
        <p>Clear, competitive pricing with no hidden fees. All sessions include a personalised treatment plan.</p>
        <div className="pricing-offer-card">
          <strong>New patient offer</strong>
          <span>Use code <b>NEW10</b> at checkout for 10% off your first booking.</span>
        </div>
      </section>

      <section className="page-section stack pricing-sections">
        <div>
          <Reveal direction="up">
            <h2>Video appointments <span>(UK-wide)</span></h2>
          </Reveal>
          <div className="pricing-grid pricing-grid-two">
            {online.map((item, i) => (
              <Reveal key={item.id} direction="up" delay={i * 100}>
                <article className="simple-price-card" style={{ display: "flex", flexDirection: "column" }}>
                  <h3>{item.title}</h3>
                  <p className="muted">{item.duration}</p>
                  <strong>{formatCurrency(item.price)}</strong>
                  <p>{item.description}</p>
                  <Link
                    className="button primary"
                    href={`/book?service=${item.id}`}
                    aria-label={`Book ${item.title}`}
                    style={{ marginTop: "auto" }}
                  >
                    Book Now
                  </Link>
                </article>
              </Reveal>
            ))}
          </div>
        </div>

        <div>
          <Reveal direction="up">
            <h2>Rehab Packages</h2>
          </Reveal>
          <div className="pricing-grid pricing-grid-two">
            {packages.map((item, i) => {
              const savings = payAsYouGoPrice(bundleSessionCount(item)) - item.price;
              return (
                <Reveal key={item.id} direction="up" delay={i * 100}>
                  <article className="simple-package-card" style={{ display: "flex", flexDirection: "column" }}>
                    {savings > 0 ? <div className="save-pill">Save {formatCurrency(savings)}</div> : null}
                    <h3>{item.title}</h3>
                    <strong>{formatCurrency(item.price)}</strong>
                    <p>{item.description}</p>
                    <Link
                      className="button primary"
                      href={`/book?service=${item.id}`}
                      aria-label={`Get started with ${item.title}`}
                      style={{ marginTop: "auto" }}
                    >
                      Get Started
                    </Link>
                  </article>
                </Reveal>
              );
            })}
          </div>
        </div>

        <div>
          <Reveal direction="up">
            <h2>
              Home visits in Glasgow{" "}
              <span>(video price + {formatPounds(HOME_VISIT_TRAVEL_FEE_PENCE)} travel fee per visit)</span>
            </h2>
          </Reveal>
          <p className="muted">
            We visit {HOME_VISIT_AREA_LABEL}. The travel fee is a fixed {formatPounds(HOME_VISIT_TRAVEL_FEE_PENCE)} per visit,
            shown as its own line at checkout and on your invoice; bundles include every visit&apos;s fee upfront. Discount
            codes apply to the session price.
          </p>
          <div className="pricing-grid pricing-grid-two">
            {[...online, ...packages].map((item) => (
              <article key={item.id} className="simple-price-card">
                <h3>{serviceLabelFor(item.id, "home")}</h3>
                <strong>{formatPounds(sessionPricePence(item.id) + travelFeePence(item.id, "home"))}</strong>
                <p className="muted">
                  {formatPounds(sessionPricePence(item.id))} + {formatPounds(travelFeePence(item.id, "home"))} travel
                </p>
              </article>
            ))}
          </div>
          <div style={{ marginTop: "1rem" }}>
            <TrackedBookLink
              className="button primary"
              href="/book?visit=home"
              source="pricing_page_home_visit"
              event="book_now_click"
            >
              Book a home visit
            </TrackedBookLink>
          </div>
        </div>

        <Reveal direction="up">
          <div className="sessions-include-card">
            <h3>All Sessions Include</h3>
            <div className="include-grid">
              {included.map((item) => (
                <p key={item}>{item}</p>
              ))}
            </div>
            <p className="muted" style={{ marginTop: "0.75rem" }}>Free to reschedule up to 24 hours before your session, with no charge for a cancelled slot inside that window.</p>
          </div>
        </Reveal>
      </section>

      <section className="page-section simple-section">
        <Reveal direction="up">
          <div className="site-shell section-heading">
            <h2>Pricing questions</h2>
          </div>
        </Reveal>
        <div className="site-shell service-faqs">
          <details>
            <summary>Can I claim this back on health insurance?</summary>
            <p>Cover and rules vary between insurers and policies, and we cannot promise that any insurer will pay. Every paid session generates a receipt and a PDF invoice showing the physiotherapist&rsquo;s HCPC registration number, emailed to you and available in your account any time you need to submit a claim. Before you book, check with your insurer whether they need a GP referral, pre-authorisation, or a practitioner on their recognised list. <Link href="/guides/claim-physiotherapy-on-health-insurance">How to claim physiotherapy on health insurance</Link>.</p>
          </details>
          <details>
            <summary>How much does private physiotherapy cost in the UK?</summary>
            <p>At the four UK providers we checked, prices ranged from &pound;44 for a 30-minute online session to &pound;125 for a first appointment. Here, the initial online assessment is {formatCurrency(initialAssessmentPrice)} and follow-ups are {formatCurrency(followUp)}, with no travel time. <Link href="/guides/private-physiotherapy-cost-uk">Private physiotherapy cost in the UK, explained</Link>.</p>
          </details>
          <details>
            <summary>Do I need a GP referral, and how quickly can I be seen?</summary>
            <p>No referral is needed &mdash; you book a live slot yourself, usually within days. For comparison, only 52.4% of patients seen by NHS Scotland musculoskeletal services (physiotherapy, occupational therapy, podiatry and orthotics) between August 2025 and March 2026 had waited four weeks or less (<a href="https://www.publichealthscotland.scot/publications/allied-health-professionals-musculoskeletal-waiting-times-in-nhs-scotland/allied-health-professionals-musculoskeletal-waiting-times-in-nhs-scotland-quarterly-and-monthly-data-to-31-march-2026/" target="_blank" rel="noopener noreferrer">Public Health Scotland</a>).</p>
          </details>
          <details>
            <summary>What&rsquo;s the cancellation policy?</summary>
            <p>Free to reschedule or cancel with 24 hours&rsquo; notice, no charge. Inside 24 hours, see the full <Link href="/cancellation-policy" prefetch>cancellation policy</Link> for details.</p>
          </details>
          <details>
            <summary>Do I pay before or after the session?</summary>
            <p>Payment is taken securely at booking through Stripe, and your appointment is confirmed immediately once payment goes through &mdash; no separate invoicing step required.</p>
          </details>
        </div>
      </section>

      <section className="simple-cta-band" id="book">
        <div className="site-shell simple-cta-inner">
          <span className="eyebrow">Ready to book?</span>
          <h2>Schedule your appointment online</h2>
          <p>Pick a time that suits you. Confirmation is sent to your email instantly once the slot is confirmed.</p>
          <TrackedBookLink
            className="button secondary cta-white"
            href="/book"
            source="pricing_page"
            event="book_now_click"
          >
            Book now
          </TrackedBookLink>
        </div>
      </section>
    </div>
  );
}
