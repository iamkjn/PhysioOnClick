// lib/exercise-anatomy/entries/balance-neuro.ts
// Draft anatomy for balance and neurological exercises.
// Falls-prevention and general balance take no tissue track. Dual-task
// cognitive-motor training uses the text-only brain group, so its page shows
// no 3D button.
// Drafts show on dev only until Shivaliba approves them (status "approved").

import type { ExerciseAnatomy } from "@/lib/exercise-anatomy/types";

export const BALANCE_NEURO: Record<string, ExerciseAnatomy> = {
  // Balance
  "tandem-balance-hold": {
    main: ["fibularis", "tibialis-anterior", "gluteus-medius"],
    helpers: ["tibialis-posterior", "soleus"],
    howItHelps:
      "Standing with one foot directly in front of the other narrows your base, so the muscles around your ankles and the sides of your hips make lots of small corrections to keep you steady. Practising with a firm surface within reach can help you feel steadier on your feet, which may help lower your risk of a fall.",
    status: "draft",
  },
  "single-leg-balance": {
    main: ["gluteus-medius", "fibularis", "tibialis-anterior"],
    helpers: ["gluteus-minimus", "tibialis-posterior", "soleus"],
    howItHelps:
      "Standing on one leg makes the muscles on the side of your standing hip work to keep your pelvis level, while the muscles around your ankle make small corrections. Building this control with a support nearby can help you feel steadier in the single-leg moments of everyday life, such as walking, climbing stairs and stepping up a kerb.",
    status: "draft",
  },
  "static-standing-balance-eyes-open": {
    main: ["soleus", "tibialis-anterior"],
    helpers: ["gastrocnemius"],
    howItHelps:
      "Standing still with your feet together narrows your base, so the muscles of your calves and shins make small, steady adjustments at your ankles to keep you upright. Practising near a firm surface can help build your standing balance and confidence for everyday moments, such as standing at the sink, at a worktop or in a queue.",
    view: "right",
    status: "draft",
  },
  "static-standing-balance-eyes-closed": {
    main: ["soleus", "tibialis-anterior"],
    helpers: ["gastrocnemius", "foot-intrinsics"],
    howItHelps:
      "With your eyes closed, your body relies more on what your feet feel and on the balance sense in your inner ear, so your calf, shin and foot muscles work harder at your ankles. Practising with a hand on your support can help you feel steadier when it is harder to see, such as in dim light.",
    view: "right",
    status: "draft",
  },
  "weight-shifting": {
    main: ["gluteus-medius", "soleus", "tibialis-anterior"],
    helpers: ["gastrocnemius", "quadriceps"],
    howItHelps:
      "Slowly moving your weight from side to side, then forwards and back, works the muscles at the sides of your hips and around your ankles that control how far you can lean and still come back to the middle. Getting used to taking weight evenly through each leg can help you feel more confident standing, stepping and reaching.",
    tissue: "nerve-brain",
    status: "draft",
  },
  "sideways-walking": {
    main: ["gluteus-medius"],
    helpers: ["gluteus-minimus", "tfl-it-band", "adductors"],
    howItHelps:
      "Stepping sideways works the muscles on the side of your hips, which steady your pelvis each time your weight moves from one leg to the other. Stronger, better-controlled hip muscles can help you feel steadier when you step aside on a busy pavement, move around the kitchen or walk on uneven ground.",
    status: "draft",
  },
  "heel-to-toe-walking-tandem-gait": {
    main: ["fibularis", "tibialis-anterior", "gluteus-medius"],
    helpers: ["tibialis-posterior", "soleus"],
    howItHelps:
      "Walking heel to toe along a line narrows your base, so the muscles around your ankles and the sides of your hips make lots of small corrections with every step. Practising beside a wall or worktop can sharpen your balance on the move, which may help you feel steadier in narrow spaces such as hallways and doorways.",
    status: "draft",
  },
  "marching-on-the-spot": {
    main: ["iliopsoas", "gluteus-medius"],
    helpers: ["rectus-femoris"],
    howItHelps:
      "Lifting each knee in turn works the deep hip flexor at the front of your hip, while the side of your standing hip keeps your pelvis level. This can help you lift your feet clear of the ground as you walk and feel more confident on one leg, such as on stairs or stepping up a kerb.",
    status: "draft",
  },
  "backward-walking": {
    main: ["hamstrings", "gluteus-maximus", "quadriceps"],
    helpers: ["gastrocnemius", "soleus"],
    howItHelps:
      "Reaching each foot behind you works the muscles at the back of your hips and thighs, while your thigh and calf muscles control the landing as you lower your heel. Because you cannot see behind you, practising can sharpen your feel for where your feet are, which may help you step back from a door or cupboard more steadily.",
    view: "right",
    status: "draft",
  },
  "sit-to-stand-repetitions": {
    main: ["quadriceps", "gluteus-maximus"],
    helpers: ["hamstrings", "gluteus-medius"],
    howItHelps:
      "Standing up from a chair and lowering slowly back down, with your arms folded, works the front of your thighs and your buttocks hard. Stronger legs can make getting up from chairs, the toilet and the car easier, and building this strength may help lower your risk of a fall.",
    status: "draft",
  },
  "obstacle-stepping": {
    main: ["iliopsoas", "tibialis-anterior"],
    helpers: ["hamstrings"],
    howItHelps:
      "Stepping over low objects works the deep hip flexor that lifts your knee and the muscle at the front of your shin that lifts your toes, so your foot clears the ground. Practising this can help you lift your feet more reliably, which may help lower your risk of tripping on kerbs, rugs and doorsteps.",
    status: "draft",
  },
  "stair-negotiation-practice": {
    main: ["quadriceps", "gluteus-maximus"],
    helpers: [],
    howItHelps:
      "Going up and down one step at a time works the front of your thighs and your buttocks, with your stronger leg leading up and your weaker or operated leg leading down. Practising with the handrail, within any limits from your surgeon or physio, can help you build the strength and confidence to manage the stairs at home.",
    tissue: "post-surgery",
    status: "draft",
  },
  "single-leg-stance-with-arm-reach": {
    main: ["gluteus-medius", "gluteus-maximus", "quadriceps"],
    helpers: ["tibialis-posterior", "external-oblique"],
    howItHelps:
      "Reaching in different directions on one leg makes the muscles of your standing hip and thigh work to keep your pelvis level and your knee in line over your foot. This can build the control you need as your body moves over a planted foot when you land, change direction or reach for a ball in sport.",
    status: "draft",
  },
  "treadmill-or-level-ground-gait-practice": {
    main: ["gluteus-medius", "quadriceps", "gastrocnemius"],
    helpers: ["gluteus-maximus", "soleus", "tibialis-anterior"],
    howItHelps:
      "Walking at a comfortable pace works the muscles of your hips, thighs and calves while gently raising your heart rate. Adding a little time only when your current walk feels easy can help you walk further with more confidence, whether that is to the shops, the bus stop or round the park.",
    status: "draft",
  },
  "standing-on-one-leg-hand-support": {
    main: ["gluteus-medius"],
    helpers: ["gluteus-minimus", "fibularis", "tibialis-anterior"],
    howItHelps:
      "Lifting one foot just clear of the floor, with a hand resting on the worktop, works the muscles on the side of your standing hip that keep your pelvis level. This is a gentle starting point for the single-leg moments of everyday life, such as walking, climbing stairs and stepping up a kerb.",
    status: "draft",
  },
  "turning-practice": {
    main: ["gluteus-medius", "deep-hip-rotators"],
    helpers: [],
    howItHelps:
      "Turning in a curve with several small steps keeps your weight moving from foot to foot, working the muscles at the side and back of your hips that steady and turn your pelvis. Practising slow, controlled turns, with your eyes leading, can help you feel steadier when you change direction, such as turning round in the kitchen, bathroom or hallway.",
    status: "draft",
  },
  "dual-task-walking": {
    main: ["gluteus-medius", "quadriceps", "gastrocnemius"],
    helpers: [],
    howItHelps:
      "Walking works the muscles of your hips, thighs and calves, and adding a simple thinking task trains your brain to keep your walking steady while your attention is elsewhere. On a familiar route, this can help you feel more confident when you walk and think at once, such as chatting with a friend or finding your way round a shop.",
    status: "draft",
  },
  "uneven-surface-walking": {
    main: ["fibularis", "tibialis-anterior", "tibialis-posterior"],
    helpers: ["soleus", "iliopsoas"],
    howItHelps:
      "Walking on grass or a gently uneven path makes the muscles around your ankles adjust to the bumps with every step, while slightly higher steps work the front of your hips. Practising on dry, firm ground with a helper beside you can help you feel steadier and more confident on paths, in the park or in the garden.",
    status: "draft",
  },

  // Neuro
  "bed-mobility-rolling": {
    main: ["external-oblique", "pectoralis-major"],
    helpers: ["front-deltoid", "sternocleidomastoid"],
    howItHelps:
      "Turning your head, reaching your arm across and letting your knees drop works the muscles at the side of your tummy and across your chest to roll you over as one unit. Practising this can help you move more independently in bed, so you can get comfortable, change position and get ready to sit up.",
    tissue: "nerve-brain",
    status: "draft",
  },
  "bridging-for-transfers": {
    main: ["gluteus-maximus"],
    helpers: ["hamstrings", "gluteus-medius"],
    howItHelps:
      "Pressing through both feet to lift your hips works your buttocks and the backs of your thighs, while keeping your hips level asks your weaker side to do its share. Being able to lift your hips can make it easier to move up the bed, pull up trousers while lying down and get ready to move across for a transfer.",
    tissue: "nerve-brain",
    status: "draft",
  },
  "sit-to-stand-with-support": {
    main: ["quadriceps", "gluteus-maximus"],
    helpers: ["triceps"],
    howItHelps:
      "Leaning forwards and pushing through your feet and the armrests works the front of your thighs and your buttocks, with the backs of your arms helping, and lowering slowly works them again. Practising with your weight even through both feet can help you stand up and sit down more steadily from your chair, the toilet or the bed.",
    tissue: "nerve-brain",
    status: "draft",
  },
  "weight-bearing-through-affected-leg": {
    main: ["gluteus-medius", "quadriceps"],
    helpers: [],
    howItHelps:
      "Shifting your weight onto your affected leg, with the knee soft rather than locked, works the side of your hip and the front of your thigh to hold you steady over that foot. Feeling the leg take your weight can help rebuild strength and confidence in it, a step towards standing, stepping and walking more evenly.",
    tissue: "nerve-brain",
    status: "draft",
  },
  "reaching-tasks-affected-arm": {
    main: ["front-deltoid", "triceps"],
    helpers: ["serratus-anterior", "wrist-extensors"],
    howItHelps:
      "Sliding your affected hand out to an object and back works the front of your shoulder and the back of your upper arm, while your trunk stays still. Using the affected arm as much as you can, and resting when it tires, can help your brain relearn reaching for everyday tasks such as picking up a cup or the remote.",
    tissue: "nerve-brain",
    status: "draft",
  },
  "parkinsons-big-movements-lsvt-style": {
    main: ["deltoid", "quadriceps", "gluteus-maximus"],
    helpers: ["iliopsoas", "erector-spinae"],
    howItHelps:
      "Huge arm reaches and long steps work the muscles of your shoulders, hips and thighs through their fullest range, while standing tall works the muscles along your spine. With Parkinson's, movements can become smaller without you noticing. Practising movements that feel bigger than they need to be can help your everyday steps and reaches become larger and more confident.",
    tissue: "nerve-brain",
    status: "draft",
  },
  "rhythmic-stepping-to-a-beat": {
    main: ["iliopsoas", "tibialis-anterior"],
    helpers: ["rectus-femoris"],
    howItHelps:
      "Stepping in time to a beat works the deep hip flexors that lift your knees and the shin muscles that lift your toes, so each foot clears the floor and lands heel first. For many people with Parkinson's, a steady rhythm helps keep steps even, and restarting the beat can help you get going again if your feet freeze.",
    tissue: "nerve-brain",
    status: "draft",
  },
  "multiple-sclerosis-fatigue-paced-circuit": {
    main: ["quadriceps", "gluteus-maximus", "gastrocnemius"],
    helpers: ["iliopsoas", "soleus", "gluteus-medius"],
    howItHelps:
      "Slow sit-to-stands, seated marches, heel raises and side steps gently work your thighs, buttocks, hips and calves, with a rest after each part. Resting before you feel tired, and stopping early if your legs feel heavy, can help you stay active and build some strength while you manage MS fatigue.",
    status: "draft",
  },
  "coordination-drills-finger-to-nose": {
    main: ["biceps-brachii", "triceps"],
    helpers: ["front-deltoid"],
    howItHelps:
      "Bending your elbow to bring your finger to your nose, then straightening it to reach the target, works the muscles at the front and back of your upper arm in turn. Slow, smooth practice, with your eyes guiding your finger, can help your brain fine-tune these movements, which may make everyday tasks such as eating and drinking feel more controlled.",
    tissue: "nerve-brain",
    status: "draft",
  },
  "heel-shin-slide-coordination": {
    main: ["hamstrings", "quadriceps"],
    helpers: ["iliopsoas", "adductors"],
    howItHelps:
      "Sliding your heel slowly down and back up your other shin works the muscles at the back and front of your thigh in turn, while your hip holds the leg steady. Keeping your heel on a straight track gives your brain practice at guiding your leg, which may help you place your feet more accurately as you walk.",
    tissue: "nerve-brain",
    view: "right",
    status: "draft",
  },
  "standing-balance-with-visual-feedback": {
    main: ["gluteus-medius", "erector-spinae"],
    helpers: ["quadriceps"],
    howItHelps:
      "Using the mirror to line up your shoulders and hips and spread your weight evenly works the muscles at the sides of your hips and along your spine to hold you upright. Seeing what straight looks like can help your brain relearn where the middle is, so you may feel steadier standing without leaning on your stronger leg.",
    tissue: "nerve-brain",
    view: "back",
    status: "draft",
  },
  "functional-grasp-and-release": {
    main: ["finger-extensors", "finger-flexors"],
    helpers: ["wrist-extensors", "hand-intrinsics"],
    howItHelps:
      "Opening your hand wide, closing it round an object and then letting go works the forearm muscles that straighten and bend your fingers, along with the small muscles in your hand. Practising with everyday objects can help your affected hand get better at holding and releasing things, such as a cup, a pen or your keys.",
    tissue: "nerve-brain",
    status: "draft",
  },
  "gait-re-education-with-cueing": {
    main: ["tibialis-anterior", "iliopsoas"],
    helpers: [],
    howItHelps:
      "Aiming for each floor marker and thinking 'heel first, lift my toes' works the deep hip flexor that swings your leg through and the shin muscle that lifts your toes clear of the floor. Practising with cues can help your brain relearn a longer, more even step, so your feet may scuff and catch the floor less often.",
    tissue: "nerve-brain",
    view: "right",
    status: "draft",
  },
  "trunk-rotation-in-sitting": {
    main: ["external-oblique", "thoracic-spine"],
    helpers: ["erector-spinae"],
    howItHelps:
      "Turning your upper body to each side while your hips stay still works the muscles at the sides of your tummy and moves your mid-back, while the muscles along your spine keep you sitting tall. Better trunk control can help you sit more steadily and reach to the side, which may make dressing and washing easier.",
    tissue: "nerve-brain",
    status: "draft",
  },
  "standing-frame-or-supported-standing": {
    main: ["leg-bones"],
    helpers: [],
    howItHelps:
      "Standing in the frame puts your body weight through the long bones of your legs, which may help keep them stronger. Building up your standing time only as your team advises can help your body get used to being upright, and gives you a change of position from sitting.",
    status: "draft",
  },
  "dual-task-cognitive-motor-training": {
    main: ["brain"],
    helpers: [],
    howItHelps:
      "Keeping a simple movement going while you do a thinking task trains your brain to share its attention between the two, as everyday life often asks it to. Building this up gradually, with a helper watching your balance, can help you move more steadily while you talk or think, such as chatting while you make a cup of tea.",
    tissue: "nerve-brain",
    status: "draft",
  },
};
