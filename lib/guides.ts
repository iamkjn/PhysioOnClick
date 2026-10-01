// Editorial guides (SEO Phase B). Static data, rendered by app/guides/[slug].
//
// CLINICAL REVIEW GATE: this copy is drafted pending Shivaliba Zala's clinical
// sign-off and must not reach production before she approves
// docs/seo/phase-b-clinical-review.md. Dev site only until then.
//
// Rules for copy here (enforced by tests/lib/guides.test.ts):
//  - Facts and citation URLs come only from docs/seo/phase-b-sources.md.
//  - Our own prices use the tokens {INITIAL_PRICE} / {FOLLOW_UP_PRICE}; the
//    page swaps them via withPrices(). Market prices are written in words.
//  - Inline links use [label](/path) and must be site-relative.

import type { RelatedLink, Source } from "@/lib/content-types";

export type Guide = {
  slug: string;
  title: string;
  seoTitle: string;
  seoDescription: string;
  /** Direct-answer paragraph shown in the callout box (40-70 words). */
  answer: string;
  sections: { heading: string; paragraphs: string[] }[];
  faqs: { q: string; a: string }[];
  sources: Source[];
  related: RelatedLink[];
  publishedOn: string;
  reviewedOn: string;
};

export const guides: Guide[] = [
  {
    slug: "private-physiotherapy-cost-uk",
    title: "How much does private physiotherapy cost in the UK?",
    seoTitle: "How Much Does Private Physio Cost in the UK? | PhysioOnClick",
    seoDescription:
      "What a private physio session costs in the UK, what changes the price, how online sessions compare, and ways to pay less, with sources and dates checked.",
    answer:
      "Most UK private physiotherapy appointments cost between about 44 and 125 pounds for a first session, depending on where you go, how long it lasts and whether it is in person or online. At PhysioOnClick, a 60-minute online assessment is {INITIAL_PRICE} and a 30-minute follow-up is {FOLLOW_UP_PRICE}.",
    sections: [
      {
        heading: "What changes the price of a physio session",
        paragraphs: [
          "There is no single national price for private physiotherapy. Clinics set their own fees, so two sessions in the same city can cost quite different amounts. A few things explain most of the gap.",
          "Location matters. A clinic with a city centre address and a gym or hospital attached has higher running costs than a small practice or an online service, and that shows up in the fee.",
          "Session length matters too. A first appointment is usually longer than a follow-up because the physiotherapist takes your history, examines you and agrees a plan. Some providers book 30 minutes, some 45 and some 60, so always compare the price per minute as well as the headline figure.",
          "The type of appointment matters. Initial assessments cost more than follow-ups. Seniority and specialism can add to the price as well, for example a clinician who focuses on neurological or sports conditions.",
          "Finally, online and in-person sessions are priced differently. An online session saves the clinic room and the travel for you, which is why online fees are often lower, although not always."
        ]
      },
      {
        heading: "Typical prices at named UK providers",
        paragraphs: [
          "To give you a real picture, we checked the public price pages of four UK providers on 1 October 2026. Prices change, so treat these as a snapshot and check the provider's own page before you book.",
          "Nuffield Health in Glasgow lists in-person physiotherapy for non-members at 72 pounds for a 45-minute initial assessment and 49 pounds for a 30-minute follow-up. Complete Physio, an online service, lists 125 pounds for a 45-minute new patient appointment, with follow-ups at 95 pounds for 30 minutes.",
          "PhysioFast Online lists 65 pounds for a 45-minute video appointment, which it suggests for a first visit, and 47 pounds for 30 minutes. Ascenti lists 44 pounds for a 30-minute online session.",
          "So first appointments in this sample run from 44 pounds for a short online session to 125 pounds for a longer online one. The sessions are not identical, so the cheapest price is not always the like-for-like match for what you need."
        ]
      },
      {
        heading: "What is included in a PhysioOnClick session",
        paragraphs: [
          "Our first appointment is a 60-minute online assessment by video, priced at {INITIAL_PRICE}. It covers your history, a guided movement assessment, a clear explanation of what is going on, and a plan you can start straight away.",
          "Follow-up appointments last 30 minutes and cost {FOLLOW_UP_PRICE}. We use them to check progress, adjust your exercises and answer questions as you recover.",
          "After a paid session you receive an invoice. You can see every price, including our session bundles, on the [pricing page](/pricing). If you want to know how a video appointment works in practice, read [how online physiotherapy works](/how-online-physiotherapy-works).",
          "Online physiotherapy is not right for everyone. If you have a sudden loss of strength, numbness around the groin or back passage, new bladder or bowel changes, or a serious injury, you need urgent in-person care. Call 999 for an emergency or 111 for advice. We will also tell you plainly during your assessment if you need to be examined face to face."
        ]
      },
      {
        heading: "Ways to pay less for physiotherapy",
        paragraphs: [
          "Bundles. Booking a block of sessions usually lowers the cost of each one. We offer 4 and 8 session bundles, which are listed on the [pricing page](/pricing).",
          "NHS self-referral. In many parts of Scotland you can ask the NHS for musculoskeletal physiotherapy. Each health board decides whether you can refer yourself or need a GP referral. NHS Greater Glasgow and Clyde, for example, lets adults refer themselves if they meet its criteria. The wait can be long, though. Public Health Scotland reports that between August 2025 and March 2026, on average 52.4% of musculoskeletal patients were seen within four weeks, against a target of 90%. Many people use the NHS for some needs and a private service when they want to be seen sooner.",
          "Health insurance. Some policies pay towards physiotherapy, often with conditions such as a GP referral or an annual limit. Policies differ a lot, so check your own policy wording and ask your insurer before you book. Our [pricing page](/pricing) explains how we invoice, but we cannot promise that any insurer will pay.",
          "Doing the exercises matters as much as the number of sessions. A clear plan that you follow between appointments often means you need fewer visits overall."
        ]
      }
    ],
    faqs: [
      {
        q: "How much is a physio session in the UK?",
        a: "A typical private first appointment costs between about 44 and 125 pounds, based on the four providers we checked on 1 October 2026. Follow-ups are usually cheaper. Our own online assessment is {INITIAL_PRICE} and a follow-up is {FOLLOW_UP_PRICE}."
      },
      {
        q: "Is online physiotherapy cheaper than seeing a physio in person?",
        a: "Often, but not always. Online sessions save clinic overheads, so many are cheaper, yet some online services charge more than an in-person clinic. Compare the session length and what is included, not only the price."
      },
      {
        q: "Can I get physiotherapy on the NHS instead?",
        a: "Often yes. In many parts of Scotland you can ask for NHS musculoskeletal physiotherapy, sometimes without seeing a GP first. Each health board sets its own rules, and waiting times can be long, so some people choose private care to be seen sooner."
      },
      {
        q: "Do I need a GP referral to see a private physiotherapist?",
        a: "Usually not. You can book a private physiotherapist directly. Some insurance policies do ask for a GP referral before they will pay, so check your policy first."
      },
      {
        q: "Will I need more than one session?",
        a: "Many people do. A first assessment gives you a diagnosis and a plan, and follow-ups help you progress. How many you need depends on your problem, how long you have had it and how consistently you do the exercises."
      }
    ],
    sources: [
      {
        label: "Nuffield Health: Glasgow physiotherapy prices",
        url: "https://www.nuffieldhealth.com/physiotherapy/glasgow"
      },
      {
        label: "Complete Physio: online physiotherapy fees",
        url: "https://complete-physio.co.uk/online-physiotherapy/"
      },
      {
        label: "PhysioFast Online: appointment prices",
        url: "https://physiofastonline.co.uk/"
      },
      {
        label: "Ascenti: online appointments",
        url: "https://www.ascenti.co.uk/article/online-appointments"
      },
      {
        label: "Public Health Scotland: AHP musculoskeletal waiting times, data to 31 March 2026",
        url: "https://www.publichealthscotland.scot/publications/allied-health-professionals-musculoskeletal-waiting-times-in-nhs-scotland/allied-health-professionals-musculoskeletal-waiting-times-in-nhs-scotland-quarterly-and-monthly-data-to-31-march-2026/"
      },
      {
        label: "NHS inform: how to access MSK services",
        url: "https://www.nhsinform.scot/illnesses-and-conditions/muscle-bone-and-joints/how-to-access-msk-services/"
      },
      {
        label: "NHS Greater Glasgow and Clyde: self referral to adult MSK physiotherapy",
        url: "https://www.nhsggc.scot/hospitals-services/services-a-to-z/musculoskeletal-msk-physiotherapy/self-referral-to-adult-msk-physiotherapy/"
      }
    ],
    related: [
      { label: "Pricing and session bundles", href: "/pricing" },
      { label: "How online physiotherapy works", href: "/how-online-physiotherapy-works" }
    ],
    publishedOn: "2026-10-01",
    reviewedOn: "2026-10-01"
  }
];

export function getGuide(slug: string): Guide | null {
  return guides.find((g) => g.slug === slug) ?? null;
}

export function allGuideSlugs(): string[] {
  return guides.map((g) => g.slug);
}
