"use client";

import Link from "next/link";
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
      nextErrors.name = "Enter the patient's full name.";
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
      <h2>Book an Appointment</h2>
      <form className="contact-form-grid" noValidate onSubmit={handleSubmit}>
        <label>
          Full Name *
          <input name="name" placeholder="Your name" required />
          {errors.name ? <span className="field-error">{errors.name}</span> : null}
        </label>
        <label>
          Email *
          <input name="email" placeholder="your@email.com" required type="email" />
          {errors.email ? <span className="field-error">{errors.email}</span> : null}
        </label>
        <label>
          Phone
          <input name="phone" placeholder="07xxx xxxxxx" />
          {errors.phone ? <span className="field-error">{errors.phone}</span> : null}
        </label>
        <label>
          Service *
          <select name="service" required>
            <option value="">Select service</option>
            <option>Initial Assessment</option>
            <option>Follow-Up Session</option>
            <option>Online Consultation</option>
            <option>Post-Surgical Rehabilitation</option>
          </select>
          {errors.service ? <span className="field-error">{errors.service}</span> : null}
        </label>
        <label className="full-span">
          Message *
          <textarea name="message" placeholder="Tell us about your condition or question..." required rows={6} />
          {errors.message ? <span className="field-error">{errors.message}</span> : null}
        </label>
        <div className="full-span">
          <button className="button primary full-width" disabled={isSubmitting} type="submit">
            {isSubmitting ? "Sending..." : "Send Enquiry"}
          </button>
        </div>
      </form>
      <div className={`form-note ${statusTone === "error" ? "error" : statusTone === "success" ? "success" : ""}`}>
        <p className="muted">{status}</p>
        {statusTone === "error" ? (
          <Link className="form-note-link" href="mailto:hello@physioonclick.co.uk?subject=PhysioOnClick%20Enquiry">
            Email instead
          </Link>
        ) : null}
      </div>
    </div>
  );
}
