import type { Metadata } from "next";

import { Reveal } from "@/components/reveal";

export const metadata: Metadata = {
  title: "Cancellation Policy | PhysioOnClick",
  description: "Notice periods, late cancellation charges, and refund arrangements for PhysioOnClick physiotherapy appointments."
};

export default function CancellationPolicyPage() {
  return (
    <div className="site-shell">
      <Reveal direction="up">
      <section className="page-hero page-hero-split">
        <div className="stack">
          <span className="eyebrow">Cancellation policy</span>
          <h1>Clear cancellation terms for patients and appointments.</h1>
        </div>
        <div className="page-hero-aside">
          <strong>Last updated</strong>
          <p className="muted">July 2026</p>
        </div>
      </section>
      </Reveal>
      <section className="page-section two-col">
        <article className="panel stack soft-panel">
          <h2>Notice period</h2>
          <p>
            Patients should provide at least 24 hours&apos; notice to rearrange or cancel an appointment. Late
            cancellations and non-attendance may be charged in full unless exceptional circumstances apply.
          </p>
        </article>
        <article className="panel stack">
          <h2>Packages and refunds</h2>
          <p>
            Package sessions and online appointments should follow the same cancellation expectations. Refunds,
            where applicable, are arranged directly by the clinic where clinically and commercially appropriate.
          </p>
        </article>
      </section>
    </div>
  );
}
