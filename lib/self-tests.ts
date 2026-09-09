/**
 * Public self-check tests (Phase 1 - Part B).
 *
 * A self-check test is a plain, safe, illustrated movement a person can try at
 * home to see what their symptoms might point towards. Each maps to one or more
 * condition hubs in `lib/conditions.ts`.
 *
 * IMPORTANT: this is informational triage, NOT diagnosis. Every record is a
 * hedged AI-drafted starting point behind the same clinical-review gate as the
 * exercise write-ups and the condition hubs (`reviewedOn` is the shared
 * placeholder until Shivaliba Zala signs it off). Nothing here should read as
 * diagnostic - the wording is deliberately "may point towards ... only a
 * hands-on assessment can tell you for sure", and every record carries a real
 * "do not do this test if" contraindication list.
 *
 * Copy is ASCII/Latin-1 only (no en dash, em dash, curly quotes or ellipsis) -
 * enforced by `tests/lib/self-tests.test.ts`.
 *
 * Pages read these through `lib/exercise-library.ts`, never directly.
 */

export type SelfTestStep = {
  label: string; // "Lift to 90 degrees"
  instruction: string[]; // 1-3 bullet points
  imageId: string; // -> /exercise-images/{imageId}.png  (e.g. "test-full-can-3")
};

export type SelfTest = {
  slug: string; // "full-can-test"
  name: string; // "Full Can Test"
  aka?: string[]; // "full can", "supraspinatus test"
  assesses: string; // "The supraspinatus muscle (part of the rotator cuff)"
  bodyArea: string; // reuses the exercise bodyArea vocabulary
  conditionSlugs: string[]; // hubs this test points towards
  whatItChecks: string; // 1-2 plain sentences
  whoShouldNotDoThis: string; // e.g. "a recent injury, you cannot lift the arm at all, or it is very painful at rest"
  steps: SelfTestStep[]; // 3-5
  negativeResult: string[]; // "normal / negative" bullets (green box)
  positiveResult: string[]; // "positive" bullets (red box)
  tips: string[]; // (blue box)
  interpretation: string; // "A positive result may point towards ... It does not confirm it."
  reviewedBy: string;
  reviewedOn: string;
};

/** Shared clinical-review placeholder - same gate as the condition hubs. */
const REVIEWED_BY = "Shivaliba Zala";
const REVIEWED_ON = "2026-09-08";

export const selfTests: SelfTest[] = [
  {
    slug: "full-can-test",
    name: "Full Can Test",
    aka: ["full can", "supraspinatus test", "Jobe test"],
    assesses: "The supraspinatus, one of the four rotator cuff muscles",
    bodyArea: "Shoulder",
    conditionSlugs: ["rotator-cuff-tendinopathy", "shoulder-impingement"],
    whatItChecks:
      "This checks whether the supraspinatus, one of the small muscles that steady the shoulder, is irritable or weak. It gently loads that muscle in the position where it has to work hardest.",
    whoShouldNotDoThis:
      "Do not do this test if you have had a recent significant shoulder injury, you cannot lift the arm at all, the shoulder is very painful at rest or at night, you have pins and needles or weakness spreading down the arm, or you feel unwell with the pain. See a doctor first if any of those apply.",
    steps: [
      {
        label: "Stand tall with your arm by your side",
        instruction: [
          "Stand or sit upright with your shoulders relaxed and level.",
          "Keep your elbow straight but not locked.",
        ],
        imageId: "test-full-can-1",
      },
      {
        label: "Lift the arm to shoulder height, out and slightly forward",
        instruction: [
          "Raise the arm to about shoulder height.",
          "Bring it about 30 degrees forward of straight out to the side, so it lines up with your shoulder blade.",
          "Keep the elbow straight.",
        ],
        imageId: "test-full-can-2",
      },
      {
        label: "Turn the thumb up towards the ceiling",
        instruction: [
          "Rotate the whole arm so your thumb points up, as if holding a full can of drink you do not want to spill.",
        ],
        imageId: "test-full-can-3",
      },
      {
        label: "Press the arm up gently against light resistance",
        instruction: [
          "Have someone press down softly on your forearm, or press the back of your wrist up under the edge of a table.",
          "Hold for about 5 seconds using only light effort.",
          "Note any pain or give-way weakness, and compare with the other side.",
        ],
        imageId: "test-full-can-4",
      },
    ],
    negativeResult: [
      "You can hold the arm up smoothly at shoulder height.",
      "Only mild, even effort on both sides, with no sharp pain.",
      "The arm does not drop or wobble when light pressure is added.",
    ],
    positiveResult: [
      "Sharp or pinching pain in the top or outer shoulder when you press up.",
      "Clear weakness on the tested side compared with the other arm.",
      "The arm drops, or you hitch the shoulder up to keep it there.",
    ],
    tips: [
      "Do it in front of a mirror so you can watch both shoulders.",
      "Always compare the sore side with the other side.",
      "Stop if the pain is sharp rather than a mild stretch or ache.",
    ],
    interpretation:
      "A positive result may point towards an irritated or weak rotator cuff tendon in the shoulder, but it cannot confirm it - plenty of other things cause similar shoulder pain, and only a hands-on assessment can tell you for sure.",
    reviewedBy: REVIEWED_BY,
    reviewedOn: REVIEWED_ON,
  },
  {
    slug: "hawkins-kennedy-test",
    name: "Hawkins-Kennedy Test",
    aka: ["hawkins kennedy", "hawkins test"],
    assesses:
      "Whether the rotator cuff tendons are being pinched under the shoulder blade",
    bodyArea: "Shoulder",
    conditionSlugs: ["shoulder-impingement", "rotator-cuff-tendinopathy"],
    whatItChecks:
      "This checks whether the rotator cuff tendons get nipped in the narrow space under the tip of the shoulder blade when the shoulder is turned inwards. That is a common cause of a catching pain when you reach.",
    whoShouldNotDoThis:
      "Do not do this test if you have had a recent significant shoulder injury, you cannot lift the arm at all, the shoulder is very painful at rest or at night, you have pins and needles or weakness spreading down the arm, or you feel unwell with the pain. See a doctor first if any of those apply.",
    steps: [
      {
        label: "Raise the arm and bend the elbow to a right angle",
        instruction: [
          "Lift the arm straight in front of you to shoulder height.",
          "Bend the elbow so the forearm points out to the side, palm down.",
        ],
        imageId: "test-hawkins-kennedy-1",
      },
      {
        label: "Support the elbow with your other hand",
        instruction: [
          "Cup the tested elbow in your opposite hand so the shoulder muscles can relax.",
          "Keep the upper arm level at shoulder height.",
        ],
        imageId: "test-hawkins-kennedy-2",
      },
      {
        label: "Slowly rotate the forearm downwards",
        instruction: [
          "Let your other hand guide the forearm down towards the floor, turning the shoulder inwards.",
          "Move slowly and stop at the first pinch of pain.",
        ],
        imageId: "test-hawkins-kennedy-3",
      },
      {
        label: "Note where and when the pain appears",
        instruction: [
          "A sharp pinch at the front or outer shoulder near the end of the movement is the response to look for.",
          "Compare with the other side.",
        ],
        imageId: "test-hawkins-kennedy-4",
      },
    ],
    negativeResult: [
      "The shoulder turns in smoothly with no sharp pain.",
      "Any pulling feeling is mild and eases as soon as you stop.",
      "Both sides feel similar.",
    ],
    positiveResult: [
      "A sharp pinch or catch at the front or outer shoulder as the forearm turns down.",
      "The pain is clearly worse than on the other side.",
      "You instinctively stop or guard the movement.",
    ],
    tips: [
      "Keep the upper arm level at shoulder height throughout.",
      "Let your supporting hand do the work so the shoulder stays relaxed.",
      "Stop at the first sharp pain rather than pushing through.",
    ],
    interpretation:
      "A positive result may point towards the rotator cuff tendons being irritated or pinched in the shoulder, but it cannot confirm it - other shoulder and neck problems cause similar pain, and only a hands-on assessment can tell you for sure.",
    reviewedBy: REVIEWED_BY,
    reviewedOn: REVIEWED_ON,
  },
  {
    slug: "painful-arc-self-check",
    name: "Painful Arc Self-Check",
    aka: ["painful arc", "arc of pain"],
    assesses:
      "Where in the range of lifting the arm out to the side the shoulder is irritable",
    bodyArea: "Shoulder",
    conditionSlugs: ["shoulder-impingement", "rotator-cuff-tendinopathy"],
    whatItChecks:
      "This checks whether there is a particular band of movement, part way up as you lift your arm out to the side, that is painful while the range above and below it is comfortable. That pattern is typical of a pinched or irritated tendon.",
    whoShouldNotDoThis:
      "Do not do this test if you have had a recent significant shoulder injury, you cannot lift the arm at all, the shoulder is very painful at rest or at night, you have pins and needles or weakness spreading down the arm, or you feel unwell with the pain. See a doctor first if any of those apply.",
    steps: [
      {
        label: "Stand with both arms by your sides",
        instruction: [
          "Stand tall with your thumbs pointing forwards.",
          "Relax your shoulders down.",
        ],
        imageId: "test-painful-arc-1",
      },
      {
        label: "Slowly raise the sore arm out to the side",
        instruction: [
          "Lift the arm sideways towards overhead at a slow, steady pace.",
          "Keep the thumb pointing up and the elbow straight.",
        ],
        imageId: "test-painful-arc-2",
      },
      {
        label: "Note the range where it hurts",
        instruction: [
          "Pain that appears around shoulder height and mid-range, then eases as you lift higher, is the pattern to look for.",
          "Lower slowly and see if the same band hurts on the way down.",
        ],
        imageId: "test-painful-arc-3",
      },
      {
        label: "Compare with the other arm",
        instruction: [
          "Repeat the same slow lift with the other arm.",
          "Note whether one side has a painful band that the other does not.",
        ],
        imageId: "test-painful-arc-4",
      },
    ],
    negativeResult: [
      "The arm lifts all the way up with no particular painful band.",
      "Any ache is mild and even through the whole movement.",
      "Both arms feel similar.",
    ],
    positiveResult: [
      "Pain that comes on around shoulder height and mid-range, then eases higher up.",
      "The same band hurts on the way back down.",
      "The other arm has no painful band.",
    ],
    tips: [
      "Move slowly - rushing can hide the painful band.",
      "Stand side-on to a mirror so you can see the height where it hurts.",
      "Stop if the pain is sharp or the arm feels like it will give way.",
    ],
    interpretation:
      "A painful band in mid-range may point towards an irritated rotator cuff tendon or pinching in the shoulder, but it cannot confirm it - other problems cause similar pain, and only a hands-on assessment can tell you for sure.",
    reviewedBy: REVIEWED_BY,
    reviewedOn: REVIEWED_ON,
  },
  {
    slug: "resisted-wrist-extension-test",
    name: "Resisted Wrist Extension Test",
    aka: ["Cozen's test self-version", "tennis elbow test"],
    assesses:
      "The wrist and finger extensor tendons that attach on the outer elbow",
    bodyArea: "Elbow & wrist",
    conditionSlugs: ["tennis-elbow"],
    whatItChecks:
      "This checks whether the tendons that straighten the wrist and fingers, which share an attachment on the bony bump on the outside of the elbow, are irritable when you load them. Pain there when gripping or lifting is the classic tennis elbow pattern.",
    whoShouldNotDoThis:
      "Do not do this test if you have had a recent significant elbow or wrist injury, you cannot move the wrist at all, the elbow is very painful at rest, you have pins and needles or weakness spreading into the hand, or you feel unwell with the pain. See a doctor first if any of those apply.",
    steps: [
      {
        label: "Straighten the arm out in front of you",
        instruction: [
          "Hold the arm out with the elbow straight and the palm facing down.",
          "Make a loose fist.",
        ],
        imageId: "test-wrist-ext-1",
      },
      {
        label: "Cock the wrist up towards the ceiling",
        instruction: [
          "Bend the wrist back so the knuckles lift towards the ceiling.",
          "Keep the elbow straight.",
        ],
        imageId: "test-wrist-ext-2",
      },
      {
        label: "Press down on the back of the hand with your other hand",
        instruction: [
          "Use your other hand to push the raised hand down while you resist.",
          "Use light to moderate effort only, held for about 5 seconds.",
        ],
        imageId: "test-wrist-ext-3",
      },
      {
        label: "Note where any pain appears",
        instruction: [
          "Pain felt over the bony bump on the outside of the elbow is the response to look for.",
          "Compare with the other arm.",
        ],
        imageId: "test-wrist-ext-4",
      },
    ],
    negativeResult: [
      "You can hold the wrist up against light pressure with no sharp pain.",
      "Any effort is felt evenly in the forearm, not pinpointed at the elbow.",
      "Both arms feel similar.",
    ],
    positiveResult: [
      "Pain over the bony bump on the outside of the elbow when you resist.",
      "The same spot is tender if you press on it.",
      "Gripping or lifting a kettle reproduces the same pain.",
    ],
    tips: [
      "Keep the elbow fully straight - a bent elbow makes the test less clear.",
      "Compare with the other side.",
      "Stop if the pain is sharp rather than a mild pull.",
    ],
    interpretation:
      "A positive result may point towards tennis elbow, an irritation of the wrist extensor tendons where they attach at the outer elbow, but it cannot confirm it - neck and nerve problems can refer similar pain, and only a hands-on assessment can tell you for sure.",
    reviewedBy: REVIEWED_BY,
    reviewedOn: REVIEWED_ON,
  },
  {
    slug: "resisted-wrist-flexion-test",
    name: "Resisted Wrist Flexion Test",
    aka: ["golfer's elbow test", "medial epicondyle test"],
    assesses: "The wrist flexor tendons that attach on the inner elbow",
    bodyArea: "Elbow & wrist",
    conditionSlugs: ["golfers-elbow"],
    whatItChecks:
      "This checks whether the tendons that bend the wrist and fingers, which share an attachment on the bony bump on the inside of the elbow, are irritable when you load them. Pain there when gripping is the classic golfer's elbow pattern.",
    whoShouldNotDoThis:
      "Do not do this test if you have had a recent significant elbow or wrist injury, you cannot move the wrist at all, the elbow is very painful at rest, you have pins and needles or weakness spreading into the hand, or you feel unwell with the pain. See a doctor first if any of those apply.",
    steps: [
      {
        label: "Straighten the arm with the palm facing up",
        instruction: [
          "Hold the arm out in front with the elbow straight and the palm facing up.",
          "Open the hand.",
        ],
        imageId: "test-wrist-flex-1",
      },
      {
        label: "Curl the wrist up towards you",
        instruction: [
          "Bend the wrist so the palm lifts towards your face.",
          "Keep the elbow straight.",
        ],
        imageId: "test-wrist-flex-2",
      },
      {
        label: "Press the hand back down with your other hand",
        instruction: [
          "Use your other hand to push the palm back down while you resist.",
          "Light to moderate effort only, held for about 5 seconds.",
        ],
        imageId: "test-wrist-flex-3",
      },
      {
        label: "Note where any pain appears",
        instruction: [
          "Pain over the bony bump on the inside of the elbow is the response to look for.",
          "Compare with the other arm.",
        ],
        imageId: "test-wrist-flex-4",
      },
    ],
    negativeResult: [
      "You can hold the wrist against light pressure with no sharp pain.",
      "Effort is felt evenly through the forearm.",
      "Both arms feel similar.",
    ],
    positiveResult: [
      "Pain over the bony bump on the inside of the elbow when you resist.",
      "That spot is tender to press.",
      "Gripping firmly reproduces the same pain.",
    ],
    tips: [
      "Keep the elbow straight throughout.",
      "Compare with the other side.",
      "Stop if the pain is sharp or spreads into the hand.",
    ],
    interpretation:
      "A positive result may point towards golfer's elbow, an irritation of the wrist flexor tendons where they attach at the inner elbow, but it cannot confirm it - nerve irritation at the inner elbow can feel similar, and only a hands-on assessment can tell you for sure.",
    reviewedBy: REVIEWED_BY,
    reviewedOn: REVIEWED_ON,
  },
  {
    slug: "slump-self-check",
    name: "Slump Self-Check",
    aka: ["slump test", "seated nerve glide test"],
    assesses: "Whether the sciatic nerve is sensitive to being put on stretch",
    bodyArea: "Back & neck",
    conditionSlugs: ["sciatica"],
    whatItChecks:
      "This checks whether the sciatic nerve, which runs from the lower back down the back of the leg, is sensitive to being lengthened. If gently stretching the nerve reproduces your familiar leg symptoms, that points towards the nerve being involved.",
    whoShouldNotDoThis:
      "Do not do this test if you have had a recent significant back injury or fall, any loss of bladder or bowel control, numbness around the saddle area, spreading or worsening leg weakness, pins and needles in both legs, or you feel unwell. Seek urgent medical care for any of those - do not use this test.",
    steps: [
      {
        label: "Sit tall on the edge of a firm chair",
        instruction: [
          "Sit with the backs of your knees against the chair edge and your hands behind your back.",
          "Start fully upright.",
        ],
        imageId: "test-slump-1",
      },
      {
        label: "Slump the back and shoulders forward",
        instruction: [
          "Let your lower back and upper back round, sliding the breastbone down.",
          "Keep your head up and level for now.",
        ],
        imageId: "test-slump-2",
      },
      {
        label: "Straighten one knee",
        instruction: [
          "Slowly straighten the leg on your symptomatic side until you feel a gentle pull.",
          "Stop at the first pull, do not force it.",
        ],
        imageId: "test-slump-3",
      },
      {
        label: "Pull the foot up towards you",
        instruction: [
          "Bring the toes and foot up towards your shin.",
          "Note any tightness or symptoms down the back of the leg.",
        ],
        imageId: "test-slump-4",
      },
      {
        label: "Tuck the chin, then lift the head, and compare",
        instruction: [
          "With everything else held still, tuck your chin to your chest, then lift the head back up.",
          "If leg symptoms ease when you lift the head and return when you tuck it, that change is the response to look for.",
          "Repeat on the other leg to compare.",
        ],
        imageId: "test-slump-5",
      },
    ],
    negativeResult: [
      "You feel a mild, even stretch behind the knee or thigh on both sides.",
      "Moving the head up and down does not change the feeling in the leg.",
      "No pins and needles, and no reproduction of your usual leg pain.",
    ],
    positiveResult: [
      "Straightening the knee or lifting the foot reproduces your familiar leg pain, pins and needles or tightness.",
      "Those symptoms clearly ease when you lift your head and come back when you tuck the chin.",
      "The symptomatic leg is much tighter or more sensitive than the other.",
    ],
    tips: [
      "Move slowly and stop at the first reproduction of your symptoms.",
      "Change one thing at a time so you can tell what caused the symptom.",
      "Stop the test if symptoms are strong or slow to settle afterwards.",
    ],
    interpretation:
      "A positive result may point towards sciatica, where the sciatic nerve is being irritated somewhere along its path, but it cannot confirm it - tight hamstrings and other problems can feel similar, and only a hands-on assessment can tell you for sure.",
    reviewedBy: REVIEWED_BY,
    reviewedOn: REVIEWED_ON,
  },
  {
    slug: "straight-leg-raise-self-check",
    name: "Straight Leg Raise Self-Check",
    aka: ["SLR test", "Lasegue self-check"],
    assesses:
      "Whether lifting the straight leg reproduces leg pain from a sensitised sciatic nerve",
    bodyArea: "Back & neck",
    conditionSlugs: ["sciatica", "low-back-pain"],
    whatItChecks:
      "This checks whether raising your straight leg while lying down reproduces pain down the back of that leg. Lifting the leg puts the sciatic nerve on stretch, so a familiar shooting or pulling leg pain in a low range points towards the nerve being sensitive.",
    whoShouldNotDoThis:
      "Do not do this test if you have had a recent significant back injury or fall, any loss of bladder or bowel control, numbness around the saddle area, spreading or worsening leg weakness, pins and needles in both legs, or you feel unwell. Seek urgent medical care for any of those - do not use this test.",
    steps: [
      {
        label: "Lie flat on your back",
        instruction: [
          "Lie on a bed or the floor with both legs straight and relaxed.",
          "Rest your head down.",
        ],
        imageId: "test-slr-1",
      },
      {
        label: "Slowly lift one straight leg",
        instruction: [
          "Keeping the knee straight, raise the leg towards the ceiling at a slow, steady pace.",
          "Stop as soon as you feel a strong pull or your familiar leg pain.",
        ],
        imageId: "test-slr-2",
      },
      {
        label: "Note the height and the symptoms",
        instruction: [
          "Note roughly how high the leg came up and where you felt it.",
          "Leg pain, pins and needles or pulling that starts in a low range, well before the leg is vertical, is the response to look for.",
        ],
        imageId: "test-slr-3",
      },
      {
        label: "Lower the leg and compare with the other side",
        instruction: [
          "Lower slowly and rest.",
          "Repeat with the other leg and compare how high it goes and how it feels.",
        ],
        imageId: "test-slr-4",
      },
    ],
    negativeResult: [
      "Both legs lift to a similar height.",
      "You feel only a mild stretch behind the thigh or knee, not your usual pain.",
      "No pins and needles or shooting pain down the leg.",
    ],
    positiveResult: [
      "Your familiar leg pain, pins and needles or tightness comes on early in the lift.",
      "The symptomatic leg lifts much less far than the other before symptoms stop you.",
      "Pulling the foot up towards you at that point makes the leg symptoms worse.",
    ],
    tips: [
      "Lift slowly - a quick lift can trigger a stronger response than you want.",
      "Keep the resting leg flat and relaxed.",
      "Stop at the first sign of your familiar pain and let it settle before trying the other side.",
    ],
    interpretation:
      "A positive result may point towards sciatica or nerve-related back pain, where a nerve from the lower back is sensitive, but it cannot confirm it - tight hamstrings and other problems can limit a straight leg raise too, and only a hands-on assessment can tell you for sure.",
    reviewedBy: REVIEWED_BY,
    reviewedOn: REVIEWED_ON,
  },
  {
    slug: "single-leg-decline-squat-check",
    name: "Single-Leg Decline Squat Check",
    aka: ["decline squat test"],
    assesses:
      "How well the knee tolerates load through the kneecap tendon and the front of the knee",
    bodyArea: "Knee",
    conditionSlugs: ["patellofemoral-pain", "patellar-tendinopathy"],
    whatItChecks:
      "This checks how the front of your knee copes with a controlled single-leg squat on a slight downhill slope. The slope increases the load on the kneecap and its tendon, so pain there points towards that structure being irritable.",
    whoShouldNotDoThis:
      "Do not do this test if you have had a recent significant knee injury, the knee locks, gives way or is very swollen, you cannot put weight through the leg, it is very painful at rest, or you feel unwell with the pain. See a doctor first if any of those apply.",
    steps: [
      {
        label: "Set up on a small slope",
        instruction: [
          "Stand on a firm wedge or the bottom of a slope, about 15 to 25 degrees, with your toes pointing downhill.",
          "Have a wall or rail beside you for balance.",
        ],
        imageId: "test-decline-squat-1",
      },
      {
        label: "Stand on the leg you want to test",
        instruction: [
          "Shift your weight onto the test leg and lift the other foot just off the ground.",
          "Keep your trunk upright.",
        ],
        imageId: "test-decline-squat-2",
      },
      {
        label: "Slowly bend the knee to about a quarter squat",
        instruction: [
          "Lower under control, letting the knee travel forward over the foot.",
          "Go only as far as is comfortable, to roughly a quarter or half squat.",
          "Keep the kneecap tracking over the middle of the foot.",
        ],
        imageId: "test-decline-squat-3",
      },
      {
        label: "Come back up and note the response",
        instruction: [
          "Straighten back up under control.",
          "Note any pain at the front of the knee or just below the kneecap, and whether the leg felt weak or unsteady.",
          "Compare with the other leg.",
        ],
        imageId: "test-decline-squat-4",
      },
    ],
    negativeResult: [
      "You can lower and rise under control with no sharp pain.",
      "Any effort is felt evenly in the thigh, not pinpointed at the kneecap.",
      "Both legs feel similar in strength and control.",
    ],
    positiveResult: [
      "Pain at the front of the knee or just below the kneecap during the squat.",
      "The knee rolls inwards or the hip drops because the leg cannot control the movement.",
      "Clearly weaker or more painful than the other leg.",
    ],
    tips: [
      "Hold a rail lightly for balance so you can focus on the knee.",
      "Do it side-on to a mirror to watch the knee tracking.",
      "Stop if the pain is sharp or the knee feels like it will give way.",
    ],
    interpretation:
      "A positive result may point towards kneecap-related pain or an irritated kneecap tendon at the front of the knee, but it cannot confirm it - several knee problems feel similar, and only a hands-on assessment can tell you for sure.",
    reviewedBy: REVIEWED_BY,
    reviewedOn: REVIEWED_ON,
  },
  {
    slug: "trendelenburg-mirror-check",
    name: "Trendelenburg Mirror Check",
    aka: ["hip drop test", "single-leg stance test"],
    assesses: "The strength and control of the muscles on the side of the hip",
    bodyArea: "Hip",
    conditionSlugs: ["gluteal-tendinopathy"],
    whatItChecks:
      "This checks whether the muscles on the outside of your hip can keep your pelvis level when you stand on one leg. If the pelvis drops on the opposite side, or your hip pain flares, those muscles and their tendons may not be coping with the load.",
    whoShouldNotDoThis:
      "Do not do this test if you have had a recent significant hip injury or fall, you cannot stand on the leg at all, the hip is very painful at rest or at night, your balance is poor and you have no safe support, or you feel unwell with the pain. See a doctor first if any of those apply.",
    steps: [
      {
        label: "Stand facing a mirror",
        instruction: [
          "Stand tall with your feet hip-width apart and your hands on your hips so you can see the level of your pelvis.",
          "Have a wall or rail within reach for safety.",
        ],
        imageId: "test-trendelenburg-1",
      },
      {
        label: "Lift one foot to stand on the test leg",
        instruction: [
          "Bend the other knee and lift that foot a few centimetres off the floor.",
          "Do not hitch or push off - just lift it clear.",
        ],
        imageId: "test-trendelenburg-2",
      },
      {
        label: "Hold for up to 30 seconds and watch your pelvis",
        instruction: [
          "Keep standing on the test leg and watch the mirror.",
          "Note whether the hip on the lifted-leg side drops down, or your trunk leans over the standing leg to compensate.",
        ],
        imageId: "test-trendelenburg-3",
      },
      {
        label: "Note any hip pain and compare sides",
        instruction: [
          "Note any pain over the bony point on the outside of the standing hip.",
          "Repeat standing on the other leg and compare.",
        ],
        imageId: "test-trendelenburg-4",
      },
    ],
    negativeResult: [
      "Your pelvis stays level for the full hold.",
      "No pain over the outer hip.",
      "Both sides feel similar and steady.",
    ],
    positiveResult: [
      "The hip on the lifted side visibly drops, or you lean hard over the standing leg.",
      "Pain over the bony point on the outside of the standing hip.",
      "You cannot hold the position for anywhere near as long on the sore side.",
    ],
    tips: [
      "Do it in front of a mirror so you can see the pelvis drop.",
      "Keep a fingertip on a wall for balance, not for support.",
      "Stop if the outer hip pain is sharp or lingers afterwards.",
    ],
    interpretation:
      "A positive result may point towards gluteal tendinopathy, an irritation of the hip muscle tendons on the outside of the hip, but it cannot confirm it - hip joint and back problems can feel similar, and only a hands-on assessment can tell you for sure.",
    reviewedBy: REVIEWED_BY,
    reviewedOn: REVIEWED_ON,
  },
  {
    slug: "single-leg-calf-raise-check",
    name: "Single-Leg Calf Raise Check",
    aka: ["heel raise test", "calf endurance test"],
    assesses: "The strength and endurance of the calf and the Achilles tendon",
    bodyArea: "Ankle & foot",
    conditionSlugs: ["achilles-tendinopathy", "ankle-sprain"],
    whatItChecks:
      "This checks how many times you can rise onto the ball of one foot before the calf tires or the Achilles pain stops you. A big difference between sides, or pain in the tendon, points towards the calf and Achilles not coping with load.",
    whoShouldNotDoThis:
      "Do not do this test if you have had a sudden painful snap or pop at the back of the ankle, you cannot push up onto your toes at all, there is a gap you can feel in the tendon, the ankle is very swollen or painful at rest, or you feel unwell. Seek medical care the same day for a suspected tendon rupture - do not use this test.",
    steps: [
      {
        label: "Stand next to a wall for balance",
        instruction: [
          "Stand facing a wall or worktop with your fingertips resting on it.",
          "Stand on the leg you want to test and lift the other foot behind you.",
        ],
        imageId: "test-calf-raise-1",
      },
      {
        label: "Rise up onto the ball of your foot",
        instruction: [
          "Push up as high as you can onto your toes, keeping the knee straight.",
          "Use your fingertips for balance only, not to pull yourself up.",
        ],
        imageId: "test-calf-raise-2",
      },
      {
        label: "Lower under control and repeat",
        instruction: [
          "Lower slowly all the way down.",
          "Repeat at a steady pace, about one rise every two seconds, going as high each time.",
        ],
        imageId: "test-calf-raise-3",
      },
      {
        label: "Count to fatigue and compare sides",
        instruction: [
          "Stop when you cannot get the heel as high, the calf is too tired, or the tendon pain builds up.",
          "Note the number, then test the other leg and compare. A healthy adult can often manage around 20 to 25.",
        ],
        imageId: "test-calf-raise-4",
      },
    ],
    negativeResult: [
      "Both legs manage a similar number of good-height rises.",
      "Only normal muscle tiredness in the calf, no tendon pain.",
      "The heel gets to the same height each rep until fatigue.",
    ],
    positiveResult: [
      "Pain in the Achilles tendon, a few centimetres above the heel, that builds with each rep.",
      "The sore leg manages far fewer rises than the other.",
      "You cannot get the heel anywhere near as high on the sore side.",
    ],
    tips: [
      "Keep the knee straight so the load goes through the Achilles, not just the deeper calf.",
      "Fingertips on the wall for balance only.",
      "Stop if you feel a sharp pain rather than a build-up of ache.",
    ],
    interpretation:
      "A positive result may point towards Achilles tendinopathy, or a calf that has not fully recovered after an ankle injury, but it cannot confirm it - other ankle and foot problems feel similar, and only a hands-on assessment can tell you for sure.",
    reviewedBy: REVIEWED_BY,
    reviewedOn: REVIEWED_ON,
  },
  {
    slug: "active-knee-extension-check",
    name: "Active Knee Extension Check",
    aka: ["AKE test", "hamstring length test"],
    assesses: "The length and irritability of the hamstring muscles",
    bodyArea: "Sports & return to activity",
    conditionSlugs: ["hamstring-strain"],
    whatItChecks:
      "This checks how far you can straighten your knee with your hip held bent, which tells you how tight or sensitive the hamstrings are. A big difference between legs, or a pull in one specific spot, can point towards a hamstring that has not fully recovered.",
    whoShouldNotDoThis:
      "Do not do this test if you have had a recent sudden painful tear at the back of the thigh with heavy bruising, you cannot walk normally, there is a lump or a gap you can feel in the muscle, the leg is very painful at rest, or you feel unwell. See a doctor or physiotherapist first if any of those apply.",
    steps: [
      {
        label: "Lie on your back in a doorway",
        instruction: [
          "Lie down with one leg flat through an open doorway.",
          "Bring the test leg up so the back of the thigh rests against the door frame, hip bent to about a right angle.",
        ],
        imageId: "test-ake-1",
      },
      {
        label: "Hold the thigh vertical",
        instruction: [
          "Keep the thigh still against the frame so the hip angle does not change.",
          "Let the knee be bent and relaxed to start.",
        ],
        imageId: "test-ake-2",
      },
      {
        label: "Slowly straighten the knee",
        instruction: [
          "Straighten the knee as far as it will comfortably go, keeping the thigh against the frame.",
          "Stop at the first firm pull at the back of the thigh.",
        ],
        imageId: "test-ake-3",
      },
      {
        label: "Note how far it goes and where you feel it, then compare",
        instruction: [
          "Note roughly how far short of straight the knee stops, and exactly where the pull is.",
          "Repeat with the other leg and compare the range and the feeling.",
        ],
        imageId: "test-ake-4",
      },
    ],
    negativeResult: [
      "Both knees straighten to a similar point.",
      "You feel a broad, even stretch across the back of the thigh.",
      "No sharp or pinpoint pain.",
    ],
    positiveResult: [
      "The injured leg stops noticeably further from straight than the other.",
      "A sharp or pinpoint pull at one spot in the hamstring, often where it was injured.",
      "The stretch reproduces your familiar hamstring pain.",
    ],
    tips: [
      "Keep the thigh still against the frame - letting the hip move changes the result.",
      "Move slowly and stop at the first firm pull.",
      "Compare the two legs on the same day, one straight after the other.",
    ],
    interpretation:
      "A positive result may point towards a hamstring strain that has not fully recovered its length and comfort, but it cannot confirm it - back and nerve problems can limit this movement too, and only a hands-on assessment can tell you for sure.",
    reviewedBy: REVIEWED_BY,
    reviewedOn: REVIEWED_ON,
  },
];
