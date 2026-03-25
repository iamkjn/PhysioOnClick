export default function PrivacyPolicyPage() {
  return (
    <div className="site-shell">
      <section className="page-hero legal-hero">
        <div className="stack">
          <span className="eyebrow">Privacy policy</span>
          <h1>GDPR-conscious handling of patient and website data.</h1>
        </div>
        <div className="legal-aside">
          <strong>Built for trust</strong>
          <p className="muted">Healthcare platforms need clarity around data use, storage and access from the first touchpoint.</p>
        </div>
      </section>
      <section className="page-section legal-grid">
        <article className="panel stack soft-panel">
          <h2>How data is used</h2>
          <p>
            PhysioOnClick processes personal data for appointment management, communication, clinical care, payment
            administration and secure document handling. Data should be stored and processed in line with UK GDPR, the
            Data Protection Act 2018 and relevant healthcare confidentiality expectations.
          </p>
        </article>
        <article className="panel stack">
          <h2>Access and storage</h2>
          <p>
            Patient information should only be collected where necessary, retained securely and accessed by authorised
            personnel. Firebase Authentication, Firestore and Storage should be configured with principle-of-least-access
            rules before production launch.
          </p>
        </article>
      </section>
    </div>
  );
}
