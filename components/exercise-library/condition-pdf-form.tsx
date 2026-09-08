"use client";

// Email-capture for the "get this staged plan as a PDF" giveaway on a condition
// hub. Posts to the public route at /api/exercise-plan/condition-pdf (which
// builds the illustrated PDF and emails it). Small hand-rolled state machine,
// no form library. The honeypot `website` field is hidden off-screen and
// tab-skipped: a real visitor never fills it, a naive bot does.

import { useState } from "react";
import type { FormEvent } from "react";

import { trackLibraryEvent } from "@/lib/analytics";

type Status = "idle" | "submitting" | "success" | "error";

const SUCCESS = "Check your inbox - the plan is on its way.";
const GENERIC_ERROR = "Something went wrong - please try again in a minute.";
const INVALID_EMAIL = "That email address doesn't look right.";
const RATE_LIMITED = "You've requested this a few times - try again shortly.";

export function ConditionPdfForm({
  conditionSlug,
  conditionName,
}: {
  conditionSlug: string;
  conditionName: string;
}) {
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState("");
  const [email, setEmail] = useState("");
  const [website, setWebsite] = useState("");

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (status === "submitting") return;

    setStatus("submitting");
    setMessage("");

    try {
      const response = await fetch("/api/exercise-plan/condition-pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conditionSlug, email, website }),
      });

      if (response.status === 400) {
        setStatus("error");
        setMessage(INVALID_EMAIL);
        return;
      }
      if (response.status === 429) {
        setStatus("error");
        setMessage(RATE_LIMITED);
        return;
      }

      let ok = response.ok;
      if (ok) {
        const data = (await response
          .json()
          .catch(() => null)) as { ok?: boolean } | null;
        ok = data?.ok !== false;
      }

      if (!ok) {
        setStatus("error");
        setMessage(GENERIC_ERROR);
        return;
      }

      setStatus("success");
      setMessage(SUCCESS);
      setEmail("");
      trackLibraryEvent("library_pdf_request", conditionSlug);
    } catch {
      setStatus("error");
      setMessage(GENERIC_ERROR);
    }
  }

  const submitting = status === "submitting";

  return (
    <form
      className="exlib-pdf-form"
      onSubmit={onSubmit}
      aria-label={`Email me the ${conditionName} exercise plan`}
    >
      <label className="exlib-pdf-form__label" htmlFor="condition-pdf-email">
        Prefer it as a PDF? Get the whole plan by email.
      </label>
      <div className="exlib-pdf-form__row">
        <input
          id="condition-pdf-email"
          className="exlib-pdf-form__input"
          type="email"
          name="email"
          required
          autoComplete="email"
          placeholder="you@example.com"
          value={email}
          disabled={submitting}
          onChange={(event) => setEmail(event.target.value)}
        />
        <button type="submit" className="button primary" disabled={submitting}>
          {submitting ? "Sending..." : "Email me this plan"}
        </button>
      </div>

      <div className="exlib-pdf-form__hp" aria-hidden="true">
        <label htmlFor="condition-pdf-website">Leave this field empty</label>
        <input
          id="condition-pdf-website"
          type="text"
          name="website"
          tabIndex={-1}
          autoComplete="off"
          value={website}
          onChange={(event) => setWebsite(event.target.value)}
        />
      </div>

      <p
        className="exlib-pdf-form__status"
        data-status={status}
        aria-live="polite"
      >
        {message}
      </p>
    </form>
  );
}
