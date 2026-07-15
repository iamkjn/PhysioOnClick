import type { Metadata } from "next";

import { BookingFlow } from "@/components/booking-flow";

export const metadata: Metadata = {
  title: "Book an Appointment | PhysioOnClick",
  description:
    "Book your physiotherapy appointment online. Choose from initial assessments, follow-ups, and online consultations with a Glasgow HCPC-registered physiotherapist."
};

export default function BookPage() {
  return (
    <div className="site-shell">
      {/* No page hero: the flow's left rail carries the title, and the site
          header already sits above it. */}
      <section className="page-section">
        <BookingFlow />
      </section>
    </div>
  );
}
