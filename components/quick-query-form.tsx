"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import { currentVisitSource, trackGrowthEvent } from "@/lib/growth-tracking";
import { visitRequestErrors, type RequestField } from "@/lib/visit-request";

// Kept in this tab so reading the privacy policy and pressing back loses nothing.
const DRAFT_KEY = "poc-quick-query";

/** Name, phone and email only: the practice calls back. */
export function QuickQueryForm() {
  const [values, setValues] = useState({ name: "", phone: "", email: "", note: "" });
  const [consent, setConsent] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<RequestField, string>>>({});
  const [problem, setProblem] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "sent">("idle");
  const honeypot = useRef<HTMLInputElement>(null);

  useEffect(() => {
    try {
      const draft = JSON.parse(window.sessionStorage.getItem(DRAFT_KEY) ?? "null");
      if (draft) setValues((current) => ({ ...current, ...draft }));
    } catch {
      // Storage blocked or unreadable: start empty.
    }
  }, []);

  function change(key: "name" | "phone" | "email" | "note", value: string) {
    const next = { ...values, [key]: value };
    setValues(next);
    try {
      window.sessionStorage.setItem(DRAFT_KEY, JSON.stringify(next));
    } catch {
      // Storage blocked: just not remembered.
    }
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    const found = visitRequestErrors({ ...values, quick: true });
    setErrors(found);
    setProblem(consent ? "" : "Tick the box so we can contact you.");
    if (Object.keys(found).length || !consent) return;
    setState("sending");
    try {
      const res = await fetch("/api/visit-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...values,
          quick: true,
          consent,
          website: honeypot.current?.value ?? "",
          channel: currentVisitSource().channel,
        }),
      });
      const json = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string };
      if (!res.ok || !json.ok) throw new Error(json.error);
      try {
        window.sessionStorage.removeItem(DRAFT_KEY);
      } catch {
        // Storage blocked: nothing was kept.
      }
      trackGrowthEvent("visit_request_sent", { source: "quick_query" });
      setState("sent");
    } catch (error) {
      setProblem((error as Error).message || "Sorry, that didn't send. Please call or WhatsApp us.");
      setState("idle");
    }
  }

  if (state === "sent") {
    return (
      <p role="status">
        <strong>Thanks.</strong> We&rsquo;ll call you, usually within a day.
      </p>
    );
  }

  const field = (key: "name" | "phone" | "email", label: string, type: string, autoComplete: string) => (
    <label htmlFor={`quick-${key}`}>
      {label}
      <input
        id={`quick-${key}`}
        type={type}
        autoComplete={autoComplete}
        value={values[key]}
        maxLength={120}
        onChange={(e) => change(key, e.target.value)}
        aria-invalid={errors[key] ? true : undefined}
      />
      {errors[key] ? <span className="field-error">{errors[key]}</span> : null}
    </label>
  );

  return (
    <form className="visit-request-form" noValidate onSubmit={(e) => void submit(e)} aria-label="Quick query">
      <div className="contact-form-honeypot" aria-hidden="true">
        <input ref={honeypot} name="website" type="text" tabIndex={-1} autoComplete="off" />
      </div>
      {field("name", "Full name", "text", "name")}
      {field("phone", "Contact number", "tel", "tel")}
      {field("email", "Email address", "email", "email")}
      <label htmlFor="quick-note">
        <span>
          Your question <span className="muted">(optional)</span>
        </span>
        <textarea
          id="quick-note"
          rows={3}
          maxLength={500}
          value={values.note}
          onChange={(e) => change("note", e.target.value)}
        />
      </label>
      <label className="request-check">
        <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} />
        <span>
          I agree to the <Link href="/privacy-policy">privacy policy</Link> and to being contacted about my question.
        </span>
      </label>
      {problem ? (
        <p className="field-error" role="alert">
          {problem}
        </p>
      ) : null}
      <button className="button secondary full-width" type="submit" disabled={state === "sending"}>
        {state === "sending" ? "Sending…" : "Call me back"}
      </button>
    </form>
  );
}
