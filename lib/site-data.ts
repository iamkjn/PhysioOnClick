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

export const invoiceIssuer = {
  legalName: "Shivaliba Zala", // from founder.name
  tradingName: "PhysioOnClick",
  hcpcNumber: "PH155757",
  cspNumber: "128230",
  addressLines: ["", "Glasgow", "United Kingdom"], // TODO: street line
  vatStatus: "Physiotherapy services are exempt from VAT (healthcare).",
  contactEmail: "zalashivali1998@gmail.com",
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
  },
  {
    id: "ex-5",
    title: "Straight Leg Raise",
    bodyPart: "Knee",
    condition: "Post knee replacement",
    stage: "Early rehab",
    description: "Strengthens the thigh muscle while keeping the knee straight, moving as guided.",
    videoUrl: "https://www.youtube.com/embed/1iQvKfV5fCE"
  },
  {
    id: "ex-6",
    title: "Heel Slide",
    bodyPart: "Knee",
    condition: "Post knee replacement",
    stage: "Early rehab",
    description: "Gently restores knee bending range through a slow, controlled sliding motion.",
    videoUrl: "https://www.youtube.com/embed/uKYLJ3f6QBA"
  },
  {
    id: "ex-7",
    title: "Mini Squat",
    bodyPart: "Knee",
    condition: "Knee osteoarthritis",
    stage: "Strength phase",
    description: "Builds functional leg strength through a small, controlled bend at the knees and hips.",
    videoUrl: "https://www.youtube.com/embed/wPM8icPu6H8"
  },
  {
    id: "ex-8",
    title: "Shoulder Flexion",
    bodyPart: "Shoulder",
    condition: "Shoulder impingement",
    stage: "Mobility phase",
    description: "Encourages a comfortable overhead reaching range, moving only as far as feels controlled.",
    videoUrl: "https://www.youtube.com/embed/qri3WcM6L4o"
  },
  {
    id: "ex-9",
    title: "Pendulum Swing",
    bodyPart: "Shoulder",
    condition: "Rotator cuff repair",
    stage: "Early rehab",
    description: "Uses a gentle, relaxed swinging motion to ease shoulder stiffness without active lifting.",
    videoUrl: "https://www.youtube.com/embed/1iQvKfV5fCE"
  },
  {
    id: "ex-10",
    title: "Single Leg Balance",
    bodyPart: "Balance",
    condition: "Falls prevention",
    stage: "Mobility phase",
    description: "Improves standing balance and confidence, with hand support nearby if needed.",
    videoUrl: "https://www.youtube.com/embed/uKYLJ3f6QBA"
  },
  {
    id: "ex-11",
    title: "Hip Bridge",
    bodyPart: "Hip",
    condition: "Hip pain",
    stage: "Strength phase",
    description: "Strengthens the hips and glutes through a slow, controlled lifting and lowering motion.",
    videoUrl: "https://www.youtube.com/embed/wPM8icPu6H8"
  },
  {
    id: "ex-12",
    title: "Heel Raises",
    bodyPart: "Ankle",
    condition: "Ankle sprain",
    stage: "Strength phase",
    description: "Builds calf and ankle strength by rising onto the toes in a slow, controlled way.",
    videoUrl: "https://www.youtube.com/embed/qri3WcM6L4o"
  },
  {
    id: "ex-13",
    title: "Chin Tuck",
    bodyPart: "Neck",
    condition: "Neck pain",
    stage: "Early rehab",
    description: "Encourages gentle neck alignment through a small, comfortable tucking motion.",
    videoUrl: "https://www.youtube.com/embed/1iQvKfV5fCE"
  },
  {
    id: "ex-14",
    title: "Dead Bug",
    bodyPart: "Core",
    condition: "Low back pain",
    stage: "Strength phase",
    description: "Builds core control by moving the arms and legs slowly while keeping the trunk steady.",
    videoUrl: "https://www.youtube.com/embed/uKYLJ3f6QBA"
  },
  {
    id: "ex-15",
    title: "Bird Dog",
    bodyPart: "Lumbar spine",
    condition: "Back pain",
    stage: "Strength phase",
    description: "Improves spinal stability by extending opposite arm and leg in a slow, controlled pattern.",
    videoUrl: "https://www.youtube.com/embed/wPM8icPu6H8"
  },
  {
    id: "ex-16",
    title: "Stationary Bike",
    bodyPart: "Knee",
    condition: "Post knee replacement",
    stage: "Mobility phase",
    description: "Supports gentle, low-impact movement to build knee range and general fitness.",
    videoUrl: "https://www.youtube.com/embed/qri3WcM6L4o"
  },
  // Facial-rehab exercises for facial-palsy / post-stroke / older patients.
  // Their motion check uses the FACE camera engine (symmetry + gentle reps),
  // not the body pose engine — see lib/face-targets.ts (face-* ids).
  {
    id: "face-smile",
    title: "Smile / Mouth Raise",
    bodyPart: "Face",
    condition: "Facial palsy / stroke recovery",
    stage: "Facial rehab",
    description: "Gently raise both mouth corners into a smile, aiming to move the weaker side to match the stronger one.",
    videoUrl: "https://www.youtube.com/embed/qri3WcM6L4o"
  },
  {
    id: "face-brow-raise",
    title: "Eyebrow Raise",
    bodyPart: "Face",
    condition: "Facial palsy / stroke recovery",
    stage: "Facial rehab",
    description: "Lift both eyebrows as evenly as you can, then relax — retraining symmetrical forehead control.",
    videoUrl: "https://www.youtube.com/embed/qri3WcM6L4o"
  },
  {
    id: "face-eye-close",
    title: "Gentle Eye Close",
    bodyPart: "Face",
    condition: "Facial palsy / stroke recovery",
    stage: "Facial rehab",
    description: "Softly close both eyes together and reopen, encouraging even eyelid control on both sides.",
    videoUrl: "https://www.youtube.com/embed/qri3WcM6L4o"
  },
  {
    id: "face-cheek-puff",
    title: "Cheek Puff",
    bodyPart: "Face",
    condition: "Facial palsy / stroke recovery",
    stage: "Facial rehab",
    description: "Puff out both cheeks and hold, then release — building lip seal and cheek-muscle control.",
    videoUrl: "https://www.youtube.com/embed/qri3WcM6L4o"
  },
  {
    id: "face-frown",
    title: "Brow Furrow",
    bodyPart: "Face",
    condition: "Facial palsy / stroke recovery",
    stage: "Facial rehab",
    description: "Pull both eyebrows down and together into a frown, then relax — retraining even upper-face control.",
    videoUrl: "https://www.youtube.com/embed/qri3WcM6L4o"
  },
  {
    id: "face-big-smile",
    title: "Big Smile",
    bodyPart: "Face",
    condition: "Facial palsy / stroke recovery",
    stage: "Facial rehab",
    description: "A wider smile progression — push both mouth corners up and out as far as feels comfortable, keeping the sides even.",
    videoUrl: "https://www.youtube.com/embed/qri3WcM6L4o"
  },
  {
    id: "face-eye-wide",
    title: "Open Eyes Wide",
    bodyPart: "Face",
    condition: "Facial palsy / stroke recovery",
    stage: "Facial rehab",
    description: "Open both eyes as wide as you can, as if surprised, then relax — encouraging even eyelid lift on both sides.",
    videoUrl: "https://www.youtube.com/embed/qri3WcM6L4o"
  },
  {
    id: "face-pucker",
    title: "Lip Pucker",
    bodyPart: "Face",
    condition: "Facial palsy / stroke recovery",
    stage: "Facial rehab",
    description: "Draw both lips forward into a pucker, as if to kiss or whistle, then relax — building lip-rounding control for speech and drinking.",
    videoUrl: "https://www.youtube.com/embed/qri3WcM6L4o"
  }
];

export const stats = [
  { label: "Years of clinical experience", value: "4+" },
  { label: "Services across Glasgow and online", value: "6" },
  { label: "Guided blog resources available", value: "100+" },
  { label: "Response time for enquiries", value: "24h" }
];
