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

export type GuideSection = { heading: string; paragraphs: string[] };

export type Guide = {
  slug: string;
  title: string;
  seoTitle: string;
  seoDescription: string;
  /** Direct-answer paragraph shown in the callout box (40-70 words). */
  answer: string;
  sections: GuideSection[];
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
          "There is no single national price for private physiotherapy. Clinics set their own fees, so the same type of appointment can cost quite different amounts from one provider to the next.",
          "The length of the session is part of this. Providers book 30, 45 or 60 minutes, so always compare the price for the time you get as well as the headline figure.",
          "The type of appointment matters too. In the prices we checked, a first assessment costs more than a follow-up with the same provider, and whether a session is in person or online is listed separately by some providers."
        ]
      },
      {
        heading: "Typical prices at named UK providers",
        paragraphs: [
          "To give you a real picture, we checked the public price pages of four UK providers on 1 October 2026. Prices change, so treat these as a snapshot and check the provider's own page before you book.",
          "Nuffield Health in Glasgow lists in-person physiotherapy for non-members at 72 pounds for a 45-minute initial assessment and 49 pounds for a 30-minute follow-up. Complete Physio, an online service, lists 125 pounds for a 45-minute new patient appointment, with follow-ups at 95 pounds for 30 minutes.",
          "PhysioFast Online lists 65 pounds for a 45-minute video appointment, which it suggests for a first visit, and 47 pounds for 30 minutes. Ascenti lists 44 pounds for a 30-minute online session.",
          "So first appointments in this sample run from 44 pounds for a short online session to 125 pounds for a longer online one. Prices vary widely, and the sessions are not identical, so compare like with like."
        ]
      },
      {
        heading: "What is included in a PhysioOnClick session",
        paragraphs: [
          "Our first appointment is a 60-minute online assessment by video, priced at {INITIAL_PRICE}. It covers your history, a guided movement assessment, a clear explanation of what is going on, and a plan you can start straight away.",
          "Follow-up appointments last 30 minutes and cost {FOLLOW_UP_PRICE}. We use them to check progress, adjust your exercises and answer questions as you recover.",
          "After a paid session you receive an invoice. You can see every price on the [pricing page](/pricing). If you want to know how a video appointment works in practice, read [how online physiotherapy works](/how-online-physiotherapy-works).",
          "Online physiotherapy is not right for everyone. If you have back pain with weakness or numbness in both legs, numbness around your genitals or anus, changes in your bladder or bowels, or if it started after a serious accident, you need emergency in-person care. Call 999 or go to A&E. We will also tell you plainly during your assessment if you need to be examined face to face."
        ]
      },
      {
        heading: "Ways to pay less for physiotherapy",
        paragraphs: [
          "Bundles. If you expect to need several sessions, we offer 4 and 8 session bundles, which are a block of sessions booked and paid for together. Work out which option suits you by comparing them with single sessions on the [pricing page](/pricing).",
          "NHS self-referral. Access to NHS musculoskeletal physiotherapy depends on your local health board, which decides whether you can refer yourself or need a referral from a GP. NHS Greater Glasgow and Clyde, for example, lets eligible adults refer themselves. The wait can be long, though. Public Health Scotland reports that between August 2025 and March 2026, on average 52.4% of musculoskeletal patients were seen within four weeks, against a target of 90%. Many people use the NHS for some needs and a private service when they want to be seen sooner.",
          "Health insurance. Some policies pay towards physiotherapy, often with conditions such as pre-authorisation or policy limits. Cover and rules vary, so check with your insurer before you book. We cannot promise that any insurer will pay.",
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
        a: "Often, but not always. It depends on the provider. In the prices we checked, one online service charged more than an in-person clinic and another charged less. Compare the session length and what is included, not only the price."
      },
      {
        q: "Can I get physiotherapy on the NHS instead?",
        a: "It depends on your health board. Each board decides whether you can refer yourself or need a GP referral. NHS Greater Glasgow and Clyde, for example, lets eligible adults self-refer. Waiting times can be long, so some people choose private care to be seen sooner."
      },
      {
        q: "Do I need a GP referral to see a private physiotherapist?",
        a: "Many private physiotherapists, including us, accept self-referral. If you plan to claim on insurance, your insurer may have its own requirements, such as pre-authorisation, so check with them before you book."
      },
      {
        q: "Will I need more than one session?",
        a: "Many people do. A first assessment gives you an explanation of the problem and a plan, and follow-ups help you progress. How many you need depends on your problem, how long you have had it and how consistently you do the exercises."
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
    // Placeholder until Shivaliba Zala signs off docs/seo/phase-b-clinical-review.md - set to the real sign-off date before any production deploy (drives the byline, JSON-LD lastReviewed and sitemap lastModified).
    reviewedOn: "2026-10-01"
  }
];

export function getGuide(slug: string): Guide | null {
  return guides.find((g) => g.slug === slug) ?? null;
}

export function allGuideSlugs(): string[] {
  return guides.map((g) => g.slug);
}
