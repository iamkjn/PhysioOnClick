// Derived copy for the town home-visit pages (app/physiotherapy-home-visits/[town]).
// Kept out of the page file because Next only allows its own exports there.
// Prices and hours come from their single sources, so a price change reaches
// every town page, title and FAQ answer at once.

import { APPOINTMENT_HOURS_SENTENCE, HOME_VISIT_NOTICE_SENTENCE } from "@/lib/appointment-hours";
import { HOME_VISIT_PRICE_NOTE, homeVisitPriceRange, PAYMENT_METHODS_NOTE } from "@/lib/home-visit-pricing";
import type { HomeVisitTown } from "@/lib/home-visit-towns";

// Clinical sign-off wording (rounds 1-2, 2026-10-03/04), kept word for word.
export const NEURO_CLEARANCE =
  "For neurological rehabilitation, your GP or specialist team must confirm it is safe for you to begin physiotherapy before you start.";
export const POSTOP_READINESS =
  "After an operation, rehab with us starts once your surgical team has said you are ready for outpatient or community physiotherapy, and we follow any restrictions or precautions they give you.";

function titleName(town: HomeVisitTown): string {
  return town.shortName ?? town.name;
}

/** <title>, kept within 65 characters (falls back to a shorter pattern). */
export function townSeoTitle(town: HomeVisitTown): string {
  const long = `Home Physiotherapy ${titleName(town)}: Home Visits | PhysioOnClick`;
  return long.length <= 65 ? long : `Home Physio ${titleName(town)}: Visits | PhysioOnClick`;
}

/** Meta description, kept within 160 characters (shorter lead-in for long names). */
export function townSeoDescription(town: HomeVisitTown): string {
  const tail = "Cash accepted, no GP referral.";
  const long = `Home physiotherapy in ${titleName(town)} from a Glasgow-based HCPC registered physio, 7 days 9am–9pm. ${tail}`;
  return long.length <= 160
    ? long
    : `Home physio in ${titleName(town)}: a Glasgow-based HCPC registered physio, 7 days 9am–9pm. ${tail}`;
}

export function townFaqs(town: HomeVisitTown) {
  const price = homeVisitPriceRange(town.districts);
  return [
    {
      question: `How much is a home visit in ${town.name}?`,
      answer: `A home visit in ${town.name} is ${price.initial} for the initial assessment and ${price.followUp} for a follow-up. ${HOME_VISIT_PRICE_NOTE} ${PAYMENT_METHODS_NOTE}`,
    },
    {
      question: `When can you visit in ${town.name}?`,
      answer: `${APPOINTMENT_HOURS_SENTENCE} ${HOME_VISIT_NOTICE_SENTENCE} The booking page shows every free time.`,
    },
    ...town.faqs,
    {
      question: "Will I see the same physiotherapist each time?",
      answer:
        "Yes. Follow-ups are with the same physiotherapist, by home visit or video, so you don't have to explain your history to someone new at every appointment.",
    },
    {
      question: "Do I need a GP referral?",
      answer: `No, you can book directly. ${NEURO_CLEARANCE} ${POSTOP_READINESS}`,
    },
  ];
}
