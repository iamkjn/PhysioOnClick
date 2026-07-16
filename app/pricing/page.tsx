import type { Metadata } from "next";
import Link from "next/link";

import { getPublicPricing } from "@/lib/public-content";
import { formatCurrency } from "@/lib/utils";
import { Reveal } from "@/components/reveal";

export const metadata: Metadata = {
  title: "Pricing | PhysioOnClick",
  description: "Transparent, online physiotherapy pricing with no hidden fees."
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

      <section className="simple-cta-band" id="book">
        <div className="site-shell simple-cta-inner">
          <span className="eyebrow">Ready to book?</span>
          <h2>Schedule your appointment online</h2>
          <p>Pick a time that suits you. Confirmation is sent to your email instantly once the slot is confirmed.</p>
          <Link className="button secondary cta-white" href="/book">
            Book now
          </Link>
        </div>
      </section>
    </div>
  );
}
