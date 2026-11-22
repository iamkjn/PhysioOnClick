// 2026-11-22 library expansion: 16 new movements (ex-172..ex-187) proposed in
// docs/exercises-review/expansion-2026-11-22/ and checked against the live
// catalogue for duplicates (none: each is a distinct movement, see
// docs/exercises-review/expansion-2026-11-22/claude-review.md).
//
// Every record is `draft: true` until Shivaliba signs it off, so prod builds
// leave all of them out (see `exercises` in lib/exercises.ts). On sign-off,
// delete `draft` and set `reviewedOn` per record; move any still unapproved
// ones out of a release rather than shipping them.
import type { Exercise } from "@/lib/exercises";

export const EXPANSION_2026_11_22: Exercise[] = [
  {
    id: "ex-172",
    slug: "controlled-jaw-opening",
    title: "Controlled Jaw Opening",
    bodyPart: "Jaw",
    clinicalArea: "general",
    tags: ["jaw", "tmj", "mobility", "early-rehab"],
    condition: "Jaw pain and temporomandibular disorder (TMD)",
    stage: "Early rehab",
    description: "Slowly opening the mouth a small way in a straight line, tongue resting on the roof of the mouth, to retrain smooth jaw movement in jaw pain or TMD.",
    aka: ["TMJ exercises", "jaw exercises for TMJ pain", "TMD exercises", "controlled mouth opening", "goldfish jaw exercise", "tongue up jaw opening"],
    equipment: ["A mirror", "A chair to sit upright in"],
    pose: null, // no close pose in POSE_SPECS (head-and-jaw close-up); name inference falls back to "standing"
    setup: "Use this exercise only after a dentist or physio has checked your jaw. Sit upright in front of a mirror with your shoulders relaxed, your head level and your teeth slightly apart.",
    steps: [
      "Rest the tip of your tongue lightly on the roof of your mouth, just behind your upper front teeth.",
      "Keeping your tongue there, let your lower jaw drop slowly to open your mouth a small way.",
      "Watch your chin in the mirror - it should move straight down, not swing to one side.",
      "Stop before any click or pain, then close your mouth slowly until your lips meet, with your teeth still slightly apart."
    ],
    cues: [
      "Your tongue stays on the roof of your mouth the whole time - this keeps the opening small and controlled.",
      "Your chin travels straight down and back up along the middle of your face.",
      "Your jaw muscles stay soft; the movement is slow and easy, not a stretch."
    ],
    mistakes: [
      "Opening wide, or pushing on past the point where the jaw clicks or hurts.",
      "Letting your tongue drop off the roof of your mouth as you open.",
      "Letting the jaw swing to one side so your chin zig-zags in the mirror.",
      "Stop and message your physio if your jaw locks open or shut, the joint in front of your ear swells, the pain is clearly worse after the exercise, or you cannot open enough to eat."
    ],
    defaultDosage: {
      reps: 6,
      perDay: 3,
      perWeek: 7,
      notes: "Little and often suits a sore jaw: if it stays comfortable you can build up to 6 times a day. Your physio may adjust this for you."
    },
    helpsWith: ["Opening the mouth smoothly and evenly", "Relaxing tense chewing muscles", "Eating and talking more comfortably"],
    draft: true
  },
  {
    id: "ex-173",
    slug: "thumb-opposition",
    title: "Thumb Opposition",
    bodyPart: "Hand",
    clinicalArea: "upper_limb",
    tags: ["hand", "thumb", "osteoarthritis", "mobility"],
    condition: "Hand and thumb osteoarthritis stiffness",
    stage: "Mobility phase",
    description: "Touching the tip of the thumb gently to each fingertip in turn to make an O shape, keeping the thumb and finger joints moving in hand osteoarthritis.",
    aka: ["thumb to finger touches", "thumb opposition exercise", "thumb to fingertip exercise", "finger touching exercise", "OK sign exercise"],
    equipment: ["A table to rest your elbow on"],
    pose: "gripSqueeze",
    setup: "Sit at a table with your elbow resting on it and your hand held up, fingers pointing towards the ceiling. Let your wrist and shoulder relax. If you have had recent surgery on your hand or thumb, follow the plan your surgeon or hand therapist gave you instead.",
    steps: [
      "Bring your thumb across and gently touch the tip of your thumb to the tip of your index finger, making a round O shape.",
      "Hold the light touch for a few seconds, then open your thumb back out so your hand is open.",
      "Repeat with your middle finger, then your ring finger, then your little finger, opening your hand between each one.",
      "That is one round. Wriggle your fingers loosely before you start the next round."
    ],
    cues: [
      "Tip meets tip - the thumb and finger make a round O, not a flat pinch.",
      "The touch is light, as if you were picking up a feather.",
      "The fingers you are not using stay relaxed and comfortably straight."
    ],
    mistakes: [
      "Pressing or pinching hard between the thumb and the finger.",
      "Letting the middle knuckle of your thumb bend backwards so the O goes flat.",
      "Rushing from finger to finger without opening your hand in between.",
      "Stop and message your physio if your thumb or finger joints become hot, red and swollen, the pain lasts more than half an hour after the exercise, or you get numbness or pins and needles in your fingers."
    ],
    defaultDosage: {
      reps: 5,
      holdSeconds: 3,
      perDay: 2,
      perWeek: 7,
      notes: "One rep is one round, touching each fingertip in turn and holding each touch for about 3 seconds. Build up towards 10 rounds as long as your hand is no more painful afterwards. Your physio may adjust this for you."
    },
    helpsWith: ["Keeping the thumb and finger joints moving", "Fine hand tasks like doing up buttons and picking up coins", "Easing a stiff hand"],
    draft: true
  },
  {
    id: "ex-174",
    slug: "thumb-palmar-abduction",
    title: "Thumb Palmar Abduction",
    bodyPart: "Hand",
    clinicalArea: "upper_limb",
    tags: ["hand", "thumb", "osteoarthritis", "range-of-motion"],
    condition: "Thumb-base osteoarthritis (CMC joint)",
    stage: "Mobility phase",
    description: "Lifting the thumb straight up away from the palm while the hand rests palm up on a table, keeping the base of the thumb moving in thumb osteoarthritis.",
    aka: ["thumb lifts", "thumb abduction exercise", "thumb lift off the palm", "CMC joint exercise", "thumb arthritis exercise", "base of thumb exercise"],
    equipment: ["A table to rest your forearm and hand on"],
    pose: "gripSqueeze",
    setup: "Sit at a table and rest your forearm and the back of your hand on it, palm facing up. Keep your fingers straight and together, with your thumb lying alongside your index finger.",
    steps: [
      "Keep your fingers and wrist relaxed and resting on the table.",
      "Lift your thumb straight up towards the ceiling, away from your palm, as far as is comfortable.",
      "Hold it there for a few seconds.",
      "Lower your thumb slowly back down beside your index finger and let it relax."
    ],
    cues: [
      "Your thumb points up at the ceiling, at a right angle to your palm - it does not swing out to the side.",
      "The movement comes from the base of your thumb, near your wrist.",
      "Your fingers stay flat and together on the table."
    ],
    mistakes: [
      "Swinging the thumb out sideways along the table instead of lifting it up.",
      "Using your other hand to push or lever the thumb further.",
      "Adding a band or weight before your physio has said it is right for you.",
      "Stop and message your physio if the base of your thumb becomes hot, red or swollen, the pain lasts more than half an hour after the exercise, or your thumb catches or clicks painfully."
    ],
    defaultDosage: {
      reps: 5,
      holdSeconds: 3,
      perDay: 2,
      perWeek: 7,
      notes: "Build up to 10 repetitions, then to 10-second holds, as long as your thumb is no more painful afterwards. Your physio may adjust this for you."
    },
    helpsWith: ["Keeping the base of the thumb moving", "Opening the hand to hold a cup, bottle or jar", "Gently working the muscle that lifts and steadies the thumb"],
    draft: true
  },
  {
    id: "ex-175",
    slug: "finger-spread-and-close",
    title: "Finger Spread and Close",
    bodyPart: "Hand",
    clinicalArea: "upper_limb",
    tags: ["hand", "fingers", "osteoarthritis", "range-of-motion"],
    condition: "Hand stiffness and hand osteoarthritis",
    stage: "Mobility phase",
    description: "Spreading the fingers apart and sliding them back together with the hand flat on a table, keeping the finger joints and small hand muscles moving.",
    aka: ["finger spreads", "finger abduction exercise", "spread fingers exercise", "finger fan exercise", "finger splay on a table"],
    equipment: ["A table or other flat surface"],
    pose: "gripSqueeze",
    setup: "Sit at a table and rest your forearm and hand on it, palm down. Keep your wrist straight and your fingers straight and resting together.",
    steps: [
      "Keeping your palm flat on the table, slowly slide your fingers apart, spreading them as wide as is comfortable.",
      "Hold the spread for a few seconds.",
      "Slowly slide your fingers back together until they sit side by side.",
      "Relax your hand, then repeat."
    ],
    cues: [
      "Your palm and fingertips stay in light contact with the table.",
      "Your fingers stay straight as they slide apart and back together.",
      "Spread only as far as feels comfortable - a gentle stretch between the fingers, not a strain."
    ],
    mistakes: [
      "Forcing the fingers apart, or pushing a swollen joint into pain.",
      "Lifting your palm or bending your knuckles to make the fingers spread further.",
      "Letting the fingers flop back together instead of sliding them closed with control.",
      "Stop and message your physio if your finger joints become hot, red and swollen, the pain lasts more than half an hour after the exercise, or you get new numbness or tingling in your fingers."
    ],
    defaultDosage: {
      reps: 5,
      holdSeconds: 3,
      perDay: 2,
      perWeek: 7,
      notes: "Build up to 10 repetitions as long as your hand is no more painful afterwards. Rest the hand on days when the finger joints are red, hot and swollen. Your physio may adjust this for you."
    },
    helpsWith: ["Keeping the finger joints moving", "Opening the hand wide to hold larger objects", "Easing a stiff hand"],
    draft: true
  },
  {
    id: "ex-176",
    slug: "short-foot-exercise",
    title: "Short Foot Exercise",
    bodyPart: "Ankle",
    clinicalArea: "lower_limb",
    tags: ["foot", "ankle", "arch-control", "early-rehab"],
    condition: "Foot pain and reduced arch control",
    stage: "Early rehab",
    description: "Sitting with a bare foot flat and gently drawing the ball of the foot towards the heel so the arch lifts, training the small muscles that support your arch.",
    aka: ["foot doming", "arch doming", "short-foot arch control", "short foot", "foot core exercise", "arch lift exercise"],
    equipment: ["A sturdy chair"],
    pose: null, // no close pose in POSE_SPECS (seated, small foot-only movement); name inference falls back to "standing"
    setup: "Sit upright on a sturdy chair with bare feet flat on the floor, about hip-width apart, and your feet just below your knees. Rest your hands on your thighs.",
    steps: [
      "Keep your heel and the ball of your foot, just behind the big toe, resting on the floor.",
      "Gently draw the ball of your foot back towards your heel so the arch lifts into a small dome.",
      "Hold the dome while you keep breathing normally, with your toes staying long and relaxed.",
      "Relax the foot fully and rest for a moment before the next one."
    ],
    cues: [
      "Your toes stay long and flat on the floor - the work happens in the arch, not the toes.",
      "The foot shortens a little from heel to ball, and the arch rises a little.",
      "Your knee and ankle stay still, and the foot does not roll onto its outer edge."
    ],
    mistakes: [
      "Curling or gripping the floor with your toes instead of lifting the arch.",
      "Rolling onto the outside edge of the foot to make the arch look higher.",
      "Lifting the heel or the ball of the foot off the floor.",
      "Stop and message your physio if you feel sharp pain in the arch or heel, or you notice new numbness, tingling or burning in the foot."
    ],
    defaultDosage: {
      reps: 10,
      holdSeconds: 5,
      perDay: 2,
      perWeek: 7,
      notes: "Start sitting. Once you can lift the arch easily without curling your toes, your physio may move you on to standing. If you have diabetes, numb feet or foot pain with no clear cause, have your feet checked before you start. Your physio may adjust this for you."
    },
    helpsWith: ["Better control of the arch of your foot", "Waking up the small muscles in the sole of your foot", "A steadier base for standing and balance exercises"],
    draft: true
  },
  {
    id: "ex-177",
    slug: "toe-yoga",
    title: "Toe Yoga",
    bodyPart: "Ankle",
    clinicalArea: "lower_limb",
    tags: ["foot", "ankle", "coordination", "early-rehab"],
    condition: "Reduced toe and foot control",
    stage: "Early rehab",
    description: "Lifting the big toe on its own while the small toes stay down, then swapping, to train control of the small muscles in your foot.",
    aka: ["toe dissociation", "toe control exercise", "big toe lifts", "toe lifts", "toe yoga exercise"],
    equipment: ["A sturdy chair"],
    pose: null, // no close pose in POSE_SPECS (seated, toe-only movement); name inference falls back to "standing"
    setup: "Sit upright on a sturdy chair with bare feet flat on the floor, about hip-width apart, and your feet just below your knees.",
    steps: [
      "Keep your heel and the ball of your foot resting on the floor throughout.",
      "Slowly lift your big toe while your four smaller toes stay resting on the floor.",
      "Lower the big toe, then keep it pressed gently down while you lift the four smaller toes.",
      "Lower the small toes and relax the foot before the next round.",
      "If the toes will not separate at first, use a hand to hold down the toes that should stay still while you practise."
    ],
    cues: [
      "Move slowly - this is about control, not how high the toes lift.",
      "Your ankle and the rest of your foot stay still; only the toes move.",
      "The toes that stay down rest lightly on the floor rather than gripping it."
    ],
    mistakes: [
      "Rolling the foot in or out to help the toes lift.",
      "Curling or clawing the toes that are meant to stay down.",
      "Forcing a stiff or sore toe joint to move further than it wants to.",
      "Stop and message your physio if a toe joint becomes sharply painful, red or swollen, or you notice new numbness or tingling in the foot."
    ],
    defaultDosage: {
      reps: 10,
      perDay: 2,
      perWeek: 7,
      notes: "Count one rep as one big-toe lift and one small-toe lift. It often feels awkward at first, and using your hand to help is fine while you learn. Your physio may adjust this for you."
    },
    helpsWith: ["Better control of your toes", "Waking up the small muscles in your foot", "A steadier base for balance and walking"],
    draft: true
  },
  {
    id: "ex-178",
    slug: "seated-plantar-fascia-stretch",
    title: "Seated Plantar Fascia Stretch",
    bodyPart: "Ankle",
    clinicalArea: "lower_limb",
    tags: ["foot", "plantar-heel-pain", "flexibility", "mobility"],
    condition: "Plantar heel pain (plantar fasciitis)",
    stage: "Mobility phase",
    description: "Sitting with the sore foot crossed over the other knee and pulling the toes back towards the shin, stretching the tissue along the sole and arch.",
    aka: ["plantar fascia stretch", "plantar fasciitis stretch", "seated toe stretch", "arch stretch", "heel pain stretch", "morning plantar fascia stretch"],
    equipment: ["A sturdy chair", "A towel, if you cannot cross your leg"],
    pose: null, // no close pose in POSE_SPECS (seated, ankle crossed over the other knee); name inference falls back to "standing"
    setup: "Sit upright on a sturdy chair. Rest the ankle of the sore foot across your other knee so you can reach your toes easily. If your hips or knees do not allow this, sit with the sore leg out straight and loop a towel round the ball of the foot instead.",
    steps: [
      "Hold the base of your toes with one hand and support under your heel and arch with the other.",
      "Gently pull your toes back towards your shin until you feel a stretch along the sole of your foot.",
      "Hold the stretch still while you keep breathing normally - do not bounce.",
      "Ease the toes back slowly, rest for a moment, then repeat.",
      "If you are using a towel, hold both ends and pull gently so the toes and ball of the foot draw back towards you."
    ],
    cues: [
      "You feel a steady stretch along the arch, between the ball of the foot and the heel.",
      "The band under your arch feels firm under your thumb when the stretch is right.",
      "A pulling feeling is right; sharp or stabbing pain is not."
    ],
    mistakes: [
      "Pulling so hard that you feel sharp pain in the heel or toes.",
      "Twisting your hip or knee to reach the foot instead of using a towel.",
      "Bouncing or jerking the toes back.",
      "Stop and message your physio if the heel pain gets worse after stretching, you cannot put weight on the foot, or you notice swelling, numbness or tingling."
    ],
    defaultDosage: {
      sets: 3,
      holdSeconds: 30,
      perDay: 2,
      perWeek: 7,
      notes: "A round before your first steps in the morning, and another after a long spell of sitting, is often the most useful time. If you have diabetes, numbness in the foot, a recent injury, or you cannot put weight on the foot, have it assessed before you start. Your physio may adjust this for you."
    },
    helpsWith: ["More comfortable first steps in the morning", "Loosening a tight arch", "Easier standing and walking with heel pain"],
    draft: true
  },
  {
    id: "ex-179",
    slug: "resisted-ankle-inversion",
    title: "Resisted Ankle Inversion",
    bodyPart: "Ankle",
    clinicalArea: "lower_limb",
    tags: ["ankle", "ankle-strength", "instability", "strength-phase"],
    condition: "Ankle weakness after a sprain or injury",
    stage: "Strength phase",
    description: "Lying with a band pulling your foot outwards and turning the sole inwards against it, strengthening the muscles that steady the inner side of the ankle.",
    aka: ["ankle inversion with band", "theraband ankle inversion", "resistance band inversion", "banded ankle inversion", "tibialis posterior band exercise"],
    equipment: ["A resistance band", "A heavy table leg, post or door anchor to tie the band to", "A mat", "Two small foam rolls or rolled towels"],
    pose: "bandRotation",
    setup: "Lie on your back on a mat with both legs straight. Rest your lower legs on small foam rolls or rolled towels so your heels are just clear of the floor. Tie one end of a resistance band to something solid on the outside of the foot you are working, and loop the other end round the front of that foot so the band pulls it outwards. You can also do this sitting with your legs out straight.",
    steps: [
      "Start with your foot relaxed, letting the band draw it gently outwards.",
      "Slowly turn the sole of your foot inwards against the band, leading with the inner edge of the foot.",
      "Pause briefly at the end, then let the foot return slowly to the start."
    ],
    cues: [
      "Keep your knee and kneecap pointing straight up - the movement is at the ankle, not from turning the whole leg in at the hip.",
      "Control the return; do not let the band pull your foot back quickly.",
      "You should feel the muscles on the inner side of your shin and ankle working."
    ],
    mistakes: [
      "Turning the whole leg inwards from the hip instead of moving the ankle.",
      "Using a band so heavy the movement becomes jerky.",
      "Swinging the foot in quickly and letting the band snap it back out.",
      "Stop and message your physio if you feel sharp pain along the inner ankle or arch, the ankle feels like it is giving way, or it swells after sessions."
    ],
    defaultDosage: {
      sets: 2,
      reps: 12,
      perDay: 1,
      perWeek: 4,
      tempo: "slow and controlled",
      notes: "Start with a light band and build up towards 3 sets of 15 as it gets easier. After a recent sprain or ankle surgery, check with your physio before adding a band. Your physio may also use this for pain along the inner ankle tendon, but only after assessing it. Your physio may adjust this for you."
    },
    helpsWith: ["Strengthening the muscles on the inner side of the ankle", "A steadier ankle on uneven ground", "Building towards walking and sport after an ankle injury"],
    draft: true
  },
  {
    id: "ex-180",
    slug: "resisted-ankle-dorsiflexion",
    title: "Resisted Ankle Dorsiflexion",
    bodyPart: "Ankle",
    clinicalArea: "lower_limb",
    tags: ["ankle", "ankle-strength", "gait", "strength-phase"],
    condition: "Ankle weakness after injury or time in a boot",
    stage: "Strength phase",
    description: "Sitting with the leg straight and a band anchored beyond your foot, pulling the foot up towards your shin to strengthen the front of the shin.",
    aka: ["ankle dorsiflexion with band", "theraband dorsiflexion", "banded ankle dorsiflexion", "resisted foot lift", "shin strengthening exercise"],
    equipment: ["A resistance band", "A heavy table leg, post or door anchor to tie the band to", "A mat"],
    pose: "anklePump",
    setup: "Sit on a mat with the leg you are working straight out in front of you and the heel resting on the mat. Bend the other knee and lean back on your hands for support. Tie one end of a resistance band low down to something solid beyond your foot, and loop the other end over the top of your foot so the band pulls your toes away from you.",
    steps: [
      "Start with your foot relaxed and pointing slightly away, with the band just taut.",
      "Slowly pull your foot up towards your shin against the band, keeping your heel on the mat.",
      "Pause briefly at the top.",
      "Let the foot return slowly to the start, controlling the band all the way."
    ],
    cues: [
      "Only the ankle moves - your knee stays straight and still.",
      "You feel the muscle at the front of your shin working.",
      "Keep your toes relaxed and lift with the whole foot, not by curling the toes up."
    ],
    mistakes: [
      "Bending the knee or leaning back further to drag the foot up.",
      "Letting the band snap the foot back instead of lowering it slowly.",
      "Using a band so heavy the movement becomes small and jerky.",
      "Stop and message your physio if you feel sharp pain at the front of the ankle, or your foot is getting weaker, catching or slapping down when you walk."
    ],
    defaultDosage: {
      sets: 2,
      reps: 12,
      perDay: 1,
      perWeek: 4,
      tempo: "slow and controlled",
      notes: "Start with a light band and build up towards 3 sets of 15 as it gets easier. If your foot has started to drop or drag, or the weakness is getting worse, see your GP or physio before starting this on your own. Your physio may adjust this for you."
    },
    helpsWith: ["Strengthening the muscles that lift your foot", "Clearing your toes when you walk and on stairs", "Building ankle strength after an injury or time in a boot"],
    draft: true
  },
  {
    id: "ex-181",
    slug: "calf-stretch-soleus",
    title: "Calf Stretch (Soleus)",
    bodyPart: "Ankle",
    clinicalArea: "lower_limb",
    tags: ["ankle", "soleus", "flexibility", "mobility"],
    condition: "Calf tightness and heel pain",
    stage: "Mobility phase",
    description: "A bent-knee wall stretch that targets the soleus, the deeper calf muscle low in the leg, easing tightness that can load the heel and Achilles tendon.",
    aka: ["bent-knee calf stretch", "soleus stretch", "lower calf stretch", "standing soleus stretch", "deep calf stretch"],
    equipment: ["A wall"],
    pose: "calfStretch",
    setup: "Stand facing a wall with both hands on it at about shoulder height. Take a short step back with the leg you want to stretch, so your feet are only a small distance apart, both pointing forwards and both heels flat on the floor.",
    steps: [
      "Keep your back heel down and your toes pointing forwards.",
      "Bend both knees, letting your back knee travel forwards and down until you feel a stretch low in the calf of the back leg.",
      "Hold the stretch still - do not bounce.",
      "Ease out slowly, and swap legs if both need it."
    ],
    cues: [
      "The stretch is felt low in the calf, nearer the ankle than the straight-knee calf stretch.",
      "Keep your back heel glued to the floor throughout.",
      "Your body stays upright; sink down through the knees rather than leaning into the wall."
    ],
    mistakes: [
      "Letting the back heel lift, which loses the stretch.",
      "Taking too long a step back, so the back knee cannot bend enough.",
      "Bouncing to push further into range.",
      "Stop and message your physio if you get sharp pain in the Achilles tendon, or stretching makes the pain at the back of your heel worse."
    ],
    defaultDosage: {
      sets: 3,
      holdSeconds: 30,
      perDay: 2,
      perWeek: 7,
      notes: "Often done straight after the straight-knee calf stretch, so both parts of the calf are covered. If you have pain right at the back of the heel bone, stretch more gently or ask your physio first. Your physio may adjust this for you."
    },
    helpsWith: ["Loosening a tight lower calf", "More comfortable first steps in the morning", "More ankle bend for stairs and squatting"],
    draft: true
  },
  {
    id: "ex-182",
    slug: "hamstring-heel-dig-hold",
    title: "Hamstring Heel Dig Hold",
    bodyPart: "Hamstring",
    clinicalArea: "lower_limb",
    tags: ["hamstring", "isometric", "early-rehab"],
    condition: "Hamstring strain and back-of-thigh pain",
    stage: "Early rehab",
    description: "Lying with your knees bent and pressing one heel down into the mat without moving, gently loading the hamstring muscles at the back of the thigh.",
    aka: ["heel digs", "heel dig exercise", "isometric hamstring", "hamstring isometric", "hamstring heel dig", "isometric hamstring contraction"],
    equipment: ["An exercise mat, or a bed or other firm surface to lie on"],
    pose: "pelvicTilt",
    setup: "Lie on your back on a mat with both knees bent and both feet flat, about hip-width apart. Rest your arms by your sides and let your back and pelvis settle onto the mat.",
    steps: [
      "Keep your bottom and lower back resting on the mat the whole time.",
      "Press the heel of your working leg down into the mat, and slightly back towards you, as if trying to drag it towards your bottom without letting it move.",
      "Feel the muscles at the back of that thigh tighten, and hold the press while you keep breathing normally.",
      "Relax fully and rest for a few seconds before the next one."
    ],
    cues: [
      "Nothing moves - your heel, knee and hips stay where they are.",
      "The back of your thigh goes firm, with no cramp or sharp pain.",
      "Your hips stay down on the mat - this is a press, not a bridge."
    ],
    mistakes: [
      "Lifting your hips off the mat and turning it into a bridge.",
      "Pushing as hard as you can straight away instead of using a steady, comfortable effort.",
      "Holding your breath while you press.",
      "Stop and message your physio if you feel a sharp, tearing or cramping pain in the back of the thigh, or the thigh becomes more bruised or swollen."
    ],
    defaultDosage: {
      reps: 10,
      holdSeconds: 5,
      perDay: 2,
      perWeek: 7,
      notes: "Use a steady, comfortable effort rather than a hard push, and build up gradually towards 3 sets of 15 if it stays comfortable. If you felt a pop, have large bruising or think you may have torn the muscle, get it checked before you start. Your physio may adjust this for you."
    },
    helpsWith: ["Gently loading a strained or sore hamstring", "Getting the back of the thigh working again without stretching it", "Building towards walking, stairs and stronger hamstring exercises"],
    draft: true
  },
  {
    id: "ex-183",
    slug: "prone-hamstring-curl-with-band",
    title: "Prone Hamstring Curl with Band",
    bodyPart: "Hamstring",
    clinicalArea: "lower_limb",
    tags: ["hamstring", "knee", "band", "strength-phase"],
    condition: "Hamstring strain and hamstring weakness",
    stage: "Strength phase",
    description: "Lying face down and bending one knee to bring the heel towards your bottom against a resistance band, strengthening the hamstring muscles at the back of the thigh.",
    aka: ["lying hamstring curl", "prone hamstring curl", "band hamstring curl", "hamstring curl with resistance band", "prone knee flexion", "lying leg curl"],
    equipment: ["A light resistance band", "A secure low anchor point beyond your feet, such as a heavy table leg or a band anchor at floor level", "An exercise mat"],
    pose: null, // no close pose in POSE_SPECS (lying face down); name inference falls back to "standing"
    setup: "Lie face down on a mat with your legs straight and your head resting on your folded hands. Loop the band around the ankle of the leg you are working and fix the other end to a secure low point beyond your feet, so the band is gently taut. A pillow under your tummy can make lying face down more comfortable.",
    steps: [
      "Gently tighten your tummy so your lower back stays flat and your hips stay on the mat.",
      "Bend your working knee to bring your heel up towards your bottom against the pull of the band.",
      "Go only as far as feels comfortable, then pause for a moment.",
      "Lower your foot back down slowly, controlling the band all the way.",
      "Finish your repetitions, then move the band to the other ankle if your physio has asked you to work both legs."
    ],
    cues: [
      "Your hips stay pressed into the mat as the knee bends.",
      "The lowering is slow - the band never pulls your leg back down.",
      "Your other leg stays straight and relaxed on the mat."
    ],
    mistakes: [
      "Arching your lower back or lifting your hips to help the heel come up.",
      "Using a band so strong that the movement becomes jerky.",
      "Letting the band snap your foot back down to the mat.",
      "Stop and message your physio if you feel a sharp or pulling pain at the back of the thigh or behind the knee, or a cramp that does not ease when you rest."
    ],
    defaultDosage: {
      sets: 2,
      reps: 10,
      perDay: 1,
      perWeek: 3,
      notes: "Start with a light band and a comfortable range; move to a stronger band only when 2 sets of 12 feel smooth and easy. After a hamstring-graft ACL repair, recent knee surgery or a recent tendon injury, follow your own surgeon's or physio's plan first."
    },
    helpsWith: ["Strengthening the hamstring muscles at the back of the thigh", "Rebuilding strength after a hamstring strain when your physio says it is time", "Supporting the knee for walking, stairs and sport"],
    draft: true
  },
  {
    id: "ex-184",
    slug: "adductor-squeeze",
    title: "Adductor Squeeze",
    bodyPart: "Hip",
    clinicalArea: "lower_limb",
    tags: ["hip", "groin", "adductor-strength", "isometric", "early-rehab"],
    condition: "Groin strain and adductor-related groin pain",
    stage: "Early rehab",
    description: "Lying on your back with a soft ball between your knees and squeezing your knees together, gently strengthening the inner-thigh muscles for groin pain.",
    aka: ["ball squeeze", "groin squeeze", "adductor ball squeeze", "lying adductor squeeze", "inner thigh squeeze", "knee squeeze with a ball"],
    equipment: ["A soft ball or a firmly folded pillow", "An exercise mat"],
    pose: "pelvicTilt",
    setup: "Lie on your back on a mat with your knees bent and your feet flat, in line with your knees. Place a soft ball or a folded pillow between your knees and rest your arms by your sides.",
    steps: [
      "Let your back and hips rest on the mat.",
      "Squeeze your knees together into the ball, starting with a gentle effort.",
      "Hold the squeeze while you keep breathing normally.",
      "Relax slowly and rest for a few seconds before the next one."
    ],
    cues: [
      "Your hips and bottom stay on the mat - this is a squeeze, not a bridge.",
      "You feel the inner thighs working, not a sharp pain in the groin.",
      "Start gently and only build to a firmer squeeze if it stays comfortable."
    ],
    mistakes: [
      "Lifting your hips off the mat as you squeeze.",
      "Squeezing as hard as you can straight away.",
      "Holding your breath while you squeeze.",
      "Stop and message your physio if your groin pain sharply increases, or you notice a new lump, swelling or bruising in the groin."
    ],
    defaultDosage: {
      reps: 10,
      holdSeconds: 5,
      perDay: 2,
      perWeek: 7,
      notes: "Start with a gentle squeeze and build towards a firmer one, and towards 20 repetitions, only while your groin pain does not increase. Unexplained groin or testicular pain, a lump in the groin, or a sudden injury with large bruising needs a medical check first."
    },
    helpsWith: ["Easing back into using the inner-thigh muscles after a groin strain", "Building strength for walking, stairs and changing direction", "Preparing for harder groin exercises your physio may add later"],
    draft: true
  },
  {
    id: "ex-185",
    slug: "seated-thoracic-extension",
    title: "Seated Thoracic Extension",
    bodyPart: "Thoracic spine",
    clinicalArea: "spine",
    tags: ["mid-back", "mobility", "range-of-motion"],
    condition: "Upper back (thoracic) stiffness",
    stage: "Mobility phase",
    description: "Sitting on a firm chair and leaning the upper back gently backwards over the backrest, easing stiffness and helping the upper back straighten from a slouch.",
    aka: ["chair back extension", "thoracic extension over a chair", "seated upper back extension", "mid-back stretch on a chair", "seated back extension"],
    equipment: ["A sturdy chair without wheels, with a firm backrest whose top reaches about the middle of your back"],
    pose: null, // no close pose in POSE_SPECS (seated, leaning back over a chair back); name inference falls back to "standing"
    setup: "Check with your physio before trying this if you have osteoporosis with a fracture in your spine, have recently fallen or hurt your back, or have chest or back pain with no clear cause. Sit well back on a sturdy chair whose backrest top reaches about the middle of your back, with your feet flat on the floor. Cross your arms over your chest, or rest your hands lightly behind your head to support it, elbows pointing forwards.",
    steps: [
      "Sit tall with your bottom well back in the seat.",
      "Slowly lean your upper back backwards over the top of the backrest, only as far as is comfortable.",
      "Keep your head in line with your upper back, with your eyes looking ahead or only slightly up.",
      "Pause briefly, then come back up to sitting tall."
    ],
    cues: [
      "The bend happens in your upper back, just above the backrest - your bottom stays on the seat and your lower back does not arch.",
      "Your head moves with your upper back; your chin stays level and your neck stays relaxed.",
      "Keep it small and comfortable - a gentle stretch, not a backbend."
    ],
    mistakes: [
      "Tipping your head back to look up at the ceiling.",
      "Arching your lower back or lifting your bottom off the seat to lean further.",
      "Using a wobbly chair, a chair on wheels, or one that could tip backwards.",
      "Stop and message your physio if you get sharp or worsening back pain, pain that spreads around your ribs, or pins and needles or numbness in your arms or legs. Seek urgent medical help if you get chest pain or feel suddenly short of breath."
    ],
    defaultDosage: {
      reps: 5,
      holdSeconds: 3,
      perDay: 2,
      perWeek: 7,
      notes: "Build up towards 10 repetitions as it becomes easier, keeping the lean small and comfortable. Your physio may adjust this for you."
    },
    helpsWith: ["Easing a stiff upper back", "Sitting more upright with less effort", "A movement break during long spells of sitting"],
    draft: true
  },
  {
    id: "ex-186",
    slug: "gaze-stabilisation-vor-x1",
    title: "Gaze Stabilisation (VOR x1)",
    bodyPart: "Balance",
    clinicalArea: "balance_walking",
    tags: ["vestibular", "dizziness", "balance", "early-rehab"],
    condition: "Vestibular hypofunction (reduced inner-ear balance function)",
    stage: "Early rehab",
    description: "Keeping your eyes fixed on a still target while turning your head side to side, a specialist exercise for people diagnosed with reduced inner-ear balance function.",
    aka: ["gaze stabilisation exercise", "gaze stability exercises", "VOR exercises", "vestibulo-ocular reflex exercise", "eye and head exercises for dizziness", "vestibular rehabilitation exercise"],
    equipment: ["A sturdy chair", "A small target, such as a letter or dot on a card, fixed at eye level"],
    pose: "neckTurn",
    setup: "Only do this exercise if a clinician trained in inner-ear balance (vestibular) problems has assessed your dizziness, told you that you have reduced inner-ear balance function, and shown you how to do it. It is not for dizziness that has not been diagnosed, and it is not a treatment for BPPV (positional vertigo). Sit in a sturdy chair with your feet flat and your hands resting on your thighs. Fix a small letter or dot on a card at eye level in front of you, about an arm's length away or at the distance your physio has set.",
    steps: [
      "Look at the target and bring it into clear focus.",
      "Turn your head a small way to one side and then to the other, keeping your eyes locked on the target.",
      "Start slowly, and only speed up while the target stays clear and still.",
      "If the target blurs or seems to jump, slow your head down until it is clear again.",
      "Keep going for the time your physio has set, then stop, look ahead and rest until any dizziness settles."
    ],
    cues: [
      "Your eyes stay on the target the whole time - only your head moves.",
      "Your head moves smoothly from side to side without pausing in the middle.",
      "A short spell of mild dizziness can be expected - keeping the target clear matters more than speed."
    ],
    mistakes: [
      "Letting your eyes drift off the target as your head turns.",
      "Turning your head faster than you can keep the target clear.",
      "Doing more or longer sessions than your physio set to try to get better faster.",
      "Stop and message your physio if your dizziness lasts longer after a session than your physio told you to expect, or it is getting worse from day to day. Call 999 if sudden dizziness comes with new weakness, numbness, a drooping face, slurred speech, double vision or a severe headache."
    ],
    defaultDosage: {
      notes: "Your vestibular physiotherapist will set how long you do this for, how many times a day, how fast to turn your head and how much dizziness is acceptable for you. Only follow the plan they have written down for you. Your physio may adjust this for you."
    },
    helpsWith: ["Seeing clearly while you move your head", "Feeling steadier with everyday head movements", "Getting back to walking, reading signs and busy places with less dizziness"],
    draft: true
  },
  {
    id: "ex-187",
    slug: "pursed-lip-breathing",
    title: "Pursed-Lip Breathing",
    bodyPart: "General",
    clinicalArea: "general",
    tags: ["breathing", "respiratory", "breathlessness", "copd"],
    condition: "Breathlessness with COPD and other long-term lung conditions",
    stage: "Early rehab",
    description: "Breathing in gently through your nose and out slowly through softly pursed lips, a technique to help you manage breathlessness with a long-term lung condition.",
    aka: ["pursed lip breathing", "PLB", "pursed-lip breathing technique", "breathing exercise for COPD", "breathing technique for breathlessness", "lip breathing for shortness of breath"],
    equipment: ["A comfortable chair with a back"],
    pose: null, // no close pose in POSE_SPECS (seated breathing); name inference falls back to "standing"
    setup: "This technique is for people with a long-term lung condition such as COPD who have been shown it by their healthcare team. It does not replace your inhalers, other prescribed medicines or pulmonary rehabilitation. Sit comfortably in a supported chair with your feet on the floor, your hands resting on your thighs and your shoulders relaxed down.",
    steps: [
      "Let your shoulders drop and relax your neck and jaw.",
      "Breathe in gently through your nose, without forcing a big breath.",
      "Purse your lips loosely, as if you were about to whistle.",
      "Breathe out slowly and gently through your pursed lips, letting the breath out last longer than the breath in.",
      "Keep the breath out soft and easy - never push the air out, and do not hold your breath.",
      "Use it during and after activity, such as climbing stairs, and whenever you feel short of breath."
    ],
    cues: [
      "Your shoulders stay down and relaxed rather than lifting towards your ears.",
      "The breath out is long and gentle, like a slow sigh through a small opening.",
      "Your cheeks stay soft rather than puffing out."
    ],
    mistakes: [
      "Blowing out hard or squeezing out the last bit of air.",
      "Gasping a big, forced breath in through your mouth.",
      "Holding your breath between the breath in and the breath out.",
      "Stop and message your physio if this technique leaves you more breathless, dizzy or light-headed. Call 999 or follow your rescue plan if your breathlessness is severe or sudden, or comes with chest pain, blue lips or confusion."
    ],
    defaultDosage: {
      minutes: 5,
      perDay: 1,
      perWeek: 7,
      notes: "Practise for a few minutes when you are calm and resting, so the technique comes easily when you are breathless, then use it as needed during and after activity. It is not an emergency treatment and does not replace your inhalers or other prescribed medicines. Your physio may adjust this for you."
    },
    helpsWith: ["Slowing your breathing down when you feel breathless", "Getting through stairs and everyday activities with more control", "Feeling calmer and more in control of your breathing"],
    draft: true
  }
];
