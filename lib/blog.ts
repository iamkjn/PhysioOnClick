const categories = [
  "Back pain",
  "Knee injuries",
  "Shoulder rehab",
  "Sciatica",
  "Sports injuries",
  "Neurological conditions",
  "Post-surgery recovery",
  "Home exercise advice",
  "Workplace ergonomics"
] as const;

const topicSeeds = [
  "Morning stiffness",
  "Desk-based pain flare-ups",
  "Return to running",
  "Confidence after surgery",
  "Exercise pacing",
  "Balance and falls prevention",
  "Shoulder overhead loading",
  "Nerve-related symptoms",
  "Hip and knee strength",
  "Recovery planning",
  "Walking tolerance",
  "Home-working posture"
];

export type BlogArticle = {
  slug: string;
  title: string;
  category: (typeof categories)[number];
  excerpt: string;
  readTime: string;
  seoTitle: string;
  seoDescription: string;
  publishedAt: string;
  image: string;
  sections: { heading: string; body: string[] }[];
};

export function blogImagePath(slug: string) {
  // v2: covers are decorative now (no baked-in title). The route serves
  // immutable/1y cache headers, so a redesign must bump this to bust caches.
  return `/blog-images/${slug}?v=2`;
}

function toSlug(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function articleSections(category: string, topic: string, index: number) {
  return [
    {
      heading: "Why this matters",
      body: [
        `${topic} is one of the most common concerns discussed in UK physiotherapy appointments, especially when it starts to affect work, walking, sleep or confidence with exercise. At PhysioOnClick, we focus on understanding the whole picture rather than chasing quick fixes. That means asking when symptoms began, what aggravates them, how the condition affects day-to-day tasks and whether there are any signs that suggest further medical review is needed.`,
        `In Glasgow clinics and online consultations across the UK, people often arrive worried that pain automatically means harm. In many cases the story is more nuanced. Symptoms can be influenced by load, stress, sleep, deconditioning and recent changes in activity. A good physiotherapy plan helps you understand those factors so your recovery becomes predictable and manageable.`
      ]
    },
    {
      heading: "Clinical assessment points",
      body: [
        `For ${category.toLowerCase()}, physiotherapists usually look at movement quality, symptom behaviour over twenty-four hours, strength, range of movement and the tasks that matter most to you. We also consider relevant medical history, medication, previous imaging and any recent treatment. The goal is not simply to name a structure, but to understand how your symptoms behave and what should happen next.`,
        `If a patient is recovering from surgery or managing a long-term condition, assessment also includes functional milestones. That may mean checking stair confidence, chair transfers, balance, walking endurance or return-to-work demands. Clear baseline measures make follow-up appointments more useful because progress can be tracked objectively rather than guessed.`
      ]
    },
    {
      heading: "What treatment often involves",
      body: [
        `Evidence-based physiotherapy usually combines education, graded activity and targeted exercise. Manual therapy can sometimes help reduce pain or stiffness in the short term, but it works best when paired with a longer-term movement strategy. Rehab plans often include mobility drills, strengthening work, pacing advice and confidence-building exposure to feared activities.`,
        `A common mistake is doing too much on a good day and then needing several days to recover. A better approach is to build consistency first. That may include a simple home programme, weekly symptom tracking and clear rules for when to progress, maintain or reduce loading. The aim is sustainable recovery, not a burst of effort followed by a setback.`
      ]
    },
    {
      heading: "When to seek extra help",
      body: [
        `Although many musculoskeletal symptoms improve with conservative rehabilitation, there are times when medical input should be prioritised. That includes rapidly worsening neurological symptoms, unexplained systemic illness, significant trauma, suspected infection, new bladder or bowel changes, or severe pain that does not settle with rest or position changes. A physiotherapist should always screen for these issues rather than assuming every presentation is routine.`,
        `If you are unsure whether your situation is suitable for physiotherapy, a structured assessment can still help. It may lead to an immediate rehab plan, advice on self-management, or signposting to a GP, urgent care or specialist service when appropriate. Safe decision-making is part of high-quality physiotherapy care.`
      ]
    },
    {
      heading: "Practical home advice",
      body: [
        `A helpful starting point is to choose one or two key exercises that you can realistically complete most days of the week. Track pain, stiffness and confidence rather than focusing on perfection. Small improvements in walking, sleep, stair tolerance or activity recovery often matter more than a single pain score.`,
        `At PhysioOnClick, we also encourage patients to think in milestones. That might be returning to a comfortable dog walk, kneeling for gardening, lifting a child, getting back into the gym or managing a full workday without a symptom flare. Rehab becomes much more motivating when it is linked to real-life goals.`,
        `This article forms part of our wider patient education library. Article ${index + 1} is designed to support informed decision-making, not replace individual medical advice. If your symptoms are changing, complex or affecting your confidence, booking a professional assessment is the safest next step.`
      ]
    }
  ];
}

export const blogArticles: BlogArticle[] = Array.from({ length: 108 }, (_, index) => {
  const category = categories[index % categories.length];
  const topic = topicSeeds[index % topicSeeds.length];
  const title = `${topic} and ${category.toLowerCase()}: a practical UK physiotherapy guide`;
  const slug = toSlug(`${title}-${index + 1}`);

  return {
    slug,
    title,
    category,
    excerpt:
      "A clear, evidence-based guide covering symptoms, rehab planning, common mistakes and when to seek assessment.",
    readTime: "6 min read",
    seoTitle: `${title} | PhysioOnClick`,
    seoDescription:
      "UK-focused physiotherapy advice from PhysioOnClick on symptom understanding, rehab planning and safe recovery.",
    publishedAt: new Date(2025, index % 12, (index % 28) + 1).toISOString(),
    image: blogImagePath(slug),
    sections: articleSections(category, topic, index)
  };
});

export function getArticle(slug: string) {
  return blogArticles.find((article) => article.slug === slug);
}

export const blogCategories = [...categories];
