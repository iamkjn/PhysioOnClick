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
import { PHASE_BC_REVIEWED_ON } from "@/lib/clinical-signoff";

export type OnlinePhysioPage = {
  slug: string;
  name: string;
  /** How the condition reads mid-sentence ("Parkinson's", "knee replacement"). Defaults to name.toLowerCase() when omitted. */
  nameInSentence?: string;
  /** Schema.org type and name for JSON-LD `about`. Defaults to MedicalCondition + name. */
  about?: { type: "MedicalCondition" | "SurgicalProcedure"; name: string };
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
  /** When false, onlinePhysioPageForHub skips this page (the hub is shown on the page but the hub does not link back). Default true. */
  hubBacklink?: boolean;
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
      "How many sessions you need for sciatica is not something we can say before we have seen you. It depends on your condition; your physiotherapist will give you an estimate after your assessment. The first is a 60-minute video assessment at {INITIAL_PRICE}, and follow-ups are 30 minutes at {FOLLOW_UP_PRICE}. We review the estimate with you at each follow-up rather than booking a block in advance.",
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
      "If weakness in one leg is getting worse: go to A&E now, or call NHS 111 straight away if you are not sure where to go. Do not drive yourself if you feel very unwell.",
      "NICE guidance on low back pain and sciatica asks clinicians to rule out specific causes, such as cancer, infection, an injury or inflammatory disease. If you are worried your symptoms could have one of these causes, speak to your GP before booking.",
    ],
    faqs: [
      {
        q: "Can sciatica be treated online?",
        a: "A video assessment lets us ask about your symptoms and watch you move, and in our plans the treatment is mainly advice and exercise you do at home. We will tell you if you need to be seen in person. Over video, we cannot examine you hands-on, and red flag symptoms need emergency care in person. We screen for those at the start of your assessment.",
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
        a: "Tell us at booking and at the start of the session. Numbness or weakness in both legs, numbness around your genitals or bottom, or bladder or bowel changes need A&E or a 999 call, not a video appointment. If weakness in one leg is getting worse, go to A&E now, or call NHS 111 straight away if you are not sure where to go.",
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
    reviewedOn: PHASE_BC_REVIEWED_ON,
  },
  {
    slug: "low-back-pain",
    name: "Lower back pain",
    h1: "Online physiotherapy for lower back pain",
    seoTitle: "Online Physiotherapy for Back Pain | PhysioOnClick",
    seoDescription:
      "How a video physio appointment works for lower back pain: what we check, what a plan of exercise and advice involves, and when you need urgent care in person.",
    answer:
      "If your lower back pain fits, a video appointment lets your physiotherapist ask about your pain, watch how you bend and move, and set up an exercise and advice plan you follow at home. Call 999 or go to A&E, instead of booking, if you have weakness or numbness in both legs, numbness around your genitals or anus, or bladder or bowel changes. See the full list below.",
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
      "We do not set a number of sessions for lower back pain in advance. It depends on your condition; your physiotherapist will give you an estimate after your assessment. The first is a 60-minute video assessment at {INITIAL_PRICE}, and follow-ups are 30 minutes at {FOLLOW_UP_PRICE}. We review progress with you at each follow-up instead of booking a block up front.",
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
      "NICE guidance on low back pain asks clinicians to think about other causes first, such as cancer, infection, an injury or inflammatory disease. If you think your back pain could be linked to one of these, see your GP before you book with us.",
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
    reviewedOn: PHASE_BC_REVIEWED_ON,
  },
  {
    slug: "neck-pain",
    name: "Neck pain",
    h1: "Online physiotherapy for neck pain",
    seoTitle: "Online Physiotherapy for Neck Pain | PhysioOnClick",
    seoDescription:
      "How a video physio consultation works for neck pain: what we look at on camera, the exercises and advice in a typical plan, and symptoms that need urgent care.",
    answer:
      "If your neck pain fits, a video consultation lets your physiotherapist watch how your neck and shoulders move, ask about your daily set-up and give you exercises to do at home. It is not the right route if you have arm weakness or numbness, balance changes, dizziness or visual symptoms, or neck pain after an injury. Those need 999, A&E or 111.",
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
      "For neck pain, the number of appointments varies from person to person. It depends on your condition; your physiotherapist will give you an estimate after your assessment. The first is a 60-minute video assessment at {INITIAL_PRICE}, and follow-ups are 30 minutes at {FOLLOW_UP_PRICE}, and we review the estimate as we go.",
      "Because we cannot do hands-on treatment over video, nothing in your plan depends on us touching your neck. Everything we give you is something you do yourself, which means you keep it going between sessions and after you finish.",
      "If your arm symptoms are the main issue, or they are not following the pattern we expect from the start, we will tell you honestly and discuss whether a GP review is the better next step.",
    ],
    timeline:
      "According to the NHS, most neck pain only lasts a few weeks. If it has not gone after a few weeks, or it is getting worse, see a GP rather than waiting, and let us know if you are already working with us.",
    inPersonInstead: [
      "Call 999 if you have chest pain that spreads to your neck, jaw or arms, or chest pain that feels tight or squeezing. Do not drive yourself.",
      "Call 999 if you have sudden weakness or numbness in an arm or down one side of your body, a drooping face or trouble speaking (possible stroke). Do not drive yourself. Call 999 as well for blurred vision, loss of sight or sudden dizziness, which can also be stroke signs.",
      "Call 999 or go to A&E, or call 111 if you are not sure, if you notice changes in your balance or co-ordination.",
      "Call 999 or go to A&E, or call 111 if you are not sure, if your neck pain started after an accident or injury.",
      "Call 999 or go to A&E, or call 111 if you are not sure, if you have dizziness or visual symptoms when you move your neck.",
      "If you have neck pain or stiffness with a high temperature, a very painful headache, confusion, a rash that does not fade when pressed, or you are worried it could be meningitis, call 999 or go to A&E. Do not drive yourself.",
      "NICE Clinical Knowledge Summaries, written for GPs, list some neck pain features as red flags that need medical referral: nerve symptoms such as pins and needles, weakness or numbness, feeling generally unwell or feverish, weight loss you cannot explain, pain that does not let up and disturbs your sleep, and a past history of cancer, neck surgery or a raised risk of osteoporosis. If you feel feverish or unwell with neck pain or stiffness, use the meningitis line above. For the others, ask your GP for an urgent appointment instead of booking with us. Sudden weakness or numbness, and neck pain after an accident or injury, follow the 999 and A&E lines above.",
      "Ask your GP for an urgent appointment if you have pins and needles or an arm that feels cold. The NHS lists these for a GP visit, and NICE CKS guidance for clinicians treats nerve symptoms as a red flag, so do not wait. See a GP if your neck pain has not gone after a few weeks.",
      "If you are not sure whether your symptoms are urgent, call 111 or speak to a GP rather than waiting for a video appointment.",
    ],
    faqs: [
      {
        q: "Can neck pain be assessed over video?",
        a: "We can ask about your symptoms, watch your neck and shoulders move and check your set-up, then give you exercises. Over video, we cannot examine you by hand, and certain symptoms need in-person care. We screen for them at the start and will tell you if a video appointment is not right.",
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
        a: "Tell us at booking and at the start of the session. The NHS says to see a GP for pins and needles or a cold arm, and NICE CKS guidance for clinicians treats nerve symptoms as a red flag, so ask your GP for an urgent appointment. Call 999 if you have sudden weakness or numbness in an arm or down one side of your body, a drooping face or trouble speaking (possible stroke). Do not drive yourself. Dizziness or blurred vision also needs a 999 call. Neck pain after an injury, or with balance changes, needs A&E or a 111 call. None of these are suited to a video appointment.",
      },
    ],
    sources: [
      { label: "NHS: Neck pain", url: "https://www.nhs.uk/symptoms/neck-pain-and-stiff-neck/" },
      { label: "NHS: Meningitis", url: "https://www.nhs.uk/conditions/meningitis/" },
      {
        label: "NICE CKS: Neck pain - non-specific",
        url: "https://cks.nice.org.uk/topics/neck-pain-non-specific/",
      },
      { label: "NHS: Heart attack", url: "https://www.nhs.uk/conditions/heart-attack/" },
      { label: "NHS: Stroke symptoms", url: "https://www.nhs.uk/conditions/stroke/symptoms/" },
      {
        label: "NHS England: Guide to adopting remote consultations in adult MSK physiotherapy services",
        url: "https://www.england.nhs.uk/long-read/guide-to-adopting-remote-consultations-in-adult-musculoskeletal-physiotherapy-services/",
      },
    ],
    exerciseHubSlug: "neck-pain",
    selfTestSlugs: ["chin-tuck-rotation-check"],
    guideSlugs: ["can-a-physio-diagnose-over-video", "what-online-physiotherapy-cannot-do"],
    serviceSlug: "musculoskeletal-physiotherapy",
    reviewedOn: PHASE_BC_REVIEWED_ON,
  },
  {
    slug: "shoulder-pain",
    name: "Shoulder pain",
    h1: "Online physiotherapy for shoulder pain",
    seoTitle: "Online Physiotherapy for Shoulder Pain | PhysioOnClick",
    seoDescription:
      "How video physiotherapy works for shoulder pain: the movements we check on camera, what an exercise plan involves, and when to get urgent in-person care.",
    answer:
      "If your shoulder pain fits, a video appointment lets your physiotherapist watch you lift and rotate your arm, try a few self-checks, and plan exercises you do at home. It is not suitable with chest pain or breathlessness (call 999), after a dislocation, or after a fall where you cannot lift your arm (A&E). Sudden or very bad pain needs an urgent GP or 111.",
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
      "Shoulder problems differ a lot, so we do not quote a course length before we have assessed you. It depends on your condition; your physiotherapist will give you an estimate after your assessment. The first is a 60-minute video assessment at {INITIAL_PRICE}, and follow-ups are 30 minutes at {FOLLOW_UP_PRICE}. We review the estimate with you at each follow-up.",
      "The plan relies on you doing the exercises regularly. The NHS suggests 6 to 8 weeks of shoulder exercises, so we talk early about how to fit them into your day and how to tell whether your shoulder is coping.",
      "Our [rotator cuff exercise library](/exercises/for/rotator-cuff-tendinopathy) shows exercises you may be given, and our guide to [what online physiotherapy cannot do](/guides/what-online-physiotherapy-cannot-do) explains what a video appointment cannot cover.",
    ],
    timeline:
      "The NHS says to try shoulder exercises for 6 to 8 weeks to help stop shoulder pain coming back. Frozen shoulder is different. The NHS describes it as painful and stiff for months, and sometimes years. If your shoulder is not improving, or is getting worse, speak to a GP.",
    inPersonInstead: [
      "Call 999 or go to A&E if you have chest pain, chest tightness or breathlessness together with shoulder pain. Do not drive yourself.",
      "Go to A&E if your shoulder looks out of place or has changed shape, or you think you have dislocated it. Call 999 if you cannot get there yourself. Do not drive yourself.",
      "Go to A&E if you fell and now cannot move or lift your arm. Call 999 if you cannot get there yourself.",
      "Ask for an urgent GP appointment or get help from NHS 111 if your shoulder pain is sudden or very bad, or started after an injury such as a fall.",
      "Ask for an urgent GP appointment or get help from NHS 111 if your arm feels cold to touch, or you have no feeling in the arm.",
      "Ask for an urgent GP appointment or get help from NHS 111 if you cannot move your arm, or you have pins and needles that do not go away.",
      "Ask for an urgent GP appointment or get help from NHS 111 if you have severe pain in both shoulders.",
      "If you have shoulder pain with red or hot skin over the joint, or a fever, or you feel generally unwell: go to A&E now, or call NHS 111 straight away if you are not sure where to go. Do not drive yourself if you feel very unwell. NICE CKS guidance for clinicians lists each of these as a possible sign of a joint infection that needs emergency assessment.",
      "Ask for an urgent GP appointment or get help from NHS 111 if you notice a lump or new swelling in your shoulder, or several of your joints have become swollen and painful at the same time. NICE CKS guidance for clinicians says these need urgent referral.",
      "If you are not sure how urgent your symptoms are, call 111 or speak to a GP before booking a video appointment.",
    ],
    faqs: [
      {
        q: "Can shoulder pain be assessed by video?",
        a: "On video we watch how you lift, reach and rotate your arm, and we choose exercises from that. We cannot examine or scan the joint, and we will tell you if you need that or need to be seen in person.",
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
        a: "Call 999 or go to A&E if you have chest pain, chest tightness or breathlessness with shoulder pain, and do not drive yourself. Go to A&E after a dislocation, or after a fall where you cannot move your arm. For sudden or very bad shoulder pain, ask for an urgent GP appointment or call 111.",
      },
    ],
    sources: [
      { label: "NHS: Shoulder pain", url: "https://www.nhs.uk/symptoms/shoulder-pain/" },
      { label: "NICE CKS: Shoulder pain", url: "https://cks.nice.org.uk/topics/shoulder-pain/" },
      { label: "NHS: Septic arthritis", url: "https://www.nhs.uk/conditions/septic-arthritis/" },
      { label: "NHS: Frozen shoulder", url: "https://www.nhs.uk/conditions/frozen-shoulder/" },
      { label: "NHS: Dislocated shoulder", url: "https://www.nhs.uk/conditions/dislocated-shoulder/" },
      { label: "NHS: Heart attack", url: "https://www.nhs.uk/conditions/heart-attack/" },
    ],
    exerciseHubSlug: "rotator-cuff-tendinopathy",
    selfTestSlugs: ["full-can-test", "hawkins-kennedy-test", "painful-arc-self-check"],
    blogSlugs: ["online-physiotherapy-for-frozen-shoulder"],
    guideSlugs: ["what-online-physiotherapy-cannot-do", "can-a-physio-diagnose-over-video"],
    serviceSlug: "musculoskeletal-physiotherapy",
    reviewedOn: PHASE_BC_REVIEWED_ON,
  },
  {
    slug: "knee-pain",
    name: "Knee pain",
    h1: "Online physiotherapy for knee pain",
    seoTitle: "Online Physiotherapy for Knee Pain | PhysioOnClick",
    seoDescription:
      "Remote physiotherapy for knee pain and knee osteoarthritis: what the PEAK trial found, what we check on video, and when you need to be seen in person.",
    answer:
      "For long-lasting knee pain that fits osteoarthritis, a video appointment lets your physiotherapist watch you squat and step, then set up a strengthening and activity plan. A 2024 trial found video care was non-inferior to in-person care for this group. A locked or giving-way knee needs to be seen in person, and a hot, red knee with a fever needs A&E.",
    howOnlineWorks: [
      "One randomised trial, PEAK, looked at video physiotherapy for knee osteoarthritis. It was published in The Lancet in 2024 and enrolled 394 adults with chronic knee pain consistent with osteoarthritis at 27 clinics in Australia. Both groups had five consultations over three months covering strengthening, physical activity and education. Video care was non-inferior to in-person care for pain and for function at three months.",
      "That finding is specific. It covers adults with chronic knee pain consistent with osteoarthritis in that trial, not every knee problem, and it does not describe our service. We mention it because it is relevant to knee pain from osteoarthritis, and our plans for knee osteoarthritis follow the same ground: exercise, activity and education.",
      "NICE guidance on osteoarthritis lists therapeutic exercise, and weight management where appropriate, as core treatments, with information and support. Our plans start there. On camera we watch how you rise from a chair, climb a step and lower into a squat, and we use what we see to choose exercises for the muscles around your knee.",
      "Knee pain has other causes, and we ask about them. If your pain is mainly at the front of the knee, we assess that too, using the [single leg decline squat check](/exercises/tests/single-leg-decline-squat-check) where it is safe for you to try.",
      "We cannot feel your knee or test its ligaments by hand. If the knee locks, gives way or painfully clicks, the NHS advises getting help from 111, and we will ask you to be seen in person instead of by video.",
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
      "It depends on your condition; your physiotherapist will give you an estimate after your assessment. The first is a 60-minute video assessment at {INITIAL_PRICE}, and follow-ups are 30 minutes at {FOLLOW_UP_PRICE}. In PEAK, both groups had five consultations over three months, but that was a research design and we do not treat it as a promise for you.",
      "The NHS advises that more severe osteoarthritis may need a structured exercise plan with a physiotherapist, and suggests aiming for 150 minutes of moderate activity a week plus strength exercises. We talk about how to build toward that in a way that your knee tolerates.",
      "NICE guidance recommends telling people with osteoarthritis that joint pain may go up for a while when they start exercising, and that regular exercise kept up over time brings more benefit. It says not to offer acupuncture or dry needling for osteoarthritis, and not to offer glucosamine or strong opioids. If you have questions about medicines, speak to your GP or pharmacist.",
    ],
    timeline:
      "Knee osteoarthritis is a long-term condition, according to the NHS, so we cannot give you a reliable recovery range. Our aim is a plan that gets you moving and that you can keep going. We review how your pain, walking and daily tasks are changing at each follow-up, and adjust the exercises or suggest further help from your GP if progress stalls. In PEAK, results were measured at three months, and knee pain from other causes can behave differently.",
    inPersonInstead: [
      "If your knee is red, hot or swollen and you have a high temperature, or feel hot, cold or shivery: go to A&E now, or call NHS 111 straight away if you are not sure where to go. Do not drive yourself if you feel very unwell. The NHS lists this under NHS 111, and NICE CKS guidance for clinicians says signs of a joint infection need immediate referral to hospital.",
      "Call 111 if your knee is badly swollen or has changed shape, or you cannot move it or put any weight on it.",
      "Call 111 if your knee locks, gives way or painfully clicks.",
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
        a: "We assess it on video, including how the knee moves on stairs and squats. We cannot examine the joint by hand, so if a diagnosis is uncertain or you have had an injury, we will tell you plainly and suggest in-person care.",
      },
      {
        q: "Should I stop exercising if my knee hurts?",
        a: "Not necessarily. The NHS suggests regular activity and strength exercises for osteoarthritis, and our plans pace them to your knee. If your knee locks, gives way or is badly swollen, call 111. If it is red or hot and you have a high temperature, go to A&E now, or call NHS 111 straight away if you are not sure where to go. Do not drive yourself if you feel very unwell.",
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
      { label: "NHS: Septic arthritis", url: "https://www.nhs.uk/conditions/septic-arthritis/" },
      {
        label: "NICE CKS: Knee pain - assessment (used for joint infection warning signs)",
        url: "https://cks.nice.org.uk/topics/knee-pain-assessment/",
      },
    ],
    exerciseHubSlug: "knee-osteoarthritis",
    selfTestSlugs: ["single-leg-decline-squat-check"],
    guideSlugs: ["does-online-physiotherapy-work", "can-a-physio-diagnose-over-video"],
    serviceSlug: "musculoskeletal-physiotherapy",
    reviewedOn: PHASE_BC_REVIEWED_ON,
  },
  {
    slug: "plantar-fasciitis",
    name: "Plantar fasciitis",
    h1: "Online physiotherapy for plantar fasciitis (heel pain)",
    seoTitle: "Online Physiotherapy for Plantar Fasciitis | PhysioOnClick",
    seoDescription:
      "How a video physio appointment works for plantar fasciitis and heel pain: what we check on camera, the exercises in a plan, and when to get urgent help.",
    answer:
      "If your heel pain fits plantar fasciitis, a video appointment lets your physiotherapist ask about your symptoms, watch you stand and walk, and set up foot and calf exercises to do at home. It is not the right route after a heel injury or with tingling or loss of feeling in the foot (NHS 111 or a GP), or with a hot, swollen heel and a fever (A&E).",
    howOnlineWorks: [
      "Plantar fasciitis is pain under the heel or along the sole of the foot. Much of what we learn comes from the story: when the pain is worst, how it behaves after rest, what footwear you wear and how much time you spend on your feet. All of that can be covered by video, and you can show us the shoes you wear every day on camera.",
      "We also watch you move. We ask you to stand, walk across the room in bare feet or in your usual shoes, and rise onto your toes, so we can see how your foot and ankle share the load. Seeing you in your own home or workplace set-up helps us talk about the floors, shoes and routines that you actually have.",
      "The NHS says plantar fasciitis can usually be eased with self-care, and that regular gentle exercises to stretch the sole of the foot and heel can help. It also says a physiotherapist can show you exercises. Our plans start from that: a small set of foot and calf exercises, shown on camera and corrected as you do them, and advice on pacing your standing and walking.",
      "There are limits to video. We cannot feel the heel or the sole of your foot, and we cannot scan it. If your story does not fit plantar fasciitis, or you have any of the warning signs below, we will tell you plainly and point you to in-person care instead of carrying on with a plan.",
    ],
    assessmentChecks: [
      "Where exactly the pain is felt, and whether it sits under the heel, along the arch or somewhere else in the foot.",
      "When it is worst, for example on the first steps in the morning, after sitting, or at the end of a long day on your feet.",
      "What you wear on your feet at home, at work and for exercise, and how much walking or standing you do.",
      "How you stand, walk and rise onto your toes, and how your ankle and calf move, filmed from the front and the side.",
      "Whether you have any tingling, numbness or loss of feeling in the foot, and whether you have diabetes, because the NHS advises seeing a GP if you have diabetes and heel pain.",
      "The red flag questions listed below, including any recent injury, which we ask at the start of every appointment.",
    ],
    typicalPlan: [
      "A first plan for heel pain usually has three parts: advice on easing off whatever sets the pain off for now, regular gentle stretches for the sole of the foot and the calf, and gradual strengthening for the foot and calf as it settles. We show each exercise on camera and give you only a few to start with, so that you can keep them going.",
      "For heel pain we give you an estimate rather than a fixed course. It depends on your condition; your physiotherapist will give you an estimate after your assessment. The first is a 60-minute video assessment at {INITIAL_PRICE}, and follow-ups are 30 minutes at {FOLLOW_UP_PRICE}. We review it with you at each follow-up rather than booking a block in advance.",
      "We will also talk about footwear, how to build walking and standing back up, and how to tell a sore day from a worsening one. Nothing in your plan depends on us touching your foot.",
      "For questions about cost, referrals and insurance, see our guide to [private physiotherapy cost in the UK](/guides/private-physiotherapy-cost-uk). We cannot promise that any insurer will pay, so check with yours before you book.",
    ],
    timeline:
      "The NHS says to see a GP if foot pain has not improved after treating it yourself for 2 weeks, so we use that as a checkpoint. NICE Clinical Knowledge Summaries, written for GPs, describe plantar fasciitis as usually settling over time, and suggest considering a specialist referral if symptoms are severe enough to affect daily life or last 3 to 6 months despite care. We cannot give you an exact recovery time for your heel. We review how your pain, walking and daily tasks are changing at each follow-up, and we will suggest a GP review if things are not moving in the right direction.",
    inPersonInstead: [
      "Call NHS 111 if you have severe heel pain after an injury, such as a fall or a jump.",
      "Call NHS 111 if you feel faint, dizzy or sick from the pain.",
      "Call NHS 111 if your foot or ankle has changed shape or is at an odd angle, or you heard a snap, grinding or popping noise when you hurt it.",
      "Call NHS 111 if you cannot walk, cannot walk on your tiptoes or cannot climb stairs after an injury, or you have swelling and bruising in your calf and ankle.",
      "If your heel is red, hot or swollen and you have a high temperature or feel unwell: go to A&E now, or call NHS 111 straight away if you are not sure where to go. Do not drive yourself if you feel very unwell. This can be a sign of a joint infection. The NHS says a joint infection needs urgent medical help, and NICE CKS guidance for clinicians says signs of a joint infection need immediate referral to hospital.",
      "See a GP if you have any tingling or loss of feeling in your foot, or if you have diabetes and heel pain.",
      "See a GP if the pain is severe or stops you doing normal activities, is getting worse or keeps coming back, or has not improved after 2 weeks of looking after it yourself. Tell us if the pain is there at night or at rest, and speak to your GP before relying on a video plan.",
    ],
    faqs: [
      {
        q: "Can plantar fasciitis be assessed by video?",
        a: "We can ask about your pain, watch how you stand and walk, and look at your footwear, then give you exercises. Over video, we cannot examine your foot by hand, and some symptoms need in-person care. We screen for those at the start and will tell you if a video appointment is not right.",
      },
      {
        q: "What exercises help heel pain?",
        a: "The NHS says regular gentle exercises to stretch the sole of the foot and heel can help, and that a physiotherapist can show you exercises. In our plans we choose and pace them after watching you move, and we show each one on camera.",
      },
      {
        q: "How long should I try self-care before seeing someone?",
        a: "The NHS says to see a GP if foot pain has not improved after 2 weeks of treating it yourself, or sooner if it is severe, getting worse or you have tingling or loss of feeling. If you are unsure, ask your GP or call 111 before booking.",
      },
      {
        q: "I hurt my heel in a fall. Can I still book?",
        a: "Please do not book a video appointment first. The NHS advises calling 111 for severe heel pain after an injury, and especially if the foot has changed shape, you heard a snap or pop, or you cannot walk. Once you have been checked, we can help with the recovery.",
      },
    ],
    sources: [
      { label: "NHS: Plantar fasciitis", url: "https://www.nhs.uk/conditions/plantar-fasciitis/" },
      { label: "NHS: Heel pain", url: "https://www.nhs.uk/symptoms/foot-pain/heel-pain/" },
      { label: "NHS: Septic arthritis", url: "https://www.nhs.uk/conditions/septic-arthritis/" },
      {
        label: "NICE CKS: Knee pain - assessment (used for joint infection warning signs)",
        url: "https://cks.nice.org.uk/topics/knee-pain-assessment/",
      },
      { label: "NICE CKS: Plantar fasciitis", url: "https://cks.nice.org.uk/topics/plantar-fasciitis/" },
    ],
    guideSlugs: ["private-physiotherapy-cost-uk", "can-a-physio-diagnose-over-video"],
    serviceSlug: "musculoskeletal-physiotherapy",
    reviewedOn: PHASE_BC_REVIEWED_ON,
  },
  {
    slug: "tennis-elbow",
    name: "Tennis elbow",
    h1: "Online physiotherapy for tennis elbow",
    seoTitle: "Online Physiotherapy for Tennis Elbow | PhysioOnClick",
    seoDescription:
      "How video physiotherapy works for tennis elbow: the grip and wrist checks we do on camera, what the exercise plan involves, and when to get urgent care.",
    answer:
      "If your elbow pain fits tennis elbow, a video appointment lets your physiotherapist watch how you grip, lift and move your wrist, try a guided self-check, and set up forearm exercises to do at home. It is not the right route after an arm injury with numbness, tingling or a changed shape (A&E or 999), or if your elbow is hot and swollen and you have a high temperature (A&E).",
    howOnlineWorks: [
      "In our assessments, tennis elbow means pain on the outer side of the elbow that shows up when you grip, lift or twist. On video we ask what sets it off, such as typing, carrying shopping or using tools, and we watch you do a few of those movements in your own space, so we see the real triggers rather than a clinic version of them.",
      "We use one guided self-check, the [resisted wrist extension test](/exercises/tests/resisted-wrist-extension-test), if it is safe for you to try. You do it yourself on camera while we watch. It cannot confirm a diagnosis, and our self-check page says only a hands-on assessment can tell you for sure.",
      "The NHS says tennis elbow often settles with rest, though it can sometimes last more than a year. It says physiotherapy may help if symptoms have not improved after 6 weeks of home treatment, and that treatment may include stretching and strengthening for the wrist and forearm. Our plans are built around that kind of exercise, shown on camera and adjusted as your elbow responds.",
      "We cannot touch the elbow by video, and we cannot scan it. If what you describe does not fit tennis elbow, or you have any of the warning signs below, we will say so and help you decide where to go next.",
    ],
    assessmentChecks: [
      "Where the pain sits, and whether it stays at the outer elbow or spreads down the forearm.",
      "Which tasks set it off, such as gripping, lifting with the palm down, typing, using a mouse or carrying bags.",
      "How far you can bend, straighten and rotate the elbow and wrist on both sides, and whether the sore side moves normally.",
      "The resisted wrist extension test, done as a guided self-check on camera if it is safe, to see whether loading the wrist tendons brings on the pain.",
      "How your work, sport or hobbies load the forearm, and how much rest the elbow has had.",
      "The red flag questions listed below, including any recent injury, tingling or numbness, which we ask at the start of every appointment.",
    ],
    typicalPlan: [
      "A first plan for tennis elbow usually combines advice on adjusting the tasks that flare it up, gentle stretches for the wrist and forearm, and strengthening that you build up gradually as the elbow copes. We show each exercise on camera and change the load at follow-ups depending on what your elbow does afterwards.",
      "It depends on your condition; your physiotherapist will give you an estimate after your assessment. The first is a 60-minute video assessment at {INITIAL_PRICE}, and follow-ups are 30 minutes at {FOLLOW_UP_PRICE}. Given that the NHS says tennis elbow can sometimes last over a year, we review the plan with you rather than booking a block up front.",
      "We will talk about grip, tool and keyboard set-up, how to share load between both arms, and how to return to sport or heavier work in steps. Nothing in the plan depends on us touching your arm.",
      "Our [tennis elbow exercise library](/exercises/for/tennis-elbow) shows the kind of exercises you may be given. For what a video appointment can and cannot cover, see our guide to [what online physiotherapy cannot do](/guides/what-online-physiotherapy-cannot-do).",
    ],
    timeline:
      "According to the NHS, tennis elbow often settles with rest but can sometimes last more than a year, and physiotherapy may help if symptoms have not improved after 6 weeks of home treatment. It also says to see a GP if you still have elbow pain after at least 2 weeks of resting the elbow and trying self-care. NICE Clinical Knowledge Summaries, written for GPs, say tennis elbow usually gets better on its own, in about 80 to 90 percent of people within 12 to 24 months, and suggest a physiotherapy referral if symptoms persist. We review progress at each follow-up and suggest a GP review if you are not improving.",
    inPersonInstead: [
      "Go to A&E or call 999 if, after an arm injury, your arm or wrist is numb, tingling or has pins and needles. Do not drive yourself to A&E; ask someone to take you or call 999.",
      "Go to A&E or call 999 if, after an arm injury, your arm or wrist has changed shape or is at an odd angle, a bone is sticking out, or you have a bad cut bleeding heavily. Do not drive yourself to A&E; ask someone to take you or call 999.",
      "Get help from NHS 111 if, after an injury, the arm is very painful, you cannot use it because of the pain, or the pain is getting worse.",
      "If your elbow is red, hot or swollen and you have a high temperature or feel unwell: go to A&E now, or call NHS 111 straight away if you are not sure where to go. Do not drive yourself if you feel very unwell. This can be a sign of a joint infection. The NHS says a joint infection needs urgent medical help, and NICE CKS guidance for clinicians says signs of a joint infection need immediate referral to hospital.",
      "If numbness or weakness comes on suddenly, especially with a drooping face or trouble speaking, call 999.",
      "If you have numbness or tingling in your fingers or hand that came on gradually, get medical advice from your GP. If it started after an injury, go to A&E instead.",
      "See a GP if you still have elbow pain after resting it and trying self-care for at least 2 weeks.",
    ],
    faqs: [
      {
        q: "Can tennis elbow be treated online?",
        a: "In our plans, treatment is mainly advice plus stretching and strengthening exercises you do yourself, which the NHS lists among treatments for tennis elbow. A video appointment lets us watch your grip and movement and guide you. We cannot examine the elbow by hand, and we will tell you if you need to be seen in person.",
      },
      {
        q: "How long does tennis elbow last?",
        a: "The NHS says it often settles with rest but can sometimes last more than a year. We cannot give you an exact timeline, so we review how it is going at each appointment and suggest a GP review if you are not improving.",
      },
      {
        q: "When should I start physiotherapy for tennis elbow?",
        a: "The NHS says physiotherapy may help if your symptoms have not improved after 6 weeks of home treatment, and to see a GP if you still have pain after at least 2 weeks of self-care. You can book with us before then if you would like help with exercises, but check with your GP if you are unsure.",
      },
      {
        q: "What if I hurt my arm and it is swollen or looks different?",
        a: "Do not book a video appointment first. After an arm injury, the NHS says to go to A&E or call 999 if the arm or wrist is numb, tingling or has pins and needles, or has changed shape or is at an odd angle. Do not drive yourself to A&E; ask someone to take you or call 999. Get help from NHS 111 if the arm is very painful or you cannot use it.",
      },
    ],
    sources: [
      { label: "NHS: Tennis elbow", url: "https://www.nhs.uk/conditions/tennis-elbow/" },
      { label: "NICE CKS: Tennis elbow", url: "https://cks.nice.org.uk/topics/tennis-elbow/" },
      { label: "NHS: Septic arthritis", url: "https://www.nhs.uk/conditions/septic-arthritis/" },
      {
        label: "NICE CKS: Knee pain - assessment (used for joint infection warning signs)",
        url: "https://cks.nice.org.uk/topics/knee-pain-assessment/",
      },
      { label: "NHS: Broken arm or wrist", url: "https://www.nhs.uk/conditions/broken-arm-or-wrist/" },
    ],
    exerciseHubSlug: "tennis-elbow",
    selfTestSlugs: ["resisted-wrist-extension-test"],
    guideSlugs: ["what-online-physiotherapy-cannot-do", "how-many-physiotherapy-sessions-do-i-need"],
    serviceSlug: "musculoskeletal-physiotherapy",
    reviewedOn: PHASE_BC_REVIEWED_ON,
  },
  {
    slug: "hip-pain",
    name: "Hip pain",
    h1: "Online physiotherapy for hip pain",
    seoTitle: "Online Physiotherapy for Hip Pain | PhysioOnClick",
    seoDescription:
      "How a video physio appointment works for hip pain, including gluteal tendinopathy and hip osteoarthritis: what we check on camera and when to get urgent care.",
    answer:
      "If your hip pain fits, a video appointment lets your physiotherapist ask about it, watch you stand, walk and balance, and set up exercises to do at home. It is not the right route after a fall or injury, if you cannot put weight on the leg, or if the hip is hot and swollen. Those need 999, A&E, 111 or an urgent GP.",
    howOnlineWorks: [
      "Hip pain has several possible causes, and we ask about them on video. This page covers two we see in our plans: pain on the outer side of the hip linked to the tendons and muscles there, known as gluteal tendinopathy, and hip osteoarthritis. We ask where the pain is, what brings it on, such as stairs, lying on that side or walking, and what you have already tried.",
      "We watch how you move. You stand up from a chair, walk, climb a step if you have one and stand on one leg with support nearby. We use the [Trendelenburg mirror check](/exercises/tests/trendelenburg-mirror-check) as a guided self-check, if it is safe for you, to see how the muscles on the outside of your hip cope with single-leg standing. It cannot confirm a cause, only a hands-on assessment can do that.",
      "The NHS says to try gentle hip stretching exercises, and lists physiotherapy for more help with exercises and stretches. For osteoarthritis generally, NICE guidance lists therapeutic exercise as a core treatment, with weight management where appropriate and with information and support. Our hip plans are built on exercise, advice on pacing and shown-on-camera movements.",
      "We cannot feel the hip or scan it. If your story does not fit, or you have any of the warning signs below, we will say so and point you to the right in-person care.",
    ],
    assessmentChecks: [
      "Where the hip pain is felt, whether it is on the outer side, in the groin or in the buttock, and whether it spreads down the thigh.",
      "What brings it on or eases it, such as walking, stairs, sitting in low chairs, lying on that side or getting out of bed.",
      "The [Trendelenburg mirror check](/exercises/tests/trendelenburg-mirror-check), done on camera as a guided self-check if it is safe, to see how your pelvis stays level on one leg.",
      "How you stand up, walk and balance, and how far each hip moves, compared with the other side.",
      "Whether the hip is stiff for a long time after waking, and how the pain affects your sleep and normal activities.",
      "The red flag questions listed below, including any recent fall, which we ask at the start of every appointment.",
    ],
    typicalPlan: [
      "A first plan for hip pain usually starts with advice on what to ease for now, such as positions that set it off, and a few gentle movements for the hip and thigh. We then build strengthening and walking in steps, showing each exercise on camera and changing the load at follow-ups depending on how the hip responds.",
      "Hip pain has several causes, and the cause changes how long a plan takes. It depends on your condition; your physiotherapist will give you an estimate after your assessment. The first is a 60-minute video assessment at {INITIAL_PRICE}, and follow-ups are 30 minutes at {FOLLOW_UP_PRICE}, and we review it with you rather than booking a block in advance.",
      "We will also talk about footwear, chairs and bed height, how to pace walking and stairs, and how to fit exercises into your day. Our [hip exercise library](/exercises/for/gluteal-tendinopathy) shows the kind of exercises you may be given.",
      "If you have had cancer in the past, tell us when you book. Our approach is to ask you to speak to your GP before we start a plan. For what a video appointment can and cannot cover, see our guide to [can a physio diagnose over video](/guides/can-a-physio-diagnose-over-video).",
    ],
    timeline:
      "We cannot give you a reliable recovery time for hip pain, because the cause matters. The NHS says to see a GP if hip pain has not improved after treating it at home for 2 weeks, if it is getting worse or keeps coming back, or if it stops you doing normal activities or affects your sleep. We review progress at each follow-up and suggest a GP review if you are not improving.",
    inPersonInstead: [
      "Call 999 or go to A&E if you have hip pain after a fall or injury, whatever your age. NICE CKS guidance for clinicians says hip pain after a fall needs emergency referral.",
      "Call 999 or go to A&E if you cannot walk or put weight on your leg.",
      "Call 999 or go to A&E if you have tingling or loss of feeling in your hip or leg after an injury.",
      "Ask for an urgent GP appointment or get help from NHS 111 if you have severe hip pain that started suddenly and you have not had a fall or injured the hip.",
      "If your hip is swollen and feels hot, or you have hip pain and feel generally unwell or have a high temperature: go to A&E now, or call NHS 111 straight away if you are not sure where to go. Do not drive yourself if you feel very unwell. The NHS lists these for an urgent GP appointment or NHS 111, and NICE CKS guidance for clinicians says hip pain with signs of infection or of being generally unwell needs emergency referral.",
      "Ask for an urgent GP appointment or get help from NHS 111 if the skin around your hip has changed colour.",
      "See a GP if you have hip stiffness for more than 30 minutes after waking.",
      "We will ask you to see your GP first if you have had cancer and have new hip pain. NICE CKS guidance for clinicians says hip pain in someone with a past cancer, where a fracture is suspected, needs emergency referral, so if you also cannot put weight on the leg, call 999 or go to A&E as above.",
    ],
    faqs: [
      {
        q: "Can hip pain be assessed over video?",
        a: "We can ask about your pain, watch how you stand, walk and balance, and guide you through a self-check, then give you exercises. Over video, we cannot examine the hip by hand or scan it. Some symptoms need in-person care, and we screen for them at the start of your appointment.",
      },
      {
        q: "Do you treat gluteal tendinopathy and hip osteoarthritis?",
        a: "Yes, we assess hip pain that fits either picture and build an exercise plan around it. NICE lists therapeutic exercise as a core treatment for osteoarthritis. We cannot confirm a diagnosis by video, and we will tell you if you need a hands-on check or tests first.",
      },
      {
        q: "I fell and my hip hurts. Should I book?",
        a: "No. The NHS says to call 999 or go to A&E for severe hip pain after a fall or injury, if you cannot walk or put weight on the leg, or if you have tingling or loss of feeling in the hip or leg after an injury. Once you have been checked, we can help with recovery.",
      },
      {
        q: "When should I see a GP about hip pain?",
        a: "The NHS says to see a GP if hip pain is stopping you doing normal activities or affecting your sleep, is getting worse or keeps coming back, has not improved after 2 weeks at home, or comes with stiffness for more than 30 minutes after waking.",
      },
    ],
    sources: [
      { label: "NHS: Hip pain in adults", url: "https://www.nhs.uk/symptoms/hip-pain/" },
      {
        label: "NICE CKS: Greater trochanteric pain syndrome",
        url: "https://cks.nice.org.uk/topics/greater-trochanteric-pain-syndrome/",
      },
      {
        label: "NICE NG226: Osteoarthritis in over 16s, recommendations",
        url: "https://www.nice.org.uk/guidance/ng226/chapter/Recommendations",
      },
      { label: "NHS: Osteoarthritis", url: "https://www.nhs.uk/conditions/osteoarthritis/" },
    ],
    exerciseHubSlug: "gluteal-tendinopathy",
    selfTestSlugs: ["trendelenburg-mirror-check"],
    guideSlugs: ["can-a-physio-diagnose-over-video", "does-online-physiotherapy-work"],
    serviceSlug: "musculoskeletal-physiotherapy",
    reviewedOn: PHASE_BC_REVIEWED_ON,
  },
  {
    slug: "knee-replacement-rehab",
    name: "Knee replacement",
    nameInSentence: "knee replacement",
    about: { type: "SurgicalProcedure", name: "Knee replacement" },
    h1: "Online physiotherapy after knee replacement",
    seoTitle: "Online Physio After Knee Replacement | PhysioOnClick",
    seoDescription:
      "How video physiotherapy fits after a knee replacement: when rehab can start, what a session covers, and which symptoms go back to your surgical team or 999.",
    answer:
      "After a knee replacement, rehab with us starts once your surgical team has said you are ready for outpatient or community physiotherapy, and we follow any restrictions or precautions they give you. On video we watch how you move, set milestones and progress your home exercises. Wound checks and complications go back to your surgical team. Pain and swelling in the leg with breathing difficulty or chest pain needs 999.",
    howOnlineWorks: [
      "Rehab after a knee replacement starts in hospital. NICE guidance on joint replacement says it should begin on the day of surgery if possible, and the NHS says following your exercises early on helps long-term strength and movement. Your surgical team decides when rehab with us can begin. Rehab with us starts once your surgical team has said you are ready for outpatient or community physiotherapy, and we follow any restrictions or precautions they give you. Until then, follow the instructions and exercises you were given in hospital.",
      "The NHS says a physiotherapist or occupational therapist explains a home exercise programme before you leave hospital, and that following those exercises early helps long-term strength and movement. Our video sessions build on that programme. We watch you stand, walk with your aid, bend and straighten the knee, and then adjust what you do at home.",
      "Being at home helps with the practical parts of recovery. We can look at the stairs you actually climb, the chair you sit in and the bathroom you use, and plan exercises and pacing around them. If you are still using crutches or a frame, our service guidance says sessions can be adapted to seated or supported positions.",
      "There are things we cannot do by video. We cannot examine the wound, remove stitches or staples, or check the joint by hand. Our service guidance is clear that wound checks and any complication go straight back to your surgical team, and we will tell you if something we see or hear in a session needs that.",
      "If your knee pain started before surgery, or you are still deciding on an operation, our page on [online physiotherapy for knee pain](/online-physiotherapy-for/knee-pain) covers that stage instead.",
    ],
    assessmentChecks: [
      "Confirmation that your surgical team has said you are ready for outpatient or community physiotherapy, any restrictions or precautions they set, and any instructions they gave you.",
      "The date and type of operation, whether it was a total or partial knee replacement, and what your discharge summary or exercise sheet says.",
      "How the knee bends and straightens, how you stand up from a chair, and how you manage steps or stairs at home, as far as it is safe to try them.",
      "How you walk, whether you use a stick, crutches or a frame, and how much the knee swells or aches after activity.",
      "How you are sleeping, what daily tasks and work you want to get back to, and what you are worried about.",
      "The warning signs listed below, which we check for during your sessions, because they change what the right next step is.",
    ],
    typicalPlan: [
      "A plan after knee replacement is built from the exercises your hospital team gave you, then progressed in steps as the knee settles. We set milestones with you for movement, strength and walking, and review them at each follow-up. We ask you to follow your surgeon's protocol where it differs from anything we suggest.",
      "The first session is a 60-minute video assessment at {INITIAL_PRICE}, and follow-ups are 30 minutes at {FOLLOW_UP_PRICE}. It depends on your condition; your physiotherapist will give you an estimate after your assessment. We review it with you rather than booking a block in advance.",
      "The NHS gives some typical timings, which depend on you and your surgeon. It says people are usually home 1 to 4 days after the operation, may try walking without an aid after about 6 weeks if ready, usually wait at least 6 weeks to drive after a total replacement (3 weeks after a partial one, checking with your doctor), and return to work after about 6 to 12 weeks depending on the job. It also suggests avoiding heavy household lifting for the first 3 months.",
      "Your follow-up appointment with the surgical team, which the NHS says is usually about 6 weeks after the operation, stays with them. NICE guidance on joint replacement recommends that people doing rehabilitation on their own know their goals and why the exercises matter, and have someone to contact for advice and support. It says nothing about rehab by video, and we do not suggest it does. Keep your GP or specialist team informed about your treatment.",
    ],
    timeline:
      "According to the NHS, it may take several months or longer to fully recover from a knee replacement, and recovery from a partial replacement should be shorter than from a total one. Progress is set mostly by the operation itself. We review how your movement, strength and walking are changing at each session, and we suggest you speak to your surgical team if progress stalls.",
    inPersonInstead: [
      "Call 999 or go to A&E if you have pain and swelling in your leg and difficulty breathing or chest pains. This could be a blood clot in the lungs.",
      "Do not drive yourself to A&E. Ask someone to drive you, or call 999.",
      "Call 999 or go to A&E if you have severe difficulty breathing, pain in your chest or upper back, a very fast heartbeat, or you collapse. These can be signs of a blood clot in the lungs. Do not drive yourself.",
      "Ask for an urgent GP appointment or call NHS 111 if you have had a knee replacement and have throbbing or cramping pain in your leg.",
      "If you have a high temperature, or feel hot, cold or shivery, and your knee is red, hot or swollen: go to A&E now, or call NHS 111 straight away if you are not sure where to go. Do not drive yourself if you feel very unwell. NICE CKS guidance for clinicians says signs of a joint infection need immediate referral to hospital.",
      "Ask for an urgent GP appointment or call NHS 111 if you have a high temperature, or feel hot, cold or shivery, or if the wound is oozing or has pus.",
      "Ask for an urgent GP appointment or call NHS 111 if the redness, tenderness, swelling or pain in your knee is not getting better or is getting worse. The NHS says these can be signs of infection or a blood clot.",
      "Wound checks, stitch or staple removal and any complication go back to your surgical team, not to an online rehab session.",
    ],
    faqs: [
      {
        q: "When can I start online physio after a knee replacement?",
        a: "Rehab with us starts once your surgical team has said you are ready for outpatient or community physiotherapy, and we follow any restrictions or precautions they give you. Until then, follow the exercises and advice you were given in hospital. We can talk through where you are at booking, and we will ask you to check with your surgical team if you are unsure.",
      },
      {
        q: "Can you check my wound or remove stitches?",
        a: "No. Our service guidance is that wound checks, stitch or staple removal and any complication need in-person review, and they go straight back to your surgical team. If the wound is oozing, you feel feverish or the knee is more red or swollen, use the urgent routes listed on this page.",
      },
      {
        q: "How long will recovery take?",
        a: "The NHS says it may take several months or longer to fully recover from a knee replacement, and a partial replacement should be shorter than a total one. We cannot give you a firm date, and we review your progress with you at each session.",
      },
      {
        q: "Had ACL surgery instead?",
        a: "We cover that in a separate guide: [online physiotherapy after ACL reconstruction](/blog/online-physiotherapy-after-acl-reconstruction). The same rule applies: rehab with us starts once your surgical team has said you are ready for outpatient or community physiotherapy, and we follow any restrictions or precautions they give you, and complications go back to them.",
      },
    ],
    sources: [
      {
        label: "NHS: Recovering from a knee replacement",
        url: "https://www.nhs.uk/tests-and-treatments/knee-replacement/recovery/",
      },
      {
        label: "NICE NG157: Joint replacement (primary): hip, knee and shoulder, recommendations",
        url: "https://www.nice.org.uk/guidance/ng157/chapter/Recommendations",
      },
      {
        label: "NHS: Complications of a knee replacement",
        url: "https://www.nhs.uk/tests-and-treatments/knee-replacement/complications/",
      },
      {
        label: "NHS: DVT (deep vein thrombosis)",
        url: "https://www.nhs.uk/conditions/deep-vein-thrombosis-dvt/",
      },
      { label: "NHS: Pulmonary embolism", url: "https://www.nhs.uk/conditions/pulmonary-embolism/" },
    ],
    exerciseHubSlug: "after-knee-replacement",
    guideSlugs: ["does-online-physiotherapy-work", "what-online-physiotherapy-cannot-do"],
    serviceSlug: "post-surgical-rehabilitation",
    reviewedOn: PHASE_BC_REVIEWED_ON,
  },
  {
    slug: "hip-replacement-rehab",
    name: "Hip replacement",
    nameInSentence: "hip replacement",
    about: { type: "SurgicalProcedure", name: "Hip replacement" },
    h1: "Online physiotherapy after hip replacement",
    seoTitle: "Online Physio After Hip Replacement | PhysioOnClick",
    seoDescription:
      "How video physiotherapy fits after a hip replacement: when rehab can start, why your surgeon sets the precautions, and which symptoms need urgent care or 999.",
    answer:
      "After a hip replacement, rehab with us starts once your surgical team has said you are ready for outpatient or community physiotherapy, and we follow any restrictions or precautions they give you. On video we watch you move and progress your home exercises. Wounds and complications go back to your surgical team. Leg or hip pain and swelling with breathing difficulty or chest pain needs 999.",
    howOnlineWorks: [
      "Rehab after a hip replacement starts in hospital. NICE guidance on joint replacement says it should begin on the day of surgery if possible, and the NHS says following your exercises early on helps long-term strength and movement. Your surgical team may set a period of protection before a gradual return to normal movement. Rehab with us starts once your surgical team has said you are ready for outpatient or community physiotherapy, and we follow any restrictions or precautions they give you. Until then, follow the advice and any precautions they gave you.",
      "Any hip precautions after your operation, such as how far you may bend the hip or which positions to avoid, are set by your surgical team. We do not set them. We start once your surgical team has said you are ready for outpatient or community physiotherapy, we keep every exercise within the precautions they set, and if they give you new advice later, follow it and tell us.",
      "The NHS says your physiotherapist or occupational therapist explains home exercises before you leave hospital, and that following them helps long-term strength and movement. On video we watch the exercises you have been given, check how you get out of bed, sit down, stand and walk, and adjust the plan as your hip settles.",
      "Home is where much of recovery happens, so we can look at your own bed height, chair, toilet and stairs, and talk through how you manage them. That is a practical advantage of video for this stage, although it does not replace in-person care.",
      "We cannot see or feel the wound or check the joint by hand. If we are worried about the wound, a fall or a hip that is not progressing, we will tell you to contact your surgical team rather than carrying on with exercises.",
      "If your hip trouble came before surgery, our page on [online physiotherapy for hip pain](/online-physiotherapy-for/hip-pain) covers that stage.",
    ],
    assessmentChecks: [
      "Confirmation that your surgical team has said you are ready for outpatient or community physiotherapy, any restrictions or precautions they set, and when your next follow-up with them is.",
      "The date of the operation, how you have been recovering since discharge, and what your discharge summary or exercise sheet says.",
      "How you get on and off the bed, in and out of a chair, and up and down stairs, and which of these still feel hard.",
      "How you walk, whether you use a stick, crutches or a frame, and how much the hip or leg aches or swells after activity.",
      "Your sleep, your work and the daily tasks you want to return to, and what worries you about moving the hip.",
      "The warning signs listed below, which we check for during your sessions.",
    ],
    typicalPlan: [
      "Your plan starts from the exercises your hospital team gave you, and builds in small steps once your surgical team has said you are ready for outpatient or community physiotherapy, always within any precautions they set. We set milestones with you for walking, strength and everyday movement, and review them at each follow-up. Where our suggestions and your surgeon's advice differ, follow your surgeon.",
      "The first session is a 60-minute video assessment at {INITIAL_PRICE}, and follow-ups are 30 minutes at {FOLLOW_UP_PRICE}. Recovery differs from person to person. It depends on your condition; your physiotherapist will give you an estimate after your assessment.",
      "The NHS gives some typical timings, which vary with the person and the surgeon. It says people are usually home about 1 to 3 days after the operation if generally fit and the surgery went well, are usually told to wait at least 6 weeks before driving (check with your doctor), and often return to work at about 6 weeks depending on the job. A follow-up with your surgical team is usually around 6 to 12 weeks.",
      "Wound reviews and follow-up visits stay with your surgical team. NICE guidance on joint replacement recommends that people who do their rehabilitation on their own have a point of contact for advice and support, and are offered supervised rehabilitation if they struggle with daily activities or are not meeting their goals. It does not cover rehab by video. Keep your GP or specialist team informed about your treatment.",
    ],
    timeline:
      "The NHS says it may take several months to recover from a hip replacement, with the pace set mostly by the operation itself. We review your walking, strength and everyday movement at each session, and we suggest you speak to your surgical team if your hip is not progressing as expected.",
    inPersonInstead: [
      "Call 999 or go to A&E if you have pain and swelling in your hip or leg and difficulty breathing or chest pains. This could be a blood clot in the lungs.",
      "Do not drive yourself to A&E. Ask someone to drive you, or call 999.",
      "Call 999 or go to A&E if you have severe difficulty breathing, pain in your chest or upper back, a very fast heartbeat, or you collapse. These can be signs of a blood clot in the lungs. Do not drive yourself.",
      "If you have severe hip pain after a fall or injury, cannot walk or put weight on the leg, or have tingling or loss of feeling in the hip or leg after a fall or injury, the NHS says to call 999 or go to A&E. Do not drive yourself.",
      "Ask for an urgent GP appointment or call NHS 111 if you have throbbing or cramping pain in your hip or leg.",
      "If you have a high temperature, or feel hot, cold or shivery, and your hip is red, hot or swollen: go to A&E now, or call NHS 111 straight away if you are not sure where to go. Do not drive yourself if you feel very unwell. NICE CKS guidance for clinicians says hip pain with signs of infection needs emergency referral.",
      "Ask for an urgent GP appointment or call NHS 111 if you have a high temperature, or feel hot, cold or shivery, or if the wound is oozing or has pus.",
      "Ask for an urgent GP appointment or call NHS 111 if the redness, tenderness, swelling or pain in your hip or leg is not getting better or is getting worse. The NHS says these can be signs of infection or a blood clot.",
      "If you cannot walk or put weight on the leg, or have severe hip pain after a fall or injury, call 999 or go to A&E and do not drive yourself (see above). If you have sudden severe hip pain without a fall, ask for an urgent GP appointment or call NHS 111. If you are otherwise worried your hip may have dislocated, contact your surgical team, care team or GP. Wound checks and any complication go back to your surgical team, not to an online rehab session.",
    ],
    faqs: [
      {
        q: "When can I start online physio after a hip replacement?",
        a: "Rehab with us starts once your surgical team has said you are ready for outpatient or community physiotherapy, and we follow any restrictions or precautions they give you. Until then, follow the advice you were given in hospital. If you are unsure whether you are ready, ask your surgical team before booking.",
      },
      {
        q: "What hip precautions should I follow?",
        a: "Follow your surgeon's advice. Precautions are set by your surgical team and can differ between surgeons, so we do not set or change them. Rehab with us starts once your surgical team has said you are ready for outpatient or community physiotherapy, and every exercise we give you stays within the precautions they set. If anything is unclear, ask your surgeon or ward team.",
      },
      {
        q: "Can you check my wound?",
        a: "No. Our service guidance is that wound checks and any complication go back to your surgical team. If the wound is oozing, you feel hot or shivery, or the hip is more red or swollen, use the urgent routes listed on this page.",
      },
      {
        q: "How long does recovery take?",
        a: "The NHS says it may take several months. We cannot give you a firm date, and we review your progress with you at each session.",
      },
    ],
    sources: [
      {
        label: "NHS: Recovering from a hip replacement",
        url: "https://www.nhs.uk/tests-and-treatments/hip-replacement/recovering-from-a-hip-replacement/",
      },
      {
        label: "NICE NG157: Joint replacement (primary): hip, knee and shoulder, recommendations",
        url: "https://www.nice.org.uk/guidance/ng157/chapter/Recommendations",
      },
      {
        label: "NHS: Complications of a hip replacement",
        url: "https://www.nhs.uk/tests-and-treatments/hip-replacement/complications-of-a-hip-replacement/",
      },
      {
        label: "NHS: DVT (deep vein thrombosis)",
        url: "https://www.nhs.uk/conditions/deep-vein-thrombosis-dvt/",
      },
      { label: "NHS: Pulmonary embolism", url: "https://www.nhs.uk/conditions/pulmonary-embolism/" },
      { label: "NHS: Hip pain", url: "https://www.nhs.uk/symptoms/hip-pain/" },
    ],
    exerciseHubSlug: "after-hip-replacement",
    guideSlugs: ["does-online-physiotherapy-work", "what-online-physiotherapy-cannot-do"],
    serviceSlug: "post-surgical-rehabilitation",
    reviewedOn: PHASE_BC_REVIEWED_ON,
  },
  {
    slug: "rotator-cuff-repair-rehab",
    name: "Rotator cuff repair",
    nameInSentence: "rotator cuff repair",
    about: { type: "SurgicalProcedure", name: "Rotator cuff repair" },
    h1: "Online physiotherapy after rotator cuff repair",
    seoTitle: "Online Physio After Rotator Cuff Repair | PhysioOnClick",
    seoDescription:
      "How video physiotherapy fits after rotator cuff repair surgery: sling and protection phases set by your surgeon, what we check, and when to get urgent care.",
    answer:
      "After rotator cuff repair, rehab with us starts once your surgical team has said you are ready for outpatient or community physiotherapy, and we follow any restrictions or precautions they give you. Your surgeon sets the sling and protection phases. On video we guide your home exercises. Wound checks and complications go back to your surgical team. Chest pain with arm or shoulder pain needs 999.",
    howOnlineWorks: [
      "Recovery from a rotator cuff repair is slow and protected at first, because the repaired tendon needs time to heal. How long you wear a sling, what you may do with the arm, and when strengthening can begin are all set by your surgeon and depend on the size of the repair. We do not change those instructions.",
      "To give a sense of the shape, one NHS hospital trust's patient leaflet describes a sling worn for up to six weeks, no weight through the arm for the first three weeks, and physio-led phases that move from protection to regaining everyday movement and then strength. That is one trust's protocol, not a rule for everyone, so follow your own surgeon's protocol.",
      "Rehab with us starts once your surgical team has said you are ready for outpatient or community physiotherapy, and we follow any restrictions or precautions they give you. Before that, the early protected phases stay with your surgical team and the physiotherapy they arrange. Once they say you are ready, our video sessions help you build movement and strength step by step, and we follow any further advice your surgeon gives.",
      "Over video, we cannot see the wound, check the repair by hand, or test strength the way an in-person shoulder clinic can. Our service guidance is that wound checks and any complication go back to your surgical team. We will say so if something we see on video suggests that.",
      "If your shoulder trouble came before surgery, our page on [online physiotherapy for shoulder pain](/online-physiotherapy-for/shoulder-pain) covers that stage. We have not linked an exercise library hub here, because our tendinopathy exercises are written for shoulders that have not been operated on.",
    ],
    assessmentChecks: [
      "Confirmation that your surgical team has said you are ready for outpatient or community physiotherapy, any restrictions or precautions they set, and any further advice they gave you.",
      "The date of your operation, the type and size of the repair if you know them, and what your discharge summary or exercise sheet says.",
      "When you stopped wearing the sling, and how you manage dressing, washing and sleeping.",
      "How far you can move the arm now, and any pain, swelling or stiffness in the shoulder, arm or hand.",
      "What you want to get back to, such as desk work, manual work, driving or sport, and what your surgeon has said about timing.",
      "The warning signs listed below, which we check for during your sessions.",
    ],
    typicalPlan: [
      "Your plan starts once your surgical team has said you are ready for outpatient or community physiotherapy, stays within any restrictions or precautions they set, and builds on the exercises you were given. We add everyday movement and then strength in steps, set milestones with you, and review them at each follow-up. Where your surgeon's advice differs from ours, follow your surgeon.",
      "The first session is a 60-minute video assessment at {INITIAL_PRICE}, and follow-ups are 30 minutes at {FOLLOW_UP_PRICE}. Your operation and your surgeon's protocol both matter here. It depends on your condition; your physiotherapist will give you an estimate after your assessment.",
      "The same trust's leaflet gives some timings as an example only. It describes exercises two to four times a day that may continue at home for up to nine months, desk-based work often returning at around 6 to 8 weeks, manual work at least 3 to 4 months, no driving until after six weeks with the sling off, and non-contact sport at about six months. Your own timings will come from your surgeon.",
      "Follow-ups with your surgical team and shoulder physiotherapy specialist stay with them. Keep your GP or specialist team informed about your treatment.",
    ],
    timeline:
      "Timings depend on the size of the repair and on your surgeon. The hospital leaflet we read describes exercises continuing for up to nine months, with return to non-contact sport at about six months, but that is one trust's protocol, so treat any figure as a rough guide and follow your surgeon's protocol. We review your movement and strength at each session.",
    inPersonInstead: [
      "Call 999 or go to A&E if you have chest pain that feels tight or squeezing, or chest pain spreading to your arms, neck or jaw, or severe difficulty breathing. Do not drive yourself.",
      "Call 999 or go to A&E if you have pain and swelling in a leg together with difficulty breathing or chest pains. This could be a blood clot in the lungs. Do not drive yourself to A&E.",
      "Call 999 or go to A&E if you have severe difficulty breathing, pain in your chest or upper back, a very fast heartbeat, or you collapse. These can be signs of a blood clot in the lungs. Do not drive yourself.",
      "Ask for an urgent GP appointment or call NHS 111 if you have throbbing or cramping pain in one leg, swelling in one leg, or red, blue or darkened skin around a painful area. These can be signs of DVT, a blood clot in a vein.",
      "If you have shoulder pain with red or hot skin over the joint, or a fever, or you feel generally unwell: go to A&E now, or call NHS 111 straight away if you are not sure where to go. Do not drive yourself if you feel very unwell. NICE CKS guidance for clinicians on shoulder pain lists each of these as a possible sign of a joint infection that needs emergency assessment.",
      "If the wound is oozing or has pus, contact your surgical team, and ask for an urgent GP appointment or call NHS 111. If you also have a high temperature, or feel hot, cold or shivery, use the A&E route above. NHS pages on joint replacement list these as signs of infection, and the shoulder surgery leaflet we read gives no separate route.",
      "Wound checks, stitch removal and any complication go back to your surgical team, not to an online rehab session.",
    ],
    faqs: [
      {
        q: "When can I start online physio after rotator cuff repair?",
        a: "Rehab with us starts once your surgical team has said you are ready for outpatient or community physiotherapy, and we follow any restrictions or precautions they give you. Your surgeon sets the sling and protection phases, and those early phases stay with the team they arrange. If you are not sure whether you are ready, ask your surgical team before booking.",
      },
      {
        q: "How long will I wear the sling?",
        a: "That is set by your surgeon, and it depends on the repair. One NHS trust's leaflet describes up to six weeks, but that is only an example. Follow the instructions you were given.",
      },
      {
        q: "Can you check my wound?",
        a: "No. Our service guidance is that wound checks and any complication go back to your surgical team. If the wound is oozing, you feel feverish or you have signs of a blood clot, use the urgent routes listed on this page.",
      },
      {
        q: "Can I drive or go back to work?",
        a: "Ask your surgeon. The leaflet we read describes no driving until after six weeks with the sling off, and return to work depending on the job, but your timings come from your own surgeon and the size of your repair.",
      },
    ],
    sources: [
      {
        label: "University Hospital Southampton NHS Foundation Trust: Rotator cuff repair, after surgery care",
        url: "https://www.uhs.nhs.uk/departments/trauma-and-orthopaedics/shoulders/patient-information/rotator-cuff-repair/rotator-cuff-repair-after-surgery-care",
      },
      {
        label: "NHS: Complications of a knee replacement (used for general post-operative warning signs)",
        url: "https://www.nhs.uk/tests-and-treatments/knee-replacement/complications/",
      },
      {
        label: "NHS: DVT (deep vein thrombosis) (used for general post-operative warning signs)",
        url: "https://www.nhs.uk/conditions/deep-vein-thrombosis-dvt/",
      },
      { label: "NHS: Heart attack", url: "https://www.nhs.uk/conditions/heart-attack/" },
      { label: "NHS: Pulmonary embolism", url: "https://www.nhs.uk/conditions/pulmonary-embolism/" },
      {
        label: "NICE CKS: Shoulder pain (used for shoulder infection warning signs)",
        url: "https://cks.nice.org.uk/topics/shoulder-pain/",
      },
    ],
    guideSlugs: ["does-online-physiotherapy-work", "what-online-physiotherapy-cannot-do"],
    serviceSlug: "post-surgical-rehabilitation",
    reviewedOn: PHASE_BC_REVIEWED_ON,
  },
  {
    slug: "stroke-rehabilitation",
    name: "Stroke recovery",
    nameInSentence: "stroke recovery",
    about: { type: "MedicalCondition", name: "Stroke" },
    h1: "Online physiotherapy for stroke recovery",
    seoTitle: "Online Physiotherapy for Stroke Recovery | PhysioOnClick",
    seoDescription:
      "Video physiotherapy to support stroke recovery after hospital discharge: who it suits, the clearance you need first, what we check and when 999 applies.",
    answer:
      "If you are medically stable after leaving hospital, a video session lets your physiotherapist watch how you move and set up practice for walking, balance and everyday tasks, with a carer welcome to join. Before you start, your GP or specialist team must confirm it is safe for you to begin physiotherapy. Face drooping, arm weakness or slurred speech means 999.",
    howOnlineWorks: [
      "Our neurological rehabilitation service is for people who are medically stable and whose hospital care has been arranged. It does not replace your NHS stroke team or your GP. Before you start, your GP or specialist team must confirm it is safe for you to begin physiotherapy. Our service guidance says online sessions are for guided, ongoing practice once you are stable, and that any new or sudden symptoms are an emergency, not an appointment.",
      "The NHS says a stroke rehabilitation plan may include physiotherapy and exercises to help with movement, and that recovery can take months or years. It also says rehabilitation can be done in person or online, which it calls telerehabilitation, and that your healthcare team should provide equipment and training or technical support if you need them.",
      "NICE guidance on stroke rehabilitation in adults (NG236) says telerehabilitation can be considered instead of, or as well as, face-to-face therapy, but only if the person agrees or it is their preferred type of therapy and it fits their rehabilitation goals. It also says people should have the right equipment and training or support, and should be monitored to check that they are benefiting and are not developing signs of depression. NICE does not endorse our service. We mention the guidance because those conditions are the ones we try to meet.",
      "In practice we start by asking which everyday activities matter most to you, for example getting around outside, using stairs or using your arm at home. Our service guidance says early movement checks over video are done seated or with support, and that a family member or carer can join you and help get the room ready.",
      "Video has limits. We cannot touch the affected limb or catch you if you lose your balance, so we choose movements that can be done safely at home with something solid nearby and, where needed, another person in the room. If a task does not look safe on video, we will say so and suggest in-person therapy through your NHS team instead.",
    ],
    assessmentChecks: [
      "Confirmation that your GP or specialist team has said it is safe for you to begin physiotherapy, your stroke history in your own words, and what your discharge letter said about exercise.",
      "Whether you feel well enough to take part now, and whether your doctors have said anything about activity or driving.",
      "How you move around your home: getting out of a chair, walking, using stairs, and which aids you use.",
      "Balance and strength in the arm and leg, checked through simple movements done seated or with support.",
      "Who can be with you during the session, such as a family member or carer, and whether your camera and room set-up are safe for the movements we plan.",
      "Your mood, tiredness and confidence, because NICE says people doing telerehabilitation should be monitored for signs of depression, and we will suggest you speak to your GP or stroke team if you are struggling.",
    ],
    typicalPlan: [
      "Your plan is built around goals you choose, for example getting around more easily or using your arm more in daily life. We turn them into a short routine you can repeat at home, usually seated or supported at first, and we change it as you progress.",
      "The first session is a 60-minute video assessment at {INITIAL_PRICE}, and follow-ups are 30 minutes at {FOLLOW_UP_PRICE}. Triage at booking confirms whether video suits you, and we will tell you before you pay if it does not.",
      "Our service guidance says a carer can help you keep practising in between sessions. In our approach, we do not give a fixed timeline, because stroke recovery looks different for each person we see. We review progress against the things you wanted to do again.",
      "Keep your GP or specialist team informed about your treatment. The NHS says a review of your progress should happen after about 6 months, and we do not replace that review. NICE guidance on stroke rehabilitation recommends physiotherapy for people with weakness, changes in feeling or balance problems that affect movement after a stroke.",
    ],
    timeline:
      "The NHS says stroke recovery can take months or years, so we do not promise a date. Our service guidance says reviews look at things you can feel, such as walking further or needing less support, rather than a fixed timeline. We review these with you and your carer at each session.",
    inPersonInstead: [
      "Call 999 now if you think you or someone with you is having a stroke. Use FAST: Face drooping, Arm weakness, Speech difficulty, and Time to call 999. Other signs include weakness or numbness down one side, blurred vision or loss of sight, and dizziness. Do not drive yourself to A&E.",
      "A stroke needs urgent medical help in hospital. A sudden new symptom is not something to raise at a physio session.",
      "If you have severe hip pain after a fall or injury, cannot walk or put weight on the leg, or have tingling or loss of feeling in the hip or leg after a fall or injury, the NHS says to call 999 or go to A&E. Do not drive yourself.",
      "After a head injury, such as in a fall, the NHS says to call 999 if, for example, the person has been knocked out and has not woken up, cannot stay awake, has a seizure, has fallen from a height of more than 1 metre or 5 stairs, has problems with their vision or hearing, has clear fluid coming from their ears or nose, has new numbness or weakness, has problems with walking, balance, understanding, speaking or writing, or their behaviour has changed. This is not the full list, so see the NHS head injury page listed in the sources. If you take blood thinners, are being sick or feel dizzy after a head injury, contact NHS 111. Do not drive yourself to A&E.",
      "Any sudden or new change in your speech, such as slurred or lost words, goes to the 999 line above and does not wait for a session. For worries that are not an emergency, such as new low mood, ongoing swallowing or speech difficulties you already have, or a plan that no longer feels right, contact your stroke team or GP. Online sessions are not for acute care.",
      "Video sessions cannot include hands-on therapy. If you live in the Glasgow area, a home visit can include hands-on treatment (manual therapy) where appropriate. If you need equipment set up in person, we cannot provide that by video. Triage at booking tells you honestly if video does not suit you.",
    ],
    faqs: [
      {
        q: "Can I have online physiotherapy after a stroke?",
        a: "If you are medically stable and your hospital care has been arranged, it may suit you. The NHS says stroke rehabilitation can be done in person or online. Triage at booking confirms whether video suits you, and a carer is welcome to join.",
      },
      {
        q: "Does this replace my NHS stroke team?",
        a: "No. We are a separate private service and we do not replace your NHS stroke team or any other therapists. Keep your GP or specialist team informed about your treatment.",
      },
      {
        q: "Do I need anyone's go-ahead before I start?",
        a: "Yes. Before you start, your GP or specialist team must confirm it is safe for you to begin physiotherapy. We ask about this at booking, and triage confirms whether video suits you.",
      },
      {
        q: "Can my carer or family come to the session?",
        a: "Yes. Our service guidance says a family member or carer can join, help get the room ready and help you keep practising in between sessions.",
      },
      {
        q: "What should I do if I think I am having another stroke?",
        a: "Call 999 straight away and do not drive yourself. Face drooping, arm weakness and speech difficulty are signs to act on at once.",
      },
    ],
    sources: [
      {
        label: "NHS: Stroke recovery",
        url: "https://www.nhs.uk/conditions/stroke/recovery/",
      },
      {
        label: "NICE: Stroke rehabilitation in adults (NG236)",
        url: "https://www.nice.org.uk/guidance/ng236",
      },
      {
        label: "NICE NG236: Stroke rehabilitation in adults, recommendations",
        url: "https://www.nice.org.uk/guidance/ng236/chapter/Recommendations",
      },
      {
        label: "NHS: Stroke symptoms",
        url: "https://www.nhs.uk/conditions/stroke/symptoms/",
      },
      {
        label: "NHS: Hip pain",
        url: "https://www.nhs.uk/symptoms/hip-pain/",
      },
      {
        label: "NHS: Stroke",
        url: "https://www.nhs.uk/conditions/stroke/",
      },
      {
        label: "NHS: Head injury and concussion",
        url: "https://www.nhs.uk/conditions/head-injury-and-concussion/",
      },
    ],
    guideSlugs: ["does-online-physiotherapy-work", "what-online-physiotherapy-cannot-do"],
    serviceSlug: "neurological-rehabilitation",
    reviewedOn: PHASE_BC_REVIEWED_ON,
  },
  {
    slug: "parkinsons",
    name: "Parkinson's",
    nameInSentence: "Parkinson's",
    h1: "Online physiotherapy for Parkinson's",
    seoTitle: "Online Physiotherapy for Parkinson's | PhysioOnClick",
    seoDescription:
      "How video physiotherapy can support movement, walking and balance with Parkinson's: the clearance you need first, what we check, and when to call 999.",
    answer:
      "If you are medically stable, a video session lets your physiotherapist watch how you walk and move and set up exercises for stiffness, walking, balance and falls risk, with a carer welcome to join. Before you start, your GP or specialist team must confirm it is safe for you to begin physiotherapy. We make no claim to change the condition itself. Stroke signs mean 999.",
    howOnlineWorks: [
      "The NHS lists physiotherapy among the supportive therapies for Parkinson's. It says a physiotherapist can work on muscle stiffness and joint pain through movement and exercise, with the aim of making moving easier and improving walking, flexibility and fitness. NICE guidance recommends Parkinson's-specific physiotherapy for people with balance or movement problems. It does not cover video sessions or our service.",
      "We do not claim that exercise changes the course of Parkinson's. Our aim is practical: movement, walking, balance and confidence in daily life. Your care plan stays with your Parkinson's team, and the NHS says that plan should be agreed with your healthcare team and reviewed regularly, because regular reviews are needed as the condition progresses.",
      "Our neurological rehabilitation service is for people who are medically stable, and it does not replace your Parkinson's team or GP. Before you start, your GP or specialist team must confirm it is safe for you to begin physiotherapy. Our service guidance says a family member or carer can join the session and help get the room ready.",
      "If falls are a worry for you, we look at balance and the way you walk. NICE falls guidance, which covers older people and people aged 50 and over at higher risk, recommends a falls prevention exercise programme for those who have fallen in the past year and have a walking or balance problem. Our [gait and mobility assessment](/services/gait-and-mobility-assessment) covers walking analysis and planning in more detail.",
      "Video has limits. We cannot catch you if you lose your balance, so we plan movements you can do with something solid nearby and, if needed, another person with you. We cannot adjust medicines or assess how your Parkinson's is progressing; those stay with your Parkinson's team.",
    ],
    assessmentChecks: [
      "What you want to keep doing or get back to, such as walking outdoors, getting up from a chair or turning over in bed.",
      "How you walk and turn, how you get out of a chair, and whether you feel steady, stiff or hesitant at certain moments.",
      "Any falls or near-falls, and where and how they tend to happen.",
      "Confirmation that your GP or specialist team has said it is safe for you to begin physiotherapy, your current exercise, and any advice you have already had from your Parkinson's team.",
      "Whether the room you will use at home is safe for movement checks, and who can be with you.",
      "Your energy and confidence, and what you find hard to keep up between sessions.",
    ],
    typicalPlan: [
      "Your plan starts from your goals and from a few simple movement checks over video. We build a short routine for stiffness, walking and balance that you can repeat at home, and we adjust it as things change.",
      "The first session is a 60-minute video assessment at {INITIAL_PRICE}, and follow-ups are 30 minutes at {FOLLOW_UP_PRICE}. Triage at booking confirms whether video suits you, and we will say so plainly if it does not.",
      "Because the NHS says Parkinson's care needs regular reviews as the condition progresses, we expect your plan to change over time. We review it with you at follow-ups. Keep your GP or specialist team informed about your treatment.",
      "Our service guidance says reviews look at everyday change that you notice for yourself, not at a set timetable. We use the same approach here.",
    ],
    timeline:
      "Parkinson's changes over time, so we do not give a timeline or promise a result. We review your walking, balance and daily movement with you at each session, and we suggest you speak to your Parkinson's team if you notice changes in your symptoms or your medicines.",
    inPersonInstead: [
      "Call 999 now if you think you or someone with you is having a stroke. Use FAST: Face drooping, Arm weakness, Speech difficulty, and Time to call 999. Other signs include weakness or numbness down one side, blurred vision or loss of sight, and dizziness. Do not drive yourself to A&E.",
      "If you have severe hip pain after a fall or injury, cannot walk or put weight on the leg, or have tingling or loss of feeling in the hip or leg after a fall or injury, the NHS says to call 999 or go to A&E. Do not drive yourself.",
      "After a head injury, such as in a fall, the NHS says to call 999 if, for example, the person has been knocked out and has not woken up, cannot stay awake, has a seizure, has fallen from a height of more than 1 metre or 5 stairs, has problems with their vision or hearing, has clear fluid coming from their ears or nose, has new numbness or weakness, has problems with walking, balance, understanding, speaking or writing, or their behaviour has changed. This is not the full list, so see the NHS head injury page listed in the sources. If you take blood thinners, are being sick or feel dizzy after a head injury, contact NHS 111. Do not drive yourself to A&E.",
      "If you have fallen in the past year and were hurt, could not get up on your own, blacked out, or have fallen 2 or more times, NICE falls guidance for older people and people aged 50 and over at higher risk recommends offering a full falls assessment to people in that situation. Ask your GP or local falls service about this rather than relying on video sessions alone.",
      "For worries about your medicines, new symptoms or your care plan, speak to your Parkinson's team or GP. The NHS says your plan is agreed with your healthcare team, and we do not change it.",
      "If you cannot move safely at home without hands-on help, or need equipment fitted in person, we cannot provide that by video; if you live in the Glasgow area, ask us about a home visit. Our service is for people who are medically stable, not for acute care.",
    ],
    faqs: [
      {
        q: "Can physiotherapy help with Parkinson's?",
        a: "The NHS lists physiotherapy among supportive therapies, with the aim of making moving easier and improving walking, flexibility and fitness. We do not claim it changes the course of the condition.",
      },
      {
        q: "Can I do this by video if I live alone?",
        a: "It depends on safety. We plan movements with something solid nearby, and triage at booking confirms whether video suits you. A family member or carer is welcome to join if that helps.",
      },
      {
        q: "Do you work with my Parkinson's team?",
        a: "No. We are a separate private service and we do not replace your Parkinson's team. Keep your GP or specialist team informed about your treatment.",
      },
      {
        q: "Do I need anyone's go-ahead before I start?",
        a: "Yes. Before you start, your GP or specialist team must confirm it is safe for you to begin physiotherapy. We ask about this at booking, and triage confirms whether video suits you.",
      },
      {
        q: "Can you help with falls?",
        a: "We look at balance and walking, and our [gait and mobility assessment](/services/gait-and-mobility-assessment) service covers this in more detail. If you have fallen and are hurt, use the urgent routes listed on this page first.",
      },
    ],
    sources: [
      {
        label: "NHS: Parkinson's disease treatment",
        url: "https://www.nhs.uk/conditions/parkinsons-disease/treatment/",
      },
      {
        label: "NICE NG71: Parkinson's disease in adults, recommendations",
        url: "https://www.nice.org.uk/guidance/ng71/chapter/Recommendations",
      },
      {
        label: "NICE NG249: Falls - assessment and prevention, recommendations",
        url: "https://www.nice.org.uk/guidance/ng249/chapter/Recommendations",
      },
      {
        label: "NHS: Stroke symptoms",
        url: "https://www.nhs.uk/conditions/stroke/symptoms/",
      },
      {
        label: "NHS: Hip pain",
        url: "https://www.nhs.uk/symptoms/hip-pain/",
      },
      {
        label: "NHS: Head injury and concussion",
        url: "https://www.nhs.uk/conditions/head-injury-and-concussion/",
      },
    ],
    exerciseHubSlug: "falls-prevention",
    hubBacklink: false,
    guideSlugs: ["does-online-physiotherapy-work", "what-online-physiotherapy-cannot-do"],
    serviceSlug: "neurological-rehabilitation",
    reviewedOn: PHASE_BC_REVIEWED_ON,
  },
  {
    slug: "multiple-sclerosis",
    name: "Multiple sclerosis",
    nameInSentence: "MS",
    h1: "Online physiotherapy for multiple sclerosis",
    seoTitle: "Online Physiotherapy for Multiple Sclerosis | PhysioOnClick",
    seoDescription:
      "How video physiotherapy can support movement problems and muscle pain in multiple sclerosis: the clearance you need first, and when to call 999 or go to A&E.",
    answer:
      "If you are medically stable, a video session lets your physiotherapist watch how you move and set up exercises for movement problems and muscle pain, with a carer welcome to join. Before you start, your GP or specialist team must confirm it is safe for you to begin physiotherapy. We do not manage relapses. Sudden arm weakness or vision loss means 999.",
    howOnlineWorks: [
      "The NHS lists physiotherapy and exercises to help with movement problems and muscle pain among the support for MS symptoms. It says the team around you may include an MS nurse, a neurologist, a physiotherapist and an occupational therapist. We are a separate private service, not part of that team, and we do not replace it. NICE guidance on MS recommends encouraging people with MS to exercise, and says regular exercise may help and will not make MS worse.",
      "We make no claim that physiotherapy changes the course of MS. Our focus is on how you move and what you want to keep doing: walking, balance, stiffness and everyday tasks. Medicines, relapse care and decisions about your condition stay with your MS team.",
      "Our neurological rehabilitation service is for people who are medically stable. Before you start, your GP or specialist team must confirm it is safe for you to begin physiotherapy. Our service guidance says a family member or carer can join the session and help get the room ready, and that early movement checks are done seated or with support.",
      "The NHS describes relapsing remitting MS as having flare-ups of symptoms, called relapses, that then go away or improve. We cannot judge a relapse over video. If none of the 999 signs on this page apply and you think you are having a relapse, our approach is to ask you to contact your MS team or GP. We pause your sessions until your GP or MS team has cleared you to restart.",
      "Video has limits. We cannot catch you if you lose your balance, so we plan movements that can be done safely at home with something solid nearby and, if needed, another person with you. If a movement does not look safe on camera, we will say so and suggest in-person therapy through your NHS team.",
    ],
    assessmentChecks: [
      "What you want to be able to do, in your own words, and what has become harder recently.",
      "Where you feel stiffness, muscle pain or weakness, and how it affects walking, standing and everyday tasks.",
      "How you walk, turn and get out of a chair, and what you use for support.",
      "Whether your symptoms have changed suddenly, which we will route to your MS team or the urgent options below instead of continuing.",
      "Confirmation that your GP or specialist team has said it is safe for you to begin physiotherapy, and what advice they have given about exercise.",
      "Whether your room and set-up at home are safe for the movements we plan, and who can be with you.",
    ],
    typicalPlan: [
      "Your plan starts from your goals and a few simple movement checks over video. We build a short routine for movement and muscle pain that you can repeat at home, and we adjust it as your needs change.",
      "The first session is a 60-minute video assessment at {INITIAL_PRICE}, and follow-ups are 30 minutes at {FOLLOW_UP_PRICE}. Triage at booking confirms whether video suits you, and we will say so plainly before you pay if it does not.",
      "MS varies from person to person and over time, so we review your plan with you at each follow-up rather than following a fixed timeline. Keep your GP or specialist team informed about your treatment.",
      "Our service guidance says reviews look at everyday change that you notice for yourself. We use the same approach for MS and keep exercise decisions in line with advice from your MS team.",
    ],
    timeline:
      "We do not promise a timeline or a result, because MS differs between people and can change over time. We review your movement and daily tasks with you at each session, and we suggest you speak to your MS team if your symptoms change.",
    inPersonInstead: [
      "Call 999 now if you think you or someone with you is having a stroke. Use FAST: Face drooping, Arm weakness, Speech difficulty, and Time to call 999. Other signs include weakness or numbness down one side, blurred vision or loss of sight, and dizziness. Do not drive yourself to A&E.",
      "The NHS MS page says to call 999 or go to A&E if you have sudden weakness or numbness in one arm, loss or blurring of vision, or problems with balance and co-ordination, because these could be signs of a stroke. Do not drive to A&E.",
      "If you have severe hip pain after a fall or injury, cannot walk or put weight on the leg, or have tingling or loss of feeling in the hip or leg after a fall or injury, the NHS says to call 999 or go to A&E. Do not drive yourself.",
      "After a head injury, such as in a fall, the NHS says to call 999 if, for example, the person has been knocked out and has not woken up, cannot stay awake, has a seizure, has fallen from a height of more than 1 metre or 5 stairs, has problems with their vision or hearing, has clear fluid coming from their ears or nose, has new numbness or weakness, has problems with walking, balance, understanding, speaking or writing, or their behaviour has changed. This is not the full list, so see the NHS head injury page listed in the sources. If you take blood thinners, are being sick or feel dizzy after a head injury, contact NHS 111. Do not drive yourself to A&E.",
      "If none of the 999 signs above apply and you think you are having a relapse, our approach is to ask you to contact your MS team or GP. We cannot assess a relapse over video, and we pause your sessions with us until your GP or MS team has cleared you to restart.",
      "If you have symptoms you think could be MS but have no diagnosis, the NHS says to see a GP. Online sessions with us do not replace a diagnosis.",
      "Video sessions cannot include hands-on therapy. If you live in the Glasgow area, a home visit can include hands-on treatment (manual therapy) where appropriate. If you need equipment set up in person, we cannot provide it by video. Triage at booking tells you honestly if video does not suit you.",
    ],
    faqs: [
      {
        q: "Can physiotherapy help with MS?",
        a: "The NHS lists physiotherapy and exercises to help with movement problems and muscle pain among the support for MS symptoms. We make no claim that it changes the course of the condition.",
      },
      {
        q: "Do you manage MS relapses?",
        a: "No. If you have sudden weakness or numbness in one arm, loss or blurring of vision, or problems with balance and co-ordination, call 999 or go to A&E and do not drive yourself. If none of those apply and you think you are having a relapse, contact your MS team or GP. We pause your sessions until your GP or MS team clears you to restart.",
      },
      {
        q: "Do you work with my MS nurse or neurologist?",
        a: "No. We are a separate private service and we do not replace your MS team. Keep your GP or specialist team informed about your treatment.",
      },
      {
        q: "Do I need anyone's go-ahead before I start?",
        a: "Yes. Before you start, your GP or specialist team must confirm it is safe for you to begin physiotherapy. We ask about this at booking, and triage confirms whether video suits you.",
      },
      {
        q: "Can my carer join the session?",
        a: "Yes. Our service guidance says a family member or carer can join and help get the room ready.",
      },
    ],
    sources: [
      {
        label: "NHS: Multiple sclerosis",
        url: "https://www.nhs.uk/conditions/multiple-sclerosis/",
      },
      {
        label: "NICE NG220: Multiple sclerosis in adults, recommendations",
        url: "https://www.nice.org.uk/guidance/ng220/chapter/Recommendations",
      },
      {
        label: "NHS: Stroke symptoms",
        url: "https://www.nhs.uk/conditions/stroke/symptoms/",
      },
      { label: "NHS: Hip pain", url: "https://www.nhs.uk/symptoms/hip-pain/" },
      {
        label: "NHS: Head injury and concussion",
        url: "https://www.nhs.uk/conditions/head-injury-and-concussion/",
      },
    ],
    guideSlugs: ["does-online-physiotherapy-work", "what-online-physiotherapy-cannot-do"],
    serviceSlug: "neurological-rehabilitation",
    reviewedOn: PHASE_BC_REVIEWED_ON,
  },
  {
    slug: "functional-neurological-disorder",
    name: "Functional neurological disorder",
    nameInSentence: "FND",
    h1: "Online physiotherapy for functional neurological disorder (FND)",
    seoTitle: "Online Physiotherapy for FND | PhysioOnClick",
    seoDescription:
      "What online physiotherapy can and cannot offer for functional neurological disorder (FND): a neurologist diagnoses it, outcomes vary, and when to call 999.",
    answer:
      "Functional neurological disorder (FND) is diagnosed by a neurologist, not by us. If you already have a diagnosis and are medically stable, a video session lets your physiotherapist work on movement and activity. Before you start, your GP or specialist team must confirm it is safe for you to begin physiotherapy. Outcomes vary between people and we promise none. Stroke signs mean 999.",
    howOnlineWorks: [
      "FND is diagnosed by a neurologist. We do not diagnose it, and we ask you to have a diagnosis from a neurologist before we start. If you are unsure whether your symptoms are FND, speak to your GP about seeing a neurologist rather than booking with us.",
      "NHS inform says that specialised physiotherapy can be useful in treating FND, and that it helps remind the body how it should move and helps build up lost strength and stamina. It also says outcomes vary: some people benefit a lot and may go into remission, while others continue to have symptoms despite treatment. We do not promise any outcome, and our online service is general physiotherapy support that does not replace care from your neurology team.",
      "A UK trial called Physio4FMD, published in The Lancet Neurology in 2024, looked at specialist physiotherapy for functional motor disorder in adults with a neurologist's diagnosis. It did not find a difference in its main measure of physical functioning at 12 months compared with usual care from community neurological physiotherapy. People given the specialist treatment more often rated their motor symptoms as improved, and the authors describe both kinds of physiotherapy as safe and valued for selected patients. The trial abstract does not describe video sessions, so it is not evidence about our service.",
      "Our neurological rehabilitation service is for people who are medically stable. Before you start, your GP or specialist team must confirm it is safe for you to begin physiotherapy. Our service guidance says a family member or carer can join the session and help get the room ready. We work at a pace you can manage. Keep your GP or specialist team informed about your treatment.",
      "NICE guidance on rehabilitation for chronic neurological disorders (NG252, published in 2025) includes FND. It recommends that people with FND are offered activities that encourage and enable recovery of movement and function, built around goals and focused on movement while moving attention away from symptoms. It also says a registered practitioner, such as a physiotherapist, should develop and oversee an exercise programme with the person. NICE does not promise recovery and says nothing about our service.",
      "Video has limits. We cannot examine you by hand, and we cannot catch you if you lose your balance, so we plan movements you can do safely at home. If video does not suit you, we will say so and suggest in-person care through your NHS team.",
    ],
    assessmentChecks: [
      "Your diagnosis, who made it, and confirmation that your GP or specialist team has said it is safe for you to begin physiotherapy.",
      "What you want to be able to do, in your own words, and what has become harder.",
      "How your symptoms affect movement, walking, tiredness and daily tasks, and what tends to make them better or worse.",
      "What other care you are having, such as support from a neurology team or psychological support, so that our plan does not clash with it.",
      "Whether your room and set-up at home are safe for the movements we plan, and who can be with you.",
      "Whether any new symptom has appeared suddenly, which we will route using the urgent options below.",
    ],
    typicalPlan: [
      "We begin with what you want to do and a few gentle movement checks over video. From that we build a short routine to repeat at home, at a pace you can manage, and we change it as you tell us what is working and what is not.",
      "Your first appointment is a 60-minute video assessment at {INITIAL_PRICE}, then 30-minute follow-ups at {FOLLOW_UP_PRICE}. Triage at booking confirms whether video suits you, and we tell you before you pay if it does not.",
      "Because outcomes vary between people, we do not give a timeline or a prediction. We review the plan with you at each follow-up. Keep your GP or specialist team informed about your treatment.",
      "If a plan is not helping, we will say so and talk about whether a different kind of care, such as in-person therapy through your NHS team, would suit you better.",
    ],
    timeline:
      "NHS inform says outcomes vary: some people benefit a lot and may go into remission, and others continue to have symptoms despite treatment. We cannot predict where you will be, so we review your movement and daily tasks with you at each session.",
    inPersonInstead: [
      "Call 999 now if you think you or someone with you is having a stroke. Use FAST: Face drooping, Arm weakness, Speech difficulty, and Time to call 999. Other signs include weakness or numbness down one side, blurred vision or loss of sight, and dizziness. Do not drive yourself to A&E.",
      "Do not assume a sudden new symptom is part of FND. If it matches the stroke signs above, call 999. For other new or changing symptoms, speak to your GP or neurology team rather than waiting for a physio session.",
      "If you have severe hip pain after a fall or injury, cannot walk or put weight on the leg, or have tingling or loss of feeling in the hip or leg after a fall or injury, the NHS says to call 999 or go to A&E. Do not drive yourself.",
      "After a head injury, such as in a fall, the NHS says to call 999 if, for example, the person has been knocked out and has not woken up, cannot stay awake, has a seizure, has fallen from a height of more than 1 metre or 5 stairs, has problems with their vision or hearing, has clear fluid coming from their ears or nose, has new numbness or weakness, has problems with walking, balance, understanding, speaking or writing, or their behaviour has changed. This is not the full list, so see the NHS head injury page listed in the sources. If you take blood thinners, are being sick or feel dizzy after a head injury, contact NHS 111. Do not drive yourself to A&E.",
      "If you have symptoms but no diagnosis, speak to your GP. Diagnosis of FND comes from a neurologist, and online sessions with us do not replace that.",
      "Video sessions cannot include hands-on therapy. If you live in the Glasgow area, a home visit can include hands-on treatment (manual therapy) where appropriate. Triage at booking tells you honestly if video does not suit you.",
    ],
    faqs: [
      {
        q: "Can you diagnose FND?",
        a: "No. FND is diagnosed by a neurologist. We ask for a diagnosis before we start, and if you do not have one, speak to your GP. Before you start, your GP or specialist team must confirm it is safe for you to begin physiotherapy.",
      },
      {
        q: "Does physiotherapy work for FND?",
        a: "NHS inform says specialised physiotherapy can be useful and that outcomes vary, with some people benefiting a lot and others continuing to have symptoms. The Physio4FMD trial did not find a difference in its main measure of physical functioning at 12 months, though more people given specialist physiotherapy rated their motor symptoms as improved and it was described as safe and valued. We make no promise of any outcome.",
      },
      {
        q: "Was Physio4FMD about video physiotherapy?",
        a: "No. The abstract does not describe video delivery, so the trial is not evidence about our service.",
      },
      {
        q: "Can a carer or family member join?",
        a: "Yes. Our service guidance says a family member or carer can join and help get the room ready.",
      },
    ],
    sources: [
      {
        label: "NHS inform: Functional neurological disorder (FND)",
        url: "https://www.nhsinform.scot/illnesses-and-conditions/brain-nerves-and-spinal-cord/functional-neurological-disorder/",
      },
      {
        label: "NICE NG252: Rehabilitation for chronic neurological disorders including acquired brain injury",
        url: "https://www.nice.org.uk/guidance/ng252",
      },
      {
        label: "NICE NG252: Rehabilitation to maintain, improve or support function",
        url: "https://www.nice.org.uk/guidance/ng252/chapter/Rehabilitation-to-maintain-improve-or-support-function",
      },
      {
        label: "Physio4FMD trial, The Lancet Neurology (2024)",
        url: "https://doi.org/10.1016/S1474-4422(24)00135-2",
      },
      {
        label: "Physio4FMD trial abstract (Europe PMC)",
        url: "https://europepmc.org/article/MED/38768621",
      },
      {
        label: "NHS: Stroke symptoms",
        url: "https://www.nhs.uk/conditions/stroke/symptoms/",
      },
      { label: "NHS: Hip pain", url: "https://www.nhs.uk/symptoms/hip-pain/" },
      {
        label: "NHS: Head injury and concussion",
        url: "https://www.nhs.uk/conditions/head-injury-and-concussion/",
      },
    ],
    guideSlugs: ["does-online-physiotherapy-work", "what-online-physiotherapy-cannot-do"],
    serviceSlug: "neurological-rehabilitation",
    reviewedOn: PHASE_BC_REVIEWED_ON,
  },
];

/** The condition name as it reads mid-sentence; keeps proper nouns intact. */
export function sentenceName(p: OnlinePhysioPage): string {
  return p.nameInSentence ?? p.name.toLowerCase();
}

export function getOnlinePhysioPage(slug: string): OnlinePhysioPage | null {
  return onlinePhysioPages.find((p) => p.slug === slug) ?? null;
}

export function allOnlinePhysioSlugs(): string[] {
  return onlinePhysioPages.map((p) => p.slug);
}

/** Reverse lookup: the landing page whose exercise hub is `hubSlug` (a slug in lib/conditions.ts). */
export function onlinePhysioPageForHub(hubSlug: string): OnlinePhysioPage | null {
  return onlinePhysioPages.find((p) => p.exerciseHubSlug === hubSlug && p.hubBacklink !== false) ?? null;
}
