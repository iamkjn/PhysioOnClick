import type { Metadata } from "next";

import { BookingForm } from "@/components/booking-form";

export const metadata: Metadata = {
  title: "Book an Appointment | PhysioOnClick",
  description:
    "Book your physiotherapy appointment online. Choose from initial assessments, follow-ups, and online consultations with a Glasgow HCPC-registered physiotherapist."
};

export default async function BookPage({
  searchParams,
}: {
  searchParams: Promise<{ service?: string }>;
}) {
  const { service } = await searchParams;

  return (
    <div className="site-shell">
      <section className="simple-page-hero">
        <span>Book online</span>
        <h1>Book your <span>appointment</span></h1>
        <p>Choose a service and a time that works for you. We&apos;ll confirm by email within a few hours.</p>
      </section>
      <section className="page-section" style={{ paddingTop: "1rem" }}>
        <BookingForm initialService={service ?? ""} />
      </section>
    </div>
  );
}
