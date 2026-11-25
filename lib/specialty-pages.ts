import { homeVisitPrices } from "@/lib/home-visit-pricing";

// Condition-area landing pages for Glasgow search intent. They sit beside the
// services in lib/site-data and do not change them or the booking options.
// Clinical wording is awaiting Shivaliba's read before it goes to production:
// no promised outcomes, and no hands-on technique beyond the three confirmed on
// /manual-therapy-glasgow.
export type SpecialtyPage = {
  path: string;
  name: string;
  metaTitle: string;
  metaDescription: string;
  h1: string;
  lead: string;
  signs: string[];
  helps: string[];
  visit: { title: string; detail: string }[];
  urgent: string;
  faqs: { question: string; answer: string }[];
  related: { href: string; label: string }[];
};

const prices = `${homeVisitPrices.initial} assessment, ${homeVisitPrices.followUp} follow-ups`;

const referralFaq = {
  question: "Do I need a GP referral?",
  answer:
    "No, you can book directly. If you have a neurological condition, your GP or specialist team must confirm it is safe for you to begin physiotherapy. After an operation, rehab starts once your surgical team says you are ready, and we follow any restrictions they give you."
};

const costFaq = {
  question: "How much does a home visit cost?",
  answer: `${homeVisitPrices.initial} for the initial assessment and ${homeVisitPrices.followUp} for a follow-up, as one all-in price. Each home visit is 60 minutes.`
};

export const specialtyPages: SpecialtyPage[] = [
  {
    path: "/falls-prevention-physiotherapy-glasgow",
    name: "Falls prevention physiotherapy",
    metaTitle: "Falls Prevention Physio at Home, Glasgow | PhysioOnClick",
    metaDescription: `Falls prevention physiotherapy at home in Glasgow: balance and strength work where you actually move. HCPC physio. ${prices}.`,
    h1: "Falls prevention physiotherapy at home in Glasgow",
    lead: "Balance and strength work in your own home, on the stairs, chairs and floors you use every day, with an HCPC registered physiotherapist.",
    signs: [
      "A fall, trip or near miss in the last year",
      "Holding on to furniture to get around",
      "Finding it harder to get up from a chair, bed or toilet",
      "Avoiding stairs or going outside because you worry about falling"
    ],
    helps: [
      "Older adults who feel less steady than they used to",
      "People rebuilding confidence after a fall",
      "Families who want a relative to stay safer at home"
    ],
    visit: [
      { title: "Assessment", detail: "Your history, any falls, balance, leg strength, walking and the places at home you find difficult." },
      { title: "Balance and strength plan", detail: "Exercises matched to your level, set up safely with a worktop or sturdy chair for support." },
      { title: "Around the home", detail: "Practical advice on trip hazards, footwear and getting in and out of chairs, bed and stairs." },
      { title: "Review", detail: "Follow-ups to progress the exercises as you get steadier." }
    ],
    urgent:
      "If a fall caused a head knock, loss of consciousness, a suspected broken bone or you cannot get up or put weight on a leg, call 999. If falls come with fainting, dizziness or chest pain, see your GP first.",
    faqs: [
      { question: "Can physiotherapy stop me falling?", answer: "No one can promise you will never fall. Strength and balance exercise, done regularly, is a recommended way to lower the risk." },
      { question: "Can a family member join the visit?", answer: "Yes. Family members or carers are welcome and can learn how to support you between visits." },
      costFaq,
      referralFaq
    ],
    related: [
      { href: "/services/gait-and-mobility-assessment", label: "Gait and mobility assessment" },
      { href: "/exercises/area/balance", label: "Balance exercises" }
    ]
  },
  {
    path: "/elderly-physiotherapy-glasgow",
    name: "Physiotherapy for older adults",
    metaTitle: "Elderly Physiotherapy at Home in Glasgow | PhysioOnClick",
    metaDescription: `Physiotherapy at home for older adults in Glasgow: strength, walking and everyday movement, family welcome. ${prices}.`,
    h1: "Physiotherapy for older adults, at home in Glasgow",
    lead: "Help with strength, walking and everyday movement, without a journey to a clinic. Family and carers are welcome.",
    signs: [
      "Walking less, or more slowly, than a few months ago",
      "Struggling with stairs, bathing or getting dressed",
      "Weakness after an illness or a hospital stay",
      "Stiff or painful joints that limit daily life"
    ],
    helps: [
      "Older people who find travelling to appointments hard",
      "People getting back on their feet after a hospital stay",
      "Families arranging care for a parent or relative"
    ],
    visit: [
      { title: "Assessment", detail: "How you move now, what you want to get back to, your health history and your home layout." },
      { title: "Goals that matter to you", detail: "For example, reaching the shops, managing the stairs or getting out of a chair unaided." },
      { title: "Exercise plan", detail: "A short, clear plan with pictures that fits your day and your space." },
      { title: "Review", detail: "Follow-ups to check progress and adjust the plan, with a written summary after each visit." }
    ],
    urgent:
      "Sudden weakness in the face, arm or leg, or sudden trouble speaking, needs a 999 call. New confusion, a suspected broken bone or sudden loss of mobility needs urgent medical care before physiotherapy.",
    faqs: [
      { question: "Can I book for my parent?", answer: "Yes, with their agreement. You can request a visit on their behalf and be there for it." },
      { question: "Is it suitable if they cannot exercise much?", answer: "The plan starts from what they can do now, which may be a few seated or supported movements." },
      costFaq,
      referralFaq
    ],
    related: [
      { href: "/falls-prevention-physiotherapy-glasgow", label: "Falls prevention" },
      { href: "/physiotherapy-home-visits-glasgow", label: "Home visits and areas covered" }
    ]
  },
  {
    path: "/sports-injury-physiotherapy-glasgow",
    name: "Sports injury physiotherapy",
    metaTitle: "Sports Injury Physio at Home, Glasgow | PhysioOnClick",
    metaDescription: `Sports injury physiotherapy at home in Glasgow: assessment, rehab exercise and a graded return to your sport. ${prices}.`,
    h1: "Sports injury physiotherapy at home in Glasgow",
    lead: "Assessment, rehab exercise and a step-by-step return to your sport, at a time that suits you, including evenings and weekends.",
    signs: [
      "A strain or sprain that is not settling",
      "Pain that returns each time you train",
      "A joint that still feels weak or unsteady after an injury",
      "Not sure how much you can safely do"
    ],
    helps: [
      "Runners, gym-goers and team sport players",
      "Weekend and recreational athletes",
      "People returning to activity after time off"
    ],
    visit: [
      { title: "Assessment", detail: "How the injury happened, what aggravates it, movement, strength and your training load." },
      { title: "Settle it down", detail: "Advice on what to keep doing and what to ease off, with hands-on treatment where appropriate." },
      { title: "Rebuild", detail: "Progressive strength and control work for the injured area." },
      { title: "Return to sport", detail: "A graded plan back to running, lifting or play, reviewed as you go." }
    ],
    urgent:
      "A suspected fracture or dislocation, being unable to put weight on a leg, severe swelling straight after the injury or a head injury needs urgent care, not a home visit.",
    faqs: [
      { question: "How soon after an injury can I book?", answer: "You can book straight away once urgent problems have been ruled out." },
      { question: "Can you tell me when I can play again?", answer: "We agree milestones to reach before you return. Healing times differ, so we cannot promise a date." },
      costFaq,
      referralFaq
    ],
    related: [
      { href: "/services/musculoskeletal-physiotherapy", label: "Musculoskeletal physiotherapy" },
      { href: "/manual-therapy-glasgow", label: "Hands-on treatment at home" }
    ]
  },
  {
    path: "/chronic-pain-physiotherapy-glasgow",
    name: "Chronic pain physiotherapy",
    metaTitle: "Chronic Pain Physio at Home in Glasgow | PhysioOnClick",
    metaDescription: `Physiotherapy at home in Glasgow for long-term pain: understanding, pacing and gradual movement. HCPC physio. ${prices}.`,
    h1: "Physiotherapy for long-term pain, at home in Glasgow",
    lead: "Support to move and do more with pain that has lasted months, built around understanding, pacing and gradual exercise.",
    signs: [
      "Pain lasting more than three months",
      "Good days followed by flare-ups after doing too much",
      "Avoiding activities in case they make things worse",
      "Pain affecting sleep, work or daily tasks"
    ],
    helps: [
      "People with long-term back, neck or joint pain",
      "People who have lost confidence in moving",
      "People who find travelling to appointments tiring"
    ],
    visit: [
      { title: "Assessment", detail: "Your story, what you have tried, how pain affects your day and checks for anything needing a doctor." },
      { title: "Understanding pain", detail: "A plain explanation of why pain can persist and what tends to settle or stir it." },
      { title: "Pacing and movement", detail: "A steady starting level and small increases, so activity builds without repeated flare-ups." },
      { title: "Self-management", detail: "A written plan for flare-ups and for carrying on between visits." }
    ],
    urgent:
      "Numbness around the saddle area or new bladder or bowel problems need A&E now. Unexplained weight loss, fever, night pain that does not ease or worsening weakness need a prompt GP appointment.",
    faqs: [
      { question: "Will physiotherapy cure my pain?", answer: "We cannot promise that. The aim is to help you manage it and do more of what matters to you." },
      { question: "Will exercise make it worse?", answer: "We start gently and agree how much discomfort is acceptable. The plan is eased if it flares." },
      costFaq,
      referralFaq
    ],
    related: [
      { href: "/services/musculoskeletal-physiotherapy", label: "Musculoskeletal physiotherapy" },
      { href: "/online-physiotherapy-for/low-back-pain", label: "Low back pain" }
    ]
  }
];

export function specialtyPage(path: string): SpecialtyPage {
  const page = specialtyPages.find((item) => item.path === path);
  if (!page) throw new Error(`Unknown specialty page: ${path}`);
  return page;
}

export const specialtyPaths = specialtyPages.map((page) => page.path);

