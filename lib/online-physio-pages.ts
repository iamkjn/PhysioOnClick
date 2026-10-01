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
  {
    slug: "low-back-pain",
    name: "Lower back pain",
    h1: "Online physiotherapy for lower back pain",
    seoTitle: "Online Physiotherapy for Back Pain | PhysioOnClick",
    seoDescription:
      "How a video physio appointment works for lower back pain: what we check, what a plan of exercise and advice involves, and when you need urgent care in person.",
    answer:
      "If your lower back pain fits, a video appointment lets your physiotherapist ask about your pain, watch how you bend and move, and set up an exercise and advice plan you follow at home. We screen for red flags first. Weakness or numbness in both legs, numbness around your genitals or anus, or bladder or bowel changes need emergency care in person, not a video call.",
    howOnlineWorks: [
      "Lower back pain is a good example of a problem where the story matters as much as any hands-on test. On video we spend the first part of the appointment on how it started, what the pain does through the day, what it stops you doing and what you are worried about. Then we ask you to show us the movements that bother you, from bending to pick something up to getting out of a chair.",
      "Because you are at home, we can look at the real setting. Your bed, your desk chair, the car seat you sit in for the commute and the way you lift a laundry basket are all things we can talk through with you in the room where they happen. Our advice is built around that, so it is easier to carry out the next morning.",
      "NICE guidance on low back pain and sciatica encourages people to continue with normal activities, and lists exercise among its recommended non-invasive options. It also says imaging should not routinely be offered in a non-specialist setting. In our plans that means a scan is not a starting requirement, and movement and graded exercise sit at the centre of what we ask you to do.",
      "If your leg pain is the main problem rather than the back itself, our page on [online physiotherapy for sciatica](/online-physiotherapy-for/sciatica) covers that separately. Here we stay with pain that is mostly in the back.",
      "A video call has limits. We cannot feel the muscles or joints of your spine, and NICE says manual therapy should only be given as part of a package that includes exercise. If your picture does not fit what we can safely assess by video, we will say so and point you to the right in-person care.",
    ],
    assessmentChecks: [
      "When the pain began, whether it followed a particular movement or came on gradually, and how it has changed since.",
      "How far you can bend forward, lean back and to each side, and whether any direction feels easier or harder than the other.",
      "How you move from sitting to standing, get on and off the floor, and walk across the room, to see how freely your back and hips are working.",
      "What makes the pain worse and what eases it across a normal day, including sitting, standing, lying and work tasks.",
      "How the pain affects sleep, work, exercise and mood, and what you have already tried.",
      "The red flag questions listed below, which we ask before anything else, because they decide whether a video appointment is the right place for you to be.",
    ],
    typicalPlan: [
      "Most plans begin with a short explanation of what is going on, advice on staying active, and a few simple movements chosen after we have watched how your back moves. From there we add strengthening for the trunk, hips and legs, and a walking or activity routine that you build up at your own pace.",
      "In our plans for lower back pain, a typical course is 3 to 6 sessions over 4 to 8 weeks. The first is a 60-minute video assessment at {INITIAL_PRICE}, and follow-ups are 30 minutes at {FOLLOW_UP_PRICE}. The numbers are a guide, not a promise, and we review progress with you at each follow-up instead of booking a block up front.",
      "NICE recommends that manual therapy is not given on its own, and that it should be part of a package that includes exercise. Because a video appointment has no hands-on element at all, exercise and advice are the whole of our approach. If you want a clinician to treat the area by hand, a video service will not be the right fit.",
      "For questions about cost, referrals and insurance, our guide to [private physiotherapy cost in the UK](/guides/private-physiotherapy-cost-uk) is a good place to start, and we cannot promise that any insurer will pay, so check with yours before you book.",
    ],
    timeline:
      "The NHS says back pain often improves on its own within a few weeks and advises staying active. If yours is not improving after that, or it is getting worse, speak to a GP or book a review with us so that we can look again at what the plan should be.",
    inPersonInstead: [
      "Call 999 or go to A&E if you have back pain and pain, tingling, weakness or numbness in both legs.",
      "Call 999 or go to A&E if you have a loss of feeling around your genitals or anus.",
      "Call 999 or go to A&E if you have changes in your bladder or bowels, such as difficulty peeing, or peeing or pooing yourself.",
      "Call 999 or go to A&E if you have back pain with chest pain, or changes in sexual feeling or function.",
      "Call 999 or go to A&E if your back pain started after a serious accident.",
      "Do not drive yourself to A&E for any of the above. Ask someone to drive you, or call 999.",
    ],
    faqs: [
      {
        q: "Can lower back pain be treated by video?",
        a: "Our video appointments cover your history, how you move and a plan of exercise and advice, and NICE lists exercise among its recommended options for low back pain. We cannot examine you by hand, and if we think you need that, tests or a doctor, we will tell you plainly.",
      },
      {
        q: "Will I need a scan first?",
        a: "No. NICE advises that imaging is not routinely offered in a non-specialist setting for low back pain, and we do not ask for a scan before an assessment. If your symptoms suggest you need further tests, we will explain why and suggest you speak to your GP.",
      },
      {
        q: "Should I stay in bed if my back is sore?",
        a: "NICE encourages people to continue their normal activities, and the NHS advises staying active. We help you work out how much to do, what to ease off for now and how to build back up without setting the pain off again.",
      },
      {
        q: "What if I have pain down my leg as well?",
        a: "Leg pain with back pain is common and we ask about it at the start. We cover that picture on our [sciatica page](/online-physiotherapy-for/sciatica). Tell us if you notice weakness or numbness, because some patterns need urgent care in person.",
      },
      {
        q: "Do I need a GP referral for physiotherapy?",
        a: "You can book with us directly. Whether your insurer needs a GP referral depends on your policy, so check with them before booking. Our guide on [GP referral for physiotherapy](/guides/do-i-need-a-gp-referral-for-physiotherapy) explains the options.",
      },
    ],
    sources: [
      {
        label: "NICE NG59: Low back pain and sciatica in over 16s, recommendations",
        url: "https://www.nice.org.uk/guidance/ng59/chapter/Recommendations",
      },
      { label: "NHS: Back pain", url: "https://www.nhs.uk/conditions/back-pain/" },
    ],
    exerciseHubSlug: "low-back-pain",
    selfTestSlugs: ["straight-leg-raise-self-check"],
    guideSlugs: [
      "private-physiotherapy-cost-uk",
      "do-i-need-a-gp-referral-for-physiotherapy",
      "how-many-physiotherapy-sessions-do-i-need",
    ],
    serviceSlug: "musculoskeletal-physiotherapy",
    // Placeholder until Shivaliba Zala signs off docs/seo/phase-b-clinical-review.md - set to the real sign-off date before any production deploy (drives the byline, JSON-LD lastReviewed and sitemap lastModified).
    reviewedOn: "2026-10-01",
  },
  {
    slug: "neck-pain",
    name: "Neck pain",
    h1: "Online physiotherapy for neck pain",
    seoTitle: "Online Physiotherapy for Neck Pain | PhysioOnClick",
    seoDescription:
      "How a video physio consultation works for neck pain: what we look at on camera, the exercises and advice in a typical plan, and symptoms that need urgent care.",
    answer:
      "If your neck pain fits, a video consultation lets your physiotherapist watch how your neck and shoulders move, ask about your daily set-up and give you exercises to do at home. It is not the right route if you have arm weakness or numbness in both arms, balance changes, dizziness or visual symptoms with neck movement, or neck pain after an injury.",
    howOnlineWorks: [
      "Neck pain often shows up in how you hold and turn your head, and a camera is well placed to see that. We ask you to sit side-on and then face-on to the screen so that we can watch you turn, tilt and look up and down, and see how your shoulders and upper back share the work.",
      "Your own space is part of the assessment. We ask you to show us how you sit at your desk, where your screen is, how you hold your phone and what your pillow set-up looks like. Changes to those are easy to try straight away, and you can tell us in the same call whether they made a difference.",
      "The NHS advises trying neck flexibility exercises and says not to wear a neck collar. In our plans, that means gentle, regular movement is where we start, and we show you each exercise on camera so that we can correct it as you do it.",
      "Some neck problems need a different route. The NHS says to see a GP if neck pain does not go away after a few weeks, or if you have pins and needles or a cold arm. We cannot touch your neck by video or order tests, so if what you describe needs a hands-on check or investigation, we will say so and help you decide where to go.",
      "NHS England describes remote physiotherapy as suitable for people who do not need an in-person physical examination. We use that as our starting question for every neck appointment.",
    ],
    assessmentChecks: [
      "How far you can turn your head each way, tilt it to each side and look up and down, and whether the movement is smooth or catches.",
      "A [chin tuck and rotation check](/exercises/tests/chin-tuck-rotation-check) done on camera, so that we can see how your head and neck move together.",
      "How you sit and stand, including how your head sits over your shoulders and how your shoulders move when you raise your arms.",
      "Whether pain stays in the neck, spreads to the shoulder or arm, or comes with pins and needles, and whether that is changing.",
      "How your work set-up, phone use, sleeping position and stress levels fit with when the pain is worst.",
      "The red flag questions below, including balance, dizziness, vision and any recent injury, which we ask at the start of every appointment.",
    ],
    typicalPlan: [
      "A first plan for neck pain is usually short. We give you two or three gentle movements to repeat through the day, a change or two to your desk or sleeping set-up, and a plan for gradually adding strengthening for the neck, shoulders and upper back as the pain settles.",
      "In our plans a typical course for neck pain is 2 to 5 sessions across 3 to 6 weeks. The first is a 60-minute video assessment at {INITIAL_PRICE}, and follow-ups are 30 minutes at {FOLLOW_UP_PRICE}. That is a rough guide. Some people need only a couple of appointments and some need longer, and we review it as we go.",
      "Because we cannot do hands-on treatment, nothing in your plan depends on us touching your neck. Everything we give you is something you do yourself, which means you keep it going between sessions and after you finish.",
      "If your arm symptoms are the main issue, or they are not following the pattern we expect from the start, we will tell you honestly and discuss whether a GP review is the better next step.",
    ],
    timeline:
      "According to the NHS, most neck pain only lasts a few weeks. If it has not gone after a few weeks, or it is getting worse, see a GP rather than waiting, and let us know if you are already working with us.",
    inPersonInstead: [
      "Get in-person medical care straight away if you have weakness or numbness in both arms.",
      "Get in-person medical care straight away if you notice changes in your balance or co-ordination.",
      "Get in-person medical care straight away if your neck pain started after an accident or injury.",
      "Get in-person medical care straight away if you have dizziness or visual symptoms when you move your neck.",
      "See a GP if you have pins and needles, or an arm that feels cold, or if your neck pain has not gone after a few weeks.",
      "If you are not sure whether your symptoms are urgent, call 111 or speak to a GP rather than waiting for a video appointment.",
    ],
    faqs: [
      {
        q: "Can neck pain be assessed over video?",
        a: "We can ask about your symptoms, watch your neck and shoulders move and check your set-up, then give you exercises. We cannot examine you by hand, and certain symptoms need in-person care. We screen for them at the start and will tell you if a video appointment is not right.",
      },
      {
        q: "Should I wear a neck collar?",
        a: "The NHS advises against wearing a neck collar for neck pain. We will talk you through gentle movement and what to avoid for now, based on what we see on camera.",
      },
      {
        q: "How long will my neck pain last?",
        a: "The NHS says most neck pain only lasts a few weeks. We cannot give you an exact timeline, but we review how it is going at each appointment and will suggest seeing a GP if it is not settling.",
      },
      {
        q: "What if I get pins and needles in my arm?",
        a: "Tell us at booking and at the start of the session. The NHS says to see a GP for pins and needles or a cold arm. Weakness or numbness in both arms needs in-person medical care straight away and is not suited to a video appointment.",
      },
    ],
    sources: [
      { label: "NHS: Neck pain", url: "https://www.nhs.uk/symptoms/neck-pain-and-stiff-neck/" },
      {
        label: "NHS England: Guide to adopting remote consultations in adult MSK physiotherapy services",
        url: "https://www.england.nhs.uk/long-read/guide-to-adopting-remote-consultations-in-adult-musculoskeletal-physiotherapy-services/",
      },
    ],
    exerciseHubSlug: "neck-pain",
    selfTestSlugs: ["chin-tuck-rotation-check"],
    guideSlugs: ["can-a-physio-diagnose-over-video", "what-online-physiotherapy-cannot-do"],
    serviceSlug: "musculoskeletal-physiotherapy",
    // Placeholder until Shivaliba Zala signs off docs/seo/phase-b-clinical-review.md - set to the real sign-off date before any production deploy (drives the byline, JSON-LD lastReviewed and sitemap lastModified).
    reviewedOn: "2026-10-01",
  },
  {
    slug: "shoulder-pain",
    name: "Shoulder pain",
    h1: "Online physiotherapy for shoulder pain",
    seoTitle: "Online Physiotherapy for Shoulder Pain | PhysioOnClick",
    seoDescription:
      "How video physiotherapy works for shoulder pain: the movements we check on camera, what an exercise plan involves, and when to get urgent in-person care.",
    answer:
      "If your shoulder pain fits, a video appointment lets your physiotherapist watch you lift and rotate your arm, try a few self-checks, and plan exercises you do at home. It is not suitable after a dislocation, or after a fall where you cannot lift your arm. Sudden or very bad shoulder pain needs urgent medical help, not a video call.",
    howOnlineWorks: [
      "A shoulder is a joint you can watch working. On video we see how high your arm goes, whether your shoulder blade moves with it and where in the movement the pain starts. We ask you to move both sides, so we can compare your sore shoulder with your other one.",
      "Most of what we learn comes from a handful of simple movements. You reach overhead, out to the side and behind your back, and we watch for where the movement stops or the pain kicks in. We also ask you to try a few self-checks, such as the [painful arc self-check](/exercises/tests/painful-arc-self-check), if it is safe for you.",
      "The NHS advises trying shoulder exercises for 6 to 8 weeks to stop pain returning and lists physiotherapy as an option. Our approach is to give you a small set of exercises, show each one on camera, and then adjust the load and the range as your shoulder responds.",
      "Frozen shoulder is a separate picture, with its own plan and pace. We mention it here only so you know it exists. If you think frozen shoulder may be your problem, read our article on [online physiotherapy for frozen shoulder](/blog/online-physiotherapy-for-frozen-shoulder).",
      "Video has limits for the shoulder. We cannot feel the joint or test it by hand, and we cannot scan it. If we think you need an examination, imaging or a doctor, we will tell you and help you decide where to go.",
    ],
    assessmentChecks: [
      "How high you can lift your arm forward and out to the side, on both sides, and where the pain starts or stops you.",
      "The [painful arc self-check](/exercises/tests/painful-arc-self-check), where we watch whether pain shows up in a certain part of the lift.",
      "The [Hawkins-Kennedy test](/exercises/tests/hawkins-kennedy-test) and [full can test](/exercises/tests/full-can-test) as guided self-checks, to see how your shoulder reacts to different positions.",
      "How you reach behind your back and across your body, which tells us about stiffness and about how the shoulder blade is moving.",
      "What triggers the pain in daily life, such as reaching a shelf, putting on a coat, lying on that side or carrying shopping.",
      "The red flag questions below, including any recent dislocation or fall, which we ask at the start of every appointment.",
    ],
    typicalPlan: [
      "Plans for shoulder pain usually start with advice on what to keep doing and what to ease off for now, followed by controlled exercises for the rotator cuff muscles and shoulder blade. As the shoulder copes better, we add reaching, lifting and the particular movements your work or sport needs.",
      "In our plans a typical course for shoulder pain is 4 to 6 sessions across 6 to 10 weeks. The first is a 60-minute video assessment at {INITIAL_PRICE}, and follow-ups are 30 minutes at {FOLLOW_UP_PRICE}. This is a guide only, and we review it with you at each follow-up.",
      "The plan relies on you doing the exercises regularly. The NHS suggests 6 to 8 weeks of shoulder exercises, so we talk early about how to fit them into your day and how to tell whether your shoulder is coping.",
      "Our [rotator cuff exercise library](/exercises/for/rotator-cuff-tendinopathy) shows exercises you may be given, and you can read how our approach compares with other options in [what online physiotherapy cannot do](/guides/what-online-physiotherapy-cannot-do).",
    ],
    timeline:
      "The NHS says to try shoulder exercises for 6 to 8 weeks to help stop shoulder pain coming back. Frozen shoulder is different. The NHS describes it as painful and stiff for months, and sometimes years. If your shoulder is not improving, or is getting worse, speak to a GP.",
    inPersonInstead: [
      "Get in-person medical care straight away if your shoulder has come out of its socket or you think you have dislocated it.",
      "Get in-person medical care straight away if you fell and now cannot lift your arm.",
      "Get in-person medical care straight away if you have chest pain or breathlessness along with shoulder pain.",
      "Get urgent help from a GP or by calling 111 if your shoulder pain is sudden or very bad.",
      "If you are not sure how urgent your symptoms are, call 111 or speak to a GP before booking a video appointment.",
    ],
    faqs: [
      {
        q: "Can shoulder pain be assessed by video?",
        a: "A lot of shoulder assessment is watching movement, which a camera does well. You show us how you lift, reach and rotate, and we choose exercises from that. We cannot examine or scan the joint, and we will tell you if you need that or need to be seen in person.",
      },
      {
        q: "How long should I do shoulder exercises for?",
        a: "The NHS says to try shoulder exercises for 6 to 8 weeks to stop the pain returning. We build your plan around that kind of timeframe and check in with you along the way to see how the shoulder is responding.",
      },
      {
        q: "I think I have a frozen shoulder. Is this the right page?",
        a: "Frozen shoulder has its own page in our blog, which you can find at [online physiotherapy for frozen shoulder](/blog/online-physiotherapy-for-frozen-shoulder). The NHS says physiotherapy can help you get movement back. This page is for other shoulder pain, such as pain on lifting your arm.",
      },
      {
        q: "When should I go to A&E or see someone in person?",
        a: "Get in-person medical care straight away after a dislocation, after a fall where you cannot lift your arm, or if you have chest pain or breathlessness. For sudden or very bad shoulder pain, get urgent help from a GP or call 111.",
      },
    ],
    sources: [
      { label: "NHS: Shoulder pain", url: "https://www.nhs.uk/symptoms/shoulder-pain/" },
      { label: "NHS: Frozen shoulder", url: "https://www.nhs.uk/conditions/frozen-shoulder/" },
    ],
    exerciseHubSlug: "rotator-cuff-tendinopathy",
    selfTestSlugs: ["full-can-test", "hawkins-kennedy-test", "painful-arc-self-check"],
    blogSlugs: ["online-physiotherapy-for-frozen-shoulder"],
    guideSlugs: ["what-online-physiotherapy-cannot-do", "can-a-physio-diagnose-over-video"],
    serviceSlug: "musculoskeletal-physiotherapy",
    // Placeholder until Shivaliba Zala signs off docs/seo/phase-b-clinical-review.md - set to the real sign-off date before any production deploy (drives the byline, JSON-LD lastReviewed and sitemap lastModified).
    reviewedOn: "2026-10-01",
  },
  {
    slug: "knee-pain",
    name: "Knee pain",
    h1: "Online physiotherapy for knee pain",
    seoTitle: "Online Physiotherapy for Knee Pain | PhysioOnClick",
    seoDescription:
      "Remote physiotherapy for knee pain and knee osteoarthritis: what the PEAK trial found, what we check on video, and when you need to be seen in person.",
    answer:
      "For long-lasting knee pain that fits osteoarthritis, a video appointment lets your physiotherapist watch you squat and step, then set up a strengthening and activity plan. A 2024 trial found video care was non-inferior to in-person care for this group. A locked, giving-way or hot swollen knee needs to be seen in person.",
    howOnlineWorks: [
      "The strongest evidence for physiotherapy by video is in knee osteoarthritis. The PEAK trial, published in The Lancet in 2024, enrolled 394 adults with chronic knee pain consistent with osteoarthritis at 27 clinics in Australia. Both groups had five consultations over three months covering strengthening, physical activity and education. Video care was non-inferior to in-person care for pain and for function at three months.",
      "That finding is specific. It covers adults with chronic knee pain consistent with osteoarthritis in that trial, not every knee problem, and it does not describe our service. We mention it because it tells you what the research most clearly supports, and our plans for knee osteoarthritis follow the same ground: exercise, activity and education.",
      "NICE guidance on osteoarthritis lists therapeutic exercise, and weight management where appropriate, as core treatments, with information and support. Our plans start there. On camera we watch how you rise from a chair, climb a step and lower into a squat, and we use what we see to choose exercises for the muscles around your knee.",
      "Knee pain has other causes, and we ask about them. If your pain is mainly at the front of the knee, we assess that too, using the [single leg decline squat check](/exercises/tests/single-leg-decline-squat-check) where it is safe for you to try.",
      "We cannot feel your knee or test its ligaments by hand. If you have had an injury, or the knee locks or gives way, we will ask you to be seen in person instead.",
    ],
    assessmentChecks: [
      "Where the pain is felt, whether at the front, the sides or all around the joint, and what brings it on, such as stairs, walking or sitting for long.",
      "How you stand up from a chair, step up and down from a step, and lower into a squat, with attention to how the knee tracks over your foot.",
      "The [single leg decline squat check](/exercises/tests/single-leg-decline-squat-check), if you can do it safely, which shows how the knee copes with load.",
      "Swelling and stiffness in the knee, how much it limits walking, and how it affects sleep, work and leisure.",
      "Your current activity levels, any weight-management goals you want help with, and how your hip and ankle move.",
      "The red flag questions below, including locking, giving way after an injury and a hot swollen joint, which we ask at the start of every appointment.",
    ],
    typicalPlan: [
      "A knee plan centres on strengthening the thigh, hip and calf muscles in steps, with advice on pacing activity and what to do on sore days. We show you each exercise on camera and give you a small number to start with, so that the plan is not so big that you stop doing it.",
      "In our plans a typical course for knee pain is 4 to 6 sessions across 8 to 12 weeks. The first is a 60-minute video assessment at {INITIAL_PRICE}, and follow-ups are 30 minutes at {FOLLOW_UP_PRICE}. That is a guide only. In PEAK, both groups had five consultations over three months, but that was a research design and we do not treat it as a promise for you.",
      "The NHS advises that more severe osteoarthritis may need a structured exercise plan with a physiotherapist, and suggests aiming for 150 minutes of moderate activity a week plus strength exercises. We talk about how to build toward that in a way that your knee tolerates.",
      "NICE says not to offer acupuncture or dry needling for osteoarthritis, and not to offer glucosamine or strong opioids. Nothing in our service involves needles, and we do not prescribe medicines. If you have questions about medicines, speak to your GP or pharmacist.",
    ],
    timeline:
      "Our aim is a plan that gets you moving and that you can keep going. In PEAK, results were measured at three months. Knee pain from other causes can behave differently, and we review your progress with you and say so if the plan needs to change.",
    inPersonInstead: [
      "Get in-person medical care straight away if your knee joint is hot and swollen.",
      "Get in-person medical care straight away if your knee locks and will not bend or straighten.",
      "Get in-person medical care straight away if your knee gives way after an injury.",
      "Call 111 if your knee pain is very bad.",
      "If you are not sure how urgent your symptoms are, call 111 or speak to a GP before booking a video appointment.",
    ],
    faqs: [
      {
        q: "Does online physio work for knee osteoarthritis?",
        a: "The PEAK trial in The Lancet (2024) found video physiotherapy was non-inferior to in-person care for pain and function at three months in adults with chronic knee pain consistent with osteoarthritis. That applies to that group and trial, not to every knee problem, and we cannot promise the same result for you.",
      },
      {
        q: "What does NICE recommend for knee osteoarthritis?",
        a: "NICE guidance on osteoarthritis says the core treatments are therapeutic exercise and weight management where appropriate, with information and support. It says not to offer acupuncture or dry needling, glucosamine or strong opioids.",
      },
      {
        q: "Can you help with pain at the front of my knee?",
        a: "Yes, we assess it on video, including how the knee moves on stairs and squats. We cannot examine the joint by hand, so if a diagnosis is uncertain or you have had an injury, we will tell you plainly and suggest in-person care.",
      },
      {
        q: "Should I stop exercising if my knee hurts?",
        a: "Not necessarily. The NHS suggests regular activity and strength exercises for osteoarthritis, and our plans pace them to your knee. If your knee locks, gives way after an injury, or becomes hot and swollen, get in-person medical care straight away.",
      },
    ],
    sources: [
      {
        label: "NICE NG226: Osteoarthritis in over 16s, recommendations",
        url: "https://www.nice.org.uk/guidance/ng226/chapter/Recommendations",
      },
      {
        label: "Hinman et al., PEAK trial, The Lancet 2024: telerehabilitation versus in-person for chronic knee pain",
        url: "https://doi.org/10.1016/S0140-6736(23)02630-2",
      },
      { label: "NHS: Osteoarthritis", url: "https://www.nhs.uk/conditions/osteoarthritis/" },
      { label: "NHS: Knee pain", url: "https://www.nhs.uk/symptoms/knee-pain/" },
    ],
    exerciseHubSlug: "knee-osteoarthritis",
    selfTestSlugs: ["single-leg-decline-squat-check"],
    guideSlugs: ["does-online-physiotherapy-work", "can-a-physio-diagnose-over-video"],
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
