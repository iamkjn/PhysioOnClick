export type Service = {
  slug: string;
  title: string;
  image: string;
  summary: string;
  conditions: string[];
  approach: string[];
  /** What the first appointment covers and the rough timeline that follows it. */
  firstSession: string;
  /** What patients can realistically expect to see, and roughly when. */
  typicalOutcomes: string;
  /** Honest scope boundary — when this should be in-person or another clinician instead. */
  whenInPersonInstead: string;
  faqs: { question: string; answer: string }[];
  /**
   * Condition-hub slugs (from `lib/conditions.ts`) this service should link to
   * as "Exercises for these conditions". Optional; every slug must resolve via
   * `getCondition` in `@/lib/exercise-library`. Omit (or `[]`) when there is no
   * meaningful exercise-library overlap.
   */
  relatedConditionSlugs?: string[];
  /**
   * Slugs from `lib/online-physio-pages.ts` to list as "Online physiotherapy by
   * condition" on the service page. Optional; every slug must resolve via
   * `getOnlinePhysioPage`. Omit (or `[]`) when none are relevant.
   */
  onlinePhysioSlugs?: string[];
  /** Search-facing H1 when it should differ from `title` (which stays the short
   *  name used in cards, breadcrumbs and booking). Falls back to `title`. */
  headline?: string;
  seoTitle: string;
  seoDescription: string;
};

export function serviceImagePath(slug: string) {
  // Real photographic cover art, generated 2026-09-12 and checked into
  // public/images/service-covers/ — one PNG per service slug.
  return `/images/service-covers/service-${slug}.png`;
}

export type PricingItem = {
  id: BookServiceId;
  title: string;
  duration: string;
  price: number;
  description: string;
  mode: "In-person" | "Online" | "Package";
};

/** Stable keys for the four bookable tiers — the join between pricing,
 *  the /book flow, and the Cal.com event types in lib/cal-services.ts. */
export type BookServiceId = "initial-assessment" | "follow-up" | "bundle-4" | "bundle-8";

export type Testimonial = {
  name: string;
  location: string;
  quote: string;
  focus: string;
};

export { exercises, type Exercise } from "./exercises";

export const founder = {
  name: "Shivaliba Zala",
  credentials: [
    "HCPC Registered Physiotherapist",
    "CSP Member",
    "MSc Orthopaedic & Rehabilitation Technology - University of Dundee"
  ],
  location: "Glasgow, UK"
};

export const invoiceIssuer = {
  legalName: "Shivaliba Zala", // from founder.name
  tradingName: "PhysioOnClick",
  hcpcNumber: "PH155757",
  cspNumber: "128230",
  addressLines: ["7 Springfield Gardens", "Glasgow", "G31 4HS", "United Kingdom"],
  vatStatus: "Physiotherapy services are exempt from VAT (healthcare).",
  contactEmail: "hello@physioonclick.co.uk",
  contactPhone: "" // TODO optional
};

export const services: Service[] = [
  {
    slug: "musculoskeletal-physiotherapy",
    onlinePhysioSlugs: [
      "sciatica",
      "low-back-pain",
      "neck-pain",
      "shoulder-pain",
      "knee-pain",
      "plantar-fasciitis",
      "tennis-elbow",
      "hip-pain",
    ],
    title: "Musculoskeletal Physiotherapy",
    image: serviceImagePath("musculoskeletal-physiotherapy"),
    summary:
      "Assessment and rehabilitation for joint, tendon, spine and muscle pain with a practical, evidence-based treatment plan.",
    conditions: [
      "Back and neck pain",
      "Foot pain, including Morton's neuroma",
      "Shoulder impingement",
      "Tendon pain",
      "Persistent sports injuries",
      "Work-related strain"
    ],
    approach: [
      "Detailed functional assessment and red-flag screening",
      "Manual therapy where appropriate",
      "Graduated exercise prescription",
      "Pain education and pacing support"
    ],
    firstSession:
      "Your first appointment is a 60-minute assessment, by video anywhere in the UK or as a home visit in the Glasgow area. Expect a detailed history of how and when the pain started, a movement and functional screen (by video, simple tests you'll be talked through, like reaching, bending or single-leg balance depending on the area; at a home visit we do the screen with you at your home), and screening questions to rule out anything that needs urgent in-person or medical attention. You'll leave with a working diagnosis, a written explanation of what's driving the pain, and your first exercises to start immediately — not a wait-and-see appointment.",
    typicalOutcomes:
      "How quickly things change depends on what is causing your pain and how long you have had it. It depends on your condition; your physiotherapist will give you an estimate after your assessment. We review your progress regularly and adjust your plan at each session, rather than handing you an exercise sheet once.",
    whenInPersonInstead:
      "A video assessment isn't right for everyone. If there are red-flag symptoms (unexplained weight loss, night pain that doesn't ease, saddle numbness, progressive weakness), suspected fracture, or a condition that needs hands-on joint mobilisation as the primary treatment, you'll be told plainly at triage and pointed toward an in-person clinician or your GP rather than kept in a plan that isn't the right fit. If you're in the Glasgow area, you can choose a home visit instead of a video call.",
    faqs: [
      {
        question: "Do I need a GP referral?",
        answer: "No. You can self-refer for private physiotherapy."
      },
      {
        question: "Will I be given exercises?",
        answer: "Yes, every plan includes a tailored home exercise programme."
      },
      {
        question: "Can online assessment really diagnose back or shoulder pain?",
        answer:
          "For many muscle and joint problems that are not caused by a specific injury or a red-flag condition, a guided movement assessment by video lets us reach a working diagnosis and start a plan. If we think you need a hands-on examination or tests, we'll tell you plainly."
      },
      {
        question: "How many sessions will I need?",
        answer:
          "It depends on your condition; your physiotherapist will give you an estimate after your assessment. Between sessions you'll have exercises to do on your own, and we review the estimate with you as you go."
      }
    ],
    relatedConditionSlugs: [
      "low-back-pain",
      "sciatica",
      "neck-pain",
      "rotator-cuff-tendinopathy",
      "frozen-shoulder",
      "shoulder-impingement",
      "tennis-elbow",
      "knee-osteoarthritis",
      "patellofemoral-pain",
      "achilles-tendinopathy"
    ],
    seoTitle: "Online Physio for Back, Neck & Joint Pain | PhysioOnClick",
    seoDescription:
      "Video physiotherapy for back, neck, shoulder, knee and tendon pain with an HCPC-registered physio, UK-wide."
  },
  {
    slug: "post-surgical-rehabilitation",
    onlinePhysioSlugs: ["knee-replacement-rehab", "hip-replacement-rehab", "rotator-cuff-repair-rehab"],
    title: "Post-Surgical Rehabilitation",
    image: serviceImagePath("post-surgical-rehabilitation"),
    summary:
      "Structured rehabilitation after arthroplasty, ligament reconstruction and orthopaedic procedures.",
    conditions: [
      "Total knee replacement rehab",
      "Total hip replacement rehab",
      "ACL reconstruction",
      "Rotator cuff repair",
      "Fracture recovery"
    ],
    approach: [
      "Post-operative milestone planning",
      "Strength and range-of-motion progression",
      "Gait re-education",
      "Return-to-function coaching"
    ],
    firstSession:
      "Rehab starts once your surgical team has confirmed you have no restrictions. The first session reviews your surgeon's notes or discharge summary if you have them and confirms that clearance. You'll be guided through a safe range-of-motion and strength check over video, and leave with goals we agree together and a plan to work towards them, not just a generic exercise sheet.",
    typicalOutcomes:
      "Recovery time is set mainly by your operation and your surgical team's advice. It depends on your condition; your physiotherapist will give you an estimate after your assessment. We review your progress regularly and adjust your plan at each session, within any advice from your surgical team.",
    whenInPersonInstead:
      "Wound checks, staple/suture removal, and any complication (infection signs, excessive swelling, a fall, or a joint that isn't progressing as expected) need in-person medical review — those go straight back to your surgical team, not managed through an online rehab plan. Rehab starts once your surgical team has confirmed you have no restrictions.",
    faqs: [
      {
        question: "When should physiotherapy start after surgery?",
        answer: "Rehab starts once your surgical team has confirmed you have no restrictions. Until then, follow the exercises and advice your hospital team gave you."
      },
      {
        question: "Can online rehab work after surgery?",
        answer: "For some people, once their surgical team has confirmed they have no restrictions. We review your progress regularly and adjust your plan, and we'll tell you if you need to be seen in person instead."
      },
      {
        question: "What if I'm still on crutches or can't stand for long?",
        answer:
          "Rehab starts once your surgical team has confirmed you have no restrictions. If you still use crutches or a frame after that, sessions can be adapted to seated or supported positions, and a walking assessment isn't required to start."
      },
      {
        question: "Do you work with my surgeon or NHS physio team?",
        answer:
          "No. We're a separate private service and we don't coordinate your care with your surgical or NHS team. Keep your GP or specialist team informed about your treatment. Follow your surgeon's advice."
      }
    ],
    relatedConditionSlugs: [
      "after-knee-replacement",
      "after-hip-replacement",
      "after-acl-reconstruction",
      "acl-rehabilitation"
    ],
    seoTitle: "Online Rehab After Knee, Hip & ACL Surgery | PhysioOnClick",
    seoDescription:
      "Physio-led online rehab after knee or hip replacement, ACL reconstruction, rotator cuff repair and fractures."
  },
  {
    slug: "neurological-rehabilitation",
    onlinePhysioSlugs: ["stroke-rehabilitation", "parkinsons", "multiple-sclerosis", "functional-neurological-disorder"],
    title: "Neurological Rehabilitation",
    image: serviceImagePath("neurological-rehabilitation"),
    summary:
      "Goal-led rehabilitation for neurological conditions focused on mobility, confidence and function.",
    conditions: [
      "Stroke rehabilitation",
      "Parkinsonian movement challenges",
      "Balance difficulties",
      "Functional mobility loss",
      "Neurological deconditioning"
    ],
    approach: [
      "Task-specific mobility practice",
      "Balance and gait training",
      "Strength and endurance work",
      "Carer and family education"
    ],
    firstSession:
      "The first session establishes your current mobility, balance, and functional goals — what you want to be able to do again, whether that's walking to the shops, managing stairs, or returning to a hobby. You'll be guided through safe, seated or supported movement checks over video, and a family member or carer is welcome to join. You'll leave with a short daily practice routine and a clear review date to track change against.",
    typicalOutcomes:
      "Recovery varies a great deal by condition and stage, so we don't give a fixed timeline. It depends on your condition; your physiotherapist will give you an estimate after your assessment. We review your progress regularly and adjust your plan, and reviews focus on function you can feel (walking further, needing less support).",
    whenInPersonInstead:
      "Sudden new neurological symptoms (facial drooping, sudden weakness, slurred speech, a fall with injury) are a medical emergency, not a physiotherapy appointment — call 999 or attend A&E. Online rehab is for guided, ongoing practice once you're medically stable and any acute care has been arranged; it doesn't replace your wider medical or NHS rehab team. Before you start, your GP or specialist team must confirm it is safe for you to begin physiotherapy.",
    faqs: [
      {
        question: "Is neurological rehab suitable online?",
        answer: "For some people who are medically stable. Before you start, your GP or specialist team must confirm it is safe for you to begin physiotherapy. Triage at booking confirms whether video suits you."
      },
      {
        question: "Do you work with my other clinicians?",
        answer: "No. We're a separate private service and we don't coordinate care with your NHS or specialist team. Keep your GP or specialist team informed about your treatment."
      },
      {
        question: "Do I need clearance before starting?",
        answer:
          "Yes. Before you start, your GP or specialist team must confirm it is safe for you to begin physiotherapy. If you have MS and have a relapse, we pause sessions until your GP or MS team clears you to restart."
      },
      {
        question: "Can a family member or carer join the sessions?",
        answer:
          "Yes, and it's often genuinely useful — they can help with the physical setup and continue supported practice between sessions."
      },
      {
        question: "What conditions is this appropriate for?",
        answer:
          "Post-stroke recovery, Parkinson's-related mobility challenges, balance and falls-risk concerns, and general neurological deconditioning are all commonly supported this way — triage at booking confirms it's a good fit for your specific situation."
      },
      {
        question: "I'm in Glasgow — can I see you in person?",
        answer:
          "Yes, through home visits in the Glasgow area, at the same prices as video. Elsewhere in Scotland and the UK, appointments are by video, with no travel or parking to manage — which matters when mobility or fatigue is part of the problem. We'll confirm by email if your address is outside the area we cover for home visits, and we'll tell you at triage if another kind of neuro physiotherapy would suit you better."
      }
    ],
    headline: "Online Neurological Physiotherapy for Glasgow, Scotland & the UK",
    seoTitle: "Online Neuro Physiotherapy – Glasgow & UK | PhysioOnClick",
    seoDescription:
      "Neurological physiotherapy by video for Glasgow, Scotland and UK-wide: stroke, Parkinson's, balance and mobility."
  },
  {
    slug: "paediatric-physiotherapy",
    title: "Paediatric Physiotherapy",
    image: serviceImagePath("paediatric-physiotherapy"),
    summary:
      "Child-centred physiotherapy for movement confidence, developmental support and family-guided rehab.",
    conditions: [
      "Developmental delay",
      "Coordination challenges",
      "Mobility support",
      "Post-operative paediatric rehab (once your child's surgical team has confirmed they have no restrictions)",
      "Strength and endurance building"
    ],
    approach: [
      "Play-based movement strategies",
      "Parent coaching and home support",
      "Age-appropriate exercise plans",
      "School and activity goal setting"
    ],
    firstSession:
      "The first session is a conversation as much as an assessment — understanding your child's history, what's prompting the referral, and what a good outcome looks like for your family. Movement is assessed through play-based tasks you'll help guide over video, kept short and pitched to your child's age and attention span. You'll leave with simple, playful home activities rather than a clinical exercise list.",
    typicalOutcomes:
      "Change in paediatric physiotherapy is tracked against real-world function — new coordination or confidence in play, easier movement at school, or steady progress on a specific developmental goal — rather than a single test score. How quickly things change depends on your child's condition, and your physiotherapist will give you an estimate after the assessment. We review progress regularly and adjust activities as your child grows.",
    whenInPersonInstead:
      "Any new or worsening symptom that could indicate an urgent medical issue (sudden loss of a previously gained skill, unexplained pain, signs of injury) needs GP or A&E assessment, not an online physiotherapy appointment. Very young infants and complex multi-system conditions are often better served by an in-person paediatric specialist team — this will be discussed openly at triage before booking.",
    faqs: [
      {
        question: "Can parents attend sessions?",
        answer: "Yes, parent involvement is encouraged."
      },
      {
        question: "Do you offer online paediatric consultations?",
        answer: "Yes, where clinically appropriate."
      },
      {
        question: "What age range do you see?",
        answer:
          "School-age children and teenagers are the most common fit for online sessions; younger children can also be seen with a parent guiding the movement tasks, assessed case by case at booking."
      },
      {
        question: "Will you give us a home programme?",
        answer:
          "Yes — always framed as play and daily routine rather than a formal exercise sheet, so it's realistic to keep up between sessions."
      }
    ],
    seoTitle: "Online Paediatric Physiotherapy UK | PhysioOnClick",
    seoDescription:
      "Play-based paediatric physiotherapy by video, with parents guided through every session, UK-wide."
  },
  {
    slug: "gait-and-mobility-assessment",
    title: "Gait & Mobility Assessment",
    image: serviceImagePath("gait-and-mobility-assessment"),
    summary:
      "Movement analysis, walking assessment and rehabilitation planning for confidence and independence.",
    conditions: [
      "Walking changes after surgery (once your surgical team has confirmed you have no restrictions)",
      "Falls risk",
      "Balance confidence issues",
      "Mobility aid review",
      "Reduced walking tolerance"
    ],
    approach: [
      "Functional walking assessment",
      "Mobility strategy review",
      "Strength and balance prescription",
      "Outcome tracking"
    ],
    firstSession:
      "You'll be guided through a structured walking and mobility assessment over video — filmed from a distance that captures your full gait, plus any mobility aid you currently use. Combined with your history (recent surgery, a fall, or gradual change in confidence), this identifies exactly which part of the walking pattern needs attention, and whether the current aid or support is still right for you.",
    typicalOutcomes:
      "It depends on your condition; your physiotherapist will give you an estimate after your assessment. We review your walking, balance and confidence regularly and adjust your strength and balance plan.",
    whenInPersonInstead:
      "A recent fall with injury, sudden new weakness, or acute pain affecting walking needs urgent in-person medical assessment first. Formal falls-risk tools that require hands-on testing (or a home hazard assessment) are best done by an in-person team; a video assessment focuses on the movement and strength side, which is often the larger and most modifiable factor.",
    faqs: [
      {
        question: "Do you assess falls risk?",
        answer: "Yes, falls risk and balance are core parts of the assessment when needed."
      },
      {
        question: "Can this help after joint replacement?",
        answer: "Yes, walking practice can be part of recovery after a joint replacement. Rehab starts once your surgical team has confirmed you have no restrictions."
      },
      {
        question: "Do I need a mobility aid to be assessed?",
        answer:
          "No — this is equally useful for reviewing whether an aid you already have is still appropriate, or whether you're ready to walk with less support."
      },
      {
        question: "How is a walking assessment done over video?",
        answer:
          "You'll position your device so your full stride is visible and walk a short, safe distance indoors while being observed and guided — most homes have enough space for this."
      }
    ],
    relatedConditionSlugs: ["falls-prevention"],
    seoTitle: "Online Gait & Mobility Assessment | PhysioOnClick",
    seoDescription:
      "Video walking, balance and falls-risk assessment to rebuild confidence, function and independence."
  },
  {
    slug: "online-rehab-programmes",
    onlinePhysioSlugs: ["low-back-pain", "neck-pain", "knee-pain", "shoulder-pain"],
    title: "Online Rehab Programmes",
    image: serviceImagePath("online-rehab-programmes"),
    summary:
      "UK-wide digital physiotherapy support with review calls, progress tracking and guided exercise plans.",
    conditions: [
      "Remote recovery support",
      "Self-management planning",
      "Exercise progression",
      "Return-to-work guidance",
      "Long-term rehab follow-up"
    ],
    approach: [
      "Video consultation and personalised plan",
      "Structured weekly exercise progression",
      "Pain and mobility tracking",
      "Secure document sharing"
    ],
    firstSession:
      "This is the general entry point if you're not sure which specific service fits — the first video call assesses your situation, confirms it's appropriate for remote care, and sets up secure document sharing so exercise videos, progress notes and any reports are all in one place between sessions. If your situation is better matched to one of the specific services above, you'll be pointed there instead.",
    typicalOutcomes:
      "Structured online rehab works best as an ongoing loop: a weekly or fortnightly review call adjusts the plan based on what's improved and what hasn't, rather than a static exercise sheet you're left to interpret alone. We review your progress regularly and adjust your plan, with the review cadence stepping down as independence increases.",
    whenInPersonInstead:
      "If triage identifies red-flag symptoms, a condition needing hands-on treatment as the primary intervention, or a situation better served by one of the specific services above (post-surgical, neurological, paediatric), you'll be redirected there or to an in-person clinician rather than kept in a general programme that isn't the right fit.",
    faqs: [
      {
        question: "Is online physio effective?",
        answer: "It depends on your condition. A video assessment lets us check whether remote care suits you, and we'll tell you if you need to be seen in person."
      },
      {
        question: "Do I still get exercises and progress reviews?",
        answer: "Yes, online patients receive the same structured rehabilitation planning."
      },
      {
        question: "How often are review calls?",
        answer:
          "Typically weekly or fortnightly to start, spacing out as your independence and confidence build — the schedule is agreed with you rather than fixed in advance."
      },
      {
        question: "What if my situation turns out to need something more specific?",
        answer:
          "That's exactly what the first call establishes — if you're a better fit for one of the specific services (post-surgical, neurological, paediatric, gait), you'll be moved there at no extra cost."
      }
    ],
    relatedConditionSlugs: [
      "low-back-pain",
      "neck-pain",
      "rotator-cuff-tendinopathy",
      "knee-osteoarthritis",
      "gluteal-tendinopathy",
      "achilles-tendinopathy"
    ],
    seoTitle: "Online Rehab Programmes & Exercise Plans | PhysioOnClick",
    seoDescription:
      "Structured online rehab with weekly physio reviews, progress tracking and guided exercise plans, UK-wide."
  }
];

export const pricing: PricingItem[] = [
  {
    id: "initial-assessment",
    title: "Initial Online Assessment",
    duration: "60 min",
    price: 40,
    description: "Assessment by video or home visit (Glasgow area) with tailored advice and exercise planning.",
    mode: "Online"
  },
  {
    id: "follow-up",
    title: "Online Follow-Up",
    duration: "30 min",
    price: 30,
    description: "Ongoing progression and accountability support, by video or home visit (Glasgow area).",
    mode: "Online"
  },
  {
    id: "bundle-4",
    title: "4 Session Bundle",
    duration: "Flexible",
    price: 120,
    description: "Cost-effective package for structured rehabilitation.",
    mode: "Package"
  },
  {
    id: "bundle-8",
    title: "8 Session Bundle",
    duration: "Flexible",
    price: 225,
    description: "Longer-term rehabilitation plan with review milestones.",
    mode: "Package"
  }
];

/** Price of the first appointment — what a new patient actually pays, so it's
 *  the figure quoted in page titles and descriptions (not the cheaper follow-up). */
export const initialAssessmentPrice =
  pricing.find((item) => item.id === "initial-assessment")?.price ?? 0;

export const followUpPrice = pricing.find((item) => item.id === "follow-up")?.price ?? 0;

/** Swap {INITIAL_PRICE}/{FOLLOW_UP_PRICE} tokens in static copy for live prices,
 *  so content data never hardcodes a price that the owner later changes. */
export function withPrices(text: string): string {
  return text
    .replaceAll("{INITIAL_PRICE}", `£${initialAssessmentPrice}`)
    .replaceAll("{FOLLOW_UP_PRICE}", `£${followUpPrice}`);
}

/** Sessions in a package, read from its title ("4 Session Bundle" -> 4). */
export function bundleSessionCount(item: PricingItem): number {
  return Number(item.title.match(/\d+/)?.[0] ?? 0);
}

/** What the same sessions cost booked one at a time. A bundle's first session
 *  is the 60-min initial assessment (see lib/cal-services.ts), the rest are
 *  follow-ups — so a bundle only "saves" if it beats this figure. */
export function payAsYouGoPrice(sessionCount: number): number {
  if (sessionCount <= 0) return 0;
  return initialAssessmentPrice + (sessionCount - 1) * followUpPrice;
}

// Deliberately empty: only genuine, verifiable patient reviews may appear on the
// site (fake/placeholder reviews are unlawful under the DMCC Act 2024). Real
// reviews come from Trustpilot via components/trustpilot-reviews.tsx.
export const testimonials: Testimonial[] = [];

export const stats = [
  { label: "Years of clinical experience", value: "6+" },
  { label: "Services across Glasgow and online", value: "6" },
  { label: "Guided blog resources available", value: "100+" },
  { label: "Response time for enquiries", value: "24h" }
];
