/**
 * Condition hubs for the public exercise library (Phase 1).
 *
 * Each record is one future condition-hub page: a plain-language explanation of
 * the problem, who the staged programme suits, the programme itself (stages of
 * exercises drawn from `lib/exercises.ts` by their `slug`), condition-specific
 * red flags, a rough recovery timeline, guidance on when to move on a stage, and
 * a short FAQ.
 *
 * This copy is AI-drafted to a shared house style and is pending clinical
 * sign-off from Shivaliba Zala (HCPC-registered physiotherapist). Nothing here
 * is on the production site until she has reviewed
 * `docs/exercises-review/condition-hubs.md`. `reviewedOn` is a placeholder date
 * until then.
 *
 * House style: plain UK English, calm and never alarmist, evidence-informed,
 * around reading age 12. Straight quotes only, hyphen not dash, Latin-1
 * characters only (enforced by tests/lib/conditions.test.ts).
 */

export type ConditionStage = {
  stage: string;
  blurb: string;
  exerciseSlugs: string[];
};

export type Condition = {
  slug: string;
  name: string;
  aka?: string[];
  serviceSlug?: string;
  bodyArea: string;
  seoTitle: string;
  seoDescription: string;
  intro: string;
  whoItHelps: string;
  program: ConditionStage[];
  redFlags: string[];
  recoveryTimeline: string;
  progressGuidance: string;
  faqs: { q: string; a: string }[];
  relatedConditionSlugs?: string[];
  relatedBlogSlugs?: string[];
  reviewedBy: string;
  reviewedOn: string;
};

const REVIEWED_BY = "Shivaliba Zala";
const REVIEWED_ON = "2026-09-08";

/** Standard "get assessed" red flag added to every condition. */
const GENERAL_RED_FLAGS = [
  "The pain followed a significant accident, fall or direct blow and you have not been checked over",
  "You feel unwell with the pain - a fever, night sweats, or losing weight without trying",
  "The area is hot, very swollen and red, especially if you also feel feverish",
  "Pain that is severe, steadily getting worse, or keeps you awake every night and does not ease with a change of position",
];

export const conditions: Condition[] = [
  {
    slug: "rotator-cuff-tendinopathy",
    name: "Rotator cuff tendinopathy",
    aka: ["rotator cuff tendinitis", "rotator cuff related shoulder pain", "shoulder impingement"],
    serviceSlug: "musculoskeletal-physiotherapy",
    bodyArea: "Shoulder",
    seoTitle: "Rotator cuff tendinopathy exercises | PhysioOnClick",
    seoDescription:
      "A staged exercise programme for rotator cuff tendinopathy from a HCPC-registered physiotherapist - what to do, how to progress, and when to get assessed.",
    intro:
      "The rotator cuff is a group of four small muscles that wrap around the top of the arm bone and blend into the shoulder blade. While the bigger muscles do the lifting, the cuff quietly keeps the ball of the joint centred in its shallow socket. Rotator cuff tendinopathy means one or more of those tendons has become irritated and temporarily less able to cope with load. The tendon is sensitive, not falling apart.\n\nIt usually follows a change rather than an accident: a weekend painting a ceiling, a new gym programme, a return to racket sport after months off, or weeks of decorating. Age plays a part too, because tendons become a little less tolerant of sudden spikes in load from the forties onwards, so the same amount of overhead work bites harder than it once did.\n\nThe typical picture is a nagging ache over the outer shoulder and upper arm rather than one sharp spot. Reaching to a high shelf, putting on a coat, fastening a seatbelt or getting the arm behind your back tends to catch it, and lying on that side at night is often what people mind most. It settles with the arm supported and grumbles after a busy day.\n\nIt is sore rather than dangerous, and the outlook is good. Most people feel the edge come off within a few weeks of sensible loading, with fuller strength and comfort over three to six months. Tendons change slowly, so steady work across weeks matters far more than any single hard session. This programme calms the shoulder and keeps it moving, rebuilds the strength and control of the cuff and shoulder-blade muscles, then rebuilds your tolerance for overhead and carrying work.",
    whoItHelps:
      "Adults with a gradual onset of outer-shoulder pain that is worse with reaching, lifting or lying on it, and no history of a significant injury or trauma. If your shoulder suddenly became weak after a fall or a heavy pull, get it assessed first.",
    program: [
      {
        stage: "Settle the pain",
        blurb:
          "Start here while the shoulder is irritable. The aim is gentle movement and light activation without flaring the ache. A short-lived niggle up to about 3 out of 10 that settles quickly is acceptable.",
        exerciseSlugs: ["scapular-setting", "pendulum-swing", "shoulder-flexion"],
      },
      {
        stage: "Build strength",
        blurb:
          "Move on when day-to-day reaching is more comfortable and sleep has improved. Load the rotator cuff and shoulder-blade muscles two to three times a week, working to a firm but manageable effort.",
        exerciseSlugs: [
          "shoulder-external-rotation-band",
          "shoulder-internal-rotation-band",
          "scapular-retraction-band-row",
          "wall-slide",
        ],
      },
      {
        stage: "Return to activity",
        blurb:
          "The final stage rebuilds tolerance for overhead and weight-bearing tasks. Add these once the strength work feels comfortable, and build the volume of your sport or work back up gradually rather than all at once.",
        exerciseSlugs: ["prone-y-t-w-raises", "push-up-plus-wall-or-floor", "overhead-press-progression"],
      },
    ],
    redFlags: [
      "Your arm became weak or you could not lift it at all straight after an injury - this may be a cuff tear that needs assessing",
      "Pins and needles or weakness spreading down the arm into the hand",
      "The shoulder looks an odd shape or you cannot move it after a fall - it may be dislocated or fractured",
      ...GENERAL_RED_FLAGS,
    ],
    recoveryTimeline:
      "Most people notice a meaningful improvement over 6 to 12 weeks of consistent loading, with fuller recovery over 3 to 6 months. Tendons respond slowly, so steady progress over weeks matters more than any single session.",
    progressGuidance:
      "Step up a stage when the current exercises feel controlled and are not leaving you more sore the next morning. Judge each session by how the shoulder feels the following day, not just during the exercise - if it is clearly more irritable for more than 24 hours, drop back the load a little and build up again.",
    faqs: [
      {
        q: "Should I push through the pain?",
        a: "You do not need to be pain-free to exercise, but you should stay within a level you would describe as acceptable - roughly 3 out of 10 or less - and it should settle back to normal within a day. Sharp or lasting pain is a sign to ease off.",
      },
      {
        q: "How long until it feels better?",
        a: "Many people feel the early exercises take the edge off within 2 to 3 weeks. Rebuilding full strength and comfort with overhead activity usually takes a few months of regular work.",
      },
      {
        q: "Do I need a scan?",
        a: "Usually not. Scans often show tendon changes in shoulders that have never been painful, so the picture rarely changes the plan. A scan is more useful if the shoulder was suddenly weak after an injury, or if it is not responding to a fair trial of loading.",
      },
      {
        q: "Can I still go to the gym?",
        a: "Yes, with some short-term changes. Keep training the rest of your body, reduce or pause heavy overhead pressing and upright rows for a few weeks, and reintroduce them gradually as the shoulder strengthens.",
      },
      {
        q: "Is it worth having a cortisone injection?",
        a: "An injection can reduce pain in the short term, but it does not make the tendon stronger and the benefit often fades. Most guidelines suggest trying a structured exercise programme first. Discuss it with a clinician if pain is stopping you from starting the exercises at all.",
      },
    ],
    relatedConditionSlugs: ["frozen-shoulder", "shoulder-impingement"],
    relatedBlogSlugs: [],
    reviewedBy: REVIEWED_BY,
    reviewedOn: REVIEWED_ON,
  },

  {
    slug: "hamstring-strain",
    name: "Hamstring strain",
    aka: ["pulled hamstring", "hamstring tear", "torn hamstring"],
    serviceSlug: "musculoskeletal-physiotherapy",
    bodyArea: "Sports & return to activity",
    seoTitle: "Hamstring strain exercises and rehab | PhysioOnClick",
    seoDescription:
      "A staged rehab programme for a hamstring strain from a HCPC-registered physiotherapist - settle it, rebuild strength, and clear return-to-play markers.",
    intro:
      "A hamstring strain is an overstretch or tear of one of the three muscles that run down the back of the thigh, from the sitting bone to below the knee. They bend the knee and control the leg as it swings forwards, and they are under most tension at the moment the heel is about to strike the ground - which is exactly when most strains happen.\n\nThe usual mechanism is a flash of speed or a big stretch: sprinting, a long stride for a ball, an awkward slide, or a sudden lunge. Most people feel a sharp pull or grab at the back of the leg and stop immediately. Fatigue late in a game, little preparation for sprinting, and a previous hamstring injury all raise the risk.\n\nIn the days afterwards it is sore to stretch, sore to accelerate, and often tender to press, and bruising may appear a little way down the thigh. Walking is usually possible, sometimes with a limp. Most strains are low grade and the day-to-day soreness settles well over a few weeks.\n\nThe important part is what comes next. The hamstring has a high re-injury rate if you go back to sport before it is genuinely ready, and re-injuries are usually worse than the original. That is why this programme is staged and finishes with clear, testable markers rather than a fixed number of weeks. It moves from calming the muscle and restoring easy movement, through progressive strength work that emphasises the lengthened position, into running speed and change of direction, and finally a return-to-play checklist.",
    whoItHelps:
      "People who have felt a sudden pull at the back of the thigh during running or sport and can walk, even if with a limp. If you cannot take weight, saw heavy bruising appear quickly, or felt a pop high up near the buttock bone, get assessed before starting - that can be a more serious tear.",
    program: [
      {
        stage: "Settle",
        blurb:
          "The first few days to two weeks. Protect the muscle, keep walking within comfort, and start very gentle range and low-load activation. Avoid aggressive stretching and anything that reproduces a sharp pull.",
        exerciseSlugs: ["standing-hamstring-stretch", "hip-bridge", "marching-on-the-spot"],
      },
      {
        stage: "Build strength",
        blurb:
          "Begin when walking is pain-free and gentle contraction no longer hurts. Load the hamstring progressively, including work with the hip flexed and knee straighter, two to three times a week.",
        exerciseSlugs: ["bridge-progression", "single-leg-balance", "standing-hamstring-stretch"],
      },
      {
        stage: "Power and change of direction",
        blurb:
          "Add these once you can do slow strength work at good load with no next-day soreness. Introduce faster, higher-force work, jogging building to strides, and controlled direction changes.",
        exerciseSlugs: ["nordic-hamstring-curl-assisted", "backward-walking", "single-leg-stance-with-arm-reach"],
      },
      {
        stage: "Return to play",
        blurb:
          "You are ready to return when: you have full, pain-free hamstring range compared with the other side; single-leg bridge and Nordic strength feel equal left to right; you can sprint at near maximum without holding back or feeling the muscle; and you have completed sport-specific drills and a full training session without a next-day reaction. If any of these are not yet true, or you are unsure, get assessed before you go back.",
        exerciseSlugs: [
          "return-to-sport-readiness-circuit",
          "nordic-hamstring-curl-assisted",
          "single-leg-stance-with-arm-reach",
        ],
      },
    ],
    redFlags: [
      "You cannot put weight through the leg or walk at all",
      "The pain was right up at the sitting bone with rapid heavy bruising - a high hamstring tendon tear needs prompt assessment",
      "Numbness, pins and needles or weakness in the foot",
      "Calf pain and swelling with warmth or redness, or breathlessness - seek urgent medical advice to rule out a clot",
      ...GENERAL_RED_FLAGS,
    ],
    recoveryTimeline:
      "A low-grade strain often settles enough for a graded return to running in 2 to 4 weeks, with full return to sport around 4 to 8 weeks. Higher-grade tears, or pain near the sitting bone, can take several months. Progress is guided by the return-to-play markers, not the calendar.",
    progressGuidance:
      "Move up a stage only when the current work is comfortable both during and the day after. Use a simple rule for running: if a session leaves the hamstring more than mildly sore for over 24 hours, repeat the previous level before progressing. Re-injury usually happens when the last two stages are rushed.",
    faqs: [
      {
        q: "When can I run again?",
        a: "Once you can walk fast and lengthen the muscle without a sharp pull, and gentle strength work is pain-free - often around the 2 to 3 week mark for a minor strain. Start with a walk-jog plan and build speed gradually over one to two weeks.",
      },
      {
        q: "Should I stretch it a lot?",
        a: "Not early on. Aggressive stretching in the first week or two can irritate the healing tissue. Gentle range within comfort is fine; the muscle regains length mainly through progressive strength work in longer positions.",
      },
      {
        q: "Why do hamstring strains keep coming back?",
        a: "The main reasons are returning to sprinting before strength and range are fully restored, and skipping high-speed running in rehab. Completing all four stages, including the return-to-play checklist, lowers the re-injury risk considerably.",
      },
      {
        q: "Do I need a scan?",
        a: "Most strains do not need imaging. A scan is worth considering if you cannot weight-bear, the pain is high up near the buttock bone, or the injury is not improving as expected, as these can point to a tear that changes the plan.",
      },
    ],
    relatedConditionSlugs: ["return-to-running", "return-to-sport-readiness"],
    relatedBlogSlugs: [],
    reviewedBy: REVIEWED_BY,
    reviewedOn: REVIEWED_ON,
  },

  {
    slug: "low-back-pain",
    name: "Low back pain",
    aka: ["non-specific low back pain", "lumbago", "back ache"],
    serviceSlug: "musculoskeletal-physiotherapy",
    bodyArea: "Back & neck",
    seoTitle: "Low back pain exercises | PhysioOnClick",
    seoDescription:
      "A staged exercise programme for low back pain from a HCPC-registered physiotherapist - settle a flare, rebuild strength, and get back to normal activity.",
    intro:
      "Low back pain is one of the most common experiences there is - most people have at least one episode in their life. In the large majority of cases no single structure is damaged, nothing has slipped out of place, and no scan is needed. The pain is completely real, but it usually reflects a back that has become sensitised and a bit deconditioned rather than injured.\n\nEpisodes are often triggered by something small and unremarkable: bending to pick up a sock, a long drive, a heavy week at work, a poor run of sleep, or a stretch of stress. The lower back is a robust structure of thick discs, strong joints and a lot of muscle. It has not become fragile; it has become irritable.\n\nThe typical episode is stiff and sore for a few days, worst first thing in the morning or after sitting, easier once you get moving, and slowly settling over two to six weeks. Bending, lifting and getting out of a low chair are the awkward moments. Some ache into the buttock or the back of the thigh is common and does not mean the problem is more serious.\n\nStaying active gives the best results, and resting in bed makes things worse. Movement early, then a gradual return to normal loading with some strengthening, is the plan that consistently works, and most people are back to their usual activities within about six weeks even if the odd twinge lingers. This programme helps you settle a flare, rebuild trunk and hip strength, and get back your confidence to bend, lift and move normally.",
    whoItHelps:
      "Adults with back pain, with or without some ache into the buttock or thigh, that is not linked to a serious injury and where you have no problems with bladder, bowel or saddle-area sensation. If you do have those symptoms, treat it as an emergency (see red flags).",
    program: [
      {
        stage: "Settle the flare",
        blurb:
          "For the first days to weeks. Keep moving little and often, use gentle range and breathing to reduce guarding, and stay at work or return quickly if you can, adjusting tasks as needed.",
        exerciseSlugs: ["segmental-rolling", "pelvic-tilt", "cat-cow-stretch", "relaxation-and-breathing-for-pain-management"],
      },
      {
        stage: "Build strength",
        blurb:
          "Add these as the sharp pain eases, usually within one to three weeks. Build trunk control and endurance three times a week, working to a moderate effort with good technique.",
        exerciseSlugs: ["dead-bug", "bird-dog", "bridge-progression", "side-plank-modified"],
      },
      {
        stage: "Return to activity",
        blurb:
          "The final stage rebuilds tolerance for bending, lifting and the things that felt risky. Practise good lifting patterns with gradually increasing load, and deliberately reintroduce movements you have been avoiding.",
        exerciseSlugs: ["quadruped-arm-leg-reach", "functional-lifting-pattern", "graded-exposure-to-feared-movement"],
      },
    ],
    redFlags: [
      "Difficulty passing urine, loss of bladder or bowel control, or numbness around the back passage, genitals or inner thighs - go to A&E, this needs same-day assessment",
      "Progressive weakness, heaviness or numbness in both legs",
      "New back pain with a history of cancer, a weakened immune system, or recent serious infection",
      "Severe pain after a significant fall or crash, particularly if you have osteoporosis",
      ...GENERAL_RED_FLAGS,
    ],
    recoveryTimeline:
      "Most episodes improve substantially within 2 to 6 weeks. Some ache or stiffness can linger longer and flare from time to time - that is normal and does not mean harm. Regular activity and the strength work reduce how often flares happen and how long they last.",
    progressGuidance:
      "You do not have to wait to be pain-free to progress - move on when movement feels easier and less guarded. Expect ups and downs. A flare during recovery is a temporary setback, not damage: drop back to the settle-stage exercises for a few days, then build up again.",
    faqs: [
      {
        q: "Do I need an X-ray or MRI?",
        a: "For typical low back pain, no. Imaging commonly shows age-related changes such as disc bulges and wear that are present in pain-free people too, and it does not improve outcomes. Scans are reserved for specific red flags or when surgery is being considered.",
      },
      {
        q: "Should I rest until it stops hurting?",
        a: "No. More than a day or two of rest tends to prolong the problem. Keep gently active, pace your day, and return to normal activities as the pain allows.",
      },
      {
        q: "Is it safe to bend and lift?",
        a: "Yes. Backs are strong and designed to bend. In the early days it can help to lift lighter loads and keep them close to you, but the long-term goal is to move and lift normally and confidently again.",
      },
      {
        q: "Will it come back?",
        a: "Recurrences are common, but staying active, keeping up some strength work, managing sleep and stress, and not catastrophising a flare all make future episodes less frequent and less severe.",
      },
    ],
    relatedConditionSlugs: ["sciatica", "return-to-running"],
    relatedBlogSlugs: [],
    reviewedBy: REVIEWED_BY,
    reviewedOn: REVIEWED_ON,
  },

  {
    slug: "sciatica",
    name: "Sciatica",
    aka: ["lumbar radiculopathy", "nerve root pain", "leg pain from the back"],
    serviceSlug: "musculoskeletal-physiotherapy",
    bodyArea: "Back & neck",
    seoTitle: "Sciatica exercises | PhysioOnClick",
    seoDescription:
      "A staged exercise programme for sciatica from a HCPC-registered physiotherapist - nerve glides, strengthening, and how to know when to seek urgent help.",
    intro:
      "Sciatica is the name for pain that travels from the lower back or buttock down the leg, sometimes past the knee and into the foot, following the path of an irritated nerve root. The commonest cause is a disc bulge pressing on or inflaming the nerve where it leaves the spine. It often comes with pins and needles, patches of numbness, or a leg that feels weaker than usual.\n\nDiscs bulge far more often than people realise, and many bulges are completely painless. Symptoms usually appear when one sits close enough to the nerve to inflame it, and that inflammation is the part that makes the leg so sore. It can start after a specific bend or lift, or build up over days with no obvious trigger at all.\n\nDay to day, the leg pain usually outweighs the back pain. Sitting, driving and bending forward tend to be the worst, coughing or sneezing can send a jolt down the leg, and finding a comfortable position at night takes some experimenting. Walking is often easier than sitting, and many people notice the symptoms slowly withdrawing back up the leg as things improve.\n\nIt can be very painful, but the outlook is genuinely good: the large majority settle without surgery as the inflammation around the nerve calms down. It is slower than ordinary back pain, often several weeks to a few months, and progress tends to come in steps rather than a smooth line. This programme reduces nerve sensitivity with gentle movement, keeps the back and leg working, then rebuilds strength and walking tolerance.",
    whoItHelps:
      "Adults with back-related leg pain, tingling or numbness where bladder and bowel function is normal and any weakness is mild and not getting worse. It suits both a first episode and one that has been grumbling on. Rapidly progressing weakness or saddle numbness is an emergency (see red flags).",
    program: [
      {
        stage: "Calm the nerve",
        blurb:
          "For the irritable early phase. Use gentle nerve gliding and positions that ease the leg symptoms, and keep walking in short, frequent bouts. Avoid prolonged sitting and end-range bending if they clearly worsen the leg.",
        exerciseSlugs: ["sciatic-nerve-glide", "mckenzie-press-up", "pelvic-tilt"],
      },
      {
        stage: "Build strength",
        blurb:
          "Progress as the pain centralises - moving out of the leg and back towards the spine. Add trunk and hip strengthening and gradually extend how long you can sit, stand and walk.",
        exerciseSlugs: ["dead-bug", "bird-dog", "bridge-progression", "standing-extension"],
      },
      {
        stage: "Return to activity",
        blurb:
          "The final stage restores full function. Rebuild lifting, bending and walking or running distance in graded steps, and reintroduce activities you have been avoiding.",
        exerciseSlugs: ["functional-lifting-pattern", "graded-walking-programme", "graded-exposure-to-feared-movement"],
      },
    ],
    redFlags: [
      "Difficulty passing or controlling urine, bowel incontinence, or numbness around the saddle area - go to A&E immediately",
      "Weakness in the leg or foot that is clearly getting worse over days",
      "Numbness or weakness affecting both legs",
      "Fever, unexplained weight loss, or a history of cancer alongside the pain",
      ...GENERAL_RED_FLAGS,
    ],
    recoveryTimeline:
      "Leg pain often begins to ease within 4 to 6 weeks, with many people much improved by 6 to 12 weeks. Some numbness or tingling can take longer to fully resolve. A minority with ongoing severe pain or weakness are helped by an injection or surgery.",
    progressGuidance:
      "Use centralisation as your guide: exercises and positions that pull the pain out of the leg and towards the back are moving you in the right direction, even if the back itself feels a bit more sore. Progress the strength and walking work as the leg quietens, and back off anything that consistently sends pain further down the leg.",
    faqs: [
      {
        q: "Should I avoid bending and sitting completely?",
        a: "Not completely, but in the irritable phase it helps to limit long periods of sitting and repeated deep bending if they flare the leg. Change position often and build tolerance back up as symptoms settle.",
      },
      {
        q: "Do I need surgery?",
        a: "Usually not. Most sciatica settles with time and exercise. Surgery is considered mainly for severe or worsening weakness, or for leg pain that remains disabling after a few months of good conservative care.",
      },
      {
        q: "Is the tingling and numbness a bad sign?",
        a: "It reflects an irritated nerve rather than permanent damage, and it typically improves as the nerve calms down. Weakness that is getting noticeably worse, however, should be assessed promptly.",
      },
      {
        q: "Can I still exercise with sciatica?",
        a: "Yes, and you should. Walking and the gentle exercises in this programme help. Choose activities that keep the leg symptoms stable or improving, and avoid pushing into movements that clearly worsen them.",
      },
    ],
    relatedConditionSlugs: ["low-back-pain", "gluteal-tendinopathy"],
    relatedBlogSlugs: [],
    reviewedBy: REVIEWED_BY,
    reviewedOn: REVIEWED_ON,
  },

  {
    slug: "neck-pain",
    name: "Neck pain",
    aka: ["non-specific neck pain", "mechanical neck pain", "text neck", "wry neck"],
    serviceSlug: "musculoskeletal-physiotherapy",
    bodyArea: "Back & neck",
    seoTitle: "Neck pain exercises | PhysioOnClick",
    seoDescription:
      "A staged exercise programme for everyday neck pain from a HCPC-registered physiotherapist - ease stiffness, build strength, and settle desk-related aches.",
    intro:
      "Most neck pain is what clinicians call non-specific, which sounds vague but is good news: it means the joints and muscles of the neck have become stiff, sensitised and a little deconditioned, with no damage to find. The neck carries the head all day on a stack of small joints and fine muscles, and it is very responsive to how you sleep, sit and feel.\n\nIt usually builds after a run of long spells in one position, a stressful patch, an awkward sleeping position or a period of poor sleep generally. Scans of painful necks and pain-free necks look remarkably similar from the thirties onwards, so wear-and-tear findings on a report rarely explain the pain or change the plan.\n\nThe typical picture is a stiff, sore neck that catches in certain directions - checking a blind spot is the classic - sometimes with a headache at the base of the skull, or an ache spreading into the shoulder blade or the top of the arm. It is often worse at the end of a working day and eases with movement, warmth and a change of position.\n\nIt is uncomfortable rather than dangerous, and most episodes settle substantially within two to six weeks. Movement is the main treatment: necks tend to stiffen and stay sore when they are protected. This programme restores comfortable range first, then builds the endurance of the deep neck and shoulder-blade muscles so the neck copes better with a normal working day, with practical habit changes along the way.",
    whoItHelps:
      "Adults with neck stiffness and pain, with or without a mild headache or referral into the shoulder blade, that is not the result of a significant accident. Seek assessment first if the pain followed a car crash or a heavy fall, or if you have arm weakness.",
    program: [
      {
        stage: "Ease the stiffness",
        blurb:
          "Start here while the neck is guarded. Move gently and often through comfortable range, and avoid holding any one position for too long. A mild stretch is fine; sharp pain is not.",
        exerciseSlugs: ["neck-rotation-range", "neck-side-flexion-stretch", "chin-tuck"],
      },
      {
        stage: "Build strength",
        blurb:
          "Add these as range improves. Train the deep neck flexors and the muscles around the shoulder blades most days, keeping the effort light to moderate and the neck relaxed.",
        exerciseSlugs: ["deep-neck-flexor-hold", "isometric-neck-hold", "standing-chin-retraction", "scapular-retraction-band-row", "wall-angels"],
      },
      {
        stage: "Return to activity",
        blurb:
          "The final stage builds tolerance for desk work, driving and overhead tasks. Combine mobility and strength, take regular movement breaks, and gradually extend how long you work before symptoms build.",
        exerciseSlugs: ["prone-neck-extension", "levator-scapulae-stretch", "thoracic-rotation-open-book", "prone-y-t-w-raises"],
      },
    ],
    redFlags: [
      "Significant neck pain straight after a car crash, a heavy fall or a blow to the head",
      "Weakness, clumsiness or numbness in the hands or legs, or problems with balance and walking",
      "Dizziness, drop attacks, double vision, slurred speech or facial numbness with neck movement",
      "Severe headache unlike any you have had before, or neck stiffness with fever and feeling very unwell",
      ...GENERAL_RED_FLAGS,
    ],
    recoveryTimeline:
      "Most bouts of neck pain settle within 2 to 6 weeks. Recurrences are common and usually short-lived. Keeping up the strength work and managing sleep, stress and screen habits reduces how often it returns.",
    progressGuidance:
      "Progress when the neck moves more freely and the exercises no longer leave it stiffer afterwards. If a flare happens, return to the gentle range work for a few days rather than stopping altogether, then rebuild the strengthening.",
    faqs: [
      {
        q: "Is my posture causing this?",
        a: "Posture is only part of the story. No single position is harmful, but staying in any one position for a long time can stiffen the neck. The most useful change is to move more often, rather than to hold a perfect posture.",
      },
      {
        q: "Do I need a scan?",
        a: "Not for ordinary neck pain. Scans usually show wear and tear that is also present in people with no pain. Imaging is reserved for red flags, arm weakness, or symptoms that are not settling.",
      },
      {
        q: "Should I use a special pillow?",
        a: "A pillow that keeps your neck roughly in line with your spine can help you sleep more comfortably, but there is no single best pillow. Comfort is the guide.",
      },
      {
        q: "Why do I get headaches with it?",
        a: "The upper neck joints and muscles can refer pain to the head, producing a headache that often sits at the back of the skull or behind the eye. As the neck settles and strengthens, these headaches usually ease too.",
      },
    ],
    relatedConditionSlugs: ["shoulder-impingement", "rotator-cuff-tendinopathy"],
    relatedBlogSlugs: [],
    reviewedBy: REVIEWED_BY,
    reviewedOn: REVIEWED_ON,
  },

  {
    slug: "frozen-shoulder",
    name: "Frozen shoulder",
    aka: ["adhesive capsulitis", "shoulder contracture"],
    serviceSlug: "musculoskeletal-physiotherapy",
    bodyArea: "Shoulder",
    seoTitle: "Frozen shoulder exercises | PhysioOnClick",
    seoDescription:
      "A staged exercise programme for frozen shoulder from a HCPC-registered physiotherapist - how to manage the painful phase, restore range, and rebuild strength.",
    intro:
      "Frozen shoulder, or adhesive capsulitis, is a problem with the capsule - the sleeve of tissue that surrounds the shoulder joint. The capsule becomes inflamed and then thickens and contracts, so the joint simply has less room to move. That is why the shoulder stiffens in every direction, including turning the arm outwards, and why the stiffness is there even when someone else moves the arm for you.\n\nIt often arrives with no clear cause at all. It is most common between the ages of 40 and 60, affects women slightly more often, and is more likely in people with diabetes or a thyroid condition. It can also follow a period of the arm being kept still after an injury or an operation. Nothing you did wrong caused it.\n\nIt usually moves through phases. First a painful freezing phase, where the ache is deep, spreads into the upper arm and disturbs sleep. Then a stiff phase, where the pain settles but movement is very limited and everyday tasks like dressing, driving and reaching a back pocket become awkward. Finally a thawing phase, where range slowly returns.\n\nIt is not dangerous and it does resolve, but it is genuinely slow: the whole cycle commonly runs one to three years, though good management shortens the worst of it and most people regain useful function well before full range returns. This programme matches the phase you are in - keeping the shoulder moving without provoking an angry capsule early on, working steadily on range as the pain settles, then rebuilding strength as movement comes back.",
    whoItHelps:
      "Adults with a progressively stiff and painful shoulder that has lost range in all directions, including turning the arm outwards, with no history of a significant injury. It suits any phase, from the painful early months to the stiff and thawing stages. If the stiffness followed a fall or a dislocation, get it assessed first.",
    program: [
      {
        stage: "Settle and keep it moving",
        blurb:
          "For the painful freezing phase. The goal is to maintain what movement you have with gentle, pain-respecting exercises, not to force range. Pushing hard into pain now tends to make it worse.",
        exerciseSlugs: ["pendulum-with-light-weight", "scapular-setting", "shoulder-flexion"],
      },
      {
        stage: "Restore range",
        blurb:
          "As pain eases and the shoulder enters the stiff phase, work more firmly on stretching into the restricted directions, holding stretches longer and more often. Some discomfort during stretching is acceptable if it settles quickly.",
        exerciseSlugs: ["wall-slide", "sleeper-stretch", "cross-body-stretch", "shoulder-flexion"],
      },
      {
        stage: "Build strength and return to activity",
        blurb:
          "In the thawing phase, add strengthening for the rotator cuff and shoulder blade as range comes back, and rebuild everyday and overhead tasks gradually.",
        exerciseSlugs: [
          "shoulder-external-rotation-band",
          "shoulder-internal-rotation-band",
          "scapular-retraction-band-row",
          "overhead-press-progression",
        ],
      },
    ],
    redFlags: [
      "The stiffness began right after a fall, a dislocation or a heavy pull on the arm",
      "The shoulder or arm looks deformed, or you cannot move it at all",
      "Pins and needles or weakness spreading down the arm into the hand",
      "The shoulder is hot, very swollen and red, especially with a fever",
      ...GENERAL_RED_FLAGS,
    ],
    recoveryTimeline:
      "Frozen shoulder is self-limiting but slow: many people take 1 to 3 years to fully recover, and a small number are left with some lasting stiffness. Pain usually improves well before movement does. Exercise, and in some cases an injection or a hydrodilatation procedure, can speed things along.",
    progressGuidance:
      "Let pain guide the intensity. In the freezing phase, keep stretches gentle and frequent. Once pain has clearly settled, you can stretch more firmly and it is safe to feel a strong pull, as long as it eases within 15 to 30 minutes and does not leave the shoulder more painful overnight.",
    faqs: [
      {
        q: "Will it get better on its own?",
        a: "Yes, in most cases, but it can take a long time. The aim of treatment is to reduce pain, keep as much movement as possible, and shorten the overall course.",
      },
      {
        q: "Should I push hard into the stiffness?",
        a: "Not during the painful early phase - aggressive stretching then often increases pain and guarding. Once the shoulder is stiff but no longer very painful, firmer stretching is appropriate and helpful.",
      },
      {
        q: "Do injections help?",
        a: "A corticosteroid injection into the joint, particularly early on, can reduce pain and may improve range when combined with exercises. It is worth discussing with a clinician if pain is severe.",
      },
      {
        q: "Could it happen to the other shoulder?",
        a: "It can. Around one in five people go on to develop it in the other shoulder, usually not at the same time. Keeping both shoulders moving and well managed is sensible, especially if you have diabetes.",
      },
    ],
    relatedConditionSlugs: ["rotator-cuff-tendinopathy", "shoulder-impingement"],
    relatedBlogSlugs: [],
    reviewedBy: REVIEWED_BY,
    reviewedOn: REVIEWED_ON,
  },

  {
    slug: "shoulder-impingement",
    name: "Shoulder impingement",
    aka: ["subacromial pain syndrome", "subacromial impingement", "swimmer's shoulder"],
    serviceSlug: "musculoskeletal-physiotherapy",
    bodyArea: "Shoulder",
    seoTitle: "Shoulder impingement exercises | PhysioOnClick",
    seoDescription:
      "A staged exercise programme for shoulder impingement from a HCPC-registered physiotherapist - calm the pain, strengthen the cuff, and get back overhead.",
    intro:
      "Shoulder impingement, now more often called subacromial pain syndrome, describes pain coming from the structures in the narrow space under the tip of the shoulder blade: the rotator cuff tendons and a small fluid-filled cushion called a bursa. The pain shows up as the arm is lifted towards or above shoulder height, or reached across the body.\n\nThe old explanation was that bone was pinching the tendon, and that idea has largely been set aside. It is now understood mainly as tendon and bursa that have been overloaded and become sensitive, usually after a change in overhead activity - a new job, a decorating spree, a block of swimming or throwing, or a return to the gym after time away.\n\nDay to day it shows up as a painful arc: comfortable at the bottom of the movement, sore through the middle of the lift, often easier again at the very top. Reaching into the back seat of a car, washing hair, hanging out laundry and lying on that side at night are the usual complaints. The arm feels weak mostly because it hurts, not because anything has given way.\n\nIt is uncomfortable rather than harmful and it responds well to exercise, which is why loading is recommended long before injections or surgery. Most people improve noticeably over 6 to 12 weeks and keep building for a few months after that. This programme calms the painful arc first, then strengthens the rotator cuff and the muscles that steer the shoulder blade so the arm moves more efficiently, and finally rebuilds your tolerance for overhead work.",
    whoItHelps:
      "Adults with a painful arc of movement when lifting the arm, worse with overhead or reaching tasks, and no significant injury. If the arm suddenly became weak after a fall or heavy pull, get it checked for a cuff tear first.",
    program: [
      {
        stage: "Settle the pain",
        blurb:
          "Start here while lifting the arm is sharply painful. Use gentle movement and light activation below the painful range, and reduce - but do not completely stop - overhead activity for a few weeks.",
        exerciseSlugs: ["scapular-setting", "shoulder-flexion", "pendulum-swing"],
      },
      {
        stage: "Build strength",
        blurb:
          "As the painful arc eases, load the rotator cuff and shoulder-blade muscles two to three times a week, working through as much range as stays comfortable.",
        exerciseSlugs: ["scapular-retraction-band-row", "shoulder-external-rotation-band", "wall-slide", "prone-y-t-w-raises"],
      },
      {
        stage: "Return to activity",
        blurb:
          "The final stage rebuilds overhead strength and endurance. Progress loaded pressing and weight-bearing work, and build your sport or job volume back up in steps.",
        exerciseSlugs: ["push-up-plus-wall-or-floor", "overhead-press-progression", "shoulder-internal-rotation-band"],
      },
    ],
    redFlags: [
      "Sudden marked weakness lifting the arm after an injury - possible rotator cuff tear",
      "The shoulder looks an odd shape or cannot be moved after a fall",
      "Pins and needles or weakness spreading into the hand",
      "The shoulder is hot, red and swollen with a fever",
      ...GENERAL_RED_FLAGS,
    ],
    recoveryTimeline:
      "Most people improve over 6 to 12 weeks with consistent exercise, and many settle fully within 3 to 4 months. Surgery is rarely needed and, for this problem, has not been shown to beat a good exercise programme.",
    progressGuidance:
      "Progress when the painful arc has shrunk and exercises are not causing a next-day flare. Some discomfort within range is fine. Keep chipping away at the strengthening even once pain has gone, as that is what stops it returning.",
    faqs: [
      {
        q: "Is something being pinched in my shoulder?",
        a: "The current understanding is that the tendon and bursa are overloaded and sensitive rather than being physically crushed by bone. That matters because it means the fix is loading and strengthening, not avoidance.",
      },
      {
        q: "Should I stop lifting overhead?",
        a: "Reduce it for a few weeks rather than stopping entirely, then rebuild gradually. Completely avoiding overhead movement tends to make the shoulder stiffer and weaker.",
      },
      {
        q: "Do I need surgery or a scan?",
        a: "Usually neither. Scans often show changes that are present in pain-free shoulders. Surgery is considered only if a fair trial of exercise over a few months has not helped.",
      },
      {
        q: "How is this different from rotator cuff tendinopathy?",
        a: "There is a lot of overlap and the two terms are often used for the same problem. The programmes are very similar - calm it down, then progressively load the cuff and shoulder blade.",
      },
    ],
    relatedConditionSlugs: ["rotator-cuff-tendinopathy", "frozen-shoulder"],
    relatedBlogSlugs: [],
    reviewedBy: REVIEWED_BY,
    reviewedOn: REVIEWED_ON,
  },

  {
    slug: "tennis-elbow",
    name: "Tennis elbow",
    aka: ["lateral epicondylalgia", "lateral epicondylitis", "extensor tendinopathy"],
    serviceSlug: "musculoskeletal-physiotherapy",
    bodyArea: "Elbow & wrist",
    seoTitle: "Tennis elbow exercises | PhysioOnClick",
    seoDescription:
      "A staged exercise programme for tennis elbow from a HCPC-registered physiotherapist - load the tendon safely, manage grip pain, and return to work and sport.",
    intro:
      "Tennis elbow is a tendinopathy of the muscles that straighten the wrist and fingers, at the point where their shared tendon attaches to the bony bump on the outside of the elbow. Every time you grip, that tendon takes the strain, which is why a problem at the elbow shows up most clearly in the hand.\n\nDespite the name, most cases have nothing to do with tennis. It usually follows a spell of repetitive gripping, lifting, twisting or wrist work that the tendon was not conditioned for - a new job or a new tool, a DIY project, a lot of typing and mousing, the start of gardening season, or carrying a baby around. It is most common between the ages of 35 and 55.\n\nThe main symptoms are pain and tenderness over the outer elbow, sometimes spreading into the forearm, brought on by gripping. Lifting a kettle or a full mug, shaking hands, turning a door handle, wringing out a cloth and using a screwdriver are the usual offenders. The arm can feel weak, largely because gripping hurts. Sleep is usually undisturbed and the elbow itself looks completely normal.\n\nIt can be stubborn and it often lasts longer than people expect, but it is not harmful and it does respond to the right kind of loading. Many people improve over 6 to 12 weeks and keep building for several months. This programme reduces the irritation first, then progressively loads the tendon along with the forearm, wrist and shoulder, so gripping and lifting become comfortable again and stay that way.",
    whoItHelps:
      "Adults with pain over the outer elbow that is brought on by gripping and wrist use, with no history of a fall onto the elbow. It suits both a recent flare and one that has grumbled on for months. If the elbow locks, gives way, or swells markedly, get it assessed first.",
    program: [
      {
        stage: "Settle the pain",
        blurb:
          "Start here while everyday gripping is painful. Reduce aggravating tasks where you can, use gentle stretching and light isometric holds, and consider a strap or brace for painful activities.",
        exerciseSlugs: ["wrist-extensor-stretch", "grip-strengthening"],
      },
      {
        stage: "Build strength",
        blurb:
          "Once light gripping is tolerable, load the wrist extensor tendon progressively, with an emphasis on the slow lowering phase, and add strengthening for the shoulder and shoulder blade.",
        exerciseSlugs: ["eccentric-wrist-extension", "wrist-extension-isotonic", "tyler-twist-flexbar", "grip-strengthening", "scapular-retraction-band-row"],
      },
      {
        stage: "Return to activity",
        blurb:
          "The final stage rebuilds tolerance for heavier gripping, lifting and sport. Increase load and speed gradually, and reintroduce the specific tasks that used to hurt.",
        exerciseSlugs: ["weight-bearing-through-extended-wrist", "eccentric-wrist-extension", "forearm-pronation-supination", "wrist-extensor-stretch"],
      },
    ],
    redFlags: [
      "The elbow locks, catches or gives way",
      "Marked swelling, redness or warmth around the joint, especially with a fever",
      "Pins and needles or weakness in the hand, or pain that is mainly on the inner side or into the forearm",
      "Elbow pain after a fall onto the arm that has not been checked",
      ...GENERAL_RED_FLAGS,
    ],
    recoveryTimeline:
      "Tennis elbow often takes 3 to 6 months to settle, and sometimes up to a year. It usually gets better whatever you do, but a structured loading programme reduces pain faster and lowers the chance of recurrence. Most cases never need an injection or surgery.",
    progressGuidance:
      "Use a 24-hour rule: an exercise level is right if the elbow is no more than mildly sore the next morning and settles quickly. Keep loading through some discomfort - waiting for it to be completely pain-free before you start usually means it never improves.",
    faqs: [
      {
        q: "Should I rest it completely?",
        a: "No. Complete rest gives short-term relief but the pain returns as soon as you use the arm. The tendon needs graded load to recover. Modify the heaviest tasks rather than stopping using the arm.",
      },
      {
        q: "Do cortisone injections work?",
        a: "They can ease pain for a few weeks, but studies show worse outcomes at 6 to 12 months compared with exercise or even doing nothing. Most guidelines advise against them as a first choice.",
      },
      {
        q: "Are elbow straps and braces useful?",
        a: "A counterforce strap or a wrist brace can reduce pain during aggravating activities in the early stages. They are a short-term aid, not a substitute for the strengthening programme.",
      },
      {
        q: "Why is it taking so long?",
        a: "Tendons remodel slowly and the outer elbow tendon has a limited blood supply. Consistency over months, rather than intensity in any one session, is what gets results.",
      },
    ],
    relatedConditionSlugs: ["golfers-elbow", "rotator-cuff-tendinopathy"],
    relatedBlogSlugs: [],
    reviewedBy: REVIEWED_BY,
    reviewedOn: REVIEWED_ON,
  },

  {
    slug: "golfers-elbow",
    name: "Golfer's elbow",
    aka: ["medial epicondylalgia", "medial epicondylitis", "flexor tendinopathy"],
    serviceSlug: "musculoskeletal-physiotherapy",
    bodyArea: "Elbow & wrist",
    seoTitle: "Golfer's elbow exercises | PhysioOnClick",
    seoDescription:
      "A staged exercise programme for golfer's elbow from a HCPC-registered physiotherapist - settle inner-elbow pain, load the tendon, and return to activity.",
    intro:
      "Golfer's elbow is the inner-elbow version of tennis elbow. It is a tendinopathy of the muscles that bend the wrist and curl the fingers, where their shared tendon attaches to the bony point on the inside of the elbow. Those muscles work every time you grip or twist, so the tendon takes a lot of traffic in ordinary daily life.\n\nLike tennis elbow, it usually builds up after a spell of repetitive gripping, lifting, hammering or wrist work rather than from a single injury. Golf is only one route in; DIY, trade work, weight training with heavy pulling, racket sports and long hours of manual handling are all more common causes. Age matters a little too, as tendons tolerate sudden spikes in load less well from the forties onwards.\n\nSymptoms are pain and tenderness on the inner elbow, often spreading a little way down the forearm, and worse with gripping, twisting a lid, carrying a bag or bending the wrist against resistance. Occasionally there is some tingling into the ring and little fingers, because a nerve passes close by and can be irritated at the same time.\n\nIt is not dangerous and the tendon is not about to snap. It does tend to be slow: it often takes 6 to 12 weeks to feel meaningfully better and several months to feel robust, so the priority is steady loading rather than complete rest. This programme calms the tendon, then loads it progressively alongside the forearm, wrist and shoulder, so gripping and lifting stop hurting.",
    whoItHelps:
      "Adults with inner-elbow pain brought on by gripping and wrist use, with no significant injury, whether it started last month or has been building for a year. If you have marked or worsening numbness in the hand, or the elbow locks or swells, get it assessed first.",
    program: [
      {
        stage: "Settle the pain",
        blurb:
          "Start here while gripping is painful. Cut back the most aggravating tasks, use gentle forearm stretching and light grip holds kept below a painful level, and use a strap for provoking activities if it helps.",
        exerciseSlugs: ["wrist-flexor-stretch", "grip-strengthening"],
      },
      {
        stage: "Build strength",
        blurb:
          "As light gripping becomes comfortable, progress the load on the forearm flexors and grip, controlling the movement slowly, and add shoulder and shoulder-blade strengthening.",
        exerciseSlugs: ["eccentric-wrist-flexion", "resisted-wrist-flexion", "forearm-pronation-supination", "grip-strengthening", "scapular-retraction-band-row"],
      },
      {
        stage: "Return to activity",
        blurb:
          "The final stage rebuilds tolerance for heavier and faster gripping, lifting and sport. Increase load gradually and reintroduce the specific movements that used to provoke it.",
        exerciseSlugs: ["weight-bearing-through-extended-wrist", "resisted-wrist-flexion", "forearm-pronation-supination", "grip-strengthening"],
      },
    ],
    redFlags: [
      "Numbness or weakness in the hand, particularly the ring and little fingers, that is marked or getting worse",
      "The elbow locks, catches or gives way",
      "Marked swelling, redness or warmth around the joint, especially with a fever",
      "Inner-elbow pain after a fall or a forced twist that has not been checked",
      ...GENERAL_RED_FLAGS,
    ],
    recoveryTimeline:
      "Like tennis elbow, golfer's elbow commonly takes 3 to 6 months to settle and occasionally up to a year. Progressive loading reduces pain faster than rest and lowers the chance of it coming back.",
    progressGuidance:
      "Judge each level by how the elbow feels the next day - mild soreness that settles quickly is fine, a lasting flare means drop the load a little. Keep loading through low-level discomfort rather than waiting for it to be pain-free.",
    faqs: [
      {
        q: "Is this the same as tennis elbow?",
        a: "It is the same type of problem - an overloaded forearm tendon - but on the inner side of the elbow rather than the outer. The management principles are the same.",
      },
      {
        q: "Should I stop the activity that caused it?",
        a: "Reduce and modify it rather than stopping completely. The tendon needs some load to recover. Look at grip size, technique and how quickly you increased your activity.",
      },
      {
        q: "What about the tingling in my fingers?",
        a: "The ulnar nerve runs close to the inner elbow and can become irritated alongside the tendon. Mild, intermittent tingling often settles as the elbow calms down, but numbness that is constant or worsening should be assessed.",
      },
      {
        q: "Do I need an injection?",
        a: "Usually not. As with tennis elbow, steroid injections tend to give short-term relief but worse longer-term outcomes than exercise. They are not a first-line treatment.",
      },
    ],
    relatedConditionSlugs: ["tennis-elbow", "rotator-cuff-tendinopathy"],
    relatedBlogSlugs: [],
    reviewedBy: REVIEWED_BY,
    reviewedOn: REVIEWED_ON,
  },

  {
    slug: "knee-osteoarthritis",
    name: "Knee osteoarthritis",
    aka: ["knee arthritis", "degenerative knee", "wear and tear knee"],
    serviceSlug: "musculoskeletal-physiotherapy",
    bodyArea: "Knee",
    seoTitle: "Knee osteoarthritis exercises | PhysioOnClick",
    seoDescription:
      "A staged exercise programme for knee osteoarthritis from a HCPC-registered physiotherapist - reduce pain, build strength, and stay active for longer.",
    intro:
      "Knee osteoarthritis is a change in the joint in which the cartilage thins and the bone, the joint lining and the surrounding muscles gradually adapt around it. It is better thought of as the joint remodelling than as the knee simply wearing out. It is very common with age, and plenty of people with clear changes on an X-ray have little or no pain at all.\n\nIt usually develops slowly over years. Previous knee injuries, carrying more body weight, a job with a lot of kneeling or squatting, and family history all nudge the risk up, but stiff periods and painful spells often have no obvious trigger. Importantly, using the knee does not wear it out faster - muscle and cartilage both do better with regular, moderate load.\n\nThe familiar pattern is pain with activity such as stairs, standing up from a low chair or walking further than usual, plus morning stiffness that eases within half an hour, occasional swelling after a busy day, and a sense of the knee being weak or unreliable. Symptoms fluctuate, with genuinely good spells and worse ones, and a flare does not mean the joint has deteriorated.\n\nExercise and strengthening are the most effective non-surgical treatments and are recommended for everyone with knee osteoarthritis, ahead of injections or surgery. Most people notice real change over 8 to 12 weeks of consistent work, and the benefit holds for as long as the exercise continues. This programme settles pain and swelling, builds the strength of the muscles that support and offload the joint, and rebuilds walking and daily activity.",
    whoItHelps:
      "Adults with activity-related knee pain and stiffness, with or without a diagnosis of osteoarthritis on X-ray. It suits both early symptoms and long-standing arthritis, including while you are waiting for a joint replacement. If the knee is locking, giving way repeatedly, or is hot and very swollen, get it assessed first.",
    program: [
      {
        stage: "Settle the pain",
        blurb:
          "Start here during a flare or if the knee is swollen. Use gentle range and low-load activation, keep walking within comfort in shorter bouts, and let swelling settle before adding load.",
        exerciseSlugs: ["quad-sets", "straight-leg-raise", "stationary-bike"],
      },
      {
        stage: "Build strength",
        blurb:
          "The core of the programme. Strengthen the thigh, hip and calf muscles two to three times a week, working to a moderate effort. Some knee discomfort during and shortly after exercise is safe and expected.",
        exerciseSlugs: ["mini-squat", "terminal-knee-extension-band", "step-up", "hip-bridge"],
      },
      {
        stage: "Return to activity",
        blurb:
          "The final stage rebuilds function and confidence. Progress to functional strength, more demanding stairs and squats, and build your walking distance and preferred activities back up gradually.",
        exerciseSlugs: ["sit-to-stand-repetitions", "deep-squat-mobility", "graded-walking-programme"],
      },
    ],
    redFlags: [
      "The knee is locked and will not fully straighten or bend",
      "It is hot, red and very swollen, particularly with a fever - this needs urgent assessment to rule out infection or gout",
      "Repeated true giving way where the knee collapses under you",
      "Sudden severe swelling within an hour of an injury",
      ...GENERAL_RED_FLAGS,
    ],
    recoveryTimeline:
      "Most people who stick with a strengthening programme notice less pain and better function within 6 to 12 weeks, with continued gains over 3 to 6 months. Osteoarthritis is a long-term condition, so keeping some strength work going maintains the benefit. Many people avoid or delay surgery this way.",
    progressGuidance:
      "Use the 24-hour rule: mild extra soreness that settles by the next day means the load was about right. Do not be put off by discomfort during exercise - it does not mean the joint is being damaged. Progress the weight or difficulty gradually as the muscles strengthen.",
    faqs: [
      {
        q: "Will exercise wear my knee out faster?",
        a: "No. Appropriate exercise does not accelerate osteoarthritis and is one of the best treatments for it. Strong muscles reduce the load going through the joint and reduce pain.",
      },
      {
        q: "Should I avoid stairs, squats and kneeling?",
        a: "Not permanently. In a flare it is reasonable to reduce them, but the aim is to build back the strength to do them comfortably. Avoiding them long term makes the knee weaker and more painful.",
      },
      {
        q: "Do I need a knee replacement?",
        a: "Only a minority of people do. Surgery is considered when pain is severe, persistent and limiting your life despite a proper trial of exercise, weight management and pain relief. Many people manage well for years without it.",
      },
      {
        q: "Does losing weight help?",
        a: "If you are carrying extra weight, losing some noticeably reduces knee pain because the load through the joint when walking is several times body weight. Combined with exercise, it is very effective.",
      },
    ],
    relatedConditionSlugs: ["patellofemoral-pain", "after-knee-replacement"],
    relatedBlogSlugs: [],
    reviewedBy: REVIEWED_BY,
    reviewedOn: REVIEWED_ON,
  },

  {
    slug: "patellofemoral-pain",
    name: "Patellofemoral pain",
    aka: ["anterior knee pain", "runner's knee", "kneecap pain", "patellofemoral pain syndrome"],
    serviceSlug: "musculoskeletal-physiotherapy",
    bodyArea: "Knee",
    seoTitle: "Patellofemoral pain exercises | PhysioOnClick",
    seoDescription:
      "A staged exercise programme for patellofemoral pain from a HCPC-registered physiotherapist - settle kneecap pain, build strength, and return to running.",
    intro:
      "Patellofemoral pain is pain around or behind the kneecap, where it glides in a shallow groove at the end of the thigh bone. The kneecap works as a pulley for the thigh muscles, so a lot of force passes through that small joint every time you bend the knee under load. It is one of the most common knee problems, especially in runners, cyclists and active teenagers.\n\nIt almost always builds up gradually rather than starting with an injury. The usual story is a change in training - more mileage, more hills, a new sport, a return after a break - or a spell of far more or far less activity than the knee was used to. Strength and control at the hip and thigh matter as much as anything happening at the knee itself.\n\nThe typical picture is an ache at the front of the knee that comes on with running, stairs, squatting, kneeling, or sitting with the knee bent for a long time; a long car journey or the cinema is the classic. Grinding or clicking is common and, on its own, harmless. There may be a little puffiness after a hard session, but the knee does not lock or give way.\n\nNothing is damaged: the tissue around the kneecap has become overloaded and sensitive, and it settles as capacity is rebuilt. Most people improve over 6 to 12 weeks with consistent strengthening and a sensible return to activity, though it takes longer if the load is not managed. This programme settles the irritation, builds hip and thigh strength so the kneecap is better supported, then gradually rebuilds the activities that set it off.",
    whoItHelps:
      "Adults and older teenagers with gradual-onset pain at the front of the knee, worse with loaded knee bending such as stairs, squatting or running, and with no locking or significant swelling. A knee that locks, gives way or swelled rapidly after an injury needs assessment first.",
    program: [
      {
        stage: "Settle the pain",
        blurb:
          "Start here while stairs and squatting are sharply painful. Reduce the aggravating load - for runners that means cutting volume, not necessarily stopping - and use low-load strengthening in a comfortable range.",
        exerciseSlugs: ["quad-sets", "straight-leg-raise", "clam-shell", "spanish-squat"],
      },
      {
        stage: "Build strength",
        blurb:
          "The main phase. Strengthen the hip and thigh two to three times a week, with a particular focus on the gluteal muscles and controlled knee bending through increasing range.",
        exerciseSlugs: ["step-up", "box-step-down", "side-lying-hip-abduction", "hip-bridge", "single-leg-glute-bridge"],
      },
      {
        stage: "Return to activity",
        blurb:
          "The final stage restores running, jumping and deeper squatting. Progress control drills and load, and rebuild your training volume in gradual steps guided by symptoms.",
        exerciseSlugs: ["lateral-band-walk", "mini-squat", "terminal-knee-extension-band"],
      },
    ],
    redFlags: [
      "The knee locks and will not straighten, or catches repeatedly",
      "Marked swelling, particularly if it came on quickly after an injury",
      "The knee gives way and collapses under you rather than just feeling weak",
      "The kneecap has dislocated or partly slipped out of place",
      ...GENERAL_RED_FLAGS,
    ],
    recoveryTimeline:
      "Many people improve within 6 to 12 weeks of consistent strengthening, though it can take longer if it has been present for months or years. It can be persistent and prone to flares, so keeping up hip and thigh strength work is worthwhile even after it settles.",
    progressGuidance:
      "Use the 24-hour rule and let symptoms guide running progression: increase distance or intensity, not both at once, and only when the previous level caused no lasting increase in pain. Strengthening should feel like effort in the muscles, not sharp pain at the kneecap.",
    faqs: [
      {
        q: "Is my kneecap out of alignment?",
        a: "Small differences in how the kneecap tracks are common and are usually not the cause. The most useful thing you can change is the strength and control of your hip and thigh muscles and how quickly you load the knee.",
      },
      {
        q: "Should I stop running?",
        a: "Usually you can keep running at a reduced volume while you strengthen, as long as pain stays low and settles quickly. A complete break is only needed if even easy running is very painful.",
      },
      {
        q: "Do knee braces or taping help?",
        a: "Taping or a simple sleeve can reduce pain for some people in the short term and can help you exercise more comfortably. They work best alongside the strengthening programme, not instead of it.",
      },
      {
        q: "Why does sitting for a long time make it ache?",
        a: "Keeping the knee bent for a long period loads the back of the kneecap continuously. Straightening the leg regularly, or standing up now and then, usually eases it.",
      },
    ],
    relatedConditionSlugs: ["knee-osteoarthritis", "patellar-tendinopathy"],
    relatedBlogSlugs: [],
    reviewedBy: REVIEWED_BY,
    reviewedOn: REVIEWED_ON,
  },

  {
    slug: "gluteal-tendinopathy",
    name: "Gluteal tendinopathy",
    aka: ["greater trochanteric pain syndrome", "hip bursitis", "lateral hip pain"],
    serviceSlug: "musculoskeletal-physiotherapy",
    bodyArea: "Hip",
    seoTitle: "Gluteal tendinopathy exercises | PhysioOnClick",
    seoDescription:
      "A staged exercise programme for gluteal tendinopathy from a HCPC-registered physiotherapist - take the compression off, load the tendon, and sleep better.",
    intro:
      "Gluteal tendinopathy is the most common cause of pain on the outer side of the hip. The gluteus medius and minimus muscles run from the pelvis to a bony bump on the side of the thigh bone called the greater trochanter, and their tendons attach there. When those tendons are overloaded they become irritated and painful, often with an inflamed bursa sitting alongside them.\n\nIt is usually a load problem rather than an injury. It is more common in women around and after menopause, in people who have had a spell of much more walking or running than usual, and in those who have been fairly inactive and then done a lot at once. Compression matters too: sitting with the legs crossed, standing with the hip pushed out to one side, and lying on the painful side all squash the tendon against the bone.\n\nThe classic symptoms are pain over the bony point of the outer hip that is tender to press, worse lying on that side at night, sore after sitting for a while, and sore going up stairs or hills. Some people feel it spreading down the outside of the thigh. Disturbed sleep is usually the biggest complaint.\n\nIt is not dangerous, and it responds well once the compression is reduced and the tendon is loaded properly. Night pain often improves within a few weeks with simple positioning changes, while the tendon itself typically takes three to six months to build real capacity. This programme takes the compression off, loads the tendon progressively, then rebuilds hip strength and walking tolerance.",
    whoItHelps:
      "Adults with pain localised to the bony point of the outer hip, tender to press, and worse with lying on that side or standing on one leg. It suits both recent lateral hip pain and long-standing night pain. Deep groin pain, or pain with a fever or after a fall, needs assessment first.",
    program: [
      {
        stage: "Settle the pain",
        blurb:
          "Start here while night pain is disturbing sleep. The priority is to stop compressing the tendon: avoid crossing your legs, hanging on one hip when standing, and aggressive outer-hip stretches. Use low-load activation in neutral positions.",
        exerciseSlugs: ["clam-shell", "hip-bridge", "standing-hip-flexor-stretch"],
      },
      {
        stage: "Build strength",
        blurb:
          "As night pain eases, progressively load the gluteal muscles two to three times a week, keeping the hip in neutral rather than letting it drop or cross the midline.",
        exerciseSlugs: ["side-lying-hip-abduction", "standing-banded-hip-abduction", "banded-hip-external-rotation", "single-leg-glute-bridge", "hip-bridge"],
      },
      {
        stage: "Return to activity",
        blurb:
          "The final stage rebuilds single-leg strength and walking or running tolerance. Progress standing hip work and load, and build hills, stairs and distance back up gradually.",
        exerciseSlugs: ["hip-hitch", "lateral-band-walk", "step-up", "graded-walking-programme"],
      },
    ],
    redFlags: [
      "Deep pain in the groin rather than the outer hip, especially with a limp or loss of rotation - this points to the hip joint itself",
      "Outer hip pain after a fall, particularly in older adults or people with osteoporosis - a fracture must be excluded",
      "The area is hot, red and swollen with a fever",
      "Night pain that is severe, constant and not related to lying position, with feeling generally unwell",
      ...GENERAL_RED_FLAGS,
    ],
    recoveryTimeline:
      "Gluteal tendinopathy is often slow, taking 3 to 6 months and sometimes longer to settle fully. Night pain and the ability to lie on the side are usually the last things to improve. Load management plus progressive strengthening outperforms rest or injections over the medium term.",
    progressGuidance:
      "Protect the tendon from compression throughout, not just early on. Progress load using the 24-hour rule. If a stretch or exercise involves the leg crossing the midline or the hip dropping, and it flares the pain, modify it to keep the hip in neutral.",
    faqs: [
      {
        q: "Should I stretch my outer hip and IT band?",
        a: "Generally no. Stretches that pull the leg across the body compress the sore tendon against the bone and often make it worse. Strengthening in neutral positions is the better approach.",
      },
      {
        q: "Is it bursitis?",
        a: "The bursa can be inflamed, but it is now understood to be secondary to the tendon problem in most cases. That is why treating it as a tendinopathy - with load management and strengthening - works better than just settling the bursa.",
      },
      {
        q: "How should I sleep?",
        a: "Try lying on the pain-free side with a pillow between your knees so the top leg does not drop across your body. Lying on your back with a pillow under your knees can also help. Avoid lying directly on the sore hip.",
      },
      {
        q: "Do injections help?",
        a: "A corticosteroid injection can reduce pain in the short term, but by 6 to 12 months exercise-based treatment gives better results. Injections are best reserved for cases where pain is preventing any exercise at all.",
      },
    ],
    relatedConditionSlugs: ["knee-osteoarthritis", "low-back-pain"],
    relatedBlogSlugs: [],
    reviewedBy: REVIEWED_BY,
    reviewedOn: REVIEWED_ON,
  },

  {
    slug: "achilles-tendinopathy",
    name: "Achilles tendinopathy",
    aka: ["Achilles tendinitis", "Achilles tendinosis", "heel cord pain"],
    serviceSlug: "musculoskeletal-physiotherapy",
    bodyArea: "Ankle & foot",
    seoTitle: "Achilles tendinopathy exercises | PhysioOnClick",
    seoDescription:
      "A staged exercise programme for Achilles tendinopathy from a HCPC-registered physiotherapist - load the tendon safely and rebuild your running tolerance.",
    intro:
      "Achilles tendinopathy is an overload problem of the thick tendon that joins the calf muscles to the heel bone. That tendon takes several times body weight with every running stride, so it is strong but sensitive to sudden changes in what it is asked to do. The tissue becomes irritated and less tolerant of load, rather than damaged or close to giving way.\n\nIt typically follows a change: more running, more hill or speed work, a new sport, a return to exercise after a break, a switch to flatter shoes, or a job that suddenly involves far more time on your feet. Age plays a part from the forties onwards, and stiff or weak calves make the tendon work harder for every step.\n\nThe hallmark is pain and stiffness in the tendon for the first steps in the morning and at the start of exercise, often easing as you warm up and then returning later that evening or the next day. There may be a tender, slightly thickened area a few centimetres above the heel, or pain right where the tendon meets the heel bone.\n\nIt responds well to progressive loading, and rest alone tends to make it worse rather than better, because a rested tendon loses capacity. Most people improve substantially over about 12 weeks of consistent calf work, with full running tolerance taking three to six months. This programme calms the tendon, builds calf and tendon strength through a staged plan, then rebuilds running or walking load.",
    whoItHelps:
      "Adults with gradual-onset Achilles or heel pain linked to activity that is stiff for the first steps in the morning. It suits both a recent flare and a tendon that has been grumbling for months. Sudden severe calf pain with a feeling of being kicked, and difficulty pushing off, may be a rupture and needs urgent assessment.",
    program: [
      {
        stage: "Settle the pain",
        blurb:
          "Start here while the tendon is very painful and stiff. Reduce aggravating load, use gentle ankle movement and calf stretching, and begin with isometric calf holds and easy two-legged heel raises.",
        exerciseSlugs: ["ankle-pump", "calf-stretch-gastrocnemius", "heel-raises"],
      },
      {
        stage: "Build strength",
        blurb:
          "The core of the programme. Progressively load the calf and tendon, including slow heel drops that lower the heel below the step, three times a week, building the weight and range over several weeks.",
        exerciseSlugs: ["eccentric-heel-drop", "heavy-slow-calf-raise", "seated-calf-raise", "heel-raises", "calf-stretch-gastrocnemius"],
      },
      {
        stage: "Return to activity",
        blurb:
          "The final stage restores springy, faster loading. Add single-leg and quicker calf work, then rebuild running with a walk-run progression, keeping hills and speed for last.",
        exerciseSlugs: ["heavy-slow-calf-raise", "eccentric-heel-drop", "single-leg-balance", "graded-walking-programme"],
      },
    ],
    redFlags: [
      "Sudden severe pain at the back of the ankle with a snap or a feeling of being kicked, and difficulty walking or pushing off - possible Achilles rupture, seek same-day assessment",
      "Pain, swelling and warmth in the calf with no clear cause, or breathlessness - seek urgent advice to rule out a clot",
      "The heel or ankle is hot, red and swollen with a fever",
      "Pain that is worse at rest and at night rather than with activity",
      ...GENERAL_RED_FLAGS,
    ],
    recoveryTimeline:
      "Most cases improve over 3 to 6 months with a consistent loading programme, though the tendon can stay mildly sensitive for longer. Pain in the mid-portion of the tendon usually responds better and faster than pain right at the heel attachment.",
    progressGuidance:
      "Some pain during and after loading is acceptable - up to about 3 to 5 out of 10 - provided it settles within 24 hours and the tendon is no stiffer than usual the next morning. Use morning stiffness as your main gauge: if it is increasing week on week, you are progressing too quickly.",
    faqs: [
      {
        q: "Should I rest until the pain goes?",
        a: "No. Rest reduces pain briefly but the tendon becomes weaker and the pain returns with activity. Graded loading is what builds the tendon's capacity. Reduce, do not stop.",
      },
      {
        q: "Can I keep running?",
        a: "Often yes, at a reduced volume, if pain during and after a run stays low and settles by the next day. Cut back hills and speed first. Stop running only if easy running is clearly painful or the tendon is worsening.",
      },
      {
        q: "Do heel raises in my shoes help?",
        a: "A temporary heel lift can reduce the load on the tendon and ease symptoms in the early weeks, particularly for insertional pain at the heel bone. It is a short-term aid alongside the strengthening.",
      },
      {
        q: "Is stretching good or bad for it?",
        a: "Gentle calf stretching is fine for mid-portion tendinopathy. For pain right at the heel bone, deep stretching that compresses the tendon against the bone can aggravate it, so keep those stretches gentle and within comfort.",
      },
    ],
    relatedConditionSlugs: ["ankle-sprain", "return-to-running"],
    relatedBlogSlugs: [],
    reviewedBy: REVIEWED_BY,
    reviewedOn: REVIEWED_ON,
  },

  {
    slug: "ankle-sprain",
    name: "Ankle sprain",
    aka: ["rolled ankle", "twisted ankle", "lateral ligament sprain"],
    serviceSlug: "musculoskeletal-physiotherapy",
    bodyArea: "Ankle & foot",
    seoTitle: "Ankle sprain exercises | PhysioOnClick",
    seoDescription:
      "A staged exercise programme for a sprained ankle from a HCPC-registered physiotherapist - early movement, balance retraining, and a safe return to sport.",
    intro:
      "An ankle sprain is an overstretch or a partial tear of the ligaments that hold the ankle together, most often the ones on the outer side, after the foot rolls inwards. Those ligaments do two jobs: they physically restrain the joint, and they feed the brain a constant stream of information about where the foot is. A sprain disrupts both. The great majority are stretched or partly torn fibres rather than a complete rupture.\n\nIt is one of the most common injuries in sport and in everyday life - a kerb, a step missed in the dark, an awkward landing, a pothole. Swelling and bruising usually appear quickly, sometimes tracking down into the foot, and the ankle is often at its most uncomfortable a day or two after the event rather than at the moment it happened.\n\nMost sprains heal well. The problem is that they are so often under-rehabilitated: people stop once the swelling settles and walking is comfortable, and are left with lasting stiffness, calf weakness, or a nagging sense that the ankle is not quite trustworthy on uneven ground. That is what sets up repeat sprains months or years later.\n\nEarly protected movement beats resting it, and completing the balance and strength work markedly lowers the chance of spraining it again. Walking usually feels normal within one to three weeks, while sport typically takes six to twelve weeks depending on the grade. This programme starts with early protected movement, restores range and strength, retrains balance and reaction control, then rebuilds running and sport.",
    whoItHelps:
      "People who have rolled or twisted an ankle and can take at least some weight through it. If you cannot weight-bear at all, or there is bony tenderness over the ankle knobbles or the foot, get an X-ray to rule out a fracture first.",
    program: [
      {
        stage: "Settle the pain",
        blurb:
          "The first days to two weeks. Protect it, keep it elevated when swollen, and start gentle pain-free movement early rather than fully resting. Walk within comfort, using support if needed.",
        exerciseSlugs: ["ankle-pump", "ankle-alphabet", "calf-stretch-gastrocnemius"],
      },
      {
        stage: "Build strength",
        blurb:
          "As swelling settles and walking is comfortable, add calf and ankle strengthening, including work against a band turning the foot outwards, and start single-leg balance.",
        exerciseSlugs: ["heel-raises", "resisted-ankle-eversion", "single-leg-balance"],
      },
      {
        stage: "Return to activity",
        blurb:
          "The final stage restores control on unstable and uneven ground and rebuilds sport. Progress balance work to harder surfaces and add hopping, cutting and sport drills before full return.",
        exerciseSlugs: ["single-leg-balance-on-foam", "uneven-surface-walking", "return-to-sport-readiness-circuit"],
      },
    ],
    redFlags: [
      "You cannot put any weight through the ankle, or bony tenderness over the ankle knobbles or the outer midfoot - get an X-ray to rule out a fracture",
      "Obvious deformity of the ankle or foot",
      "Numbness, pins and needles, or the foot looking pale or feeling cold",
      "Calf pain, swelling and warmth developing over the following days - seek advice to exclude a clot",
      ...GENERAL_RED_FLAGS,
    ],
    recoveryTimeline:
      "A mild sprain often settles enough for normal walking in 1 to 2 weeks and sport in 2 to 6 weeks. More severe sprains can take 6 to 12 weeks or longer. Balance and strength work should continue for at least 2 to 3 months to reduce the risk of another sprain.",
    progressGuidance:
      "Move through the stages as swelling settles, range returns and each level feels controlled. Do not stop at the point where daily life is comfortable - the balance and sport-specific work in the final stage is what prevents recurrence and lasting instability.",
    faqs: [
      {
        q: "Should I rest it or move it?",
        a: "Move it, gently and early. Protected movement and weight-bearing within comfort in the first days leads to a faster and more complete recovery than resting and immobilising.",
      },
      {
        q: "Do I need an X-ray?",
        a: "Not always. An X-ray is recommended if you cannot take a few steps, or if there is tenderness over specific bony points at the ankle or foot. Your clinician can apply these rules quickly.",
      },
      {
        q: "How do I stop it happening again?",
        a: "The strongest evidence is for balance and control retraining continued for a few months, plus general ankle and calf strengthening. A brace or taping can add short-term protection when you first return to sport.",
      },
      {
        q: "My ankle still feels wobbly weeks later - is that normal?",
        a: "A lingering sense of instability is common if the balance work has been skipped. It usually responds well to a dedicated few weeks of single-leg balance and strength training. If it keeps giving way despite this, get it reassessed.",
      },
    ],
    relatedConditionSlugs: ["chronic-ankle-instability", "achilles-tendinopathy"],
    relatedBlogSlugs: [],
    reviewedBy: REVIEWED_BY,
    reviewedOn: REVIEWED_ON,
  },

  {
    slug: "chronic-ankle-instability",
    name: "Chronic ankle instability",
    aka: ["recurrent ankle sprains", "unstable ankle", "functional ankle instability"],
    serviceSlug: "musculoskeletal-physiotherapy",
    bodyArea: "Sports & return to activity",
    seoTitle: "Chronic ankle instability exercises | PhysioOnClick",
    seoDescription:
      "A four-stage rehab programme for chronic ankle instability from a HCPC-registered physiotherapist - strength, balance, and the return-to-play markers.",
    intro:
      "Chronic ankle instability is what tends to develop when an ankle sprain is not fully rehabilitated. The ankle gives way, feels unreliable on uneven ground, or gets sprained again and again. Part of the problem is mechanical - ligaments that healed a little longer than they were - but the larger part is a loss of balance, strength and reaction control, the fast automatic responses that normally protect the joint.\n\nIt is common in people who returned to sport as soon as the swelling settled, without doing the balance and strength work. Each further sprain reinforces the pattern: more caution, less calf and hip strength, slower reactions, and a foot that is less able to correct itself when the ground is not flat.\n\nDay to day it shows as wobbles on grass, kerbs, hills and gravel, a habit of watching where you put your feet, giving way that is often painless, and a general loss of trust in the ankle. Many people also have a lingering ache after a long day on their feet, and some stiffness first thing in the morning.\n\nThe good news is that this control can be retrained at any stage, even years later, and a structured programme substantially reduces how often the ankle turns again. Most people notice steadier ground feel within four to six weeks, with confident sport typically taking around three months of consistent work. This programme rebuilds ankle and calf strength, retrains balance from simple to sport-specific, adds hopping and change of direction, and finishes with clear return-to-play markers.",
    whoItHelps:
      "People with a history of more than one ankle sprain, or an ankle that gives way or feels untrustworthy, who can currently walk and train without acute pain. An acutely swollen, very painful ankle should be managed as a fresh sprain first.",
    program: [
      {
        stage: "Settle",
        blurb:
          "If the ankle is currently irritable, calm it with gentle movement and range work before loading. If it is not sore, use this stage briefly as a warm-up base before progressing.",
        exerciseSlugs: ["ankle-pump", "ankle-alphabet", "calf-stretch-gastrocnemius"],
      },
      {
        stage: "Build strength",
        blurb:
          "Strengthen the calf and the muscles that turn the foot outwards, and start single-leg balance on firm ground, three times a week.",
        exerciseSlugs: ["heel-raises", "resisted-ankle-eversion", "single-leg-balance"],
      },
      {
        stage: "Power and change of direction",
        blurb:
          "Progress balance onto unstable and uneven surfaces, add reaching and reaction tasks, and introduce controlled hopping and direction changes.",
        exerciseSlugs: ["single-leg-balance-on-foam", "single-leg-stance-with-arm-reach", "uneven-surface-walking"],
      },
      {
        stage: "Return to play",
        blurb:
          "You are ready to return when: single-leg balance on a firm surface with eyes closed is steady and equal to the other side; you can hop forwards, sideways and in a figure of eight without the ankle rolling or feeling like it will give; single-leg calf raise strength matches the other side; and you have completed sport-specific drills and a full session without a next-day reaction. Ankle taping or a brace is sensible for the first weeks back. If you are unsure, get assessed before returning.",
        exerciseSlugs: ["return-to-sport-readiness-circuit", "single-leg-stance-with-arm-reach", "single-leg-balance-on-foam"],
      },
    ],
    redFlags: [
      "A fresh sprain where you cannot weight-bear, or there is bony tenderness at the ankle or midfoot - rule out a fracture",
      "The ankle locks, catches or the foot drags when you walk",
      "Persistent swelling that does not settle between episodes, or deep joint-line pain",
      "Numbness or pins and needles in the foot",
      ...GENERAL_RED_FLAGS,
    ],
    recoveryTimeline:
      "A dedicated balance and strength programme typically produces noticeable improvement in stability within 6 to 12 weeks, with continued gains over 3 to 6 months. The exercises are worth keeping up long term as a warm-up or twice-weekly maintenance.",
    progressGuidance:
      "Progress each stage only when the current level is steady, symmetrical and confident. The final stage markers are testable - do not go back to competitive sport until you can meet them, as this is when most recurrences happen.",
    faqs: [
      {
        q: "Do I need surgery to tighten the ligaments?",
        a: "Rarely, and not before a proper rehabilitation programme. Most people regain a stable, reliable ankle through balance and strength training. Surgery is considered only when good rehab has failed and there is clear mechanical laxity.",
      },
      {
        q: "Should I wear a brace all the time?",
        a: "A brace or taping is useful for sport and higher-risk activities, especially in the first few months of returning. It is not a substitute for retraining the ankle's own control, and you do not need it for everyday walking.",
      },
      {
        q: "Why does my ankle still feel weak years after the sprain?",
        a: "Because the balance and reaction control that protects the joint was never retrained. It responds to training even years later - most people are surprised how much steadier the ankle feels after a focused block of work.",
      },
      {
        q: "How often should I do the balance exercises?",
        a: "Aim for most days during the rebuilding phase - even a few minutes counts. Once the ankle is reliable, two or three short sessions a week keeps the benefit.",
      },
    ],
    relatedConditionSlugs: ["ankle-sprain", "return-to-sport-readiness"],
    relatedBlogSlugs: [],
    reviewedBy: REVIEWED_BY,
    reviewedOn: REVIEWED_ON,
  },

  {
    slug: "patellar-tendinopathy",
    name: "Patellar tendinopathy",
    aka: ["jumper's knee", "patellar tendinitis", "patellar tendinosis"],
    serviceSlug: "musculoskeletal-physiotherapy",
    bodyArea: "Sports & return to activity",
    seoTitle: "Patellar tendinopathy exercises | PhysioOnClick",
    seoDescription:
      "A staged rehab programme for patellar tendinopathy, or jumper's knee, from a HCPC-registered physiotherapist - progressive loading and return-to-play tests.",
    intro:
      "Patellar tendinopathy, often called jumper's knee, is an overload injury of the tendon that runs from the bottom of the kneecap to the top of the shin bone. That tendon is the last link in the chain that straightens the knee, so it absorbs a great deal of force every time you land, decelerate or push off. Overload makes it irritated and less tolerant, not fragile.\n\nIt is common in sports with a lot of jumping, landing and rapid direction change - basketball, volleyball, netball, football and athletics - and it usually appears after a jump in training volume or intensity: pre-season, a new team, more court time, or a return after a break. Stiff or weak thighs and calves leave the tendon taking a bigger share of the work.\n\nThe pain is well localised at the lower pole of the kneecap and most people can point to it with one finger. It is typically worse with jumping, landing, decelerating, deep squatting and stairs, and it has a distinctive habit of warming up during activity only to feel worse hours later or the next morning. It rarely swells or gives way.\n\nThe tendon needs graded, progressive load to recover, and rest alone reliably fails because a rested tendon loses capacity. It is stubborn rather than dangerous, and most people take three to six months to get back to full sport, longer if it has been grumbling for a season or more. This programme moves from isometric holds that reduce pain, through heavy slow strength work, into springy jumping and landing, and finishes with return-to-play markers.",
    whoItHelps:
      "Active people with well-localised pain at the bottom of the kneecap that is clearly linked to jumping, landing and loaded knee bending. It suits both in-season management and an off-season rebuild. Pain that is diffuse, or a knee that locks, swells or gives way, needs assessment first.",
    program: [
      {
        stage: "Settle",
        blurb:
          "For a painful flare. Reduce jumping and change-of-direction load, and use isometric holds - a static wall sit or held knee extension - which often reduce tendon pain for hours afterwards.",
        exerciseSlugs: ["wall-squat-hold", "spanish-squat", "quad-sets", "straight-leg-raise"],
      },
      {
        stage: "Build strength",
        blurb:
          "Load the tendon with heavy, slow strength work - controlled squats, step-ups and knee extension - three times a week, taking three seconds up and three seconds down. Some tendon pain during is acceptable if it settles by the next day.",
        exerciseSlugs: ["mini-squat", "terminal-knee-extension-band", "step-up", "reverse-nordic"],
      },
      {
        stage: "Power and change of direction",
        blurb:
          "Add faster, springier work once heavy strength is comfortable - split squats, controlled step-downs, and progressively hopping and landing drills, building volume gradually.",
        exerciseSlugs: ["split-squat", "box-step-down", "single-leg-balance"],
      },
      {
        stage: "Return to play",
        blurb:
          "You are ready to return when: pain on a single-leg decline squat is no more than 3 out of 10; heavy strength is equal left and right; you can jump, land and change direction repeatedly without the tendon flaring the next day; and you have completed a full training session and sport-specific drills without a reaction. Manage load carefully in the first weeks back - avoid sudden spikes in jumping volume. If unsure, get assessed before returning.",
        exerciseSlugs: ["return-to-sport-readiness-circuit", "split-squat", "box-step-down"],
      },
    ],
    redFlags: [
      "Sudden inability to straighten the knee or lift it against gravity after a forceful effort - possible tendon rupture, seek urgent assessment",
      "The knee locks, catches or gives way repeatedly",
      "Marked or rapid swelling of the knee",
      "Pain that is worse at rest and at night rather than with loading",
      ...GENERAL_RED_FLAGS,
    ],
    recoveryTimeline:
      "Patellar tendinopathy is often stubborn, typically taking 3 to 6 months of consistent loading and sometimes a full season. Mid-season management focuses on controlling load and keeping symptoms tolerable; the biggest gains are made in the off-season when heavy strength work can be prioritised.",
    progressGuidance:
      "Use a single-leg decline squat as your test: pain up to 3 out of 10 during loading that settles within 24 hours and does not increase morning stiffness means the load is right. Progress strength before power, and power before return to sport. Do not add jumping volume in the same week you increase strength load.",
    faqs: [
      {
        q: "Should I rest until it stops hurting?",
        a: "No. Complete rest de-loads the tendon and the pain returns as soon as you jump again. The tendon needs progressive load to build capacity. Reduce aggravating volume, but keep loading it.",
      },
      {
        q: "Can I keep playing?",
        a: "Often yes, if pain during play stays at or below about 3 out of 10 and settles within 24 hours, and morning stiffness is not increasing week to week. If those limits are exceeded, reduce match and training load until they are back under control.",
      },
      {
        q: "Do stretching and foam rolling help?",
        a: "They may ease symptoms briefly but do not resolve the tendinopathy. Progressive strength work is the treatment. Very deep quad stretching can sometimes compress and irritate the tendon.",
      },
      {
        q: "What about an injection?",
        a: "Corticosteroid injections into or around the patellar tendon are generally avoided because of the risk of weakening it. Other injection types have weak and inconsistent evidence. Loading remains first-line.",
      },
    ],
    relatedConditionSlugs: ["patellofemoral-pain", "return-to-sport-readiness"],
    relatedBlogSlugs: [],
    reviewedBy: REVIEWED_BY,
    reviewedOn: REVIEWED_ON,
  },

  {
    slug: "acl-rehabilitation",
    name: "ACL injury rehabilitation",
    aka: ["ACL tear rehab", "anterior cruciate ligament rehab", "ACL non-surgical rehab"],
    serviceSlug: "musculoskeletal-physiotherapy",
    bodyArea: "Sports & return to activity",
    seoTitle: "ACL injury rehabilitation exercises | PhysioOnClick",
    seoDescription:
      "A staged rehab programme after an ACL injury from a HCPC-registered physiotherapist - rebuild quad strength, restore control, and meet return-to-sport tests.",
    intro:
      "The anterior cruciate ligament, or ACL, is one of two ligaments that cross inside the knee. It stops the shin bone sliding forwards on the thigh bone and helps control rotation, which is why it matters most in twisting and pivoting sports. It is usually injured without any contact: a sudden change of direction, an awkward landing, or a knee that collapses inwards.\n\nMost people describe a pop or a tearing sensation, rapid swelling within a few hours, and a knee that feels unstable or unwilling to take weight. In the early weeks the knee is stiff and swollen, straightening it fully is hard, and the thigh muscle switches off surprisingly quickly - often within days. The swelling settles over the first few weeks, and many knees then feel deceptively normal for straight-line walking well before they are ready for sport.\n\nNot everyone with an ACL tear needs surgery. Many people, particularly those not returning to pivoting sport, do very well with structured rehabilitation that rebuilds strength and control; this is sometimes called coper management. Others choose reconstruction. Either way the rehabilitation is the part that determines the outcome, and a strong knee before any surgery leads to a better result afterwards.\n\nThis is a long job rather than a dangerous one. Expect several months of consistent work, and around nine to twelve months before pivoting sport if that is the goal. Progress is measured against the other leg rather than against the calendar. This programme rebuilds thigh and hamstring strength, restores single-leg control and confidence, adds hopping and change of direction, and finishes with objective return-to-sport criteria.",
    whoItHelps:
      "People recovering from an ACL injury who are managing without surgery, or who are building a base of strength before deciding, and can currently walk with the knee settled. A knee that is locked, cannot straighten, or is repeatedly giving way needs specialist review.",
    program: [
      {
        stage: "Settle",
        blurb:
          "The early weeks. Reduce swelling, restore full straightening and comfortable bending, and reactivate the quadriceps, which switch off quickly after this injury.",
        exerciseSlugs: ["quad-sets", "straight-leg-raise", "heel-slide"],
      },
      {
        stage: "Build strength",
        blurb:
          "Rebuild double and single-leg strength through the thigh, hip and calf, three times a week, progressing load steadily. This is the longest phase and the foundation for everything after it.",
        exerciseSlugs: ["mini-squat", "terminal-knee-extension-band", "hip-bridge", "single-leg-balance"],
      },
      {
        stage: "Power and change of direction",
        blurb:
          "Add single-leg strength, balance on unstable surfaces, and progressive hopping, landing and cutting drills once strength is well developed and roughly symmetrical.",
        exerciseSlugs: ["split-squat", "box-step-down", "single-leg-balance-on-foam", "single-leg-stance-with-arm-reach"],
      },
      {
        stage: "Return to play",
        blurb:
          "Return to pivoting sport is guided by criteria, not time, and usually takes at least 9 to 12 months if you have had a reconstruction. Markers include: quadriceps and hamstring strength within 90 percent of the other leg; a battery of hop tests within 90 percent symmetry; confident, well-controlled landing and cutting; completion of a full return-to-training progression; and psychological readiness. Get a formal assessment and, if you have had surgery, surgeon clearance before full return.",
        exerciseSlugs: ["return-to-sport-readiness-circuit", "split-squat", "box-step-down"],
      },
    ],
    redFlags: [
      "The knee is locked and cannot be fully straightened - this may be a displaced meniscal tear needing prompt review",
      "Repeated true giving way, especially with pain and swelling each time",
      "A hot, red, very swollen knee with a fever",
      "New numbness, pins and needles, or the foot feeling cold or looking pale",
      ...GENERAL_RED_FLAGS,
    ],
    recoveryTimeline:
      "Non-surgical ACL rehabilitation typically runs 3 to 6 months to return to running and straight-line sport, and 9 to 12 months or more before pivoting sport if that is the goal. After a reconstruction, the timeline is similar from the point of surgery. Progress is measured by strength and control, not the calendar.",
    progressGuidance:
      "Symmetry is the guiding principle. Measure and compare the injured and healthy leg regularly, and only progress toward sport as the gap closes. Rushing the change-of-direction stage before strength is symmetrical is the main cause of re-injury and of the other knee being injured later.",
    faqs: [
      {
        q: "Do I definitely need surgery?",
        a: "Not necessarily. People who do not need to return to pivoting or contact sport often do well without reconstruction. The decision depends on your goals, how stable the knee feels after rehab, and any other damage in the knee. A structured rehab trial helps inform it.",
      },
      {
        q: "Is it safe to exercise on a knee without an ACL?",
        a: "Yes, straight-line strength and fitness work is safe and essential. The activities that need caution are sudden pivots, cuts and awkward landings - which is exactly what the later rehab stages retrain your control for.",
      },
      {
        q: "Why has my thigh wasted so much?",
        a: "The quadriceps shut down reflexively after an ACL injury and after surgery. Regaining full quadriceps strength and symmetry is one of the most important predictors of a good outcome, which is why it is emphasised throughout.",
      },
      {
        q: "What is my risk of doing the other knee?",
        a: "Re-injury risk to either knee is meaningfully raised for the first two years, and is higher if you return before meeting strength and hop criteria. Completing criteria-based rehab and continuing maintenance training lowers that risk.",
      },
    ],
    relatedConditionSlugs: ["after-acl-reconstruction", "return-to-sport-readiness"],
    relatedBlogSlugs: [],
    reviewedBy: REVIEWED_BY,
    reviewedOn: REVIEWED_ON,
  },

  {
    slug: "return-to-running",
    name: "Return to running",
    aka: ["getting back to running", "run-walk return", "return to running after injury"],
    serviceSlug: "online-rehab-programmes",
    bodyArea: "Sports & return to activity",
    seoTitle: "Return to running programme | PhysioOnClick",
    seoDescription:
      "A staged return-to-running plan from a HCPC-registered physiotherapist - build the strength base, progress a run-walk plan, and clear the readiness markers.",
    intro:
      "Getting back to running after an injury, a long break or after having a baby is one of the most common sticking points there is. Runners tend to come unstuck in one of two directions: returning too fast, picking up a fresh injury and losing another month, or losing confidence and never quite restarting. A staged plan with clear markers solves both.\n\nRunning is not really a cardiovascular problem - it is a series of single-leg hops. Each stride puts two to three times body weight through one leg, several hundred times a mile, and the calf, thigh, hip and trunk have to absorb it. Those tissues lose capacity quickly during a layoff and regain it more slowly than fitness does, which is why lungs often feel ready long before legs are.\n\nThe practical signs of progressing too fast are familiar: a niggle that appears late in a run, an ache the following morning that lasts more than a day, or the same spot flaring every time you add distance. Building volume before speed, and keeping the increases modest week to week, is what stops those niggles turning into injuries.\n\nFor most people a graded return takes six to twelve weeks, depending on the length of the layoff and the injury behind it. It is a rebuilding job rather than a test of toughness, and a week held steady is never wasted. This programme builds the strength base first, layers in a graded run-walk progression, adds faster and springier work, then finishes with clear markers that tell you it is safe to build back towards your normal training.",
    whoItHelps:
      "People who want to return to running after a lower-limb injury, a training break, or pregnancy, whose underlying problem has settled and who can currently walk briskly for 30 minutes without symptoms. If you are returning after childbirth, a pelvic health check around 12 weeks is recommended before impact.",
    program: [
      {
        stage: "Settle",
        blurb:
          "Build the base. Confirm you can walk 30 minutes comfortably, and start or continue strength work for the calf, thigh and hip along with easy mobility. No running yet.",
        exerciseSlugs: ["graded-walking-programme", "hip-bridge", "calf-stretch-gastrocnemius"],
      },
      {
        stage: "Build strength",
        blurb:
          "Develop the single-leg strength and endurance that running demands, three times a week - heel raises building towards 20 or more on one leg, step-ups, and balance - while beginning short run-walk intervals.",
        exerciseSlugs: ["heel-raises", "step-up", "single-leg-balance", "bridge-progression"],
      },
      {
        stage: "Power and change of direction",
        blurb:
          "Progress the run-walk towards continuous easy running, and add faster and springier strength work such as assisted hamstring curls and quicker calf work to prepare for pace.",
        exerciseSlugs: ["return-to-sport-readiness-circuit", "nordic-hamstring-curl-assisted", "single-leg-balance"],
      },
      {
        stage: "Return to play",
        blurb:
          "You are ready to build back to full training when: you can walk 30 minutes and run 20 to 30 minutes continuously without pain during or a next-day reaction; single-leg calf raises reach 20 or more each side with equal quality; single-leg balance and hopping feel symmetrical and controlled; and you have completed two to three weeks of consistent easy running without a flare. Add distance or speed - not both together - by no more than about 10 percent a week. Get assessed if symptoms keep interrupting the plan.",
        exerciseSlugs: ["treadmill-or-level-ground-gait-practice", "return-to-sport-readiness-circuit", "heel-raises"],
      },
    ],
    redFlags: [
      "Pain in a specific spot on a bone that worsens as you run and is tender to press - possible bone stress injury, stop running and get assessed",
      "Calf pain and swelling with warmth, or breathlessness - seek urgent advice to exclude a clot",
      "Any joint that locks, gives way or swells after a run",
      "Chest tightness, undue breathlessness, or dizziness on exertion - seek medical advice before continuing",
      ...GENERAL_RED_FLAGS,
    ],
    recoveryTimeline:
      "From a solid walking base, a graded run-walk progression to 30 minutes of continuous running usually takes 4 to 8 weeks. Returning after a bone stress injury or childbirth is slower and should be guided by a clinician. Building from there back to your previous mileage takes several more weeks.",
    progressGuidance:
      "Progress only when the current week has gone well with no lasting symptoms. Use the 24-hour rule after every run. When increasing training, change one variable at a time - distance, frequency or speed - and hold the others steady that week.",
    faqs: [
      {
        q: "How do I start a run-walk plan?",
        a: "A common starting point is alternating 1 minute of easy running with 1 to 2 minutes of walking, for 20 to 30 minutes, every other day. Each week, lengthen the running intervals and shorten the walks, as long as symptoms stay settled.",
      },
      {
        q: "How much can I increase each week?",
        a: "A rough guide is no more than about a 10 percent increase in weekly distance, and not increasing distance and speed in the same week. Some weeks should stay flat, and every third or fourth week can be lighter.",
      },
      {
        q: "Should it be completely pain-free?",
        a: "Mild niggles that stay at or below about 3 out of 10, do not worsen during the run, and settle within 24 hours are usually acceptable. Pain that increases as you run, or lingers into the next day, means you have progressed too quickly.",
      },
      {
        q: "I had a baby recently - when can I run?",
        a: "Current guidance suggests waiting until around 12 weeks postnatal as a minimum, and ideally having a pelvic health assessment first, because the pelvic floor and abdominal wall need time to recover before impact. The strength stages here are safe to start earlier.",
      },
    ],
    relatedConditionSlugs: ["achilles-tendinopathy", "patellofemoral-pain"],
    relatedBlogSlugs: [],
    reviewedBy: REVIEWED_BY,
    reviewedOn: REVIEWED_ON,
  },

  {
    slug: "return-to-sport-readiness",
    name: "Return to sport readiness",
    aka: ["return to sport testing", "return to play criteria", "sport readiness assessment"],
    serviceSlug: "musculoskeletal-physiotherapy",
    bodyArea: "Sports & return to activity",
    seoTitle: "Return to sport readiness programme | PhysioOnClick",
    seoDescription:
      "A four-stage return-to-sport readiness programme from a HCPC-registered physiotherapist - bridge the gap between finishing rehab and competing again.",
    intro:
      "There is usually a gap between the point where an injury stops hurting and the point where the body can genuinely cope with sport. Pain settles early; strength, power, balance and the confidence to trust a limb all lag behind it by weeks or months. Returning during that gap is when re-injuries happen, and this programme is the bridge across it.\n\nThe reason for the gap is simple: pain is a poor measure of capacity. After a lower-limb injury the injured side is commonly still ten to thirty per cent weaker than the other one at the point where everyday walking, jogging and gym work feel completely normal. Sport does not ask for everyday loads. It asks for sudden ones, on one leg, while you are tired and thinking about something else.\n\nThis programme is for the final phase of rehabilitation for any lower-limb injury, once pain has settled and basic strength has returned. It layers in the qualities sport actually demands - single-leg strength and power, balance and control on unstable ground, repeated hopping and landing, and change of direction - and then tests each of them against the healthy side.\n\nThe aim is to finish able to demonstrate, rather than hope, that you are ready: symmetrical strength, symmetrical hop performance, controlled landing and cutting, and a limb you trust without thinking about it. Most people need six to twelve weeks in this phase, and clearing the markers matters more than the number of weeks it takes to clear them.",
    whoItHelps:
      "People finishing rehabilitation for a lower-limb injury who want an objective, staged path back to sport. It assumes pain has settled and you can already do basic double-leg strength work without a flare. It is not a substitute for early-stage rehab of a specific injury.",
    program: [
      {
        stage: "Settle",
        blurb:
          "Confirm the base. You should be able to warm up, do double-leg strength work, and balance on one leg on firm ground without pain or a next-day reaction before progressing.",
        exerciseSlugs: ["general-mobility-warm-up", "single-leg-balance", "hip-bridge"],
      },
      {
        stage: "Build strength",
        blurb:
          "Develop single-leg strength through the thigh, hip, hamstring and calf, three times a week, progressing load until the injured side is working as hard as the healthy side.",
        exerciseSlugs: ["split-squat", "step-up", "nordic-hamstring-curl-assisted", "copenhagen-adductor", "heel-raises"],
      },
      {
        stage: "Power and change of direction",
        blurb:
          "Add speed and spring - controlled step-downs, balance on unstable surfaces, reach and reaction tasks, and progressive hopping, landing and cutting drills.",
        exerciseSlugs: ["box-step-down", "single-leg-balance-on-foam", "single-leg-stance-with-arm-reach", "uneven-surface-walking"],
      },
      {
        stage: "Return to play",
        blurb:
          "You are ready to return to full competition when: single-leg strength is within 90 to 95 percent of the other side; a hop test battery - single, triple and crossover hop for distance - is within 90 percent symmetry; you can decelerate, land and change direction repeatedly with good control and no pain; you have completed a full-intensity training session and sport-specific drills without a next-day reaction; and you feel confident trusting the limb. Arrange a formal assessment before returning to competitive play.",
        exerciseSlugs: ["return-to-sport-readiness-circuit", "single-leg-stance-with-arm-reach", "split-squat"],
      },
    ],
    redFlags: [
      "Any joint that locks, gives way, or swells after training",
      "Sharp, localised bone pain that worsens with impact and is tender to touch",
      "Pain that is escalating session to session despite sensible load management",
      "Calf pain and swelling with warmth, or breathlessness - seek urgent advice",
      ...GENERAL_RED_FLAGS,
    ],
    recoveryTimeline:
      "As a bridging phase this typically takes 4 to 12 weeks, depending on the injury and the sport. After major injuries such as an ACL reconstruction it forms the last few months of a 9 to 12 month process. Readiness is defined by meeting the markers, not by elapsed time.",
    progressGuidance:
      "Test regularly and let the numbers lead. Compare injured and healthy sides for strength and hop distance, and only move toward competition as symmetry reaches the target range. If a session causes a next-day reaction, repeat that level before progressing.",
    faqs: [
      {
        q: "Why can't I just go back once it stops hurting?",
        a: "Because strength, power and control lag well behind pain. Studies consistently show higher re-injury rates in people who return before meeting strength and hop symmetry criteria. The testing exists to catch that gap.",
      },
      {
        q: "What hop tests should I use?",
        a: "A common battery is the single hop for distance, the triple hop, the crossover hop, and a timed hop, each compared with the other leg. Aiming for at least 90 percent symmetry across all of them is a widely used threshold.",
      },
      {
        q: "How important is confidence?",
        a: "Very. Psychological readiness - feeling able to trust the limb and not consciously protecting it - is an independent predictor of returning successfully. If confidence is lagging, more graded exposure to sport-specific tasks usually helps.",
      },
      {
        q: "Do I need to keep doing this once I am back?",
        a: "Keeping two short strength and control sessions a week through the season maintains the qualities you have rebuilt and is one of the better ways to reduce the chance of another injury.",
      },
    ],
    relatedConditionSlugs: ["acl-rehabilitation", "hamstring-strain"],
    relatedBlogSlugs: [],
    reviewedBy: REVIEWED_BY,
    reviewedOn: REVIEWED_ON,
  },

  {
    slug: "after-knee-replacement",
    name: "After a knee replacement",
    aka: ["total knee replacement rehab", "knee arthroplasty recovery", "TKR rehab"],
    serviceSlug: "post-surgical-rehabilitation",
    bodyArea: "Post-surgical",
    seoTitle: "Exercises after a knee replacement | PhysioOnClick",
    seoDescription:
      "A staged exercise programme after a knee replacement from a HCPC-registered physiotherapist - restore movement, rebuild strength, and return to normal life.",
    intro:
      "A knee replacement resurfaces a worn knee joint, capping the ends of the bones with metal and adding a smooth plastic bearing between them. It is one of the most successful operations there is for pain and function, but the surgery is only half of it: the result depends heavily on the rehabilitation you do in the weeks and months afterwards.\n\nTwo things matter most early on. The first is movement, especially getting the knee fully straight and gaining enough bend to walk, sit, climb stairs and get in and out of a car. The second is switching the thigh muscle back on, because the quadriceps becomes very weak very quickly after surgery. Swelling and warmth around the knee are normal for weeks to months and are managed with elevation, movement and pacing.\n\nExpect the first two weeks to be hard work, with sleep often disturbed. Most people are walking comfortably indoors within a few weeks, off walking aids by around six weeks, and back to most daily activities by three months. Improvement usually continues for a full year. The knee often still feels different from a natural one - tight at the end of range, occasionally warm, sometimes clicky - which is expected rather than a problem.\n\nThis programme follows that usual arc: gentle range and muscle activation in the first weeks, progressive strengthening through the middle phase, then a return to walking distance, stairs and daily activities. Always follow the specific instructions from your surgical team, which take priority over any general guidance, and contact them if the knee becomes hot, increasingly swollen or suddenly much more painful.",
    whoItHelps:
      "People recovering from a total or partial knee replacement who have been cleared to exercise by their surgical team. It suits the first weeks at home through to the later months of rebuilding strength. It complements, and does not replace, the specific advice and any hospital physiotherapy you have been given.",
    program: [
      {
        stage: "First days and weeks",
        blurb:
          "The early phase. Focus on full straightening, gradually increasing bend, ankle pumps for circulation, and reactivating the thigh muscle. Do little and often through the day, and elevate the leg to manage swelling.",
        exerciseSlugs: ["ankle-pumps-post-surgery", "quad-sets", "heel-slide", "straight-leg-raise"],
      },
      {
        stage: "Build strength",
        blurb:
          "From around 4 to 6 weeks, as the wound heals and range improves. Add sit-to-stand practice, stationary cycling for movement and fitness, and gentle squats, building the effort gradually.",
        exerciseSlugs: ["assisted-knee-flexion", "sit-to-stand-control", "stationary-bike", "mini-squat"],
      },
      {
        stage: "Return to activity",
        blurb:
          "From around 3 months. Rebuild step and stair strength, walking distance, and the strength for hobbies and daily tasks. Continue for 6 to 12 months to get the most from the joint.",
        exerciseSlugs: ["step-up", "stair-negotiation-practice", "post-op-walking-programme", "return-to-function-strength-circuit"],
      },
    ],
    redFlags: [
      "Calf pain, swelling, warmth or redness, or sudden breathlessness or chest pain - seek urgent medical help to rule out a clot",
      "Wound that opens, leaks fluid, or becomes increasingly red, hot and painful, with or without a fever - possible infection",
      "A sudden increase in pain, swelling or inability to bear weight after a fall or twist",
      "The knee will not straighten or bend at all, or feels unstable and gives way",
      ...GENERAL_RED_FLAGS,
    ],
    recoveryTimeline:
      "Most people walk with a stick or unaided within 2 to 6 weeks, return to driving around 6 weeks, and manage most daily activities by 3 months. Strength, stamina and swelling continue to improve for a full 12 months. The final range of movement is usually settled by around 3 months.",
    progressGuidance:
      "Prioritise full straightening early - it is harder to regain later. Expect the knee to feel warm and swollen after exercise in the first months; that is normal if it settles overnight. Progress load as pain and swelling allow, and keep going with strengthening well beyond the point where you feel recovered.",
    faqs: [
      {
        q: "How much knee bend should I aim for?",
        a: "Around 90 degrees is needed for comfortable walking and sitting, and roughly 110 to 120 degrees for stairs and getting in and out of a car easily. Most people reach a functional range by 6 to 12 weeks with consistent work.",
      },
      {
        q: "Is it normal for the knee to be warm and swollen for months?",
        a: "Yes. Warmth and swelling that fluctuate with activity are expected for 6 to 12 months as the joint settles. Elevation, ice, and pacing your activity help. Swelling that comes on suddenly with calf pain is different and needs urgent review.",
      },
      {
        q: "When can I kneel on it?",
        a: "Kneeling is safe once the wound has fully healed and is comfortable, often around 3 months, though many people find it uncomfortable for longer. It does not damage the replacement. A cushion helps.",
      },
      {
        q: "What activities can I go back to?",
        a: "Walking, swimming, cycling, golf, bowls and doubles tennis are all encouraged. High-impact running and contact sport are generally advised against to avoid wearing the components. Your surgeon can advise on your specific case.",
      },
    ],
    relatedConditionSlugs: ["knee-osteoarthritis", "falls-prevention"],
    relatedBlogSlugs: [],
    reviewedBy: REVIEWED_BY,
    reviewedOn: REVIEWED_ON,
  },

  {
    slug: "after-hip-replacement",
    name: "After a hip replacement",
    aka: ["total hip replacement rehab", "hip arthroplasty recovery", "THR rehab"],
    serviceSlug: "post-surgical-rehabilitation",
    bodyArea: "Post-surgical",
    seoTitle: "Exercises after a hip replacement | PhysioOnClick",
    seoDescription:
      "A staged exercise programme after a hip replacement from a HCPC-registered physiotherapist - restore movement, rebuild strength, and walk confidently again.",
    intro:
      "A hip replacement swaps a worn hip joint for an artificial ball and socket. It reliably relieves pain and improves walking, and most people recover faster than they expect - often faster than after a knee replacement. The rehabilitation focuses on rebuilding the hip and buttock muscles, which weaken over years of arthritis and again after surgery, and on restoring a normal walking pattern.\n\nDepending on the surgical approach you may be given hip precautions: movements to avoid for the first six to twelve weeks to protect against dislocation, such as bending the hip past 90 degrees, crossing the legs, or turning the leg inwards. Some approaches need no precautions at all. Follow the specific advice from your surgical team, which always takes priority over general guidance.\n\nThe typical picture in the early weeks is a hip that is sore around the wound and along the outside of the thigh, tires quickly, and is stiff first thing in the morning. A limp is common at first and usually reflects weak buttock muscles rather than anything wrong with the joint, and it improves as strength returns. Swelling in the thigh, and sometimes down at the ankle, is normal for several weeks.\n\nMost people are walking with a stick or unaided within two to six weeks, back to most daily activities by around three months, and still gaining strength and stamina at a year. This programme moves from gentle early activation and standing work, through progressive strengthening, into walking distance and daily function. Contact your surgical team if the hip becomes hot, increasingly painful, or gives way.",
    whoItHelps:
      "People recovering from a total hip replacement who have been cleared to exercise by their surgical team, and who are observing any hip precautions they were given. It suits the first weeks at home through to rebuilding walking distance months later. It complements hospital physiotherapy rather than replacing it.",
    program: [
      {
        stage: "First days and weeks",
        blurb:
          "The early phase. Ankle pumps for circulation, gentle hip and buttock activation within any precautions, and supported standing to load the leg and start retraining balance and a normal step.",
        exerciseSlugs: ["ankle-pumps-post-surgery", "hip-abduction-in-lying-post-op", "supported-standing-post-hip"],
      },
      {
        stage: "Build strength",
        blurb:
          "From around 4 to 6 weeks. Progress sit-to-stand, bridging and standing hip strengthening, working towards even weight through both legs and away from a limp.",
        exerciseSlugs: ["sit-to-stand-control", "hip-bridge", "hip-abduction-in-lying-post-op", "quad-sets"],
      },
      {
        stage: "Return to activity",
        blurb:
          "From around 3 months, once precautions are lifted. Rebuild walking distance, stairs, and the strength for hobbies and daily life, continuing for 6 to 12 months.",
        exerciseSlugs: ["post-op-walking-programme", "stair-negotiation-practice", "return-to-function-strength-circuit"],
      },
    ],
    redFlags: [
      "Sudden severe hip or groin pain, the leg looking shorter or turned out, and inability to weight-bear - possible dislocation, seek urgent assessment",
      "Calf pain, swelling, warmth or redness, or sudden breathlessness or chest pain - seek urgent help to rule out a clot",
      "Wound that opens, leaks, or becomes increasingly red, hot and painful, with or without a fever",
      "New numbness, foot drop, or the foot feeling cold or looking pale",
      ...GENERAL_RED_FLAGS,
    ],
    recoveryTimeline:
      "Most people walk with one stick or unaided within 2 to 4 weeks, stop using walking aids around 4 to 6 weeks, return to driving around 6 weeks, and feel largely back to normal daily life by 3 months. Muscle strength and stamina keep improving for up to a year.",
    progressGuidance:
      "In the first 6 to 12 weeks, keep every exercise within your hip precautions. Aim to take even weight through the new hip from early on, as favouring it prolongs the limp. Progress strengthening load gradually and keep it going beyond the point you feel recovered - residual buttock weakness is common and fixable.",
    faqs: [
      {
        q: "What are hip precautions and how long do they last?",
        a: "They are temporary limits - typically no bending the hip past 90 degrees, no crossing the legs, and no turning the operated leg inwards - to protect against dislocation while the tissues heal. They usually apply for 6 to 12 weeks. Some newer surgical approaches use few or no precautions; follow your team's advice.",
      },
      {
        q: "Why do I still have a limp after the pain has gone?",
        a: "Years of arthritis weaken the buttock muscles that keep the pelvis level when you walk. The limp usually improves with dedicated hip abductor strengthening over 2 to 3 months.",
      },
      {
        q: "When can I sleep on my side?",
        a: "Often from around 6 weeks, usually on the non-operated side first with a pillow between your knees to keep the leg from crossing the midline. Check with your surgical team.",
      },
      {
        q: "What activities are allowed long term?",
        a: "Walking, swimming, cycling, golf, bowls, dancing and hiking are all encouraged. High-impact activities like running and jumping are usually discouraged to reduce wear. Your surgeon can advise for your implant.",
      },
    ],
    relatedConditionSlugs: ["after-knee-replacement", "falls-prevention"],
    relatedBlogSlugs: [],
    reviewedBy: REVIEWED_BY,
    reviewedOn: REVIEWED_ON,
  },

  {
    slug: "after-acl-reconstruction",
    name: "After an ACL reconstruction",
    aka: ["ACL surgery rehab", "ACL graft rehab", "post-operative ACL rehabilitation"],
    serviceSlug: "post-surgical-rehabilitation",
    bodyArea: "Post-surgical",
    seoTitle: "Exercises after an ACL reconstruction | PhysioOnClick",
    seoDescription:
      "A staged rehab plan after ACL reconstruction from a HCPC-registered physiotherapist - protect the graft, rebuild strength, and meet return-to-sport tests.",
    intro:
      "An ACL reconstruction replaces the torn ligament with a graft, usually taken from your own hamstring tendons or the tendon below the kneecap, threaded through tunnels in the bone and fixed in place. The operation restores the mechanical restraint. The outcome, though, is decided by a long and structured rehabilitation - typically nine to twelve months before a return to pivoting sport.\n\nThe graft is not at its strongest on day one. It is at its most vulnerable in the middle weeks and months, as the body remodels it, which is why the milestones are spaced the way they are and why the protocol is not something to run ahead of. Early rehabilitation protects the graft while restoring full straightening, settling swelling, and switching the quadriceps back on - it shuts down fast after surgery and is slow to return.\n\nThe early weeks are demanding and progress can feel slow, particularly in the second and third month when the knee feels fine for walking but is nowhere near ready for sport. Quadriceps strength is the single best predictor of how things end up, which is why so much of the middle phase is spent on it. The final phase adds power, hopping and change of direction, and tests readiness against objective criteria rather than the calendar.\n\nThis programme follows that arc as a general framework. Always work to the specific protocol and milestones set by your surgeon and treating physiotherapist, which take priority over any general plan, and tell them promptly if the knee swells sharply, locks, or gives way.",
    whoItHelps:
      "People recovering from ACL reconstruction surgery who are following their surgeon's rehabilitation protocol, at any stage from the first weeks after the operation to the final return-to-sport phase. It is a general framework to support that protocol, not a replacement for individualised post-operative physiotherapy.",
    program: [
      {
        stage: "Early recovery",
        blurb:
          "The first weeks. Restore full straightening, control swelling, reactivate the quadriceps, and regain a normal walking pattern within any brace or weight-bearing limits you have been given.",
        exerciseSlugs: ["quad-sets", "straight-leg-raise", "heel-slide", "ankle-pumps-post-surgery"],
      },
      {
        stage: "Build strength",
        blurb:
          "From around 6 to 12 weeks. Progress double and single-leg strengthening, stationary cycling, and controlled knee extension work, building load steadily as the graft matures.",
        exerciseSlugs: ["resisted-knee-extension-post-acl", "mini-squat", "terminal-knee-extension-band", "stationary-bike"],
      },
      {
        stage: "Power and control",
        blurb:
          "From around 3 to 6 months, once strength is developing and roughly symmetrical. Add single-leg strength, balance on unstable surfaces, and progressive hopping and landing drills.",
        exerciseSlugs: ["split-squat", "step-up", "single-leg-balance", "box-step-down"],
      },
      {
        stage: "Return to sport",
        blurb:
          "Return to pivoting sport is a shared decision with your surgeon and physiotherapist, usually not before 9 to 12 months. It is guided by criteria: quadriceps and hamstring strength within 90 percent of the other leg, a hop test battery within 90 percent symmetry, well-controlled landing and cutting, completion of a full return-to-training progression, and psychological readiness. Meeting the criteria matters more than the month.",
        exerciseSlugs: ["return-to-sport-readiness-circuit", "single-leg-balance-on-foam", "return-to-function-strength-circuit"],
      },
    ],
    redFlags: [
      "The knee locks and cannot be fully straightened - possible graft or meniscal problem, seek prompt review",
      "Calf pain, swelling, warmth or redness, or sudden breathlessness - seek urgent help to rule out a clot",
      "Wound that opens, leaks, or becomes increasingly red, hot and painful, with or without a fever",
      "A sudden pop, giving way, or rapid swelling after a twist or fall - seek assessment to check the graft",
      ...GENERAL_RED_FLAGS,
    ],
    recoveryTimeline:
      "Crutches are usually needed for 1 to 3 weeks, full straightening is expected by 2 to 4 weeks, jogging is often introduced around 3 to 4 months, and return to pivoting sport is typically 9 to 12 months, guided by testing. Strength and confidence continue to build into the second year.",
    progressGuidance:
      "Follow your surgeon's protocol for the milestones. Protect the graft by respecting weight-bearing and brace instructions in the early weeks. From the strength phase on, use side-to-side symmetry as the main progression gauge, and do not begin cutting and pivoting drills until strength is close to matched.",
    faqs: [
      {
        q: "Why does it take a whole year?",
        a: "The graft has to revascularise and remodel into a functioning ligament, which takes many months, and re-injury risk stays high until strength and control are fully restored. Returning before around 9 months, or before meeting criteria, sharply raises the chance of a re-tear.",
      },
      {
        q: "When can I drive?",
        a: "Usually around 4 to 6 weeks for an automatic car if the right leg was operated on, or sooner for the left leg, provided you can control the vehicle and perform an emergency stop. Check with your surgeon and insurer.",
      },
      {
        q: "Is it normal for my knee to still feel different months later?",
        a: "Yes. Some stiffness, occasional swelling after hard sessions, and a feeling that the knee is not quite your own are common through the first year and usually fade. Persistent locking or giving way is not normal and should be reviewed.",
      },
      {
        q: "How do I lower the risk of injuring the other knee?",
        a: "Complete criteria-based rehab, keep training both legs equally, and continue a maintenance programme of strength and landing control after you return. The other knee is also at raised risk in the first two years.",
      },
    ],
    relatedConditionSlugs: ["acl-rehabilitation", "return-to-sport-readiness"],
    relatedBlogSlugs: [],
    reviewedBy: REVIEWED_BY,
    reviewedOn: REVIEWED_ON,
  },

  {
    slug: "falls-prevention",
    name: "Falls prevention",
    aka: ["balance training for older adults", "fear of falling", "reducing falls risk"],
    serviceSlug: "gait-and-mobility-assessment",
    bodyArea: "Older adults",
    seoTitle: "Falls prevention exercises for older adults | PhysioOnClick",
    seoDescription:
      "A staged balance and strength programme to reduce falls risk from a HCPC-registered physiotherapist - build steadiness, leg strength, and confidence.",
    intro:
      "Falls become more common as we get older, but they are not an inevitable part of ageing. Most falls are the result of several small things stacking up rather than one cause: leg strength that has quietly declined, balance that is a little less sharp, slower reactions, eyesight, footwear, some medications, and hazards around the home such as rugs, trailing leads and poor lighting.\n\nThe strength and balance part of that list responds well to training at any age, including into the nineties and after a fall has already happened. Muscle can still be built, and the balance reactions that catch you when you trip can still be retrained. Confidence tends to follow strength: people who feel steadier do more, and doing more keeps them steadier.\n\nThe strongest evidence is for programmes that genuinely challenge balance - working at the edge of steadiness in a safe setting, with something solid to hold - combined with leg strengthening, done two or three times a week over several months. Programmes like this reduce the rate of falls in older adults living at home by around a quarter, and the benefit fades if the exercise stops.\n\nIt is worth saying that falls sometimes have a medical cause worth investigating, such as blackouts, dizziness on standing, heart rhythm problems or the effects of medication, so a fall with no warning is a reason to see your GP as well as to start exercising. This programme begins with supported balance and simple strength, progresses to less support and harder balance tasks, and finishes with real-world skills: turning, stepping over obstacles, and walking while doing something else.",
    whoItHelps:
      "Older adults who have had a fall or a near miss, feel unsteady, or have become less confident on their feet. Always exercise where you can hold on to something solid. If you have had blackouts, chest pain, or falls with no warning, see your GP first to check for medical causes.",
    program: [
      {
        stage: "Get started safely",
        blurb:
          "Begin here with support always within reach. Practise standing balance holding a worktop, simple weight-shifting and marching, and standing up from a chair. Aim for a little every day.",
        exerciseSlugs: ["standing-on-one-leg-hand-support", "static-standing-balance-eyes-open", "marching-on-the-spot", "sit-to-stand-repetitions"],
      },
      {
        stage: "Build strength and balance",
        blurb:
          "Progress to less hand support and harder positions - feet together, then one foot in front of the other - and add leg strengthening. Challenge your balance enough that it feels a bit wobbly, but stay safe.",
        exerciseSlugs: ["single-leg-balance", "tandem-balance-hold", "heel-to-toe-walking-tandem-gait", "heel-raises", "sit-to-stand-repetitions"],
      },
      {
        stage: "Return to confident activity",
        blurb:
          "The final stage rehearses everyday situations that cause falls - turning around, stepping over obstacles, uneven ground, and walking while talking or carrying something.",
        exerciseSlugs: ["turning-practice", "obstacle-stepping", "dual-task-walking", "uneven-surface-walking"],
      },
    ],
    redFlags: [
      "Falls or blackouts with no warning, or fainting, or falls with loss of consciousness - see your GP promptly to check heart and blood pressure causes",
      "A fall causing a head injury, especially if on blood-thinning medication - seek urgent medical assessment",
      "Sudden weakness, facial droop, slurred speech or confusion - call 999, this could be a stroke",
      "New or rapidly worsening unsteadiness, dizziness, or leg weakness and numbness",
      ...GENERAL_RED_FLAGS,
    ],
    recoveryTimeline:
      "Balance and strength begin to improve within 4 to 8 weeks, but the falls-reduction benefit comes from keeping it going - the evidence is based on at least 3 hours of balance-challenging exercise a week sustained over 6 months or more. It works best as a permanent habit.",
    progressGuidance:
      "Balance training only works if it is hard enough to challenge you, so progress by reducing hand support and narrowing your base of support as you steady. Always have something solid to grab. If you feel light-headed on standing, rise slowly and pause before you walk off.",
    faqs: [
      {
        q: "Is it safe to do balance exercises if I have already fallen?",
        a: "Yes, and it is one of the best things you can do to reduce the chance of another fall - provided you work within arm's reach of a stable surface. Start with the supported exercises and build up gradually.",
      },
      {
        q: "How much exercise do I need to do?",
        a: "The research suggests aiming for around 3 hours a week of balance and strength work, spread across most days, and continuing long term. Short daily sessions add up and are easier to stick with.",
      },
      {
        q: "What else reduces falls risk?",
        a: "Having your medications reviewed, getting your eyes checked, treating dizziness, sorting out home hazards like loose rugs and poor lighting, and keeping up vitamin D if advised. A falls assessment can pull these together.",
      },
      {
        q: "I am scared of falling during the exercises - what should I do?",
        a: "Set up in a corner of the kitchen with worktops on two sides, or have someone with you at first. Fear of falling is itself a risk factor, and gently and safely rebuilding confidence is part of the treatment.",
      },
    ],
    relatedConditionSlugs: ["after-hip-replacement", "after-knee-replacement"],
    relatedBlogSlugs: [],
    reviewedBy: REVIEWED_BY,
    reviewedOn: REVIEWED_ON,
  },

  {
    slug: "stress-urinary-incontinence",
    name: "Stress urinary incontinence",
    aka: ["bladder leakage", "leaking when coughing or exercising", "pelvic floor weakness"],
    serviceSlug: "online-rehab-programmes",
    bodyArea: "Women's health",
    seoTitle: "Stress urinary incontinence exercises | PhysioOnClick",
    seoDescription:
      "A staged pelvic floor programme for stress urinary incontinence from a HCPC-registered physiotherapist - the right technique, then strength and impact.",
    intro:
      "Stress urinary incontinence is leaking urine when there is a sudden rise in pressure inside the abdomen - coughing, sneezing, laughing, lifting, jumping or running. The word stress here means physical pressure, not emotional stress. The pelvic floor is a sling of muscle running from the pubic bone to the tailbone that supports the bladder and helps close the urethra, and leaking happens when it cannot counteract that pressure quickly and strongly enough.\n\nIt is very common, particularly after pregnancy and childbirth, around and after menopause when tissue changes reduce support, and in people who cough persistently or do a lot of heavy lifting or high-impact sport. Being common does not make it something you have to put up with, and it is not a normal part of getting older or of having had children.\n\nDay to day it shows up as a small leak with a cough or a sneeze, damp underwear after a run or a class, a spare change of clothes in a bag, and a habit of knowing where every toilet is. Many people quietly stop exercising, or avoid trampolines, classes and helpless laughing, which is a large and unnecessary cost.\n\nPelvic floor muscle training is the recommended first treatment and works well for most people, often removing the need for anything further. The key is doing the contraction correctly, progressing it, and keeping it up; most people notice change within about three months of daily practice. This programme teaches the correct contraction and breathing, builds strength and endurance, trains the fast squeeze that counters a cough, then integrates it into movement and impact.",
    whoItHelps:
      "Adults, most often women, who leak urine with coughing, sneezing, lifting or exercise. If you leak with a sudden desperate urge, have pain, notice a vaginal bulge, or have blood in your urine, see a clinician for assessment first as the management differs.",
    program: [
      {
        stage: "Learn the movement",
        blurb:
          "Start here. Learn to find and correctly contract the pelvic floor - a lift and squeeze around the front and back passages - and to let it fully relax, coordinated with relaxed breathing rather than breath-holding or bearing down.",
        exerciseSlugs: ["diaphragmatic-breathing-for-pelvic-floor", "pelvic-floor-activation-basic"],
      },
      {
        stage: "Build strength",
        blurb:
          "Build strength and endurance over 3 to 5 months - longer holds, more repetitions, and quick strong squeezes - most days, and start linking the contraction to a cough or sneeze (the knack).",
        exerciseSlugs: ["pelvic-floor-endurance-hold", "fast-twitch-pelvic-floor-the-knack", "deep-core-and-pelvic-floor-co-activation"],
      },
      {
        stage: "Return to activity",
        blurb:
          "Integrate the pelvic floor into the movements and impact that cause leaks - lifting, squatting, bridging and, if relevant, a graded return to running - using the knack before effort.",
        exerciseSlugs: ["bridge-with-pelvic-floor-engagement", "squat-with-pelvic-floor-control", "return-to-running-pelvic-floor-check"],
      },
    ],
    redFlags: [
      "Blood in your urine, or pain or burning passing urine",
      "A feeling of something coming down or a visible bulge in the vagina - this needs assessment for prolapse",
      "New leakage alongside back or leg weakness, numbness around the saddle area, or bowel control changes - seek urgent assessment",
      "Being unable to pass urine, or a constant dribble with a full bladder feeling",
      ...GENERAL_RED_FLAGS,
    ],
    recoveryTimeline:
      "With correct, consistent training most people notice improvement within 6 to 12 weeks, and the recommended course is at least 3 months and often 5 to 6 months before judging the full result. Continuing a maintenance routine keeps the benefit.",
    progressGuidance:
      "Technique first: if you cannot feel the right muscles working, or you feel a downward push instead of a lift, get checked by a pelvic health physiotherapist before progressing. Build holds and repetitions gradually, and always use the quick squeeze before you cough, lift or jump.",
    faqs: [
      {
        q: "Am I doing pelvic floor exercises correctly?",
        a: "A correct contraction feels like a gentle lift and squeeze around the vagina and back passage, with no clenching of the buttocks, thighs or tummy and no breath-holding. If you are unsure, a pelvic health physiotherapist can check with your consent, which is the most reliable way.",
      },
      {
        q: "How long before I see a difference?",
        a: "Many people feel some improvement within 6 to 8 weeks, but the muscle keeps strengthening for months. Stick with it for at least 3 to 6 months before deciding whether it has worked.",
      },
      {
        q: "Should I stop drinking so much to reduce leaks?",
        a: "No. Cutting fluids concentrates the urine and can irritate the bladder and make things worse. Aim for normal fluid intake and limit caffeine and fizzy drinks if they seem to aggravate it.",
      },
      {
        q: "Can I still run and exercise?",
        a: "Yes. You may need to reduce high-impact activity briefly while you build strength, then reintroduce it gradually using the knack. Leaking during exercise is common and usually improves with training rather than avoidance.",
      },
      {
        q: "What if the exercises do not fix it?",
        a: "If a proper 3 to 6 month programme has not helped enough, other options include a pessary, and in some cases medication or surgery. A pelvic health physiotherapist or your GP can talk through next steps.",
      },
    ],
    relatedConditionSlugs: ["pregnancy-pelvic-girdle-pain", "return-to-running"],
    relatedBlogSlugs: [],
    reviewedBy: REVIEWED_BY,
    reviewedOn: REVIEWED_ON,
  },

  {
    slug: "pregnancy-pelvic-girdle-pain",
    name: "Pregnancy-related pelvic girdle pain",
    aka: ["PGP", "symphysis pubis dysfunction", "SPD", "pelvic pain in pregnancy"],
    serviceSlug: "online-rehab-programmes",
    bodyArea: "Women's health",
    seoTitle: "Pelvic girdle pain in pregnancy exercises | PhysioOnClick",
    seoDescription:
      "A staged exercise programme for pelvic girdle pain in pregnancy from a HCPC-registered physiotherapist - ease the pain, support the pelvis, and stay mobile.",
    intro:
      "Pelvic girdle pain in pregnancy is pain around the joints of the pelvis: at the front over the pubic bone, or at the back over one or both dimples at the base of the spine, sometimes spreading into the buttock or the back of the thigh. It affects around one in five pregnancies. It comes from a change in the way load is shared across the pelvis, not from the joints being damaged, separating or unstable.\n\nSeveral things contribute. The growing baby shifts your centre of gravity forwards, hormonal changes make the supporting tissues a little more giving, and the muscles around the hip and trunk are being asked to control a moving load they have not met before. It is more likely if you had it in a previous pregnancy, or have a history of low back pain.\n\nThe triggers are unmistakable once you know them: walking, stairs, turning over in bed, standing on one leg to dress, getting in and out of a car, and pushing a trolley. It is often worse at the end of the day and after a long walk, and it can disturb sleep. It can be genuinely painful and wearing.\n\nIt does not harm the baby, it does not mean anything is coming apart, and it usually settles in the weeks after birth. Staying as active as comfort allows leads to a better outcome than resting, and pacing - several shorter walks rather than one long one - usually helps more than stopping. This programme reduces pain with positioning and gentle activation, strengthens the hip, buttock and deep trunk muscles that support the pelvis, and gives practical ways to manage daily tasks.",
    whoItHelps:
      "Pregnant women with pain around the pubic bone or the back of the pelvis that is worse with weight-bearing on one leg. If you have severe pain, a fever, vaginal bleeding, reduced baby movements, or signs of labour, contact your maternity team rather than starting exercises.",
    program: [
      {
        stage: "Settle the pain",
        blurb:
          "Start here. Use gentle pelvic tilting and breathing to ease muscle guarding, keep the legs closer together when moving and turning, and take stairs one at a time. Little and often movement beats long rests or long walks.",
        exerciseSlugs: ["standing-pelvic-tilt-pregnancy", "pelvic-tilt", "diaphragmatic-breathing-for-pelvic-floor"],
      },
      {
        stage: "Build support",
        blurb:
          "As pain allows, strengthen the buttock, hip and deep trunk muscles that support the pelvis, most days, keeping within a comfortable range and avoiding wide-legged positions that provoke the pain.",
        exerciseSlugs: ["side-lying-hip-abduction-pregnancy-safe", "clam-shell", "hip-bridge", "pelvic-floor-activation-basic"],
      },
      {
        stage: "Manage daily life",
        blurb:
          "Combine trunk and hip control with practical strategies - sitting to dress, keeping knees together getting out of the car, a pillow between the knees in bed, and pacing activity across the day.",
        exerciseSlugs: ["deep-core-and-pelvic-floor-co-activation", "side-lying-hip-abduction-pregnancy-safe", "standing-pelvic-tilt-pregnancy"],
      },
    ],
    redFlags: [
      "Regular tightening or cramping, a gush or trickle of fluid, or any vaginal bleeding - contact your maternity unit",
      "Reduced or absent baby movements",
      "Severe headache, vision changes, or sudden swelling of the face and hands - could indicate pre-eclampsia, seek urgent review",
      "Fever, pain passing urine, or feeling generally unwell with the pelvic pain",
      "Sudden severe pubic pain with a grinding sensation and inability to walk or lift the leg",
      ...GENERAL_RED_FLAGS,
    ],
    recoveryTimeline:
      "Symptoms usually stay manageable through pregnancy with the right exercises and daily strategies, and most cases improve markedly within days to weeks of giving birth. A minority have pain that persists past the early postnatal months and benefits from ongoing pelvic health physiotherapy.",
    progressGuidance:
      "Let pain guide you: keep exercises and daily movements within a range that does not sharply provoke the pelvis, and favour symmetrical positions - both feet planted, legs not too far apart. If a support belt reduces pain when walking, it is fine to use. Progress the strengthening as your tolerance allows.",
    faqs: [
      {
        q: "Is my pelvis unstable or damaged?",
        a: "No. The term instability is misleading - the joints are not slipping or being harmed. The load-sharing across the pelvis has changed and the muscles need help to support it. Thinking of it this way tends to reduce fear and improve movement.",
      },
      {
        q: "Should I stop walking and exercising?",
        a: "Stay as active as comfort allows. Long walks may need to be broken into shorter ones, but general rest makes stiffness and deconditioning worse. Swimming, stationary cycling and the exercises here are usually well tolerated.",
      },
      {
        q: "Will it affect my labour and birth?",
        a: "Most women with pelvic girdle pain have a normal vaginal birth. It helps to note before labour how far you can comfortably part your legs, so positions can be chosen that stay within that range. Discuss it with your midwife.",
      },
      {
        q: "Does a support belt help?",
        a: "A pelvic support belt worn low, around the hips, reduces pain for many women during walking and standing. Use it for activity rather than all day, alongside the strengthening programme.",
      },
    ],
    relatedConditionSlugs: ["stress-urinary-incontinence", "low-back-pain"],
    relatedBlogSlugs: [],
    reviewedBy: REVIEWED_BY,
    reviewedOn: REVIEWED_ON,
  },
];
