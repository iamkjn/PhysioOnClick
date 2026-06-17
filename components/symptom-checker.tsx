"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

import { auth } from "@/lib/firebase";
import { saveSymptomCheck } from "@/lib/firestore-helpers";
import { ensurePatientRecord } from "@/lib/patient-account";

export function SymptomChecker() {
  const painAreas = ["Neck", "Shoulder", "Upper Back", "Lower Back", "Hip", "Knee", "Ankle/Foot", "Wrist/Hand", "Elbow", "Other"];
  const durations = ["Less than 1 week", "1-4 weeks", "1-3 months", "3-6 months", "More than 6 months"];
  const severities = [
    "Mild - slight discomfort",
    "Moderate - affects daily activities",
    "Severe - significantly limits movement",
    "Very severe - constant, debilitating pain"
  ];
  const symptomOptions = [
    "Pain at rest",
    "Pain during movement",
    "Stiffness",
    "Swelling",
    "Numbness/tingling",
    "Weakness",
    "Clicking/popping",
    "Instability",
    "Difficulty walking",
    "Difficulty sleeping"
  ];

  const [step, setStep] = useState(0);
  const [area, setArea] = useState("");
  const [duration, setDuration] = useState("");
  const [severity, setSeverity] = useState("");
  const [symptoms, setSymptoms] = useState<string[]>([]);
  const [status, setStatus] = useState("");

  const canContinue =
    (step === 0 && area) ||
    (step === 1 && duration) ||
    (step === 2 && severity) ||
    (step === 3 && symptoms.length > 0);

  const result = useMemo(() => {
    const lower = `${area} ${duration} ${severity} ${symptoms.join(" ")}`.toLowerCase();
    if (lower.includes("shoulder")) {
      return {
        title: "Possible Rotator Cuff Issue",
        body: "Injury or irritation of the rotator cuff muscles, causing pain with overhead movements.",
        recommendation: "Initial Assessment recommended"
      };
    }

    if (lower.includes("back")) {
      return {
        title: "Possible Mechanical Back Pain",
        body: "Symptoms may relate to a mechanical or postural back issue that responds well to physiotherapy assessment.",
        recommendation: "Initial Assessment recommended"
      };
    }

    return {
      title: "Musculoskeletal Assessment Suggested",
      body: "Your answers suggest a physiotherapy assessment could help guide treatment and next steps.",
      recommendation: "Initial Assessment recommended"
    };
  }, [area, duration, severity, symptoms]);

  function toggleSymptom(value: string) {
    setSymptoms((current) => (current.includes(value) ? current.filter((item) => item !== value) : [...current, value]));
  }

  async function showResults() {
    setStep(4);

    const currentUser = auth?.currentUser || null;

    try {
      if (currentUser) {
        await ensurePatientRecord(currentUser);
      }

      await saveSymptomCheck({
        area,
        duration,
        severity,
        symptoms,
        potentialCondition: result.title,
        recommendation: result.recommendation,
        email: currentUser?.email || "",
        userId: currentUser?.uid || "",
        patientRef: currentUser ? `patients/${currentUser.uid}` : ""
      });
      setStatus("");
    } catch {
      setStatus("We could not save these symptom checker results right now, but your guidance is still shown below.");
    }
  }

  return (
    <div className="symptom-wizard">
      <div className="disclaimer-box">
        <strong>Medical Disclaimer</strong>
        <p>
          This tool provides general guidance only and is not a substitute for professional medical advice, diagnosis or
          treatment. Always seek the advice of a qualified health professional.
        </p>
      </div>

      <div className="progress-steps">
        {[0, 1, 2, 3].map((index) => (
          <span className={index <= step ? "active" : ""} key={index} />
        ))}
      </div>

      {step === 0 ? (
        <div className="wizard-step">
          <h3>Where is your pain or discomfort?</h3>
          <div className="wizard-options-grid">
            {painAreas.map((option) => (
              <button className={`wizard-option ${area === option ? "selected" : ""}`} key={option} onClick={() => setArea(option)} type="button">
                {option}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      {step === 1 ? (
        <div className="wizard-step">
          <h3>How long have you had this issue?</h3>
          <div className="wizard-options-stack">
            {durations.map((option) => (
              <button className={`wizard-option full ${duration === option ? "selected" : ""}`} key={option} onClick={() => setDuration(option)} type="button">
                {option}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      {step === 2 ? (
        <div className="wizard-step">
          <h3>How would you rate the severity?</h3>
          <div className="wizard-options-stack">
            {severities.map((option) => (
              <button className={`wizard-option full ${severity === option ? "selected" : ""}`} key={option} onClick={() => setSeverity(option)} type="button">
                {option}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      {step === 3 ? (
        <div className="wizard-step">
          <h3>Select all symptoms that apply</h3>
          <div className="wizard-options-grid two-col-grid">
            {symptomOptions.map((option) => (
              <button
                className={`wizard-option ${symptoms.includes(option) ? "selected" : ""}`}
                key={option}
                onClick={() => toggleSymptom(option)}
                type="button"
              >
                {option}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      {step > 3 ? (
        <div className="wizard-step">
          <h3>Your Results</h3>
          <p className="muted">Based on your responses, here are possible considerations:</p>
          <div className="result-card">
            <strong>{result.title}</strong>
            <p>{result.body}</p>
            <span>{result.recommendation}</span>
          </div>
        </div>
      ) : null}

      <div className="wizard-actions">
        {step > 0 ? (
          <button className="wizard-back" onClick={() => setStep(step - 1)} type="button">
            ← Back
          </button>
        ) : (
          <span />
        )}

        {step < 4 ? (
          <button
            className="button primary next-button"
            disabled={!canContinue}
            onClick={() => {
              if (step === 3) {
                void showResults();
                return;
              }

              setStep(step + 1);
            }}
            type="button"
          >
            {step === 3 ? "Get Results →" : "Next →"}
          </button>
        ) : (
          <div className="button-row">
            <Link href="/book" className="button primary">
              Book Assessment
            </Link>
            <button
              className="button secondary"
              onClick={() => {
                setStep(0);
                setArea("");
                setDuration("");
                setSeverity("");
                setSymptoms([]);
              }}
              type="button"
            >
              Start Over
            </button>
          </div>
        )}
      </div>
      {status ? <p className="muted" style={{ color: "#9C3F27" }}>{status}</p> : null}
    </div>
  );
}
