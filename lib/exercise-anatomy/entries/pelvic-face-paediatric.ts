// lib/exercise-anatomy/entries/pelvic-face-paediatric.ts
// Draft anatomy for pelvic health, facial rehab and paediatric play exercises.
// Face entries use text-only muscles, so their pages show no 3D button.
// Drafts show on dev only until Shivaliba approves them (status "approved").

import type { ExerciseAnatomy } from "@/lib/exercise-anatomy/types";

export const PELVIC_FACE_PAEDIATRIC: Record<string, ExerciseAnatomy> = {
  // Pelvic health
  "pelvic-floor-activation-basic": {
    main: ["pelvic-floor"],
    helpers: [],
    howItHelps:
      "Squeezing and lifting the muscles at the base of your pelvis, then fully letting go, teaches you to find and work your pelvic floor on its own. A clear lift and a full release are the starting point for building strength, which can help with bladder control and may mean fewer leaks when you cough, laugh or lift.",
    tissue: "pelvic-floor",
    status: "draft",
  },
  "pelvic-floor-endurance-hold": {
    main: ["pelvic-floor"],
    helpers: [],
    howItHelps:
      "Holding a steady pelvic floor lift for longer builds the stamina of these muscles, so they can keep supporting your bladder and bowel for longer. Better endurance may help reduce leaks as you stand, walk and go about your day, including later on when your muscles are more tired.",
    tissue: "pelvic-floor",
    status: "draft",
  },
  "fast-twitch-pelvic-floor-the-knack": {
    main: ["pelvic-floor"],
    helpers: [],
    howItHelps:
      "Quick, firm squeezes with a full release in between train your pelvic floor to switch on fast. Doing one squeeze just before you cough, sneeze, laugh or lift, known as the knack, helps your pelvic floor brace against the sudden pressure, which may help reduce leaks at those moments.",
    tissue: "pelvic-floor",
    status: "draft",
  },
  "deep-core-and-pelvic-floor-co-activation": {
    main: ["pelvic-floor", "transversus-abdominis"],
    helpers: [],
    howItHelps:
      "Lifting your pelvic floor while you gently draw in your lower tummy trains these muscles to work together, as they do naturally. Rebuilding this teamwork after pregnancy can help your tummy and pelvis feel more supported when you lift, carry or get up from the floor.",
    tissue: "pelvic-floor",
    status: "draft",
  },
  "diastasis-safe-curl-up": {
    main: ["rectus-abdominis"],
    helpers: ["pelvic-floor"],
    howItHelps:
      "Lifting your head and shoulders a small way, with the towel for support, gently works the long muscle down the front of your tummy while keeping the middle flat, with no doming. Building strength at a level your tummy can control can make sitting up, getting out of bed, lifting and carrying more comfortable while your tummy recovers.",
    status: "draft",
  },
  "pelvic-floor-relaxation-drop": {
    main: ["pelvic-floor"],
    helpers: ["diaphragm"],
    howItHelps:
      "Slow breathing while you let the muscles at the base of your pelvis soften and lengthen helps them let go, rather than staying tight. If your pelvic floor holds on to too much tension, learning to relax it may help ease pelvic pain and make emptying your bladder and bowel more comfortable.",
    status: "draft",
  },
  "diaphragmatic-breathing-for-pelvic-floor": {
    main: ["diaphragm", "pelvic-floor"],
    helpers: [],
    howItHelps:
      "Slow belly breathing lets your main breathing muscle and your pelvic floor move together, both gently dropping as you breathe in and rising back to rest as you breathe out. Getting this easy rhythm back can help a tense pelvic floor relax, and gives you a good base for your other pelvic floor exercises.",
    status: "draft",
  },
  "bridge-with-pelvic-floor-engagement": {
    main: ["gluteus-maximus", "pelvic-floor"],
    helpers: ["hamstrings", "gluteus-medius"],
    howItHelps:
      "Lifting your pelvic floor just before you raise your hips, and keeping it lifted, links pelvic floor control with a bridge that strengthens your buttock muscles. Practising the two together can help your pelvic floor keep supporting you during everyday effort, such as lifting, climbing stairs or getting up from the floor.",
    tissue: "pelvic-floor",
    status: "draft",
  },
  "squat-with-pelvic-floor-control": {
    main: ["pelvic-floor", "quadriceps", "gluteus-maximus"],
    helpers: ["gluteus-medius", "hamstrings"],
    howItHelps:
      "Breathing out and lifting your pelvic floor as you push up to stand teaches it to switch on at the hardest part of the movement, while your thigh and buttock muscles do the lifting. This habit can help your pelvic floor support you when you squat to pick something up, lift or get up from a low seat.",
    tissue: "pelvic-floor",
    view: "right",
    status: "draft",
  },
  "standing-pelvic-tilt-pregnancy": {
    main: ["lumbar-spine", "rectus-abdominis"],
    helpers: [],
    howItHelps:
      "Gently tightening your lower tummy rolls your pelvis so your lower back flattens towards the wall, then releases, in a small, easy rocking movement. Moving your pelvis and lower back gently like this can ease stiffness and discomfort around your pelvis during pregnancy, which may make standing and walking more comfortable.",
    view: "right",
    status: "draft",
  },
  "side-lying-hip-abduction-pregnancy-safe": {
    main: ["gluteus-medius"],
    helpers: ["gluteus-minimus", "deep-hip-rotators"],
    howItHelps:
      "Lifting your top knee a small way, with your feet together and pillows for support, strengthens the muscles on the side of your hip while your pelvis stays still. Stronger hip muscles can help steady your pelvis, which may make walking, climbing stairs and turning over in bed more comfortable during pregnancy.",
    status: "draft",
  },
  "return-to-running-pelvic-floor-check": {
    main: ["pelvic-floor"],
    helpers: ["quadriceps", "gluteus-maximus", "gastrocnemius"],
    howItHelps:
      "Jogging, hopping and single-leg moves put quick, repeated pressure on your pelvic floor, so this check shows how well it copes with impact before you run. Getting through it with no leaks, heaviness or pain suggests you are ready to build up running gradually, while any symptoms mean your pelvic floor needs more time and a check with your physio.",
    tissue: "pelvic-floor",
    status: "draft",
  },
  "bowel-emptying-positioning": {
    main: ["pelvic-floor"],
    helpers: [],
    howItHelps:
      "Raising your knees above your hips and leaning forward helps the pelvic floor muscle that loops around your back passage relax, straightening the way out. With a relaxed tummy and gentle breathing instead of straining, this can make opening your bowels easier and put less strain on your pelvic floor.",
    status: "draft",
  },
  "reverse-kegel-pelvic-floor-lengthening": {
    main: ["pelvic-floor"],
    helpers: ["diaphragm"],
    howItHelps:
      "Letting your pelvic floor gently lengthen and bulge slightly downward as you breathe out is the opposite of a squeeze, and helps muscles that hold too much tension learn to let go. A pelvic floor that can relax fully may help ease pelvic pain and make sex and emptying your bladder and bowel more comfortable.",
    status: "draft",
  },

  // Face (text only: no facial muscles in the 3D model)
  "smile-mouth-raise": {
    main: ["zygomaticus"],
    helpers: [],
    howItHelps:
      "Gently lifting both corners of your mouth works the cheek muscles that raise them, while matching the stronger side to the weaker one keeps the movement even. Small, controlled practice like this can help your brain relearn a balanced smile, which may make your face feel more natural when you talk, eat and smile.",
    tissue: "nerve-brain",
    status: "draft",
  },
  "eyebrow-raise": {
    main: ["frontalis"],
    helpers: [],
    howItHelps:
      "Raising both eyebrows works your forehead muscle, with the stronger side held back so the weaker side can keep up. Slow, even practice can help your brain relearn balanced movement across your forehead, so expressions such as surprise look and feel more even.",
    tissue: "nerve-brain",
    status: "draft",
  },
  "gentle-eye-close": {
    main: ["orbicularis-oculi"],
    helpers: [],
    howItHelps:
      "Softly closing both eyes works the ring of muscle around each eye, which protects your eye when you blink and sleep. Gentle, even practice without squeezing can help your eyelids close more fully and comfortably, while keeping your mouth still may help stop unwanted movements spreading across your face.",
    tissue: "nerve-brain",
    status: "draft",
  },
  "cheek-puff": {
    main: ["orbicularis-oris", "buccinator"],
    helpers: [],
    howItHelps:
      "Puffing out your cheeks with your lips sealed works the ring of muscle around your lips and the cheek muscles that hold air in. Better lip seal and cheek control can make it easier to drink without spilling, stop food collecting in your cheek and speak clearly.",
    tissue: "nerve-brain",
    status: "draft",
  },
  "brow-furrow": {
    main: ["corrugator"],
    helpers: [],
    howItHelps:
      "Drawing your eyebrows down and together works the small frowning muscles between them. Keeping the crease centred, with your jaw and eyes relaxed, can help your brain relearn even control of your upper face, so expressions like concentrating look more balanced.",
    tissue: "nerve-brain",
    status: "draft",
  },
  "big-smile": {
    main: ["zygomaticus", "risorius"],
    helpers: [],
    howItHelps:
      "Widening your smile up and out works the cheek muscles that lift the corners of your mouth and the muscles that pull them sideways. Holding the stronger side back so both sides move together can help you build a fuller, more even smile, which many people find helps them feel more confident when they laugh and talk.",
    tissue: "nerve-brain",
    status: "draft",
  },
  "open-eyes-wide": {
    main: ["levator-palpebrae"],
    helpers: [],
    howItHelps:
      "Opening your eyes wide while your eyebrows stay still works the muscle that lifts each upper eyelid, while the ring of muscle around your eye stays relaxed. Practising an even, relaxed opening on both sides can help your eyes look more balanced, which may help your face feel more natural when you talk with people.",
    tissue: "nerve-brain",
    status: "draft",
  },
  "lip-pucker": {
    main: ["orbicularis-oris"],
    helpers: [],
    howItHelps:
      "Drawing your lips forward into a pucker works the ring of muscle around your lips. Keeping the pucker centred, rather than pulled towards the stronger side, can help your lips move more evenly, which may make drinking through a straw, whistling and forming sounds clearly easier.",
    tissue: "nerve-brain",
    status: "draft",
  },

  // Paediatric (play-based motor skills)
  "animal-walk-circuit": {
    main: ["deltoid", "rectus-abdominis", "gluteus-maximus"],
    helpers: ["triceps", "quadriceps", "hamstrings"],
    howItHelps:
      "Bear and crab walks have your child take their weight through their hands and feet, working their shoulders, tummy and buttocks while their arms and legs learn to move in turn. Building whole-body strength and coordination through play can help your child with climbing, running and keeping up in the playground.",
    status: "draft",
  },
  "balance-beam-walk-tape-line": {
    main: ["fibularis", "tibialis-anterior", "gluteus-medius"],
    helpers: ["tibialis-posterior", "soleus"],
    howItHelps:
      "Walking along a narrow line makes the muscles around your child's ankles and the sides of their hips make lots of small corrections to keep them steady. Practising this as a game can help your child's balance and body awareness, so they feel steadier on kerbs, uneven ground and playground equipment.",
    status: "draft",
  },
  "ball-catch-and-throw": {
    main: ["front-deltoid", "pectoralis-major", "triceps"],
    helpers: ["biceps-brachii", "finger-flexors"],
    howItHelps:
      "Rolling, catching and throwing a soft ball works your child's shoulder, chest and arm muscles while their eyes guide their hands. Practising at a distance where they mostly succeed can help your child build hand-eye coordination and confidence for ball games and other activities that need both hands working together.",
    status: "draft",
  },
  "obstacle-course-crawl-through": {
    main: ["deltoid", "gluteus-maximus", "quadriceps"],
    helpers: ["triceps", "iliopsoas"],
    howItHelps:
      "Crawling under, climbing over and squeezing through the stations works your child's shoulders, hips and thighs while they plan each move. Putting several skills together in one course can help your child practise the moving, climbing and problem-solving they need for parks, playgrounds and play with friends.",
    status: "draft",
  },
  "toe-walking-heel-walking-game": {
    main: ["tibialis-anterior", "gastrocnemius"],
    helpers: ["soleus"],
    howItHelps:
      "Penguin walking on the heels works the muscle at the front of your child's shin that lifts the toes, while gently stretching the calf at the back. Switching between heel, tiptoe and heel-first steps in a game can help your child notice and practise landing on the heel first, and keep their ankles moving through their full range.",
    view: "right",
    status: "draft",
  },
  "trampette-bouncing-supervised": {
    main: ["quadriceps", "gluteus-maximus", "gastrocnemius"],
    helpers: ["soleus"],
    howItHelps:
      "Gentle, rhythmic bouncing works the muscles at the front of your child's thighs, their buttocks and their calves as they press down and spring up. The springy surface also challenges their balance in a fun way, which can help your child build leg strength, steadiness and stamina for walking, running and play.",
    view: "right",
    status: "draft",
  },
  "prone-extension-play-superman": {
    main: ["erector-spinae", "gluteus-maximus"],
    helpers: ["hamstrings", "lower-trapezius", "neck-extensors"],
    howItHelps:
      "Lifting the head, arms and legs off the floor like a flying superhero works the long muscles beside your child's spine and their buttock muscles. Building strength in the back of the body can help your child sit up tall, hold their head up during play and table activities, and keep going for longer before they tire.",
    status: "draft",
  },
  "scooter-board-propulsion": {
    main: ["latissimus-dorsi", "erector-spinae"],
    helpers: ["rear-deltoid", "triceps", "neck-extensors"],
    howItHelps:
      "Pulling along the floor with both arms works the broad muscles of your child's back and shoulders, while the muscles beside the spine keep their head and chest lifted. Building upper-body and trunk strength in a game can help your child with climbing, pushing up from the floor and sitting steadily at a table.",
    status: "draft",
  },
  "single-leg-hop-game": {
    main: ["quadriceps", "gastrocnemius", "gluteus-maximus"],
    helpers: ["soleus", "gluteus-medius"],
    howItHelps:
      "Hopping from spot to spot works the thigh, calf and buttock muscles of your child's leg as they push off and land softly. Starting on the stronger leg and building up on the injured one can help your child rebuild power, balance and trust in their leg, ready for running, jumping and playground games.",
    tissue: "joint-ligament",
    view: "right",
    status: "draft",
  },
  "sensory-motor-circuit-multi-station": {
    main: ["quadriceps", "gluteus-maximus"],
    helpers: ["deltoid", "erector-spinae"],
    howItHelps:
      "The muscles your child uses depend on the stations their physio has chosen, but most circuits get the big muscles of the legs, hips and shoulders working through jumping, crawling, pushing or carrying. This mix of movement and calming input can help your child feel more settled and ready to focus, play and join in.",
    view: "right",
    status: "draft",
  },
};
