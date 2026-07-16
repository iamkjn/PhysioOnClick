import type { Metadata } from "next";
import Link from "next/link";

import { Reveal } from "@/components/reveal";

export const metadata: Metadata = {
  title: "Privacy Policy | PhysioOnClick",
  description: "How PhysioOnClick collects, stores and uses your personal and clinical data in line with UK GDPR and the Data Protection Act 2018."
};

// Body text inherits `a { color: inherit; text-decoration: none; }` globally,
// which makes inline links indistinguishable from surrounding copy. Long-form
// legal content needs links to read as links, so mid-paragraph anchors here
// get an explicit accent underline.
const inlineLinkStyle = { color: "var(--primary)", textDecoration: "underline", fontWeight: 600 };

export default function PrivacyPolicyPage() {
  return (
    <div className="site-shell">
      <Reveal direction="up">
        <section className="page-hero page-hero-split">
          <div className="stack">
            <span className="eyebrow">Privacy policy</span>
            <h1>GDPR-conscious handling of patient and website data.</h1>
          </div>
          <div className="page-hero-aside">
            <strong>Last updated</strong>
            <p className="muted">
              <time dateTime="2026-07">July 2026</time>
            </p>
          </div>
        </section>
      </Reveal>

      <section className="page-section two-col">

        <article className="panel stack soft-panel" style={{ maxWidth: "70ch", lineHeight: 1.6 }}>
          <h2>Who we are</h2>
          <p>
            PhysioOnClick is operated by Shivaliba Zala (trading as PhysioOnClick), the data controller for
            all personal data collected through this website and associated services. We are registered with
            the Information Commissioner&apos;s Office (ICO) as a data controller. Contact:{" "}
            <a href="mailto:hello@physioonclick.co.uk" style={inlineLinkStyle}>hello@physioonclick.co.uk</a>.
          </p>
          <p>
            This policy explains how we collect, use, store and protect your personal data in line with the
            UK General Data Protection Regulation (UK GDPR) and the Data Protection Act 2018.
          </p>
        </article>

        <article className="panel stack" style={{ maxWidth: "70ch", lineHeight: 1.6 }}>
          <h2>What data we collect</h2>
          <p>We collect the following categories of personal data:</p>
          <ul>
            <li><strong>Contact details:</strong> name, email address, phone number</li>
            <li><strong>Appointment data:</strong> preferred dates, times, and service type</li>
            <li><strong>Clinical information:</strong> condition notes, session records, progress data, and exercise assignments entered through the patient portal</li>
            <li><strong>Dependant details:</strong> where you manage care for a child or another person, the details you add for them</li>
            <li><strong>Enquiry &amp; chat content:</strong> messages you send through the contact form and the on-site chat assistant</li>
            <li><strong>Payment:</strong> payment is taken at the time of your appointment, not online, so we do not collect or store online payment card data</li>
            <li><strong>Usage data:</strong> pages visited and session activity, collected anonymously via analytics only where you have consented</li>
          </ul>
        </article>

        <article className="panel stack soft-panel" style={{ maxWidth: "70ch", lineHeight: 1.6 }}>
          <h2>Special category (health) data</h2>
          <p>
            Clinical and condition information is &ldquo;special category&rdquo; data under Article 9 of the UK
            GDPR and is given additional protection. We process it under{" "}
            <strong>Article 9(2)(h)</strong> — the provision of health care and treatment by a registered
            health professional bound by a duty of professional confidentiality (HCPC-registered
            physiotherapy). We only collect the health information needed to assess and treat you safely.
          </p>
        </article>

        <article className="panel stack" style={{ maxWidth: "70ch", lineHeight: 1.6 }}>
          <h2>Lawful basis for processing</h2>
          <ul>
            <li><strong>Contract performance (Art 6(1)(b)):</strong> processing your name, email, and appointment details to deliver the service you have booked</li>
            <li><strong>Legal obligation (Art 6(1)(c)):</strong> retaining clinical records for the period required by HCPC standards</li>
            <li><strong>Legitimate interests (Art 6(1)(f)):</strong> maintaining secure systems, communicating about your care, and improving the service</li>
            <li><strong>Consent (Art 6(1)(a)):</strong> for optional analytics cookies and any non-essential communications; you may withdraw consent at any time</li>
            <li><strong>Health care (Art 9(2)(h)):</strong> the additional condition for processing your clinical data, as above</li>
          </ul>
        </article>

        <article className="panel stack soft-panel" style={{ maxWidth: "70ch", lineHeight: 1.6 }}>
          <h2>Third-party processors</h2>
          <p>Your data is processed by the following third parties on our behalf, under written data-processing terms:</p>
          <ul>
            <li><strong>Google Firebase:</strong> Authentication, Firestore database and Storage, used to store account, appointment, and clinical data securely</li>
            <li><strong>Cal.com:</strong> used for appointment scheduling; booking data is shared with Cal.com to manage your calendar appointment</li>
            <li><strong>Google Calendar / Google Meet:</strong> used to create appointment events and video consultation links; attendee details (name, email) are shared with Google to generate the meeting link</li>
            <li><strong>Google Gemini:</strong> powers the on-site chat assistant; the content of your chat messages is processed to generate replies</li>
            <li><strong>Resend:</strong> sends transactional emails such as sign-in links and enquiry notifications</li>
            <li><strong>Google Analytics:</strong> anonymous usage statistics, loaded only after you accept analytics cookies</li>
          </ul>
        </article>

        <article className="panel stack" style={{ maxWidth: "70ch", lineHeight: 1.6 }}>
          <h2>International data transfers</h2>
          <p>
            Some of our processors (including Google and Cal.com) may store or process data on servers
            outside the UK. Where data is transferred outside the UK, it is protected by appropriate
            safeguards — the UK International Data Transfer Agreement or Addendum, UK adequacy regulations,
            or Standard Contractual Clauses — so your data receives an equivalent level of protection.
          </p>
        </article>

        <article className="panel stack soft-panel" style={{ maxWidth: "70ch", lineHeight: 1.6 }}>
          <h2>Automated decision-making</h2>
          <p>
            We do not make decisions about your care by solely automated means. The on-site chat assistant
            provides general information and helps you navigate the service; it does not diagnose, and it
            does not replace assessment by your physiotherapist. All clinical decisions are made by a
            registered professional.
          </p>
        </article>

        <article className="panel stack" style={{ maxWidth: "70ch", lineHeight: 1.6 }}>
          <h2>Children&apos;s data</h2>
          <p>
            Where physiotherapy is provided to a child, their data is entered and managed by a parent or
            guardian with parental responsibility, who provides consent on the child&apos;s behalf. We hold
            children&apos;s clinical records to the same standard and retention period as any other patient.
          </p>
        </article>

        <article className="panel stack soft-panel" style={{ maxWidth: "70ch", lineHeight: 1.6 }}>
          <h2>Data retention</h2>
          <ul>
            <li><strong>Adult clinical records:</strong> retained for 8 years from the date of last contact, in line with HCPC record-keeping standards</li>
            <li><strong>Children&apos;s clinical records:</strong> retained until the patient&apos;s 25th birthday (or 26th if the last entry was made at age 17)</li>
            <li><strong>Appointment and contact enquiries:</strong> retained for 12 months after the last interaction</li>
          </ul>
        </article>

        <article className="panel stack" style={{ maxWidth: "70ch", lineHeight: 1.6 }}>
          <h2>How we keep your data secure</h2>
          <p>
            Access to clinical records is restricted and authenticated. Data is transmitted over encrypted
            (HTTPS) connections and held with reputable providers that maintain their own security controls.
            If a personal data breach occurs that is likely to result in a risk to your rights, we will
            report it to the ICO within 72 hours and notify you where required.
          </p>
        </article>

        <article className="panel stack soft-panel" style={{ maxWidth: "70ch", lineHeight: 1.6 }}>
          <h2>Your rights</h2>
          <p>Under UK GDPR you have the right to:</p>
          <ul>
            <li><strong>Access</strong> the personal data we hold about you</li>
            <li><strong>Rectification</strong> of inaccurate data</li>
            <li><strong>Erasure</strong> of your data where there is no legal obligation to retain it</li>
            <li><strong>Restriction</strong> of processing in certain circumstances</li>
            <li><strong>Data portability:</strong> receive your data in a structured, machine-readable format</li>
            <li><strong>Object</strong> to processing based on legitimate interests</li>
            <li><strong>Withdraw consent</strong> at any time, where processing is based on consent (this does not affect processing already carried out)</li>
          </ul>
          <p>To exercise any of these rights, email{" "}
            <a href="mailto:hello@physioonclick.co.uk" style={inlineLinkStyle}>hello@physioonclick.co.uk</a>.
            We will respond within one month.
          </p>
        </article>

        <article className="panel stack" style={{ maxWidth: "70ch", lineHeight: 1.6 }}>
          <h2>Cookies</h2>
          <p>
            We use <strong>essential cookies</strong> to run the site and keep you signed in — these are
            required for the service to work and do not need consent. We also use{" "}
            <strong>optional analytics cookies</strong> (Google Analytics) to understand how the site is
            used; these are only set after you choose &ldquo;Accept all&rdquo; on the cookie banner, and are
            disabled by default. We do not use advertising or third-party marketing cookies. You can change
            your choice at any time by clearing this site&apos;s data in your browser, which will show the
            banner again.
          </p>
        </article>

        <article className="panel stack soft-panel" style={{ maxWidth: "70ch", lineHeight: 1.6 }}>
          <h2>Complaints</h2>
          <p>
            If you have concerns about how we handle your data, please contact us first at{" "}
            <a href="mailto:hello@physioonclick.co.uk" style={inlineLinkStyle}>hello@physioonclick.co.uk</a>.
            You also have the right to complain to the Information Commissioner&apos;s Office (ICO) at{" "}
            <a href="https://ico.org.uk" target="_blank" rel="noopener noreferrer" style={inlineLinkStyle}>
              ico.org.uk
              <span className="sr-only"> (opens in a new tab)</span>
            </a>.
          </p>
          <p>
            For concerns about clinical care or professional conduct, see our{" "}
            <Link href="/professional-standards" style={inlineLinkStyle}>Professional Standards</Link> page.
          </p>
        </article>

      </section>
    </div>
  );
}
