import type { Metadata } from "next";

import { CalEmbed } from "@/components/cal-embed";

export const metadata: Metadata = {
  title: "Book an Appointment | PhysioOnClick",
  description:
    "Book your physiotherapy appointment online. Choose from initial assessments, follow-ups, and online consultations with a Glasgow HCPC-registered physiotherapist."
};

export default function BookPage() {
  return (
    <div className="site-shell">
      <section className="simple-page-hero">
        <span>Book online</span>
        <h1>Book your <span>appointment</span></h1>
        <p>Choose a service and a time that works for you. Your confirmation is sent instantly by email.</p>
      </section>
      <section className="page-section" style={{ paddingTop: "1rem" }}>
        <CalEmbed />
      </section>
    </div>
  );
}
