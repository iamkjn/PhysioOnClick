// lib/exercise-anatomy/entries/lower-limb.ts
// Draft anatomy for knee, hip, ankle, hamstring and lower-limb exercises.
// Drafts show on dev only until Shivaliba approves them (status "approved").

import type { ExerciseAnatomy } from "@/lib/exercise-anatomy/types";

export const LOWER_LIMB: Record<string, ExerciseAnatomy> = {
  // Knee
  "straight-leg-raise": {
    main: ["quadriceps"],
    helpers: ["iliopsoas"],
    howItHelps:
      "Straight leg raises strengthen the front of your thigh without needing to bend a sore or recently operated knee. A strong thigh muscle helps you hold your knee straight and steady when you stand, walk and get in and out of bed.",
    tissue: "post-surgery",
    status: "draft",
  },
  "heel-slide": {
    main: ["hamstrings", "quadriceps"],
    helpers: ["iliopsoas"],
    howItHelps:
      "Heel slides gently work your knee into more bend, with the back of your thigh doing the bending as the front of your thigh eases into a stretch. Getting back more knee bend makes it easier to sit in a chair, climb stairs and get in and out of a car.",
    tissue: "post-surgery",
    view: "right",
    status: "draft",
  },
  "mini-squat": {
    main: ["quadriceps", "gluteus-maximus"],
    helpers: ["gluteus-medius", "hamstrings"],
    howItHelps:
      "Mini squats strengthen the front of your thigh and your buttock muscles through a small bend that is gentle on a sore knee. Stronger muscles around the knee help support the joint, making it easier to stand up from a chair, manage stairs and walk further.",
    tissue: "joint-ligament",
    status: "draft",
  },
  "stationary-bike": {
    main: ["quadriceps"],
    helpers: ["gluteus-maximus", "hamstrings", "gastrocnemius"],
    howItHelps:
      "Each turn of the pedals gently bends and straightens your knee while the front of your thigh does easy, low-impact work. This helps loosen a stiff knee and builds the stamina you need for walking and everyday activity.",
    tissue: "post-surgery",
    status: "draft",
  },
  "terminal-knee-extension-band": {
    main: ["vastus-medialis"],
    helpers: ["quadriceps"],
    howItHelps:
      "Straightening your knee against the band works your thigh muscle through the last part of the movement, which you often feel most just above your kneecap. Being able to straighten your knee fully and firmly helps it feel steadier when you stand, walk and use stairs.",
    tissue: "joint-ligament",
    status: "draft",
  },
  "step-up": {
    main: ["quadriceps", "gluteus-maximus"],
    helpers: ["gluteus-medius", "hamstrings"],
    howItHelps:
      "Step-ups strengthen the front of your thigh and your buttock on one leg, while the side of your hip works to keep your pelvis level and your knee in line. This builds the strength and control you need for stairs, kerbs and walking up slopes.",
    tissue: "joint-ligament",
    status: "draft",
  },
  "wall-squat-hold": {
    main: ["quadriceps", "patellar-tendon"],
    helpers: [],
    howItHelps:
      "Holding a shallow squat against the wall works the front of your thigh and loads the tendon below your kneecap without moving the knee. Steady holds like this are a gentle way to keep the tendon working during a flare-up, so you can stay active while the pain settles.",
    tissue: "muscle-tendon",
    status: "draft",
  },
  "split-squat": {
    main: ["quadriceps", "gluteus-maximus"],
    helpers: ["gluteus-medius", "adductors", "hamstrings"],
    howItHelps:
      "Split squats build strength in the front of your thigh and your buttock one leg at a time, while training your knee to stay in line over your foot. That strength and control help your knee cope with the landing, pivoting and quick changes of direction that sport asks of it.",
    tissue: "joint-ligament",
    status: "draft",
  },
  "box-step-down": {
    main: ["quadriceps", "gluteus-medius"],
    helpers: ["gluteus-maximus"],
    howItHelps:
      "Lowering yourself slowly off the step trains the front of your thigh to control your weight as the knee bends, while the side of your hip keeps your knee in line. Better control can make going downstairs and downhill easier on the joint behind your kneecap.",
    tissue: "joint-ligament",
    status: "draft",
  },
  "spanish-squat": {
    main: ["quadriceps", "patellar-tendon"],
    helpers: ["gluteus-maximus"],
    howItHelps:
      "Holding this squat works the front of your thighs and the tendon just below your kneecap hard, while the band keeps your shins upright. Steady holds like this let you keep loading the tendon during a flare-up, so you can stay active and keep training while it calms down.",
    tissue: "muscle-tendon",
    status: "draft",
  },
  "reverse-nordic": {
    main: ["quadriceps", "patellar-tendon"],
    helpers: ["iliopsoas", "rectus-abdominis"],
    howItHelps:
      "Leaning back slowly from your knees works the front of your thigh and the tendon below your kneecap while the muscle lengthens under control. This builds strength through a long range, which helps your knee cope with jumping, landing and slowing down in sport.",
    tissue: "muscle-tendon",
    status: "draft",
  },

  // Hip
  "hip-bridge": {
    main: ["gluteus-maximus"],
    helpers: ["hamstrings", "gluteus-medius"],
    howItHelps:
      "Bridges strengthen your main buttock muscles, with help from the backs of your thighs, as you lift and lower your hips with control. Strong buttock muscles help support your hips and lower back when you stand up from a chair, climb stairs and walk.",
    tissue: "muscle-tendon",
    status: "draft",
  },
  "clam-shell": {
    main: ["gluteus-medius"],
    helpers: ["gluteus-minimus", "deep-hip-rotators"],
    howItHelps:
      "Clams wake up and strengthen the muscles on the side of your hip without loading a sore knee or back. Stronger hip muscles keep your knee in line and your pelvis level when you walk, climb stairs or stand on one leg.",
    tissue: "muscle-tendon",
    status: "draft",
  },
  "side-lying-hip-abduction": {
    main: ["gluteus-medius"],
    helpers: ["gluteus-minimus", "tfl-it-band"],
    howItHelps:
      "Lifting your leg out to the side strengthens the muscles and tendons on the side of your hip that hold your pelvis level. Stronger outer-hip muscles help keep your pelvis steady when you walk, climb stairs or stand on one leg.",
    tissue: "muscle-tendon",
    status: "draft",
  },
  "standing-hip-flexor-stretch": {
    main: ["iliopsoas", "rectus-femoris"],
    helpers: ["gluteus-maximus"],
    howItHelps:
      "Tucking your tailbone under and shifting forwards stretches the muscles at the front of the hip and thigh of your back leg. Easing tightness here, which often builds up from long spells of sitting, can let you stand taller and stride out more freely.",
    tissue: "muscle-tendon",
    status: "draft",
  },
  "deep-squat-mobility": {
    main: ["gluteus-maximus", "adductors"],
    helpers: ["quadriceps", "soleus"],
    howItHelps:
      "Holding a supported deep squat gently bends your hips and knees as far as is comfortable, while your buttock and inner-thigh muscles ease into a stretch. Keeping this range helps with low tasks such as gardening, picking things up from the floor and getting up from a low seat.",
    tissue: "joint-ligament",
    status: "draft",
  },
  "lateral-band-walk": {
    main: ["gluteus-medius"],
    helpers: ["gluteus-minimus", "gluteus-maximus", "tfl-it-band", "quadriceps"],
    howItHelps:
      "Stepping sideways against the band works the muscles on the side of your hips, while the front of your thighs hold the low squat. These hip muscles help keep your knees in line over your feet, which can ease the strain on the front of your knee when you walk, run and use stairs.",
    tissue: "joint-ligament",
    status: "draft",
  },
  "hip-hitch": {
    main: ["gluteus-medius"],
    helpers: ["gluteus-minimus", "tfl-it-band", "quadratus-lumborum"],
    howItHelps:
      "Lifting your pelvis level from a dip trains the muscles on the side of your standing hip, the ones that stop your pelvis dropping each time you take a step. Building them up gives you a steadier pelvis when you walk and climb stairs.",
    tissue: "muscle-tendon",
    status: "draft",
  },
  "banded-hip-external-rotation": {
    main: ["deep-hip-rotators", "gluteus-medius"],
    helpers: ["gluteus-minimus", "gluteus-maximus"],
    howItHelps:
      "Pressing your knees apart against the band works the deep muscles at the back of your hip and the side of your buttock. These muscles help steady the ball of your hip in its socket and control your hip and pelvis as you walk, climb stairs and stand on one leg.",
    tissue: "muscle-tendon",
    status: "draft",
  },
  "copenhagen-adductor": {
    main: ["adductors"],
    helpers: ["gluteus-medius", "external-oblique", "quadratus-lumborum"],
    howItHelps:
      "Pressing your top leg into the bench to hold your body up works your inner-thigh muscles hard, along with the side of your hip and trunk. Stronger inner-thigh muscles help your groin cope with the kicking, sprinting and sharp changes of direction that sport demands.",
    tissue: "muscle-tendon",
    status: "draft",
  },
  "single-leg-glute-bridge": {
    main: ["gluteus-maximus"],
    helpers: ["hamstrings", "gluteus-medius"],
    howItHelps:
      "Bridging on one leg puts much more load through the buttock of your working leg, while the back of your thigh and the side of your hip help keep your pelvis level. This builds the single-leg strength that steadies your pelvis on stairs and when running, and supports your hip and knee.",
    tissue: "muscle-tendon",
    status: "draft",
  },
  "standing-banded-hip-abduction": {
    main: ["gluteus-medius"],
    helpers: ["gluteus-minimus", "tfl-it-band"],
    howItHelps:
      "Moving your leg out against the band works the muscles on the side of both hips: the moving leg lifts, and the standing leg holds your pelvis steady. This builds outer-hip strength upright, in the position you use for walking, hills, stairs and other single-leg tasks.",
    tissue: "muscle-tendon",
    status: "draft",
  },

  // Ankle
  "heel-raises": {
    main: ["gastrocnemius", "soleus"],
    helpers: ["fibularis", "tibialis-posterior"],
    howItHelps:
      "Rising onto your toes and lowering slowly strengthens your calf muscles, while the smaller muscles around your ankle work to keep it steady and in line. Stronger calf and ankle muscles help your ankle cope with walking, stairs and uneven ground after a sprain.",
    tissue: "joint-ligament",
    status: "draft",
  },
  "ankle-pump": {
    main: ["gastrocnemius", "soleus", "tibialis-anterior"],
    helpers: [],
    howItHelps:
      "Pointing and pulling up your foot works the muscles at the back and front of your lower leg, which squeeze like a pump to help move swelling away from your ankle. Moving the ankle gently also helps stop it stiffening while it settles.",
    tissue: "joint-ligament",
    view: "right",
    status: "draft",
  },
  "ankle-alphabet": {
    main: ["tibialis-anterior", "fibularis", "tibialis-posterior"],
    helpers: ["gastrocnemius", "soleus"],
    howItHelps:
      "Tracing letters with your toes moves your ankle up, down and side to side, gently working the muscles all around your lower leg. Getting back movement in every direction helps your ankle cope with walking, turning and uneven ground as the sprain settles.",
    tissue: "joint-ligament",
    status: "draft",
  },
  "resisted-ankle-eversion": {
    main: ["fibularis"],
    helpers: [],
    howItHelps:
      "Turning your foot outwards against the band strengthens the muscles down the outside of your lower leg, which act against your ankle rolling over. Stronger outer-ankle muscles help steady an ankle that tends to give way, whether on uneven ground, kerbs or the sports pitch.",
    tissue: "joint-ligament",
    status: "draft",
  },
  "single-leg-balance-on-foam": {
    main: ["fibularis", "tibialis-anterior", "tibialis-posterior"],
    helpers: ["soleus", "gluteus-medius"],
    howItHelps:
      "Balancing on a soft surface makes the muscles around your ankle react quickly with lots of small corrections. This retrains your ankle's sense of position, helping it feel steadier on uneven ground and when you return to sport.",
    tissue: "joint-ligament",
    status: "draft",
  },
  "calf-stretch-gastrocnemius": {
    main: ["gastrocnemius"],
    helpers: ["soleus"],
    howItHelps:
      "Leaning into the wall with your back knee straight gently stretches the big calf muscle. Easing calf tightness may reduce the pull on your Achilles tendon, which can make walking, stairs and your first steps in the morning more comfortable.",
    tissue: "muscle-tendon",
    status: "draft",
  },
  "eccentric-heel-drop": {
    main: ["achilles-tendon", "gastrocnemius", "soleus"],
    helpers: [],
    howItHelps:
      "Lowering your heel slowly on one leg loads your Achilles tendon and calf muscles in a steady, controlled way. Tendons tend to get stronger and less sensitive with gradual loading like this, helping you cope better with walking, stairs and running.",
    tissue: "muscle-tendon",
    status: "draft",
  },
  "heavy-slow-calf-raise": {
    main: ["gastrocnemius", "soleus", "achilles-tendon"],
    helpers: ["fibularis", "tibialis-posterior"],
    howItHelps:
      "Slow, heavy raises through your full range build strength in your calf muscles and Achilles tendon. Tendons adapt to load that is increased steadily, which helps them cope with walking, hills and stairs, and with running and jumping when you return to them.",
    tissue: "muscle-tendon",
    status: "draft",
  },
  "seated-calf-raise": {
    main: ["soleus", "achilles-tendon"],
    helpers: ["gastrocnemius"],
    howItHelps:
      "Raising your heels with your knees bent shifts the work onto the deeper calf muscle, which straight-knee raises work less, and loads the Achilles tendon it pulls on. A strong deep calf helps with longer walks and runs, where it takes much of the strain.",
    tissue: "muscle-tendon",
    status: "draft",
  },

  // Hamstring
  "nordic-hamstring-curl-assisted": {
    main: ["hamstrings"],
    helpers: ["gluteus-maximus", "erector-spinae"],
    howItHelps:
      "Lowering your body slowly works the back of your thighs hard while the muscles lengthen, much like the strain they take when you sprint. Building this strength helps a recovered hamstring cope with fast running and sport.",
    tissue: "muscle-tendon",
    status: "draft",
  },
  "standing-hamstring-stretch": {
    main: ["hamstrings"],
    helpers: ["gastrocnemius"],
    howItHelps:
      "Hinging forwards from your hips with your raised leg straight gently stretches the back of your thigh. Easing hamstring tightness can make bending, reaching your feet and taking longer strides feel more comfortable.",
    tissue: "muscle-tendon",
    status: "draft",
  },

  // Lower limb
  "sit-to-stand-control": {
    main: ["quadriceps", "gluteus-maximus"],
    helpers: ["hamstrings", "gluteus-medius"],
    howItHelps:
      "Standing up and sitting down slowly strengthens the front of your thighs and your buttocks in a movement you use every day. Practising it with control helps build the strength and confidence to get up from chairs, the toilet and the car more easily.",
    tissue: "post-surgery",
    status: "draft",
  },
};
