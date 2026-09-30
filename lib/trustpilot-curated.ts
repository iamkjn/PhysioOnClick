// lib/trustpilot-curated.ts
// Hand-picked Trustpilot reviews shown on the site while the Trustpilot
// Business API (a paid plan) is not configured. Every entry must be a
// genuine review from a real patient, confirmed by the owner, who has agreed
// to it appearing here. Never add reviews from staff, family or friends, and
// never paraphrase: text is an exact excerpt of what the patient posted, with
// "…" marking omissions. Excerpts keep to the patient's experience of care
// rather than treatment-outcome claims (CAP Code 12.1).
//
// Deliberately no Review/AggregateRating structured data: Google treats
// reviews a business shows about itself as self-serving and ignores them.

import type { TrustpilotReview } from "@/lib/trustpilot";

export const TRUSTPILOT_PROFILE_URL = "https://uk.trustpilot.com/review/physioonclick.co.uk";

export const curatedTrustpilotReviews: TrustpilotReview[] = [
  {
    id: "curated-seena-rachel-george",
    stars: 5,
    title: "Excellent Care…",
    text:
      "I had just two physiotherapy sessions for my Morton's neuroma… Shiva, my physiotherapist was kind, professional, and took the time to understand my symptoms. She explained everything clearly, gave me practical advice, and made me feel confident throughout the treatment.",
    createdAt: "2026-09-29T00:00:00Z",
    author: "Seena Rachel George",
  },
  {
    id: "curated-anish-thomas",
    stars: 5,
    title: "Excellent service. Highly recommended.",
    text:
      "I had a great experience with my physiotherapist. She was professional, friendly, and took the time to understand my condition… She explained everything clearly and made me feel comfortable throughout the process. I highly recommend her to anyone looking for excellent physiotherapy care.",
    createdAt: "2026-09-28T00:00:00Z",
    author: "Anish Thomas",
  },
  {
    id: "curated-hemal-patel",
    stars: 5,
    title: "What an excellent treatment",
    text:
      "What an excellent treatment by the Physiotherapist. She took enough time to understand the case… Must recommend for anyone in need.",
    createdAt: "2026-09-25T00:00:00Z",
    author: "Hemal Patel",
  },
];
