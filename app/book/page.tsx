import type { Metadata } from "next";

import { BookingForm } from "@/components/booking-form";

export const metadata: Metadata = {
  title: "Book an Appointment | PhysioOnClick",
  description:
    "Book your physiotherapy appointment online. Choose from initial assessments, follow-ups, and online consultations with a Glasgow HCPC-registered physiotherapist."
};

export default function BookPage() {
  return (
    <div className="site-shell">
      <section className="page-hero">
        <div className="stack">
          <span className="eyebrow">Book online</span>
          <h1>Book your appointment</h1>
          <p className="lead">
            Choose a service and a time that works for you. Your confirmation is sent instantly by email.
          </p>
        </div>
      </section>
      <section className="page-section">
        <BookingForm />
      </section>
    </div>
  );
}
