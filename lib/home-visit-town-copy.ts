// Derived copy for the town home-visit pages (app/physiotherapy-home-visits/[town]).
// Kept out of the page file because Next only allows its own exports there.
// Prices and hours come from their single sources, so a price change reaches
// every town page, title and FAQ answer at once.

import { APPOINTMENT_HOURS_SENTENCE, HOME_VISIT_NOTICE_SENTENCE } from "@/lib/appointment-hours";
import { homeVisitPrices } from "@/lib/home-visit-pricing";
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
  const long = `Home Physiotherapy ${titleName(town)}: ${homeVisitPrices.initial} Home Visits | PhysioOnClick`;
  return long.length <= 65 ? long : `Home Physio ${titleName(town)}: ${homeVisitPrices.initial} Visits | PhysioOnClick`;
}

/** Meta description, kept within 160 characters (shorter lead-in for long names). */
export function townSeoDescription(town: HomeVisitTown): string {
  const tail = `${homeVisitPrices.initial} assessment, ${homeVisitPrices.followUp} follow-ups, no travel charge.`;
  const long = `Home physiotherapy in ${titleName(town)} from a Glasgow-based HCPC registered physio, on evenings and weekends. ${tail}`;
  return long.length <= 160
    ? long
    : `Home physio in ${titleName(town)}: a Glasgow-based HCPC registered physio, evenings and weekends. ${tail}`;
}

export function townFaqs(town: HomeVisitTown) {
  return [
    {
      question: `Is there a travel charge for ${town.name}?`,
      answer: `No. A home visit in ${town.name} is one all-in price: ${homeVisitPrices.initial} for the initial assessment and ${homeVisitPrices.followUp} for a follow-up, the same as anywhere else we cover, with nothing added at checkout.`,
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
