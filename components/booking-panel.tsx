"use client";

import { useMemo, useState } from "react";

import { auth } from "@/lib/firebase";
import { saveBooking } from "@/lib/firestore-helpers";
import { ensurePatientRecord, mergePatientProfileDetails } from "@/lib/patient-account";
import type { PricingItem } from "@/lib/site-data";
import { formatCurrency } from "@/lib/utils";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const phonePattern = /^(?:\+44|0)[0-9\s]{9,14}$/;

function nextDateOptions() {
  return Array.from({ length: 14 }, (_, index) => {
    const value = new Date();
    value.setDate(value.getDate() + index + 1);
    return value.toISOString().slice(0, 10);
  });
}

const timeOptions = ["09:00", "10:00", "11:00", "12:00", "14:00", "15:00", "16:00", "17:00"];

export function BookingPanel({ pricingItems }: { pricingItems: PricingItem[] }) {
  const [selected, setSelected] = useState(pricingItems[0]?.title || "");
  const [status, setStatus] = useState("Choose a service and preferred slot to request your booking.");
  const [statusTone, setStatusTone] = useState<"default" | "success" | "error">("default");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const dateOptions = useMemo(() => nextDateOptions(), []);

  async function handleBooking(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);
    const payload = {
      fullName: String(formData.get("fullName") || "").trim(),
      service: String(formData.get("service") || "").trim(),
      email: String(formData.get("email") || "").trim(),
      phone: String(formData.get("phone") || "").trim(),
      appointmentDate: String(formData.get("appointmentDate") || "").trim(),
      appointmentTime: String(formData.get("appointmentTime") || "").trim(),
      notes: String(formData.get("notes") || "").trim()
    };
    const currentUser = auth?.currentUser || null;

    const nextErrors: Record<string, string> = {};

    if (payload.fullName.length < 2) {
      nextErrors.fullName = "Enter the patient's full name.";
    }

    if (!payload.service) {
      nextErrors.service = "Choose an appointment type.";
    }

    if (!emailPattern.test(payload.email)) {
      nextErrors.email = "Enter a valid email address for confirmation.";
    }

    if (payload.phone && !phonePattern.test(payload.phone)) {
      nextErrors.phone = "Enter a valid UK phone number or leave this blank.";
    }

    if (!payload.appointmentDate) {
      nextErrors.appointmentDate = "Select a preferred date.";
    }

    if (!payload.appointmentTime) {
      nextErrors.appointmentTime = "Select a preferred time.";
    }

    setErrors(nextErrors);

    if (Object.keys(nextErrors).length) {
      setStatus("Please correct the booking details before continuing.");
      setStatusTone("error");
      return;
    }

    setIsSubmitting(true);

    try {
      if (currentUser) {
        await ensurePatientRecord(currentUser);
        await mergePatientProfileDetails(currentUser, {
          fullName: payload.fullName,
          phone: payload.phone,
          email: payload.email
        });
      }

      const bookingPayload = {
        ...payload,
        userId: currentUser?.uid || "",
        patientRef: currentUser ? `patients/${currentUser.uid}` : ""
      };
      let emailSent = false;
      let appointmentLabel = `${payload.appointmentDate} ${payload.appointmentTime}`;

      try {
        const response = await fetch("/api/booking", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(bookingPayload)
        });

        const result = (await response.json()) as { error?: string; emailSent?: boolean; appointmentLabel?: string };

        if (!response.ok) {
          throw new Error(result.error || "Unable to save booking.");
        }

        emailSent = Boolean(result.emailSent);
        appointmentLabel = result.appointmentLabel || appointmentLabel;
      } catch {
        await saveBooking(bookingPayload);
      }

      setStatus(
        emailSent
          ? `Booking confirmed for ${appointmentLabel}. Confirmation emails have been sent to the patient and clinician.`
          : `Booking saved for ${appointmentLabel}. We will confirm the appointment shortly by email.`
      );
      setStatusTone("success");
      setErrors({});
      event.currentTarget.reset();
      setSelected(pricingItems[0]?.title || "");
    } catch {
      setStatus("We could not save your booking right now. Please try again in a moment or contact us by email.");
      setStatusTone("error");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="panel booking-panel" id="book">
      <div className="stack">
        <span className="eyebrow">Appointment booking</span>
        <h3>Choose your service, preferred date and time</h3>
        <p>Appointments are saved to Firebase and can send confirmations to both the patient and the clinician.</p>
        <div className="booking-slot-grid">
          {dateOptions.slice(0, 4).map((date) => (
            <div className="booking-slot-card" key={date}>
              <strong>
                {new Date(`${date}T12:00:00`).toLocaleDateString("en-GB", {
                  weekday: "short",
                  day: "numeric",
                  month: "short"
                })}
              </strong>
              <span>Home visit or online slot</span>
            </div>
          ))}
        </div>
      </div>

      <form className="booking-form" noValidate onSubmit={handleBooking}>
        <label>
          Full name
          <input name="fullName" placeholder="Patient full name" required />
          {errors.fullName ? <span className="field-error">{errors.fullName}</span> : null}
        </label>

        <label>
          Appointment type
          <select name="service" value={selected} onChange={(event) => setSelected(event.target.value)}>
            {pricingItems.map((item) => (
              <option key={item.title} value={item.title}>
                {item.title} - {formatCurrency(item.price)}
              </option>
            ))}
          </select>
          {errors.service ? <span className="field-error">{errors.service}</span> : null}
        </label>

        <label>
          Email address
          <input name="email" type="email" placeholder="patient@example.com" required />
          {errors.email ? <span className="field-error">{errors.email}</span> : null}
        </label>

        <label>
          Phone number
          <input name="phone" placeholder="07xxx xxxxxx" />
          {errors.phone ? <span className="field-error">{errors.phone}</span> : null}
        </label>

        <label>
          Preferred date
          <select name="appointmentDate" defaultValue="">
            <option value="" disabled>
              Select a date
            </option>
            {dateOptions.map((date) => (
              <option key={date} value={date}>
                {new Date(`${date}T12:00:00`).toLocaleDateString("en-GB", {
                  weekday: "long",
                  day: "numeric",
                  month: "long"
                })}
              </option>
            ))}
          </select>
          {errors.appointmentDate ? <span className="field-error">{errors.appointmentDate}</span> : null}
        </label>

        <label>
          Preferred time
          <select name="appointmentTime" defaultValue="">
            <option value="" disabled>
              Select a time
            </option>
            {timeOptions.map((time) => (
              <option key={time} value={time}>
                {time}
              </option>
            ))}
          </select>
          {errors.appointmentTime ? <span className="field-error">{errors.appointmentTime}</span> : null}
        </label>

        <label className="full-span">
          Notes
          <textarea name="notes" placeholder="Anything helpful about the condition, access or availability..." rows={4} />
        </label>

        <button className="button primary" disabled={isSubmitting} type="submit">
          {isSubmitting ? "Saving booking..." : "Confirm booking"}
        </button>

        <div className={`form-note ${statusTone === "error" ? "error" : statusTone === "success" ? "success" : ""}`}>
          <p className="muted">{status}</p>
        </div>
      </form>
    </div>
  );
}
