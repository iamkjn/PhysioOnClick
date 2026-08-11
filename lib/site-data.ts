import type { ClinicalArea } from "@/lib/assessment-forms";

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
  clinicalArea: ClinicalArea;
  tags: string[];
  condition: string;
  stage: string;
  description: string;
  videoUrl?: string;
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
    clinicalArea: "lower_limb",
    tags: ["knee-replacement", "functional", "early-rehab"],
    condition: "Post knee replacement",
    stage: "Early rehab",
    description: "Builds confidence and functional strength for everyday transfers.",
    videoUrl: "https://www.youtube.com/embed/1iQvKfV5fCE"
  },
  {
    id: "ex-2",
    title: "Scapular Setting",
    bodyPart: "Shoulder",
    clinicalArea: "upper_limb",
    tags: ["shoulder", "activation", "early-rehab"],
    condition: "Shoulder pain",
    stage: "Early rehab",
    description: "Promotes shoulder control and reduces overload through gentle activation.",
    videoUrl: "https://www.youtube.com/embed/uKYLJ3f6QBA"
  },
  {
    id: "ex-3",
    title: "Bridge Progression",
    bodyPart: "Lumbar spine",
    clinicalArea: "spine",
    tags: ["low-back", "hip-strength", "strength-phase"],
    condition: "Back pain",
    stage: "Strength phase",
    description: "Targets hip and trunk strength to improve movement tolerance.",
    videoUrl: "https://www.youtube.com/embed/wPM8icPu6H8"
  },
  {
    id: "ex-4",
    title: "Tandem Balance Hold",
    bodyPart: "Balance",
    clinicalArea: "balance_walking",
    tags: ["falls-prevention", "static-balance"],
    condition: "Falls prevention",
    stage: "Mobility phase",
    description: "Challenges balance safely and can be progressed with hand support as needed.",
    videoUrl: "https://www.youtube.com/embed/qri3WcM6L4o"
  },
  {
    id: "ex-5",
    title: "Straight Leg Raise",
    bodyPart: "Knee",
    clinicalArea: "lower_limb",
    tags: ["knee", "quad-strength", "early-rehab"],
    condition: "Post knee replacement",
    stage: "Early rehab",
    description: "Strengthens the thigh muscle while keeping the knee straight, moving as guided.",
    videoUrl: "https://www.youtube.com/embed/1iQvKfV5fCE"
  },
  {
    id: "ex-6",
    title: "Heel Slide",
    bodyPart: "Knee",
    clinicalArea: "lower_limb",
    tags: ["knee", "range-of-motion", "early-rehab"],
    condition: "Post knee replacement",
    stage: "Early rehab",
    description: "Gently restores knee bending range through a slow, controlled sliding motion.",
    videoUrl: "https://www.youtube.com/embed/uKYLJ3f6QBA"
  },
  {
    id: "ex-7",
    title: "Mini Squat",
    bodyPart: "Knee",
    clinicalArea: "lower_limb",
    tags: ["knee", "osteoarthritis", "strength-phase"],
    condition: "Knee osteoarthritis",
    stage: "Strength phase",
    description: "Builds functional leg strength through a small, controlled bend at the knees and hips.",
    videoUrl: "https://www.youtube.com/embed/wPM8icPu6H8"
  },
  {
    id: "ex-8",
    title: "Shoulder Flexion",
    bodyPart: "Shoulder",
    clinicalArea: "upper_limb",
    tags: ["shoulder", "impingement", "mobility"],
    condition: "Shoulder impingement",
    stage: "Mobility phase",
    description: "Encourages a comfortable overhead reaching range, moving only as far as feels controlled.",
    videoUrl: "https://www.youtube.com/embed/qri3WcM6L4o"
  },
  {
    id: "ex-9",
    title: "Pendulum Swing",
    bodyPart: "Shoulder",
    clinicalArea: "upper_limb",
    tags: ["shoulder", "rotator-cuff", "early-rehab"],
    condition: "Rotator cuff repair",
    stage: "Early rehab",
    description: "Uses a gentle, relaxed swinging motion to ease shoulder stiffness without active lifting.",
    videoUrl: "https://www.youtube.com/embed/1iQvKfV5fCE"
  },
  {
    id: "ex-10",
    title: "Single Leg Balance",
    bodyPart: "Balance",
    clinicalArea: "balance_walking",
    tags: ["falls-prevention", "dynamic-balance"],
    condition: "Falls prevention",
    stage: "Mobility phase",
    description: "Improves standing balance and confidence, with hand support nearby if needed.",
    videoUrl: "https://www.youtube.com/embed/uKYLJ3f6QBA"
  },
  {
    id: "ex-11",
    title: "Hip Bridge",
    bodyPart: "Hip",
    clinicalArea: "lower_limb",
    tags: ["hip", "glute-strength", "strength-phase"],
    condition: "Hip pain",
    stage: "Strength phase",
    description: "Strengthens the hips and glutes through a slow, controlled lifting and lowering motion.",
    videoUrl: "https://www.youtube.com/embed/wPM8icPu6H8"
  },
  {
    id: "ex-12",
    title: "Heel Raises",
    bodyPart: "Ankle",
    clinicalArea: "lower_limb",
    tags: ["ankle", "calf-strength", "strength-phase"],
    condition: "Ankle sprain",
    stage: "Strength phase",
    description: "Builds calf and ankle strength by rising onto the toes in a slow, controlled way.",
    videoUrl: "https://www.youtube.com/embed/qri3WcM6L4o"
  },
  {
    id: "ex-13",
    title: "Chin Tuck",
    bodyPart: "Neck",
    clinicalArea: "spine",
    tags: ["neck", "postural-control", "early-rehab"],
    condition: "Neck pain",
    stage: "Early rehab",
    description: "Encourages gentle neck alignment through a small, comfortable tucking motion.",
    videoUrl: "https://www.youtube.com/embed/1iQvKfV5fCE"
  },
  {
    id: "ex-14",
    title: "Dead Bug",
    bodyPart: "Core",
    clinicalArea: "spine",
    tags: ["low-back", "core-control", "strength-phase"],
    condition: "Low back pain",
    stage: "Strength phase",
    description: "Builds core control by moving the arms and legs slowly while keeping the trunk steady.",
    videoUrl: "https://www.youtube.com/embed/uKYLJ3f6QBA"
  },
  {
    id: "ex-15",
    title: "Bird Dog",
    bodyPart: "Lumbar spine",
    clinicalArea: "spine",
    tags: ["low-back", "spinal-stability", "strength-phase"],
    condition: "Back pain",
    stage: "Strength phase",
    description: "Improves spinal stability by extending opposite arm and leg in a slow, controlled pattern.",
    videoUrl: "https://www.youtube.com/embed/wPM8icPu6H8"
  },
  {
    id: "ex-16",
    title: "Stationary Bike",
    bodyPart: "Knee",
    clinicalArea: "lower_limb",
    tags: ["knee-replacement", "low-impact", "mobility"],
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
    clinicalArea: "neuro",
    tags: ["facial-palsy", "stroke", "symmetry"],
    condition: "Facial palsy / stroke recovery",
    stage: "Facial rehab",
    description: "Gently raise both mouth corners into a smile, aiming to move the weaker side to match the stronger one.",
    videoUrl: "https://www.youtube.com/embed/qri3WcM6L4o"
  },
  {
    id: "face-brow-raise",
    title: "Eyebrow Raise",
    bodyPart: "Face",
    clinicalArea: "neuro",
    tags: ["facial-palsy", "stroke", "symmetry"],
    condition: "Facial palsy / stroke recovery",
    stage: "Facial rehab",
    description: "Lift both eyebrows as evenly as you can, then relax — retraining symmetrical forehead control.",
    videoUrl: "https://www.youtube.com/embed/qri3WcM6L4o"
  },
  {
    id: "face-eye-close",
    title: "Gentle Eye Close",
    bodyPart: "Face",
    clinicalArea: "neuro",
    tags: ["facial-palsy", "stroke", "symmetry"],
    condition: "Facial palsy / stroke recovery",
    stage: "Facial rehab",
    description: "Softly close both eyes together and reopen, encouraging even eyelid control on both sides.",
    videoUrl: "https://www.youtube.com/embed/qri3WcM6L4o"
  },
  {
    id: "face-cheek-puff",
    title: "Cheek Puff",
    bodyPart: "Face",
    clinicalArea: "neuro",
    tags: ["facial-palsy", "stroke", "lip-seal"],
    condition: "Facial palsy / stroke recovery",
    stage: "Facial rehab",
    description: "Puff out both cheeks and hold, then release — building lip seal and cheek-muscle control.",
    videoUrl: "https://www.youtube.com/embed/qri3WcM6L4o"
  },
  {
    id: "face-frown",
    title: "Brow Furrow",
    bodyPart: "Face",
    clinicalArea: "neuro",
    tags: ["facial-palsy", "stroke", "symmetry"],
    condition: "Facial palsy / stroke recovery",
    stage: "Facial rehab",
    description: "Pull both eyebrows down and together into a frown, then relax — retraining even upper-face control.",
    videoUrl: "https://www.youtube.com/embed/qri3WcM6L4o"
  },
  {
    id: "face-big-smile",
    title: "Big Smile",
    bodyPart: "Face",
    clinicalArea: "neuro",
    tags: ["facial-palsy", "stroke", "symmetry"],
    condition: "Facial palsy / stroke recovery",
    stage: "Facial rehab",
    description: "A wider smile progression — push both mouth corners up and out as far as feels comfortable, keeping the sides even.",
    videoUrl: "https://www.youtube.com/embed/qri3WcM6L4o"
  },
  {
    id: "face-eye-wide",
    title: "Open Eyes Wide",
    bodyPart: "Face",
    clinicalArea: "neuro",
    tags: ["facial-palsy", "stroke", "symmetry"],
    condition: "Facial palsy / stroke recovery",
    stage: "Facial rehab",
    description: "Open both eyes as wide as you can, as if surprised, then relax — encouraging even eyelid lift on both sides.",
    videoUrl: "https://www.youtube.com/embed/qri3WcM6L4o"
  },
  {
    id: "face-pucker",
    title: "Lip Pucker",
    bodyPart: "Face",
    clinicalArea: "neuro",
    tags: ["facial-palsy", "stroke", "lip-seal"],
    condition: "Facial palsy / stroke recovery",
    stage: "Facial rehab",
    description: "Draw both lips forward into a pucker, as if to kiss or whistle, then relax — building lip-rounding control for speech and drinking.",
    videoUrl: "https://www.youtube.com/embed/qri3WcM6L4o"
  },
  {
    id: "ex-17", title: "McKenzie Press-Up", bodyPart: "Lumbar spine",
    clinicalArea: "spine", tags: ["low-back", "disc", "extension-bias", "early-rehab"],
    condition: "Lumbar disc-related back pain", stage: "Early rehab",
    description: "Gentle repeated lower-back extension to centralise leg symptoms toward the spine, following the McKenzie extension principle."
  },
  {
    id: "ex-18", title: "Standing Extension", bodyPart: "Lumbar spine",
    clinicalArea: "spine", tags: ["low-back", "disc", "extension-bias", "mobility"],
    condition: "Lumbar disc-related back pain", stage: "Mobility phase",
    description: "An upright version of the press-up, hands on hips, easing the spine backward for symptom relief between exercise sessions."
  },
  {
    id: "ex-19", title: "Cat-Cow Stretch", bodyPart: "Thoracic spine",
    clinicalArea: "spine", tags: ["mid-back", "mobility", "early-rehab"],
    condition: "Thoracic stiffness", stage: "Early rehab",
    description: "Alternates gentle spinal flexion and extension on hands and knees to restore comfortable segmental movement."
  },
  {
    id: "ex-20", title: "Thoracic Rotation (Open Book)", bodyPart: "Thoracic spine",
    clinicalArea: "spine", tags: ["mid-back", "rotation", "mobility"],
    condition: "Thoracic stiffness", stage: "Mobility phase",
    description: "Side-lying rotation opening the chest toward the ceiling, restoring rotation range often lost with prolonged sitting."
  },
  {
    id: "ex-21", title: "Neck Rotation Range", bodyPart: "Cervical spine",
    clinicalArea: "spine", tags: ["neck", "range-of-motion", "early-rehab"],
    condition: "Neck pain", stage: "Early rehab",
    description: "Slow, controlled turning of the head side to side within a comfortable range to restore rotation."
  },
  {
    id: "ex-22", title: "Neck Side Flexion Stretch", bodyPart: "Cervical spine",
    clinicalArea: "spine", tags: ["neck", "flexibility", "early-rehab"],
    condition: "Neck pain", stage: "Early rehab",
    description: "A gentle ear-to-shoulder stretch, held briefly, to ease tight upper trapezius and neck muscles."
  },
  {
    id: "ex-23", title: "Isometric Neck Hold", bodyPart: "Cervical spine",
    clinicalArea: "spine", tags: ["neck", "whiplash", "strength-phase"],
    condition: "Whiplash-associated disorder", stage: "Strength phase",
    description: "Gentle resistance pushing the head into a supporting hand without movement, rebuilding neck muscle endurance safely."
  },
  {
    id: "ex-24", title: "Prone Cobra", bodyPart: "Lumbar spine",
    clinicalArea: "spine", tags: ["low-back", "postural-control", "strength-phase"],
    condition: "Postural low back pain", stage: "Strength phase",
    description: "Lying face down, lifting the chest slightly using back extensors to build postural endurance for desk-based pain."
  },
  {
    id: "ex-25", title: "Side Plank (Modified)", bodyPart: "Lumbar spine",
    clinicalArea: "spine", tags: ["low-back", "core-control", "strength-phase"],
    condition: "Low back pain", stage: "Strength phase",
    description: "A knee-supported side plank building lateral trunk stability, progressing spinal load tolerance safely."
  },
  {
    id: "ex-26", title: "Segmental Rolling", bodyPart: "Lumbar spine",
    clinicalArea: "spine", tags: ["low-back", "mobility", "early-rehab"],
    condition: "Acute low back pain", stage: "Early rehab",
    description: "Rolling from back to side in a controlled, segmental way to reintroduce comfortable movement after an acute flare."
  },
  {
    id: "ex-27", title: "Pelvic Tilt", bodyPart: "Lumbar spine",
    clinicalArea: "spine", tags: ["low-back", "pregnancy", "early-rehab"],
    condition: "Pregnancy-related back pain", stage: "Early rehab",
    description: "A small rocking of the pelvis to ease lumbar tension, safe and gentle enough for antenatal and postnatal back pain."
  },
  {
    id: "ex-28", title: "Quadruped Arm/Leg Reach", bodyPart: "Lumbar spine",
    clinicalArea: "spine", tags: ["low-back", "spinal-stability", "strength-phase"],
    condition: "Chronic low back pain", stage: "Return to function",
    description: "An advanced bird-dog progression adding controlled reach, challenging balance and trunk control together."
  },
  {
    id: "ex-29", title: "Standing Chin Retraction", bodyPart: "Cervical spine",
    clinicalArea: "spine", tags: ["neck", "postural-control", "early-rehab"],
    condition: "Cervicogenic headache", stage: "Early rehab",
    description: "Drawing the chin straight back to correct forward-head posture, a common driver of tension-type headaches."
  },
  {
    id: "ex-30", title: "Levator Scapulae Stretch", bodyPart: "Cervical spine",
    clinicalArea: "spine", tags: ["neck", "flexibility", "mobility"],
    condition: "Neck and upper trap tightness", stage: "Mobility phase",
    description: "A diagonal neck stretch looking down and away to lengthen a commonly tight muscle behind the shoulder blade."
  },
  {
    id: "ex-31", title: "Lumbar Flexion in Lying", bodyPart: "Lumbar spine",
    clinicalArea: "spine", tags: ["low-back", "stenosis", "flexion-bias", "early-rehab"],
    condition: "Lumbar spinal stenosis", stage: "Early rehab",
    description: "Gently drawing both knees toward the chest to ease stenosis-related symptoms, which typically prefer flexion over extension."
  },
  {
    id: "ex-32", title: "Sciatic Nerve Glide", bodyPart: "Lumbar spine",
    clinicalArea: "spine", tags: ["low-back", "sciatica", "neural-mobility", "early-rehab"],
    condition: "Sciatica", stage: "Early rehab",
    description: "A gentle sliding nerve mobilisation of the leg and ankle to ease nerve-related sensitivity down the leg."
  },
  {
    id: "ex-33", title: "Wall Angels", bodyPart: "Thoracic spine",
    clinicalArea: "spine", tags: ["mid-back", "posture", "strength-phase"],
    condition: "Postural thoracic pain", stage: "Strength phase",
    description: "Sliding the arms up and down a wall while keeping contact, retraining shoulder-blade control and upright posture."
  },
  {
    id: "ex-34", title: "Functional Lifting Pattern", bodyPart: "Lumbar spine",
    clinicalArea: "spine", tags: ["low-back", "return-to-work", "return-to-function"],
    condition: "Chronic low back pain", stage: "Return to function",
    description: "Practising a hip-hinge lifting technique with a light load, building confidence for safe lifting at work or home."
  },
  { id: "ex-35", title: "Shoulder External Rotation (Band)", bodyPart: "Shoulder", clinicalArea: "upper_limb", tags: ["shoulder", "rotator-cuff", "strength-phase"], condition: "Rotator cuff tendinopathy", stage: "Strength phase", description: "Elbow tucked to the side, rotating the forearm outward against light resistance to strengthen the rotator cuff." },
  { id: "ex-36", title: "Shoulder Internal Rotation (Band)", bodyPart: "Shoulder", clinicalArea: "upper_limb", tags: ["shoulder", "rotator-cuff", "strength-phase"], condition: "Rotator cuff tendinopathy", stage: "Strength phase", description: "The mirrored inward rotation movement, balancing strength around the shoulder joint." },
  { id: "ex-37", title: "Wall Slide", bodyPart: "Shoulder", clinicalArea: "upper_limb", tags: ["shoulder", "impingement", "mobility"], condition: "Shoulder impingement", stage: "Mobility phase", description: "Sliding the arms up a wall keeping contact throughout, restoring overhead range without excess strain." },
  { id: "ex-38", title: "Sleeper Stretch", bodyPart: "Shoulder", clinicalArea: "upper_limb", tags: ["shoulder", "internal-rotation", "mobility"], condition: "Shoulder stiffness", stage: "Mobility phase", description: "Side-lying gentle pressure on the forearm to restore internal rotation range, common after overhead sports." },
  { id: "ex-39", title: "Prone Y-T-W Raises", bodyPart: "Shoulder", clinicalArea: "upper_limb", tags: ["shoulder", "scapular-control", "strength-phase"], condition: "Scapular dyskinesis", stage: "Strength phase", description: "Lying face down, lifting the arms into Y, T and W positions to retrain scapular muscle balance." },
  { id: "ex-40", title: "Elbow Flexion/Extension", bodyPart: "Elbow", clinicalArea: "upper_limb", tags: ["elbow", "range-of-motion", "early-rehab"], condition: "Post-elbow fracture", stage: "Early rehab", description: "Slow bending and straightening of the elbow through the available range to prevent stiffness after immobilisation." },
  { id: "ex-41", title: "Wrist Extensor Stretch", bodyPart: "Wrist", clinicalArea: "upper_limb", tags: ["wrist", "tennis-elbow", "mobility"], condition: "Lateral epicondylalgia (tennis elbow)", stage: "Mobility phase", description: "Gently pulling the wrist into flexion with the elbow straight to stretch the overloaded forearm extensors." },
  { id: "ex-42", title: "Eccentric Wrist Extension", bodyPart: "Wrist", clinicalArea: "upper_limb", tags: ["wrist", "tennis-elbow", "strength-phase"], condition: "Lateral epicondylalgia (tennis elbow)", stage: "Strength phase", description: "Slowly lowering a light weight through wrist extension, the evidence-based loading approach for tendon pain." },
  { id: "ex-43", title: "Wrist Flexor Stretch", bodyPart: "Wrist", clinicalArea: "upper_limb", tags: ["wrist", "golfers-elbow", "mobility"], condition: "Medial epicondylalgia (golfer's elbow)", stage: "Mobility phase", description: "Gently pulling the wrist into extension with the elbow straight to stretch the forearm flexors." },
  { id: "ex-44", title: "Grip Strengthening", bodyPart: "Hand", clinicalArea: "upper_limb", tags: ["hand", "grip", "strength-phase"], condition: "Hand weakness", stage: "Strength phase", description: "Repeated squeezing of a soft ball or putty to rebuild grip strength lost after injury or immobilisation." },
  { id: "ex-45", title: "Tendon Glide Exercises", bodyPart: "Hand", clinicalArea: "upper_limb", tags: ["hand", "carpal-tunnel", "early-rehab"], condition: "Carpal tunnel syndrome", stage: "Early rehab", description: "A sequence of finger positions gliding the flexor tendons through the wrist to reduce stiffness and nerve irritation." },
  { id: "ex-46", title: "Median Nerve Glide", bodyPart: "Wrist", clinicalArea: "upper_limb", tags: ["wrist", "carpal-tunnel", "neural-mobility"], condition: "Carpal tunnel syndrome", stage: "Early rehab", description: "A gentle nerve mobilisation moving the wrist and fingers through positions that glide the median nerve." },
  { id: "ex-47", title: "Scapular Retraction (Band Row)", bodyPart: "Shoulder", clinicalArea: "upper_limb", tags: ["shoulder", "postural-control", "strength-phase"], condition: "Shoulder impingement", stage: "Strength phase", description: "Pulling a resistance band toward the chest, squeezing the shoulder blades together to build postural shoulder strength." },
  { id: "ex-48", title: "Overhead Press Progression", bodyPart: "Shoulder", clinicalArea: "upper_limb", tags: ["shoulder", "return-to-function"], condition: "Shoulder impingement", stage: "Return to function", description: "A light, controlled overhead press building the strength and confidence to return to lifting or overhead sport." },
  { id: "ex-49", title: "Weight-Bearing Through Extended Wrist", bodyPart: "Wrist", clinicalArea: "upper_limb", tags: ["wrist", "post-fracture", "return-to-function"], condition: "Post-wrist fracture", stage: "Return to function", description: "Gradually loading body weight through a flat, extended hand to rebuild wrist tolerance for daily tasks." },
  { id: "ex-50", title: "Pendulum with Light Weight", bodyPart: "Shoulder", clinicalArea: "upper_limb", tags: ["shoulder", "frozen-shoulder", "early-rehab"], condition: "Frozen shoulder", stage: "Early rehab", description: "A weighted pendulum swing using gravity to gently distract and mobilise a stiff, painful shoulder joint." },
  { id: "ex-51", title: "Cross-Body Stretch", bodyPart: "Shoulder", clinicalArea: "upper_limb", tags: ["shoulder", "posterior-capsule", "mobility"], condition: "Posterior shoulder tightness", stage: "Mobility phase", description: "Pulling the arm across the chest to stretch the back of the shoulder, often tight after throwing or racquet sports." },
  { id: "ex-52", title: "Push-Up Plus (Wall or Floor)", bodyPart: "Shoulder", clinicalArea: "upper_limb", tags: ["shoulder", "scapular-control", "return-to-function"], condition: "Scapular dyskinesis", stage: "Return to function", description: "A standard push-up with an extra protraction at the top to fully engage the serratus anterior for scapular control." },
  { id: "ex-53", title: "Terminal Knee Extension (Band)", bodyPart: "Knee", clinicalArea: "lower_limb", tags: ["knee", "quad-strength", "strength-phase"], condition: "Anterior knee pain", stage: "Strength phase", description: "A resisted band pulling the knee into slight flexion while the quad straightens it, targeting the final degrees of extension." },
  { id: "ex-54", title: "Step-Up", bodyPart: "Knee", clinicalArea: "lower_limb", tags: ["knee", "functional", "strength-phase"], condition: "Patellofemoral pain", stage: "Strength phase", description: "Stepping up onto a low step with control, building single-leg strength for stairs and functional movement." },
  { id: "ex-55", title: "Clam Shell", bodyPart: "Hip", clinicalArea: "lower_limb", tags: ["hip", "glute-strength", "early-rehab"], condition: "Hip and knee pain (gluteal weakness)", stage: "Early rehab", description: "Lying on the side with knees bent, lifting the top knee while keeping feet together to activate the gluteus medius." },
  { id: "ex-56", title: "Side-Lying Hip Abduction", bodyPart: "Hip", clinicalArea: "lower_limb", tags: ["hip", "glute-strength", "strength-phase"], condition: "Gluteal tendinopathy", stage: "Strength phase", description: "Lifting the top leg straight out to the side, building hip abductor strength important for pelvic control." },
  { id: "ex-57", title: "Standing Hip Flexor Stretch", bodyPart: "Hip", clinicalArea: "lower_limb", tags: ["hip", "flexibility", "mobility"], condition: "Hip flexor tightness", stage: "Mobility phase", description: "A lunge-position stretch lengthening the front of the hip, often tight from prolonged sitting." },
  { id: "ex-58", title: "Deep Squat Mobility", bodyPart: "Hip", clinicalArea: "lower_limb", tags: ["hip", "mobility", "return-to-function"], condition: "Hip osteoarthritis", stage: "Return to function", description: "A supported deep squat hold to maintain functional hip and knee range for daily activities like gardening." },
  { id: "ex-59", title: "Ankle Pump", bodyPart: "Ankle", clinicalArea: "lower_limb", tags: ["ankle", "swelling", "early-rehab"], condition: "Ankle sprain (acute)", stage: "Early rehab", description: "Pointing and flexing the foot repeatedly to reduce swelling and maintain ankle mobility soon after injury." },
  { id: "ex-60", title: "Ankle Alphabet", bodyPart: "Ankle", clinicalArea: "lower_limb", tags: ["ankle", "range-of-motion", "early-rehab"], condition: "Ankle sprain", stage: "Early rehab", description: "Tracing letters of the alphabet with the foot in the air to gently restore ankle range in every direction." },
  { id: "ex-61", title: "Resisted Ankle Eversion", bodyPart: "Ankle", clinicalArea: "lower_limb", tags: ["ankle", "instability", "strength-phase"], condition: "Chronic ankle instability", stage: "Strength phase", description: "A band pulling the foot inward while the peroneal muscles resist, key for lateral ankle stability." },
  { id: "ex-62", title: "Single Leg Balance on Foam", bodyPart: "Ankle", clinicalArea: "lower_limb", tags: ["ankle", "balance", "instability", "return-to-function"], condition: "Chronic ankle instability", stage: "Return to function", description: "Standing on one leg on an unstable surface, retraining ankle proprioception for sport and uneven ground." },
  { id: "ex-63", title: "Calf Stretch (Gastrocnemius)", bodyPart: "Ankle", clinicalArea: "lower_limb", tags: ["ankle", "achilles", "flexibility", "mobility"], condition: "Achilles tendinopathy", stage: "Mobility phase", description: "A straight-knee wall stretch lengthening the calf, easing tightness that loads the Achilles tendon." },
  { id: "ex-64", title: "Eccentric Heel Drop", bodyPart: "Ankle", clinicalArea: "lower_limb", tags: ["ankle", "achilles", "strength-phase"], condition: "Achilles tendinopathy", stage: "Strength phase", description: "Slowly lowering the heel below step level, the standard evidence-based loading exercise for Achilles tendon pain." },
  { id: "ex-65", title: "Wall Squat Hold", bodyPart: "Knee", clinicalArea: "lower_limb", tags: ["knee", "isometric", "early-rehab"], condition: "Patellar tendinopathy (flare-up)", stage: "Early rehab", description: "An isometric squat against a wall, held steady — a low-irritability way to load a painful tendon early on." },
  { id: "ex-66", title: "Split Squat", bodyPart: "Knee", clinicalArea: "lower_limb", tags: ["knee", "functional", "return-to-function"], condition: "ACL rehabilitation", stage: "Return to function", description: "A staggered-stance squat building single-leg strength and control, a key step before returning to sport." },
  { id: "ex-67", title: "Lateral Band Walk", bodyPart: "Hip", clinicalArea: "lower_limb", tags: ["hip", "glute-strength", "return-to-function"], condition: "Patellofemoral pain", stage: "Return to function", description: "Sidestepping against band resistance around the knees, building hip strength that controls knee alignment." },
  { id: "ex-68", title: "Nordic Hamstring Curl (Assisted)", bodyPart: "Hamstring", clinicalArea: "lower_limb", tags: ["hamstring", "eccentric-strength", "return-to-function"], condition: "Hamstring strain", stage: "Return to function", description: "A kneeling, partner- or strap-assisted eccentric hamstring lowering exercise, shown to reduce re-injury risk." },
  { id: "ex-69", title: "Standing Hamstring Stretch", bodyPart: "Hamstring", clinicalArea: "lower_limb", tags: ["hamstring", "flexibility", "mobility"], condition: "Hamstring tightness", stage: "Mobility phase", description: "Hinging forward with a straight leg on a raised support to gently lengthen a tight hamstring." },
  { id: "ex-70", title: "Box Step-Down", bodyPart: "Knee", clinicalArea: "lower_limb", tags: ["knee", "control", "strength-phase"], condition: "Patellofemoral pain", stage: "Strength phase", description: "A slow, controlled step down from a low box, building eccentric quad control that protects the kneecap joint." },
  { id: "ex-71", title: "Static Standing Balance (Eyes Open)", bodyPart: "Balance", clinicalArea: "balance_walking", tags: ["falls-prevention", "static-balance", "early-rehab"], condition: "Falls prevention", stage: "Early rehab", description: "Standing unsupported with feet together, building basic standing balance confidence near a stable surface." },
  { id: "ex-72", title: "Static Standing Balance (Eyes Closed)", bodyPart: "Balance", clinicalArea: "balance_walking", tags: ["falls-prevention", "static-balance", "mobility"], condition: "Falls prevention", stage: "Mobility phase", description: "The same stance with eyes closed, removing visual input to challenge balance systems further, near support." },
  { id: "ex-73", title: "Weight Shifting", bodyPart: "Balance", clinicalArea: "balance_walking", tags: ["falls-prevention", "weight-transfer", "early-rehab"], condition: "Post-stroke balance impairment", stage: "Early rehab", description: "Slowly shifting body weight side to side and forward-back to rebuild confidence loading each leg evenly." },
  { id: "ex-74", title: "Sideways Walking", bodyPart: "Balance", clinicalArea: "balance_walking", tags: ["gait", "hip-strength", "mobility"], condition: "Gait instability", stage: "Mobility phase", description: "Stepping sideways in a controlled line, building hip strength and lateral stability important for uneven ground." },
  { id: "ex-75", title: "Heel-to-Toe Walking (Tandem Gait)", bodyPart: "Balance", clinicalArea: "balance_walking", tags: ["gait", "dynamic-balance", "strength-phase"], condition: "Falls prevention", stage: "Strength phase", description: "Walking in a straight line placing heel directly in front of toe, sharpening dynamic balance and coordination." },
  { id: "ex-76", title: "Marching on the Spot", bodyPart: "Balance", clinicalArea: "balance_walking", tags: ["gait", "hip-flexor", "early-rehab"], condition: "General deconditioning", stage: "Early rehab", description: "Lifting alternate knees while standing near support, building hip flexor strength and single-leg confidence." },
  { id: "ex-77", title: "Backward Walking", bodyPart: "Balance", clinicalArea: "balance_walking", tags: ["gait", "dynamic-balance", "return-to-function"], condition: "Gait re-training", stage: "Return to function", description: "Walking backward a short, safe distance, challenging balance and proprioception differently to forward gait." },
  { id: "ex-78", title: "Sit-to-Stand Repetitions", bodyPart: "Balance", clinicalArea: "balance_walking", tags: ["falls-prevention", "functional", "strength-phase"], condition: "Falls prevention", stage: "Strength phase", description: "Repeated rising from a chair without hands, one of the strongest evidence-based exercises for reducing fall risk." },
  { id: "ex-79", title: "Obstacle Stepping", bodyPart: "Balance", clinicalArea: "balance_walking", tags: ["gait", "dynamic-balance", "return-to-function"], condition: "Falls prevention", stage: "Return to function", description: "Stepping over low objects placed on the floor, practising the foot clearance needed to avoid trips." },
  { id: "ex-80", title: "Stair Negotiation Practice", bodyPart: "Balance", clinicalArea: "balance_walking", tags: ["gait", "functional", "return-to-function"], condition: "Post-surgical mobility", stage: "Return to function", description: "Practising stepping up and down stairs with a rail, rebuilding the confidence and strength for real stairs at home." },
  { id: "ex-81", title: "Single Leg Stance with Arm Reach", bodyPart: "Balance", clinicalArea: "balance_walking", tags: ["dynamic-balance", "sport", "return-to-function"], condition: "Return to sport balance training", stage: "Return to function", description: "Standing on one leg while reaching in different directions, advanced balance work for returning to sport." },
  { id: "ex-82", title: "Treadmill or Level Ground Gait Practice", bodyPart: "Balance", clinicalArea: "balance_walking", tags: ["gait", "endurance", "mobility"], condition: "Reduced walking tolerance", stage: "Mobility phase", description: "Timed walking practice at a comfortable pace, gradually building walking distance and confidence." },
  { id: "ex-83", title: "Standing on One Leg (Hand Support)", bodyPart: "Balance", clinicalArea: "balance_walking", tags: ["falls-prevention", "static-balance", "early-rehab"], condition: "Falls prevention", stage: "Early rehab", description: "Lifting one foot slightly off the floor with a hand resting on a worktop, an accessible starting balance challenge." },
  { id: "ex-84", title: "Turning Practice", bodyPart: "Balance", clinicalArea: "balance_walking", tags: ["gait", "falls-prevention", "mobility"], condition: "Falls prevention", stage: "Mobility phase", description: "Practising controlled 180-degree turns while walking, a common moment of instability and fall risk." },
  { id: "ex-85", title: "Dual-Task Walking", bodyPart: "Balance", clinicalArea: "balance_walking", tags: ["gait", "cognitive-motor", "return-to-function"], condition: "Falls prevention (cognitive-motor)", stage: "Return to function", description: "Walking while carrying out a simple mental task (like counting backward), practising real-world walking demands." },
  { id: "ex-86", title: "Uneven Surface Walking", bodyPart: "Balance", clinicalArea: "balance_walking", tags: ["gait", "proprioception", "return-to-function"], condition: "Return to outdoor mobility", stage: "Return to function", description: "Supervised walking on grass or a slightly uneven surface, rebuilding confidence for real-world terrain." },
  { id: "ex-87", title: "Bed Mobility Rolling", bodyPart: "Neuro", clinicalArea: "neuro", tags: ["stroke", "functional", "early-rehab"], condition: "Post-stroke rehabilitation", stage: "Early rehab", description: "Practising rolling side to side in bed with guided cues, rebuilding basic functional movement after neurological injury." },
  { id: "ex-88", title: "Bridging for Transfers", bodyPart: "Neuro", clinicalArea: "neuro", tags: ["stroke", "functional", "early-rehab"], condition: "Post-stroke rehabilitation", stage: "Early rehab", description: "Lifting the hips off the bed to assist with repositioning and transfers, an early building block for independence." },
  { id: "ex-89", title: "Sit-to-Stand with Support", bodyPart: "Neuro", clinicalArea: "neuro", tags: ["stroke", "parkinsons", "functional", "early-rehab"], condition: "Neurological mobility impairment", stage: "Early rehab", description: "Rising from a chair using armrests as needed, a foundational functional movement retrained after neurological injury." },
  { id: "ex-90", title: "Weight-Bearing Through Affected Leg", bodyPart: "Neuro", clinicalArea: "neuro", tags: ["stroke", "hemiplegia", "mobility"], condition: "Post-stroke hemiplegia", stage: "Mobility phase", description: "Standing with weight guided onto the affected side to rebuild sensation, strength and confidence on that leg." },
  { id: "ex-91", title: "Reaching Tasks (Affected Arm)", bodyPart: "Neuro", clinicalArea: "neuro", tags: ["stroke", "hemiplegia", "upper-limb", "mobility"], condition: "Post-stroke arm weakness", stage: "Mobility phase", description: "Guided reaching for objects using the affected arm, encouraging use and retraining coordinated movement." },
  { id: "ex-92", title: "Parkinson's Big Movements (LSVT-style)", bodyPart: "Neuro", clinicalArea: "neuro", tags: ["parkinsons", "amplitude-training", "strength-phase"], condition: "Parkinson's disease", stage: "Strength phase", description: "Exaggerated, large-amplitude arm and leg movements, based on LSVT BIG principles to counter the small movements typical of Parkinson's." },
  { id: "ex-93", title: "Rhythmic Stepping to a Beat", bodyPart: "Neuro", clinicalArea: "neuro", tags: ["parkinsons", "gait", "return-to-function"], condition: "Parkinson's disease (freezing of gait)", stage: "Return to function", description: "Stepping in place to an external rhythm or count, a cueing strategy that helps reduce freezing episodes." },
  { id: "ex-94", title: "Multiple Sclerosis Fatigue-Paced Circuit", bodyPart: "Neuro", clinicalArea: "neuro", tags: ["multiple-sclerosis", "pacing", "mobility"], condition: "Multiple sclerosis", stage: "Mobility phase", description: "A short, energy-conserving set of gentle movements with rest breaks, following pacing principles for fatigue management." },
  { id: "ex-95", title: "Coordination Drills (Finger to Nose)", bodyPart: "Neuro", clinicalArea: "neuro", tags: ["ataxia", "coordination", "early-rehab"], condition: "Cerebellar ataxia", stage: "Early rehab", description: "Slowly touching the finger to the nose and back, a classic coordination exercise for cerebellar conditions." },
  { id: "ex-96", title: "Heel-Shin Slide (Coordination)", bodyPart: "Neuro", clinicalArea: "neuro", tags: ["ataxia", "coordination", "early-rehab"], condition: "Cerebellar ataxia", stage: "Early rehab", description: "Sliding the heel smoothly down the opposite shin, training coordinated, controlled limb movement." },
  { id: "ex-97", title: "Standing Balance with Visual Feedback", bodyPart: "Neuro", clinicalArea: "neuro", tags: ["stroke", "balance", "mobility"], condition: "Post-stroke balance impairment", stage: "Mobility phase", description: "Standing in front of a mirror to visually correct posture and weight distribution after neurological injury." },
  { id: "ex-98", title: "Functional Grasp and Release", bodyPart: "Neuro", clinicalArea: "neuro", tags: ["stroke", "hand-function", "return-to-function"], condition: "Post-stroke hand weakness", stage: "Return to function", description: "Practising picking up and releasing everyday objects, rebuilding fine motor hand function for daily tasks." },
  { id: "ex-99", title: "Gait Re-Education with Cueing", bodyPart: "Neuro", clinicalArea: "neuro", tags: ["stroke", "parkinsons", "gait", "return-to-function"], condition: "Neurological gait impairment", stage: "Return to function", description: "Walking practice with verbal or visual cues to correct step length and foot clearance affected by neurological injury." },
  { id: "ex-100", title: "Trunk Rotation in Sitting", bodyPart: "Neuro", clinicalArea: "neuro", tags: ["stroke", "core-control", "early-rehab"], condition: "Post-stroke trunk control", stage: "Early rehab", description: "Rotating the upper body side to side while seated, rebuilding trunk control that underpins balance and reaching." },
  { id: "ex-101", title: "Standing Frame or Supported Standing", bodyPart: "Neuro", clinicalArea: "neuro", tags: ["spinal-cord-injury", "standing-tolerance", "early-rehab"], condition: "Spinal cord injury", stage: "Early rehab", description: "Supported standing for a set duration to maintain bone density, circulation and standing tolerance." },
  { id: "ex-102", title: "Dual-Task Cognitive-Motor Training", bodyPart: "Neuro", clinicalArea: "neuro", tags: ["stroke", "cognitive-motor", "return-to-function"], condition: "Post-stroke cognitive-motor impairment", stage: "Return to function", description: "Combining a simple physical task with a cognitive task (like naming items), rebuilding real-world dual-tasking ability." },
  { id: "ex-103", title: "Ankle Pumps (Post-Surgery)", bodyPart: "Post-op", clinicalArea: "post_op", tags: ["post-op", "dvt-prevention", "early-rehab"], condition: "General post-surgical recovery", stage: "Early rehab", description: "Regular ankle pumping in bed to promote circulation and reduce clot risk in the first days after surgery." },
  { id: "ex-104", title: "Quad Sets", bodyPart: "Post-op", clinicalArea: "post_op", tags: ["knee-replacement", "quad-activation", "early-rehab"], condition: "Post knee replacement", stage: "Early rehab", description: "Gently tightening the thigh muscle without bending the knee, reactivating the quadriceps in the earliest days after surgery." },
  { id: "ex-105", title: "Assisted Knee Flexion", bodyPart: "Post-op", clinicalArea: "post_op", tags: ["knee-replacement", "range-of-motion", "early-rehab"], condition: "Post knee replacement", stage: "Early rehab", description: "Using the other leg or a strap to gently assist bending the operated knee, restoring range before stiffness sets in." },
  { id: "ex-106", title: "Hip Abduction in Lying (Post-Op)", bodyPart: "Post-op", clinicalArea: "post_op", tags: ["hip-replacement", "precautions", "early-rehab"], condition: "Post hip replacement", stage: "Early rehab", description: "Sliding the operated leg out to the side within precautions, maintaining hip strength while respecting surgical guidelines." },
  { id: "ex-107", title: "Supported Standing (Post-Hip)", bodyPart: "Post-op", clinicalArea: "post_op", tags: ["hip-replacement", "functional", "early-rehab"], condition: "Post hip replacement", stage: "Early rehab", description: "Standing with a frame or rail soon after surgery, the first step toward safe, independent walking again." },
  { id: "ex-108", title: "Shoulder Pendulum (Post-Rotator Cuff)", bodyPart: "Post-op", clinicalArea: "post_op", tags: ["rotator-cuff-repair", "early-rehab"], condition: "Post rotator cuff repair", stage: "Early rehab", description: "A relaxed pendulum swing while the repair heals, moving the shoulder passively without active muscle effort." },
  { id: "ex-109", title: "Passive Shoulder Flexion (Assisted)", bodyPart: "Post-op", clinicalArea: "post_op", tags: ["rotator-cuff-repair", "range-of-motion", "early-rehab"], condition: "Post rotator cuff repair", stage: "Early rehab", description: "Using the unaffected arm or a pulley to lift the healing arm overhead without the repaired muscle working." },
  { id: "ex-110", title: "Incision Site Scar Mobilisation", bodyPart: "Post-op", clinicalArea: "post_op", tags: ["scar-management", "mobility"], condition: "Post-surgical scar tightness", stage: "Mobility phase", description: "Gentle circular massage around a healed incision to reduce adhesions and improve tissue mobility." },
  { id: "ex-111", title: "Graduated Weight-Bearing", bodyPart: "Post-op", clinicalArea: "post_op", tags: ["fracture-repair", "functional", "mobility"], condition: "Post-fracture fixation", stage: "Mobility phase", description: "Progressively increasing how much body weight is taken through the healing limb, following the surgeon's protocol." },
  { id: "ex-112", title: "Core Bracing (Post-Abdominal Surgery)", bodyPart: "Post-op", clinicalArea: "post_op", tags: ["abdominal-surgery", "core-control", "early-rehab"], condition: "Post-abdominal surgery", stage: "Early rehab", description: "A gentle core engagement technique to support the healing abdominal wall during coughing, moving or lifting." },
  { id: "ex-113", title: "Post-Op Walking Programme", bodyPart: "Post-op", clinicalArea: "post_op", tags: ["functional", "mobility"], condition: "General post-surgical recovery", stage: "Mobility phase", description: "A structured, gradually increasing daily walking distance to rebuild general fitness after time spent recovering." },
  { id: "ex-114", title: "Resisted Knee Extension (Post-ACL)", bodyPart: "Post-op", clinicalArea: "post_op", tags: ["acl-reconstruction", "strength-phase"], condition: "Post-ACL reconstruction", stage: "Strength phase", description: "Light resisted knee straightening within the surgeon's protocol, rebuilding quadriceps strength after graft healing time." },
  { id: "ex-115", title: "Proprioception Board (Post-Ankle Surgery)", bodyPart: "Post-op", clinicalArea: "post_op", tags: ["ankle-surgery", "proprioception", "return-to-function"], condition: "Post-ankle surgery", stage: "Return to function", description: "Balancing on a wobble board once weight-bearing is cleared, restoring the joint position sense lost after surgery." },
  { id: "ex-116", title: "Return-to-Function Strength Circuit", bodyPart: "Post-op", clinicalArea: "post_op", tags: ["functional", "return-to-function"], condition: "Late-stage post-surgical rehabilitation", stage: "Return to function", description: "A combined circuit of functional strength movements marking the transition back to normal activity levels." },
  { id: "ex-117", title: "Breathing Exercises (Post-Thoracic Surgery)", bodyPart: "Post-op", clinicalArea: "post_op", tags: ["thoracic-surgery", "respiratory", "early-rehab"], condition: "Post-thoracic or cardiac surgery", stage: "Early rehab", description: "Deep breathing and supported coughing technique to clear the chest and reduce post-surgical respiratory complications." },
  { id: "ex-118", title: "Graduated Return to Driving Readiness", bodyPart: "Post-op", clinicalArea: "post_op", tags: ["functional", "return-to-function"], condition: "Post-surgical driving readiness", stage: "Return to function", description: "Practising an emergency-stop foot movement and seated reach tasks to check readiness to safely resume driving." }
];

export const stats = [
  { label: "Years of clinical experience", value: "4+" },
  { label: "Services across Glasgow and online", value: "6" },
  { label: "Guided blog resources available", value: "100+" },
  { label: "Response time for enquiries", value: "24h" }
];
