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
  seoTitle: string;
  seoDescription: string;
};

export function serviceImagePath(slug: string) {
  // v3: each service now gets its own icon composition instead of a
  // recolored template. The route serves immutable/1y cache headers, so a
  // redesign must bump this to bust caches.
  return `/service-images/${slug}?v=3`;
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
    title: "Musculoskeletal Physiotherapy",
    image: serviceImagePath("musculoskeletal-physiotherapy"),
    summary:
      "Assessment and rehabilitation for joint, tendon, spine and muscle pain with a practical, evidence-based treatment plan.",
    conditions: [
      "Back and neck pain",
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
      "Your first appointment is a 60-minute video assessment. Expect a detailed history of how and when the pain started, a movement and functional screen guided over video (simple tests you'll be talked through, like reaching, bending or single-leg balance depending on the area), and screening questions to rule out anything that needs urgent in-person or medical attention. You'll leave with a working diagnosis, a written explanation of what's driving the pain, and your first exercises to start immediately — not a wait-and-see appointment.",
    typicalOutcomes:
      "Most mechanical back, neck, shoulder and tendon pain starts responding within 2-3 weekly sessions once the right movement and loading plan is in place — noticeably less pain on the movements that used to trigger it, and more confidence moving normally. Persistent tendon issues and long-standing pain patterns typically need 6-8 weeks of graduated loading to see a durable change, which is why plans are reviewed and adjusted at every session rather than handed over once.",
    whenInPersonInstead:
      "Online assessment isn't right for everyone. If there are red-flag symptoms (unexplained weight loss, night pain that doesn't ease, saddle numbness, progressive weakness), suspected fracture, or a condition that needs hands-on joint mobilisation as the primary treatment, you'll be told plainly at triage and pointed toward an in-person clinician or your GP rather than kept in an online plan that isn't the right fit.",
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
          "For the large majority of mechanical pain (not caused by a specific traumatic injury or red-flag condition), a guided movement assessment over video is a well-established and accurate way to reach a working diagnosis and start treatment — hands-on assessment adds relatively little for most of these presentations."
      },
      {
        question: "How many sessions will I need?",
        answer:
          "It depends on how long the pain has been present and how it responds to the first phase of loading, but most plans run 4-8 sessions across 6-10 weeks, with exercises to do independently in between."
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
    seoTitle: "Physiotherapist Glasgow for Back, Neck and Joint Pain",
    seoDescription:
      "Evidence-based musculoskeletal physiotherapy in Glasgow and online across the UK."
  },
  {
    slug: "post-surgical-rehabilitation",
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
      "The first session reviews your surgeon's notes or discharge summary if you have them, your current stage of healing, and any specific precautions from your operation. You'll be guided through a safe range-of-motion and strength check over video, and leave with milestone targets for the next 2, 6 and 12 weeks so you know exactly what “on track” looks like — not just a generic exercise sheet.",
    typicalOutcomes:
      "Recovery timelines are set by the surgery itself, not the rehab: knee and hip replacement typically follow a 3-6 month arc to confident daily function, ACL reconstruction 9-12 months to full sports clearance, rotator cuff repair 4-6 months. What structured rehab changes is how much strength and confidence you have at each of those milestones — patients who follow a progressive loading plan consistently report less residual stiffness and a faster return to normal walking or activity than those managing alone from a handout.",
    whenInPersonInstead:
      "Wound checks, staple/suture removal, and any complication (infection signs, excessive swelling, a fall, or a joint that isn't progressing as expected) need in-person medical review — those go straight back to your surgical team, not managed through an online rehab plan. Online sessions pick up once you're medically cleared to begin exercise-based rehab.",
    faqs: [
      {
        question: "When should physiotherapy start after surgery?",
        answer: "This varies by procedure, but early guided rehab is often beneficial."
      },
      {
        question: "Can online rehab work after surgery?",
        answer: "Yes, for appropriate patients with clear milestones and clinician review."
      },
      {
        question: "What if I'm still on crutches or can't stand for long?",
        answer:
          "That's normal in early-stage recovery. Sessions are adapted to seated or supported positions where needed — a walking assessment isn't required to start effective early-stage strength and range-of-motion work."
      },
      {
        question: "Will you communicate with my surgeon or NHS physio team?",
        answer:
          "With your consent, yes — a written summary of your rehab plan and progress can be shared so your wider care team stays informed, particularly around any milestone check-ups."
      }
    ],
    relatedConditionSlugs: [
      "after-knee-replacement",
      "after-hip-replacement",
      "after-acl-reconstruction",
      "acl-rehabilitation"
    ],
    seoTitle: "Post Knee Replacement Rehab UK | PhysioOnClick",
    seoDescription:
      "Recover confidently after orthopaedic surgery with tailored rehabilitation support."
  },
  {
    slug: "neurological-rehabilitation",
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
      "Progress in neurological rehab is typically measured in small, compounding gains rather than a single milestone — improved balance confidence and reduced fall-catches within a few weeks is common, with functional mobility gains building over 8-12 weeks of consistent practice. Recovery trajectories vary a great deal by condition and stage, so reviews focus on function you can feel (walking further, needing less support) rather than a fixed timeline.",
    whenInPersonInstead:
      "Sudden new neurological symptoms (facial drooping, sudden weakness, slurred speech, a fall with injury) are a medical emergency, not a physiotherapy appointment — call 999 or attend A&E. Online rehab is for guided, ongoing practice once you're medically stable and any acute care has been arranged; it works alongside, not instead of, your wider medical and neuro-rehab team.",
    faqs: [
      {
        question: "Is neurological rehab suitable online?",
        answer: "Many reviews and guided programmes can be delivered remotely with support."
      },
      {
        question: "Do you liaise with other clinicians?",
        answer: "Yes, with consent we can work alongside your wider healthcare team."
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
      }
    ],
    seoTitle: "Neurological Physiotherapy Glasgow | PhysioOnClick",
    seoDescription:
      "Personalised neurological rehabilitation in Glasgow and through UK-wide online appointments."
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
      "Post-operative paediatric rehab",
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
      "Change in paediatric physiotherapy is tracked against real-world function — new coordination or confidence in play, easier movement at school, or steady progress on a specific developmental goal — rather than a single test score. Most families see the first signs of progress within 4-6 weeks of consistent home practice, with review sessions used to adjust activities as your child grows and improves.",
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
    seoTitle: "Paediatric Physiotherapy Glasgow | PhysioOnClick",
    seoDescription:
      "Compassionate and structured paediatric physiotherapy support for families in Glasgow and online."
  },
  {
    slug: "gait-and-mobility-assessment",
    title: "Gait & Mobility Assessment",
    image: serviceImagePath("gait-and-mobility-assessment"),
    summary:
      "Movement analysis, walking assessment and rehabilitation planning for confidence and independence.",
    conditions: [
      "Walking changes after surgery",
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
      "Most people notice improved walking confidence and reduced hesitation on stairs or uneven ground within 3-4 weeks of targeted strength and balance work. Where a mobility aid review is part of the plan, that adjustment often has an immediate, noticeable effect — the exercise programme is what sustains the improvement afterward.",
    whenInPersonInstead:
      "A recent fall with injury, sudden new weakness, or acute pain affecting walking needs urgent in-person medical assessment first. Formal falls-risk tools that require hands-on testing (or a home hazard assessment) are best done by an in-person team; online assessment focuses on the movement and strength side, which is often the larger and most modifiable factor.",
    faqs: [
      {
        question: "Do you assess falls risk?",
        answer: "Yes, falls risk and balance are core parts of the assessment when needed."
      },
      {
        question: "Can this help after joint replacement?",
        answer: "Yes, gait retraining is a common element of post-operative recovery."
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
    seoTitle: "Gait Assessment Glasgow | PhysioOnClick",
    seoDescription:
      "Walking and mobility assessments designed to improve confidence, function and independence."
  },
  {
    slug: "online-rehab-programmes",
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
      "Structured online rehab works best as an ongoing loop: a weekly or fortnightly review call adjusts the plan based on what's improved and what hasn't, rather than a static exercise sheet you're left to interpret alone. Most patients see steady, trackable progress against their own baseline within the first month, with the review cadence stepping down as independence increases.",
    whenInPersonInstead:
      "If triage identifies red-flag symptoms, a condition needing hands-on treatment as the primary intervention, or a situation better served by one of the specific services above (post-surgical, neurological, paediatric), you'll be redirected there or to an in-person clinician rather than kept in a general programme that isn't the right fit.",
    faqs: [
      {
        question: "Is online physio effective?",
        answer: "Yes, many musculoskeletal and rehab concerns respond well to remote assessment and guidance."
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
    seoTitle: "Online Physio UK | PhysioOnClick",
    seoDescription:
      "Book online physiotherapy anywhere in the UK with secure support and rehab tracking."
  }
];

export const pricing: PricingItem[] = [
  {
    id: "initial-assessment",
    title: "Initial Online Assessment",
    duration: "60 min",
    price: 50,
    description: "Remote assessment with tailored advice and exercise planning.",
    mode: "Online"
  },
  {
    id: "follow-up",
    title: "Online Follow-Up",
    duration: "30 min",
    price: 40,
    description: "Ongoing online progression and accountability support.",
    mode: "Online"
  },
  {
    id: "bundle-4",
    title: "4 Session Bundle",
    duration: "Flexible",
    price: 180,
    description: "Cost-effective package for structured rehabilitation.",
    mode: "Package"
  },
  {
    id: "bundle-8",
    title: "8 Session Bundle",
    duration: "Flexible",
    price: 340,
    description: "Longer-term rehabilitation plan with review milestones.",
    mode: "Package"
  }
];

export const testimonials: Testimonial[] = [
  {
    name: "Sarah M.",
    location: "Glasgow",
    quote:
      "The plan was calm, structured and easy to follow. I felt listened to and much more confident after my knee replacement.",
    focus: "Post-surgical rehabilitation"
  },
  {
    name: "James R.",
    location: "Edinburgh",
    quote:
      "Online appointments were far more thorough than I expected. My back pain improved because the advice was practical and realistic.",
    focus: "Online physiotherapy"
  },
  {
    name: "Amina K.",
    location: "Glasgow",
    quote:
      "Professional, reassuring and evidence-based. My daughter responded really well to the paediatric sessions.",
    focus: "Paediatric physiotherapy"
  }
];

export const stats = [
  { label: "Years of clinical experience", value: "4+" },
  { label: "Services across Glasgow and online", value: "6" },
  { label: "Guided blog resources available", value: "100+" },
  { label: "Response time for enquiries", value: "24h" }
];
