import type { Metadata } from "next";
import { Reveal } from "@/components/reveal";

export const metadata: Metadata = {
  title: "Medical Disclaimer | PhysioOnClick",
  description: "PhysioOnClick content is for general education only and does not replace individual medical advice, diagnosis or emergency care."
};

export default function MedicalDisclaimerPage() {
  return (
    <div className="site-shell">
      <Reveal direction="up">
      <section className="page-hero page-hero-split">
        <div className="stack">
          <span className="eyebrow">Medical disclaimer</span>
          <h1>Information supports education and triage, not diagnosis.</h1>
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
          <h2>General information only</h2>
          <p>
            Content on PhysioOnClick, including blog articles, is for general educational
            information only and does not replace individual medical advice, diagnosis or emergency care.
          </p>
        </article>
        {/* Coral background tint (not a border-left stripe) marks this as the
            advisory/emergency callout, per the design system's semantic use
            of --color-coral. */}
        <article className="disclaimer-box stack" style={{ maxWidth: "70ch" }}>
          <h2>When to seek urgent help</h2>
          <p>
            If you experience severe symptoms, rapidly worsening weakness, chest pain, unexplained systemic illness, major
            trauma, or new bladder or bowel changes, seek urgent medical attention immediately.
          </p>
        </article>
      </section>
    </div>
  );
}
