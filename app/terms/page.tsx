import type { Metadata } from "next";
import Link from "next/link";
import { Reveal } from "@/components/reveal";

export const metadata: Metadata = {
  title: "Terms & Conditions | PhysioOnClick",
  description: "Terms and conditions for using PhysioOnClick's online physiotherapy services."
};

// Body text inherits `a { color: inherit; text-decoration: none; }` globally,
// which makes inline links indistinguishable from surrounding copy. Long-form
// legal content needs links to read as links, so mid-paragraph anchors here
// get an explicit accent underline.
const inlineLinkStyle = { color: "var(--primary)", textDecoration: "underline", fontWeight: 600 };

export default function TermsPage() {
  return (
    <div className="site-shell">
      <Reveal direction="up">
      <section className="page-hero page-hero-split">
        <div className="stack">
          <span className="eyebrow">Terms &amp; Conditions</span>
          <h1>Clear terms for a clinical relationship built on trust.</h1>
        </div>
        <div className="page-hero-aside">
          <strong>Last updated</strong>
          <p className="muted">
            <time dateTime="2026-06">June 2026</time>
          </p>
        </div>
      </section>
      </Reveal>

      <section className="page-section two-col">

        <article className="panel stack soft-panel" style={{ maxWidth: "70ch", lineHeight: 1.6 }}>
          <h2>Who we are</h2>
          <p>
            PhysioOnClick is operated by Shivaliba Zala, an HCPC registered physiotherapist and CSP member.
            For any queries, contact us at{" "}
            <a href="mailto:hello@physioonclick.co.uk" style={inlineLinkStyle}>hello@physioonclick.co.uk</a>.
          </p>
        </article>

        <article className="panel stack" style={{ maxWidth: "70ch", lineHeight: 1.6 }}>
          <h2>Regulation &amp; professional standards</h2>
          <p>
            Care is regulated by the Health and Care Professions Council (HCPC) and delivered in line with
            Chartered Society of Physiotherapy (CSP) standards, including standards for remote and digital
            practice. See our{" "}
            <Link href="/professional-standards" style={inlineLinkStyle}>Professional Standards</Link> page for
            registration, consent, confidentiality, safeguarding, indemnity and complaints.
          </p>
        </article>

        <article className="panel stack" style={{ maxWidth: "70ch", lineHeight: 1.6 }}>
          <h2>Nature of the service</h2>
          <p>
            PhysioOnClick provides physiotherapy consultations online across the UK.
            Booking a consultation creates a professional clinical relationship. The standard of care provided
            online is equal to that of an in-person consultation. A lower standard of care is not acceptable
            simply because the interaction is remote.
          </p>
        </article>

        <article className="panel stack soft-panel" style={{ maxWidth: "70ch", lineHeight: 1.6 }}>
          <h2>Geographic scope</h2>
          <p>
            Services are provided to patients physically located in the United Kingdom at the time of
            consultation. Existing patients temporarily abroad (excluding the USA, Australia, and Canada)
            may continue care with prior agreement. If you are unsure whether your location is covered,
            contact us before booking.
          </p>
        </article>

        <article className="panel stack" style={{ maxWidth: "70ch", lineHeight: 1.6 }}>
          <h2>Limitations of online assessment</h2>
          <p>
            Some clinical presentations require in-person assessment to diagnose or treat safely. If your
            physiotherapist determines that remote consultation is not appropriate for your condition, they
            will advise you accordingly and recommend an alternative pathway.
          </p>
        </article>

        <article className="panel stack soft-panel" style={{ maxWidth: "70ch", lineHeight: 1.6 }}>
          <h2>Payment &amp; cancellation</h2>
          <p>
            Payment is taken at the time of the appointment, not online. Please provide at least 24 hours&apos;
            notice to cancel or rearrange. Late cancellations and non-attendance may be charged in full.
            See our{" "}
            <Link href="/cancellation-policy" style={inlineLinkStyle}>Cancellation Policy</Link> for full
            details.
          </p>
        </article>

        <article className="panel stack" style={{ maxWidth: "70ch", lineHeight: 1.6 }}>
          <h2>Your right to cancel</h2>
          <p>
            Because appointments are booked at a distance, you normally have a 14-day right to cancel under
            the Consumer Contracts Regulations 2013. If you ask us to begin your consultation within that
            period and it is fully carried out, you lose the right to cancel that appointment. This does not
            affect the notice periods in our{" "}
            <Link href="/cancellation-policy" style={inlineLinkStyle}>Cancellation Policy</Link>.
          </p>
        </article>

        <article className="panel stack soft-panel" style={{ maxWidth: "70ch", lineHeight: 1.6 }}>
          <h2>Data &amp; privacy</h2>
          <p>
            Your personal and clinical data is processed in accordance with UK GDPR and the Data Protection
            Act 2018. See our{" "}
            <Link href="/privacy-policy" style={inlineLinkStyle}>Privacy Policy</Link> for details on what we
            collect, how we use it, and your rights.
          </p>
        </article>

        <article className="panel stack" style={{ maxWidth: "70ch", lineHeight: 1.6 }}>
          <h2>Indemnity &amp; liability</h2>
          <p>
            Appropriate professional indemnity insurance is held for the physiotherapy services provided.
            Nothing in these terms limits liability for death or personal injury caused by negligence, for
            fraud, or for anything else that cannot be limited in law. Subject to that, we are not liable for
            outcomes arising from information you withhold, from failure to follow advice given, or from use
            of general educational content on this site (see our{" "}
            <Link href="/medical-disclaimer" style={inlineLinkStyle}>Medical Disclaimer</Link>).
          </p>
        </article>

        <article className="panel stack soft-panel" style={{ maxWidth: "70ch", lineHeight: 1.6 }}>
          <h2>Intellectual property</h2>
          <p>
            Content on this website, and any exercise programmes or materials provided to you, are for your
            personal use in connection with your care and may not be copied, redistributed or resold without
            permission.
          </p>
        </article>

        <article className="panel stack" style={{ maxWidth: "70ch", lineHeight: 1.6 }}>
          <h2>Complaints</h2>
          <p>
            If you are unhappy with any part of your care, please contact us first at{" "}
            <a href="mailto:hello@physioonclick.co.uk" style={inlineLinkStyle}>hello@physioonclick.co.uk</a>.
            Our full complaints route, including escalation to the HCPC and CSP, is set out on the{" "}
            <Link href="/professional-standards" style={inlineLinkStyle}>Professional Standards</Link> page.
          </p>
        </article>

        {/* Coral background tint (not a border-left stripe) marks this as the
            advisory/emergency callout, per the design system's semantic use
            of --color-coral. */}
        <article className="disclaimer-box stack" style={{ maxWidth: "70ch" }}>
          <h2>Emergency situations</h2>
          <p>
            PhysioOnClick is not an emergency service. If you are experiencing a medical emergency, call
            <strong> 999</strong> immediately. For urgent but non-emergency concerns, contact{" "}
            <strong>NHS 111</strong>.
          </p>
        </article>

        <article className="panel stack" style={{ maxWidth: "70ch", lineHeight: 1.6 }}>
          <h2>Governing law</h2>
          <p>
            These terms are governed by the laws of Scotland. Any disputes arising from the use of this
            service are subject to the exclusive jurisdiction of the Scottish courts.
          </p>
        </article>

        <article className="panel stack soft-panel" style={{ maxWidth: "70ch", lineHeight: 1.6 }}>
          <h2>Changes to these terms</h2>
          <p>
            We may update these terms from time to time. Continued use of the service after changes are
            published constitutes acceptance of the updated terms. The date at the top of this page reflects
            the most recent revision.
          </p>
        </article>

      </section>
    </div>
  );
}
