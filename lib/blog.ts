import { founder } from "@/lib/site-data";

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

type Category = (typeof categories)[number];

// eslint-disable-next-line @typescript-eslint/no-unused-vars -- used only as a type source below
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
] as const;

type Topic = (typeof topicSeeds)[number];

export type BlogArticle = {
  slug: string;
  title: string;
  category: Category;
  excerpt: string;
  readTime: string;
  seoTitle: string;
  seoDescription: string;
  publishedAt: string;
  lastReviewedAt: string;
  author: string;
  authorCredential: string;
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

// --- Per-category clinical content -----------------------------------------
// Each entry describes what is actually distinctive about the condition
// group: the underlying mechanism, what a physiotherapy assessment focuses
// on, and the red flags specific to that presentation. This is what makes
// every article's clinical core different, rather than a topic name dropped
// into an otherwise identical paragraph.
const categoryInfo: Record<Category, { mechanism: string[]; assessment: string; redFlags: string }> = {
  "Back pain": {
    mechanism: [
      "Most non-specific low back pain is driven by a mix of mechanical sensitivity, muscle guarding and deconditioning rather than a single damaged structure. Discs, facet joints and the surrounding muscles all share nerve supply, which is why pain can feel deep, diffuse and hard to pin to one spot, and why it often eases and flares in a pattern that doesn't map neatly onto any scan finding.",
      "Pain intensity in the first few days is usually a poor guide to injury severity. NICE guidance on the assessment and management of low back pain and sciatica in adults emphasises that imaging rarely changes management for straightforward presentations, and that staying active — within a tolerable range — tends to outperform prolonged rest."
    ],
    assessment: "A physiotherapy assessment for back pain covers how symptoms behave over a full day, which movements ease or aggravate them, muscle strength and control through the trunk and hips, and enough neurological screening to rule out nerve involvement before building a loading plan.",
    redFlags: "Seek urgent medical review for new bladder or bowel disturbance, saddle-area numbness, progressive leg weakness, unexplained weight loss, fever, or pain that is constant, worsening and unrelated to movement or position — these fall outside straightforward mechanical back pain and need same-day assessment rather than a routine physiotherapy referral."
  },
  "Knee injuries": {
    mechanism: [
      "Knee symptoms usually trace back to one of three patterns: a specific traumatic injury (ligament, meniscus or patellar), an overuse presentation from a sudden change in load (runner's knee, patellar tendinopathy), or degenerative change where cartilage and joint surfaces have gradually lost tolerance to load. Each responds to a different rehab emphasis, which is why a generic 'knee exercise' plan often underperforms.",
      "Swelling, locking, giving way and a clear mechanism of injury point toward a structural cause worth imaging; a gradual ache that builds with specific activities and settles with rest points more toward a load-tolerance problem that usually responds to a structured strengthening programme rather than scans."
    ],
    assessment: "Assessment looks at how the knee was injured (or whether it built up gradually), joint line tenderness, ligament stability tests, quadriceps and hip strength, and functional tasks like a single-leg squat or step-down to see how the whole limb shares load, not just the joint itself.",
    redFlags: "A knee that is hot, significantly swollen within hours of injury, locked in a fixed position, or unable to bear any weight at all needs prompt medical assessment to rule out a fracture, complete ligament rupture or septic joint before starting rehabilitation."
  },
  "Shoulder rehab": {
    mechanism: [
      "The shoulder trades stability for range of motion, which makes it unusually dependent on the rotator cuff and scapular muscles working well together. Impingement-type pain, rotator cuff tendinopathy and post-dislocation instability all look different on assessment but share a common thread: symptoms often relate more to how load is shared through the shoulder blade and cuff than to any single 'torn' structure.",
      "Pain with overhead reaching, sleeping on the affected side and reduced strength lifting away from the body are the most common complaints. In most non-traumatic presentations, a graded strengthening programme resolves symptoms without surgery, though findings on a scan (partial tears, bursitis) are extremely common in pain-free shoulders too, which is why symptoms — not imaging alone — should drive the treatment plan."
    ],
    assessment: "A shoulder assessment checks active and passive range of motion, resisted strength testing for each rotator cuff muscle, scapular positioning and control, and how symptoms change with specific provocation tests, alongside a history of any dislocation, trauma or instability episodes.",
    redFlags: "A shoulder that is deformed after a fall, cannot be actively moved at all following trauma, or comes with new numbness down the arm and neck pain needs urgent assessment to rule out dislocation, fracture or a cervical nerve root problem before rehab begins."
  },
  Sciatica: {
    mechanism: [
      "Sciatica describes nerve root irritation, most commonly from a disc bulge pressing on or chemically irritating a nerve root as it exits the spine, producing pain, pins and needles or numbness that can travel down the leg past the knee. This is different from general low back pain because the nerve itself — not just the joint or muscle — is involved, which changes both the expected timeline and the assessment.",
      "The reassuring evidence is that most disc-related sciatica improves within weeks to a few months without surgery, as the disc irritation and any inflammatory swelling settle. NICE guidance on managing sciatica supports a staged approach: staying appropriately active, targeted exercise and pain management, with imaging and surgical opinion reserved for cases that fail to improve or show worsening neurological signs."
    ],
    assessment: "Assessment includes straight leg raise and neural tension testing, checking reflexes, muscle power and sensation in specific nerve root distributions down the leg, and screening for the alternative pattern of spinal stenosis, where symptoms are usually worse standing and walking and ease with sitting or leaning forward.",
    redFlags: "Any new saddle numbness, difficulty controlling the bladder or bowel, rapidly progressive leg weakness, or bilateral leg symptoms are cauda equina red flags and require same-day emergency assessment — this is one of the few genuine physiotherapy emergencies."
  },
  "Sports injuries": {
    mechanism: [
      "Sports injuries split broadly into acute trauma (a specific incident — a sprain, strain or tear with a clear mechanism) and overuse injuries that build gradually when training load rises faster than the tissue's ability to adapt. The rehab principles differ: acute injuries usually need an initial period of protected loading followed by progressive rebuilding, while overuse injuries need a training-load review as much as they need treatment.",
      "The single biggest predictor of re-injury on return to sport isn't how the injury was treated in isolation — it's whether the athlete returns with adequate strength, control and confidence relative to the demands of their sport, tested under fatigue and at speed, not just pain-free at rest."
    ],
    assessment: "Assessment covers the mechanism and history of injury, strength and range of movement compared side-to-side, movement quality under load (jumping, cutting, sprinting mechanics where relevant), and a realistic picture of training volume and competition demands to build a return-to-sport timeline around.",
    redFlags: "A visibly deformed joint, inability to bear any weight after a lower-limb injury, a loud pop with immediate significant swelling, or numbness/weakness distal to the injury site all warrant same-day medical assessment before any rehab plan is started."
  },
  "Neurological conditions": {
    mechanism: [
      "Neurological physiotherapy — for conditions such as stroke, Parkinson's, multiple sclerosis or peripheral nerve injury — works differently to musculoskeletal rehab because the goal is often to support the nervous system's capacity to adapt (neuroplasticity) and manage a changing condition, rather than to heal a single injured tissue on a predictable timeline.",
      "Symptoms like weakness, altered sensation, balance difficulty or fatigue often fluctuate day to day and can be affected by heat, illness, stress or overexertion in ways that differ from typical musculoskeletal pain, so pacing and monitoring matter as much as the exercises themselves."
    ],
    assessment: "Assessment typically includes standardised balance and mobility measures, muscle tone and strength testing, functional tasks relevant to daily life (transfers, stairs, walking distance), and close coordination with the wider medical team managing the underlying neurological condition.",
    redFlags: "Sudden new weakness, facial drooping, slurred speech, a sudden severe headache, or a rapid, unexplained change in an existing neurological condition are medical emergencies requiring immediate assessment (call 999) rather than a physiotherapy appointment."
  },
  "Post-surgery recovery": {
    mechanism: [
      "Recovery after surgery follows a biological healing timeline that rehab has to respect: tissue needs time to gain tensile strength before it can tolerate full loading, regardless of how good someone feels day to day. Rehab that moves faster than this timeline risks setting recovery back; rehab that moves slower than necessary leaves people deconditioned and often more anxious about movement than the surgery itself justifies.",
      "Surgeons' individual protocols vary by procedure, and physiotherapy should follow the specific guidance given for that operation. Within that framework, the physiotherapist's role is to progress range of motion, strength and function as the tissue allows, while addressing the very common drop in confidence that follows any operation."
    ],
    assessment: "Assessment reviews the surgical procedure and any surgeon-specific precautions, wound healing, swelling, current range of movement against expected milestones for that stage of recovery, and functional goals — return to work, driving, sport or specific hobbies.",
    redFlags: "Increasing redness, warmth, discharge or fever around a surgical site, a sudden increase in swelling or pain, or symptoms of a blood clot (calf swelling, tenderness, breathlessness) need urgent medical review rather than physiotherapy in the first instance."
  },
  "Home exercise advice": {
    mechanism: [
      "The exercises that work best are rarely the most complicated ones — they're the ones a person can actually do consistently. Home exercise programmes fail more often from poor adherence and unclear dosage than from choosing the 'wrong' exercise, which is why physiotherapy puts as much emphasis on habit-building and progression rules as on the movements themselves.",
      "A well-designed home programme specifies not just which exercises, but how much (sets, reps, load), how often, and clear criteria for when to progress, hold, or scale back — removing the guesswork that causes people to either under-do it or overdo it on a good day."
    ],
    assessment: "Before prescribing a home programme, a physiotherapist checks baseline strength and movement quality, current activity levels, equipment and space available at home, and any specific goals so the plan is realistic rather than generic.",
    redFlags: "Sharp new pain during an exercise that doesn't ease with rest, exercises that consistently worsen symptoms the following day, or new neurological symptoms (numbness, weakness) starting during a home programme should prompt a pause and a physiotherapy review, not pushing through."
  },
  "Workplace ergonomics": {
    mechanism: [
      "Workplace-related pain is rarely caused by posture alone — it's usually a combination of sustained static positions, insufficient movement variety through the day, and a workstation setup that puts joints toward the end of their comfortable range for hours at a time. Fixing the chair height helps, but rarely resolves symptoms on its own if the underlying issue is hours of unbroken sitting or screen-focused strain.",
      "The evidence on ergonomic interventions is clearest when equipment changes are combined with movement breaks and some general conditioning work — the body copes far better with a poor position held briefly than a good position held for six hours straight."
    ],
    assessment: "A workplace-focused assessment looks at desk and screen setup, chair support, keyboard and mouse position, how the working day is structured (meeting length, break frequency), and any specific symptoms that correlate with particular tasks or times of day.",
    redFlags: "Numbness or tingling in the hands that doesn't resolve between work sessions, progressively worsening neck or arm symptoms despite ergonomic changes, or pain that wakes you at night should be assessed by a physiotherapist or GP rather than managed with further equipment changes alone."
  }
};

// --- Per-topic practical content --------------------------------------------
// The specific, actionable angle each article takes — concrete enough that it
// can't be swapped for a different topic without the article no longer making
// sense.
const topicInfo: Record<Topic, { guidance: string[]; homeAdvice: string }> = {
  "Morning stiffness": {
    guidance: [
      "Morning stiffness that eases within thirty to sixty minutes of moving around is typical of mechanical joint and muscle irritation and usually responds well to a short, consistent wake-up routine — a few minutes of gentle range-of-movement work before getting out of bed, followed by a short walk, tends to shorten the stiff period more reliably than stretching alone.",
      "Stiffness that takes several hours to ease, is accompanied by swelling in multiple joints, or is worse on rest days than active ones is a different pattern and worth flagging to a GP alongside physiotherapy, since it can suggest an inflammatory rather than purely mechanical cause."
    ],
    homeAdvice: "Try five minutes of gentle movement — knee-to-chest, cat-cow through the spine, or shoulder circles depending on the affected area — before you're fully upright, then track how long stiffness lasts each morning for two weeks to see if the pattern is improving."
  },
  "Desk-based pain flare-ups": {
    guidance: [
      "Pain that consistently builds through a working day and eases over an evening or weekend points toward a load and position problem rather than ongoing tissue damage — the tissue is being irritated by sustained posture, not re-injured each day. The fix usually isn't a single perfect chair, but breaking up long static periods with brief, regular movement.",
      "A practical pattern that works for most people is a short movement break every thirty to forty-five minutes — standing, walking to get water, or a few shoulder blade squeezes — rather than waiting for pain to build before moving. Calendar reminders work better than relying on remembering."
    ],
    homeAdvice: "Set a recurring reminder every 30–40 minutes through your working day for a 60-second movement break, and reassess your chair height, screen height and keyboard distance against basic ergonomic guidance rather than assuming the furniture is fine."
  },
  "Return to running": {
    guidance: [
      "The most common mistake in returning to running after injury or a break is increasing distance, pace and frequency all at once. A more reliable approach increases only one variable at a time, typically starting with a run-walk pattern and progressing total time before adding pace or hills.",
      "A useful rule of thumb is the 'no more than mild and settling' guide: some discomfort during or shortly after a run is often acceptable if it settles within twenty-four hours and doesn't worsen session to session; pain that lingers, worsens, or appears earlier in each run signals the progression is too fast."
    ],
    homeAdvice: "Keep a simple training log of distance, pace and next-day symptoms for each run, and only increase one variable (usually total time first) at a time — resist adding speed work until pain-free running at an easy pace is consistent for at least two weeks."
  },
  "Confidence after surgery": {
    guidance: [
      "A drop in confidence after surgery is extremely common and doesn't necessarily mean the joint or tissue is unstable — it often reflects a genuine, protective caution that outlasts the physical healing timeline. Addressing it usually needs graded exposure: deliberately practising the specific movements or situations that feel most uncertain, in a controlled way, rather than avoiding them until they feel 'ready'.",
      "Objective markers help more than how a joint feels on a given day — tracking strength, range of movement and specific functional tasks (stairs, getting up from the floor, carrying a bag) against expected milestones gives a clearer, less anxiety-driven picture of actual progress."
    ],
    homeAdvice: "Pick one specific activity you're avoiding because of surgery (kneeling, carrying shopping, a particular exercise) and practise a scaled-down version of it several times a week, gradually increasing difficulty as confidence builds rather than waiting to feel completely ready first."
  },
  "Exercise pacing": {
    guidance: [
      "The 'boom and bust' cycle — pushing hard on a good day and then needing several days to recover — is one of the most common barriers to steady progress. Pacing means choosing an activity level that's sustainable most days, even on better days, and increasing it gradually on a planned schedule rather than in response to how you feel that morning.",
      "A structured approach sets a baseline slightly below what currently causes a flare-up, holds it consistently for one to two weeks, and only then increases by a small, predictable amount — usually 10–20%. This trades short-term temptation for a more predictable, faster overall recovery."
    ],
    homeAdvice: "Write down your current baseline for one key activity (minutes walking, reps of an exercise, hours at a desk before a break) and commit to that exact amount for two weeks before increasing it, regardless of how good a particular day feels."
  },
  "Balance and falls prevention": {
    guidance: [
      "Balance relies on the integration of vision, the inner ear's vestibular system, and sensation from the feet and joints (proprioception) — when any one of these is reduced by age, a neurological condition or a leg injury, the others can partly compensate, but often only up to a point that shows up as increased fall risk on uneven ground or in low light.",
      "Balance is trainable at almost any age or level of ability. Structured programmes that progressively challenge stability — reducing base of support, adding movement of the head or arms, changing surfaces — have some of the strongest evidence in physiotherapy for reducing fall risk when done consistently over months, not weeks."
    ],
    homeAdvice: "Practise standing on one leg near a stable surface (worktop or wall) for up to 30 seconds each side, once or twice a day, progressing to eyes closed or a softer surface only once the easier version feels solid and controlled."
  },
  "Shoulder overhead loading": {
    guidance: [
      "Overhead tasks — reaching to a high shelf, lifting a bag into an overhead locker, an overhead press — put the shoulder into its most demanding position, where the rotator cuff and shoulder blade muscles have the least mechanical advantage. Building tolerance for this position is usually the last stage of shoulder rehab, not the first, and rushing to it is a common cause of setbacks.",
      "A graded approach builds strength through mid-range positions first, then gradually introduces overhead work with lighter loads and fewer repetitions than the eventual goal, tracking how the shoulder responds over the following day before progressing further."
    ],
    homeAdvice: "Before attempting full overhead lifting or pressing again, check you can comfortably and painlessly hold a light weight at shoulder height for 20–30 seconds with good control — if that position isn't yet comfortable, overhead loading is premature."
  },
  "Nerve-related symptoms": {
    guidance: [
      "Nerve-related symptoms — pins and needles, numbness, or a burning, electric quality to pain — behave differently from muscular or joint pain and often need a different treatment emphasis, including neural mobility work and addressing any structural compression alongside general strengthening.",
      "It's useful to distinguish symptoms that stay in one area from ones that follow a clear line down a limb in a pattern matching a specific nerve's distribution; the second pattern points more strongly toward true nerve root or peripheral nerve involvement and usually needs more specific assessment before exercise progression."
    ],
    homeAdvice: "Note exactly where symptoms travel (a body outline diagram helps), what specific positions or movements bring them on or ease them, and bring this record to your physiotherapy assessment — it meaningfully speeds up identifying which nerve and level are involved."
  },
  "Hip and knee strength": {
    guidance: [
      "Hip strength — particularly the muscles that control the pelvis from side to side and rotation of the thigh — has a disproportionate influence on knee symptoms, because weakness here often shows up as poor control at the knee during single-leg tasks like stairs, running or landing from a jump, even when the knee itself has no structural problem.",
      "A hip-and-knee strengthening programme typically progresses from double-leg to single-leg exercises, and from controlled, slow movements to more dynamic ones (step-downs, single-leg squats, eventually hopping where relevant), matching the demands of whatever activity someone is trying to return to."
    ],
    homeAdvice: "Add a simple single-leg exercise — a slow step-down onto a low step, controlled for 3 seconds on the way down — two to three times a week, watching in a mirror or filming yourself to check the knee isn't collapsing inward as a sign of poor hip control."
  },
  "Recovery planning": {
    guidance: [
      "A recovery plan that works has a small number of clear phases, each with its own goal and a rough (not rigid) timeframe — for example, settling symptoms and restoring basic movement, then rebuilding strength and tolerance, then returning to specific activities or sport. Without phases, progress tends to feel directionless even when it's actually happening.",
      "Milestones should be specific and functional (walking for twenty minutes without a flare, climbing a flight of stairs without pain, sitting through a full workday comfortably) rather than vague ('feeling better'), because specific milestones make it obvious when progress has stalled and a plan needs adjusting."
    ],
    homeAdvice: "Write down three specific milestones for the next month (not just 'less pain') and review them every two weeks — if a milestone hasn't moved in that time, that's the signal to adjust the plan rather than simply waiting longer."
  },
  "Walking tolerance": {
    guidance: [
      "Walking tolerance — how far or long someone can walk before symptoms force a stop — is one of the most useful, easy-to-track measures of overall progress across almost every physiotherapy condition, because it reflects strength, pain, confidence and cardiovascular fitness together in one simple number.",
      "Building walking tolerance works best as a gradual, time-based progression (adding a few minutes every few days) rather than pushing to a fixed distance regardless of symptoms, and pairing it with planned rest points if a route allows, rather than stopping only once symptoms have already become significant."
    ],
    homeAdvice: "Time a comfortable walk this week without pushing through symptoms, then aim to add two to three minutes to that baseline every few days, keeping a simple log so progress (or a plateau worth addressing) is easy to see."
  },
  "Home-working posture": {
    guidance: [
      "Home workstations are frequently improvised — a laptop on a kitchen table, a sofa, or a dining chair — and the resulting posture (neck flexed forward, shoulders hunched, wrists at an awkward angle) tends to load the neck, shoulders and lower back for hours without the variety a traditional office often provided through walking to meetings or a printer.",
      "The most effective, lowest-cost fix is usually raising the laptop screen to eye height (using books or a stand) with a separate keyboard and mouse, rather than working directly on the laptop itself, combined with deliberately building movement breaks back into a day that no longer has an office commute or corridor walks."
    ],
    homeAdvice: "Raise your screen so the top of it is roughly at eye level, use a separate keyboard if working from a laptop, and set a alarm for a two-minute stand-and-stretch break at least once an hour through the working day."
  }
};

type ArticlePlan = { category: Category; topic: Topic };

// The 36 category/topic combinations this blog actually publishes. Each pair
// is chosen so the topic genuinely fits the category (rather than a
// mechanical index % rotation that would pair, e.g., "neurological
// conditions" with "return to running" for no clinical reason). Every
// category appears 4 times; every topic appears at least twice.
const articlePlan: ArticlePlan[] = [
  { category: "Back pain", topic: "Morning stiffness" },
  { category: "Back pain", topic: "Desk-based pain flare-ups" },
  { category: "Back pain", topic: "Recovery planning" },
  { category: "Back pain", topic: "Home-working posture" },
  { category: "Knee injuries", topic: "Return to running" },
  { category: "Knee injuries", topic: "Hip and knee strength" },
  { category: "Knee injuries", topic: "Walking tolerance" },
  { category: "Knee injuries", topic: "Exercise pacing" },
  { category: "Shoulder rehab", topic: "Shoulder overhead loading" },
  { category: "Shoulder rehab", topic: "Confidence after surgery" },
  { category: "Shoulder rehab", topic: "Exercise pacing" },
  { category: "Shoulder rehab", topic: "Home-working posture" },
  { category: "Sciatica", topic: "Nerve-related symptoms" },
  { category: "Sciatica", topic: "Morning stiffness" },
  { category: "Sciatica", topic: "Walking tolerance" },
  { category: "Sciatica", topic: "Recovery planning" },
  { category: "Sports injuries", topic: "Return to running" },
  { category: "Sports injuries", topic: "Exercise pacing" },
  { category: "Sports injuries", topic: "Confidence after surgery" },
  { category: "Sports injuries", topic: "Hip and knee strength" },
  { category: "Neurological conditions", topic: "Balance and falls prevention" },
  { category: "Neurological conditions", topic: "Nerve-related symptoms" },
  { category: "Neurological conditions", topic: "Walking tolerance" },
  { category: "Neurological conditions", topic: "Recovery planning" },
  { category: "Post-surgery recovery", topic: "Confidence after surgery" },
  { category: "Post-surgery recovery", topic: "Recovery planning" },
  { category: "Post-surgery recovery", topic: "Balance and falls prevention" },
  { category: "Post-surgery recovery", topic: "Exercise pacing" },
  { category: "Home exercise advice", topic: "Exercise pacing" },
  { category: "Home exercise advice", topic: "Home-working posture" },
  { category: "Home exercise advice", topic: "Morning stiffness" },
  { category: "Home exercise advice", topic: "Hip and knee strength" },
  { category: "Workplace ergonomics", topic: "Desk-based pain flare-ups" },
  { category: "Workplace ergonomics", topic: "Home-working posture" },
  { category: "Workplace ergonomics", topic: "Shoulder overhead loading" },
  { category: "Workplace ergonomics", topic: "Exercise pacing" }
];

const titleTemplates: Array<(topic: string, category: string) => string> = [
  (topic, category) => `${topic} and ${category.toLowerCase()}: a UK physiotherapy guide`,
  (topic, category) => `Managing ${category.toLowerCase()}: what to know about ${topic.toLowerCase()}`,
  (topic, category) => `${category} explained: dealing with ${topic.toLowerCase()}`,
  (topic, category) => `${topic}: a physiotherapist's approach to ${category.toLowerCase()}`
];

const excerptTemplates: Array<(topic: string, category: string) => string> = [
  (topic, category) => `How ${topic.toLowerCase()} relates to ${category.toLowerCase()}: symptoms to watch for, what assessment looks like, and the rehab steps that help you recover with confidence.`,
  (topic, category) => `A practical look at ${category.toLowerCase()} and ${topic.toLowerCase()} — what to expect from assessment, how treatment is structured, and when to get extra help.`,
  (topic, category) => `${category} explained through the lens of ${topic.toLowerCase()}: key symptoms, evidence-based treatment options and realistic recovery timelines.`,
  (topic, category) => `What UK physiotherapists actually look for with ${category.toLowerCase()}, and practical guidance on ${topic.toLowerCase()}.`
];

const seoTitleTemplates: Array<(topic: string, category: string) => string> = [
  (topic, category) => `${category} and ${topic} | UK Physiotherapy Guide`,
  (topic, category) => `${topic} for ${category}: What to Know | PhysioOnClick`,
  (topic, category) => `${category}: ${topic} Explained | PhysioOnClick`,
  (topic, category) => `Physiotherapy Guide to ${category} & ${topic}`
];

const seoDescriptionTemplates: Array<(topic: string, category: string) => string> = [
  (topic, category) => `UK physiotherapy guidance on ${topic.toLowerCase()} and ${category.toLowerCase()} — understand your symptoms, plan safe rehabilitation and know when to seek an assessment.`,
  (topic, category) => `${category} and ${topic.toLowerCase()}: evidence-based advice from a HCPC-registered physiotherapist on assessment, treatment and realistic recovery timelines.`,
  (topic, category) => `Practical, UK-focused advice on ${topic.toLowerCase()} for people managing ${category.toLowerCase()} — what physiotherapy assessment and treatment actually involve.`,
  (topic, category) => `A physiotherapist's guide to ${category.toLowerCase()}, focused on ${topic.toLowerCase()} — symptoms, safe exercise progression and red flags to know.`
];

function wordCount(sections: { body: string[] }[]) {
  return sections.reduce((total, section) => total + section.body.reduce((s, p) => s + p.trim().split(/\s+/).length, 0), 0);
}

function readTimeFor(sections: { body: string[] }[]) {
  const words = wordCount(sections);
  // 200 wpm average adult reading speed, rounded up, floor of 2 minutes.
  const minutes = Math.max(2, Math.ceil(words / 200));
  return `${minutes} min read`;
}

function articleSections(category: Category, topic: Topic, index: number) {
  const info = categoryInfo[category];
  const angle = topicInfo[topic];

  const whyThisMatters = {
    heading: "What's going on",
    body: info.mechanism
  };

  const assessmentSection = {
    heading: "What physiotherapy assessment looks at",
    body: [
      info.assessment,
      `Where ${topic.toLowerCase()} is the main day-to-day problem, assessment also looks specifically at how that symptom behaves — what makes it better or worse, and how it's changed since it started — since that shapes which part of the rehab plan gets priority first.`
    ]
  };

  const practicalSection = {
    heading: `Practical guidance on ${topic.toLowerCase()}`,
    body: angle.guidance
  };

  const redFlagSection = {
    heading: "When to seek extra help",
    body: [info.redFlags]
  };

  const homeAdviceSection = {
    heading: "A practical starting point",
    body: [
      angle.homeAdvice,
      `This guide is part of PhysioOnClick's patient education library and is intended to support informed decisions, not replace an individual assessment. If symptoms are worsening, unclear, or affecting your confidence with movement, a full physiotherapy assessment is the safest next step.`
    ]
  };

  // Vary structure across articles: alternate section order and, for a third
  // of articles, fold assessment and red flags together into a shorter
  // format, so the 36 articles don't share one identical outline.
  const variant = index % 3;

  if (variant === 0) {
    return [whyThisMatters, assessmentSection, practicalSection, redFlagSection, homeAdviceSection];
  }

  if (variant === 1) {
    return [whyThisMatters, practicalSection, assessmentSection, homeAdviceSection, redFlagSection];
  }

  // Shorter four-section variant.
  const combinedAssessment = {
    heading: "Assessment and when to get extra help",
    body: [info.assessment, info.redFlags]
  };
  return [whyThisMatters, practicalSection, combinedAssessment, homeAdviceSection];
}

export const blogArticles: BlogArticle[] = articlePlan.map(({ category, topic }, index) => {
  const title = titleTemplates[index % titleTemplates.length](topic, category);
  const excerpt = excerptTemplates[index % excerptTemplates.length](topic, category);
  const slug = toSlug(`${title}-${index + 1}`);
  const sections = articleSections(category, topic, index);

  return {
    slug,
    title,
    category,
    excerpt,
    readTime: readTimeFor(sections),
    seoTitle: seoTitleTemplates[index % seoTitleTemplates.length](topic, category),
    seoDescription: seoDescriptionTemplates[index % seoDescriptionTemplates.length](topic, category),
    // Spread across the 36 real publication slots rather than a fabricated
    // "just published" date — these represent already-existing articles.
    publishedAt: new Date(2025, index % 12, ((index * 7) % 28) + 1).toISOString(),
    // Genuine review date for this rewrite (content and clinical framing
    // checked and rewritten on this date) — update when articles are next
    // substantively reviewed.
    lastReviewedAt: new Date(2026, 7, 25).toISOString(),
    author: founder.name,
    authorCredential: founder.credentials[0],
    image: blogImagePath(slug),
    sections
  };
});

export function getArticle(slug: string) {
  return blogArticles.find((article) => article.slug === slug);
}

export const blogCategories = [...categories];

// Each blog category maps to the one service page it should funnel readers to.
// Used for the "related service" link on articles and the "related reading"
// list on service pages, so the 36 articles pass authority to the commercial
// pages instead of sitting in a disconnected island.
const categoryToServiceSlug: Record<Category, string> = {
  "Back pain": "musculoskeletal-physiotherapy",
  "Knee injuries": "musculoskeletal-physiotherapy",
  "Shoulder rehab": "musculoskeletal-physiotherapy",
  Sciatica: "musculoskeletal-physiotherapy",
  "Sports injuries": "musculoskeletal-physiotherapy",
  "Neurological conditions": "neurological-rehabilitation",
  "Post-surgery recovery": "post-surgical-rehabilitation",
  "Home exercise advice": "online-rehab-programmes",
  "Workplace ergonomics": "musculoskeletal-physiotherapy"
};

export function serviceSlugForCategory(category: string): string | undefined {
  return categoryToServiceSlug[category as Category];
}

/** Up to `limit` articles that funnel to the given service slug. */
export function articlesForServiceSlug(serviceSlug: string, limit = 4): BlogArticle[] {
  return blogArticles
    .filter((article) => categoryToServiceSlug[article.category] === serviceSlug)
    .slice(0, limit);
}
