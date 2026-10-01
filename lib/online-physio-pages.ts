// "Online physiotherapy for [condition]" landing pages (SEO Phase B). Static
// data, rendered by app/online-physiotherapy-for/[slug].
//
// CLINICAL REVIEW GATE: this copy is drafted pending Shivaliba Zala's clinical
// sign-off and must not reach production before she approves
// docs/seo/phase-b-clinical-review.md. Dev site only until then.
//
// Rules for copy here (enforced by tests/lib/online-physio-pages.test.ts):
//  - Facts and citation URLs come only from docs/seo/phase-b-sources.md.
//  - Our own prices use the tokens {INITIAL_PRICE} / {FOLLOW_UP_PRICE}; the
//    page swaps them via withPrices(). Never write a pound amount here.
//  - Inline links use [label](/path) and must be site-relative.

import type { Source } from "@/lib/content-types";

export type OnlinePhysioPage = {
  slug: string;
  name: string;
  h1: string;
  seoTitle: string;
  seoDescription: string;
  /** Direct answer shown in the callout box (40-70 words). */
  answer: string;
  howOnlineWorks: string[];
  assessmentChecks: string[];
  typicalPlan: string[];
  timeline: string;
  inPersonInstead: string[];
  faqs: { q: string; a: string }[];
  sources: Source[];
  exerciseHubSlug?: string;
  selfTestSlugs?: string[];
  blogSlugs?: string[];
  guideSlugs?: string[];
  serviceSlug: string;
  reviewedOn: string;
};

export const onlinePhysioPages: OnlinePhysioPage[] = [
  {
    slug: "sciatica",
    name: "Sciatica",
    h1: "Online physiotherapy for sciatica",
    seoTitle: "Online Physiotherapy for Sciatica | PhysioOnClick",
    seoDescription:
      "Can sciatica be treated online? How a video physio assessment works for leg pain from the back, what the plan involves, and when to be seen in person.",
    answer:
      "If your symptoms fit, a video assessment is a reasonable first step. Your physiotherapist asks about your symptoms, watches you move and checks for signs of nerve irritation, then builds a plan you do at home. It is not suitable if you have red flag symptoms, such as weakness or numbness in both legs or bladder or bowel changes. Those need emergency care in person.",
    howOnlineWorks: [
      "Sciatica is pain that travels from the back or buttock down the leg. In our assessments, much of the work is a careful conversation plus watching how you move, and both of those can be done over video. You describe where the pain goes, what sets it off and what eases it, and your physiotherapist can see how you bend, walk, sit and stand in your own space.",
      "You also get to try things in the setting where your symptoms actually happen. If sitting at your desk or driving is the problem, we can look at your chair, your posture and the positions that settle things, rather than working it out in a clinic room that looks nothing like your day.",
      "Between sessions the plan is yours to carry out. Our approach is to keep you moving and doing your normal activities as far as your symptoms allow, with a small set of exercises that you can repeat at home. NICE guidance on low back pain and sciatica encourages people to carry on with normal activities, and lists exercise among its recommended non-invasive options.",
      "There are limits, and we will be open about them. We cannot touch your back or leg by video. NICE says manual therapy should only be used as part of a package that includes exercise, so in our plans exercise and advice are the core of the treatment rather than an add-on. If we think you need hands-on examination, tests or a doctor's opinion, we will tell you so plainly.",
    ],
    assessmentChecks: [
      "Where the pain travels, whether it goes below the knee, and how the leg pain compares with the back pain.",
      "Pins and needles, numbness or burning in the leg or foot, and whether they are staying the same, spreading or getting better.",
      "How you walk, stand up from a chair, rise onto your toes and your heels, and squat a little, to see whether the leg is working normally.",
      "Which positions and movements make the symptoms worse or ease them, such as sitting, bending forward, coughing or lying down.",
      "Gentle self-checks for nerve sensitivity, including the [slump self-check](/exercises/tests/slump-self-check) and the [straight leg raise self-check](/exercises/tests/straight-leg-raise-self-check), if it is safe for you to try them.",
      "The red flag symptoms listed below, which we ask about at the start of every assessment, because they change what the right next step is.",
    ],
    typicalPlan: [
      "A first plan usually has three parts: advice on staying active and finding positions that settle the leg, a few gentle movements aimed at calming nerve sensitivity, and strengthening for the back, hips and legs that you build up over time. We adjust it at each follow-up depending on what your symptoms are doing.",
      "Our plans for back pain and sciatica commonly run 4 to 8 sessions across 6 to 10 weeks. The first is a 60-minute video assessment at {INITIAL_PRICE}, and follow-ups are 30 minutes at {FOLLOW_UP_PRICE}. That is a guide only. Some people need fewer sessions and some need more, and we review it with you rather than booking a block in advance.",
      "NICE advises that imaging is not routinely offered in a non-specialist setting for low back pain with or without sciatica, so we do not need a scan to begin a plan. If your symptoms change in a way that suggests you need one, or tests, we will explain that and suggest you speak to your GP.",
      "We will also talk about the things around the pain, such as sleep, work set-up, driving and how to build walking back up. For a longer look at how many appointments to expect, see our guide on [how many physiotherapy sessions you may need](/guides/how-many-physiotherapy-sessions-do-i-need).",
    ],
    timeline:
      "According to the NHS, sciatica often eases within weeks, though for some people recovery runs into a few months, and it advises carrying on with your normal activities where you can. If your symptoms are not settling, or they are getting worse, tell us or ask your GP rather than waiting.",
    inPersonInstead: [
      "Go to A&E or call 999 if you have sciatica on both sides, or pain, tingling, weakness or numbness in both legs, especially if it is severe or getting worse.",
      "Go to A&E or call 999 if you have numbness or loss of feeling around or under your genitals, or around your anus or bottom.",
      "Go to A&E or call 999 if you find it hard to start peeing, cannot pee, or cannot control when you pee.",
      "Go to A&E or call 999 if you cannot control your bowels or do not notice when you poo, and this is not normal for you.",
      "Go to A&E or call 999 if your back pain started after a serious accident, or you have back pain with chest pain or changes in sexual feeling or function.",
      "Do not drive yourself to A&E for any of the above. Ask someone to drive you, or call 999.",
      "Get in-person medical care straight away if weakness in one leg is getting worse.",
    ],
    faqs: [
      {
        q: "Can sciatica be treated online?",
        a: "A video assessment lets us ask about your symptoms and watch you move, and in our plans the treatment is mainly advice and exercise you do at home. We will tell you if you need to be seen in person. We cannot examine you hands-on, and red flag symptoms need emergency care in person. We screen for those at the start of your assessment.",
      },
      {
        q: "Do I need a scan before I book?",
        a: "No. NICE advises that imaging is not routinely offered in a non-specialist setting for low back pain with or without sciatica, and a scan is not needed to start an assessment with us. If we think you need further tests, we will say so and suggest you speak to your GP.",
      },
      {
        q: "Should I rest until the pain goes?",
        a: "NICE guidance encourages people with low back pain and sciatica to continue with their normal activities, and the NHS also advises carrying on where you can. We help you work out how much to do and which positions to avoid for now, so you stay active without pushing into flare-ups.",
      },
      {
        q: "What if my leg is numb or weak?",
        a: "Tell us at booking and at the start of the session. Numbness or weakness in both legs, numbness around your genitals or bottom, or bladder or bowel changes need A&E or a 999 call, not a video appointment. Weakness that is getting worse in one leg also needs in-person medical care straight away.",
      },
      {
        q: "Is online physio as effective as seeing someone in person?",
        a: "We cannot promise that for sciatica. What we can say is that a video assessment covers your history, movement and an exercise plan, and that we will tell you if you need to be seen in person.",
      },
    ],
    sources: [
      {
        label: "NICE NG59: Low back pain and sciatica in over 16s, recommendations",
        url: "https://www.nice.org.uk/guidance/ng59/chapter/Recommendations",
      },
      { label: "NHS: Sciatica", url: "https://www.nhs.uk/conditions/sciatica/" },
      { label: "NHS: Back pain", url: "https://www.nhs.uk/conditions/back-pain/" },
    ],
    exerciseHubSlug: "sciatica",
    selfTestSlugs: ["slump-self-check", "straight-leg-raise-self-check"],
    blogSlugs: [
      "nerve-related-symptoms-and-sciatica-a-uk-physiotherapy-guide-13",
      "recovery-planning-a-physiotherapist-s-approach-to-sciatica-16",
    ],
    guideSlugs: [
      "does-online-physiotherapy-work",
      "how-many-physiotherapy-sessions-do-i-need",
    ],
    serviceSlug: "musculoskeletal-physiotherapy",
    // Placeholder until Shivaliba Zala signs off docs/seo/phase-b-clinical-review.md - set to the real sign-off date before any production deploy (drives the byline, JSON-LD lastReviewed and sitemap lastModified).
    reviewedOn: "2026-10-01",
  },
];

export function getOnlinePhysioPage(slug: string): OnlinePhysioPage | null {
  return onlinePhysioPages.find((p) => p.slug === slug) ?? null;
}

export function allOnlinePhysioSlugs(): string[] {
  return onlinePhysioPages.map((p) => p.slug);
}
