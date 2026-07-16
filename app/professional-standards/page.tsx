import type { Metadata } from "next";
import Link from "next/link";

import { Reveal } from "@/components/reveal";

export const metadata: Metadata = {
  title: "Professional Standards | PhysioOnClick",
  description: "PhysioOnClick is delivered by an HCPC-registered physiotherapist and CSP member, working to UK professional standards for regulation, consent, confidentiality, safeguarding and complaints."
};

// Body text inherits `a { color: inherit; text-decoration: none; }` globally,
// so mid-paragraph anchors here get an explicit accent underline to read as links.
const inlineLinkStyle = { color: "var(--primary)", textDecoration: "underline", fontWeight: 600 };

export default function ProfessionalStandardsPage() {
  return (
    <div className="site-shell">
      <Reveal direction="up">
        <section className="page-hero page-hero-split">
          <div className="stack">
            <span className="eyebrow">Professional standards</span>
            <h1>Regulated care, held to HCPC and CSP standards.</h1>
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
          <h2>Regulation by the HCPC</h2>
          <p>
            &ldquo;Physiotherapist&rdquo; is a protected title in the UK. PhysioOnClick is delivered by
            Shivaliba Zala, a physiotherapist registered with the{" "}
            <a href="https://www.hcpc-uk.org" target="_blank" rel="noopener noreferrer" style={inlineLinkStyle}>
              Health and Care Professions Council (HCPC)
              <span className="sr-only"> (opens in a new tab)</span>
            </a>. Registration confirms that the required standards of proficiency, conduct, performance and
            ethics are met, and that professional indemnity is in place.
          </p>
          <p>
            You can verify current registration on the{" "}
            <a href="https://www.hcpc-uk.org/check-the-register/" target="_blank" rel="noopener noreferrer" style={inlineLinkStyle}>
              HCPC online register
              <span className="sr-only"> (opens in a new tab)</span>
            </a>. Our HCPC registration number is available on request and displayed on the register.
          </p>
        </article>

        <article className="panel stack" style={{ maxWidth: "70ch", lineHeight: 1.6 }}>
          <h2>CSP membership</h2>
          <p>
            We are a member of the{" "}
            <a href="https://www.csp.org.uk" target="_blank" rel="noopener noreferrer" style={inlineLinkStyle}>
              Chartered Society of Physiotherapy (CSP)
              <span className="sr-only"> (opens in a new tab)</span>
            </a>, the professional, educational and trade union body for UK physiotherapy. Practice follows
            the CSP&apos;s Code of Members&apos; Professional Values and Behaviour and its Quality Assurance
            Standards, including standards for remote and digital delivery of physiotherapy.
          </p>
        </article>

        <article className="panel stack soft-panel" style={{ maxWidth: "70ch", lineHeight: 1.6 }}>
          <h2>Scope of practice</h2>
          <p>
            Care is provided only within our areas of competence. If a condition falls outside our scope, or
            cannot be assessed or treated safely by remote consultation, we will tell you and direct you to a
            more appropriate service — your GP, an in-person physiotherapist, or urgent care. See the{" "}
            <Link href="/terms" style={inlineLinkStyle}>Terms &amp; Conditions</Link> for the limitations of
            online assessment.
          </p>
        </article>

        <article className="panel stack" style={{ maxWidth: "70ch", lineHeight: 1.6 }}>
          <h2>Consent to treatment</h2>
          <p>
            Treatment proceeds only with your informed consent. Before and during care you will be told what
            an assessment or intervention involves, its benefits and risks, and any alternatives, so you can
            make an informed decision. You may ask questions, decline any part of treatment, or withdraw your
            consent at any time. For a child or a person who lacks capacity, consent is given by someone with
            the legal authority to do so.
          </p>
        </article>

        <article className="panel stack soft-panel" style={{ maxWidth: "70ch", lineHeight: 1.6 }}>
          <h2>Chaperones</h2>
          <p>
            You are welcome to have a chaperone, family member or carer present during any consultation,
            including online sessions. If a consultation involves guided movements where you would prefer
            someone else present, let us know and we will accommodate it.
          </p>
        </article>

        <article className="panel stack" style={{ maxWidth: "70ch", lineHeight: 1.6 }}>
          <h2>Confidentiality &amp; records</h2>
          <p>
            Everything you share is treated as confidential and disclosed only with your consent or where the
            law requires it. Clinical records are kept accurate, secure and retained in line with HCPC
            record-keeping standards. Full detail of how your data is handled is in our{" "}
            <Link href="/privacy-policy" style={inlineLinkStyle}>Privacy Policy</Link>.
          </p>
        </article>

        <article className="panel stack soft-panel" style={{ maxWidth: "70ch", lineHeight: 1.6 }}>
          <h2>Safeguarding</h2>
          <p>
            We have a duty to protect children and adults at risk of harm. Where there is a genuine
            safeguarding concern, we may need to share information with the relevant authorities, in line
            with HCPC standards and UK safeguarding law — this is one of the limited situations where
            confidentiality may be overridden.
          </p>
        </article>

        <article className="panel stack" style={{ maxWidth: "70ch", lineHeight: 1.6 }}>
          <h2>Professional indemnity insurance</h2>
          <p>
            As required for HCPC registration, appropriate professional indemnity cover is held for the
            physiotherapy services provided through PhysioOnClick. Details of the cover are available on
            request.
          </p>
        </article>

        <article className="panel stack soft-panel" style={{ maxWidth: "70ch", lineHeight: 1.6 }}>
          <h2>Continuing professional development</h2>
          <p>
            We maintain the continuing professional development required to stay registered with the HCPC,
            keeping our knowledge and skills current and evidence-based.
          </p>
        </article>

        <article className="panel stack" style={{ maxWidth: "70ch", lineHeight: 1.6 }}>
          <h2>Duty of candour &amp; complaints</h2>
          <p>
            We are open and honest when things go wrong. If you are unhappy with any aspect of your care,
            please raise it with us first at{" "}
            <a href="mailto:hello@physioonclick.co.uk" style={inlineLinkStyle}>hello@physioonclick.co.uk</a>{" "}
            — we will acknowledge your complaint, look into it, and respond. If we cannot resolve it, or your
            concern is about professional conduct, you can contact:
          </p>
          <ul>
            <li>
              the{" "}
              <a href="https://www.hcpc-uk.org/concerns/" target="_blank" rel="noopener noreferrer" style={inlineLinkStyle}>
                HCPC
                <span className="sr-only"> (opens in a new tab)</span>
              </a>{" "}
              about a registrant&apos;s fitness to practise
            </li>
            <li>
              the{" "}
              <a href="https://www.csp.org.uk" target="_blank" rel="noopener noreferrer" style={inlineLinkStyle}>
                CSP
                <span className="sr-only"> (opens in a new tab)</span>
              </a>{" "}
              for guidance on standards of physiotherapy practice
            </li>
            <li>
              the{" "}
              <a href="https://ico.org.uk" target="_blank" rel="noopener noreferrer" style={inlineLinkStyle}>
                ICO
                <span className="sr-only"> (opens in a new tab)</span>
              </a>{" "}
              about how your data has been handled
            </li>
          </ul>
        </article>

        {/* Coral background tint marks the advisory/emergency callout, per the
            design system's semantic use of --color-coral. */}
        <article className="disclaimer-box stack" style={{ maxWidth: "70ch" }}>
          <h2>Emergencies</h2>
          <p>
            PhysioOnClick is not an emergency service. If you are experiencing a medical emergency, call
            <strong> 999</strong> immediately. For urgent but non-emergency concerns, contact{" "}
            <strong>NHS 111</strong>.
          </p>
        </article>

      </section>
    </div>
  );
}
