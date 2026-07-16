export type Service = {
  slug: string;
  title: string;
  image: string;
  summary: string;
  conditions: string[];
  approach: string[];
  faqs: { question: string; answer: string }[];
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

export type Exercise = {
  id: string;
  title: string;
  bodyPart: string;
  condition: string;
  stage: string;
  description: string;
  videoUrl: string;
};

export const founder = {
  name: "Shivaliba Zala",
  credentials: [
    "HCPC Registered Physiotherapist",
    "CSP Member",
    "MSc Orthopaedic & Rehabilitation Technology - University of Dundee"
  ],
  location: "Glasgow, UK"
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
    faqs: [
      {
        question: "Do I need a GP referral?",
        answer: "No. You can self-refer for private physiotherapy."
      },
      {
        question: "Will I be given exercises?",
        answer: "Yes, every plan includes a tailored home exercise programme."
      }
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
    faqs: [
      {
        question: "When should physiotherapy start after surgery?",
        answer: "This varies by procedure, but early guided rehab is often beneficial."
      },
      {
        question: "Can online rehab work after surgery?",
        answer: "Yes, for appropriate patients with clear milestones and clinician review."
      }
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
    faqs: [
      {
        question: "Is neurological rehab suitable online?",
        answer: "Many reviews and guided programmes can be delivered remotely with support."
      },
      {
        question: "Do you liaise with other clinicians?",
        answer: "Yes, with consent we can work alongside your wider healthcare team."
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
    faqs: [
      {
        question: "Can parents attend sessions?",
        answer: "Yes, parent involvement is encouraged."
      },
      {
        question: "Do you offer online paediatric consultations?",
        answer: "Yes, where clinically appropriate."
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
    faqs: [
      {
        question: "Do you assess falls risk?",
        answer: "Yes, falls risk and balance are core parts of the assessment when needed."
      },
      {
        question: "Can this help after joint replacement?",
        answer: "Yes, gait retraining is a common element of post-operative recovery."
      }
    ],
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
    faqs: [
      {
        question: "Is online physio effective?",
        answer: "Yes, many musculoskeletal and rehab concerns respond well to remote assessment and guidance."
      },
      {
        question: "Do I still get exercises and progress reviews?",
        answer: "Yes, online patients receive the same structured rehabilitation planning."
      }
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

export const exercises: Exercise[] = [
  {
    id: "ex-1",
    title: "Sit to Stand Control",
    bodyPart: "Lower limb",
    condition: "Post knee replacement",
    stage: "Early rehab",
    description: "Builds confidence and functional strength for everyday transfers.",
    videoUrl: "https://www.youtube.com/embed/1iQvKfV5fCE"
  },
  {
    id: "ex-2",
    title: "Scapular Setting",
    bodyPart: "Shoulder",
    condition: "Shoulder pain",
    stage: "Early rehab",
    description: "Promotes shoulder control and reduces overload through gentle activation.",
    videoUrl: "https://www.youtube.com/embed/uKYLJ3f6QBA"
  },
  {
    id: "ex-3",
    title: "Bridge Progression",
    bodyPart: "Lumbar spine",
    condition: "Back pain",
    stage: "Strength phase",
    description: "Targets hip and trunk strength to improve movement tolerance.",
    videoUrl: "https://www.youtube.com/embed/wPM8icPu6H8"
  },
  {
    id: "ex-4",
    title: "Tandem Balance Hold",
    bodyPart: "Balance",
    condition: "Falls prevention",
    stage: "Mobility phase",
    description: "Challenges balance safely and can be progressed with hand support as needed.",
    videoUrl: "https://www.youtube.com/embed/qri3WcM6L4o"
  }
];

export const stats = [
  { label: "Years of clinical experience", value: "4+" },
  { label: "Services across Glasgow and online", value: "6" },
  { label: "Guided blog resources available", value: "100+" },
  { label: "Response time for enquiries", value: "24h" }
];
