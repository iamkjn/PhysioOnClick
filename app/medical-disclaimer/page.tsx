export default function MedicalDisclaimerPage() {
  return (
    <div className="site-shell">
      <section className="page-hero legal-hero">
        <div className="stack">
          <span className="eyebrow">Medical disclaimer</span>
          <h1>Information supports education and triage, not diagnosis.</h1>
        </div>
        <div className="legal-aside">
          <strong>Safe expectations</strong>
          <p className="muted">Clear disclaimers protect users and keep the tone clinically responsible.</p>
        </div>
      </section>
      <section className="page-section legal-grid">
        <article className="panel stack soft-panel">
          <h2>General information only</h2>
          <p>
            Content on PhysioOnClick, including blog articles and the AI symptom checker, is for general educational
            information only and does not replace individual medical advice, diagnosis or emergency care.
          </p>
        </article>
        <article className="panel stack">
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
