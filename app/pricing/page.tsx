import type { Metadata } from "next";
import Link from "next/link";

import { getPublicPricing } from "@/lib/public-content";
import { formatCurrency } from "@/lib/utils";
import { Reveal } from "@/components/reveal";

export const metadata: Metadata = {
  title: "Pricing | PhysioOnClick",
  description: "Transparent physiotherapy pricing for Glasgow home visits and online consultations."
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
    "Secure online payment",
    "Progress tracking",
    "Automatic email receipts"
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
              <Reveal key={item.title} direction="up" delay={i * 100}>
                <article className="simple-price-card">
                  <h3>{item.title}</h3>
                  <p className="muted">{item.duration}</p>
                  <strong>{formatCurrency(item.price)}</strong>
                  <p>{item.description}</p>
                  <Link className="button primary" href="/book">Book Now</Link>
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
            {packages.map((item, i) => (
              <Reveal key={item.title} direction="up" delay={i * 100}>
                <article className="simple-package-card">
                  <div className="save-pill">{item.title.includes("4") ? "Save £20" : "Save £60"}</div>
                  <h3>{item.title}</h3>
                  <strong>{formatCurrency(item.price)}</strong>
                  <p>{item.description}</p>
                  <Link className="button primary" href="/book">Get Started</Link>
                </article>
              </Reveal>
            ))}
          </div>
        </div>

        <Reveal direction="up">
          <div className="sessions-include-card">
            <h3>All Sessions Include</h3>
            <div className="include-grid">
              {included.map((item) => (
                <p key={item}>✓ {item}</p>
              ))}
            </div>
          </div>
        </Reveal>
      </section>

      <Reveal direction="up">
        <section className="page-section" id="book">
          <div className="panel stack">
            <span className="eyebrow">Ready to book?</span>
            <h3>Schedule your appointment online</h3>
            <p>Pick a time that suits you. Confirmation is sent to your email instantly once the slot is confirmed.</p>
            <div className="button-row">
              <Link className="button primary" href="/book">
                Book now
              </Link>
            </div>
          </div>
        </section>
      </Reveal>
    </div>
  );
}
