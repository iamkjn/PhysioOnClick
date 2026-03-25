import type { Metadata } from "next";

import { SymptomChecker } from "@/components/symptom-checker";

export const metadata: Metadata = {
  title: "AI Symptom Checker | PhysioOnClick",
  description: "Use the PhysioOnClick symptom checker for non-diagnostic rehab guidance and booking support."
};

export default function SymptomCheckerPage() {
  return (
    <div className="site-shell">
      <section className="simple-page-hero">
        <h1>
          AI Symptom <span>Checker</span>
        </h1>
        <p>Answer a few questions about your symptoms to receive guidance on possible conditions and recommended services.</p>
      </section>

      <section className="page-section symptom-checker-wrap">
        <SymptomChecker />
      </section>
    </div>
  );
}
