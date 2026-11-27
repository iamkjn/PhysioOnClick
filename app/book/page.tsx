import type { Metadata } from "next";

import Link from "next/link";

import { BookingFlow } from "@/components/booking-flow";
import { BookingRequest } from "@/components/booking-request";

export const metadata: Metadata = {
  alternates: { canonical: "/book" },
  title: "Book an Appointment | PhysioOnClick",
  description:
    "Request a physiotherapy home visit in Glasgow or a video appointment and pay after your session, or book and pay online."
};

type Search = Record<string, string | string[] | undefined>;

/**
 * New patients get the no-payment request. The pay-online flow stays for
 * people who ask for it, follow-ups, and unfinished or
 * cancelled online bookings.
 */
function wantsOnlinePayment(search: Search): boolean {
  const service = search.service;
  return (
    search.pay === "online" ||
    search.resume !== undefined ||
    search.cancelled !== undefined ||
    (typeof service === "string" && service !== "initial-assessment")
  );
}

export default async function BookPage({ searchParams }: { searchParams: Promise<Search> }) {
  const online = wantsOnlinePayment(await searchParams);
  return (
    <div className="site-shell">
      <section className="page-section">
        {online ? (
          // No page hero: the flow's left rail carries the title.
          <>
            <p className="book-callback-note">
              Rather not pay yet? <Link href="/book">Send a booking request</Link> and we&rsquo;ll call to confirm.
            </p>
            <BookingFlow />
          </>
        ) : (
          <>
            <BookingRequest source="book_page" />
            <p className="request-below">
              <span>
                Follow-up, or happy to pay now? <Link href="/book?pay=online">Book and pay online</Link>.
              </span>
            </p>
          </>
        )}
      </section>
    </div>
  );
}
