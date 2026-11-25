"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Activity, CalendarDays, Clock, MapPin, ShieldCheck, UserRound } from "lucide-react";

import { track } from "@/lib/analytics";
import { currentVisitSource, trackGrowthEvent } from "@/lib/growth-tracking";
import { isCoveredPostcode, outwardCode } from "@/lib/home-visit-area";
import { normalisePostcode } from "@/lib/home-visit";
import { postTown } from "@/lib/post-town";
import { PRACTICE_PHONE, PRACTICE_PHONE_HREF } from "@/lib/practice-contact";
import {
  DAY_PARTS,
  GENDERS,
  REQUEST_FIELDS,
  REQUEST_POSTCODE_KEY,
  URGENCY_OPTIONS,
  VISIT_CONCERNS,
  VISIT_NOTE_MAX,
  dateLabel,
  optionLabel,
  visitRequestErrorFields,
  visitRequestErrors,
  type RequestField,
  type RequestVisitType,
} from "@/lib/visit-request";

type Step = "condition" | "location" | "soon" | "date" | "details" | "consent";
const FULL_POSTCODE = /^[A-Z]{1,2}\d[A-Z\d]? \d[A-Z]{2}$/;
const STEPS: Record<Step, { title: string; question: string; Icon: typeof Activity; fields: RequestField[] }> = {
  condition: { title: "Your condition", question: "What can we help you with?", Icon: Activity, fields: [] },
  location: { title: "Your location", question: "Where would you like to be seen?", Icon: MapPin, fields: ["postcode", "town"] },
  soon: { title: "How soon?", question: "How soon would you like to be seen?", Icon: Clock, fields: [] },
  date: { title: "Preferred date", question: "When works best for you?", Icon: CalendarDays, fields: ["preferredDate", "preferredTime"] },
  details: {
    title: "Your details",
    question: "Almost done. How can we reach you?",
    Icon: UserRound,
    fields: ["name", "gender", "dateOfBirth", "phone", "email", "emergencyPhone", "note"],
  },
  consent: { title: "Consent", question: "Please read and agree before sending.", Icon: ShieldCheck, fields: [] },
};

const EMPTY = {
  concern: "",
  postcode: "",
  town: "",
  address: "",
  urgency: "",
  preferredDate: "",
  preferredTime: "",
  name: "",
  gender: "",
  dateOfBirth: "",
  phone: "",
  email: "",
  emergencyName: "",
  emergencyPhone: "",
  note: "",
};
type Values = typeof EMPTY;

/**
 * The half-filled request, kept in this tab only so reading a policy and
 * pressing back returns to the same step. Cleared once sent; the browser drops
 * it when the tab closes. Never sent anywhere.
 */
const DRAFT_KEY = "poc-request-form";
type Draft = { step: Step; visitType: RequestVisitType; values: Values; agreed: boolean[] };

function readDraft(): Draft | null {
  try {
    const draft = JSON.parse(window.sessionStorage.getItem(DRAFT_KEY) ?? "null") as Draft | null;
    return draft && draft.step in STEPS && draft.values ? draft : null;
  } catch {
    return null;
  }
}

/** Tomorrow in UK time: home visits need 24 hours' notice. */
function tomorrow(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/London" }).format(new Date(Date.now() + 86_400_000));
}

/**
 * Booking request with nothing to pay up front and no account. The patient
 * gives a preferred date and part of day; the practice confirms by phone and
 * takes payment after the session.
 */
export function VisitRequestForm({ source = "request_visit_page" }: { source?: string }) {
  const [step, setStep] = useState<Step>("condition");
  const [visitType, setVisitType] = useState<RequestVisitType>("home");
  const [values, setValues] = useState<Values>(EMPTY);
  const [agreed, setAgreed] = useState([false, false, false]);
  const [errors, setErrors] = useState<Partial<Record<RequestField, string>>>({});
  const [consentError, setConsentError] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "sent">("idle");
  const [serverError, setServerError] = useState("");
  const [minDate, setMinDate] = useState("");
  const [restored, setRestored] = useState(false);
  const honeypot = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const doneRef = useRef<HTMLHeadingElement>(null);
  const startedRef = useRef(false);
  // The town we filled in ourselves, so a typed one is never overwritten.
  const autoTown = useRef("");
  const movedRef = useRef(false);

  const video = visitType === "video";
  const steps = (Object.keys(STEPS) as Step[]).filter((s) => !(video && s === "location"));
  const index = steps.indexOf(step);
  const { title, question, Icon } = STEPS[step];

  function set(key: keyof Values, value: string) {
    setValues((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: undefined }));
  }

  // Logged once, so the Growth tab can tell "read it and left" from "started
  // and gave up". Never the concern or anything typed.
  function markStarted(at: string) {
    if (startedRef.current) return;
    startedRef.current = true;
    trackGrowthEvent("visit_request_started", { source, step: at });
  }

  // ?visit=video preselects video; ?about= (service, price and exercise pages)
  // starts the note; the homepage postcode check hands over via sessionStorage
  // so a postcode never goes in a URL.
  useEffect(() => {
    const earliest = tomorrow();
    setMinDate(earliest);
    const params = new URLSearchParams(window.location.search);
    const draft = readDraft();
    if (draft) {
      setStep(draft.step);
      setVisitType(draft.visitType);
      setAgreed(draft.agreed);
    }
    if (params.get("visit") === "video") setVisitType("video");
    const about = params.get("about")?.trim().slice(0, 120);
    let saved = "";
    try {
      // A postcode just typed on the homepage wins, and is used once.
      saved = window.sessionStorage.getItem(REQUEST_POSTCODE_KEY) ?? "";
      window.sessionStorage.removeItem(REQUEST_POSTCODE_KEY);
    } catch {
      // Storage blocked: they type it again.
    }
    setValues((current) => {
      const base = { ...current, ...draft?.values };
      return {
        ...base,
        note: base.note || (about ? `About: ${about}\n` : ""),
        postcode: saved || base.postcode,
        preferredDate: base.preferredDate >= earliest ? base.preferredDate : earliest,
      };
    });
    setRestored(true);
  }, []);

  useEffect(() => {
    // Nothing to keep until they have done something.
    const touched = step !== "condition" || values.concern !== "";
    if (!restored || state === "sent" || !touched) return;
    try {
      window.sessionStorage.setItem(DRAFT_KEY, JSON.stringify({ step, visitType, values, agreed }));
    } catch {
      // Storage blocked: the form still works, it just isn't remembered.
    }
  }, [restored, state, step, visitType, values, agreed]);

  useEffect(() => {
    if (!movedRef.current) return;
    headingRef.current?.focus();
    headingRef.current?.scrollIntoView?.({ block: "nearest" });
  }, [step]);

  useEffect(() => {
    if (state !== "sent") return;
    doneRef.current?.focus();
    doneRef.current?.scrollIntoView?.({ block: "center" });
  }, [state]);

  const normalised = normalisePostcode(values.postcode.trim());
  const postcodeComplete = FULL_POSTCODE.test(normalised);
  const covered = video || (postcodeComplete && isCoveredPostcode(normalised));

  // Fill "Town / city" from a complete postcode (typed, or carried from the homepage).
  useEffect(() => {
    if (!postcodeComplete) return;
    const town = postTown(normalised);
    setValues((current) => {
      if (current.town && current.town !== autoTown.current) return current;
      autoTown.current = town;
      return { ...current, town };
    });
    if (town) setErrors((current) => ({ ...current, town: undefined }));
  }, [normalised, postcodeComplete]);

  function go(direction: 1 | -1) {
    const next = steps[index + direction];
    if (!next) return;
    movedRef.current = true;
    setStep(next);
  }

  /** True when this step's fields are fine; otherwise shows and focuses them. */
  function check(fields: RequestField[]): boolean {
    const all = visitRequestErrors({ ...values, visitType });
    const found: Partial<Record<RequestField, string>> = {};
    for (const f of fields) if (all[f]) found[f] = all[f];
    if (values.preferredDate && minDate && values.preferredDate < minDate && fields.includes("preferredDate")) {
      found.preferredDate = "Choose tomorrow or later. For today, please call us.";
    }
    setErrors(found);
    const first = REQUEST_FIELDS.find((f) => found[f]);
    if (!first) return true;
    trackGrowthEvent("visit_request_error", { source, fields: visitRequestErrorFields({ ...values, visitType }, found) });
    formRef.current?.querySelector<HTMLElement>(`#visit-${first}, [name="${first}"]`)?.focus();
    return false;
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    // Enter in a field on an earlier step means "continue".
    if (step !== "consent") {
      if (!check(STEPS[step].fields)) return;
      markStarted(step);
      go(1);
      return;
    }
    setServerError("");
    if (!agreed.every(Boolean)) {
      setConsentError("Tick all three boxes to send your request.");
      trackGrowthEvent("visit_request_error", { source, fields: "consent:missing" });
      return;
    }
    setConsentError("");
    setState("sending");
    let status = 0;
    try {
      const res = await fetch("/api/visit-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...values,
          visitType,
          consent: true,
          hp_ref: honeypot.current?.value ?? "",
          channel: currentVisitSource().channel,
        }),
      });
      status = res.status;
      const json = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string };
      if (!res.ok || !json.ok) throw new Error(json.error || "Sorry, that didn't send. Please try again.");
      try {
        window.sessionStorage.removeItem(DRAFT_KEY);
      } catch {
        // Storage blocked: nothing was kept.
      }
      trackGrowthEvent("visit_request_sent", { source, covered });
      track("visit_request_sent", { source, covered });
      setState("sent");
    } catch (error) {
      // 0 = the request never reached the server (offline, blocked, timed out).
      trackGrowthEvent("visit_request_failed", { source, status: status || 0 });
      setServerError(error instanceof Error ? error.message : "Sorry, that didn't send. Please try again.");
      setState("idle");
    }
  }

  if (state === "sent") {
    const first = values.name.trim().split(/\s+/)[0] ?? "";
    return (
      <div className="visit-request-done" role="status" aria-live="polite" data-contact-source="request_visit_sent">
        <h2 ref={doneRef} tabIndex={-1}>
          Thanks{first ? `, ${first}` : ""}. We&rsquo;ll call you.
        </h2>
        <p>
          Shivaliba will ring you on <strong>{values.phone.trim()}</strong> from{" "}
          <a href={PRACTICE_PHONE_HREF}>{PRACTICE_PHONE}</a>, usually within a day, about{" "}
          <strong>
            {dateLabel(values.preferredDate)}, {optionLabel(DAY_PARTS, values.preferredTime).toLowerCase()}
          </strong>
          .
        </p>
        <p>Your time isn&rsquo;t booked until we&rsquo;ve confirmed it. You pay after your session.</p>
        {!covered ? (
          <p className="muted">
            {outwardCode(normalised)} is outside the area we usually visit. We&rsquo;ll talk about the options when
            we call, including a video appointment.
          </p>
        ) : null}
      </div>
    );
  }

  const error = (key: RequestField) =>
    errors[key] ? (
      <span className="field-error" id={`visit-${key}-error`}>
        {errors[key]}
      </span>
    ) : null;

  const input = (key: keyof Values & RequestField, label: React.ReactNode, props: React.InputHTMLAttributes<HTMLInputElement>) => (
    <label htmlFor={`visit-${key}`}>
      <span>{label}</span>
      <input
        id={`visit-${key}`}
        value={values[key]}
        maxLength={120}
        onChange={(e) => set(key, e.target.value)}
        aria-invalid={errors[key] ? true : undefined}
        aria-describedby={errors[key] ? `visit-${key}-error` : undefined}
        {...props}
      />
      {error(key)}
    </label>
  );

  const tiles = (
    key: keyof Values,
    legend: string,
    options: readonly { id: string; label: string; hint?: string }[],
    layout = "",
    hideLegend = false,
  ) => (
    <fieldset>
      <legend className={hideLegend ? "sr-only" : undefined}>{legend}</legend>
      <div className={`request-tiles ${layout}`}>
        {options.map((option) => (
          <label key={option.id} className="request-tile">
            <input
              type="radio"
              name={key}
              checked={values[key] === option.id}
              onChange={() => {
                markStarted(key);
                set(key, option.id);
              }}
            />
            <span>{option.label}</span>
            {option.hint ? <small>{option.hint}</small> : null}
          </label>
        ))}
      </div>
    </fieldset>
  );

  const consents = [
    <>
      I have read and agree to the <Link href="/terms">terms</Link> and{" "}
      <Link href="/cancellation-policy">cancellation policy</Link>.
    </>,
    <>
      I have read the <Link href="/privacy-policy">privacy policy</Link>, which explains how my information, including
      health information, is used to provide my care.
    </>,
    <>
      I ask for my appointment to take place within 14 days if that suits, and understand that once it has taken place
      I can&rsquo;t cancel it.
    </>,
  ];

  return (
    <form ref={formRef} className="visit-request-form" noValidate onSubmit={(e) => void submit(e)}>
      <div className="contact-form-honeypot" aria-hidden="true">
        <input ref={honeypot} name="hp_ref" type="text" tabIndex={-1} autoComplete="off" data-1p-ignore data-lpignore="true" />
      </div>

      <div className="request-head">
        <span className="request-head-icon">
          <Icon size={20} aria-hidden="true" />
        </span>
        <h3 ref={headingRef} tabIndex={-1}>
          {title}
        </h3>
        <span>
          Step {index + 1} of {steps.length}
        </span>
      </div>
      <div className="request-bar" aria-hidden="true">
        <i style={{ width: `${((index + 1) / steps.length) * 100}%` }} />
      </div>
      <p className="visit-request-small">{question}</p>

      {step === "condition" ? (
        <>
          {tiles("concern", "What can we help you with?", VISIT_CONCERNS, "", true)}
          <fieldset>
            <legend>How would you like to be seen?</legend>
            <div className="request-tiles">
              {(
                [
                  ["home", "Home visit", "Glasgow and nearby"],
                  ["video", "Video call", "Anywhere in the UK"],
                ] as const
              ).map(([id, label, hint]) => (
                <label key={id} className="request-tile">
                  <input
                    type="radio"
                    name="visitType"
                    checked={visitType === id}
                    onChange={() => setVisitType(id)}
                  />
                  <span>{label}</span>
                  <small>{hint}</small>
                </label>
              ))}
            </div>
          </fieldset>
        </>
      ) : null}

      {step === "location" ? (
        <>
          {input("postcode", "Postcode", { autoComplete: "postal-code", autoCapitalize: "characters", placeholder: "G72 8FE", maxLength: 10 })}
          {postcodeComplete ? (
            <span className={covered ? "visit-coverage is-covered" : "visit-coverage"}>
              {covered
                ? `We visit ${outwardCode(normalised)}.`
                : `${outwardCode(normalised)} is outside our usual area, but send it anyway and we'll talk about the options.`}
            </span>
          ) : null}
          {input("town", "Town / city", { autoComplete: "address-level2", maxLength: 60 })}
          <label htmlFor="visit-address">
            <span>
              Address line <span className="muted">(optional)</span>
            </span>
            <input
              id="visit-address"
              autoComplete="address-line1"
              placeholder="House number and street"
              maxLength={120}
              value={values.address}
              onChange={(e) => set("address", e.target.value)}
              aria-describedby="visit-address-hint"
            />
            <small className="muted" id="visit-address-hint">
              Adding your first line of address helps us arrange your visit faster.
            </small>
          </label>
        </>
      ) : null}

      {step === "soon" ? tiles("urgency", "How soon would you like to be seen?", URGENCY_OPTIONS, "request-tiles--one", true) : null}

      {step === "date" ? (
        <>
          {input("preferredDate", "Preferred date", { type: "date", min: minDate })}
          {tiles("preferredTime", "Preferred time", DAY_PARTS, "request-tiles--three")}
          {error("preferredTime")}
          <p className="visit-request-small muted">
            We check our diary and confirm the exact time with you before anything is booked.
          </p>
        </>
      ) : null}

      {step === "details" ? (
        <>
          {input("name", "Full name", { autoComplete: "name", maxLength: 80 })}
          {tiles("gender", "Gender", GENDERS, "request-tiles--three")}
          {error("gender")}
          {input("dateOfBirth", "Date of birth", { type: "date", autoComplete: "bday" })}
          <div className="request-pair">
            {input("phone", "Phone", { type: "tel", autoComplete: "tel", placeholder: "07123 456789", maxLength: 20 })}
            {input("email", "Email", { type: "email", autoComplete: "email" })}
          </div>
          <div className="request-pair">
            <label htmlFor="visit-emergencyName">
              <span>
                Emergency contact name <span className="muted">(optional)</span>
              </span>
              <input
                id="visit-emergencyName"
                maxLength={80}
                value={values.emergencyName}
                onChange={(e) => set("emergencyName", e.target.value)}
              />
            </label>
            {input(
              "emergencyPhone",
              <>
                Emergency contact phone <span className="muted">(optional)</span>
              </>,
              { type: "tel", maxLength: 20 },
            )}
          </div>
          <label htmlFor="visit-note">
            <span>
              Anything else? <span className="muted">(optional)</span>
            </span>
            <textarea
              id="visit-note"
              rows={3}
              maxLength={VISIT_NOTE_MAX}
              placeholder="Tell us more about your condition or access needs"
              value={values.note}
              onChange={(e) => set("note", e.target.value)}
            />
            {error("note")}
          </label>
        </>
      ) : null}

      {step === "consent" ? (
        <>
          {consents.map((text, i) => (
            <label key={i} className="request-check">
              <input
                type="checkbox"
                checked={agreed[i]}
                onChange={(e) => setAgreed(agreed.map((v, j) => (j === i ? e.target.checked : v)))}
              />
              <span>{text}</span>
            </label>
          ))}
          {consentError ? <span className="field-error">{consentError}</span> : null}
        </>
      ) : null}

      {serverError ? (
        <p className="field-error" role="alert">
          {serverError}
        </p>
      ) : null}

      <div className="request-actions">
        <button className="button primary" type="submit" disabled={state === "sending"} aria-busy={state === "sending"}>
          {step !== "consent" ? "Continue" : state === "sending" ? "Sending…" : "Send booking request"}
        </button>
        {index > 0 ? (
          <button className="request-back" type="button" onClick={() => go(-1)}>
            ← Back
          </button>
        ) : null}
      </div>
      <p className="visit-request-small muted">
        No payment now. Rather talk? Call <a href={PRACTICE_PHONE_HREF}>{PRACTICE_PHONE}</a>.
      </p>
    </form>
  );
}
