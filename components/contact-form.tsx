"use client";

import { useState } from "react";

import { auth } from "@/lib/firebase";
import { saveEnquiry } from "@/lib/firestore-helpers";
import { ensurePatientRecord, mergePatientProfileDetails } from "@/lib/patient-account";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const phonePattern = /^(?:\+44|0)[0-9\s]{9,14}$/;

export function ContactForm() {
  const [status, setStatus] = useState("We'll respond within 24 hours. Your data is handled in accordance with our privacy policy.");
  const [statusTone, setStatusTone] = useState<"default" | "success" | "error">("default");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [consent, setConsent] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const form = event.currentTarget;
    const formData = new FormData(form);
    const payload = {
      name: String(formData.get("name") || "").trim(),
      email: String(formData.get("email") || "").trim(),
      phone: String(formData.get("phone") || "").trim(),
      service: String(formData.get("service") || "").trim(),
      message: String(formData.get("message") || "").trim()
    };
    const currentUser = auth?.currentUser || null;

    const nextErrors: Record<string, string> = {};

    if (payload.name.length < 2) {
      nextErrors.name = "Enter your full name.";
    }

    if (!emailPattern.test(payload.email)) {
      nextErrors.email = "Enter a valid email address.";
    }

    if (payload.phone && !phonePattern.test(payload.phone)) {
      nextErrors.phone = "Enter a valid UK phone number or leave this blank.";
    }

    if (!payload.service) {
      nextErrors.service = "Choose the service you want to enquire about.";
    }

    if (payload.message.length < 20) {
      nextErrors.message = "Add a little more detail so the enquiry can be triaged properly.";
    }

    if (!consent) {
      nextErrors.consent = "Please confirm you have read the Privacy Policy before sending.";
    }

    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      setStatus("Please fix the highlighted fields before sending your enquiry.");
      setStatusTone("error");
      return;
    }

    setIsSubmitting(true);

    try {
      if (currentUser) {
        await ensurePatientRecord(currentUser);
        await mergePatientProfileDetails(currentUser, {
          fullName: payload.name,
          phone: payload.phone,
          email: payload.email
        });
      }

      const enquiryPayload = {
        ...payload,
        userId: currentUser?.uid || "",
        patientRef: currentUser ? `patients/${currentUser.uid}` : ""
      };
      let emailSent = false;

      try {
        const response = await fetch("/api/enquiry", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify(enquiryPayload)
        });

        const result = (await response.json()) as {
          error?: string;
          saved?: boolean;
          saveReason?: string;
          emailSent?: boolean;
          emailReason?: string;
        };

        if (!response.ok) {
          throw new Error(result.error || "Unable to send enquiry.");
        }

        emailSent = Boolean(result.emailSent);

        if (result.saved === false) {
          try {
            await saveEnquiry(enquiryPayload);
          } catch (error) {
            if (!emailSent) {
              throw error;
            }
          }
        }
      } catch {
        await saveEnquiry(enquiryPayload);
      }

      setStatus(
        emailSent
          ? "Enquiry sent successfully. A notification has also been emailed and we will be in touch soon."
          : "Enquiry saved successfully, but the email notification is not configured. Please email hello@physioonclick.co.uk if this is urgent."
      );
      setStatusTone("success");
      setErrors({});
      setConsent(false);
      form.reset();
    } catch {
      setStatus("We could not save your enquiry right now. Please try again in a moment or email hello@physioonclick.co.uk.");
      setStatusTone("error");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="contact-form-card">
      <h2>Send an Enquiry</h2>
      <form className="contact-form-grid" noValidate onSubmit={handleSubmit}>
        <label>
          Full Name <span aria-hidden="true">*</span>
          <input
            name="name"
            placeholder="Your name"
            required
            aria-invalid={errors.name ? true : undefined}
            aria-describedby={errors.name ? "err-name" : undefined}
          />
          {errors.name ? <span className="field-error" id="err-name">{errors.name}</span> : null}
        </label>
        <label>
          Email <span aria-hidden="true">*</span>
          <input
            name="email"
            placeholder="your@email.com"
            required
            type="email"
            aria-invalid={errors.email ? true : undefined}
            aria-describedby={errors.email ? "err-email" : undefined}
          />
          {errors.email ? <span className="field-error" id="err-email">{errors.email}</span> : null}
        </label>
        <label>
          Phone
          <input
            name="phone"
            placeholder="07xxx xxxxxx"
            type="tel"
            inputMode="tel"
            aria-invalid={errors.phone ? true : undefined}
            aria-describedby={errors.phone ? "err-phone" : undefined}
          />
          {errors.phone ? <span className="field-error" id="err-phone">{errors.phone}</span> : null}
        </label>
        <label>
          Service <span aria-hidden="true">*</span>
          <select
            name="service"
            required
            defaultValue=""
            aria-invalid={errors.service ? true : undefined}
            aria-describedby={errors.service ? "err-service" : undefined}
          >
            <option value="" disabled>Select service</option>
            <option>Initial Assessment</option>
            <option>Follow-Up Session</option>
            <option>Online Consultation</option>
            <option>Post-Surgical Rehabilitation</option>
          </select>
          {errors.service ? <span className="field-error" id="err-service">{errors.service}</span> : null}
        </label>
        <label className="full-span">
          Message <span aria-hidden="true">*</span>
          <textarea
            name="message"
            placeholder="Tell us about your condition or question..."
            required
            rows={6}
            aria-invalid={errors.message ? true : undefined}
            aria-describedby={errors.message ? "err-message" : undefined}
          />
          {errors.message ? <span className="field-error" id="err-message">{errors.message}</span> : null}
        </label>
        <label className="full-span" style={{ display: "flex", alignItems: "flex-start", gap: "10px", fontSize: "0.85rem", lineHeight: 1.5, cursor: "pointer" }}>
          <input
            name="consent"
            type="checkbox"
            required
            checked={consent}
            onChange={(e) => setConsent(e.target.checked)}
            style={{ marginTop: "3px", flexShrink: 0, width: "16px", height: "16px" }}
            aria-invalid={errors.consent ? true : undefined}
            aria-describedby={errors.consent ? "err-consent" : undefined}
          />
          <span>
            I consent to PhysioOnClick storing and using the details above to respond to my enquiry, as
            described in the{" "}
            <a href="/privacy-policy" style={{ color: "var(--primary)", textDecoration: "underline", fontWeight: 600 }}>Privacy Policy</a>.
            {errors.consent ? <span className="field-error" id="err-consent" style={{ display: "block" }}>{errors.consent}</span> : null}
          </span>
        </label>
        <div className="full-span">
          <button className="button primary full-width" disabled={isSubmitting} aria-busy={isSubmitting} type="submit">
            {isSubmitting ? "Sending…" : "Send Enquiry"}
          </button>
        </div>
      </form>
      <div
        className={`form-note ${statusTone === "error" ? "error" : statusTone === "success" ? "success" : ""}`}
        role="status"
        aria-live="polite"
      >
        <p className="muted">{status}</p>
        {statusTone === "error" ? (
          <a className="form-note-link" href="mailto:hello@physioonclick.co.uk?subject=PhysioOnClick%20Enquiry">
            Email instead
          </a>
        ) : null}
      </div>
    </div>
  );
}
