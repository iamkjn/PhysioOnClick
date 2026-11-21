"use client";

import { useEffect, useRef, useState } from "react";

import { track } from "@/lib/analytics";
import { currentVisitSource, trackGrowthEvent } from "@/lib/growth-tracking";
import { isCoveredPostcode, outwardCode } from "@/lib/home-visit-area";
import { normalisePostcode } from "@/lib/home-visit";
import { PRACTICE_PHONE, PRACTICE_PHONE_HREF } from "@/lib/practice-contact";
import { VISIT_NOTE_MAX, VISIT_TIME_OPTIONS, visitRequestErrors, type VisitTimeId } from "@/lib/visit-request";

type Field = "name" | "phone" | "postcode" | "note";
const FULL_POSTCODE = /^[A-Z]{1,2}\d[A-Z\d]? \d[A-Z]{2}$/;

/**
 * Name, phone and postcode, plus optional visit times and a short note. No
 * email, no account, no payment: the practice phones back to arrange the rest.
 */
export function VisitRequestForm({ source = "request_visit_page" }: { source?: string }) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [postcode, setPostcode] = useState("");
  const [times, setTimes] = useState<VisitTimeId[]>([]);
  const [note, setNote] = useState("");
  const [errors, setErrors] = useState<Partial<Record<Field, string>>>({});
  const [state, setState] = useState<"idle" | "sending" | "sent">("idle");
  const [serverError, setServerError] = useState("");
  const honeypot = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const doneRef = useRef<HTMLHeadingElement>(null);

  // The confirmation is much shorter than the form, so on a phone it can land
  // above the screen. Bring it into view and move focus to it.
  useEffect(() => {
    if (state !== "sent") return;
    doneRef.current?.focus();
    doneRef.current?.scrollIntoView?.({ block: "center" });
  }, [state]);

  const normalised = normalisePostcode(postcode.trim());
  const postcodeComplete = FULL_POSTCODE.test(normalised);
  const covered = postcodeComplete && isCoveredPostcode(normalised);

  function toggleTime(id: VisitTimeId) {
    setTimes((current) => (current.includes(id) ? current.filter((t) => t !== id) : [...current, id]));
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setServerError("");
    const found = visitRequestErrors({ name, phone, postcode, note });
    setErrors(found);
    const firstInvalid = (["name", "phone", "postcode", "note"] as Field[]).find((f) => found[f]);
    if (firstInvalid) {
      formRef.current?.querySelector<HTMLElement>(`#visit-${firstInvalid}`)?.focus();
      return;
    }

    setState("sending");
    try {
      const res = await fetch("/api/visit-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          phone,
          postcode,
          times,
          note,
          website: honeypot.current?.value ?? "",
          channel: currentVisitSource().channel,
        }),
      });
      const json = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string };
      if (!res.ok || !json.ok) throw new Error(json.error || "Sorry, that didn't send. Please try again.");
      trackGrowthEvent("visit_request_sent", { source, covered });
      track("visit_request_sent", { source, covered });
      setState("sent");
    } catch (error) {
      setServerError(error instanceof Error ? error.message : "Sorry, that didn't send. Please try again.");
      setState("idle");
    }
  }

  if (state === "sent") {
    const first = name.trim().split(/\s+/)[0] ?? "";
    return (
      <div className="visit-request-done" role="status" aria-live="polite">
        <h2 ref={doneRef} tabIndex={-1}>
          Thanks{first ? `, ${first}` : ""}. We&rsquo;ll call you.
        </h2>
        <p>
          Shivaliba will ring you on <strong>{phone.trim()}</strong> from{" "}
          <a href={PRACTICE_PHONE_HREF}>{PRACTICE_PHONE}</a>, usually within a day, to find a time for the visit.
        </p>
        <p>There&rsquo;s nothing to pay until you&rsquo;ve spoken and agreed a time.</p>
        {!covered ? (
          <p className="muted">
            {outwardCode(normalised)} is outside the area we usually visit. We&rsquo;ll talk about the options when
            we call, including a video appointment.
          </p>
        ) : null}
      </div>
    );
  }

  return (
    <form ref={formRef} className="visit-request-form" noValidate onSubmit={(e) => void submit(e)}>
      <div className="contact-form-honeypot" aria-hidden="true">
        <label>
          Website
          <input ref={honeypot} name="website" type="text" tabIndex={-1} autoComplete="off" />
        </label>
      </div>

      <label htmlFor="visit-name">
        Your name
        <input
          id="visit-name"
          name="name"
          autoComplete="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={80}
          aria-invalid={errors.name ? true : undefined}
          aria-describedby={errors.name ? "visit-name-error" : undefined}
        />
        {errors.name ? <span className="field-error" id="visit-name-error">{errors.name}</span> : null}
      </label>

      <label htmlFor="visit-phone">
        Phone number
        <input
          id="visit-phone"
          name="phone"
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          placeholder="07123 456789"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          maxLength={20}
          aria-invalid={errors.phone ? true : undefined}
          aria-describedby={errors.phone ? "visit-phone-error" : undefined}
        />
        {errors.phone ? <span className="field-error" id="visit-phone-error">{errors.phone}</span> : null}
      </label>

      <label htmlFor="visit-postcode">
        Postcode of the home we&rsquo;d visit
        <input
          id="visit-postcode"
          name="postcode"
          autoComplete="postal-code"
          autoCapitalize="characters"
          placeholder="G72 8FE"
          value={postcode}
          onChange={(e) => setPostcode(e.target.value)}
          maxLength={10}
          aria-invalid={errors.postcode ? true : undefined}
          aria-describedby={errors.postcode ? "visit-postcode-error" : postcodeComplete ? "visit-postcode-hint" : undefined}
        />
        {errors.postcode ? (
          <span className="field-error" id="visit-postcode-error">{errors.postcode}</span>
        ) : postcodeComplete ? (
          <span className={covered ? "visit-coverage is-covered" : "visit-coverage"} id="visit-postcode-hint">
            {covered
              ? `We visit ${outwardCode(normalised)}.`
              : `${outwardCode(normalised)} is outside our usual area, but send it anyway and we'll talk about the options.`}
          </span>
        ) : null}
      </label>

      <fieldset className="visit-times">
        <legend>When would suit you for the visit? <span className="muted">(optional, tick any)</span></legend>
        <div className="visit-times-options">
          {VISIT_TIME_OPTIONS.map((option) => (
            <label key={option.id} className="visit-time" htmlFor={`visit-time-${option.id}`}>
              <input
                id={`visit-time-${option.id}`}
                type="checkbox"
                checked={times.includes(option.id)}
                onChange={() => toggleTime(option.id)}
              />
              {option.label}
            </label>
          ))}
        </div>
      </fieldset>

      <label htmlFor="visit-note">
        <span>
          What&rsquo;s it for? <span className="muted">(optional)</span>
        </span>
        <textarea
          id="visit-note"
          name="note"
          rows={3}
          maxLength={VISIT_NOTE_MAX}
          placeholder="e.g. Mum had a fall last month and is unsteady on the stairs"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          aria-invalid={errors.note ? true : undefined}
          aria-describedby={errors.note ? "visit-note-error" : undefined}
        />
        {errors.note ? <span className="field-error" id="visit-note-error">{errors.note}</span> : null}
      </label>

      {serverError ? (
        <p className="field-error" role="alert">
          {serverError}
        </p>
      ) : null}

      <button className="button primary full-width" type="submit" disabled={state === "sending"} aria-busy={state === "sending"}>
        {state === "sending" ? "Sending…" : "Request a call back"}
      </button>
      <p className="visit-request-small muted">
        Nothing to pay now. We only use your details to call you about this visit.
      </p>
    </form>
  );
}
