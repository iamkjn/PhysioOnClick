export default function CancellationPolicyPage() {
  return (
    <div className="site-shell">
      <section className="page-hero legal-hero">
        <div className="stack">
          <span className="eyebrow">Cancellation policy</span>
          <h1>Clear cancellation terms for patients and appointments.</h1>
        </div>
        <div className="legal-aside">
          <strong>Transparent by design</strong>
          <p className="muted">Premium care still needs simple, predictable booking expectations.</p>
        </div>
      </section>
      <section className="page-section legal-grid">
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
            Package sessions and online appointments should follow the same cancellation expectations. Refunds can be
            managed through Stripe in the admin dashboard where clinically and commercially appropriate.
          </p>
        </article>
      </section>
    </div>
  );
}
