import type { Metadata } from "next";
import Link from "next/link";

import { getPublicPricing } from "@/lib/public-content";
import { initialAssessmentPrice, pricing } from "@/lib/site-data";
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
  const followUpPrice = online.find((item) => item.id === "follow-up")?.price ?? 0;
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
            <h2>Online Consultations <span>(UK-wide)</span></h2>
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
              const sessionCount = Number(item.title.match(/\d+/)?.[0] ?? 0);
              const savings = sessionCount * followUpPrice - item.price;
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
            <p>If your policy covers physiotherapy, usually yes. Every paid session generates a receipt and a PDF invoice showing the physiotherapist&rsquo;s HCPC registration number, emailed to you and available in your account any time you need to submit a claim. Check with your insurer first whether they need pre-authorisation.</p>
          </details>
          <details>
            <summary>How much does private physiotherapy cost in the UK?</summary>
            <p>A first private physiotherapy appointment in the UK commonly costs anywhere from about &pound;45 to over &pound;100, depending on the clinic and location. Here, the initial online assessment is {formatCurrency(initialAssessmentPrice)} and follow-ups are {formatCurrency(followUp)}, with no travel time &mdash; and the rehab packages above reduce the per-session cost further for anyone committing to a structured plan.</p>
          </details>
          <details>
            <summary>Do I need a GP referral, and how quickly can I be seen?</summary>
            <p>No referral is needed &mdash; you book a live slot yourself, usually within days. For comparison, only 52.4% of NHS Scotland musculoskeletal patients were seen within the four-week target between August 2025 and March 2026 (<a href="https://www.publichealthscotland.scot/publications/allied-health-professionals-musculoskeletal-waiting-times-in-nhs-scotland/allied-health-professionals-musculoskeletal-waiting-times-in-nhs-scotland-quarterly-and-monthly-data-to-31-march-2026/" target="_blank" rel="noopener noreferrer">Public Health Scotland</a>).</p>
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
