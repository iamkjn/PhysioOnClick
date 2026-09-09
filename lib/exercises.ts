import type { ClinicalArea } from "@/lib/assessment-forms";

export type ExerciseDosage = {
  sets?: number;
  reps?: number;
  holdSeconds?: number;
  /** For walking / cycling / supported-standing programmes measured in time,
   * not repetitions. Renders as "N minutes". */
  minutes?: number;
  perDay?: number;
  perWeek?: number;
  tempo?: string;
  notes?: string;
};

export type Exercise = {
  id: string;
  /** Stable kebab-case identifier, unique across the catalogue, derived from
   * `title`. Used in public URLs — do not change once published. */
  slug: string;
  title: string;
  bodyPart: string;
  clinicalArea: ClinicalArea;
  tags: string[];
  condition: string;
  stage: string;
  description: string;
  videoUrl?: string;
  equipment?: string[];
  setup?: string;
  steps?: string[];
  cues?: string[];
  mistakes?: string[];
  defaultDosage?: ExerciseDosage;
  pose?: string; // one of the SPECS keys in components/exercise-figure.tsx; validated by Task 7's test
  retired?: boolean;
  /** Common alternative names patients or clinicians might search for. */
  aka?: string[];
  /** Plain-language conditions/goals this exercise commonly helps with. */
  helpsWith?: string[];
};

export const exercises: Exercise[] = [
  {
    id: "ex-1",
    slug: "sit-to-stand-control",
    title: "Sit to Stand Control",
    bodyPart: "Lower limb",
    clinicalArea: "lower_limb",
    tags: ["knee-replacement", "functional", "early-rehab"],
    condition: "Post knee replacement",
    stage: "Early rehab",
    description: "Builds confidence and functional strength for everyday transfers.",
    videoUrl: "https://www.youtube.com/embed/1iQvKfV5fCE",
    equipment: ["A firm, higher chair with armrests"],
    pose: "squat",
    setup: "Sit towards the front of a firm, higher chair with armrests, feet hip-width apart. A folded cushion on the seat makes standing easier at first.",
    steps: [
      "Shuffle your bottom towards the front edge of the chair.",
      "Draw the operated leg slightly back so the foot is under the front of the chair.",
      "Lean your chest forwards over your knees, thinking 'nose over toes'.",
      "Push down through both feet and, using your hands on the armrests only as much as you need, stand up tall.",
      "To sit down, reach your bottom back, bend at the hips and knees, and lower yourself slowly with control."
    ],
    cues: [
      "Your weight stays even through both feet, not just the non-operated side.",
      "You lower down slowly rather than dropping into the chair.",
      "Your knees point forwards over your toes, not rolling inwards."
    ],
    mistakes: [
      "Pushing up mainly with your arms instead of your legs - use them less as you get stronger.",
      "Flopping backwards into the chair on the way down.",
      "Letting the operated knee drift inwards as you rise.",
      "Stop and message your physio if the knee gives way, locks, or becomes much more swollen and painful than usual."
    ],
    defaultDosage: {
      sets: 3,
      reps: 10,
      perDay: 1,
      perWeek: 5,
      notes: "Use a higher seat or a firm cushion at first, and lower the seat height as you get stronger."
    }
  },
  {
    id: "ex-2",
    slug: "scapular-setting",
    title: "Scapular Setting",
    bodyPart: "Shoulder",
    clinicalArea: "upper_limb",
    tags: ["shoulder", "activation", "early-rehab"],
    condition: "Shoulder pain",
    stage: "Early rehab",
    description: "Promotes shoulder control and reduces overload through gentle activation.",
    videoUrl: "https://www.youtube.com/embed/uKYLJ3f6QBA",
    pose: "scapularSet",
    setup: "Sit or stand tall with your arms relaxed by your sides and your shoulders dropped away from your ears.",
    steps: [
      "Gently draw your shoulder blades down and slightly together, as if sliding them into your back pockets.",
      "Hold the position lightly - this is a soft setting, not a hard squeeze.",
      "Relax back to the start."
    ],
    cues: [
      "The effort is small - around 10 percent. If you are straining, ease off.",
      "Your shoulders move down and back, not up towards your ears.",
      "Keep breathing normally throughout the hold."
    ],
    mistakes: [
      "Over-squeezing hard enough to create tension in the neck.",
      "Shrugging the shoulders up instead of setting them down and back.",
      "Arching the lower back to make the movement look bigger.",
      "Stop and message your physio if this brings on pain down the arm, or new pins and needles or weakness in the hand."
    ],
    defaultDosage: { sets: 3, reps: 10, perDay: 2, notes: "Hold each gentle set for about 5 seconds." }
  },
  {
    id: "ex-3",
    slug: "bridge-progression",
    title: "Bridge Progression",
    bodyPart: "Lumbar spine",
    clinicalArea: "spine",
    tags: ["low-back", "hip-strength", "strength-phase"],
    condition: "Back pain",
    stage: "Strength phase",
    description: "Targets hip and trunk strength to improve movement tolerance.",
    videoUrl: "https://www.youtube.com/embed/wPM8icPu6H8",
    equipment: ["Exercise mat"],
    setup: "Lie on your back on a mat with your knees bent and your feet flat on the floor, hip-width apart. Rest your arms by your sides.",
    steps: [
      "Gently tighten your lower tummy and squeeze your buttocks.",
      "Lift your hips off the floor until your body makes a straight line from your shoulders to your knees.",
      "Hold for a moment, keeping your tummy gently engaged.",
      "Lower your hips back down slowly, one part of your spine at a time."
    ],
    cues: [
      "Your hips stay level with each other, not dropping to one side.",
      "The effort is felt in your buttocks and the backs of your thighs.",
      "Your lower back stays long and comfortable, not pinched."
    ],
    mistakes: [
      "Lifting so high that your lower back arches and feels squeezed.",
      "Pushing through your toes instead of through your whole foot.",
      "Holding your breath — keep breathing steadily throughout.",
      "Stop and message your physio if the pain spreads into your buttock or down your leg, or you notice new numbness, pins and needles, or weakness."
    ],
    defaultDosage: { sets: 2, reps: 10, perDay: 1, perWeek: 5 }
  },
  {
    id: "ex-4",
    slug: "tandem-balance-hold",
    title: "Tandem Balance Hold",
    bodyPart: "Balance",
    clinicalArea: "balance_walking",
    tags: ["falls-prevention", "static-balance"],
    condition: "Falls prevention",
    stage: "Mobility phase",
    description: "Challenges balance safely and can be progressed with hand support as needed.",
    videoUrl: "https://www.youtube.com/embed/qri3WcM6L4o",
    equipment: ["A kitchen worktop, sturdy chair or wall for support"],
    setup: "Stand next to a kitchen worktop or a sturdy chair so you can rest a hand on it whenever you need to. Place one foot directly in front of the other so the heel of the front foot touches, or nearly touches, the toes of the back foot.",
    steps: [
      "Fix your eyes on a point straight ahead at about eye level.",
      "Lighten your hand on the support, or lift it just clear, and hold the heel-to-toe position still.",
      "Hold for the time set for you, breathing normally.",
      "Rest your hand back down, swap which foot is in front, and repeat."
    ],
    cues: [
      "Your feet stay in a straight line, one directly in front of the other.",
      "A firm surface is always within arm's reach on at least one side.",
      "Small wobbles are normal - your ankles and hips are working to keep you steady."
    ],
    mistakes: [
      "Placing the front foot out to the side instead of in line, which makes it much easier and less useful.",
      "Holding your breath or stiffening up - stay relaxed and keep breathing.",
      "Practising in the middle of a room with nothing to grab if you wobble.",
      "Stop and message your physio if you have a fall, a near-fall, or new dizziness or leg weakness."
    ],
    defaultDosage: {
      sets: 3,
      holdSeconds: 20,
      perDay: 1,
      perWeek: 5,
      notes: "Start with a hand resting on your support and progress to fingertips, then a hovering hand, as your balance improves. Count one hold with each foot in front as one set."
    }
  },
  {
    id: "ex-5",
    slug: "straight-leg-raise",
    title: "Straight Leg Raise",
    bodyPart: "Knee",
    clinicalArea: "lower_limb",
    tags: ["knee", "quad-strength", "early-rehab"],
    condition: "Post knee replacement",
    stage: "Early rehab",
    description: "Strengthens the thigh muscle while keeping the knee straight, moving as guided.",
    videoUrl: "https://www.youtube.com/embed/1iQvKfV5fCE",
    equipment: [],
    pose: "legRaise",
    setup: "Lie on your back with the operated leg straight and the other knee bent with that foot flat on the surface.",
    steps: [
      "Tighten the thigh muscle of your straight leg to press the back of the knee down firmly.",
      "Keeping the knee locked completely straight, lift the whole leg to about the height of the bent knee.",
      "Hold for a moment, still keeping the knee straight.",
      "Lower the leg slowly back down and relax."
    ],
    cues: [
      "The knee stays locked straight the whole time - no bend appears as you lift.",
      "The movement comes from your hip, with the front of your thigh doing the work.",
      "You keep breathing steadily rather than holding your breath."
    ],
    mistakes: [
      "Letting the knee bend or sag as the leg comes up.",
      "Lifting the leg too high - the height of the other bent knee is plenty.",
      "Arching your lower back to help the leg up.",
      "Stop and message your physio if you cannot lock the knee fully straight, or it becomes much more swollen and warm than usual."
    ],
    defaultDosage: {
      sets: 3,
      reps: 10,
      perDay: 2,
      perWeek: 7,
      notes: "Hold each raise for about 3 to 5 seconds. If you cannot keep the knee locked straight, practise tightening the thigh flat first before adding the lift."
    }
  },
  {
    id: "ex-6",
    slug: "heel-slide",
    title: "Heel Slide",
    bodyPart: "Knee",
    clinicalArea: "lower_limb",
    tags: ["knee", "range-of-motion", "early-rehab"],
    condition: "Post knee replacement",
    stage: "Early rehab",
    description: "Gently restores knee bending range through a slow, controlled sliding motion.",
    videoUrl: "https://www.youtube.com/embed/uKYLJ3f6QBA",
    equipment: ["A plastic bag or a small towel under your heel to help it slide"],
    pose: "heelSlide",
    setup: "Lie on your back, or sit propped up, with both legs out straight in front of you.",
    steps: [
      "Slowly slide the heel of your operated leg towards your bottom, letting the knee bend.",
      "Slide until you feel a gentle stretch or mild pressure in the knee.",
      "Hold there for a few seconds.",
      "Slowly slide the heel back down until the leg is straight again."
    ],
    cues: [
      "The movement is slow and smooth in both directions.",
      "You feel a stretch or a pull, not a sharp pain.",
      "Your knee and foot stay pointing towards the ceiling, not rolling out to the side."
    ],
    mistakes: [
      "Forcing the bend or bouncing at the end to gain range.",
      "Bending only a small amount each time - gently aim for a little more than the day before.",
      "Holding your breath through the stretch.",
      "Stop and message your physio if the knee will not bend at all, or your calf becomes swollen, hot, or painful."
    ],
    defaultDosage: {
      reps: 10,
      perDay: 4,
      perWeek: 7,
      notes: "Little and often works best - a short set every hour or two through the day. Count 1 rep as one slide in and back out."
    }
  },
  {
    id: "ex-7",
    slug: "mini-squat",
    title: "Mini Squat",
    bodyPart: "Knee",
    clinicalArea: "lower_limb",
    tags: ["knee", "osteoarthritis", "strength-phase"],
    condition: "Knee osteoarthritis",
    stage: "Strength phase",
    description: "Builds functional leg strength through a small, controlled bend at the knees and hips.",
    videoUrl: "https://www.youtube.com/embed/wPM8icPu6H8",
    equipment: ["A worktop or sturdy chair for light balance support"],
    pose: "squat",
    setup: "Stand tall with your feet hip-width apart, resting your hands lightly on a worktop in front of you for balance.",
    steps: [
      "Bend at your hips and knees to lower your body a small way, as if starting to sit into a chair.",
      "Go down only about a quarter of the way, keeping your heels flat on the floor.",
      "Push down through your feet to straighten back up to standing.",
      "Gently squeeze your buttocks at the top."
    ],
    cues: [
      "Your knees track in line with your middle toes, not falling inwards.",
      "Your weight stays back through your heels and mid-foot.",
      "Your chest stays up and your back keeps its natural curve."
    ],
    mistakes: [
      "Squatting too deep, which can overload a sore knee - keep it shallow.",
      "Letting your heels lift off the floor.",
      "Pulling yourself up with your arms instead of using your legs.",
      "Stop and message your physio if the knee swells after each session, gives way, or the pain climbs above what feels manageable."
    ],
    defaultDosage: {
      sets: 3,
      reps: 10,
      perDay: 1,
      perWeek: 5,
      notes: "Some ache in an arthritic knee during and shortly after exercise is normal and safe, as long as it settles within 24 hours and is not building week to week."
    }
  },
  {
    id: "ex-8",
    slug: "shoulder-flexion",
    title: "Shoulder Flexion",
    bodyPart: "Shoulder",
    clinicalArea: "upper_limb",
    tags: ["shoulder", "impingement", "mobility"],
    condition: "Shoulder impingement",
    stage: "Mobility phase",
    description: "Encourages a comfortable overhead reaching range, moving only as far as feels controlled.",
    videoUrl: "https://www.youtube.com/embed/qri3WcM6L4o",
    pose: "overheadReach",
    equipment: ["Optional: a light stick or broom handle"],
    setup: "Stand or sit tall. You can do this with the sore arm on its own, or hold a light stick in both hands so the good arm helps guide the sore one.",
    steps: [
      "Keeping your elbow straight, raise your arm forwards and up towards the ceiling.",
      "Go only as far as you can with control and without sharp pain.",
      "Lower the arm back down slowly to your side.",
      "Each day, aim to reach a little higher than the day before."
    ],
    cues: [
      "Lead with your thumb pointing up.",
      "Keep your shoulder relaxed - try not to hitch it up towards your ear as you lift.",
      "Move at a slow, even pace in both directions."
    ],
    mistakes: [
      "Leaning backwards or arching the back to get the arm higher.",
      "Forcing through a sharp or catching pain.",
      "Shrugging the shoulder up to cheat the movement.",
      "Stop and message your physio if the shoulder becomes locked, or the pain is present at rest and at night and getting worse."
    ],
    defaultDosage: { sets: 3, reps: 10, perDay: 2, perWeek: 7, tempo: "slow and controlled" }
  },
  {
    id: "ex-9",
    slug: "pendulum-swing",
    title: "Pendulum Swing",
    bodyPart: "Shoulder",
    clinicalArea: "upper_limb",
    tags: ["shoulder", "rotator-cuff", "early-rehab"],
    condition: "Rotator cuff repair",
    stage: "Early rehab",
    description: "Uses a gentle, relaxed swinging motion to ease shoulder stiffness without active lifting.",
    videoUrl: "https://www.youtube.com/embed/1iQvKfV5fCE",
    equipment: ["A sturdy table or chair to lean on"],
    pose: "pendulum",
    setup: "Stand and lean forwards from the hips, resting your good hand on a table or the back of a chair for support. Let the operated arm hang straight down towards the floor, completely relaxed.",
    steps: [
      "Let the arm hang heavy and loose, like a rope.",
      "Using a small rocking of your body, start the arm swinging gently forwards and backwards.",
      "Let it settle, then rock your body side to side so the arm swings across and back.",
      "Finally let the arm circle, a small circle one way and then the other.",
      "Let the arm come to rest, then stand back up."
    ],
    cues: [
      "The swing comes from shifting your body weight, not from working the shoulder.",
      "Your shoulder and arm muscles stay switched off throughout.",
      "Keep the circles small, about the size of a dinner plate."
    ],
    mistakes: [
      "Actively lifting or muscling the arm to make it move.",
      "Swinging too big or too fast.",
      "Leaning forwards without a firm support for your other hand.",
      "Stop and message your physio if you feel a sudden sharp pull, a pop, or catching in the shoulder, or the pain climbs sharply afterwards."
    ],
    defaultDosage: {
      reps: 15,
      perDay: 4,
      perWeek: 7,
      tempo: "slow and relaxed",
      notes: "Do these little and often - a short set every hour or two rather than one long session. The shoulder should feel looser, not more sore, afterwards. Stay within any limits your surgeon has set."
    }
  },
  {
    id: "ex-10",
    slug: "single-leg-balance",
    title: "Single Leg Balance",
    bodyPart: "Balance",
    clinicalArea: "balance_walking",
    tags: ["falls-prevention", "dynamic-balance"],
    condition: "Falls prevention",
    stage: "Mobility phase",
    description: "Improves standing balance and confidence, with hand support nearby if needed.",
    videoUrl: "https://www.youtube.com/embed/uKYLJ3f6QBA",
    equipment: ["A kitchen worktop, sturdy chair or wall for support"],
    pose: "balance",
    setup: "Stand tall beside a kitchen worktop or a sturdy chair, with one hand resting on it for support. Start with your feet hip-width apart.",
    steps: [
      "Shift your weight onto one leg.",
      "Lift the other foot a few inches off the floor, bending that knee slightly.",
      "Hold still, keeping your standing knee soft and your hips level.",
      "Lower the foot back down with control, then repeat on the other leg."
    ],
    cues: [
      "Your hips stay level, not dropped down on the lifted side.",
      "Your standing knee is soft, not locked straight or rolling inwards.",
      "You look straight ahead, not down at your feet."
    ],
    mistakes: [
      "Holding your breath or gripping the support hard - use it for light balance only.",
      "Leaning your whole body far over the standing leg.",
      "Hooking the lifted foot around the standing ankle for extra stability.",
      "Stop and message your physio if you have a fall, a near-fall, or new dizziness or leg weakness."
    ],
    defaultDosage: {
      sets: 3,
      holdSeconds: 20,
      perDay: 1,
      perWeek: 5,
      notes: "Progress from a full hand on your support, to fingertips, to no hands. Count one hold on each leg as one set."
    }
  },
  {
    id: "ex-11",
    slug: "hip-bridge",
    title: "Hip Bridge",
    bodyPart: "Hip",
    clinicalArea: "lower_limb",
    tags: ["hip", "glute-strength", "strength-phase"],
    condition: "Hip pain",
    stage: "Strength phase",
    description: "Strengthens the hips and glutes through a slow, controlled lifting and lowering motion.",
    videoUrl: "https://www.youtube.com/embed/wPM8icPu6H8",
    equipment: ["Exercise mat"],
    setup: "Lie on your back on a mat with your knees bent and your feet flat on the floor, hip-width apart. Rest your arms by your sides.",
    steps: [
      "Gently tighten your lower tummy and squeeze your buttocks.",
      "Push down through your heels and lift your hips off the floor.",
      "Stop when your body makes a straight line from your shoulders to your knees.",
      "Hold for a moment, then lower your hips back down slowly."
    ],
    cues: [
      "The lift is driven by your buttocks, not by arching your lower back.",
      "Your hips stay level with each other at the top.",
      "Your knees stay hip-width apart and do not fall in or out."
    ],
    mistakes: [
      "Lifting so high that your lower back arches and feels pinched.",
      "Pushing through your toes instead of through your heels.",
      "Letting one hip drop lower than the other.",
      "Stop and message your physio if you feel a deep pinch at the front of the hip, or the pain spreads down your leg."
    ],
    defaultDosage: { sets: 3, reps: 10, perDay: 1, perWeek: 5 }
  },
  {
    id: "ex-12",
    slug: "heel-raises",
    title: "Heel Raises",
    bodyPart: "Ankle",
    clinicalArea: "lower_limb",
    tags: ["ankle", "calf-strength", "strength-phase"],
    condition: "Ankle sprain",
    stage: "Strength phase",
    description: "Builds calf and ankle strength by rising onto the toes in a slow, controlled way.",
    videoUrl: "https://www.youtube.com/embed/qri3WcM6L4o",
    pose: "heelRaise",
    equipment: ["A kitchen counter or sturdy chair for light balance support"],
    setup: "Stand tall behind a kitchen counter or a sturdy chair, feet hip-width apart. Rest your fingertips on it for balance only - not to pull up with.",
    steps: [
      "Slowly rise up onto the balls of both feet, lifting your heels as high as feels comfortable.",
      "Pause at the top for a second, keeping your ankles steady and pointing straight ahead.",
      "Lower your heels back down slowly, taking about three seconds.",
      "Once two-legged raises feel easy, progress to rising and lowering on the injured leg only."
    ],
    cues: [
      "Push evenly through your big toe and second toe, not rolling out towards the little-toe side.",
      "Keep your knees straight but soft, and your body upright.",
      "The slow lowering is where the strength is built - control it all the way down."
    ],
    mistakes: [
      "Bouncing quickly through the reps instead of controlling them.",
      "Leaning your body weight onto your hands through the counter.",
      "Letting your ankles roll outward at the top.",
      "Stop and message your physio if you get sharp pain in the ankle or heel, or the ankle gives way."
    ],
    defaultDosage: { sets: 3, reps: 12, perDay: 1, perWeek: 5, tempo: "3 seconds to lower" }
  },
  {
    id: "ex-13",
    slug: "chin-tuck",
    title: "Chin Tuck",
    bodyPart: "Neck",
    clinicalArea: "spine",
    tags: ["neck", "postural-control", "early-rehab"],
    condition: "Neck pain",
    stage: "Early rehab",
    description: "Encourages gentle neck alignment through a small, comfortable tucking motion.",
    videoUrl: "https://www.youtube.com/embed/1iQvKfV5fCE",
    pose: "chinTuck",
    setup: "Sit or stand tall, looking straight ahead. Keep your face vertical and your eyes level.",
    steps: [
      "Without tipping your head down, gently glide your chin straight backwards to make a light 'double chin'.",
      "You should feel a mild stretch at the base of your skull and the back of your neck.",
      "Hold briefly, then release forwards to the start - do not push the head forwards past neutral."
    ],
    cues: [
      "The movement is horizontal - like a drawer sliding back, not a nod.",
      "Your eyes and jaw stay level throughout.",
      "Gentle and small; you are not trying to press hard."
    ],
    mistakes: [
      "Nodding the chin down towards the chest instead of gliding it back.",
      "Holding your breath or clenching your jaw.",
      "Pushing into pain - this should feel like a gentle stretch at most.",
      "Stop and message your physio if it brings on dizziness, pins and needles in the arms or hands, or a severe headache."
    ],
    defaultDosage: { reps: 10, perDay: 5, notes: "Hold each tuck for about 5 seconds. Easy to fit in through the day at a desk." }
  },
  {
    id: "ex-14",
    slug: "dead-bug",
    title: "Dead Bug",
    bodyPart: "Core",
    clinicalArea: "spine",
    tags: ["low-back", "core-control", "strength-phase"],
    condition: "Low back pain",
    stage: "Strength phase",
    description: "Builds core control by moving the arms and legs slowly while keeping the trunk steady.",
    videoUrl: "https://www.youtube.com/embed/uKYLJ3f6QBA",
    equipment: ["Exercise mat"],
    setup: "Lie on your back on a mat. Reach both arms straight up over your shoulders, and lift your feet so your hips and knees are bent at right angles.",
    steps: [
      "Gently flatten your lower back towards the floor by tightening your lower tummy.",
      "Slowly lower one arm back overhead and straighten the opposite leg towards the floor.",
      "Stop before your lower back starts to arch up away from the floor.",
      "Bring the arm and leg back to the start, then repeat with the other pair."
    ],
    cues: [
      "Your lower back stays gently pressed towards the floor the whole time.",
      "Only your arms and legs move — your hips and ribs stay still.",
      "The movement is slow and controlled, not rushed."
    ],
    mistakes: [
      "Letting your lower back lift into an arch as the leg lowers.",
      "Moving so fast that your trunk wobbles or twists.",
      "Holding your breath — breathe out gently as your arm and leg move away.",
      "Stop and message your physio if the pain spreads further down your leg, or you notice new numbness, pins and needles, or weakness."
    ],
    defaultDosage: { sets: 2, reps: 8, perDay: 1, perWeek: 5, notes: "Count 1 repetition as one movement to each side." }
  },
  {
    id: "ex-15",
    slug: "bird-dog",
    title: "Bird Dog",
    bodyPart: "Lumbar spine",
    clinicalArea: "spine",
    tags: ["low-back", "spinal-stability", "strength-phase"],
    condition: "Back pain",
    stage: "Strength phase",
    description: "Improves spinal stability by extending opposite arm and leg in a slow, controlled pattern.",
    videoUrl: "https://www.youtube.com/embed/wPM8icPu6H8",
    equipment: ["Exercise mat"],
    setup: "Kneel on all fours on a mat, with your hands under your shoulders and your knees under your hips. Keep your back flat and your head in line with your spine.",
    steps: [
      "Gently tighten your lower tummy to steady your back.",
      "Slowly reach one arm forwards while straightening the opposite leg out behind you.",
      "Stretch them out only until they are level with your body, no higher.",
      "Hold briefly, then lower back to all fours with control.",
      "Repeat with the other arm and leg."
    ],
    cues: [
      "Your back stays flat and level, like a table top.",
      "Your hips stay square to the floor and do not tip.",
      "The reaching arm and leg stop at body height, not lifted above it."
    ],
    mistakes: [
      "Arching your lower back or letting your tummy sag towards the floor.",
      "Twisting your hips or shoulders as you reach.",
      "Rushing — each reach should be slow and steady.",
      "Stop and message your physio if the pain spreads into your buttock or leg, or you notice new numbness, pins and needles, or weakness."
    ],
    defaultDosage: { sets: 2, reps: 10, perDay: 1, perWeek: 5, notes: "Count 1 repetition as one reach to each side." }
  },
  {
    id: "ex-16",
    slug: "stationary-bike",
    title: "Stationary Bike",
    bodyPart: "Knee",
    clinicalArea: "lower_limb",
    tags: ["knee-replacement", "low-impact", "mobility"],
    condition: "Post knee replacement",
    stage: "Mobility phase",
    description: "Supports gentle, low-impact movement to build knee range and general fitness.",
    videoUrl: "https://www.youtube.com/embed/qri3WcM6L4o",
    equipment: ["A stationary exercise bike"],
    pose: "bike",
    setup: "Set the seat height so that, with the pedal at its lowest point, your knee has only a slight bend. Sit upright and hold the handlebars lightly.",
    steps: [
      "If a full turn is not yet comfortable, start by rocking the pedals gently back and forth.",
      "Once the knee allows it, pedal forwards through full circles.",
      "Keep the resistance very light or off to begin with.",
      "Build up the time you can pedal before you add any resistance."
    ],
    cues: [
      "Pedalling feels smooth and even, without a catch as the knee bends.",
      "You sit tall and central, not leaning away from the operated leg.",
      "Any knee ache is mild and settles soon after you finish."
    ],
    mistakes: [
      "Setting the seat too low, which forces the knee to bend further than it is ready for.",
      "Adding resistance too soon - time and range come first.",
      "Pushing through sharp pain to force a full turn.",
      "Stop and message your physio if the knee is hot and swollen afterwards, or clicking with pain."
    ],
    defaultDosage: {
      minutes: 5,
      perDay: 1,
      perWeek: 5,
      notes: "Begin at about 5 minutes at light or no resistance and build towards 10 to 15 minutes as your knee allows, before adding resistance."
    }
  },
  // Facial-rehab exercises for facial-palsy / post-stroke / older patients.
  // Their motion check uses the FACE camera engine (symmetry + gentle reps),
  // not the body pose engine — see lib/face-targets.ts (face-* ids).
  {
    id: "face-smile",
    slug: "smile-mouth-raise",
    title: "Smile / Mouth Raise",
    bodyPart: "Face",
    clinicalArea: "neuro",
    tags: ["facial-palsy", "stroke", "symmetry"],
    condition: "Facial palsy / stroke recovery",
    stage: "Facial rehab",
    description: "Gently raise both mouth corners into a smile, aiming to move the weaker side to match the stronger one.",
    videoUrl: "https://www.youtube.com/embed/qri3WcM6L4o",
    equipment: ["A mirror"],
    setup: "Sit comfortably in front of a mirror in good light, close enough to see both sides of your face clearly, and let your face rest in a neutral position before you start.",
    steps: [
      "Without showing your teeth, gently lift both corners of your mouth into a small smile.",
      "Watch the mirror and let the stronger side come up only as far as the weaker side can match.",
      "Hold the even smile for a few seconds.",
      "Slowly relax your mouth back to neutral."
    ],
    cues: [
      "keep the two sides even; move the weaker side only as far as it can match the stronger side; never force",
      "The movement comes from your mouth corners, not from squinting your eyes or tensing your neck.",
      "Let your face fully relax between repetitions."
    ],
    mistakes: [
      "Forcing a big smile so the stronger side pulls your face across to one side.",
      "Helping the smile along with your eyes, forehead, or chin.",
      "Rushing - each repetition is slow and controlled.",
      "Stop and message your physio if you develop new facial twitching or tightness, or movements start happening in more than one area at once (for example your eye closing when you smile)."
    ],
    defaultDosage: {
      sets: 2,
      reps: 5,
      holdSeconds: 5,
      perDay: 2,
      notes: "Do these slowly in front of a mirror. Quality and symmetry matter more than the number."
    }
  },
  {
    id: "face-brow-raise",
    slug: "eyebrow-raise",
    title: "Eyebrow Raise",
    bodyPart: "Face",
    clinicalArea: "neuro",
    tags: ["facial-palsy", "stroke", "symmetry"],
    condition: "Facial palsy / stroke recovery",
    stage: "Facial rehab",
    description: "Lift both eyebrows as evenly as you can, then relax — retraining symmetrical forehead control.",
    videoUrl: "https://www.youtube.com/embed/qri3WcM6L4o",
    equipment: ["A mirror"],
    setup: "Sit comfortably in front of a mirror in good light, close enough to see both sides of your face clearly, and let your face rest in a neutral position before you start.",
    steps: [
      "Look straight ahead and raise both eyebrows, as if mildly surprised.",
      "Watch the mirror and keep the lift even, letting the stronger side rise only as far as the weaker side.",
      "Hold the raised, even position for a few seconds.",
      "Slowly lower your eyebrows back to neutral."
    ],
    cues: [
      "keep the two sides even; move the weaker side only as far as it can match the stronger side; never force",
      "The lines across your forehead stay as level as you can make them.",
      "Your eyes and mouth stay relaxed while your forehead works."
    ],
    mistakes: [
      "Letting the stronger eyebrow shoot up while the weaker one barely moves.",
      "Tipping your head back instead of lifting the eyebrows.",
      "Screwing up the rest of your face to help.",
      "Stop and message your physio if you develop new facial twitching or tightness, or movements start happening in more than one area at once (for example your eye closing when you smile)."
    ],
    defaultDosage: {
      sets: 2,
      reps: 5,
      holdSeconds: 5,
      perDay: 2,
      notes: "Do these slowly in front of a mirror. Quality and symmetry matter more than the number."
    }
  },
  {
    id: "face-eye-close",
    slug: "gentle-eye-close",
    title: "Gentle Eye Close",
    bodyPart: "Face",
    clinicalArea: "neuro",
    tags: ["facial-palsy", "stroke", "symmetry"],
    condition: "Facial palsy / stroke recovery",
    stage: "Facial rehab",
    description: "Softly close both eyes together and reopen, encouraging even eyelid control on both sides.",
    videoUrl: "https://www.youtube.com/embed/qri3WcM6L4o",
    equipment: ["A mirror"],
    setup: "Sit comfortably in front of a mirror in good light, close enough to see both sides of your face clearly, and let your face rest in a neutral position before you start.",
    steps: [
      "Look in the mirror and note whether one eyelid tends to close less fully than the other.",
      "Softly close both eyes at the same time, as if drifting off to sleep.",
      "Keep it gentle - do not screw your eyes up tight or force the lid down.",
      "Hold the soft closure for a few seconds, then slowly open both eyes together."
    ],
    cues: [
      "keep the two sides even; move the weaker side only as far as it can match the stronger side; never force",
      "The closure is soft and light, with no hard squeezing.",
      "Your mouth and cheek stay still while your eyes work."
    ],
    mistakes: [
      "Screwing the eyes up tightly instead of a gentle close.",
      "Letting your mouth pull up or sideways as you close your eyes.",
      "Pressing on the eyelid with a finger to force it shut.",
      "Stop and message your physio if you develop new facial twitching or tightness, or movements start happening in more than one area at once (for example your eye closing when you smile)."
    ],
    defaultDosage: {
      sets: 2,
      reps: 5,
      holdSeconds: 5,
      perDay: 2,
      notes: "Do these slowly in front of a mirror. Quality and symmetry matter more than the number."
    }
  },
  {
    id: "face-cheek-puff",
    slug: "cheek-puff",
    title: "Cheek Puff",
    bodyPart: "Face",
    clinicalArea: "neuro",
    tags: ["facial-palsy", "stroke", "lip-seal"],
    condition: "Facial palsy / stroke recovery",
    stage: "Facial rehab",
    description: "Puff out both cheeks and hold, then release — building lip seal and cheek-muscle control.",
    videoUrl: "https://www.youtube.com/embed/qri3WcM6L4o",
    equipment: ["A mirror"],
    setup: "Sit comfortably in front of a mirror in good light, close enough to see both sides of your face clearly, and let your face rest in a neutral position before you start.",
    steps: [
      "Take a normal breath, then close your lips and puff both cheeks out with air.",
      "Watch the mirror and keep both cheeks filled evenly.",
      "If air leaks from the weaker side, gently hold that corner of your lips closed with a clean finger.",
      "Hold for a few seconds, then release the air slowly."
    ],
    cues: [
      "keep the two sides even; move the weaker side only as far as it can match the stronger side; never force",
      "Your lips stay sealed so the air does not escape.",
      "Both cheeks look about equally full."
    ],
    mistakes: [
      "Puffing so hard that you strain or feel pressure in your ears.",
      "Letting the air slip out of the weaker side without supporting the lip with a finger.",
      "Rushing on without letting your face relax between puffs.",
      "Stop and message your physio if you develop new facial twitching or tightness, or movements start happening in more than one area at once (for example your eye closing when you smile)."
    ],
    defaultDosage: {
      sets: 2,
      reps: 5,
      holdSeconds: 5,
      perDay: 2,
      notes: "Do these slowly in front of a mirror. Quality and symmetry matter more than the number."
    }
  },
  {
    id: "face-frown",
    slug: "brow-furrow",
    title: "Brow Furrow",
    bodyPart: "Face",
    clinicalArea: "neuro",
    tags: ["facial-palsy", "stroke", "symmetry"],
    condition: "Facial palsy / stroke recovery",
    stage: "Facial rehab",
    description: "Pull both eyebrows down and together into a frown, then relax — retraining even upper-face control.",
    videoUrl: "https://www.youtube.com/embed/qri3WcM6L4o",
    equipment: ["A mirror"],
    setup: "Sit comfortably in front of a mirror in good light, close enough to see both sides of your face clearly, and let your face rest in a neutral position before you start.",
    steps: [
      "Look straight ahead and draw both eyebrows down and inwards, as if concentrating hard.",
      "Use the mirror to keep the pull even on both sides.",
      "Hold the frown for a few seconds.",
      "Slowly relax your eyebrows back to neutral."
    ],
    cues: [
      "keep the two sides even; move the weaker side only as far as it can match the stronger side; never force",
      "A small vertical crease forms between your eyebrows, centred rather than pulled to one side.",
      "Your mouth and jaw stay relaxed."
    ],
    mistakes: [
      "Letting the stronger side do most of the pull so the crease sits off-centre.",
      "Clenching your jaw or screwing up your eyes to help.",
      "Holding your breath during the frown.",
      "Stop and message your physio if you develop new facial twitching or tightness, or movements start happening in more than one area at once (for example your eye closing when you smile)."
    ],
    defaultDosage: {
      sets: 2,
      reps: 5,
      holdSeconds: 5,
      perDay: 2,
      notes: "Do these slowly in front of a mirror. Quality and symmetry matter more than the number."
    }
  },
  {
    id: "face-big-smile",
    slug: "big-smile",
    title: "Big Smile",
    bodyPart: "Face",
    clinicalArea: "neuro",
    tags: ["facial-palsy", "stroke", "symmetry"],
    condition: "Facial palsy / stroke recovery",
    stage: "Facial rehab",
    description: "A wider smile progression — push both mouth corners up and out as far as feels comfortable, keeping the sides even.",
    videoUrl: "https://www.youtube.com/embed/qri3WcM6L4o",
    equipment: ["A mirror"],
    setup: "Sit comfortably in front of a mirror in good light, close enough to see both sides of your face clearly, and let your face rest in a neutral position before you start. Use this once the basic smile is even and comfortable.",
    steps: [
      "Start with a small even smile, then widen it by pushing both mouth corners up and out.",
      "Let your teeth show if that happens naturally, keeping both sides moving together.",
      "Watch the mirror and hold the stronger side back so the weaker side can keep up.",
      "Hold the wide, even smile for a few seconds, then slowly relax."
    ],
    cues: [
      "keep the two sides even; move the weaker side only as far as it can match the stronger side; never force",
      "Both mouth corners lift to a similar height.",
      "The rest of your face stays relaxed, especially your eyes and forehead."
    ],
    mistakes: [
      "Going for the widest possible smile so the weaker side is left behind.",
      "Progressing to this before the basic smile is even and comfortable.",
      "Tensing your neck to help the movement.",
      "Stop and message your physio if you develop new facial twitching or tightness, or movements start happening in more than one area at once (for example your eye closing when you smile)."
    ],
    defaultDosage: {
      sets: 2,
      reps: 5,
      holdSeconds: 5,
      perDay: 2,
      notes: "Do these slowly in front of a mirror. Quality and symmetry matter more than the number."
    }
  },
  {
    id: "face-eye-wide",
    slug: "open-eyes-wide",
    title: "Open Eyes Wide",
    bodyPart: "Face",
    clinicalArea: "neuro",
    tags: ["facial-palsy", "stroke", "symmetry"],
    condition: "Facial palsy / stroke recovery",
    stage: "Facial rehab",
    description: "Open both eyes as wide as you can, as if surprised, then relax — encouraging even eyelid lift on both sides.",
    videoUrl: "https://www.youtube.com/embed/qri3WcM6L4o",
    equipment: ["A mirror"],
    setup: "Sit comfortably in front of a mirror in good light, close enough to see both sides of your face clearly, and let your face rest in a neutral position before you start.",
    steps: [
      "Look straight ahead and open both eyes wide, as if something has surprised you.",
      "Keep your eyebrows still so the work comes from your eyelids, not your forehead.",
      "Use the mirror to keep both eyes opening to a similar width.",
      "Hold for a few seconds, then let your eyes return to their resting position."
    ],
    cues: [
      "keep the two sides even; move the weaker side only as far as it can match the stronger side; never force",
      "Both upper eyelids lift by a similar amount.",
      "Your forehead stays relatively still."
    ],
    mistakes: [
      "Raising your eyebrows to fake a wider eye opening.",
      "Tipping your head forwards or back.",
      "Straining the weaker eye to match - let it move only as far as it comfortably can.",
      "Stop and message your physio if you develop new facial twitching or tightness, or movements start happening in more than one area at once (for example your eye closing when you smile)."
    ],
    defaultDosage: {
      sets: 2,
      reps: 5,
      holdSeconds: 5,
      perDay: 2,
      notes: "Do these slowly in front of a mirror. Quality and symmetry matter more than the number."
    }
  },
  {
    id: "face-pucker",
    slug: "lip-pucker",
    title: "Lip Pucker",
    bodyPart: "Face",
    clinicalArea: "neuro",
    tags: ["facial-palsy", "stroke", "lip-seal"],
    condition: "Facial palsy / stroke recovery",
    stage: "Facial rehab",
    description: "Draw both lips forward into a pucker, as if to kiss or whistle, then relax — building lip-rounding control for speech and drinking.",
    videoUrl: "https://www.youtube.com/embed/qri3WcM6L4o",
    equipment: ["A mirror"],
    setup: "Sit comfortably in front of a mirror in good light, close enough to see both sides of your face clearly, and let your face rest in a neutral position before you start.",
    steps: [
      "Bring both lips forwards and together into a pucker, as if to give a kiss or whistle.",
      "Watch the mirror and keep the pucker centred, not pulled towards the stronger side.",
      "Hold the rounded shape for a few seconds.",
      "Slowly relax your lips back to neutral."
    ],
    cues: [
      "keep the two sides even; move the weaker side only as far as it can match the stronger side; never force",
      "The pucker points straight forwards and looks symmetrical.",
      "Your cheeks and eyes stay relaxed."
    ],
    mistakes: [
      "Letting the pucker slide across to the stronger side.",
      "Pressing your lips together hard instead of rounding them forwards.",
      "Rushing between repetitions without relaxing.",
      "Stop and message your physio if you develop new facial twitching or tightness, or movements start happening in more than one area at once (for example your eye closing when you smile)."
    ],
    defaultDosage: {
      sets: 2,
      reps: 5,
      holdSeconds: 5,
      perDay: 2,
      notes: "Do these slowly in front of a mirror. Quality and symmetry matter more than the number."
    }
  },
  {
    id: "ex-17", title: "McKenzie Press-Up", bodyPart: "Lumbar spine",
    slug: "mckenzie-press-up",
    clinicalArea: "spine", tags: ["low-back", "disc", "extension-bias", "early-rehab"],
    condition: "Lumbar disc-related back pain", stage: "Early rehab",
    description: "Gentle repeated lower-back extension to centralise leg symptoms toward the spine, following the McKenzie extension principle.",
    equipment: ["Exercise mat"],
    setup: "Lie face down on a mat with your hands flat on the floor under your shoulders, as if you were about to push up. Let your hips and legs stay relaxed.",
    steps: [
      "Push through your hands to lift your chest and upper body off the floor.",
      "Let your lower back and tummy sag towards the floor as you come up.",
      "Rise only as far as feels comfortable, keeping your hips on the mat.",
      "Lower back down slowly to the starting position."
    ],
    cues: [
      "Your hips, buttocks and legs stay loose and resting on the mat.",
      "Any symptoms in your leg move up towards your back, or stay the same — this is the direction you want.",
      "The movement is a slow, repeated rock rather than a long held stretch at first."
    ],
    mistakes: [
      "Tensing your buttocks or legs as you lift.",
      "Pushing up hard and fast into a big arch straight away — build the range up gradually.",
      "Stop and message your physio if the pain spreads further down your leg, or you notice new or worse numbness, pins and needles, or weakness in your leg or foot."
    ],
    defaultDosage: { sets: 1, reps: 10, perDay: 3, perWeek: 7, tempo: "slow and controlled" }
  },
  {
    id: "ex-18", title: "Standing Extension", bodyPart: "Lumbar spine",
    slug: "standing-extension",
    clinicalArea: "spine", tags: ["low-back", "disc", "extension-bias", "mobility"],
    condition: "Lumbar disc-related back pain", stage: "Mobility phase",
    description: "An upright version of the press-up, hands on hips, easing the spine backward for symptom relief between exercise sessions.",
    equipment: [],
    setup: "Stand tall with your feet about shoulder-width apart. Place your hands on your lower back or hips, with your fingers pointing downwards.",
    steps: [
      "Use your hands as a support and gently lean your upper body backwards.",
      "Let the bend come from your lower back, keeping your knees straight.",
      "Go only as far as feels comfortable, then return to standing upright."
    ],
    cues: [
      "The bend comes from your lower back, not from your knees.",
      "You feel a gentle easing in your back, not a sharp pinch.",
      "Any symptoms in your leg move up towards your back, or stay the same."
    ],
    mistakes: [
      "Forcing the movement or bouncing at the end of the range.",
      "Leaning back so far that you feel unsteady — stand near a wall or worktop if your balance is uncertain.",
      "Stop and message your physio if the pain spreads further down your leg, or you notice new or worse numbness, pins and needles, or weakness."
    ],
    defaultDosage: { sets: 1, reps: 10, perDay: 3, perWeek: 7, tempo: "slow and controlled" }
  },
  {
    id: "ex-19",
    slug: "cat-cow-stretch",
    title: "Cat-Cow Stretch",
    bodyPart: "Thoracic spine",
    clinicalArea: "spine",
    tags: ["mid-back", "mobility", "early-rehab"],
    condition: "Thoracic stiffness",
    stage: "Early rehab",
    description: "Alternates gentle spinal flexion and extension on hands and knees to restore comfortable segmental movement.",
    equipment: ["Exercise mat"],
    pose: "catCow",
    setup: "Start on your hands and knees on a mat, with your hands under your shoulders and your knees under your hips. Let your back settle into a flat, neutral position.",
    steps: [
      "Breathe out and gently round your back up towards the ceiling, letting your head drop and your tailbone tuck under.",
      "Breathe in and slowly reverse the movement, letting your tummy sink, your chest lift and your gaze rise a little.",
      "Move smoothly between the two positions, letting your breathing set the pace.",
      "Finish back in the flat, neutral starting position."
    ],
    cues: [
      "The movement flows slowly and evenly, led by your breathing.",
      "You move only as far as stays comfortable in each direction.",
      "The bend is spread along your whole spine, not forced at one spot."
    ],
    mistakes: [
      "Pushing hard into the end of either position.",
      "Rushing so the movement becomes a jerky flick.",
      "Holding your breath instead of letting it guide the pace.",
      "Stop and message your physio if it brings on pins and needles in your arms or hands, or pain that spreads rather than easing."
    ],
    defaultDosage: {
      sets: 1,
      reps: 10,
      perDay: 2,
      perWeek: 7,
      tempo: "slow and controlled",
      notes: "Count 1 repetition as one round up and one arch down."
    }
  },
  {
    id: "ex-20",
    slug: "thoracic-rotation-open-book",
    title: "Thoracic Rotation (Open Book)",
    bodyPart: "Thoracic spine",
    clinicalArea: "spine",
    tags: ["mid-back", "rotation", "mobility"],
    condition: "Thoracic stiffness",
    stage: "Mobility phase",
    description: "Side-lying rotation opening the chest toward the ceiling, restoring rotation range often lost with prolonged sitting.",
    equipment: ["Exercise mat", "A pillow for your head"],
    setup: "Lie on your side on a mat with your knees drawn up towards your chest and a pillow under your head. Stretch both arms out in front of you at shoulder height, palms together.",
    steps: [
      "Keeping your knees together and still, slowly lift your top arm and open it out towards the ceiling.",
      "Follow your hand with your eyes and let your head and chest turn to follow it.",
      "Take the arm as far as it goes comfortably, aiming to lower it towards the floor on the other side.",
      "Hold briefly, then slowly bring the arm back over to meet the other hand."
    ],
    cues: [
      "Your knees stay stacked and pressed together throughout.",
      "The turn comes from your mid-back and chest, not from your lower back.",
      "You feel a gentle opening across the front of your chest and through your mid-back."
    ],
    mistakes: [
      "Letting your top knee lift away so the movement comes from your hips.",
      "Forcing the arm down to the floor before your back is ready.",
      "Holding your breath - breathe out gently as you open.",
      "Stop and message your physio if it brings on pins and needles in your arm or hand, or pain that spreads down your arm."
    ],
    defaultDosage: {
      sets: 1,
      reps: 8,
      perDay: 2,
      perWeek: 7,
      tempo: "slow, with a short hold at the end",
      notes: "Work the stiffer side, or both sides if your physio advises. Count 1 repetition as one open and return."
    }
  },
  {
    id: "ex-21",
    slug: "neck-rotation-range",
    title: "Neck Rotation Range",
    bodyPart: "Cervical spine",
    clinicalArea: "spine",
    tags: ["neck", "range-of-motion", "early-rehab"],
    condition: "Neck pain",
    stage: "Early rehab",
    description: "Slow, controlled turning of the head side to side within a comfortable range to restore rotation.",
    equipment: [],
    pose: "neckTurn",
    setup: "Sit or stand tall with your shoulders relaxed and your eyes looking straight ahead.",
    steps: [
      "Slowly turn your head to look over one shoulder, keeping your chin level.",
      "Go only as far as feels comfortable, then pause for a moment.",
      "Slowly return your head to face the front.",
      "Repeat to the other side, moving at the same slow pace."
    ],
    cues: [
      "Your chin stays level - you turn it, rather than poke it forward.",
      "Your shoulders and upper body stay still and facing forwards.",
      "The movement is slow and even in both directions."
    ],
    mistakes: [
      "Forcing the head further with a quick push at the end of the turn.",
      "Hunching or lifting your shoulders towards your ears.",
      "Turning your whole trunk instead of just your head.",
      "Stop and message your physio if it brings on dizziness, pins and needles in the arms or hands, or a severe or unusual headache."
    ],
    defaultDosage: {
      sets: 1,
      reps: 8,
      perDay: 3,
      perWeek: 7,
      tempo: "slow and controlled",
      notes: "Count 1 repetition as one turn to each side."
    }
  },
  {
    id: "ex-22",
    slug: "neck-side-flexion-stretch",
    title: "Neck Side Flexion Stretch",
    bodyPart: "Cervical spine",
    clinicalArea: "spine",
    tags: ["neck", "flexibility", "early-rehab"],
    condition: "Neck pain",
    stage: "Early rehab",
    description: "A gentle ear-to-shoulder stretch, held briefly, to ease tight upper trapezius and neck muscles.",
    equipment: [],
    setup: "Sit tall on a firm chair with both feet flat on the floor and your shoulders relaxed. You can hold the side of the seat with the hand on the side you are stretching.",
    steps: [
      "Gently tilt your head to bring one ear down towards that shoulder.",
      "Keep your face pointing forwards and your shoulders down and level.",
      "When you feel a comfortable stretch down the opposite side of your neck, stop and hold it.",
      "Slowly bring your head back to the middle, then change sides."
    ],
    cues: [
      "The stretch is felt along the side of your neck away from the tilt.",
      "Your shoulders stay down, not creeping up towards your ears.",
      "The hold is gentle and steady, without a hard pull from your hand."
    ],
    mistakes: [
      "Using your hand to force your head further into the stretch.",
      "Turning or poking your chin forward instead of a clean sideways tilt.",
      "Lifting the opposite shoulder up to meet your ear.",
      "Stop and message your physio if it brings on dizziness, pins and needles in the arms or hands, or a severe or unusual headache."
    ],
    defaultDosage: {
      sets: 2,
      holdSeconds: 20,
      perDay: 2,
      perWeek: 7,
      tempo: "slow and controlled",
      notes: "Do the hold on each side."
    }
  },
  {
    id: "ex-23",
    slug: "isometric-neck-hold",
    title: "Isometric Neck Hold",
    bodyPart: "Cervical spine",
    clinicalArea: "spine",
    tags: ["neck", "whiplash", "strength-phase"],
    condition: "Whiplash-associated disorder",
    stage: "Strength phase",
    description: "Gentle resistance pushing the head into a supporting hand without movement, rebuilding neck muscle endurance safely.",
    equipment: [],
    setup: "Sit tall on a firm chair with your head balanced comfortably over your shoulders and your eyes looking straight ahead.",
    steps: [
      "Place the palm of one hand flat against the side of your head, just above your ear.",
      "Gently press your head sideways into your hand, letting your hand hold your head completely still.",
      "Build to a light, steady effort of about a quarter of your strength and hold it.",
      "Slowly ease off and rest, then repeat pressing forwards into your hand, backwards, and to the other side."
    ],
    cues: [
      "Your head does not actually move - the effort is met and held by your hand.",
      "The push is gentle and steady, never a sudden shove.",
      "Your jaw, shoulders and breathing stay relaxed during the hold."
    ],
    mistakes: [
      "Pushing too hard, especially in the early weeks - this should feel easy and controlled.",
      "Letting your head drift or poke forward as you press.",
      "Holding your breath through the effort.",
      "Stop and message your physio if it brings on dizziness, pins and needles in the arms or hands, or a severe or unusual headache."
    ],
    defaultDosage: {
      sets: 3,
      holdSeconds: 10,
      perDay: 1,
      perWeek: 6,
      notes: "Work four gentle directions each time: pressing left, right, forwards and backwards. Start with a short, light hold and build the time and effort up over several weeks."
    }
  },
  {
    id: "ex-24", title: "Prone Cobra", bodyPart: "Lumbar spine",
    slug: "prone-cobra",
    clinicalArea: "spine", tags: ["low-back", "postural-control", "strength-phase"],
    condition: "Postural low back pain", stage: "Strength phase",
    description: "Lying face down, lifting the chest slightly using back extensors to build postural endurance for desk-based pain.",
    equipment: ["Exercise mat"],
    setup: "Lie face down on a mat with your arms by your sides, palms facing down. Rest your forehead lightly on the floor.",
    steps: [
      "Gently draw your shoulder blades down and together.",
      "Lift your chest and forehead a small way off the floor.",
      "Turn your palms to face outwards as you lift.",
      "Hold, keeping your neck long, then lower slowly to the mat."
    ],
    cues: [
      "The lift is small — your lower ribs and hips stay on the mat.",
      "Your gaze stays down at the floor so your neck stays in line.",
      "The effort is felt between your shoulder blades and across your upper back."
    ],
    mistakes: [
      "Lifting so high that your lower back cramps or pinches.",
      "Tipping your head back to look forwards.",
      "Holding your breath during the hold.",
      "Stop and message your physio if the pain spreads into your buttock or leg, or you notice new numbness, pins and needles, or weakness."
    ],
    defaultDosage: { sets: 3, holdSeconds: 20, perDay: 1, perWeek: 5 }
  },
  {
    id: "ex-25", title: "Side Plank (Modified)", bodyPart: "Lumbar spine",
    slug: "side-plank-modified",
    clinicalArea: "spine", tags: ["low-back", "core-control", "strength-phase"],
    condition: "Low back pain", stage: "Strength phase",
    description: "A knee-supported side plank building lateral trunk stability, progressing spinal load tolerance safely.",
    equipment: ["Exercise mat"],
    setup: "Lie on your side on a mat, resting on your forearm with your elbow directly under your shoulder. Bend your knees so your lower legs trail behind you.",
    steps: [
      "Stack your hips and shoulders so your body faces forwards.",
      "Gently tighten your tummy.",
      "Lift your hips off the floor until your body makes a straight line from your head to your knees.",
      "Hold, then lower your hips back down with control."
    ],
    cues: [
      "Your body stays in one straight line, not sagging or folding forwards.",
      "Your supporting shoulder stays away from your ear.",
      "You feel the work down the side of your trunk that is nearest the floor."
    ],
    mistakes: [
      "Letting your hips drift down towards the floor during the hold.",
      "Rolling forwards or backwards out of the side-on position.",
      "Pressing hard through your neck or the point of your elbow.",
      "Stop and message your physio if the pain spreads into your buttock or leg, or you notice new numbness, pins and needles, or weakness."
    ],
    defaultDosage: { sets: 3, holdSeconds: 20, perDay: 1, perWeek: 5, notes: "Do the holds on each side." }
  },
  {
    id: "ex-26", title: "Segmental Rolling", bodyPart: "Lumbar spine",
    slug: "segmental-rolling",
    clinicalArea: "spine", tags: ["low-back", "mobility", "early-rehab"],
    condition: "Acute low back pain", stage: "Early rehab",
    description: "Rolling from back to side in a controlled, segmental way to reintroduce comfortable movement after an acute flare.",
    equipment: ["Exercise mat"],
    setup: "Lie on your back on a mat or a firm bed, with your legs straight and your arms by your sides.",
    steps: [
      "Turn your head to look towards the side you are rolling to.",
      "Reach that arm across your body and let your shoulder follow it.",
      "Let your ribs, then your hips, then your legs roll one after the other until you are on your side.",
      "Pause, then roll back to lying in the same unhurried order."
    ],
    cues: [
      "The roll happens one body part at a time, not all in one go.",
      "You keep breathing and stay as relaxed as you can.",
      "You find a way to move that feels manageable, even if it is slow."
    ],
    mistakes: [
      "Bracing hard and rolling like a single stiff log if that increases the pain.",
      "Rushing or throwing yourself over with one big effort.",
      "Stop and message your physio if the pain spreads further down your leg, or you notice new numbness, pins and needles, or weakness. Seek urgent medical help if you develop numbness around your back passage or problems controlling your bladder or bowels."
    ],
    defaultDosage: { sets: 1, reps: 6, perDay: 4, perWeek: 7, notes: "Practise rolling to each side." }
  },
  {
    id: "ex-27", title: "Pelvic Tilt", bodyPart: "Lumbar spine",
    slug: "pelvic-tilt",
    clinicalArea: "spine", tags: ["low-back", "pregnancy", "early-rehab"],
    condition: "Pregnancy-related back pain", stage: "Early rehab",
    description: "A small rocking of the pelvis to ease lumbar tension, safe and gentle enough for antenatal and postnatal back pain.",
    equipment: ["Exercise mat"],
    setup: "Lie on your back on a mat with your knees bent and your feet flat on the floor. In later pregnancy, do this sitting on a chair or on all fours instead of lying flat.",
    steps: [
      "Gently tighten your lower tummy muscles.",
      "Roll the top of your pelvis backwards so your lower back flattens towards the floor.",
      "Hold for a few seconds, still breathing normally.",
      "Relax back to the starting position."
    ],
    cues: [
      "The movement is small and comes from your pelvis.",
      "Your buttocks and legs stay relaxed.",
      "You feel your lower back gently flatten and then release."
    ],
    mistakes: [
      "Making the movement big or forceful.",
      "Pushing through your feet to lift your hips — this is a small tilt, not a bridge.",
      "Lying flat on your back for long spells in later pregnancy — use the sitting or all-fours version instead.",
      "Stop and check with your physio or midwife if this brings on pain, and stop straight away if you feel dizzy or unwell."
    ],
    pose: "pelvicTilt",
    defaultDosage: { sets: 1, reps: 10, perDay: 3, perWeek: 7, tempo: "slow and controlled" }
  },
  {
    id: "ex-28", title: "Quadruped Arm/Leg Reach", bodyPart: "Lumbar spine",
    slug: "quadruped-arm-leg-reach",
    clinicalArea: "spine", tags: ["low-back", "spinal-stability", "strength-phase"],
    condition: "Chronic low back pain", stage: "Return to function",
    description: "An advanced bird-dog progression adding controlled reach, challenging balance and trunk control together.",
    equipment: ["Exercise mat"],
    setup: "Kneel on all fours on a mat, with your hands under your shoulders and your knees under your hips, and your back flat.",
    steps: [
      "Tighten your lower tummy to keep your back steady.",
      "Reach one arm forwards and the opposite leg back until both are level with your body.",
      "Slowly draw that elbow and knee in towards each other under your body.",
      "Reach back out to the long position without letting your back move.",
      "Return to all fours, then repeat on the other side."
    ],
    cues: [
      "Your back stays flat and still while only your arm and leg move.",
      "Your hips stay level and square to the floor.",
      "You move slowly enough to stay balanced throughout."
    ],
    mistakes: [
      "Letting your back arch or sag as you reach out or draw in.",
      "Twisting or tipping your hips to keep your balance.",
      "Rushing the reach so it turns into a swing.",
      "Stop and message your physio if the pain spreads down your leg, or you notice new numbness, pins and needles, or weakness."
    ],
    defaultDosage: { sets: 2, reps: 10, perDay: 1, perWeek: 5, notes: "Count 1 repetition as one reach to each side." }
  },
  {
    id: "ex-29",
    slug: "standing-chin-retraction",
    title: "Standing Chin Retraction",
    bodyPart: "Cervical spine",
    clinicalArea: "spine",
    tags: ["neck", "postural-control", "early-rehab"],
    condition: "Cervicogenic headache",
    stage: "Early rehab",
    description: "Drawing the chin straight back to correct forward-head posture, a common driver of tension-type headaches.",
    equipment: [],
    pose: "chinTuck",
    setup: "Stand tall with your back against a wall and your feet a little way from the skirting board, so the back of your head lightly touches the wall. Look straight ahead.",
    steps: [
      "Keeping your eyes level, gently draw your chin straight back, as if making a double chin.",
      "Let the back of your head slide up the wall a little as your chin tucks in.",
      "Hold the position for a few seconds, keeping your face pointing forwards.",
      "Relax and let your head return to its normal resting position."
    ],
    cues: [
      "The movement is a straight backward glide, not a nod up or down.",
      "You feel a gentle stretch at the base of your skull and the back of your neck.",
      "Your jaw and shoulders stay relaxed throughout."
    ],
    mistakes: [
      "Tipping your head down towards your chest instead of gliding it back.",
      "Pushing back so hard that it feels forced or pinching.",
      "Holding your breath during the tuck.",
      "Stop and message your physio if it brings on dizziness, pins and needles in the arms or hands, or a severe or unusual headache."
    ],
    defaultDosage: {
      sets: 2,
      reps: 10,
      holdSeconds: 5,
      perDay: 2,
      perWeek: 7,
      notes: "Hold each retraction for about 5 seconds. It also works well as a quick posture reset a few times through the day."
    }
  },
  {
    id: "ex-30",
    slug: "levator-scapulae-stretch",
    title: "Levator Scapulae Stretch",
    bodyPart: "Cervical spine",
    clinicalArea: "spine",
    tags: ["neck", "flexibility", "mobility"],
    condition: "Neck and upper trap tightness",
    stage: "Mobility phase",
    description: "A diagonal neck stretch looking down and away to lengthen a commonly tight muscle behind the shoulder blade.",
    equipment: [],
    setup: "Sit tall on a firm chair. Hold the bottom of the seat with the hand on the side you want to stretch, to keep that shoulder down.",
    steps: [
      "Turn your head about 45 degrees towards the opposite armpit, so you are looking down and away from the tight side.",
      "Let your chin drop gently towards your chest until you feel a stretch behind the shoulder blade on the held side.",
      "Rest your other hand lightly on the back of your head to add a little weight, without pulling.",
      "Hold the stretch, then slowly lift your head and let go of the seat."
    ],
    cues: [
      "You are looking down towards your armpit, not straight down or straight to the side.",
      "The stretch is felt at the back and side of the neck, towards the shoulder blade.",
      "The shoulder being stretched stays down, anchored by your hand on the seat."
    ],
    mistakes: [
      "Pulling firmly on your head instead of letting its weight do the work.",
      "Letting the anchored shoulder shrug up, which loses the stretch.",
      "Bouncing or forcing into a stronger stretch.",
      "Stop and message your physio if it brings on dizziness, pins and needles in the arms or hands, or a severe or unusual headache."
    ],
    defaultDosage: {
      sets: 2,
      holdSeconds: 30,
      perDay: 2,
      perWeek: 7,
      tempo: "slow and controlled",
      notes: "Hold on each side, or just the tighter side if your physio advises."
    }
  },
  {
    id: "ex-31", title: "Lumbar Flexion in Lying", bodyPart: "Lumbar spine",
    slug: "lumbar-flexion-in-lying",
    clinicalArea: "spine", tags: ["low-back", "stenosis", "flexion-bias", "early-rehab"],
    condition: "Lumbar spinal stenosis", stage: "Early rehab",
    description: "Gently drawing both knees toward the chest to ease stenosis-related symptoms, which typically prefer flexion over extension.",
    equipment: ["Exercise mat"],
    setup: "Lie on your back on a mat with your knees bent and your feet flat on the floor.",
    steps: [
      "Bring one knee up towards your chest, then the other.",
      "Hold gently behind your thighs and draw both knees a little closer.",
      "Feel a comfortable stretch in your lower back and hold it briefly.",
      "Lower one leg back down at a time to the starting position."
    ],
    cues: [
      "You hold behind your thighs, not over the front of your knees.",
      "The stretch is felt in your lower back and feels like relief.",
      "Your head and shoulders stay resting on the mat."
    ],
    mistakes: [
      "Pulling hard and fast into the stretch.",
      "Lifting your head and neck up towards your knees.",
      "Lowering both legs together, which can strain your back — bring them down one at a time.",
      "Stop and message your physio if the pain spreads further down your leg, or you notice new numbness, pins and needles, or weakness."
    ],
    defaultDosage: { sets: 1, reps: 10, perDay: 3, perWeek: 7, tempo: "slow and controlled" }
  },
  {
    id: "ex-32", title: "Sciatic Nerve Glide", bodyPart: "Lumbar spine",
    slug: "sciatic-nerve-glide",
    clinicalArea: "spine", tags: ["low-back", "sciatica", "neural-mobility", "early-rehab"],
    condition: "Sciatica", stage: "Early rehab",
    description: "A gentle sliding nerve mobilisation of the leg and ankle to ease nerve-related sensitivity down the leg.",
    equipment: ["Chair"],
    setup: "Sit tall on a firm chair with both feet flat on the floor and your hands resting on your thighs.",
    steps: [
      "Straighten the affected leg out in front of you until the knee is nearly straight, and at the same time lift your head to look up.",
      "As you bend that knee down and lower your foot, tuck your chin and look down.",
      "Move smoothly between the two positions, like a gentle see-saw."
    ],
    cues: [
      "The movement is smooth and rhythmic, never forced or held at the end.",
      "You feel a light pull or gentle stretch that eases off as you return.",
      "You keep the movement small if your symptoms are easily stirred up, and larger only if it stays comfortable."
    ],
    mistakes: [
      "Pushing into a strong stretch or holding the end position.",
      "Doing lots of fast repetitions and flaring your symptoms afterwards.",
      "Stop and message your physio if the pain spreads further down your leg, or you notice new or worse numbness, pins and needles, or weakness in your leg or foot."
    ],
    defaultDosage: { sets: 1, reps: 8, perDay: 2, perWeek: 7, tempo: "slow, no forcing" }
  },
  {
    id: "ex-33",
    slug: "wall-angels",
    title: "Wall Angels",
    bodyPart: "Thoracic spine",
    clinicalArea: "spine",
    tags: ["mid-back", "posture", "strength-phase"],
    condition: "Postural thoracic pain",
    stage: "Strength phase",
    description: "Sliding the arms up and down a wall while keeping contact, retraining shoulder-blade control and upright posture.",
    equipment: [],
    pose: "wallSlide",
    setup: "Stand with your back against a wall and your feet about a foot away from it, knees slightly bent. Gently flatten your lower back towards the wall.",
    steps: [
      "Place the backs of your arms and hands against the wall in a goalpost shape, with your elbows bent to about a right angle.",
      "Keeping your arms, hands and back in contact with the wall, slowly slide your arms up until they are nearly straight.",
      "Slide your arms back down to the goalpost position, staying in contact the whole way.",
      "Move slowly and stop wherever you can no longer keep contact with the wall."
    ],
    cues: [
      "Your lower back and the backs of your wrists stay lightly on the wall throughout.",
      "Your ribs stay down - you do not arch your back to reach higher.",
      "The work is felt around your shoulder blades and upper back."
    ],
    mistakes: [
      "Arching your lower back away from the wall to get more range.",
      "Shrugging your shoulders up towards your ears as you slide up.",
      "Forcing the arms higher than they will go while keeping contact with the wall.",
      "Stop and message your physio if it brings on pins and needles in your arms or hands, or pain that spreads down your arm."
    ],
    defaultDosage: { sets: 3, reps: 10, perDay: 1, perWeek: 5, tempo: "slow and controlled" }
  },
  {
    id: "ex-34", title: "Functional Lifting Pattern", bodyPart: "Lumbar spine",
    slug: "functional-lifting-pattern",
    clinicalArea: "spine", tags: ["low-back", "return-to-work", "return-to-function"],
    condition: "Chronic low back pain", stage: "Return to function",
    description: "Practising a hip-hinge lifting technique with a light load, building confidence for safe lifting at work or home.",
    equipment: ["A light box or household object"],
    setup: "Stand with your feet about shoulder-width apart, with a light object on the floor just in front of you.",
    steps: [
      "Step in close so the object is between or just in front of your feet.",
      "Push your hips back and bend your knees to lower towards it, keeping your back in its natural line.",
      "Take a firm hold and gently brace your tummy.",
      "Push through your feet and straighten your hips and knees to stand up, keeping the object close to your body.",
      "Lower it back down the same way, hips back and knees bending."
    ],
    cues: [
      "Your back keeps its natural curve — it does not round or over-arch.",
      "The object stays close to your body throughout the lift.",
      "The power comes from your hips and legs, and you breathe out as you lift."
    ],
    mistakes: [
      "Reaching for the load with straight legs and a rounded back.",
      "Twisting your body while holding the object — turn by stepping your feet instead.",
      "Adding weight too quickly or trying too heavy a load too soon.",
      "Stop and message your physio if the pain spreads down your leg, or you notice new numbness, pins and needles, or weakness."
    ],
    defaultDosage: { sets: 2, reps: 10, perDay: 1, perWeek: 5 }
  },
  {
    id: "ex-35",
    slug: "shoulder-external-rotation-band",
    title: "Shoulder External Rotation (Band)",
    bodyPart: "Shoulder",
    clinicalArea: "upper_limb",
    tags: ["shoulder", "rotator-cuff", "strength-phase"],
    condition: "Rotator cuff tendinopathy",
    stage: "Strength phase",
    description: "Elbow tucked to the side, rotating the forearm outward against light resistance to strengthen the rotator cuff.",
    pose: "bandRotation",
    equipment: ["A resistance band", "A rolled hand towel"],
    setup: "Anchor a resistance band at about elbow height, such as in a closed door. Stand side-on and hold the band in the hand furthest from the anchor. Tuck that elbow into your side, bent to 90 degrees, with a rolled towel held between your elbow and your ribs.",
    steps: [
      "Start with your forearm across your tummy and the band under light tension.",
      "Keeping your elbow pinned to your side, rotate your forearm outwards, away from your body.",
      "Rotate to a comfortable end point, then return slowly to the start against the band."
    ],
    cues: [
      "The towel stays gently squeezed against your side the whole time.",
      "Only your forearm moves - like a gate swinging on a hinge.",
      "Keep your wrist straight and your shoulder relaxed down."
    ],
    mistakes: [
      "Letting the elbow drift away from your body.",
      "Twisting your whole torso to move the band instead of rotating the shoulder.",
      "Using a band so strong the movement becomes a struggle.",
      "Stop and message your physio if you get sharp pain in the shoulder or a painful catching sensation."
    ],
    defaultDosage: { sets: 3, reps: 12, perDay: 1, perWeek: 4, tempo: "2 seconds out, 3 seconds back" }
  },
  {
    id: "ex-36",
    slug: "shoulder-internal-rotation-band",
    title: "Shoulder Internal Rotation (Band)",
    bodyPart: "Shoulder",
    clinicalArea: "upper_limb",
    tags: ["shoulder", "rotator-cuff", "strength-phase"],
    condition: "Rotator cuff tendinopathy",
    stage: "Strength phase",
    description: "The mirrored inward rotation movement, balancing strength around the shoulder joint.",
    pose: "bandRotation",
    equipment: ["A resistance band", "A rolled hand towel"],
    setup: "Anchor a resistance band at about elbow height. Stand side-on so the anchor is on the same side as the arm you are working. Hold the band in that hand, tuck your elbow into your side bent to 90 degrees, with a rolled towel between your elbow and your ribs.",
    steps: [
      "Start with your forearm turned slightly outwards and the band under light tension.",
      "Keeping your elbow tucked in, rotate your forearm inwards across your tummy.",
      "Return slowly to the start, controlling the band all the way back."
    ],
    cues: [
      "The towel stays tucked against your side throughout.",
      "The movement comes from the shoulder rotating, not from leaning your body.",
      "Slow and controlled in both directions."
    ],
    mistakes: [
      "Letting the elbow lift away from the ribs.",
      "Rotating the trunk instead of the shoulder.",
      "Snapping back to the start rather than controlling the return.",
      "Stop and message your physio if the movement becomes sharply painful or the shoulder feels unstable."
    ],
    defaultDosage: { sets: 3, reps: 12, perDay: 1, perWeek: 4, tempo: "2 seconds in, 3 seconds back" }
  },
  {
    id: "ex-37",
    slug: "wall-slide",
    title: "Wall Slide",
    bodyPart: "Shoulder",
    clinicalArea: "upper_limb",
    tags: ["shoulder", "impingement", "mobility"],
    condition: "Shoulder impingement",
    stage: "Mobility phase",
    description: "Sliding the arms up a wall keeping contact throughout, restoring overhead range without excess strain.",
    pose: "wallSlide",
    setup: "Stand facing a wall, about a forearm's length away. Place the little-finger edge of both hands and forearms flat against the wall, elbows bent, roughly in a goalpost shape.",
    steps: [
      "Keeping your forearms and hands in contact with the wall, slide them slowly upwards.",
      "Go as high as you can while keeping contact and without pain or shrugging.",
      "Slide slowly back down to the start, gently drawing your shoulder blades down as you lower."
    ],
    cues: [
      "Keep your ribs down and your lower back flat - do not arch to reach higher.",
      "Forearms stay on the wall the whole way up and down.",
      "Shoulders stay away from your ears."
    ],
    mistakes: [
      "Arching the back to gain height.",
      "Letting the forearms peel off the wall.",
      "Forcing past a painful or pinching point.",
      "Stop and message your physio if the shoulder pinches sharply or catches each time you lift."
    ],
    defaultDosage: { sets: 3, reps: 10, perDay: 1, perWeek: 5, tempo: "slow" }
  },
  {
    id: "ex-38",
    slug: "sleeper-stretch",
    title: "Sleeper Stretch",
    bodyPart: "Shoulder",
    clinicalArea: "upper_limb",
    tags: ["shoulder", "internal-rotation", "mobility"],
    condition: "Shoulder stiffness",
    stage: "Mobility phase",
    description: "Side-lying gentle pressure on the forearm to restore internal rotation range, common after overhead sports.",
    equipment: [],
    setup: "Lie on the stiff side with that arm out in front of you, the shoulder bent to a right angle and the elbow bent to a right angle so your hand points at the ceiling. Rest your head on a small pillow.",
    steps: [
      "Roll your body a little way forwards so your weight pins the shoulder blade under you.",
      "With your top hand, gently press your bottom forearm and hand down towards the floor.",
      "Stop when you feel a gentle stretch at the back of the shoulder.",
      "Hold there, then use the top hand to ease the forearm back up slowly."
    ],
    cues: [
      "The stretch is felt at the back of the shoulder, not the front.",
      "Use slow, steady pressure - the forearm moves only a small way.",
      "Keep the shoulder blade tucked under your body so the movement happens at the joint."
    ],
    mistakes: [
      "Pressing down hard or quickly.",
      "Pushing on into a pinch at the front of the shoulder - ease off and use less range.",
      "Letting the shoulder blade lift and roll back so the stretch is lost.",
      "Stop and message your physio if you get sharp pain at the front of the shoulder or pins and needles down the arm."
    ],
    defaultDosage: { sets: 3, holdSeconds: 30, perDay: 2, perWeek: 7, notes: "Do this on the stiff side only." }
  },
  {
    id: "ex-39",
    slug: "prone-y-t-w-raises",
    title: "Prone Y-T-W Raises",
    bodyPart: "Shoulder",
    clinicalArea: "upper_limb",
    tags: ["shoulder", "scapular-control", "strength-phase"],
    condition: "Scapular dyskinesis",
    stage: "Strength phase",
    description: "Lying face down, lifting the arms into Y, T and W positions to retrain scapular muscle balance.",
    equipment: ["Exercise mat", "A rolled towel for your forehead"],
    setup: "Lie face down on a mat with your legs straight and your forehead resting on a rolled towel so your neck stays long. Let your arms hang off the mat towards the floor.",
    steps: [
      "Reach both arms overhead into a Y shape, thumbs pointing up, and lift them a small way off the floor, then lower.",
      "Take both arms straight out to the sides at shoulder height into a T, thumbs up, squeeze your shoulder blades together and lift, then lower.",
      "Bend your elbows down by your sides into a W, draw them back and down and lift, then lower.",
      "Move through the Y, then the T, then the W to complete one set."
    ],
    cues: [
      "Start each lift by drawing your shoulder blades down and towards your spine.",
      "The lift is small - your hands come just clear of the floor.",
      "Your neck stays long and your gaze stays down at the mat.",
      "No shrugging your shoulders up towards your ears."
    ],
    mistakes: [
      "Shrugging the shoulders up to lift the arms.",
      "Arching your lower back to raise the arms higher.",
      "Rushing the lifts instead of moving slowly.",
      "Stop and message your physio if you get pain at the front or top of the shoulder, or tingling into the arm."
    ],
    defaultDosage: {
      sets: 3,
      reps: 8,
      perDay: 1,
      perWeek: 5,
      notes: "Do 8 lifts in each of the Y, T and W positions to make one set. Add light hand weights (about 0.5 kg) only once the movement stays clean and pain-free."
    }
  },
  {
    id: "ex-40",
    slug: "elbow-flexion-extension",
    title: "Elbow Flexion/Extension",
    bodyPart: "Elbow",
    clinicalArea: "upper_limb",
    tags: ["elbow", "range-of-motion", "early-rehab"],
    condition: "Post-elbow fracture",
    stage: "Early rehab",
    description: "Slow bending and straightening of the elbow through the available range to prevent stiffness after immobilisation.",
    equipment: [],
    setup: "Sit at a table with your upper arm resting on the table and your forearm and hand free to move over the edge, palm facing up. If that is awkward, rest the arm on a pillow on your lap.",
    steps: [
      "Slowly bend your elbow, bringing your hand up towards your shoulder as far as it comfortably goes.",
      "Pause for a moment at the end of the movement.",
      "Slowly straighten the elbow as far as it comfortably goes.",
      "Let the arm relax at each end rather than pushing hard against the stiffness."
    ],
    cues: [
      "Move only into a gentle stretch feeling, never into sharp pain.",
      "The bending and straightening are slow and smooth.",
      "Keep the rest of your arm and shoulder relaxed."
    ],
    mistakes: [
      "Forcing into a hard stretch, or letting someone crank the elbow for you.",
      "Hanging a weight from the hand to force the elbow straight.",
      "Skipping days and then doing a lot in one go.",
      "Stop and message your physio if the elbow becomes hot or swollen, feels like it is blocking, or gets noticeably stiffer over a few days."
    ],
    defaultDosage: {
      reps: 10,
      perDay: 4,
      perWeek: 7,
      tempo: "slow and controlled",
      notes: "Little and often works best - a few gentle sets spread through the day."
    }
  },
  {
    id: "ex-41",
    slug: "wrist-extensor-stretch",
    title: "Wrist Extensor Stretch",
    bodyPart: "Wrist",
    clinicalArea: "upper_limb",
    tags: ["wrist", "tennis-elbow", "mobility"],
    condition: "Lateral epicondylalgia (tennis elbow)",
    stage: "Mobility phase",
    description: "Gently pulling the wrist into flexion with the elbow straight to stretch the overloaded forearm extensors.",
    equipment: [],
    setup: "Sit or stand tall. Straighten the sore arm out in front of you at shoulder height, with the elbow completely straight and the palm facing down.",
    steps: [
      "Let your wrist and fingers drop so they point towards the floor.",
      "With your other hand, gently press on the back of the hand to bend the wrist further.",
      "Stop when you feel a stretch along the top of the forearm, near the elbow.",
      "Hold there, then slowly release the pressure."
    ],
    cues: [
      "The elbow stays locked straight - that is what puts the stretch on the muscle.",
      "The stretch is felt along the top of the forearm, not in the elbow bone.",
      "Use a gentle, steady pull, never a sharp one."
    ],
    mistakes: [
      "Letting the elbow bend, which loses the stretch.",
      "Pulling the hand down quickly or bouncing.",
      "Pushing into pain right on the bony point of the elbow.",
      "Stop and message your physio if the stretch sharply worsens the pain at the outside of the elbow, or brings on pins and needles in the hand."
    ],
    defaultDosage: { sets: 3, holdSeconds: 30, perDay: 3, perWeek: 7 }
  },
  {
    id: "ex-42",
    slug: "eccentric-wrist-extension",
    title: "Eccentric Wrist Extension",
    bodyPart: "Wrist",
    clinicalArea: "upper_limb",
    tags: ["wrist", "tennis-elbow", "strength-phase"],
    condition: "Lateral epicondylalgia (tennis elbow)",
    stage: "Strength phase",
    description: "Slowly lowering a light weight through wrist extension, the evidence-based loading approach for tendon pain.",
    equipment: ["A light dumbbell, starting around 0.5 to 1 kg", "A table or your thigh to rest the forearm on"],
    setup: "Sit with your forearm resting along a table or your thigh, palm facing down, with your hand and the weight just over the edge. Hold the weight loosely.",
    steps: [
      "Use your other hand to lift the weight up so the wrist is bent fully back.",
      "Let go with the helping hand so the sore side is holding the weight up.",
      "Slowly lower the weight over about three to four seconds until the wrist is fully bent down.",
      "Help the weight back up to the top with your other hand, then repeat. Only the lowering is done by the sore side."
    ],
    cues: [
      "Count three to four seconds on every lower - slow and even.",
      "The lift back to the top is done with the other hand, not the sore wrist.",
      "Some ache in the forearm during and after is expected, as long as it settles within 24 hours."
    ],
    mistakes: [
      "Lowering quickly or letting the weight drop.",
      "Raising the weight back up with the sore side.",
      "Adding weight too soon, before three sets of the current weight feel controlled.",
      "Stop and message your physio if the pain is sharp, spreads down the arm, or is clearly worse day to day."
    ],
    defaultDosage: {
      sets: 3,
      reps: 15,
      perDay: 1,
      perWeek: 7,
      tempo: "3 to 4 seconds to lower",
      notes: "Expect some forearm ache during and after - this is a loading exercise and the ache should settle within a day. Add a small amount of weight only once 3 sets of 15 feel easy."
    }
  },
  {
    id: "ex-43",
    slug: "wrist-flexor-stretch",
    title: "Wrist Flexor Stretch",
    bodyPart: "Wrist",
    clinicalArea: "upper_limb",
    tags: ["wrist", "golfers-elbow", "mobility"],
    condition: "Medial epicondylalgia (golfer's elbow)",
    stage: "Mobility phase",
    description: "Gently pulling the wrist into extension with the elbow straight to stretch the forearm flexors.",
    equipment: [],
    setup: "Sit or stand tall. Straighten the sore arm out in front of you at shoulder height, with the elbow completely straight and the palm facing forwards, fingers pointing up.",
    steps: [
      "With your other hand, gently pull your fingers and palm back towards your body.",
      "Stop when you feel a stretch along the underside of the forearm, towards the inner elbow.",
      "Hold there, then slowly release."
    ],
    cues: [
      "The elbow stays fully straight throughout.",
      "The stretch is felt along the palm side of the forearm, not in the inner elbow bone.",
      "Use a gentle, steady pull, never a sharp one."
    ],
    mistakes: [
      "Letting the elbow bend, which loses the stretch.",
      "Pulling the hand back quickly or bouncing.",
      "Pushing into pain right on the bony point of the inner elbow.",
      "Stop and message your physio if the stretch sharply worsens the inner-elbow pain, or brings on pins and needles in the ring and little fingers."
    ],
    defaultDosage: { sets: 3, holdSeconds: 30, perDay: 3, perWeek: 7 }
  },
  {
    id: "ex-44",
    slug: "grip-strengthening",
    title: "Grip Strengthening",
    bodyPart: "Hand",
    clinicalArea: "upper_limb",
    tags: ["hand", "grip", "strength-phase"],
    condition: "Hand weakness",
    stage: "Strength phase",
    description: "Repeated squeezing of a soft ball or putty to rebuild grip strength lost after injury or immobilisation.",
    equipment: ["A soft ball or a piece of therapy putty"],
    pose: "gripSqueeze",
    setup: "Sit with your forearm resting on a table or your thigh, holding a soft ball or a rolled piece of putty in your palm.",
    steps: [
      "Squeeze the ball by closing all your fingers and your thumb around it.",
      "Hold the squeeze for about five seconds.",
      "Slowly open your hand and release the ball fully.",
      "Rest for a moment, then repeat."
    ],
    cues: [
      "The squeeze is firm but stops short of sharp pain.",
      "All your fingers and your thumb wrap right around the ball.",
      "Your forearm does the work - your shoulder and neck stay relaxed."
    ],
    mistakes: [
      "Gripping so hard that your knuckles hurt or your wrist cramps.",
      "Holding your breath during the squeeze.",
      "Racing through without opening the hand fully each time.",
      "Stop and message your physio if squeezing brings on numbness or pins and needles in the fingers, or pain in the wrist joint."
    ],
    defaultDosage: {
      sets: 3,
      reps: 10,
      perDay: 2,
      perWeek: 6,
      tempo: "squeeze and hold about 5 seconds",
      notes: "Build up the squeeze force gradually over the weeks. This can be done more than once a day as symptoms allow."
    }
  },
  {
    id: "ex-45",
    slug: "tendon-glide-exercises",
    title: "Tendon Glide Exercises",
    bodyPart: "Hand",
    clinicalArea: "upper_limb",
    tags: ["hand", "carpal-tunnel", "early-rehab"],
    condition: "Carpal tunnel syndrome",
    stage: "Early rehab",
    description: "A sequence of finger positions gliding the flexor tendons through the wrist to reduce stiffness and nerve irritation.",
    equipment: [],
    pose: "gripSqueeze",
    setup: "Sit or stand with your forearm supported and your wrist held straight, in line with your forearm, and your fingers held out straight.",
    steps: [
      "Start with your fingers straight, in line with your wrist.",
      "Bend the top two knuckles of each finger to make a hook shape, keeping the base knuckles straight.",
      "Curl the fingers the rest of the way into a full fist, thumb resting over the front.",
      "Open to a tabletop shape - base knuckles bent to a right angle, fingers straight.",
      "From the tabletop, curl the finger joints to make a straight fist, then open the hand fully to finish."
    ],
    cues: [
      "Hold each shape for a few seconds and move slowly between them.",
      "The wrist stays still and straight the whole time.",
      "Each shape should feel like a gentle stretch, not a strong pull."
    ],
    mistakes: [
      "Forcing the fingers into a shape that is stiff or painful.",
      "Rushing through the positions.",
      "Stop and message your physio if the tingling or numbness sharply worsens, spreads into more of the hand, or does not settle soon after you stop - a glide should not bring on strong pins and needles."
    ],
    defaultDosage: {
      sets: 2,
      reps: 5,
      perDay: 3,
      perWeek: 7,
      tempo: "slow and controlled",
      notes: "One rep is one slow pass through all five hand shapes and back to straight fingers."
    }
  },
  {
    id: "ex-46",
    slug: "median-nerve-glide",
    title: "Median Nerve Glide",
    bodyPart: "Wrist",
    clinicalArea: "upper_limb",
    tags: ["wrist", "carpal-tunnel", "neural-mobility"],
    condition: "Carpal tunnel syndrome",
    stage: "Early rehab",
    description: "A gentle nerve mobilisation moving the wrist and fingers through positions that glide the median nerve.",
    equipment: [],
    setup: "Sit or stand tall with your arm out to the side at shoulder height, elbow straight and palm facing up, with your wrist and fingers relaxed.",
    steps: [
      "Gently bend your wrist and fingers back, as if signalling 'stop', while tilting your head towards that same arm.",
      "As you let the wrist and fingers relax back to the start, tilt your head away to the other side.",
      "Move smoothly between the two positions, like a gentle see-saw."
    ],
    cues: [
      "The movement is smooth and rhythmic, never forced or held at the end.",
      "You feel a light pull or gentle stretch that eases off as you return.",
      "Keep the movement small if your symptoms are easily stirred up, and larger only if it stays comfortable."
    ],
    mistakes: [
      "Pushing into a strong stretch or holding the end position.",
      "Doing lots of fast repetitions and flaring your symptoms afterwards.",
      "Carrying on through rising pins and needles - a nerve glide should not provoke strong tingling.",
      "Stop and message your physio if the pins and needles or numbness sharply worsen, spread further into the hand or arm, or do not settle soon after you stop."
    ],
    defaultDosage: { sets: 1, reps: 8, perDay: 2, perWeek: 7, tempo: "slow, no forcing" }
  },
  {
    id: "ex-47",
    slug: "scapular-retraction-band-row",
    title: "Scapular Retraction (Band Row)",
    bodyPart: "Shoulder",
    clinicalArea: "upper_limb",
    tags: ["shoulder", "postural-control", "strength-phase"],
    condition: "Shoulder impingement",
    stage: "Strength phase",
    description: "Pulling a resistance band toward the chest, squeezing the shoulder blades together to build postural shoulder strength.",
    equipment: ["A resistance band", "A door anchor or a sturdy rail to loop the band around at chest height"],
    pose: "scapularSet",
    setup: "Sit or stand tall facing the anchor point, holding one end of the band in each hand with your arms out in front and a light tension already on the band.",
    steps: [
      "Keeping your shoulders down and relaxed, pull your elbows straight back past your ribs.",
      "As you pull, draw your shoulder blades down and together.",
      "Pause for a moment at the end of the pull.",
      "Slowly return to the start, keeping tension on the band and control in the movement."
    ],
    cues: [
      "The movement starts from the shoulder blades, not the hands.",
      "Your elbows stay low, brushing past your sides rather than flaring up.",
      "Your chest stays open and your neck long - no shrugging.",
      "You feel the work between and just below the shoulder blades."
    ],
    mistakes: [
      "Shrugging the shoulders up towards the ears.",
      "Leaning back or twisting the trunk to yank the band.",
      "Letting the band pull your arms forwards quickly on the way back.",
      "Stop and message your physio if you get pinching pain at the front or top of the shoulder, or tingling down the arm."
    ],
    defaultDosage: { sets: 3, reps: 12, perDay: 1, perWeek: 5 }
  },
  {
    id: "ex-48",
    slug: "overhead-press-progression",
    title: "Overhead Press Progression",
    bodyPart: "Shoulder",
    clinicalArea: "upper_limb",
    tags: ["shoulder", "return-to-function"],
    condition: "Shoulder impingement",
    stage: "Return to function",
    description: "A light, controlled overhead press building the strength and confidence to return to lifting or overhead sport.",
    equipment: ["A light weight in each hand, such as small dumbbells or filled water bottles"],
    pose: "overheadReach",
    setup: "Sit or stand tall with a light weight in each hand, held at shoulder height with your elbows bent and your palms facing forwards.",
    steps: [
      "Gently set your shoulder blades down and back.",
      "Press the weights up and slightly in towards each other until your arms are straight overhead.",
      "Pause for a moment at the top.",
      "Lower the weights slowly back to shoulder height with control."
    ],
    cues: [
      "The press moves in a smooth line, with no painful catch on the way up.",
      "Your ribs stay down - do not arch your lower back to get the arms up.",
      "Move at the same slow speed up and down.",
      "Keep a small gap between your shoulders and your ears."
    ],
    mistakes: [
      "Using a weight that makes you shrug, hold your breath, or lean back.",
      "Pressing quickly or letting the weight drop on the way down.",
      "Pushing through a sharp catch partway up.",
      "Stop and message your physio if the shoulder pain sharpens, wakes you at night, or you lose noticeable strength lifting the arm."
    ],
    defaultDosage: {
      sets: 3,
      reps: 10,
      perDay: 1,
      perWeek: 5,
      notes: "Start by pressing only to eye or forehead height and build towards fully overhead as it stays comfortable. Add weight only once the movement is easy and pain-free."
    }
  },
  {
    id: "ex-49",
    slug: "weight-bearing-through-extended-wrist",
    title: "Weight-Bearing Through Extended Wrist",
    bodyPart: "Wrist",
    clinicalArea: "upper_limb",
    tags: ["wrist", "post-fracture", "return-to-function"],
    condition: "Post-wrist fracture",
    stage: "Return to function",
    description: "Gradually loading body weight through a flat, extended hand to rebuild wrist tolerance for daily tasks.",
    equipment: ["A firm table or worktop"],
    setup: "Stand at a firm table with your palm flat on the surface, fingers spread and pointing forwards and your elbow straight. Start with only a little weight going through the arm.",
    steps: [
      "Slowly lean some of your body weight forwards through the flat hand.",
      "Hold for a few seconds, feeling a stretch and firm pressure across the front of the wrist.",
      "Ease the weight back off the hand.",
      "Over the days, lean a little further so the wrist bends back more and takes more load."
    ],
    cues: [
      "The load builds gradually - a stretch and firm pressure are fine, sharp pain is not.",
      "Your fingers stay spread and your whole palm stays in contact with the surface.",
      "Keep the elbow straight but not locked hard."
    ],
    mistakes: [
      "Dropping a lot of weight onto the wrist quickly.",
      "Pushing into sharp pain at the back of the wrist.",
      "Moving on to taking weight on all fours before the standing version is comfortable.",
      "Stop and message your physio if the wrist swells, clicks painfully, or the pain is clearly worse the next day."
    ],
    defaultDosage: {
      sets: 3,
      holdSeconds: 20,
      perDay: 1,
      perWeek: 6,
      notes: "Progress by leaning further forwards and, once that is comfortable, moving towards taking weight through the hands on all fours."
    }
  },
  {
    id: "ex-50",
    slug: "pendulum-with-light-weight",
    title: "Pendulum with Light Weight",
    bodyPart: "Shoulder",
    clinicalArea: "upper_limb",
    tags: ["shoulder", "frozen-shoulder", "early-rehab"],
    condition: "Frozen shoulder",
    stage: "Early rehab",
    description: "A weighted pendulum swing using gravity to gently distract and mobilise a stiff, painful shoulder joint.",
    equipment: [
      "A light weight, about 1 kg, such as a small dumbbell, a tin, or a filled water bottle",
      "A sturdy table or chair to lean on"
    ],
    pose: "pendulum",
    setup: "Stand and lean forwards from the hips, resting your good hand on a table or chair for support. Let the stiff arm hang straight down towards the floor, holding the light weight.",
    steps: [
      "Let the arm hang heavy and loose so the weight pulls it gently towards the floor.",
      "Using a small rocking of your body, start the arm swinging gently forwards and backwards.",
      "Let it settle, then rock side to side so the arm swings across and back.",
      "Finally let the arm circle, a small circle one way and then the other.",
      "Let the arm come to rest, then stand back up."
    ],
    cues: [
      "The weight and gravity do the work - your shoulder muscles stay switched off.",
      "The swing is driven by shifting your body weight, not by muscling the arm.",
      "Keep the circles small, about the size of a dinner plate."
    ],
    mistakes: [
      "Actively lifting or muscling the arm to make it swing.",
      "Using a weight so heavy that the shoulder tenses up to hold it.",
      "Swinging fast or wide.",
      "Stop and message your physio if the pain becomes severe, is constant through the night and getting worse, or the arm feels weak or numb."
    ],
    defaultDosage: {
      reps: 15,
      perDay: 3,
      perWeek: 7,
      tempo: "slow and relaxed",
      notes: "A short set several times a day works better than one long session. The shoulder should feel looser, not more sore, afterwards."
    }
  },
  {
    id: "ex-51",
    slug: "cross-body-stretch",
    title: "Cross-Body Stretch",
    bodyPart: "Shoulder",
    clinicalArea: "upper_limb",
    tags: ["shoulder", "posterior-capsule", "mobility"],
    condition: "Posterior shoulder tightness",
    stage: "Mobility phase",
    description: "Pulling the arm across the chest to stretch the back of the shoulder, often tight after throwing or racquet sports.",
    equipment: [],
    setup: "Sit or stand tall. Bring the tight arm up to shoulder height and reach it across the front of your body.",
    steps: [
      "Use your other hand to support the arm just above the elbow.",
      "Gently draw the arm further across your chest until you feel a stretch at the back of the shoulder.",
      "Keep the stretched shoulder down, not hitched up towards your ear.",
      "Hold there, then slowly release."
    ],
    cues: [
      "The stretch is felt at the back of the shoulder, not the front or the elbow.",
      "Keep the shoulder blade down and the shoulder away from your ear.",
      "Use a gentle, steady pull with no bouncing."
    ],
    mistakes: [
      "Pulling on the elbow joint itself instead of supporting the upper arm.",
      "Hunching or twisting the trunk to force more range.",
      "Shrugging the stretched shoulder up towards your ear.",
      "Stop and message your physio if you feel a sharp pinch at the front of the shoulder, or pins and needles into the hand."
    ],
    defaultDosage: { sets: 3, holdSeconds: 30, perDay: 2, perWeek: 7 }
  },
  {
    id: "ex-52",
    slug: "push-up-plus-wall-or-floor",
    title: "Push-Up Plus (Wall or Floor)",
    bodyPart: "Shoulder",
    clinicalArea: "upper_limb",
    tags: ["shoulder", "scapular-control", "return-to-function"],
    condition: "Scapular dyskinesis",
    stage: "Return to function",
    description: "A standard push-up with an extra protraction at the top to fully engage the serratus anterior for scapular control.",
    pose: "pushUpPlus",
    setup: "Start against a wall (easiest), on your knees on the floor (harder), or in a full push-up position (hardest). Hands about shoulder-width apart.",
    steps: [
      "Lower yourself towards the wall or floor by bending your elbows, keeping your body in a straight line.",
      "Push back up until your elbows are straight.",
      "At the top, add the 'plus': push a little further so your upper back rounds gently and your shoulder blades spread apart.",
      "Let the shoulder blades draw back together as you start the next repetition."
    ],
    cues: [
      "Keep your neck long and your body straight from head to heels, or head to knees.",
      "The 'plus' is a small extra push from the shoulder blades, not a big shrug.",
      "Move smoothly and do not let your lower back sag."
    ],
    mistakes: [
      "Letting the hips drop so the back arches.",
      "Skipping the 'plus' at the top - that is the part that trains scapular control.",
      "Shrugging the shoulders towards the ears.",
      "Stop and message your physio if you get sharp shoulder pain or painful clicking."
    ],
    defaultDosage: { sets: 3, reps: 10, perDay: 1, perWeek: 4 }
  },
  {
    id: "ex-53",
    slug: "terminal-knee-extension-band",
    title: "Terminal Knee Extension (Band)",
    bodyPart: "Knee",
    clinicalArea: "lower_limb",
    tags: ["knee", "quad-strength", "strength-phase"],
    condition: "Anterior knee pain",
    stage: "Strength phase",
    description: "A resisted band pulling the knee into slight flexion while the quad straightens it, targeting the final degrees of extension.",
    equipment: ["A resistance band", "A sturdy anchor point such as a table leg"],
    pose: "kneeExt",
    setup: "Loop a resistance band around a sturdy anchor at knee height and step through it so the band sits across the back of your knee. Stand facing the anchor with a slight bend in that knee, holding a chair for balance.",
    steps: [
      "Let the band pull your knee into a small bend to start.",
      "Tighten your thigh muscle to straighten the knee fully against the band's pull.",
      "Squeeze the thigh firmly for a moment with the knee locked straight.",
      "Slowly let the knee bend a little way again, controlling the band back."
    ],
    cues: [
      "The movement happens only at the knee - your hip and foot stay still.",
      "You feel your thigh muscle working, especially just above the kneecap, as you lock out.",
      "The straightening is a firm squeeze, not a snap."
    ],
    mistakes: [
      "Bending the knee too far - this exercise works only the last part of the straightening.",
      "Pushing your whole body backwards instead of straightening the knee.",
      "Rushing so the band pulls the knee back out of control.",
      "Stop and message your physio if the pain is sharp under the kneecap, or the knee swells after sessions."
    ],
    defaultDosage: {
      sets: 3,
      reps: 12,
      perDay: 1,
      perWeek: 5,
      notes: "Hold the fully straight position for about 3 seconds each rep."
    }
  },
  {
    id: "ex-54",
    slug: "step-up",
    title: "Step-Up",
    bodyPart: "Knee",
    clinicalArea: "lower_limb",
    tags: ["knee", "functional", "strength-phase"],
    condition: "Patellofemoral pain",
    stage: "Strength phase",
    description: "Stepping up onto a low step with control, building single-leg strength for stairs and functional movement.",
    equipment: ["A low step or the bottom stair", "A handrail or wall for balance"],
    setup: "Stand facing a low step, close enough to place one whole foot flat on it. Keep a handrail or wall within reach.",
    steps: [
      "Place your affected leg flat on the step.",
      "Push down through that foot to lift your body up onto the step, bringing the other foot up to meet it.",
      "Keep most of your weight on the leg that is on the step rather than pushing off the back foot.",
      "Step back down slowly, leading with the other foot, controlling the lower with the leg still on the step."
    ],
    cues: [
      "Your kneecap stays pointing forwards over your foot, not drifting inwards.",
      "Your hips stay level - the hip on the stepping side does not drop.",
      "The lift up and the lower down are both slow and controlled."
    ],
    mistakes: [
      "Choosing a step so high that your knee travels well past your toes or your hip drops.",
      "Pushing off hard with the trailing foot to cheat the lift.",
      "Letting the knee cave inwards on the way up or down.",
      "Stop and message your physio if the pain at the front of the knee rises during the session or lingers into the next day."
    ],
    defaultDosage: {
      sets: 3,
      reps: 10,
      perDay: 1,
      perWeek: 5,
      notes: "Do the full set leading with each leg. Start with a low step and raise the height as your control improves."
    }
  },
  {
    id: "ex-55",
    slug: "clam-shell",
    title: "Clam Shell",
    bodyPart: "Hip",
    clinicalArea: "lower_limb",
    tags: ["hip", "glute-strength", "early-rehab"],
    condition: "Hip and knee pain (gluteal weakness)",
    stage: "Early rehab",
    description: "Lying on the side with knees bent, lifting the top knee while keeping feet together to activate the gluteus medius.",
    equipment: ["Exercise mat"],
    setup: "Lie on your side on a mat with your hips and knees bent, your knees and feet stacked one on top of the other, and your head resting on your lower arm.",
    steps: [
      "Roll your top hip slightly forwards so you are not leaning back.",
      "Keeping your feet touching, lift your top knee upwards like a clam opening.",
      "Lift only as far as you can without your pelvis rolling backwards.",
      "Lower the knee back down slowly to meet the other."
    ],
    cues: [
      "Your feet stay together throughout.",
      "The movement comes from the hip, and you feel the muscle work in the side of your buttock.",
      "Your top hip stays pointing forwards, not rolling back as the knee lifts."
    ],
    mistakes: [
      "Rocking your whole pelvis backwards to make the knee go higher.",
      "Letting the top foot lift away from the bottom one.",
      "Holding your breath or tensing your neck.",
      "Stop and message your physio if you feel pinching deep in the front of the hip or groin."
    ],
    defaultDosage: { sets: 3, reps: 12, perDay: 1, perWeek: 5 }
  },
  {
    id: "ex-56",
    slug: "side-lying-hip-abduction",
    title: "Side-Lying Hip Abduction",
    bodyPart: "Hip",
    clinicalArea: "lower_limb",
    tags: ["hip", "glute-strength", "strength-phase"],
    condition: "Gluteal tendinopathy",
    stage: "Strength phase",
    description: "Lifting the top leg straight out to the side, building hip abductor strength important for pelvic control.",
    equipment: ["Exercise mat"],
    setup: "Lie on your side on a mat with both legs straight and in line with your body. Rest your head on your lower arm and place your top hand on the floor in front of you for balance.",
    steps: [
      "Keep your top leg straight and in line with your body, not forward of it.",
      "Lift the top leg towards the ceiling to about hip-width apart.",
      "Turn the toes very slightly down towards the floor as you lift.",
      "Lower the leg slowly back down, stopping just before it rests on the bottom leg."
    ],
    cues: [
      "The leg lifts straight up in line with your trunk, not drifting forwards.",
      "You feel the work in the side of your buttock, not the front of the hip or the lower back.",
      "Your waist stays long - do not let it sink towards the floor."
    ],
    mistakes: [
      "Lifting the leg too high or swinging it forwards, which uses the hip flexors instead.",
      "Letting your top hip roll backwards.",
      "Resting the leg all the way down between reps, which lets the load spike on each lift.",
      "Stop and message your physio if you get sharp pain on the bony point at the side of the hip, or pain lying on that side at night gets worse."
    ],
    defaultDosage: {
      sets: 3,
      reps: 10,
      perDay: 1,
      perWeek: 5,
      notes: "Build the reps up slowly - a tendon responds better to gradual load than to a sudden jump."
    }
  },
  {
    id: "ex-57",
    slug: "standing-hip-flexor-stretch",
    title: "Standing Hip Flexor Stretch",
    bodyPart: "Hip",
    clinicalArea: "lower_limb",
    tags: ["hip", "flexibility", "mobility"],
    condition: "Hip flexor tightness",
    stage: "Mobility phase",
    description: "A lunge-position stretch lengthening the front of the hip, often tight from prolonged sitting.",
    equipment: ["A wall or chair for balance"],
    pose: "hipStretch",
    setup: "Stand in a split stance with the leg to be stretched well behind you, both feet pointing forwards. Hold a wall or chair for balance.",
    steps: [
      "Gently tighten your lower tummy and the buttock of the back leg to tuck your tailbone under.",
      "Keeping your body upright, shift your weight forwards over your front foot.",
      "Feel a stretch across the front of the hip and the top of the thigh of the back leg.",
      "Hold the stretch, breathing steadily, then ease out."
    ],
    cues: [
      "You feel the stretch at the front of the hip of the back leg, not in your lower back.",
      "Your upper body stays tall and upright, not leaning forwards.",
      "The gentle buttock squeeze deepens the stretch without arching your back."
    ],
    mistakes: [
      "Arching your lower back instead of tucking the tailbone under.",
      "Letting the front knee travel far past your toes.",
      "Bouncing in and out of the stretch rather than holding it still.",
      "Stop and message your physio if the stretch brings on pinching in the groin or pain in the lower back."
    ],
    defaultDosage: {
      sets: 2,
      holdSeconds: 30,
      perDay: 2,
      perWeek: 7,
      tempo: "slow and controlled",
      notes: "Hold each stretch steady without bouncing. Stretch the tighter side, or both if both feel tight."
    }
  },
  {
    id: "ex-58",
    slug: "deep-squat-mobility",
    title: "Deep Squat Mobility",
    bodyPart: "Hip",
    clinicalArea: "lower_limb",
    tags: ["hip", "mobility", "return-to-function"],
    condition: "Hip osteoarthritis",
    stage: "Return to function",
    description: "A supported deep squat hold to maintain functional hip and knee range for daily activities like gardening.",
    equipment: ["A sturdy rail, worktop, or door frame to hold"],
    pose: "squat",
    setup: "Stand facing a sturdy rail or worktop, feet a little wider than hip-width with your toes turned slightly out. Hold on with both hands.",
    steps: [
      "Holding the support, bend your hips and knees to lower into a squat as far as is comfortable.",
      "Use your arms to take some of your weight so you can sit lower with control.",
      "Settle into the lowest comfortable position and hold, letting your hips relax.",
      "Push back up through your feet, using your arms for help, to return to standing."
    ],
    cues: [
      "Your heels stay down, or as close to down as your ankles allow.",
      "Your knees stay in line with your toes, spreading slightly outwards.",
      "You breathe out and let the hips soften as you hold the low position."
    ],
    mistakes: [
      "Forcing depth to the point of sharp pain or a hard pinch in the hip or groin.",
      "Letting your knees collapse inwards.",
      "Holding your breath during the low hold.",
      "Stop and message your physio if the hip locks, catches, or is much more painful going down stairs afterwards."
    ],
    defaultDosage: {
      sets: 2,
      holdSeconds: 20,
      perDay: 2,
      perWeek: 7,
      tempo: "slow and controlled",
      notes: "You can also do slow repeated squats to the same depth instead of one long hold."
    }
  },
  {
    id: "ex-59",
    slug: "ankle-pump",
    title: "Ankle Pump",
    bodyPart: "Ankle",
    clinicalArea: "lower_limb",
    tags: ["ankle", "swelling", "early-rehab"],
    condition: "Ankle sprain (acute)",
    stage: "Early rehab",
    description: "Pointing and flexing the foot repeatedly to reduce swelling and maintain ankle mobility soon after injury.",
    pose: "anklePump",
    setup: "Sit or lie down with your injured leg supported straight out in front of you, ideally raised on a cushion so your foot is above hip height.",
    steps: [
      "Slowly point your foot away from you, as if pressing down a car pedal.",
      "Then pull your toes and foot back up towards your shin, as far as is comfortable.",
      "Move smoothly between the two positions, keeping the movement at the ankle only."
    ],
    cues: [
      "Your knee and thigh stay still - only the ankle and foot move.",
      "Work through as much range as you can without sharp pain.",
      "Keeping the leg raised while you do this helps drain the swelling."
    ],
    mistakes: [
      "Rushing - slow, full movements shift more fluid than fast tiny ones.",
      "Doing it with the leg hanging down, which lets swelling pool.",
      "Stop and message your physio if the ankle becomes much more swollen, hot, or painful, or you cannot put any weight through it."
    ],
    defaultDosage: { reps: 20, perDay: 5, notes: "In the first few days after injury, do a set every hour or two while you are awake, with the leg raised." }
  },
  {
    id: "ex-60",
    slug: "ankle-alphabet",
    title: "Ankle Alphabet",
    bodyPart: "Ankle",
    clinicalArea: "lower_limb",
    tags: ["ankle", "range-of-motion", "early-rehab"],
    condition: "Ankle sprain",
    stage: "Early rehab",
    description: "Tracing letters of the alphabet with the foot in the air to gently restore ankle range in every direction.",
    pose: "anklePump",
    setup: "Sit on a chair with your injured foot lifted slightly off the floor, or sit on the floor with the leg out in front of you.",
    steps: [
      "Imagine your big toe is a pencil.",
      "Slowly 'write' each letter of the alphabet in the air, from A to Z, making the letters as large as you comfortably can.",
      "Move from the ankle, keeping the rest of your leg still."
    ],
    cues: [
      "Big, slow letters - the aim is full range in every direction.",
      "Only your foot and ankle move; your knee stays quiet.",
      "A little discomfort at the end of range is fine; sharp pain is not."
    ],
    mistakes: [
      "Making tiny letters that barely move the ankle.",
      "Swinging the whole leg to form the letters.",
      "Stop and message your physio if pain sharply increases, or the ankle locks or gives way."
    ],
    defaultDosage: { reps: 2, perDay: 3, notes: "One repetition is tracing the whole alphabet A to Z once through." }
  },
  {
    id: "ex-61",
    slug: "resisted-ankle-eversion",
    title: "Resisted Ankle Eversion",
    bodyPart: "Ankle",
    clinicalArea: "lower_limb",
    tags: ["ankle", "instability", "strength-phase"],
    condition: "Chronic ankle instability",
    stage: "Strength phase",
    description: "A band pulling the foot inward while the peroneal muscles resist, key for lateral ankle stability.",
    pose: "bandRotation",
    equipment: ["A resistance band"],
    setup: "Sit with your injured leg out straight. Loop a resistance band around the outside edge of your foot and anchor the other end to something solid on the opposite side, so the band pulls your foot inwards.",
    steps: [
      "Start with your foot relaxed, letting the band pull it gently inwards.",
      "Slowly turn the sole of your foot outwards against the band, leading with the outside edge of the foot.",
      "Pause briefly at the end, then let the foot return slowly to the start."
    ],
    cues: [
      "Keep your knee and shin pointing straight up - the movement is at the ankle, not by rotating the whole leg.",
      "Control the return; do not let the band snap your foot back.",
      "You should feel the muscles on the outside of your shin and ankle working."
    ],
    mistakes: [
      "Turning the whole leg outwards from the hip instead of moving the ankle.",
      "Using a band so heavy the movement becomes jerky.",
      "Stop and message your physio if you feel sharp pain on the outside of the ankle, or it feels like it is giving way."
    ],
    defaultDosage: { sets: 3, reps: 15, perDay: 1, perWeek: 4, tempo: "slow and controlled" }
  },
  {
    id: "ex-62",
    slug: "single-leg-balance-on-foam",
    title: "Single Leg Balance on Foam",
    bodyPart: "Ankle",
    clinicalArea: "lower_limb",
    tags: ["ankle", "balance", "instability", "return-to-function"],
    condition: "Chronic ankle instability",
    stage: "Return to function",
    description: "Standing on one leg on an unstable surface, retraining ankle proprioception for sport and uneven ground.",
    pose: "balance",
    equipment: ["A cushion, folded towel, or balance pad"],
    setup: "Place a firm cushion or folded towel on the floor next to a wall or worktop you can reach out and touch. Stand on it with your injured leg.",
    steps: [
      "Lift your other foot just off the surface so you are balancing on the injured leg.",
      "Hold as steady as you can, keeping your standing knee slightly bent.",
      "When it feels easy, progress by folding your arms, then by turning your head slowly side to side, then by closing your eyes - only with support right next to you."
    ],
    cues: [
      "Fix your eyes on a point ahead to help you steady (until you progress to eyes closed).",
      "Let your ankle make small corrections rather than gripping hard with your toes.",
      "Keep your hips level, not dropping to one side."
    ],
    mistakes: [
      "Standing with a locked, straight knee.",
      "Holding the wall the whole time instead of using it only to catch yourself.",
      "Stop and message your physio if the ankle gives way sharply or becomes painful."
    ],
    defaultDosage: { sets: 3, holdSeconds: 30, perDay: 1, perWeek: 5 }
  },
  {
    id: "ex-63",
    slug: "calf-stretch-gastrocnemius",
    title: "Calf Stretch (Gastrocnemius)",
    bodyPart: "Ankle",
    clinicalArea: "lower_limb",
    tags: ["ankle", "achilles", "flexibility", "mobility"],
    condition: "Achilles tendinopathy",
    stage: "Mobility phase",
    description: "A straight-knee wall stretch lengthening the calf, easing tightness that loads the Achilles tendon.",
    pose: "calfStretch",
    setup: "Stand facing a wall, an arm's length away, with both hands on the wall at shoulder height. Step the leg you want to stretch straight back, keeping that heel flat on the floor and that knee straight.",
    steps: [
      "Keep your back leg straight, heel down, and toes pointing forwards.",
      "Bend your front knee and lean your hips towards the wall until you feel a gentle stretch in the calf of the back leg.",
      "Hold the stretch still - do not bounce.",
      "Ease out slowly, and swap legs if both need it."
    ],
    cues: [
      "The stretch is felt in the middle of the calf, not behind the knee or in the Achilles tendon.",
      "Keep your back heel glued to the floor throughout.",
      "A steady pulling feeling is right; sharp or pinching pain is not."
    ],
    mistakes: [
      "Letting the back heel lift, which loses the stretch.",
      "Turning the back foot outwards.",
      "Bouncing to push further into range.",
      "Stop and message your physio if you get sharp pain in the Achilles tendon or the heel."
    ],
    defaultDosage: { sets: 3, holdSeconds: 30, perDay: 2, perWeek: 7 }
  },
  {
    id: "ex-64",
    slug: "eccentric-heel-drop",
    title: "Eccentric Heel Drop",
    bodyPart: "Ankle",
    clinicalArea: "lower_limb",
    tags: ["ankle", "achilles", "strength-phase"],
    condition: "Achilles tendinopathy",
    stage: "Strength phase",
    description: "Slowly lowering the heel below step level, the standard evidence-based loading exercise for Achilles tendon pain.",
    pose: "heelRaise",
    equipment: ["A step or stair with a handrail"],
    setup: "Stand on the edge of a step with the balls of both feet on the step and your heels hanging off the back. Hold the handrail for balance.",
    steps: [
      "Using both feet, rise up onto your toes.",
      "Shift your weight onto the injured leg and lift the other foot off the step.",
      "Slowly lower the heel of the injured leg down below the level of the step, taking about three to four seconds.",
      "Place the other foot back down and use both legs to return to the top. Only the lowering is done on one leg."
    ],
    cues: [
      "The lift back up is with both legs; the slow lower on one leg is the working part.",
      "Keep the movement smooth and controlled all the way to the bottom.",
      "Some ache in the tendon during and after is expected, as long as it settles within 24 hours."
    ],
    mistakes: [
      "Lowering quickly or 'dropping' rather than controlling the descent.",
      "Rising back up on the injured leg alone.",
      "Stopping the moment you feel any ache - mild tendon ache is part of this exercise.",
      "Stop and message your physio if the pain is sharp, clearly worse day to day, or the tendon is very swollen."
    ],
    defaultDosage: { sets: 3, reps: 15, perDay: 2, perWeek: 7, tempo: "3 to 4 seconds to lower", notes: "Expect some tendon ache during and after - this is a loading exercise and the ache should settle within 24 hours." }
  },
  {
    id: "ex-65",
    slug: "wall-squat-hold",
    title: "Wall Squat Hold",
    bodyPart: "Knee",
    clinicalArea: "lower_limb",
    tags: ["knee", "isometric", "early-rehab"],
    condition: "Patellar tendinopathy (flare-up)",
    stage: "Early rehab",
    description: "An isometric squat against a wall, held steady — a low-irritability way to load a painful tendon early on.",
    equipment: ["A clear stretch of smooth wall"],
    pose: "squat",
    setup: "Stand with your back against a smooth wall, feet about hip-width apart and a step or two out from the wall.",
    steps: [
      "Slide your back down the wall until your knees are bent to a shallow, comfortable angle.",
      "Start well short of a right angle - a small bend is enough during a flare-up.",
      "Hold the position still, keeping your weight even through both feet.",
      "Slide back up the wall to finish the hold."
    ],
    cues: [
      "The hold feels like steady, tolerable work in the front of your thighs.",
      "Your knees stay in line with your feet and do not drift inwards.",
      "Any tendon pain stays low and steady, not building through the hold."
    ],
    mistakes: [
      "Bending the knees so deep that the pain rises - less depth is fine early on.",
      "Holding your breath - keep breathing through the whole hold.",
      "Putting more weight on the less painful leg.",
      "Stop and message your physio if the tendon pain climbs during the hold or is worse the morning after."
    ],
    defaultDosage: {
      sets: 4,
      holdSeconds: 30,
      perDay: 1,
      perWeek: 6,
      tempo: "still hold",
      notes: "Set the knee bend so the hold feels like a manageable 4 or 5 out of 10 effort. Build towards 45 seconds a hold as it settles."
    }
  },
  {
    id: "ex-66",
    slug: "split-squat",
    title: "Split Squat",
    bodyPart: "Knee",
    clinicalArea: "lower_limb",
    tags: ["knee", "functional", "return-to-function"],
    condition: "ACL rehabilitation",
    stage: "Return to function",
    description: "A staggered-stance squat building single-leg strength and control, a key step before returning to sport.",
    equipment: ["A handrail or wall for light balance support if needed"],
    setup: "Stand in a split stance, one foot a stride length in front of the other, with your back heel lifted. Keep support within reach.",
    steps: [
      "Keep your trunk upright and your weight mostly through your front foot.",
      "Bend both knees to lower your back knee straight down towards the floor.",
      "Lower until your front thigh is roughly parallel to the floor, or as far as your knee comfortably allows.",
      "Push down through your front foot to return to the start."
    ],
    cues: [
      "Your front knee tracks over your foot, staying in line with your middle toes.",
      "Your hips stay level and square to the front.",
      "The movement goes straight up and down, not rocking forwards and back."
    ],
    mistakes: [
      "Letting the front knee roll inwards - a key pattern to retrain after ACL surgery.",
      "Leaning your trunk forwards over the front thigh.",
      "Pushing up mostly through the back leg.",
      "Stop and message your physio if the knee feels unstable, gives way, or swells after sessions."
    ],
    defaultDosage: {
      sets: 3,
      reps: 8,
      perDay: 1,
      perWeek: 5,
      notes: "Do the full set on each leg. Add light hand weights only once your control and alignment are solid."
    }
  },
  {
    id: "ex-67",
    slug: "lateral-band-walk",
    title: "Lateral Band Walk",
    bodyPart: "Hip",
    clinicalArea: "lower_limb",
    tags: ["hip", "glute-strength", "return-to-function"],
    condition: "Patellofemoral pain",
    stage: "Return to function",
    description: "Sidestepping against band resistance around the knees, building hip strength that controls knee alignment.",
    equipment: ["A resistance loop band"],
    setup: "Place a resistance loop around both legs just above the knees, or around your ankles for more challenge. Stand with your feet hip-width apart and sink into a quarter-squat with your knees slightly bent.",
    steps: [
      "Keeping the slight knee bend, step sideways with one foot against the band's pull.",
      "Bring the trailing foot in to follow, but only back to hip-width so the band stays under tension.",
      "Take several steps in one direction, then step back the other way.",
      "Stay low in the quarter-squat the whole time."
    ],
    cues: [
      "Your knees stay apart and in line with your feet, pushing gently out against the band.",
      "Your trunk stays upright and level - your hips do not rock side to side.",
      "The work is felt in the sides of your buttocks."
    ],
    mistakes: [
      "Letting the knees drift together as you step.",
      "Standing up tall between steps and losing the band tension.",
      "Taking such big steps that your trunk sways.",
      "Stop and message your physio if the pain at the front of the knee builds during or after the exercise."
    ],
    defaultDosage: {
      sets: 3,
      reps: 10,
      perDay: 1,
      perWeek: 5,
      notes: "Count 1 rep as one side step. Do the full set leading in each direction."
    }
  },
  {
    id: "ex-68",
    slug: "nordic-hamstring-curl-assisted",
    title: "Nordic Hamstring Curl (Assisted)",
    bodyPart: "Hamstring",
    clinicalArea: "lower_limb",
    tags: ["hamstring", "eccentric-strength", "return-to-function"],
    condition: "Hamstring strain",
    stage: "Return to function",
    description: "A kneeling, partner- or strap-assisted eccentric hamstring lowering exercise, shown to reduce re-injury risk.",
    equipment: [
      "A cushion or folded towel for your knees",
      "A partner to hold your ankles, or a strap or heavy furniture to hook your heels under"
    ],
    setup: "Kneel upright on a cushion with your ankles held firmly down by a partner or hooked under a fixed support. Cross your arms over your chest.",
    steps: [
      "Hold your body in a straight line from your knees to your head, with your hips gently pushed forwards.",
      "Slowly let your body tip forwards, resisting the fall with the backs of your thighs for as long as you can.",
      "When you can no longer hold, let your hands catch you softly on the floor.",
      "Push yourself back up with your arms to the start - the slow lowering is the only working part."
    ],
    cues: [
      "Your hips stay open in line with your body, not folding at the waist.",
      "You resist and slow the fall as much as you can rather than dropping.",
      "You feel the backs of your thighs working hard through the lower."
    ],
    mistakes: [
      "Bending at the hips so it becomes a forward bow rather than a straight-body lower.",
      "Dropping quickly once past halfway instead of fighting it the whole way.",
      "Doing this while the strain is still painful to walk on or tender to touch - it needs a later stage of healing.",
      "Stop and message your physio if you feel a sharp pull in the back of the thigh, or next-day pain and stiffness that does not settle."
    ],
    defaultDosage: {
      sets: 2,
      reps: 5,
      perDay: 1,
      perWeek: 2,
      tempo: "as slow as you can on the way down",
      notes: "Expect the backs of your thighs to feel worked and stiff for a day or two, especially at first. Leave at least 2 days between sessions and build the reps up very gradually."
    }
  },
  {
    id: "ex-69",
    slug: "standing-hamstring-stretch",
    title: "Standing Hamstring Stretch",
    bodyPart: "Hamstring",
    clinicalArea: "lower_limb",
    tags: ["hamstring", "flexibility", "mobility"],
    condition: "Hamstring tightness",
    stage: "Mobility phase",
    description: "Hinging forward with a straight leg on a raised support to gently lengthen a tight hamstring.",
    equipment: ["A low step, stool, or chair"],
    pose: "hipStretch",
    setup: "Stand tall and place one heel on a low step or stool in front of you, with that leg straight and the toes pointing up. Keep the standing leg slightly bent.",
    steps: [
      "Keep your back straight and your chest lifted.",
      "Hinge forwards from your hips towards the raised foot until you feel a gentle stretch behind the thigh.",
      "Keep the raised leg straight and its toes drawn back towards you.",
      "Hold the stretch, breathing steadily, then slowly come back upright."
    ],
    cues: [
      "The bend comes from your hips, so your back stays long and flat, not rounded.",
      "You feel the stretch in the middle of the back of the thigh, not behind the knee.",
      "The stretch is a steady pull you could hold and talk through, not a strain."
    ],
    mistakes: [
      "Rounding your back to reach further forwards.",
      "Locking the standing knee hard.",
      "Bouncing to get deeper into the stretch.",
      "Stop and message your physio if you feel tingling or pins and needles down the back of the leg, which points to nerve rather than muscle tightness."
    ],
    defaultDosage: {
      sets: 2,
      holdSeconds: 30,
      perDay: 2,
      perWeek: 7,
      tempo: "slow and controlled",
      notes: "Stretch each leg and hold steady without bouncing."
    }
  },
  {
    id: "ex-70",
    slug: "box-step-down",
    title: "Box Step-Down",
    bodyPart: "Knee",
    clinicalArea: "lower_limb",
    tags: ["knee", "control", "strength-phase"],
    condition: "Patellofemoral pain",
    stage: "Strength phase",
    description: "A slow, controlled step down from a low box, building eccentric quad control that protects the kneecap joint.",
    equipment: ["A low box or step", "A wall or rail for balance"],
    setup: "Stand on top of a low box or step near a wall or rail you can touch for balance.",
    steps: [
      "Stand tall on your affected leg near the front edge of the box, with the other leg free.",
      "Slowly bend the standing knee to lower the free foot towards the floor.",
      "Lightly tap your heel to the floor without putting weight on it.",
      "Push down through the standing leg to straighten back up to the start."
    ],
    cues: [
      "The lowering is slow and controlled - aim for about three seconds down.",
      "Your kneecap stays pointing forwards over your foot, not rolling in.",
      "Your hips stay level - the free-leg hip does not drop.",
      "Your trunk stays upright rather than leaning forwards."
    ],
    mistakes: [
      "Dropping down quickly and using the bottom of the movement as a bounce.",
      "Putting weight onto the lowering foot to help.",
      "Letting the standing knee cave inwards - the main pattern this exercise retrains.",
      "Stop and message your physio if the pain at the front of the knee rises through the set or lingers to the next day."
    ],
    defaultDosage: {
      sets: 3,
      reps: 8,
      perDay: 1,
      perWeek: 5,
      tempo: "3 seconds to lower",
      notes: "Start with a low box and a small range, adding height as your control improves. Do the set on each leg if advised."
    }
  },
  {
    id: "ex-71",
    slug: "static-standing-balance-eyes-open",
    title: "Static Standing Balance (Eyes Open)",
    bodyPart: "Balance",
    clinicalArea: "balance_walking",
    tags: ["falls-prevention", "static-balance", "early-rehab"],
    condition: "Falls prevention",
    stage: "Early rehab",
    description: "Standing unsupported with feet together, building basic standing balance confidence near a stable surface.",
    equipment: ["A kitchen worktop, sturdy chair or wall within arm's reach"],
    setup: "Stand next to a worktop, sturdy chair or wall so a firm surface is always within arm's reach. Bring your feet together so they are side by side and touching.",
    steps: [
      "Stand tall with your arms relaxed by your sides.",
      "Look straight ahead at a fixed point.",
      "Hold your feet-together position as still as you can, breathing normally.",
      "Reach for your support and step your feet apart to rest between goes."
    ],
    cues: [
      "Your weight is even between both feet and spread through the whole foot.",
      "Your body stays tall and relaxed, not stiff and braced.",
      "Small sways at the ankle are normal and are part of the exercise."
    ],
    mistakes: [
      "Standing in open space with nothing to grab if you lose your balance.",
      "Looking down at your feet instead of ahead.",
      "Holding your breath - keep breathing steadily throughout.",
      "Stop and message your physio if you have a fall, a near-fall, or new dizziness or leg weakness."
    ],
    defaultDosage: {
      sets: 3,
      holdSeconds: 20,
      perDay: 2,
      perWeek: 7,
      notes: "Build up towards 30 seconds. If feet fully together feels too hard, start with them a few inches apart and narrow the gap over time."
    }
  },
  {
    id: "ex-72",
    slug: "static-standing-balance-eyes-closed",
    title: "Static Standing Balance (Eyes Closed)",
    bodyPart: "Balance",
    clinicalArea: "balance_walking",
    tags: ["falls-prevention", "static-balance", "mobility"],
    condition: "Falls prevention",
    stage: "Mobility phase",
    description: "The same stance with eyes closed, removing visual input to challenge balance systems further, near support.",
    equipment: ["A kitchen worktop, sturdy chair or wall within arm's reach"],
    setup: "Stand close to a worktop or sturdy chair with one hand resting on it. Bring your feet together, side by side.",
    steps: [
      "Find your balance with your eyes open and your feet together.",
      "When you feel steady, close your eyes.",
      "Hold as still as you can with your eyes closed, breathing normally.",
      "Open your eyes and take hold of your support if you feel yourself tipping."
    ],
    cues: [
      "Keep a hand resting on or hovering just above your support at all times.",
      "Notice your feet gripping and your ankles adjusting - that is your balance system working harder without sight.",
      "Stay tall and relaxed rather than rigid."
    ],
    mistakes: [
      "Closing your eyes before you feel steady.",
      "Trying this without a firm surface right next to you.",
      "Snapping your eyes open and lurching instead of a calm reach for support.",
      "Stop and message your physio if you have a fall, a near-fall, or new dizziness or leg weakness."
    ],
    defaultDosage: {
      sets: 3,
      holdSeconds: 15,
      perDay: 1,
      perWeek: 5,
      notes: "Eyes closed is much harder than eyes open - start with 10 to 15 seconds and keep a hand close to your support the whole time."
    }
  },
  {
    id: "ex-73",
    slug: "weight-shifting",
    title: "Weight Shifting",
    bodyPart: "Balance",
    clinicalArea: "balance_walking",
    tags: ["falls-prevention", "weight-transfer", "early-rehab"],
    condition: "Post-stroke balance impairment",
    stage: "Early rehab",
    description: "Slowly shifting body weight side to side and forward-back to rebuild confidence loading each leg evenly.",
    equipment: ["A kitchen worktop or sturdy chair for support"],
    setup: "Stand with your feet hip-width apart in front of a worktop or sturdy chair you can rest both hands on. Stand tall with your weight even between both feet.",
    steps: [
      "Slowly shift your weight over onto your right foot, letting your right knee bend a little.",
      "Pause, then slowly shift across onto your left foot.",
      "Return to the middle, then shift your weight forwards onto the balls of your feet, then back onto your heels.",
      "Keep every movement slow, smooth and controlled."
    ],
    cues: [
      "You feel the weight clearly move from one foot to the other.",
      "Your body stays upright - you are moving your weight, not folding at the waist.",
      "You move only as far as you can control and still return to the middle."
    ],
    mistakes: [
      "Moving so quickly that you bounce or overshoot the middle position.",
      "Lifting a foot off the floor - both feet stay planted.",
      "Gripping the support and pulling yourself across with your arms.",
      "Stop and message your physio if you have a fall, a near-fall, or new dizziness or leg weakness."
    ],
    defaultDosage: {
      sets: 2,
      reps: 10,
      perDay: 2,
      perWeek: 7,
      tempo: "slow and controlled",
      notes: "Count one rep as one full shift out and back to the middle, in any one direction. Keep the range small at first and grow it as you get steadier."
    }
  },
  {
    id: "ex-74",
    slug: "sideways-walking",
    title: "Sideways Walking",
    bodyPart: "Balance",
    clinicalArea: "balance_walking",
    tags: ["gait", "hip-strength", "mobility"],
    condition: "Gait instability",
    stage: "Mobility phase",
    description: "Stepping sideways in a controlled line, building hip strength and lateral stability important for uneven ground.",
    equipment: ["A clear stretch of wall or worktop to walk alongside"],
    setup: "Stand tall beside a worktop or a long clear wall so you can trail your fingertips along it for support. Have your feet hip-width apart.",
    steps: [
      "Step sideways with your leading foot, about shoulder-width.",
      "Bring your trailing foot in to meet it, back to hip-width apart.",
      "Keep stepping the same way along your line, staying tall.",
      "Turn around or step back the other way to return."
    ],
    cues: [
      "Your toes point forwards the whole time, not turning out in the direction you are travelling.",
      "You stay upright, not leaning over the leading leg.",
      "The steps are even and unhurried, with a clear moment on two feet between each."
    ],
    mistakes: [
      "Letting your feet click together or cross over each other.",
      "Bending forwards at the hips.",
      "Rushing until the steps become a shuffle.",
      "Stop and message your physio if you have a fall, a near-fall, or new dizziness or leg weakness."
    ],
    defaultDosage: {
      sets: 2,
      reps: 10,
      perDay: 1,
      perWeek: 5,
      notes: "Count one rep as one side-step. Aim for about 10 steps each direction, keeping a worktop or wall within reach the whole way."
    }
  },
  {
    id: "ex-75",
    slug: "heel-to-toe-walking-tandem-gait",
    title: "Heel-to-Toe Walking (Tandem Gait)",
    bodyPart: "Balance",
    clinicalArea: "balance_walking",
    tags: ["gait", "dynamic-balance", "strength-phase"],
    condition: "Falls prevention",
    stage: "Strength phase",
    description: "Walking in a straight line placing heel directly in front of toe, sharpening dynamic balance and coordination.",
    equipment: ["A worktop or hallway wall to walk alongside"],
    setup: "Stand at one end of a clear hallway or beside a worktop, with a wall or firm surface close on one side for support. Pick a straight line on the floor to follow, such as a floorboard join or a strip of tape.",
    steps: [
      "Step forwards, placing your heel down directly in front of the toes of your other foot.",
      "Shift your weight onto that front foot and find your balance.",
      "Bring the back foot through and place its heel just in front of the new front toes.",
      "Continue along your line, looking ahead rather than down."
    ],
    cues: [
      "Each foot lands almost touching the one in front, on the same line.",
      "You pause briefly with each step rather than rushing to the next.",
      "Your eyes are up, using the far end of the line as a target."
    ],
    mistakes: [
      "Widening your steps out to the side to make it easier - keep them on the line.",
      "Looking straight down at your feet, which makes wobbles worse.",
      "Speeding up until the steps blur together.",
      "Stop and message your physio if you have a fall, a near-fall, or new dizziness or leg weakness."
    ],
    defaultDosage: {
      sets: 2,
      reps: 10,
      perDay: 1,
      perWeek: 5,
      notes: "Count one rep as one heel-to-toe step. Aim for about 10 steps in a row, keeping a wall or worktop within reach."
    }
  },
  {
    id: "ex-76",
    slug: "marching-on-the-spot",
    title: "Marching on the Spot",
    bodyPart: "Balance",
    clinicalArea: "balance_walking",
    tags: ["gait", "hip-flexor", "early-rehab"],
    condition: "General deconditioning",
    stage: "Early rehab",
    description: "Lifting alternate knees while standing near support, building hip flexor strength and single-leg confidence.",
    equipment: ["A kitchen worktop or sturdy chair for support"],
    setup: "Stand tall behind a worktop or a sturdy chair with one or both hands resting on it. Have your feet hip-width apart.",
    steps: [
      "Lift one knee up towards hip height, or as high as feels comfortable.",
      "Lower that foot back to the floor with control.",
      "Lift the other knee in the same way.",
      "Keep alternating in a steady marching rhythm."
    ],
    cues: [
      "You stand tall throughout, not leaning back as the knee comes up.",
      "Each foot is placed down softly, not stamped.",
      "You could hold a conversation while marching - the pace is comfortable."
    ],
    mistakes: [
      "Bending forwards to bring your chest down to meet the knee.",
      "Marching so fast you lose control of where your foot lands.",
      "Leaning heavily on your hands instead of using your legs.",
      "Stop and message your physio if you have a fall, a near-fall, or new dizziness or leg weakness."
    ],
    defaultDosage: {
      sets: 2,
      reps: 20,
      perDay: 1,
      perWeek: 5,
      notes: "Count one rep as one knee lift, so about 10 on each leg. Build up the height of the lift and the number of marches as you get stronger."
    }
  },
  {
    id: "ex-77",
    slug: "backward-walking",
    title: "Backward Walking",
    bodyPart: "Balance",
    clinicalArea: "balance_walking",
    tags: ["gait", "dynamic-balance", "return-to-function"],
    condition: "Gait re-training",
    stage: "Return to function",
    description: "Walking backward a short, safe distance, challenging balance and proprioception differently to forward gait.",
    equipment: ["A wall or worktop to trail one hand along", "A clear space with no rugs, cables or clutter"],
    setup: "Choose a clear, uncluttered stretch of floor beside a wall or worktop you can trail one hand along. Check behind you first so you know the whole path is clear.",
    steps: [
      "Stand tall and take a small step straight backwards, reaching back with your toes first.",
      "Lower that heel and shift your weight onto the back foot.",
      "Bring the other foot back to meet it, then step back again.",
      "After a short distance, pause, then walk forwards to return to the start."
    ],
    cues: [
      "Steps are small and controlled, with a clear moment on two feet between them.",
      "You stay upright rather than leaning forwards or arching back.",
      "Your trailing hand stays lightly on the wall or worktop as a guide."
    ],
    mistakes: [
      "Taking big backward steps or moving quickly.",
      "Twisting round to look over your shoulder mid-step - check the path before you start instead.",
      "Practising where there are rugs, cables or furniture in the way.",
      "Stop and message your physio if you have a fall, a near-fall, or new dizziness or leg weakness."
    ],
    defaultDosage: {
      sets: 2,
      reps: 10,
      perDay: 1,
      perWeek: 5,
      notes: "Count one rep as one backward step. Keep the total distance short, about 10 steps, and always with a hand near your support."
    }
  },
  {
    id: "ex-78",
    slug: "sit-to-stand-repetitions",
    title: "Sit-to-Stand Repetitions",
    bodyPart: "Balance",
    clinicalArea: "balance_walking",
    tags: ["falls-prevention", "functional", "strength-phase"],
    condition: "Falls prevention",
    stage: "Strength phase",
    description: "Repeated rising from a chair without hands, one of the strongest evidence-based exercises for reducing fall risk.",
    equipment: [
      "A firm, stable chair with the seat around knee height",
      "The chair placed against a wall so it cannot slide"
    ],
    pose: "squat",
    setup: "Sit towards the front of a firm chair that is pushed back against a wall so it cannot move. Place your feet flat on the floor, hip-width apart and drawn back slightly under your knees. Fold your arms across your chest.",
    steps: [
      "Lean your upper body forwards so your nose moves over your toes.",
      "Push down through your feet and stand all the way up to tall.",
      "Pause standing, then slowly bend at your hips and knees to lower back down.",
      "Touch the seat lightly and stand again, without fully resting between reps."
    ],
    cues: [
      "You push evenly through both feet, especially the heels.",
      "Your knees track over your toes, not falling inwards.",
      "The lowering is slow and controlled, not a drop into the chair."
    ],
    mistakes: [
      "Using your hands to push off your thighs or the chair once you can manage without them.",
      "Flopping backwards down into the seat.",
      "Holding your breath - breathe out as you stand up.",
      "Stop and message your physio if you have a fall, a near-fall, or new dizziness or leg weakness."
    ],
    defaultDosage: {
      sets: 3,
      reps: 10,
      perDay: 1,
      perWeek: 5,
      notes: "If standing without hands is too hard, start with a higher chair or a firm cushion, or push off your thighs, and reduce the help over the weeks."
    }
  },
  {
    id: "ex-79",
    slug: "obstacle-stepping",
    title: "Obstacle Stepping",
    bodyPart: "Balance",
    clinicalArea: "balance_walking",
    tags: ["gait", "dynamic-balance", "return-to-function"],
    condition: "Falls prevention",
    stage: "Return to function",
    description: "Stepping over low objects placed on the floor, practising the foot clearance needed to avoid trips.",
    equipment: [
      "3 to 5 low, soft objects such as rolled towels or foam pool noodles",
      "A worktop or wall alongside for support"
    ],
    setup: "Lay a few low, soft objects - rolled towels work well - in a line on the floor, about one step apart, beside a worktop or wall you can steady yourself on. Start standing tall at one end of the line.",
    steps: [
      "Walk forwards towards the first object at a normal, comfortable pace.",
      "Lift your leading foot up and over the object, placing it down well clear on the far side.",
      "Bring your trailing foot up and over to join it.",
      "Walk on to the next object and repeat along the line."
    ],
    cues: [
      "You lift your whole foot clear of the object rather than skimming over it.",
      "Your eyes look ahead to the next object, glancing down only briefly.",
      "You keep moving through in a smooth rhythm rather than stopping dead at each one."
    ],
    mistakes: [
      "Using hard or heavy objects that will not shift if you clip them with a foot.",
      "Shuffling your feet along the floor between the objects.",
      "Staring down at your feet the whole way along.",
      "Stop and message your physio if you have a fall, a near-fall, or new dizziness or leg weakness."
    ],
    defaultDosage: {
      sets: 2,
      reps: 8,
      perDay: 1,
      perWeek: 5,
      notes: "Count one rep as stepping over one object. Start with 3 objects and a low clearance, and build up. Keep a wall or worktop within reach."
    }
  },
  {
    id: "ex-80",
    slug: "stair-negotiation-practice",
    title: "Stair Negotiation Practice",
    bodyPart: "Balance",
    clinicalArea: "balance_walking",
    tags: ["gait", "functional", "return-to-function"],
    condition: "Post-surgical mobility",
    stage: "Return to function",
    description: "Practising stepping up and down stairs with a rail, rebuilding the confidence and strength for real stairs at home.",
    equipment: ["A staircase with a secure handrail"],
    setup: "Stand at the bottom of a staircase that has a firm handrail, holding the rail with one hand. Wear supportive shoes or go barefoot, not socks or loose slippers.",
    steps: [
      "To go up, step up with your stronger leg first, then bring the other leg onto the same step.",
      "To come down, step down with your weaker or operated leg first, then follow with the stronger leg.",
      "Take one step at a time, pausing with both feet on each step to start with.",
      "Progress to one foot per stair, step over step, as your strength and confidence grow."
    ],
    cues: [
      "A helpful phrase is 'up with the good, down with the bad'.",
      "You place your whole foot on each step, not just the toes.",
      "The handrail takes some of your weight for balance, but not all of it."
    ],
    mistakes: [
      "Rushing, or trying step over step before you are steady taking one step at a time.",
      "Looking up or around instead of at the steps in front of you.",
      "Practising in socks or loose slippers.",
      "Stop and message your physio if you have a fall, a near-fall, or new dizziness or leg weakness."
    ],
    defaultDosage: {
      sets: 2,
      reps: 6,
      perDay: 1,
      perWeek: 5,
      notes: "Count one rep as going up or coming down once, and rest as needed between reps. Have someone nearby for the first sessions. If you only have a few steps, repeat the same ones."
    }
  },
  {
    id: "ex-81",
    slug: "single-leg-stance-with-arm-reach",
    title: "Single Leg Stance with Arm Reach",
    bodyPart: "Balance",
    clinicalArea: "balance_walking",
    tags: ["dynamic-balance", "sport", "return-to-function"],
    condition: "Return to sport balance training",
    stage: "Return to function",
    description: "Standing on one leg while reaching in different directions, advanced balance work for returning to sport.",
    equipment: ["A wall or sturdy chair within reach for early attempts"],
    pose: "balance",
    setup: "Stand on one leg in a clear space, with a wall or sturdy chair within reach in case you need it. Bend your standing knee slightly.",
    steps: [
      "Balance on one leg with your hips level and your stomach gently braced.",
      "Reach your free hand forwards as far as you can control, then return to the middle.",
      "Reach the same hand out to the side, then across your body, returning to the middle each time.",
      "Progress to reaching with your free foot instead of your hand, tapping the floor and returning."
    ],
    cues: [
      "Your standing knee stays soft and tracks over your foot, not caving inwards.",
      "Your hips stay level as you reach - the movement comes from your hip and trunk, not a collapse to one side.",
      "You control both the reach out and the return, without touching the free foot down."
    ],
    mistakes: [
      "Reaching so far that you have to hop, stumble or grab the wall on every rep.",
      "Letting the arch of your standing foot flatten and the knee roll in.",
      "Holding your breath during the reach.",
      "Stop and message your physio if you have a fall, a near-fall, or new dizziness or leg weakness."
    ],
    defaultDosage: {
      sets: 3,
      reps: 8,
      perDay: 1,
      perWeek: 5,
      notes: "Count one rep as one reach out and back. Do a full set on each leg, and compare sides - a large difference is worth telling your physio."
    }
  },
  {
    id: "ex-82",
    slug: "treadmill-or-level-ground-gait-practice",
    title: "Treadmill or Level Ground Gait Practice",
    bodyPart: "Balance",
    clinicalArea: "balance_walking",
    tags: ["gait", "endurance", "mobility"],
    condition: "Reduced walking tolerance",
    stage: "Mobility phase",
    description: "Timed walking practice at a comfortable pace, gradually building walking distance and confidence.",
    equipment: ["A treadmill with handrails, or a flat, even walking route", "A phone or watch to keep time"],
    setup: "Use a treadmill set to a slow, comfortable speed with the handrails to hand, or pick a flat, even route indoors or outdoors where you can stop and sit if you need to. Wear supportive shoes.",
    steps: [
      "Start walking at a pace that feels easy - you should be able to talk in full sentences.",
      "Keep an upright posture, look ahead, and let your arms swing naturally.",
      "Walk for your set time, or until you feel you need a rest, whichever comes first.",
      "Slow down gradually rather than stopping suddenly, then rest."
    ],
    cues: [
      "Your breathing is a little faster but you are not puffed out.",
      "Your steps are roughly even in length on both sides.",
      "You finish feeling you could have managed a minute or two more, not exhausted."
    ],
    mistakes: [
      "Setting off too fast and having to stop early.",
      "Gripping the treadmill rails and leaning on them, which changes your natural walking pattern.",
      "Adding a lot of time or speed in one jump - increase by about a tenth each week.",
      "Stop and message your physio if you have a fall, a near-fall, or new dizziness or leg weakness."
    ],
    defaultDosage: {
      minutes: 5,
      perDay: 1,
      perWeek: 5,
      notes: "Start with about 5 minutes of continuous walking and build up by roughly 1 to 2 minutes each week. Split it into shorter blocks with rests if you need to."
    }
  },
  {
    id: "ex-83",
    slug: "standing-on-one-leg-hand-support",
    title: "Standing on One Leg (Hand Support)",
    bodyPart: "Balance",
    clinicalArea: "balance_walking",
    tags: ["falls-prevention", "static-balance", "early-rehab"],
    condition: "Falls prevention",
    stage: "Early rehab",
    description: "Lifting one foot slightly off the floor with a hand resting on a worktop, an accessible starting balance challenge.",
    equipment: ["A kitchen worktop or sturdy chair at about hip height"],
    pose: "balance",
    setup: "Stand tall at a kitchen worktop or the back of a sturdy chair, with one hand resting flat on it. Have your feet hip-width apart.",
    steps: [
      "Move your weight onto one leg.",
      "Lift the other foot just clear of the floor - a centimetre or two is enough to start.",
      "Hold, keeping your standing knee soft and your hips level.",
      "Place the foot back down, rest, and repeat on the other leg."
    ],
    cues: [
      "Your hand rests on the support for balance, not to hold you up.",
      "You stand tall and look ahead, not down.",
      "Your hips stay level rather than dropping on the lifted side."
    ],
    mistakes: [
      "Lifting the foot high or swinging the leg - a small lift is plenty at this stage.",
      "Leaning your whole trunk over the standing leg.",
      "Gripping the worktop tightly and pulling up through your arm.",
      "Stop and message your physio if you have a fall, a near-fall, or new dizziness or leg weakness."
    ],
    defaultDosage: {
      sets: 3,
      holdSeconds: 10,
      perDay: 2,
      perWeek: 7,
      notes: "Start with 5 to 10 seconds and build towards 30. Count one hold on each leg as one set. Lighten your hand towards fingertips only as you improve."
    }
  },
  {
    id: "ex-84",
    slug: "turning-practice",
    title: "Turning Practice",
    bodyPart: "Balance",
    clinicalArea: "balance_walking",
    tags: ["gait", "falls-prevention", "mobility"],
    condition: "Falls prevention",
    stage: "Mobility phase",
    description: "Practising controlled 180-degree turns while walking, a common moment of instability and fall risk.",
    equipment: ["A clear space with a worktop or wall on one side"],
    setup: "Stand in a clear space with a worktop or wall within reach on one side. Make sure the floor is free of rugs and clutter.",
    steps: [
      "Take a few steps forwards at a normal pace.",
      "To turn, take several small steps in a curve, walking your feet round rather than twisting on one spot.",
      "Let your head and eyes lead the turn, looking where you want to go.",
      "Finish facing the other way with your feet hip-width apart, then walk back and repeat."
    ],
    cues: [
      "The turn takes four or five small steps, not one or two big pivots.",
      "Your feet keep clearing the floor, with no twisting or scuffing on the spot.",
      "You feel steady enough that you could pause halfway through the turn if you needed to."
    ],
    mistakes: [
      "Spinning quickly on one foot, which is a common way to lose your balance.",
      "Crossing one leg tightly over the other during the turn.",
      "Turning your feet while your head stays fixed - let your eyes lead.",
      "Stop and message your physio if you have a fall, a near-fall, or new dizziness or leg weakness."
    ],
    defaultDosage: {
      sets: 2,
      reps: 8,
      perDay: 1,
      perWeek: 5,
      notes: "Count one rep as one half-turn. Practise turning towards both your left and your right, and keep a surface within reach."
    }
  },
  {
    id: "ex-85",
    slug: "dual-task-walking",
    title: "Dual-Task Walking",
    bodyPart: "Balance",
    clinicalArea: "balance_walking",
    tags: ["gait", "cognitive-motor", "return-to-function"],
    condition: "Falls prevention (cognitive-motor)",
    stage: "Return to function",
    description: "Walking while carrying out a simple mental task (like counting backward), practising real-world walking demands.",
    equipment: ["A flat, even, familiar walking route", "A helper or a wall alongside for the first few tries"],
    setup: "Choose a flat, familiar, uncluttered route where you already feel safe walking on your own. Have someone with you, or a wall alongside, for your first attempts.",
    steps: [
      "Start walking at your normal comfortable pace.",
      "Once you are settled, begin a simple thinking task out loud - for example counting backwards from 100 in threes, or naming animals.",
      "Keep both going together, walking and talking, without slowing right down or stopping.",
      "If you feel unsteady, stop the thinking task first, then steady your walking."
    ],
    cues: [
      "Your walking stays smooth and your step length stays even while you talk.",
      "You can keep the mental task going without coming to a halt.",
      "You notice which one slips first when it gets hard - that is useful to tell your physio."
    ],
    mistakes: [
      "Starting the mental task before your walking feels steady.",
      "Trying this on a busy street, on uneven ground or on an unfamiliar route.",
      "Pushing on when you feel your balance going instead of dropping the task.",
      "Stop and message your physio if you have a fall, a near-fall, or new dizziness or leg weakness."
    ],
    defaultDosage: {
      minutes: 3,
      perDay: 1,
      perWeek: 5,
      notes: "Aim for about 3 minutes of dual-task walking to start, building up gradually. Only move to harder tasks or surfaces once the easy version feels safe."
    }
  },
  {
    id: "ex-86",
    slug: "uneven-surface-walking",
    title: "Uneven Surface Walking",
    bodyPart: "Balance",
    clinicalArea: "balance_walking",
    tags: ["gait", "proprioception", "return-to-function"],
    condition: "Return to outdoor mobility",
    stage: "Return to function",
    description: "Supervised walking on grass or a slightly uneven surface, rebuilding confidence for real-world terrain.",
    equipment: ["Supportive outdoor shoes", "A walking aid if you normally use one, and a helper alongside"],
    setup: "Choose a short stretch of firm grass, a gently uneven path or a low-pile mat, on a dry day. Have a helper walking beside you, and use your normal walking aid if you have one.",
    steps: [
      "Step onto the uneven surface and stand still for a moment to feel it under your feet.",
      "Walk forwards slowly, taking slightly wider and slightly higher steps than usual.",
      "Look a few steps ahead to read the ground, glancing down only for tricky patches.",
      "Turn around in a wide arc and walk back across the same stretch."
    ],
    cues: [
      "Your steps are a little shorter and more deliberate than on a smooth floor.",
      "Your knees and ankles stay relaxed so they can adjust to the bumps.",
      "You keep your weight centred rather than committing fully to a foot before it is settled."
    ],
    mistakes: [
      "Trying wet grass, mud, loose gravel, slopes or ice - keep to dry, firm, gentle ground at first.",
      "Walking as fast as you would indoors.",
      "Fixing your eyes on your feet the whole time, which makes balance harder.",
      "Stop and message your physio if you have a fall, a near-fall, or new dizziness or leg weakness."
    ],
    defaultDosage: {
      minutes: 3,
      perDay: 1,
      perWeek: 4,
      notes: "Start with a few minutes on gentle ground with a helper, and build up as your confidence grows."
    }
  },
  {
    id: "ex-87",
    slug: "bed-mobility-rolling",
    title: "Bed Mobility Rolling",
    bodyPart: "Neuro",
    clinicalArea: "neuro",
    tags: ["stroke", "functional", "early-rehab"],
    condition: "Post-stroke rehabilitation",
    stage: "Early rehab",
    description: "Practising rolling side to side in bed with guided cues, rebuilding basic functional movement after neurological injury.",
    equipment: [],
    setup: "Lie on your back in bed or on a firm surface with your knees bent and both feet flat, hip-width apart. Rest your arms by your sides.",
    steps: [
      "Turn your head to look towards the side you are rolling to.",
      "Reach the arm furthest away across your body towards that side, or let your helper guide your weaker arm across.",
      "Let your bent knees drop towards the same side.",
      "Roll your shoulders and hips together so you end up fully on your side.",
      "To come back, roll your head, shoulders and hips together the other way."
    ],
    cues: [
      "Your head leads first, then your shoulders, then your hips.",
      "You roll as one unit rather than twisting through your back.",
      "You finish fully on your side, not stuck halfway over."
    ],
    mistakes: [
      "Pulling on a bed rail or on your helper instead of rolling your own body.",
      "Letting your weaker arm get trapped underneath you - move it clear first.",
      "Rushing so you flop across rather than control the roll.",
      "Stop and message your physio if you have a fall, sudden new weakness, numbness, difficulty speaking, or a severe headache."
    ],
    defaultDosage: {
      sets: 2,
      reps: 8,
      perDay: 3,
      perWeek: 7,
      notes: "Count a roll to each side as one rep. Little and often through the day works better than one long session."
    }
  },
  {
    id: "ex-88",
    slug: "bridging-for-transfers",
    title: "Bridging for Transfers",
    bodyPart: "Neuro",
    clinicalArea: "neuro",
    tags: ["stroke", "functional", "early-rehab"],
    condition: "Post-stroke rehabilitation",
    stage: "Early rehab",
    description: "Lifting the hips off the bed to assist with repositioning and transfers, an early building block for independence.",
    equipment: [],
    pose: "pelvicTilt",
    setup: "Lie on your back in bed or on a firm surface with your knees bent and both feet flat, hip-width apart. Rest your arms by your sides.",
    steps: [
      "Gently tighten your lower tummy and squeeze your buttocks.",
      "Press down through both feet and lift your hips a little way off the surface.",
      "Hold for a moment, keeping your hips level with each other.",
      "Lower your hips back down slowly with control."
    ],
    cues: [
      "Your hips stay level, not dropping towards the weaker side.",
      "The push comes through your whole foot, especially your heels.",
      "The effort is felt in your buttocks and the backs of your thighs."
    ],
    mistakes: [
      "Lifting so high that your lower back arches and feels pinched.",
      "Letting the weaker knee fall outwards - keep both knees pointing forwards.",
      "Holding your breath during the lift.",
      "Stop and message your physio if you have a fall, sudden new weakness, numbness, difficulty speaking, or a severe headache."
    ],
    defaultDosage: {
      sets: 2,
      reps: 10,
      perDay: 2,
      perWeek: 7,
      notes: "Your helper can rest a hand on the weaker buttock as a reminder to push evenly through both sides."
    }
  },
  {
    id: "ex-89",
    slug: "sit-to-stand-with-support",
    title: "Sit-to-Stand with Support",
    bodyPart: "Neuro",
    clinicalArea: "neuro",
    tags: ["stroke", "parkinsons", "functional", "early-rehab"],
    condition: "Neurological mobility impairment",
    stage: "Early rehab",
    description: "Rising from a chair using armrests as needed, a foundational functional movement retrained after neurological injury.",
    equipment: ["A sturdy chair with armrests"],
    pose: "squat",
    setup: "Sit towards the front of a firm chair with armrests, feet flat and hip-width apart. Have a helper stand alongside if your balance is unsteady.",
    steps: [
      "Shuffle your bottom forwards to the edge of the seat.",
      "Bring your feet back so they sit just behind your knees.",
      "Lean your chest forwards over your feet, so your nose is over your toes.",
      "Push down through your feet and the armrests to stand up.",
      "Once standing, pause and steady yourself before you walk.",
      "To sit, reach back for the armrests and lower yourself slowly with control."
    ],
    cues: [
      "Your weight moves forward over your feet before your hips leave the seat.",
      "You push evenly through both feet, not just the stronger one.",
      "You rise and lower slowly rather than being thrown up or dropping back down."
    ],
    mistakes: [
      "Pulling yourself up on your helper - use the armrests instead.",
      "Leaving your feet too far forward, which makes standing much harder.",
      "Falling back into the chair without control.",
      "Stop and message your physio if you have a fall, sudden new weakness, numbness, difficulty speaking, or a severe headache."
    ],
    defaultDosage: {
      sets: 3,
      reps: 8,
      perDay: 1,
      perWeek: 5,
      notes: "Use only as much push through the armrests as you need, and aim to use a little less over time."
    }
  },
  {
    id: "ex-90",
    slug: "weight-bearing-through-affected-leg",
    title: "Weight-Bearing Through Affected Leg",
    bodyPart: "Neuro",
    clinicalArea: "neuro",
    tags: ["stroke", "hemiplegia", "mobility"],
    condition: "Post-stroke hemiplegia",
    stage: "Mobility phase",
    description: "Standing with weight guided onto the affected side to rebuild sensation, strength and confidence on that leg.",
    equipment: ["A kitchen worktop or the back of a sturdy chair to hold"],
    setup: "Stand tall next to a worktop or a sturdy chair, holding on lightly with your stronger hand, with your feet hip-width apart. Have a helper nearby.",
    steps: [
      "Slowly shift your weight sideways onto your affected leg.",
      "Keep your affected knee soft, not locked back or buckled.",
      "Feel your foot spread and press evenly into the floor.",
      "Hold this position, then ease your weight back to the middle."
    ],
    cues: [
      "Your hips stay level and your trunk stays upright, not leaning away from the leg.",
      "Your affected knee stays unlocked and steady, lined up over your foot.",
      "You feel weight through your heel and the ball of your foot, not just the outer edge."
    ],
    mistakes: [
      "Snapping the knee backwards to prop yourself up.",
      "Gripping hard with your hand instead of letting the leg take the weight.",
      "Holding your breath - keep breathing steadily through the hold.",
      "Stop and message your physio if you have a fall, sudden new weakness, numbness, difficulty speaking, or a severe headache."
    ],
    defaultDosage: {
      sets: 3,
      holdSeconds: 20,
      perDay: 2,
      perWeek: 7,
      notes: "Build the hold time up gradually. A helper should stay within reach in case the knee gives way."
    }
  },
  {
    id: "ex-91",
    slug: "reaching-tasks-affected-arm",
    title: "Reaching Tasks (Affected Arm)",
    bodyPart: "Neuro",
    clinicalArea: "neuro",
    tags: ["stroke", "hemiplegia", "upper-limb", "mobility"],
    condition: "Post-stroke arm weakness",
    stage: "Mobility phase",
    description: "Guided reaching for objects using the affected arm, encouraging use and retraining coordinated movement.",
    equipment: ["A table", "A few light everyday objects such as a cup or a sponge"],
    setup: "Sit at a table in a supportive chair, with your affected arm resting on the table top and a few light objects placed within easy reach.",
    steps: [
      "Slide your affected hand forwards along the table towards an object.",
      "Reach out and rest your hand on or around the object.",
      "Bring your hand back towards you along the table.",
      "Repeat, placing objects a little further away or out to the side as it gets easier."
    ],
    cues: [
      "The movement comes from your shoulder and elbow while your trunk stays still.",
      "Your shoulder stays down and relaxed, not hitched up towards your ear.",
      "You use the affected arm as much as you can, helping with the other hand only when needed."
    ],
    mistakes: [
      "Leaning your whole body forwards instead of reaching with the arm.",
      "Letting the affected shoulder shrug up or the wrist flop down.",
      "Working so long that the arm aches or tires sharply - stop and rest.",
      "Stop and message your physio if you have a fall, sudden new weakness, numbness, difficulty speaking, or a severe headache."
    ],
    defaultDosage: {
      sets: 2,
      reps: 10,
      perDay: 2,
      perWeek: 7,
      tempo: "slow and controlled",
      notes: "Turning it into a real task, like wiping the table or moving cups, keeps the arm working and the brain engaged."
    }
  },
  {
    id: "ex-92",
    slug: "parkinsons-big-movements-lsvt-style",
    title: "Parkinson's Big Movements (LSVT-style)",
    bodyPart: "Neuro",
    clinicalArea: "neuro",
    tags: ["parkinsons", "amplitude-training", "strength-phase"],
    condition: "Parkinson's disease",
    stage: "Strength phase",
    description: "Exaggerated, large-amplitude arm and leg movements, based on LSVT BIG principles to counter the small movements typical of Parkinson's.",
    equipment: ["A sturdy chair"],
    setup: "Stand tall behind a sturdy chair you can hold if needed, with clear space around you. Sit tall instead if standing is not safe yet.",
    steps: [
      "Reach both arms up as high and as wide as you can, making the movement deliberately huge.",
      "Sweep them back down through the same large, exaggerated range.",
      "Take a big, long step forwards, planting your whole foot.",
      "Step back to the middle with an equally large movement.",
      "Add a loud, confident voice or a count to each big movement."
    ],
    cues: [
      "Every movement feels much bigger than it needs to be - that is the point.",
      "You move through the fullest range you can, not a comfortable small range.",
      "You stand as tall as you can, with your chest open."
    ],
    mistakes: [
      "Letting the movements shrink and speed up as you tire.",
      "Rushing - large and slow beats small and quick here.",
      "Making big arm movements while your feet still shuffle - make the steps big too.",
      "Stop and message your physio if you have a fall, or feel very dizzy or faint when you stand and move."
    ],
    defaultDosage: {
      sets: 2,
      reps: 10,
      perDay: 1,
      perWeek: 5,
      notes: "Count one big movement in each direction as one rep. Practising in front of a mirror helps you see how big the movement really is."
    }
  },
  {
    id: "ex-93",
    slug: "rhythmic-stepping-to-a-beat",
    title: "Rhythmic Stepping to a Beat",
    bodyPart: "Neuro",
    clinicalArea: "neuro",
    tags: ["parkinsons", "gait", "return-to-function"],
    condition: "Parkinson's disease (freezing of gait)",
    stage: "Return to function",
    description: "Stepping in place to an external rhythm or count, a cueing strategy that helps reduce freezing episodes.",
    equipment: ["A metronome, music with a steady beat, or a helper to count out loud"],
    setup: "Stand tall in a doorway or next to a worktop you can touch for balance. Set a steady beat close to your normal walking speed.",
    steps: [
      "Start the beat, or ask your helper to count 'one, two, one, two'.",
      "March on the spot, lifting each knee in time with the beat.",
      "Make sure each foot fully clears the floor and lands heel first.",
      "Once the rhythm is steady, step forwards in time with the beat.",
      "If your feet freeze, stop, restart the beat, and begin again."
    ],
    cues: [
      "Each step lands on the beat, not drifting between beats.",
      "Your knees lift clearly so your toes do not catch.",
      "Your steps stay an even length, left and right."
    ],
    mistakes: [
      "Speeding up until you are ahead of the beat and shuffling.",
      "Taking tiny steps - aim for a normal, full step length.",
      "Turning quickly on the spot - break turns into small steps around a wide curve.",
      "Stop and message your physio if you have a fall, or your freezing episodes are becoming much more frequent."
    ],
    defaultDosage: {
      sets: 3,
      reps: 20,
      perDay: 2,
      perWeek: 7,
      notes: "Count one step as one rep. A beat close to your normal walking speed, often around 100 beats per minute, suits most people - your physio can set the exact speed for you."
    }
  },
  {
    id: "ex-94",
    slug: "multiple-sclerosis-fatigue-paced-circuit",
    title: "Multiple Sclerosis Fatigue-Paced Circuit",
    bodyPart: "Neuro",
    clinicalArea: "neuro",
    tags: ["multiple-sclerosis", "pacing", "mobility"],
    condition: "Multiple sclerosis",
    stage: "Mobility phase",
    description: "A short, energy-conserving set of gentle movements with rest breaks, following pacing principles for fatigue management.",
    equipment: ["A sturdy chair", "A clock or timer"],
    setup: "Set out a firm chair with space to stand and move around it. Have water to hand and plan a rest after each part.",
    steps: [
      "Do five slow sit-to-stands from the chair, then sit and rest for a minute.",
      "Do ten seated marches, lifting each knee, then rest for a minute.",
      "Do ten slow heel raises holding the chair, then rest for a minute.",
      "Do five gentle standing side steps each way, then rest.",
      "Stop the circuit early if your legs feel heavy or your walking becomes unsteady."
    ],
    cues: [
      "You rest before you feel tired, not after.",
      "Movements stay slow and smooth throughout, with no rushing.",
      "You feel worked but not wiped out at the end."
    ],
    mistakes: [
      "Skipping the rest breaks to get it done quicker.",
      "Exercising in a hot room or the hottest part of the day, which worsens MS fatigue.",
      "Pushing on through heavy, weak legs, which tends to cause a longer setback.",
      "Stop and message your physio if you have a fall, a sudden drop in strength or vision, or new numbness that does not settle."
    ],
    defaultDosage: {
      sets: 1,
      reps: 5,
      perDay: 1,
      perWeek: 3,
      notes: "One full circuit counts as one set, and the rep number refers to the sit-to-stands in the first part. Start every other day and note how you feel the next day to guide how much to do."
    }
  },
  {
    id: "ex-95",
    slug: "coordination-drills-finger-to-nose",
    title: "Coordination Drills (Finger to Nose)",
    bodyPart: "Neuro",
    clinicalArea: "neuro",
    tags: ["ataxia", "coordination", "early-rehab"],
    condition: "Cerebellar ataxia",
    stage: "Early rehab",
    description: "Slowly touching the finger to the nose and back, a classic coordination exercise for cerebellar conditions.",
    equipment: [],
    setup: "Sit tall in a supportive chair with your arm resting comfortably. A helper can hold a fingertip out in front of you as a target, about an arm's length away.",
    steps: [
      "Start with your hand resting on your knee.",
      "Slowly reach out and touch the tip of your index finger to your nose.",
      "Slowly move your finger back out to touch the target or your helper's fingertip.",
      "Repeat at a steady, unhurried pace, keeping the path smooth."
    ],
    cues: [
      "The movement is slow and smooth, not fast and jerky.",
      "Your finger travels in a straight line rather than wandering or overshooting.",
      "You watch your finger the whole way to help guide it."
    ],
    mistakes: [
      "Moving fast to beat the shakiness - slower gives you more control.",
      "Swinging the whole arm from the shoulder instead of guiding with the hand.",
      "Doing so many that the arm tires and accuracy drops - stop and rest.",
      "Stop and message your physio if you have a fall, sudden new weakness, numbness, difficulty speaking, or a severe headache."
    ],
    defaultDosage: {
      sets: 2,
      reps: 10,
      perDay: 2,
      perWeek: 7,
      tempo: "slow and controlled",
      notes: "Quality matters more than quantity - end a set early if the movement becomes wild rather than controlled."
    }
  },
  {
    id: "ex-96",
    slug: "heel-shin-slide-coordination",
    title: "Heel-Shin Slide (Coordination)",
    bodyPart: "Neuro",
    clinicalArea: "neuro",
    tags: ["ataxia", "coordination", "early-rehab"],
    condition: "Cerebellar ataxia",
    stage: "Early rehab",
    description: "Sliding the heel smoothly down the opposite shin, training coordinated, controlled limb movement.",
    equipment: ["Exercise mat or a firm bed"],
    pose: "heelSlide",
    setup: "Lie on your back on a mat or a firm bed with your legs straight.",
    steps: [
      "Lift one foot and place your heel on the top of the opposite shin, just below the knee.",
      "Slowly slide your heel straight down your shin towards your ankle.",
      "Slide it smoothly back up to just below the knee.",
      "Lower your leg, then repeat and swap sides."
    ],
    cues: [
      "Your heel stays in contact with your shin the whole way.",
      "The slide follows a straight line down the middle of your shin.",
      "The pace is slow and even, without wobbling off track."
    ],
    mistakes: [
      "Going fast so the heel skids off to the side.",
      "Lifting the heel away from the shin partway through.",
      "Carrying on when the leg is tired and control has gone.",
      "Stop and message your physio if you have a fall, sudden new weakness, numbness, difficulty speaking, or a severe headache."
    ],
    defaultDosage: {
      sets: 2,
      reps: 8,
      perDay: 2,
      perWeek: 7,
      tempo: "slow and controlled",
      notes: "Count one full slide down and back up as one rep. Do the same number on each leg."
    }
  },
  {
    id: "ex-97",
    slug: "standing-balance-with-visual-feedback",
    title: "Standing Balance with Visual Feedback",
    bodyPart: "Neuro",
    clinicalArea: "neuro",
    tags: ["stroke", "balance", "mobility"],
    condition: "Post-stroke balance impairment",
    stage: "Mobility phase",
    description: "Standing in front of a mirror to visually correct posture and weight distribution after neurological injury.",
    equipment: ["A large or full-length mirror", "A worktop or sturdy chair to hold"],
    setup: "Stand in front of a mirror, close enough to a worktop or chair back to hold on, with your feet hip-width apart. Have a helper nearby.",
    steps: [
      "Look at your reflection and line your shoulders and hips up level.",
      "Adjust your weight until it feels even through both feet.",
      "Check the mirror - your nose, breastbone and belly button should form a vertical line.",
      "Hold this corrected position, glancing at the mirror to keep it.",
      "Rest, then set up and hold again."
    ],
    cues: [
      "Your weight is genuinely even, not quietly leaning on the stronger leg.",
      "Your shoulders stay level and relaxed, not hitched up on one side.",
      "You stand tall right through the hold rather than sinking as you tire."
    ],
    mistakes: [
      "Correcting your posture only when you look, then drifting straight back.",
      "Holding the worktop tightly instead of using it as a light back-up.",
      "Locking your knees rigidly to feel steadier.",
      "Stop and message your physio if you have a fall, sudden new weakness, numbness, difficulty speaking, or a severe headache."
    ],
    defaultDosage: {
      sets: 3,
      holdSeconds: 30,
      perDay: 1,
      perWeek: 5,
      notes: "Progress by resting your hand on the support more lightly, then by hovering it just above the support while a helper stands close."
    }
  },
  {
    id: "ex-98",
    slug: "functional-grasp-and-release",
    title: "Functional Grasp and Release",
    bodyPart: "Neuro",
    clinicalArea: "neuro",
    tags: ["stroke", "hand-function", "return-to-function"],
    condition: "Post-stroke hand weakness",
    stage: "Return to function",
    description: "Practising picking up and releasing everyday objects, rebuilding fine motor hand function for daily tasks.",
    equipment: [
      "A table",
      "Everyday objects of different sizes, such as a plastic cup, a pen, a sponge and a coin"
    ],
    pose: "gripSqueeze",
    setup: "Sit at a table with your affected forearm resting on the top and a few objects lined up within reach.",
    steps: [
      "Open your hand as wide as you can.",
      "Reach for an object and close your fingers around it.",
      "Lift it a short way off the table and hold for a moment.",
      "Place it down in a new spot and deliberately open your hand to let go.",
      "Repeat with objects of different shapes and sizes."
    ],
    cues: [
      "You focus on fully opening the hand, as letting go is often the harder part.",
      "Your wrist stays straight or slightly back, not dropped down.",
      "The movement is unhurried, giving your hand time to respond."
    ],
    mistakes: [
      "Trapping the object against your body or the table instead of gripping it.",
      "Forcing the fingers open or shut with your other hand rather than working the muscles.",
      "Carrying on once the hand cramps or tires - rest and come back to it.",
      "Stop and message your physio if you have a fall, sudden new weakness, numbness, difficulty speaking, or a severe headache."
    ],
    defaultDosage: {
      sets: 2,
      reps: 10,
      perDay: 2,
      perWeek: 7,
      notes: "Count one pick-up and release as one rep. Practising during real tasks like setting the table adds useful repetition."
    }
  },
  {
    id: "ex-99",
    slug: "gait-re-education-with-cueing",
    title: "Gait Re-Education with Cueing",
    bodyPart: "Neuro",
    clinicalArea: "neuro",
    tags: ["stroke", "parkinsons", "gait", "return-to-function"],
    condition: "Neurological gait impairment",
    stage: "Return to function",
    description: "Walking practice with verbal or visual cues to correct step length and foot clearance affected by neurological injury.",
    equipment: [
      "A clear walkway of a few metres",
      "Floor markers such as strips of tape, and a helper to give cues"
    ],
    setup: "Set out a clear, uncluttered walkway. Place tape lines on the floor about one comfortable step length apart. Have a helper walk alongside you.",
    steps: [
      "Stand tall at the start of the walkway.",
      "Walk forwards, aiming to land one foot on or just past each floor marker.",
      "As you step, think 'heel first, then lift my toes to clear the floor'.",
      "Let your helper cue 'big step' or 'stand tall' as needed.",
      "Turn in a wide curve using several small steps, then walk back."
    ],
    cues: [
      "Each foot clears the floor cleanly, with no scuffing or catching.",
      "Your steps are even in length on both sides.",
      "You look ahead rather than down at your feet once the rhythm is going."
    ],
    mistakes: [
      "Watching your feet the whole time, which rounds your posture.",
      "Taking shorter, quicker steps as you tire.",
      "Turning sharply on the spot instead of stepping around a curve.",
      "Stop and message your physio if you have a fall, sudden new weakness, numbness, difficulty speaking, or a severe headache."
    ],
    defaultDosage: {
      sets: 2,
      reps: 10,
      perDay: 2,
      perWeek: 7,
      notes: "Count one length of the walkway as one rep. Practise with a helper nearby until your physio agrees it is safe on your own."
    }
  },
  {
    id: "ex-100",
    slug: "trunk-rotation-in-sitting",
    title: "Trunk Rotation in Sitting",
    bodyPart: "Neuro",
    clinicalArea: "neuro",
    tags: ["stroke", "core-control", "early-rehab"],
    condition: "Post-stroke trunk control",
    stage: "Early rehab",
    description: "Rotating the upper body side to side while seated, rebuilding trunk control that underpins balance and reaching.",
    equipment: ["A firm chair without armrests, or the edge of a bed"],
    setup: "Sit tall on a firm chair or the edge of a bed, feet flat on the floor, hands resting in your lap or crossed over your chest.",
    steps: [
      "Sit as tall as you can, growing up through the top of your head.",
      "Slowly turn your head, shoulders and upper body to look over one shoulder.",
      "Return slowly to face the front.",
      "Turn slowly to the other side, then return."
    ],
    cues: [
      "Your hips and knees stay facing forwards - the turn happens in your trunk.",
      "You stay tall throughout, not slumping as you rotate.",
      "The movement is slow and even to both sides."
    ],
    mistakes: [
      "Letting your body collapse towards the weaker side.",
      "Pushing with your arms to force a bigger turn.",
      "Holding your breath during the turn.",
      "Stop and message your physio if you have a fall, sudden new weakness, numbness, difficulty speaking, or a severe headache."
    ],
    defaultDosage: {
      sets: 2,
      reps: 8,
      perDay: 2,
      perWeek: 7,
      tempo: "slow and controlled",
      notes: "A helper sitting beside your weaker side can steady you and give you something to turn towards."
    }
  },
  {
    id: "ex-101",
    slug: "standing-frame-or-supported-standing",
    title: "Standing Frame or Supported Standing",
    bodyPart: "Neuro",
    clinicalArea: "neuro",
    tags: ["spinal-cord-injury", "standing-tolerance", "early-rehab"],
    condition: "Spinal cord injury",
    stage: "Early rehab",
    description: "Supported standing for a set duration to maintain bone density, circulation and standing tolerance.",
    equipment: ["A standing frame, tilt table or other supported standing equipment set up by your team"],
    setup: "Your helper or team sets you up in the standing frame or supported standing device, with the straps and supports fitted as you were shown. Have your blood pressure checked first if you tend to feel faint on standing.",
    steps: [
      "Move into standing slowly, pausing partway if you feel light-headed.",
      "Once upright, check your knees, hips and trunk are supported and comfortable.",
      "Stand for your set time, breathing normally and keeping your head up.",
      "Come down slowly, then sit or lie for a few minutes afterwards."
    ],
    cues: [
      "Your skin over bony areas stays free of pressure points and rubbing.",
      "You feel steady and supported, with no dragging or pinching from the straps.",
      "Any light-headedness settles within a minute or two of being upright."
    ],
    mistakes: [
      "Standing longer than agreed before your tolerance has been built up.",
      "Ignoring early light-headedness, sweating or a thumping heartbeat.",
      "Leaving skin unchecked before and after, especially where you cannot feel it.",
      "Stop and message your physio if you feel faint and it does not clear, get a pounding headache with sweating or a blocked or runny nose, or find a new skin mark or sore."
    ],
    defaultDosage: {
      minutes: 5,
      perDay: 1,
      perWeek: 5,
      notes: "Start at around 5 minutes and build towards 30 to 45 minutes only as your team advises."
    }
  },
  {
    id: "ex-102",
    slug: "dual-task-cognitive-motor-training",
    title: "Dual-Task Cognitive-Motor Training",
    bodyPart: "Neuro",
    clinicalArea: "neuro",
    tags: ["stroke", "cognitive-motor", "return-to-function"],
    condition: "Post-stroke cognitive-motor impairment",
    stage: "Return to function",
    description: "Combining a simple physical task with a cognitive task (like naming items), rebuilding real-world dual-tasking ability.",
    equipment: ["A sturdy chair or worktop for balance", "A helper to set tasks and watch your balance"],
    setup: "Start seated if your balance is unsteady, or stand next to a worktop with a helper alongside. Choose one movement task and one thinking task.",
    steps: [
      "Begin the movement task on its own, such as marching on the spot or passing a ball from hand to hand.",
      "Once it is steady, add a thinking task - name animals, count back from 100 in threes, or list foods beginning with a letter.",
      "Keep both going together at a comfortable pace.",
      "If your movement stops or your balance wobbles, pause the thinking task and rebuild the movement.",
      "Swap in a new thinking task or a harder movement task as it gets easier."
    ],
    cues: [
      "The movement keeps going smoothly while you talk, rather than freezing each time you think.",
      "Your balance stays steady, with a helper watching for this.",
      "Both tasks feel challenging together but not overwhelming."
    ],
    mistakes: [
      "Choosing a thinking task so hard that you stop moving completely.",
      "Practising near hazards, or without a helper when you are standing.",
      "Pushing on when you are tired, as dual-tasking is one of the first things to slip.",
      "Stop and message your physio if you have a fall, sudden new weakness, numbness, difficulty speaking, or a severe headache."
    ],
    defaultDosage: {
      sets: 3,
      holdSeconds: 45,
      perDay: 1,
      perWeek: 5,
      notes: "Each 'hold' is one round of the combined tasks, about 30 to 60 seconds. Rest fully between rounds and build up the time before making either task harder."
    }
  },
  {
    id: "ex-103",
    slug: "ankle-pumps-post-surgery",
    title: "Ankle Pumps (Post-Surgery)",
    bodyPart: "Post-op",
    clinicalArea: "post_op",
    tags: ["post-op", "dvt-prevention", "early-rehab"],
    condition: "General post-surgical recovery",
    stage: "Early rehab",
    description: "Regular ankle pumping in bed to promote circulation and reduce clot risk in the first days after surgery.",
    equipment: [],
    pose: "anklePump",
    setup: "Lie in bed or sit propped up with the legs out straight in front of you and the calves resting on the bed.",
    steps: [
      "Point your toes and feet gently away from you, as if pressing a pedal.",
      "Pull your toes and feet back up toward your face.",
      "Move smoothly between the two positions, one ankle at a time or both together.",
      "You can add slow ankle circles in each direction once pumping feels easy."
    ],
    cues: [
      "The movement comes from your ankles, with your knees staying still and relaxed.",
      "You feel your calf muscles working gently as your foot moves.",
      "Keep breathing steadily and stay relaxed through your hips and the surgical area."
    ],
    mistakes: [
      "Tensing your thigh or the operated area to force a bigger movement.",
      "Pushing through pain rather than moving within a comfortable range.",
      "Doing a big burst once a day instead of small amounts often.",
      "Stop and seek urgent medical advice if you get new calf pain, swelling, redness, or heat, or you become short of breath - these can be signs of a blood clot."
    ],
    defaultDosage: {
      reps: 15,
      perDay: 5,
      perWeek: 7,
      notes: "One point-and-pull counts as 1 repetition. Do a round every hour or two while you are awake in the first days after surgery."
    }
  },
  {
    id: "ex-104",
    slug: "quad-sets",
    title: "Quad Sets",
    bodyPart: "Post-op",
    clinicalArea: "post_op",
    tags: ["knee-replacement", "quad-activation", "early-rehab"],
    condition: "Post knee replacement",
    stage: "Early rehab",
    description: "Gently tightening the thigh muscle without bending the knee, reactivating the quadriceps in the earliest days after surgery.",
    equipment: ["A small rolled towel"],
    setup: "Sit or lie with the operated leg straight out in front of you, with a small rolled towel under your ankle if that is comfortable.",
    steps: [
      "Tighten the thigh muscle of the operated leg, pressing the back of the knee down toward the bed.",
      "Feel the muscle firm up and the kneecap draw slightly up toward your hip.",
      "Hold the squeeze while you keep breathing normally.",
      "Relax the thigh fully and rest for a few seconds before the next one."
    ],
    cues: [
      "The knee stays straight the whole time - this is a squeeze, not a bend.",
      "You can feel the thigh muscle go hard if you rest a hand on it.",
      "Your breathing carries on steadily throughout the hold."
    ],
    mistakes: [
      "Holding your breath or bearing down while you squeeze.",
      "Pressing so hard that the joint itself becomes painful.",
      "Squeezing only your buttock and not the front of the thigh.",
      "Stop and message your physio if the knee becomes hot, red, and swollen, or the wound leaks fluid, or your calf becomes painful and swollen."
    ],
    defaultDosage: {
      reps: 10,
      holdSeconds: 10,
      perDay: 3,
      perWeek: 7,
      notes: "Hold each squeeze for about 10 seconds in the early days and build up toward 20 seconds as it gets easier."
    }
  },
  {
    id: "ex-105",
    slug: "assisted-knee-flexion",
    title: "Assisted Knee Flexion",
    bodyPart: "Post-op",
    clinicalArea: "post_op",
    tags: ["knee-replacement", "range-of-motion", "early-rehab"],
    condition: "Post knee replacement",
    stage: "Early rehab",
    description: "Using the other leg or a strap to gently assist bending the operated knee, restoring range before stiffness sets in.",
    equipment: ["A strap, belt, or long towel"],
    pose: "heelSlide",
    setup: "Sit on a firm bed or the floor with both legs out straight. Loop a strap around the sole of the operated foot, or rest your other ankle across it to help.",
    steps: [
      "Slide the heel of the operated leg slowly toward your bottom, letting the strap or your other leg do the pulling.",
      "Keep the muscles of the operated leg relaxed as the knee bends.",
      "Stop where you feel a firm but comfortable stretch and hold it for a moment.",
      "Guide the leg slowly back out straight, still using the strap or your other leg for control."
    ],
    cues: [
      "The assistance does the work while the operated thigh stays soft.",
      "You feel a gentle pull around the knee, not a sharp or pinching pain.",
      "The bend and the return are both slow and even."
    ],
    mistakes: [
      "Forcing the knee past a gentle stretch into real pain.",
      "Bouncing at the end of the bend to gain more range.",
      "Letting the leg flop back out straight instead of controlling it.",
      "Stop and message your physio if a stretch leaves lasting pain, or the knee becomes hot, red, and swollen, or the wound starts to leak."
    ],
    defaultDosage: {
      sets: 2,
      reps: 8,
      perDay: 3,
      perWeek: 7,
      tempo: "slow and controlled",
      notes: "A gentle stretch that eases within a few seconds is fine. Work within the range your surgeon or physio has given you."
    }
  },
  {
    id: "ex-106",
    slug: "hip-abduction-in-lying-post-op",
    title: "Hip Abduction in Lying (Post-Op)",
    bodyPart: "Post-op",
    clinicalArea: "post_op",
    tags: ["hip-replacement", "precautions", "early-rehab"],
    condition: "Post hip replacement",
    stage: "Early rehab",
    description: "Sliding the operated leg out to the side within precautions, maintaining hip strength while respecting surgical guidelines.",
    equipment: ["A plastic bag or smooth board to put under your heel"],
    setup: "Lie on your back on the bed with both legs straight, and put something smooth under the heel of the operated leg so it slides easily.",
    steps: [
      "Check the kneecap and toes of the operated leg point straight up at the ceiling.",
      "Slide the operated leg out to the side as far as is comfortable, keeping it flat on the bed.",
      "Slide the leg slowly back until it reaches the other leg.",
      "Stop when the legs meet - do not bring the operated leg across the middle of your body."
    ],
    cues: [
      "The kneecap and toes stay pointing at the ceiling, so the leg does not roll inward.",
      "The slide out and back is slow and smooth.",
      "You bring the leg back only as far as the midline, never across it."
    ],
    mistakes: [
      "Letting the operated leg roll in so the toes turn toward the other foot - this breaks your hip precautions.",
      "Bringing or crossing the operated leg over the midline of your body.",
      "Arching your lower back or hitching your hip to move the leg further.",
      "Stop and message your physio if the hip becomes very painful or feels like it has slipped, or the wound is hot, red, or leaking, or your calf becomes painful and swollen."
    ],
    defaultDosage: {
      sets: 2,
      reps: 10,
      perDay: 2,
      perWeek: 7,
      tempo: "slow and controlled",
      notes: "Keep to your hip precautions at all times: do not cross the leg past the midline and do not turn the leg inward."
    }
  },
  {
    id: "ex-107",
    slug: "supported-standing-post-hip",
    title: "Supported Standing (Post-Hip)",
    bodyPart: "Post-op",
    clinicalArea: "post_op",
    tags: ["hip-replacement", "functional", "early-rehab"],
    condition: "Post hip replacement",
    stage: "Early rehab",
    description: "Standing with a frame or rail soon after surgery, the first step toward safe, independent walking again.",
    equipment: ["A stable walking frame or a fixed rail", "A firm, high chair or bed"],
    setup: "Sit on the edge of a firm, high chair or bed with a walking frame or a fixed rail in front of you. Have someone nearby for your first few attempts.",
    steps: [
      "Shuffle forward so your bottom is near the front edge of the seat.",
      "Push up through your hands on the chair or bed and through your unoperated leg.",
      "Stand up tall and rest your hands on the frame or rail once you are balanced.",
      "Lower yourself slowly back down, reaching for the seat with your hands, rather than dropping."
    ],
    cues: [
      "You push up through the chair and your strong leg, not by pulling on the frame.",
      "Once steady, you stand upright with your weight even between both feet as allowed.",
      "The way back down is slow and controlled."
    ],
    mistakes: [
      "Pulling yourself up on the walking frame, which can tip toward you.",
      "Flopping back down into the chair instead of lowering with control.",
      "Standing for so long that you feel light-headed.",
      "Stop and sit down if you feel faint or dizzy, and message your physio if you cannot put the weight through the leg that you have been told is allowed."
    ],
    defaultDosage: {
      sets: 1,
      reps: 5,
      holdSeconds: 30,
      perDay: 3,
      perWeek: 7,
      notes: "Build the standing time up gradually. Stop sooner if you feel light-headed, and keep to any weight-bearing limit your surgeon has set."
    }
  },
  {
    id: "ex-108",
    slug: "shoulder-pendulum-post-rotator-cuff",
    title: "Shoulder Pendulum (Post-Rotator Cuff)",
    bodyPart: "Post-op",
    clinicalArea: "post_op",
    tags: ["rotator-cuff-repair", "early-rehab"],
    condition: "Post rotator cuff repair",
    stage: "Early rehab",
    description: "A relaxed pendulum swing while the repair heals, moving the shoulder passively without active muscle effort.",
    equipment: ["A table or the back of a chair for support"],
    pose: "pendulum",
    setup: "Stand and lean forward from your hips, resting your good hand on a table or chair back. Let the operated arm hang straight down, loose and heavy.",
    steps: [
      "Let the operated arm hang completely relaxed, like a rope.",
      "Gently rock your body or shift your weight from foot to foot so the arm starts to swing on its own.",
      "Let it swing forward and back, then side to side, then in small circles each way.",
      "Keep the shoulder muscles switched off the whole time and let the arm slow to a stop by itself."
    ],
    cues: [
      "The swing comes from your body moving, not from your shoulder working.",
      "The arm stays completely loose and heavy throughout.",
      "Small, easy swings are all you need."
    ],
    mistakes: [
      "Actively lifting or swinging the arm using your shoulder muscles.",
      "Making big or forceful circles.",
      "Holding the arm tense instead of letting it dangle.",
      "Stop and message your physio if you feel a sharp pull or pop at the front of the shoulder, or the wound becomes hot, red, or starts to leak."
    ],
    defaultDosage: {
      reps: 10,
      perDay: 4,
      perWeek: 7,
      tempo: "slow and relaxed",
      notes: "One round is about 10 relaxed swings each way - forward and back, side to side, then small circles. Do a round every few hours, staying within your surgical protocol."
    }
  },
  {
    id: "ex-109",
    slug: "passive-shoulder-flexion-assisted",
    title: "Passive Shoulder Flexion (Assisted)",
    bodyPart: "Post-op",
    clinicalArea: "post_op",
    tags: ["rotator-cuff-repair", "range-of-motion", "early-rehab"],
    condition: "Post rotator cuff repair",
    stage: "Early rehab",
    description: "Using the unaffected arm or a pulley to lift the healing arm overhead without the repaired muscle working.",
    equipment: ["A light stick, walking cane, or broom handle"],
    pose: "overheadReach",
    setup: "Lie on your back holding a light stick across your thighs with both hands, palms facing up and elbows straight.",
    steps: [
      "Use your good arm to push the stick up and back, guiding the operated arm overhead.",
      "Let the operated arm stay relaxed and go along for the ride.",
      "Stop where you feel a gentle stretch and hold it for a moment.",
      "Lower the stick back down slowly, with the good arm still doing the work."
    ],
    cues: [
      "The good arm does all of the lifting and lowering.",
      "The operated shoulder and arm stay relaxed throughout.",
      "You feel a gentle stretch at the end of the range, not a pull in the repair."
    ],
    mistakes: [
      "Letting the operated arm push or help lift the stick.",
      "Forcing past the point of a comfortable stretch.",
      "Letting the arm drop quickly on the way down.",
      "Stop and message your physio if you feel a sharp pull at the front of the shoulder, or pain that is clearly worse day to day, or the wound looks infected."
    ],
    defaultDosage: {
      sets: 2,
      reps: 8,
      perDay: 3,
      perWeek: 7,
      tempo: "slow and controlled",
      notes: "Only move into the range your surgeon or physio has allowed for this stage of healing."
    }
  },
  {
    id: "ex-110",
    slug: "incision-site-scar-mobilisation",
    title: "Incision Site Scar Mobilisation",
    bodyPart: "Post-op",
    clinicalArea: "post_op",
    tags: ["scar-management", "mobility"],
    condition: "Post-surgical scar tightness",
    stage: "Mobility phase",
    description: "Gentle circular massage around a healed incision to reduce adhesions and improve tissue mobility.",
    equipment: ["A little unscented moisturiser or oil"],
    setup: "Sit somewhere comfortable with the healed scar clean and uncovered. Put a little unscented moisturiser on one or two fingertips.",
    steps: [
      "Rest one or two fingers flat on the skin right next to the scar.",
      "Move the skin in small, slow circles, so the skin glides over the tissue underneath.",
      "Work slowly along the whole length of the scar.",
      "Then gently push the skin toward the scar line and away from it, up and down its length."
    ],
    cues: [
      "You are moving the skin over the deeper tissue, not just sliding across the surface.",
      "The pressure is firm but stays comfortable.",
      "Over days and weeks the scar and the skin around it feel less tight."
    ],
    mistakes: [
      "Starting before the wound is fully closed and healed.",
      "Pressing hard enough to redden, blister, or break the skin.",
      "Rubbing over a scab or an area that is still open.",
      "Stop and message your physio if the scar reopens, weeps fluid, or becomes hot, red, and swollen."
    ],
    defaultDosage: {
      sets: 1,
      reps: 10,
      perDay: 2,
      perWeek: 7,
      tempo: "slow and controlled",
      notes: "Only start once the wound is fully closed and healed with no scab - usually a few weeks after surgery, but check with your physio or surgeon first. Count circles along the scar as your repetitions."
    }
  },
  {
    id: "ex-111",
    slug: "graduated-weight-bearing",
    title: "Graduated Weight-Bearing",
    bodyPart: "Post-op",
    clinicalArea: "post_op",
    tags: ["fracture-repair", "functional", "mobility"],
    condition: "Post-fracture fixation",
    stage: "Mobility phase",
    description: "Progressively increasing how much body weight is taken through the healing limb, following the surgeon's protocol.",
    equipment: ["A set of bathroom scales", "A stable rail or surface to hold"],
    setup: "Stand holding a firm rail or surface, with a set of bathroom scales placed under the foot of the healing leg.",
    steps: [
      "Check the weight-bearing limit your surgeon has set, such as toe-touch only, a set number of kilos, or a share of your body weight.",
      "Slowly press the healing leg down onto the scales until you reach that amount.",
      "Hold it steady for a few seconds so you learn how that pressure feels through the leg.",
      "Ease the weight off slowly and rest before the next go."
    ],
    cues: [
      "You match the exact amount your surgeon allows and no more.",
      "You use the scales as a guide until the right pressure feels familiar without them.",
      "Your hands stay ready on the rail for support."
    ],
    mistakes: [
      "Putting more weight through the leg than your surgeon has cleared.",
      "Moving yourself on to more weight before your surgeon or physio says it is safe.",
      "Leaning and limping heavily rather than using the walking aid you were given.",
      "Stop and message your physio if the pain suddenly increases, the leg makes a new noise or gives way, or the wound becomes hot, red, or leaks."
    ],
    defaultDosage: {
      sets: 1,
      reps: 10,
      holdSeconds: 5,
      perDay: 3,
      perWeek: 7,
      notes: "Only work up to the weight-bearing status your surgeon has set. Do not increase it until they or your physio tell you it is safe."
    }
  },
  {
    id: "ex-112",
    slug: "core-bracing-post-abdominal-surgery",
    title: "Core Bracing (Post-Abdominal Surgery)",
    bodyPart: "Post-op",
    clinicalArea: "post_op",
    tags: ["abdominal-surgery", "core-control", "early-rehab"],
    condition: "Post-abdominal surgery",
    stage: "Early rehab",
    description: "A gentle core engagement technique to support the healing abdominal wall during coughing, moving or lifting.",
    equipment: ["A folded towel or firm pillow"],
    setup: "Lie on your back with your knees bent and feet flat, or sit well supported in a chair.",
    steps: [
      "Breathe in gently and let your tummy relax.",
      "As you breathe out, draw your lower tummy in a little, as if gently tightening a belt.",
      "Keep breathing lightly while you hold this gentle tension.",
      "Before you cough, sneeze, roll over, or stand up, switch this brace on and press a folded towel or your hands against the wound for support."
    ],
    cues: [
      "The tightening is gentle, around a quarter of your hardest effort.",
      "You can still talk and breathe easily while you hold the brace.",
      "You feel steadier through your middle, without straining."
    ],
    mistakes: [
      "Bracing so hard that you hold your breath or bear down.",
      "Pushing your tummy outward instead of drawing it gently in.",
      "Forgetting to support the wound with your hands or a towel when you cough or move.",
      "Stop and message your physio if a bulge appears along the wound, or the wound area becomes hot, red, swollen, or starts to leak."
    ],
    defaultDosage: {
      sets: 3,
      reps: 10,
      holdSeconds: 5,
      perDay: 2,
      perWeek: 7,
      notes: "Also use the brace as a habit every time you cough, sneeze, or change position, supporting the wound as you do."
    }
  },
  {
    id: "ex-113",
    slug: "post-op-walking-programme",
    title: "Post-Op Walking Programme",
    bodyPart: "Post-op",
    clinicalArea: "post_op",
    tags: ["functional", "mobility"],
    condition: "General post-surgical recovery",
    stage: "Mobility phase",
    description: "A structured, gradually increasing daily walking distance to rebuild general fitness after time spent recovering.",
    equipment: ["Supportive shoes", "Any walking aid you have been given"],
    setup: "Put on supportive shoes and take any walking aid you were given. Choose a flat, even route close to home.",
    steps: [
      "Set off at an easy, comfortable pace.",
      "Walk out for about half your planned time, then turn back, so you are never far from home.",
      "Add a few minutes to the total every two or three days as it feels manageable.",
      "Sit and raise the leg afterward if you notice any swelling."
    ],
    cues: [
      "You can hold a conversation comfortably while you walk.",
      "Any ache settles quickly once you stop and rest.",
      "You feel pleasantly tired afterward, not wiped out for the rest of the day."
    ],
    mistakes: [
      "Doing one long walk rather than building the distance up gradually.",
      "Increasing your time and your speed at the same time.",
      "Ignoring swelling instead of resting and raising the leg.",
      "Stop and seek urgent medical advice if you get calf pain, swelling, or heat, chest pain, or sudden breathlessness."
    ],
    defaultDosage: {
      minutes: 10,
      perDay: 2,
      perWeek: 7,
      notes: "Start at about 5 to 10 minutes per walk, twice a day, and add 2 to 5 minutes every few days, working toward 30 minutes. If you count steps, raise your daily total by roughly 10 percent each week."
    }
  },
  {
    id: "ex-114",
    slug: "resisted-knee-extension-post-acl",
    title: "Resisted Knee Extension (Post-ACL)",
    bodyPart: "Post-op",
    clinicalArea: "post_op",
    tags: ["acl-reconstruction", "strength-phase"],
    condition: "Post-ACL reconstruction",
    stage: "Strength phase",
    description: "Light resisted knee straightening within the surgeon's protocol, rebuilding quadriceps strength after graft healing time.",
    equipment: ["A resistance band", "A sturdy chair"],
    pose: "kneeExt",
    setup: "Sit tall in a sturdy chair with a light resistance band looped around the ankle of the operated leg and anchored to a chair or table leg behind you.",
    steps: [
      "Start with the knee bent and the band pulling it gently backward.",
      "Straighten the knee against the band, going as far as your surgeon's protocol allows.",
      "Squeeze the thigh muscle for a moment at the end.",
      "Lower the knee back slowly, resisting the band all the way."
    ],
    cues: [
      "The movement is smooth and controlled in both directions.",
      "You work within the range your surgeon has allowed, not forcing full straightening too early.",
      "The thigh muscle does the work, and the knee joint feels supported."
    ],
    mistakes: [
      "Using a heavy band too soon after the graft.",
      "Snapping the knee straight or letting it drop back quickly.",
      "Working into a range or load your protocol does not yet allow.",
      "Stop and message your physio if you get pain around the graft site, the knee swells or gives way, or the wound becomes hot, red, or leaks."
    ],
    defaultDosage: {
      sets: 3,
      reps: 10,
      perDay: 1,
      perWeek: 4,
      tempo: "slow and controlled",
      notes: "Stay within the range and the load your surgeon's protocol allows for this stage of recovery."
    }
  },
  {
    id: "ex-115",
    slug: "proprioception-board-post-ankle-surgery",
    title: "Proprioception Board (Post-Ankle Surgery)",
    bodyPart: "Post-op",
    clinicalArea: "post_op",
    tags: ["ankle-surgery", "proprioception", "return-to-function"],
    condition: "Post-ankle surgery",
    stage: "Return to function",
    description: "Balancing on a wobble board once weight-bearing is cleared, restoring the joint position sense lost after surgery.",
    equipment: ["A wobble or balance board", "A wall or rail to hold"],
    pose: "balance",
    setup: "Stand next to a wall or rail you can hold. Place the wobble board on a non-slip floor and step both feet onto it, hip-width apart.",
    steps: [
      "Hold the support and find your balance with the board level.",
      "When you feel steady, take your hands off the support.",
      "Keep the board as level and still as you can, letting your ankle make small corrections.",
      "Hold your balance, then rest your hands back on the support and step off."
    ],
    cues: [
      "Your ankle and foot do the balancing with lots of small adjustments.",
      "You stand tall and look ahead, not down at your feet.",
      "The corrections stay small and controlled rather than big wobbles."
    ],
    mistakes: [
      "Starting before your surgeon has cleared you to take full weight through the ankle.",
      "Trying one-leg balance or closing your eyes before two-leg balance feels easy.",
      "Gripping the support the whole time instead of testing your balance.",
      "Stop and message your physio if you get sharp ankle pain, the ankle gives way, or swelling that lasts into the next day."
    ],
    defaultDosage: {
      sets: 3,
      holdSeconds: 30,
      perDay: 1,
      perWeek: 5,
      notes: "Progress only when the current level feels easy: two feet, then one foot, then eyes closed."
    }
  },
  {
    id: "ex-116",
    slug: "return-to-function-strength-circuit",
    title: "Return-to-Function Strength Circuit",
    bodyPart: "Post-op",
    clinicalArea: "post_op",
    tags: ["functional", "return-to-function"],
    condition: "Late-stage post-surgical rehabilitation",
    stage: "Return to function",
    description: "A combined circuit of functional strength movements marking the transition back to normal activity levels.",
    equipment: ["A sturdy chair or box", "A step", "A resistance band"],
    setup: "Set out a chair or box, a step, and a band within a small space so you can move between them.",
    steps: [
      "Move through a circuit of about four exercises, such as sit-to-stands, step-ups, band rows, and calf raises.",
      "Do one set of each with good form, then move on to the next.",
      "Rest for about a minute, then repeat the whole circuit.",
      "End a set early if your technique breaks down or the operated limb aches sharply."
    ],
    cues: [
      "Your technique looks the same on the last repetition as on the first.",
      "The operated and non-operated sides share the work fairly evenly.",
      "Any ache afterward settles within a day."
    ],
    mistakes: [
      "Chasing higher numbers at the cost of good form.",
      "Skipping the rest between circuits.",
      "Adding load or speed faster than your body adapts.",
      "Stop and message your physio if you get sharp joint pain, swelling that builds through the day, or the limb gives way."
    ],
    defaultDosage: {
      sets: 2,
      reps: 10,
      perDay: 1,
      perWeek: 4,
      notes: "One set means one time through the circuit. Build from 2 circuits toward 3 as it gets easier, keeping to any limits from your surgeon or physio."
    }
  },
  {
    id: "ex-117",
    slug: "breathing-exercises-post-thoracic-surgery",
    title: "Breathing Exercises (Post-Thoracic Surgery)",
    bodyPart: "Post-op",
    clinicalArea: "post_op",
    tags: ["thoracic-surgery", "respiratory", "early-rehab"],
    condition: "Post-thoracic or cardiac surgery",
    stage: "Early rehab",
    description: "Deep breathing and supported coughing technique to clear the chest and reduce post-surgical respiratory complications.",
    equipment: ["A firm pillow or rolled towel"],
    setup: "Sit upright in a chair or well propped up in bed. Hold a firm pillow or rolled towel against your wound.",
    steps: [
      "Breathe in slowly and deeply through your nose, letting your lower ribs widen.",
      "Hold the breath gently for two or three seconds at the top.",
      "Breathe out easily through your mouth.",
      "After every few deep breaths, hug the pillow firmly against the wound and give one or two small huffs or a gentle cough to clear your chest."
    ],
    cues: [
      "Your lower ribs and tummy move outward as you breathe in, not just your shoulders.",
      "The pillow gives firm support against the wound each time you huff or cough.",
      "Your chest feels like it is gradually clearing."
    ],
    mistakes: [
      "Breathing only shallowly into the top of your chest.",
      "Coughing or huffing without supporting the wound.",
      "Skipping the exercises because they feel like hard work.",
      "Stop and seek urgent medical advice if you become more breathless, get chest pain or a fever, or cough up green, brown, or bloody phlegm."
    ],
    defaultDosage: {
      sets: 1,
      reps: 10,
      perDay: 5,
      perWeek: 7,
      notes: "Do a round of about 10 deep breaths followed by supported huffs every hour or so while you are awake in the first days after surgery."
    }
  },
  {
    id: "ex-118",
    slug: "graduated-return-to-driving-readiness",
    title: "Graduated Return to Driving Readiness",
    bodyPart: "Post-op",
    clinicalArea: "post_op",
    tags: ["functional", "return-to-function"],
    condition: "Post-surgical driving readiness",
    stage: "Return to function",
    description: "Practising an emergency-stop foot movement and seated reach tasks to check readiness to safely resume driving.",
    equipment: ["Your parked car"],
    setup: "Sit in the driver's seat of your parked car with the engine off and the seatbelt on, somewhere safe and off the road.",
    steps: [
      "Move your foot quickly from the accelerator across to the brake and press down firmly, as you would in an emergency stop.",
      "Check you can hold the brake down hard without pain or hesitation.",
      "Turn to look over each shoulder and check all of your mirrors.",
      "Reach for and use the seatbelt, handbrake, and gearstick to check none of them pull on your wound."
    ],
    cues: [
      "The emergency-stop movement is quick, firm, and pain-free.",
      "You can turn to check your blind spots without sharp pain or dizziness.",
      "Fastening and releasing the seatbelt feels comfortable."
    ],
    mistakes: [
      "Driving for real before your surgeon says it is safe and your insurer has confirmed you are covered.",
      "Testing on a public road instead of practising while parked first.",
      "Ignoring pain or stiffness that would slow down an emergency stop.",
      "Stop and message your physio if braking or twisting causes wound pain, or you cannot perform an emergency stop confidently."
    ],
    defaultDosage: {
      sets: 1,
      reps: 5,
      perDay: 1,
      perWeek: 7,
      notes: "This is a readiness check, not permission to drive. Always confirm with your surgeon and your car insurer before you actually return to driving."
    }
  },
  {
    id: "ex-119",
    slug: "pelvic-floor-activation-basic",
    title: "Pelvic Floor Activation (Basic)",
    bodyPart: "Pelvic health",
    clinicalArea: "pelvic_health",
    tags: ["pelvic-floor", "incontinence", "early-rehab"],
    condition: "Stress urinary incontinence",
    stage: "Early rehab",
    description: "A gentle 'lift and squeeze' pelvic floor contraction, the foundation exercise for pelvic floor rehabilitation.",
    equipment: ["A firm chair"],
    setup: "Sit tall on a firm chair, or lie on your back with your knees bent and feet flat, whichever helps you concentrate. Let your buttocks, thighs and tummy stay relaxed.",
    steps: [
      "Breathe in gently, then breathe out and squeeze and lift the muscles around your back passage, vagina and bladder, as if trying to stop wind and stop the flow of urine at the same time.",
      "Hold the lift for about 4 seconds while you keep breathing.",
      "Fully let go and feel the muscles completely relax.",
      "Rest for about 4 seconds, then repeat."
    ],
    cues: [
      "The lift is an inward and upward feeling, not a push down.",
      "Your buttocks, thighs and tummy stay soft - only the pelvic floor works.",
      "You feel a clear 'let go' after each squeeze, not a half-held tension."
    ],
    mistakes: [
      "Holding your breath or bracing your tummy to create the effort.",
      "Squeezing your buttocks or pulling your knees together instead.",
      "Bearing down or pushing out rather than drawing up and in.",
      "Stop and message your physio if you notice new pelvic pain, a dragging or heavy feeling, or any bleeding."
    ],
    defaultDosage: {
      sets: 1,
      reps: 8,
      holdSeconds: 4,
      perDay: 3,
      perWeek: 7,
      notes: "One rep is one squeeze, lift and full release. Rest about 4 seconds between reps so the muscle relaxes completely."
    }
  },
  {
    id: "ex-120",
    slug: "pelvic-floor-endurance-hold",
    title: "Pelvic Floor Endurance Hold",
    bodyPart: "Pelvic health",
    clinicalArea: "pelvic_health",
    tags: ["pelvic-floor", "incontinence", "strength-phase"],
    condition: "Stress urinary incontinence",
    stage: "Strength phase",
    description: "Holding a pelvic floor contraction for progressively longer counts, building the endurance needed for daily continence.",
    equipment: [],
    setup: "Sit, stand or lie in a comfortable position where you can concentrate. Start in whichever position is easiest and work towards doing it sitting and standing over time.",
    steps: [
      "Squeeze and lift the pelvic floor, drawing up and in as in the basic activation.",
      "Hold the lift steady for your target count while breathing normally.",
      "Keep the strength of the lift as even as you can from start to finish.",
      "Fully release, then rest for about the same length of time as the hold before the next one."
    ],
    cues: [
      "The hold stays fairly steady - holding 5 seconds well beats holding 10 seconds fading.",
      "You keep breathing throughout; the hold does not rely on a held breath.",
      "You feel a full release at the end of each rep."
    ],
    mistakes: [
      "Letting the lift slowly slide away while you count.",
      "Adding buttock, thigh or tummy squeeze as the muscle tires.",
      "Pushing the hold time up faster than the muscle can manage.",
      "Stop and message your physio if you notice new pelvic pain, a dragging or heavy feeling, or any bleeding."
    ],
    defaultDosage: {
      sets: 1,
      reps: 8,
      holdSeconds: 8,
      perDay: 3,
      perWeek: 7,
      tempo: "add a second or two to the hold each week",
      notes: "Start with a hold you can keep steady, even 3 to 5 seconds, and build towards 10 seconds. Rest as long as the hold between reps."
    }
  },
  {
    id: "ex-121",
    slug: "fast-twitch-pelvic-floor-the-knack",
    title: "Fast-Twitch Pelvic Floor 'The Knack'",
    bodyPart: "Pelvic health",
    clinicalArea: "pelvic_health",
    tags: ["pelvic-floor", "incontinence", "strength-phase"],
    condition: "Stress urinary incontinence (cough/sneeze leakage)",
    stage: "Strength phase",
    description: "A quick pre-emptive pelvic floor squeeze timed just before a cough or sneeze, a technique proven to reduce leakage.",
    equipment: [],
    setup: "Sit or stand tall. Once you have practised the quick squeeze on its own, you will start using it just before anything that normally makes you leak.",
    steps: [
      "Squeeze and lift the pelvic floor quickly and firmly.",
      "Let go completely straight away.",
      "Repeat the quick squeezes in a row, keeping each one sharp and each release full.",
      "To use 'the knack', do one firm quick squeeze the moment before you cough, sneeze, laugh or lift, then release once it has passed."
    ],
    cues: [
      "Each squeeze is fast and definite, then fully released - not held on.",
      "The squeeze comes just before the cough or sneeze, not during or after.",
      "Your breathing carries on; you do not hold your breath to brace."
    ],
    mistakes: [
      "Turning the quick squeezes into slow holds.",
      "Only half releasing between reps so the muscle never rests.",
      "Forgetting to let go once the cough or sneeze has passed.",
      "Stop and message your physio if you notice new pelvic pain, a dragging or heavy feeling, or any bleeding."
    ],
    defaultDosage: {
      sets: 3,
      reps: 10,
      perDay: 2,
      perWeek: 7,
      tempo: "a fast, strong squeeze and an immediate full release",
      notes: "One rep is one quick squeeze and release. Also use it in daily life: squeeze firmly just before every cough, sneeze, laugh or lift."
    }
  },
  {
    id: "ex-122",
    slug: "deep-core-and-pelvic-floor-co-activation",
    title: "Deep Core and Pelvic Floor Co-Activation",
    bodyPart: "Pelvic health",
    clinicalArea: "pelvic_health",
    tags: ["pelvic-floor", "core-control", "postnatal", "strength-phase"],
    condition: "Postnatal core recovery",
    stage: "Strength phase",
    description: "Gently drawing in the lower abdomen together with the pelvic floor, rebuilding coordinated deep core support.",
    equipment: ["Exercise mat"],
    setup: "Lie on your back with your knees bent and feet flat, or sit tall. Rest one hand on your lower tummy, just inside your hip bones.",
    steps: [
      "Breathe out gently and lift the pelvic floor as you have practised.",
      "At the same time, draw your lower tummy in softly, as if a low waistband is tightening.",
      "Hold both together for about 5 seconds while breathing normally.",
      "Release your tummy and pelvic floor together and rest."
    ],
    cues: [
      "The tummy draws flatter and firmer, but does not suck in hard or dome up.",
      "Your back stays still and your ribs stay soft - no arching or flattening of the spine.",
      "The pelvic floor lift and the tummy draw-in happen together, not one then the other."
    ],
    mistakes: [
      "Pulling the tummy in so hard that you cannot breathe or talk easily.",
      "Letting the pelvic floor drop while you focus on the tummy.",
      "Holding your breath to hold the position.",
      "Stop and message your physio if you notice new pelvic pain, a dragging or heavy feeling, or any bleeding."
    ],
    defaultDosage: {
      sets: 2,
      reps: 10,
      holdSeconds: 5,
      perDay: 1,
      perWeek: 6,
      notes: "Keep the effort light, about a quarter of your maximum. One rep is one gentle draw-in, hold and release."
    }
  },
  {
    id: "ex-123",
    slug: "diastasis-safe-curl-up",
    title: "Diastasis-Safe Curl-Up",
    bodyPart: "Pelvic health",
    clinicalArea: "pelvic_health",
    tags: ["diastasis-recti", "postnatal", "core-control", "mobility"],
    condition: "Diastasis recti (postnatal)",
    stage: "Mobility phase",
    description: "A modified, supported abdominal curl that avoids doming through the midline while abdominal separation heals.",
    equipment: ["Exercise mat", "A towel"],
    setup: "Lie on your back with your knees bent and feet flat on the floor. Wrap a towel around your lower back and cross the ends over your tummy, holding one end in each hand for gentle support.",
    steps: [
      "Breathe out, lift your pelvic floor and gently draw your lower tummy in.",
      "As you gently pull the towel ends across each other, lift your head and the tops of your shoulders a small way off the floor.",
      "Keep the lift small enough that your tummy stays flat, with no ridge or bulge down the middle.",
      "Lower your head and shoulders back down slowly and release."
    ],
    cues: [
      "The tummy stays flat or draws inward as you lift, not pushed up into a dome.",
      "The movement is small and controlled - your shoulder blades barely leave the floor at first.",
      "You breathe out as you lift and in as you lower."
    ],
    mistakes: [
      "Lifting so high that a ridge appears or the tummy bulges along the midline - lift less.",
      "Leading with your chin or pulling your head up with your hands.",
      "Holding your breath through the lift.",
      "Stop and message your physio if you notice new pelvic pain, a dragging or heavy feeling, doming that does not settle with a smaller lift, or any bleeding."
    ],
    defaultDosage: {
      sets: 2,
      reps: 8,
      perDay: 1,
      perWeek: 5,
      tempo: "slow and controlled",
      notes: "One rep is lifting the head and shoulders a little way and lowering with control. Stop the set if the tummy domes along the midline."
    }
  },
  {
    id: "ex-124",
    slug: "pelvic-floor-relaxation-drop",
    title: "Pelvic Floor Relaxation / Drop",
    bodyPart: "Pelvic health",
    clinicalArea: "pelvic_health",
    tags: ["pelvic-floor", "pelvic-pain", "early-rehab"],
    condition: "Pelvic pain / overactive pelvic floor",
    stage: "Early rehab",
    description: "Consciously lengthening and releasing the pelvic floor with breathing, important where the pelvic floor is overactive rather than weak.",
    equipment: ["Exercise mat", "A pillow"],
    setup: "Lie on your back with your knees bent and feet flat, or with your knees resting over a pillow. Let your tummy, buttocks and jaw go loose.",
    steps: [
      "Breathe in slowly and let your lower tummy and the area between your sitting bones gently widen and soften.",
      "As you breathe out, do not squeeze - instead picture the pelvic floor lengthening downward and letting go, like a fist slowly unclenching.",
      "Let the release carry on for a few seconds after the out-breath.",
      "Repeat with slow, easy breaths, softening a little more each time."
    ],
    cues: [
      "The feeling is opening and heaviness, not lifting or tightening.",
      "Your jaw, buttocks and thighs stay relaxed throughout.",
      "Nothing is forced - you are allowing a release, not making one happen."
    ],
    mistakes: [
      "Turning this into a squeeze or a hard bearing-down push - it is neither.",
      "Tensing your shoulders, jaw or buttocks while trying to relax below.",
      "Rushing the breath instead of letting it slow down.",
      "Stop and message your physio if you notice new pelvic pain, a dragging or heavy feeling, or any bleeding."
    ],
    defaultDosage: {
      sets: 1,
      reps: 8,
      holdSeconds: 10,
      perDay: 3,
      perWeek: 7,
      tempo: "slow",
      notes: "This is a letting-go exercise, not a squeeze. One rep is one slow breath out with a conscious release and softening of the pelvic floor."
    }
  },
  {
    id: "ex-125",
    slug: "diaphragmatic-breathing-for-pelvic-floor",
    title: "Diaphragmatic Breathing for Pelvic Floor",
    bodyPart: "Pelvic health",
    clinicalArea: "pelvic_health",
    tags: ["pelvic-floor", "breathing", "early-rehab"],
    condition: "Pelvic pain / pelvic floor dysfunction",
    stage: "Early rehab",
    description: "Slow belly breathing that gently moves the pelvic floor with the diaphragm, foundational for pelvic floor retraining.",
    equipment: ["Exercise mat"],
    setup: "Lie on your back with your knees bent, or sit propped up comfortably. Rest one hand on your chest and one on your belly.",
    steps: [
      "Breathe in slowly through your nose and let your belly rise under your lower hand.",
      "Keep the hand on your chest still - the movement is low, into the belly and lower ribs.",
      "Notice the pelvic floor gently widening and dropping as you breathe in.",
      "Breathe out slowly and let the belly fall and the pelvic floor return to rest, without squeezing."
    ],
    cues: [
      "The belly and lower ribs move; the upper chest stays quiet.",
      "The out-breath is slightly longer than the in-breath and unforced.",
      "The pelvic floor moves gently with the breath - you are not adding a squeeze."
    ],
    mistakes: [
      "Forcing big breaths or pushing the belly out hard.",
      "Lifting the chest and shoulders to breathe in.",
      "Squeezing or bracing the tummy on the out-breath.",
      "Stop and message your physio if you notice new pelvic pain, a dragging or heavy feeling, or any bleeding."
    ],
    defaultDosage: {
      sets: 1,
      reps: 10,
      perDay: 3,
      perWeek: 7,
      tempo: "slow, about 4 seconds in and 6 seconds out",
      notes: "One rep is one full slow breath. Build up to a few minutes at a time if it stays comfortable."
    }
  },
  {
    id: "ex-126",
    slug: "bridge-with-pelvic-floor-engagement",
    title: "Bridge with Pelvic Floor Engagement",
    bodyPart: "Pelvic health",
    clinicalArea: "pelvic_health",
    tags: ["pelvic-floor", "glute-strength", "strength-phase"],
    condition: "Postnatal core and pelvic recovery",
    stage: "Strength phase",
    description: "A hip bridge combined with a light pelvic floor lift, integrating pelvic floor control into a functional strength movement.",
    equipment: ["Exercise mat"],
    pose: "pelvicTilt",
    setup: "Lie on your back on a mat with your knees bent and feet flat on the floor, hip-width apart. Rest your arms by your sides.",
    steps: [
      "Breathe out, lift your pelvic floor and gently draw in your lower tummy.",
      "Squeeze your buttocks and lift your hips until your body makes a straight line from your shoulders to your knees.",
      "Hold for a moment, keeping the pelvic floor lifted and breathing normally.",
      "Lower your hips down slowly, one part of your spine at a time, and let the pelvic floor release."
    ],
    cues: [
      "The pelvic floor lifts just before the hips do, and stays lifted while the hips are up.",
      "Your hips stay level with each other, not dropping to one side.",
      "The effort is felt in your buttocks and the backs of your thighs; your lower back stays comfortable."
    ],
    mistakes: [
      "Lifting so high that your lower back arches and feels pinched.",
      "Holding your breath to keep the pelvic floor lifted.",
      "Letting the pelvic floor drop as soon as the hips come up.",
      "Stop and message your physio if you notice new pelvic pain, a dragging or heavy feeling, or any bleeding."
    ],
    defaultDosage: {
      sets: 2,
      reps: 10,
      perDay: 1,
      perWeek: 5,
      notes: "Lift the pelvic floor as you breathe out and raise your hips; release it as you lower. One rep is one bridge."
    }
  },
  {
    id: "ex-127",
    slug: "squat-with-pelvic-floor-control",
    title: "Squat with Pelvic Floor Control",
    bodyPart: "Pelvic health",
    clinicalArea: "pelvic_health",
    tags: ["pelvic-floor", "functional", "return-to-function"],
    condition: "Pelvic organ prolapse",
    stage: "Return to function",
    description: "A controlled squat coordinating a pelvic floor lift on the effort phase, protecting pelvic support during functional lifting.",
    equipment: [],
    pose: "squat",
    setup: "Stand with your feet hip- to shoulder-width apart, toes pointing slightly out. Have a chair or worktop within reach for balance if you need it.",
    steps: [
      "Breathe in and bend your hips and knees to lower into a squat, only as far as feels controlled.",
      "Keep your back long and your weight spread through your whole foot.",
      "Breathe out and lift your pelvic floor as you push through your feet to stand back up.",
      "Let the pelvic floor relax once you are standing, then repeat."
    ],
    cues: [
      "The out-breath and the pelvic floor lift happen together on the way up, the harder part.",
      "Your knees track over your feet, not falling inward.",
      "Your weight stays spread through your heels and the balls of your feet."
    ],
    mistakes: [
      "Holding your breath and bearing down as you stand - this pushes down on the pelvic floor.",
      "Squatting deeper than you can control, or than feels comfortable if there is any heaviness.",
      "Letting your heels lift or your back round.",
      "Stop and message your physio if you notice new pelvic pain, a dragging or heavy feeling, worse heaviness after the exercise, or any bleeding."
    ],
    defaultDosage: {
      sets: 2,
      reps: 10,
      perDay: 1,
      perWeek: 5,
      tempo: "lower slowly, breathe out and lift as you stand",
      notes: "Breathe out and lift the pelvic floor as you stand up. Never hold your breath and bear down. One rep is one squat."
    }
  },
  {
    id: "ex-128",
    slug: "standing-pelvic-tilt-pregnancy",
    title: "Standing Pelvic Tilt (Pregnancy)",
    bodyPart: "Pelvic health",
    clinicalArea: "pelvic_health",
    tags: ["pregnancy", "pelvic-girdle-pain", "early-rehab"],
    condition: "Pregnancy-related pelvic girdle pain",
    stage: "Early rehab",
    description: "A standing pelvic tilt easing pelvic girdle discomfort, safe throughout pregnancy when guided appropriately.",
    equipment: [],
    pose: "pelvicTilt",
    setup: "Stand with your back against a wall, knees slightly bent and feet a little way out from the wall. Your lower back will be slightly arched away from the wall to start.",
    steps: [
      "Gently tighten your lower tummy and roll your hips so your lower back flattens towards the wall.",
      "Hold for a few seconds, breathing normally.",
      "Slowly release back to the starting position.",
      "Repeat with a smooth, easy rhythm."
    ],
    cues: [
      "The movement comes from tilting your pelvis, not from bending your knees more or holding your breath.",
      "It stays within a comfortable, pain-free range.",
      "Your shoulders and upper back stay resting against the wall."
    ],
    mistakes: [
      "Forcing the tilt or pushing into any pelvic or back pain.",
      "Arching strongly the other way as you release - just return to the middle.",
      "Holding your breath during the hold.",
      "Stop and message your physio if you notice new pelvic pain or a dragging or heavy feeling; and stop and contact your maternity team straight away if you have any vaginal bleeding, are leaking fluid, are getting regular tightenings, or notice your baby moving less."
    ],
    defaultDosage: { sets: 1, reps: 10, perDay: 3, perWeek: 7, tempo: "slow and controlled" }
  },
  {
    id: "ex-129",
    slug: "side-lying-hip-abduction-pregnancy-safe",
    title: "Side-Lying Hip Abduction (Pregnancy-Safe)",
    bodyPart: "Pelvic health",
    clinicalArea: "pelvic_health",
    tags: ["pregnancy", "pelvic-girdle-pain", "strength-phase"],
    condition: "Pregnancy-related pelvic girdle pain",
    stage: "Strength phase",
    description: "A gentle side-lying hip strengthener that avoids provocative positions for pelvic girdle pain during pregnancy.",
    equipment: ["Exercise mat", "Pillows"],
    setup: "Lie on your side with your hips and knees bent and a pillow between your knees. Support your bump with a pillow in front and rest your head on your arm or a pillow.",
    steps: [
      "Keeping your knees bent, lift your top knee upward, opening from the hip a small way.",
      "Keep your feet resting together and your pelvis still - do not let your top hip roll backward.",
      "Lift only as far as stays comfortable, then lower slowly.",
      "Finish your reps, then turn over and repeat on the other side."
    ],
    cues: [
      "The movement is small and pain-free - opening about a hand's width is plenty.",
      "Your pelvis and back stay still; only the hip moves.",
      "You lower the knee with control rather than letting it drop."
    ],
    mistakes: [
      "Opening the knee so wide that it pulls or aches at the front of the pelvis or in the groin.",
      "Rolling your top hip and shoulder backward to get more height.",
      "Rushing the reps or holding your breath.",
      "Stop and message your physio if you notice new pelvic pain or a dragging or heavy feeling; and stop and contact your maternity team straight away if you have any vaginal bleeding, are leaking fluid, are getting regular tightenings, or notice your baby moving less."
    ],
    defaultDosage: {
      sets: 2,
      reps: 10,
      perDay: 1,
      perWeek: 5,
      tempo: "slow and controlled",
      notes: "Keep the lift small and pain-free - a low, comfortable range matters more than height."
    }
  },
  {
    id: "ex-130",
    slug: "return-to-running-pelvic-floor-check",
    title: "Return-to-Running Pelvic Floor Check",
    bodyPart: "Pelvic health",
    clinicalArea: "pelvic_health",
    tags: ["pelvic-floor", "postnatal", "return-to-function"],
    condition: "Postnatal return to running",
    stage: "Return to function",
    description: "A staged hopping and jogging-on-the-spot check to confirm pelvic floor control before returning to running.",
    equipment: ["A sturdy chair"],
    setup: "Do this check about 3 months or more after birth, once you can walk for 30 minutes pain-free and have been doing your pelvic floor exercises. Wear supportive underwear, empty your bladder first, and stand on a firm floor with space around you.",
    steps: [
      "Walk briskly on the spot for 1 minute, then jog gently on the spot for 1 minute.",
      "Do 10 small two-footed hops in place, landing softly.",
      "Hop 10 times on your right foot, then 10 times on your left.",
      "Do 10 slow squats, then stand up from the chair on one leg 10 times on each side.",
      "Through all of it, notice any leaking of urine, any heaviness or dragging in the vagina, or any pain."
    ],
    cues: [
      "You feel controlled and steady, with no leaking, heaviness, dragging or pain.",
      "Your landings are soft and quiet, with knees slightly bent.",
      "You can breathe normally and talk throughout."
    ],
    mistakes: [
      "Pushing on through leaking or heaviness to 'finish the test' - that is the sign to stop.",
      "Trying the check too early, before about 3 months and before walking is easy.",
      "Jumping straight to a long run after passing, instead of building up gradually.",
      "Stop and message your physio if you notice leaking, a dragging or heavy feeling, new pelvic pain, or any bleeding - these mean your pelvic floor needs more time and a proper assessment."
    ],
    defaultDosage: {
      perWeek: 1,
      notes: "This is a readiness check, not a daily workout. Work through the tasks once. If everything stays symptom-free you can begin a gradual return to running; repeat the check every week or two as your distance builds."
    }
  },
  {
    id: "ex-131",
    slug: "bowel-emptying-positioning",
    title: "Bowel Emptying Positioning",
    bodyPart: "Pelvic health",
    clinicalArea: "pelvic_health",
    tags: ["pelvic-floor", "bowel-function", "early-rehab"],
    condition: "Constipation / straining",
    stage: "Early rehab",
    description: "Using a footstool and forward-lean position on the toilet to align the pelvic floor for easier, less straining bowel emptying.",
    equipment: ["A footstool about 15 to 20 cm high"],
    setup: "Sit on the toilet with a footstool under your feet so your knees are higher than your hips. Rest your forearms on your thighs.",
    steps: [
      "Place your feet on the stool so your knees sit higher than your hips and your body makes a squat-like shape.",
      "Lean forward from your hips and rest your elbows or forearms on your thighs, keeping your back straight.",
      "Let your tummy relax and bulge forward - do not hold it in.",
      "Breathe out gently against a closed mouth, as if steadily blowing up a stiff balloon, and let your back passage open rather than pushing down hard.",
      "Wait calmly between attempts; do not rush or force it."
    ],
    cues: [
      "Your knees are clearly higher than your hips and you are leaning forward, not sitting upright.",
      "Your tummy is relaxed and rounded, not pulled in.",
      "You feel widening and opening at the back passage, not a hard downward push."
    ],
    mistakes: [
      "Holding your breath and straining hard - this tightens the pelvic floor and works against you.",
      "Sitting upright or leaning back.",
      "Staying on the toilet longer than about 5 minutes hoping something happens.",
      "Stop and message your physio if you notice new pelvic pain, a dragging or heavy feeling, bleeding from the back passage, or a lasting change in your bowel habit."
    ],
    defaultDosage: {
      notes: "Use this position every time you open your bowels, not as a set exercise. Do not strain or sit for more than about 5 minutes - if nothing happens, get up and try again later."
    }
  },
  {
    id: "ex-132",
    slug: "reverse-kegel-pelvic-floor-lengthening",
    title: "Reverse Kegel (Pelvic Floor Lengthening)",
    bodyPart: "Pelvic health",
    clinicalArea: "pelvic_health",
    tags: ["pelvic-floor", "pelvic-pain", "mobility"],
    condition: "Overactive pelvic floor / painful intercourse",
    stage: "Mobility phase",
    description: "Gently bulging/lengthening the pelvic floor on the out-breath, retraining relaxation where over-tension is the main issue.",
    equipment: ["Exercise mat"],
    setup: "Lie on your back with your knees bent and feet flat, or sit on the toilet where the position is familiar. Relax your tummy, buttocks and jaw.",
    steps: [
      "Breathe in slowly and let your lower tummy and pelvic floor soften and widen.",
      "As you breathe out, gently let the pelvic floor lengthen and bulge slightly downward, as if starting to pass wind or urine but very softly.",
      "Keep the effort light - this is a gentle release and opening, not a hard push.",
      "Hold the lengthened, soft feeling for a few seconds, then let everything return to rest."
    ],
    cues: [
      "The feeling is a gentle downward opening and widening, the opposite of a lift.",
      "Your tummy stays soft and your buttocks and thighs stay relaxed.",
      "The bulge is small and easy - no forceful bearing down and no breath-holding."
    ],
    mistakes: [
      "Pushing down hard or straining, which can strain the pelvic floor over time.",
      "Tensing your jaw, shoulders or buttocks while trying to release below.",
      "Doing many forceful reps - a few gentle ones are enough.",
      "Stop and message your physio if you notice new pelvic pain, a dragging or heavy feeling, or any bleeding."
    ],
    defaultDosage: {
      sets: 1,
      reps: 8,
      holdSeconds: 5,
      perDay: 2,
      perWeek: 7,
      tempo: "slow",
      notes: "This is the opposite of a squeeze. One rep is a gentle lengthening and bulge on the out-breath, held briefly, then a return to rest. Keep the effort very light."
    }
  },
  {
    id: "ex-133",
    slug: "animal-walk-circuit",
    title: "Animal Walk Circuit",
    bodyPart: "Paediatric",
    clinicalArea: "paediatric",
    tags: ["paediatric", "gross-motor", "early-rehab"],
    condition: "Developmental coordination disorder",
    stage: "Early rehab",
    description: "Bear crawls and crab walks turned into a fun circuit, building gross motor coordination through play.",
    equipment: ["A clear soft floor space", "A couple of cushions or soft toys to use as markers"],
    setup: "Clear a soft, non-slip space about the length of two adult steps. Put a cushion or soft toy at each end to mark the start and the finish.",
    steps: [
      "Show your child the bear walk: hands and feet on the floor, bottom in the air, moving one hand and the opposite foot together.",
      "Let your child bear walk from one marker to the other while you walk alongside.",
      "Show the crab walk: sitting with hands behind and knees bent, then lifting the hips and walking backwards on hands and feet.",
      "Have your child crab walk back to the start.",
      "Add a third animal your child enjoys, such as a bunny hop or a slow lizard crawl, and repeat the loop a few times."
    ],
    cues: [
      "Your child moves an arm and the opposite leg together, rather than both arms then both legs.",
      "The tummy stays gently firm so the back does not sag towards the floor.",
      "Your child is smiling and keen to go again - the effort still feels like a game."
    ],
    mistakes: [
      "Racing so fast that the movements become sloppy - slower and steadier builds more skill.",
      "Doing the circuit on a hard or slippery floor where hands and feet can slide.",
      "Pushing for one more lap when your child is tired, floppy or losing interest.",
      "Stop and message your child's physio if your child has increasing pain, a limp that does not settle, or is much more tired or unsettled than usual."
    ],
    defaultDosage: {
      sets: 2,
      reps: 3,
      perDay: 1,
      perWeek: 5,
      notes: "Count 1 rep as one full loop of the circuit. Keep it playful - stop while your child is still enjoying it."
    }
  },
  {
    id: "ex-134",
    slug: "balance-beam-walk-tape-line",
    title: "Balance Beam Walk (Tape Line)",
    bodyPart: "Paediatric",
    clinicalArea: "paediatric",
    tags: ["paediatric", "balance", "mobility"],
    condition: "Balance and coordination difficulties",
    stage: "Mobility phase",
    description: "Walking along a taped line on the floor, a playful way to build the same balance skills as formal tandem walking.",
    equipment: ["A roll of coloured tape", "A clear floor space"],
    setup: "Stick a straight line of coloured tape about two to three metres long onto a clean, non-slip floor. Stand beside your child ready to offer a hand if needed.",
    steps: [
      "Ask your child to stand at one end of the line with their arms out to the sides like an aeroplane.",
      "Encourage your child to walk along the tape, trying to keep each foot on the line.",
      "Walk alongside, offering a fingertip to hold only if your child wobbles.",
      "At the far end, turn around and walk back along the line the other way.",
      "When this is easy, try heel-to-toe steps, walking sideways along the line, or carrying a soft toy."
    ],
    cues: [
      "Your child looks ahead at the end of the line, not down at their feet.",
      "Steps are slow and placed with care, one foot roughly in front of the other.",
      "Arms come out to the sides to help with balance."
    ],
    mistakes: [
      "Rushing along the line so balance turns into a stumble.",
      "Holding your child's hand the whole way, which does the balancing for them - offer just a fingertip when needed.",
      "Setting the line on a rug or a polished floor that can slip.",
      "Stop and message your child's physio if your child has increasing pain, a limp that does not settle, or is much more tired or unsettled than usual."
    ],
    defaultDosage: {
      sets: 2,
      reps: 4,
      perDay: 1,
      perWeek: 5,
      notes: "Count 1 rep as one walk along the line and back. Keep it playful - stop while your child is still enjoying it."
    }
  },
  {
    id: "ex-135",
    slug: "ball-catch-and-throw",
    title: "Ball Catch and Throw",
    bodyPart: "Paediatric",
    clinicalArea: "paediatric",
    tags: ["paediatric", "coordination", "strength-phase"],
    condition: "Hand-eye coordination difficulties",
    stage: "Strength phase",
    description: "Simple catching and throwing games building hand-eye coordination and upper-limb control through play.",
    equipment: ["A soft, lightweight ball about the size of a football"],
    setup: "Find a clear space indoors or outside, away from furniture with sharp edges. Start standing about one to two big steps apart, facing your child.",
    steps: [
      "Roll the ball along the floor to your child and ask them to trap it with both hands.",
      "Ask your child to roll it back to you.",
      "Move on to a gentle underarm throw, aiming for your child's chest so it is easy to catch.",
      "Ask your child to throw it back to you using both hands.",
      "As catching gets easier, step a little further apart, use a smaller ball, or add one bounce."
    ],
    cues: [
      "Your child watches the ball all the way into their hands.",
      "Hands come together to make a basket ready for the catch.",
      "Throws come from both hands at about chest height, roughly towards you."
    ],
    mistakes: [
      "Throwing hard or high so the ball is difficult to track and catch.",
      "Standing too far apart at the start, so most throws are missed and it stops being fun.",
      "Using a heavy or firm ball that could sting little hands.",
      "Stop and message your child's physio if your child has increasing pain, a limp that does not settle, or is much more tired or unsettled than usual."
    ],
    defaultDosage: {
      sets: 2,
      reps: 10,
      perDay: 1,
      perWeek: 5,
      notes: "Count 1 rep as one catch and one throw back. Keep it playful - stop while your child is still enjoying it."
    }
  },
  {
    id: "ex-136",
    slug: "obstacle-course-crawl-through",
    title: "Obstacle Course Crawl-Through",
    bodyPart: "Paediatric",
    clinicalArea: "paediatric",
    tags: ["paediatric", "gross-motor", "return-to-function"],
    condition: "Developmental coordination disorder",
    stage: "Return to function",
    description: "A fun crawl-through-and-around obstacle course integrating multiple motor skills for real-world play readiness.",
    equipment: [
      "Cushions, chairs and blankets from around the home",
      "A cardboard box or play tunnel if you have one"
    ],
    setup: "Set up three or four simple stations in a soft, clear space: something to crawl under (a blanket over two chairs), something to climb over (sofa cushions), something to go around (a chair), and something to crawl through (a box or tunnel). Leave clear space between the stations.",
    steps: [
      "Walk your child through the course once slowly, naming each station.",
      "Let your child crawl under the blanket, keeping their tummy just off the floor.",
      "Help them climb over the cushion pile and step down safely on the other side.",
      "Have them crawl through the box or tunnel, then weave around the chair.",
      "Repeat the whole course a few times, changing the order or adding a station your child suggests."
    ],
    cues: [
      "Your child moves an arm and the opposite knee together when crawling.",
      "They pause and look before climbing up or stepping down.",
      "The course stays fun - your child is working out each station, not getting frustrated."
    ],
    mistakes: [
      "Building stations that are too high or too wobbly to climb safely.",
      "Leaving hard furniture edges or a slippery floor next to the course.",
      "Keeping going when your child is tired or upset - stop and try again another day.",
      "Stop and message your child's physio if your child has increasing pain, a limp that does not settle, or is much more tired or unsettled than usual."
    ],
    defaultDosage: {
      sets: 2,
      reps: 3,
      perDay: 1,
      perWeek: 5,
      notes: "Count 1 rep as one full trip through the course. Keep it playful - stop while your child is still enjoying it."
    }
  },
  {
    id: "ex-137",
    slug: "toe-walking-heel-walking-game",
    title: "Toe Walking / Heel Walking Game",
    bodyPart: "Paediatric",
    clinicalArea: "paediatric",
    tags: ["paediatric", "ankle", "gait", "early-rehab"],
    condition: "Idiopathic toe walking",
    stage: "Early rehab",
    description: "A game encouraging alternating heel and toe walking to build ankle range and normal walking pattern awareness.",
    equipment: ["A clear floor space", "Two soft toys or markers"],
    setup: "Clear a short, non-slip walkway a few steps long and put a marker at each end. Your child can be barefoot or in flat, supportive shoes.",
    steps: [
      "Show your child 'penguin walking' to one marker: walking on the heels with the toes lifted up.",
      "At the marker, switch to 'tiptoe walking' back to the start, up on the toes like a tall giraffe.",
      "Walk beside your child, holding a hand if they need steadying.",
      "Take turns copying each other, and let your child call out which walk comes next.",
      "Finish with a few steps of normal walking, landing on the heel first."
    ],
    cues: [
      "On the heel walk, the toes and the front of the foot lift clearly off the floor.",
      "On the normal walking steps, the heel makes contact first, then the toes.",
      "Your child can switch between the two walks without needing to stop and think for long."
    ],
    mistakes: [
      "Only ever practising the tiptoe walk - the heel walk and the heel-first steps are the important part.",
      "Letting your child rush and slip back into their usual toe walking.",
      "Practising on a slippery floor or a steep slope.",
      "Stop and message your child's physio if your child has increasing pain, a limp that does not settle, or is much more tired or unsettled than usual."
    ],
    defaultDosage: {
      sets: 2,
      reps: 6,
      perDay: 1,
      perWeek: 5,
      notes: "Count 1 rep as one heel walk down and one tiptoe walk back. Keep it playful - stop while your child is still enjoying it."
    }
  },
  {
    id: "ex-138",
    slug: "trampette-bouncing-supervised",
    title: "Trampette Bouncing (Supervised)",
    bodyPart: "Paediatric",
    clinicalArea: "paediatric",
    tags: ["paediatric", "balance", "strength-phase"],
    condition: "Low muscle tone",
    stage: "Strength phase",
    description: "Supervised gentle bouncing on a small trampette, building leg strength and balance reactions enjoyably.",
    equipment: ["A small trampette with a support bar", "A non-slip mat to put underneath it"],
    setup: "Place the trampette on a flat, non-slip surface with clear space all around and nothing sharp nearby. Fit the support bar if it has one. Only one child bounces at a time, with you standing close enough to catch them.",
    steps: [
      "Help your child step on and hold the support bar, or hold both of your hands.",
      "Start with gentle bounces where the feet barely leave the mat, just pressing down and springing up.",
      "Encourage a steady, even rhythm rather than big jumps.",
      "Try small games such as bouncing along to a song or counting the bounces together.",
      "Finish with a few slow bounces, then help your child step down."
    ],
    cues: [
      "Your child keeps hold of the bar or your hands the whole time.",
      "Bounces are small and controlled, landing flat through the whole foot.",
      "The knees bend softly to soak up each landing."
    ],
    mistakes: [
      "Big, high jumps, or letting go of the bar or your hands.",
      "More than one child on the trampette at once.",
      "Bouncing on a trampette with no bar, close to furniture, or on a slippery floor.",
      "Stop and message your child's physio if your child has increasing pain, a limp that does not settle, or is much more tired or unsettled than usual."
    ],
    defaultDosage: {
      sets: 2,
      reps: 20,
      perDay: 1,
      perWeek: 5,
      notes: "Count 1 rep as one gentle bounce, with a rest between sets. Keep it playful - stop while your child is still enjoying it."
    }
  },
  {
    id: "ex-139",
    slug: "prone-extension-play-superman",
    title: "Prone Extension Play ('Superman')",
    bodyPart: "Paediatric",
    clinicalArea: "paediatric",
    tags: ["paediatric", "core-control", "early-rehab"],
    condition: "Low muscle tone",
    stage: "Early rehab",
    description: "Lying on the tummy lifting arms and legs like flying, building core and back strength through imaginative play.",
    equipment: ["An exercise mat or carpeted floor", "A small toy to look at or reach for"],
    setup: "Have your child lie on their tummy on a mat in a clear space, with their legs straight and their arms stretched out in front. Put a favourite toy on the floor just in front of their hands.",
    steps: [
      "Ask your child to lift their head and chest off the floor to look at the toy, like a flying superhero.",
      "Add lifting both arms off the floor, reaching forwards towards the toy.",
      "Then add lifting both legs a little way off the floor.",
      "Hold the flying position for a few seconds while you count together.",
      "Lower everything down slowly and rest flat before the next go."
    ],
    cues: [
      "The lift comes from the back and tummy, with the movement spread along the spine.",
      "The neck stays long, with the gaze forwards and slightly down rather than craned right up.",
      "Your child breathes and counts out loud during the hold, rather than holding their breath."
    ],
    mistakes: [
      "Yanking up fast into a big arch instead of a smooth, gentle lift.",
      "Practising straight after a meal, which can feel uncomfortable on the tummy.",
      "Adding more holds when your child is tired and their movement is getting sloppy.",
      "Stop and message your child's physio if your child has increasing pain, a limp that does not settle, or is much more tired or unsettled than usual."
    ],
    defaultDosage: {
      sets: 2,
      reps: 8,
      holdSeconds: 5,
      perDay: 1,
      perWeek: 5,
      notes: "Hold each 'flight' for about 5 seconds. Keep it playful - stop while your child is still enjoying it."
    }
  },
  {
    id: "ex-140",
    slug: "scooter-board-propulsion",
    title: "Scooter Board Propulsion",
    bodyPart: "Paediatric",
    clinicalArea: "paediatric",
    tags: ["paediatric", "upper-limb", "core-control", "strength-phase"],
    condition: "Developmental coordination disorder",
    stage: "Strength phase",
    description: "Lying on a scooter board and pulling along with the arms, building upper-body and core strength playfully.",
    equipment: ["A scooter board", "A smooth, flat, clear floor"],
    setup: "Use a scooter board on a smooth, flat floor with plenty of clear space and nothing to bump into. Check that your child's fingers, hair and clothing are kept well away from the wheels.",
    steps: [
      "Help your child lie on their tummy on the board with the chest and hips supported and the head up.",
      "Show them how to reach forwards and pull along the floor with both hands, a bit like swimming.",
      "Set a target to pull towards, such as a cushion or a parent a few metres away.",
      "Have them pull to the target, then turn the board around and come back.",
      "Add gentle games such as collecting soft toys along the way."
    ],
    cues: [
      "The head and chest stay lifted so your child can see where they are going.",
      "Both arms take turns pulling with long, smooth reaches.",
      "Fingers stay flat on the floor and well clear of the wheels."
    ],
    mistakes: [
      "Using the board on carpet, on a slope, or near stairs, doorways or hard furniture.",
      "Sitting or standing on the board rather than lying on the tummy.",
      "Long sessions that leave your child's neck and shoulders aching - keep each go short.",
      "Stop and message your child's physio if your child has increasing pain, a limp that does not settle, or is much more tired or unsettled than usual."
    ],
    defaultDosage: {
      sets: 2,
      reps: 4,
      perDay: 1,
      perWeek: 5,
      notes: "Count 1 rep as one pull to the target and back. Keep it playful - stop while your child is still enjoying it."
    }
  },
  {
    id: "ex-141",
    slug: "single-leg-hop-game",
    title: "Single-Leg Hop Game",
    bodyPart: "Paediatric",
    clinicalArea: "paediatric",
    tags: ["paediatric", "balance", "return-to-function"],
    condition: "Return to playground activity post-injury",
    stage: "Return to function",
    description: "Hopping games on painted spots or hopscotch, rebuilding single-leg power and confidence for playground return.",
    equipment: ["Chalk or flat floor spots", "A clear, flat, non-slip space"],
    setup: "Draw a simple hopscotch grid with chalk outside, or lay out flat floor spots indoors on a non-slip surface. Make sure the landing area is clear and even.",
    steps: [
      "Warm up with a few two-footed jumps on the spot together.",
      "Ask your child to hop forwards from spot to spot on the stronger leg first.",
      "Then try a few hops on the injured leg, staying close in case they need a hand.",
      "Play a short game of hopscotch, hopping on the single spots and landing on two feet on the double spots.",
      "Finish with gentle two-footed jumps and a walk around."
    ],
    cues: [
      "Your child lands softly through the whole foot with the knee bent, not stiff and straight.",
      "The knee points forwards over the toes on landing, rather than rolling inwards.",
      "Your child can steady themselves within a step or two after landing."
    ],
    mistakes: [
      "Moving to single-leg hops before your child can jump and land on two feet without pain.",
      "Hopping on a hard, uneven or slippery surface.",
      "Pushing for more hops when your child is limping, favouring the leg, or getting tired.",
      "Stop and message your child's physio if your child has increasing pain, a limp that does not settle, or is much more tired or unsettled than usual."
    ],
    defaultDosage: {
      sets: 2,
      reps: 8,
      perDay: 1,
      perWeek: 5,
      notes: "Count 1 rep as one hop. Build the injured leg up gradually. Keep it playful - stop while your child is still enjoying it."
    }
  },
  {
    id: "ex-142",
    slug: "sensory-motor-circuit-multi-station",
    title: "Sensory-Motor Circuit (Multi-Station)",
    bodyPart: "Paediatric",
    clinicalArea: "paediatric",
    tags: ["paediatric", "sensory-integration", "return-to-function"],
    condition: "Sensory processing difficulties",
    stage: "Return to function",
    description: "A short multi-station circuit combining movement and sensory input, tailored to the child's specific needs.",
    equipment: ["The equipment your child's physio has listed for each station"],
    setup: "Set out the stations your child's physio has chosen, in the order they have given, in a calm, clear space. Only use the activities on your physio's plan - this circuit is put together for your child's particular needs.",
    steps: [
      "Talk your child through the stations before you start, so they know what is coming.",
      "Guide your child through each station in the order your physio has set.",
      "Give your child a moment to settle between stations if they need it.",
      "Follow your physio's guidance on how many times to repeat the circuit.",
      "Finish with the calming activity your physio has suggested, such as a firm cushion squash or slow rocking."
    ],
    cues: [
      "Your child moves through the stations in the planned order without long gaps.",
      "Your child stays calm and focused - a little effort is fine, distress is not.",
      "You are following the physio's plan rather than adding extra activities."
    ],
    mistakes: [
      "Adding or swapping stations without checking with your physio first.",
      "Rushing your child from one station to the next with no time to reset.",
      "Carrying on when your child is overwhelmed or upset - stop and try a shorter version next time.",
      "Stop and message your child's physio if your child has increasing pain, a limp that does not settle, or is much more tired or unsettled than usual."
    ],
    defaultDosage: {
      sets: 1,
      reps: 2,
      perDay: 1,
      perWeek: 5,
      notes: "Follow your physio's plan for the number of circuits. Count 1 rep as one full circuit. Keep it playful - stop while your child is still enjoying it."
    }
  },
  {
    id: "ex-143",
    slug: "general-mobility-warm-up",
    title: "General Mobility Warm-Up",
    bodyPart: "General",
    clinicalArea: "general",
    tags: ["general", "warm-up", "early-rehab"],
    condition: "General deconditioning",
    stage: "Early rehab",
    description: "A gentle full-body joint mobility sequence, a safe starting point before any specific condition is confirmed.",
    equipment: [],
    setup: "Stand tall with your feet hip-width apart, somewhere you have room to move your arms freely. Have a wall or sturdy chair nearby if you want something to hold on to.",
    steps: [
      "Roll your shoulders slowly backwards several times, then forwards.",
      "Turn your head gently to look over one shoulder, then the other.",
      "Circle your arms forwards a few times, then backwards.",
      "Gently twist your upper body from side to side, letting your arms swing.",
      "March slowly on the spot, lifting each knee in turn.",
      "Rise onto your toes and lower down, then rock back onto your heels."
    ],
    cues: [
      "Every movement stays within a range that feels easy and pain-free.",
      "Keep breathing steadily - do not hold your breath.",
      "Each movement is smooth and controlled, not rushed or bouncy."
    ],
    mistakes: [
      "Forcing a joint further than it wants to go.",
      "Rushing through the sequence instead of moving gently.",
      "Working a joint that is hot, swollen or very painful - wait until it settles.",
      "Stop and message your physio if a movement brings on chest pain, dizziness, or breathlessness that is not normal for you."
    ],
    defaultDosage: {
      sets: 1,
      reps: 8,
      perDay: 2,
      perWeek: 7,
      tempo: "slow and controlled",
      notes: "Count one slow repetition of each movement in the sequence as one rep. Use this as a warm-up before other exercise, or as a gentle movement break during the day."
    }
  },
  {
    id: "ex-144",
    slug: "graded-walking-programme",
    title: "Graded Walking Programme",
    bodyPart: "General",
    clinicalArea: "general",
    tags: ["general", "cardio", "mobility"],
    condition: "General deconditioning",
    stage: "Mobility phase",
    description: "A gradually increasing daily walking target to rebuild general fitness and activity tolerance.",
    equipment: ["Supportive walking shoes"],
    setup: "Choose a flat, familiar route with somewhere to rest along the way. Wear comfortable, supportive shoes and take water with you.",
    steps: [
      "Set a starting time you are confident you can manage on most days, even a poor day - for many people this is 5 to 10 minutes.",
      "Walk at a pace where you can still hold a conversation.",
      "Keep to your set time even if you feel you could do more on a good day.",
      "Each week, add 1 to 2 minutes to the daily walk if the previous week felt manageable.",
      "If illness or a flare-up sets you back, drop to the last time that felt easy and build up again."
    ],
    cues: [
      "You can talk in full sentences while walking - if you cannot, slow down.",
      "The walk feels repeatable the next day, not something you need to recover from.",
      "Progress is gradual - small weekly increases add up over months."
    ],
    mistakes: [
      "Doing one very long walk on a good day and paying for it for the rest of the week.",
      "Increasing your time and your pace at the same time - change one thing at a time.",
      "Abandoning the programme after a setback instead of dropping back a level.",
      "Stop and message your physio or GP if you get chest pain, unusual breathlessness, or dizziness while walking."
    ],
    defaultDosage: {
      minutes: 10,
      perDay: 1,
      perWeek: 7,
      notes: "Start at a time you could manage even on a bad day and add 1 to 2 minutes each week if the last week felt easy. Walk at a pace where you can still talk. A second short walk later in the day is fine."
    }
  },
  {
    id: "ex-145",
    slug: "full-body-stretch-routine",
    title: "Full-Body Stretch Routine",
    bodyPart: "General",
    clinicalArea: "general",
    tags: ["general", "flexibility", "mobility"],
    condition: "General stiffness",
    stage: "Mobility phase",
    description: "A short sequence of major-muscle-group stretches suitable while a specific diagnosis is still being clarified.",
    equipment: ["A sturdy chair or wall for balance", "A low step or stair"],
    setup: "Find a warm space where you can stand and reach freely, with a wall or sturdy chair within reach for balance. Do these after a few minutes of easy movement so you are not stretching cold muscles.",
    steps: [
      "Calf: step one foot back, keep it flat and the knee straight, and lean into the front knee until you feel a stretch in the back calf. Swap sides.",
      "Front of thigh: hold your support, bend one knee and draw that heel towards your buttock until you feel a stretch at the front of the thigh. Swap sides.",
      "Back of thigh: rest one heel on a low step with the leg straight, and hinge forward from the hips until you feel a stretch behind the thigh. Swap sides.",
      "Chest: clasp your hands behind your back and gently lift them away from your body until you feel a stretch across the chest.",
      "Upper back: clasp your hands in front, round your upper back and reach forwards until you feel a stretch between the shoulder blades.",
      "Neck: gently tilt one ear towards that shoulder until you feel a stretch down the opposite side of the neck. Swap sides."
    ],
    cues: [
      "Ease into each stretch until you feel a comfortable pull, then hold still.",
      "Keep breathing slowly and let the muscle relax into the stretch.",
      "You feel the stretch in the muscle itself, not sharp pain in a joint."
    ],
    mistakes: [
      "Bouncing or pulsing in and out of the stretch instead of holding it.",
      "Pulling hard into pain - a stretch should feel like a mild pull, no more.",
      "Holding your breath while you stretch.",
      "Stop and message your physio if a particular stretch brings on pins and needles, numbness, or pain that shoots down a limb."
    ],
    defaultDosage: {
      holdSeconds: 25,
      perDay: 2,
      perWeek: 7,
      tempo: "slow and controlled",
      notes: "Hold each stretch for about 20 to 30 seconds, and stretch each side where the movement is one-sided. One run through the whole sequence is one set."
    }
  },
  {
    id: "ex-146",
    slug: "basic-bodyweight-circuit",
    title: "Basic Bodyweight Circuit",
    bodyPart: "General",
    clinicalArea: "general",
    tags: ["general", "strength-phase"],
    condition: "General deconditioning",
    stage: "Strength phase",
    description: "Sit-to-stands, wall push-ups and marching on the spot combined into a simple, equipment-free strength circuit.",
    equipment: ["A sturdy chair", "Clear wall space"],
    setup: "Place a sturdy chair against a wall so it cannot slide, with clear wall space nearby. Have water to hand.",
    steps: [
      "Sit-to-stand: from sitting at the front of the chair, stand up fully, then lower yourself back down with control. Repeat for the set.",
      "Wall push-up: stand arm's length from the wall with your hands at shoulder height, bend your elbows to bring your chest towards the wall, then push back. Repeat for the set.",
      "Marching on the spot: march steadily, lifting each knee to a comfortable height, for about one minute.",
      "Rest for about a minute, then repeat the three exercises again."
    ],
    cues: [
      "On the sit-to-stand, push through your whole foot and lead with your chest, not your head.",
      "Keep your body in a straight line during the wall push-up - do not let your hips sag or hitch up.",
      "You should feel worked but still able to talk by the end of each round."
    ],
    mistakes: [
      "Dropping down onto the chair instead of lowering with control.",
      "Holding your breath during the push-ups - breathe out as you push away.",
      "Doing every round as hard as possible so you cannot finish the circuit - leave a little in reserve.",
      "Stop and message your physio or GP if you get chest pain, an irregular heartbeat, or dizziness during the circuit."
    ],
    defaultDosage: {
      sets: 2,
      reps: 10,
      perDay: 1,
      perWeek: 5,
      notes: "One set is 10 sit-to-stands, 10 wall push-ups and about a minute of marching. Build up towards 3 rounds, resting about a minute between rounds."
    }
  },
  {
    id: "ex-147",
    slug: "pain-pacing-activity-plan",
    title: "Pain Pacing Activity Plan",
    bodyPart: "General",
    clinicalArea: "general",
    tags: ["general", "pacing", "chronic-pain", "early-rehab"],
    condition: "Persistent/chronic pain",
    stage: "Early rehab",
    description: "A structured activity-and-rest pacing plan, breaking tasks into manageable chunks to avoid boom-bust pain flares.",
    equipment: [],
    setup: "Pick one activity that usually triggers a pain flare-up when you overdo it - for example standing to cook, gardening, or time at a desk. You will use this plan to find a steady, repeatable amount.",
    steps: [
      "For two or three days, note how long you can do the activity before pain clearly builds - this is your limit.",
      "Set your baseline at about half of that limit, so it feels easy even on a worse day.",
      "Do the activity only up to your baseline, then take a planned break and switch to something different, even if you feel you could carry on.",
      "Split bigger tasks into several baseline-sized chunks spread through the day.",
      "If the baseline stays comfortable for a week, increase it by about 10 to 20 percent.",
      "After a flare-up or setback, drop back to the last baseline that felt easy and build up again."
    ],
    cues: [
      "Your breaks are planned by the clock or by the task, not taken only once pain forces you to stop.",
      "Activity levels stay roughly the same on good days and bad days.",
      "Increases are small and only come after a settled week."
    ],
    mistakes: [
      "Setting the baseline from a good day rather than an average day.",
      "Skipping planned breaks because you feel fine at the time.",
      "Racing to catch up on everything after a good spell and triggering the next flare.",
      "Stop and message your physio if your pain pattern changes markedly, or new symptoms such as numbness, weakness, or night pain appear."
    ],
    defaultDosage: {
      perWeek: 7,
      notes: "This is a planning tool rather than an exercise - review your plan daily and adjust your baseline about once a week."
    }
  },
  {
    id: "ex-148",
    slug: "graded-exposure-to-feared-movement",
    title: "Graded Exposure to Feared Movement",
    bodyPart: "General",
    clinicalArea: "general",
    tags: ["general", "graded-exposure", "chronic-pain", "return-to-function"],
    condition: "Persistent/chronic pain (fear-avoidance)",
    stage: "Return to function",
    description: "Gradually reintroducing a movement the patient has been avoiding, in small confidence-building steps, per graded exposure principles.",
    equipment: [],
    setup: "Choose one everyday movement you have been avoiding because you expect it to hurt - for example bending to the floor, reaching overhead, or twisting to look behind you. Work somewhere you feel safe and unhurried.",
    steps: [
      "Break the movement into a ladder of small steps, from a version that feels easy up to the full movement.",
      "Rate how worried you feel about each step from 0 to 10.",
      "Start with a step you rate around 3 or 4 - challenging but manageable.",
      "Repeat that step calmly several times until your worry about it drops.",
      "When a step feels routine, move up to the next one on your ladder.",
      "Practise little and often rather than in one long session."
    ],
    cues: [
      "You are working at a level that feels challenging but not frightening.",
      "Some extra pain during the movement is expected and settles afterwards - hurt does not always mean harm.",
      "Your confidence with each step grows as you repeat it."
    ],
    mistakes: [
      "Jumping straight to the hardest version before the earlier steps feel comfortable.",
      "Holding your breath and bracing hard through the movement - let it be as relaxed as you can.",
      "Avoiding the movement for days after a small flare instead of easing back one step.",
      "Stop and message your physio if you get a sudden sharp giving-way, or new numbness, pins and needles, or weakness in an arm or leg."
    ],
    defaultDosage: {
      sets: 1,
      reps: 8,
      perDay: 2,
      perWeek: 7,
      tempo: "slow and relaxed",
      notes: "Practise your current ladder step 6 to 10 times, once or twice a day. Move up a step when the current one feels routine."
    }
  },
  {
    id: "ex-149",
    slug: "return-to-sport-readiness-circuit",
    title: "Return-to-Sport Readiness Circuit",
    bodyPart: "General",
    clinicalArea: "general",
    tags: ["general", "sport", "return-to-function"],
    condition: "Return to sport (general)",
    stage: "Return to function",
    description: "A combined strength, balance and agility circuit used as a final check before clearing return to a chosen sport.",
    equipment: ["A clear, non-slip space about 5 metres long", "A marker at each end"],
    setup: "Warm up first with a few minutes of easy jogging and mobility. You need a clear, non-slip area about 5 metres long with a marker at each end.",
    steps: [
      "Single-leg squats: on each leg, do a set of controlled squats to about knee height, checking that the knee tracks over the foot.",
      "Hop and hold: hop forward onto one leg and hold the landing still for 2 to 3 seconds. Repeat on each leg.",
      "Side-to-side bounds: spring sideways from one leg to the other, landing softly and under control.",
      "Shuttle runs: run to the far marker, turn, and run back, building from a jog towards near-full pace over several repeats.",
      "Sport-specific move: finish with a movement from your own sport, such as a change of direction, a kick, or a throw."
    ],
    cues: [
      "Landings are quiet and balanced, with the knee over the foot rather than collapsing inwards.",
      "Both legs perform and feel about the same - compare the injured side with the other.",
      "You complete the circuit with good technique and no limp, swelling, or sharp pain."
    ],
    mistakes: [
      "Testing readiness while still clearly favouring one leg.",
      "Skipping the warm-up and going straight into hopping and sprinting.",
      "Treating this as a one-off test - repeat it over a few sessions before returning fully.",
      "Stop and message your physio if a movement causes sharp joint pain, giving-way, or swelling that comes up afterwards."
    ],
    defaultDosage: {
      sets: 2,
      reps: 8,
      perDay: 1,
      perWeek: 3,
      notes: "One set is about 8 reps or 20 seconds at each station. Run through the full circuit 2 to 3 times per session, and use it as a check over several sessions rather than a single pass or fail."
    }
  },
  {
    id: "ex-150",
    slug: "relaxation-and-breathing-for-pain-management",
    title: "Relaxation and Breathing for Pain Management",
    bodyPart: "General",
    clinicalArea: "general",
    tags: ["general", "breathing", "chronic-pain", "early-rehab"],
    condition: "Persistent/chronic pain",
    stage: "Early rehab",
    description: "Slow diaphragmatic breathing and progressive muscle relaxation, supporting the nervous-system side of pain management.",
    equipment: [],
    setup: "Lie on your back with your knees bent, or sit well supported in a chair, with a small pillow under your head if that is more comfortable. Rest one hand on your chest and the other on your tummy, and choose a quiet time when you will not be disturbed.",
    steps: [
      "Breathe in slowly through your nose, letting your tummy rise under your lower hand while your chest stays fairly still.",
      "Breathe out slowly through your mouth, a little longer than the breath in, and feel your tummy fall.",
      "Keep this slow, easy rhythm going for several breaths.",
      "Now work through your body from feet to head: gently tense each muscle group for a few seconds, then let it go loose as you breathe out.",
      "Finish by lying still for a minute, breathing normally and noticing the feeling of relaxation."
    ],
    cues: [
      "The hand on your tummy moves more than the hand on your chest.",
      "Your out-breath is slow and unforced, slightly longer than your in-breath.",
      "Your shoulders, jaw, and hands feel softer by the end."
    ],
    mistakes: [
      "Forcing a very deep breath or over-breathing until you feel light-headed - keep it gentle.",
      "Tensing muscles hard enough to bring on cramp during the relaxation part.",
      "Giving up after one try - this gets easier and more useful with daily practice.",
      "Stop and message your physio if slow breathing makes you feel more breathless or panicky rather than calmer."
    ],
    defaultDosage: {
      minutes: 8,
      perDay: 2,
      perWeek: 7,
      notes: "Hold each muscle group for about 5 seconds before releasing. Use a shorter version during a pain flare."
    }
  },
  {
    id: "ex-151",
    slug: "eccentric-wrist-flexion",
    title: "Eccentric Wrist Flexion",
    bodyPart: "Wrist",
    clinicalArea: "upper_limb",
    tags: ["wrist", "golfers-elbow", "strength-phase"],
    condition: "Medial epicondylalgia (golfer's elbow)",
    stage: "Strength phase",
    description: "Slowly lowering a light weight through wrist flexion, the evidence-informed way to load the forearm flexor tendon on the inner elbow.",
    equipment: ["A light dumbbell, starting around 0.5 to 1 kg", "A table or your thigh to rest the forearm on"],
    setup: "Sit with your forearm resting along a table or your thigh, palm facing up, with your hand and the weight just over the edge. Hold the weight loosely.",
    steps: [
      "Use your other hand to lift the weight up so the wrist is bent fully up towards you.",
      "Let go with the helping hand so the sore side is holding the weight up.",
      "Slowly lower the weight over about three to four seconds until the wrist is fully bent back.",
      "Help the weight back up to the top with your other hand, then repeat. Only the lowering is done by the sore side."
    ],
    cues: [
      "Count three to four seconds on every lower - slow and even.",
      "The lift back to the top is done with the other hand, not the sore wrist.",
      "Some ache in the inner forearm during and after is expected, as long as it settles within 24 hours."
    ],
    mistakes: [
      "Lowering quickly or letting the weight drop.",
      "Raising the weight back up with the sore side.",
      "Adding weight before three sets of the current weight feel controlled.",
      "Stop and message your physio if the pain is sharp, spreads down into the hand, or is clearly worse day to day."
    ],
    defaultDosage: {
      sets: 3,
      reps: 15,
      perDay: 1,
      perWeek: 7,
      tempo: "3 to 4 seconds to lower",
      notes: "Expect some inner-forearm ache during and after - this is a loading exercise and it should settle within a day. Add a small amount of weight only once 3 sets of 15 feel easy."
    },
    helpsWith: ["Easing pain on the inside of the elbow", "Rebuilding a pain-free grip", "Coping with lifting, carrying and gripping tasks"]
  },
  {
    id: "ex-152",
    slug: "resisted-wrist-flexion",
    title: "Resisted Wrist Flexion",
    bodyPart: "Wrist",
    clinicalArea: "upper_limb",
    tags: ["wrist", "golfers-elbow", "strength-phase"],
    condition: "Medial epicondylalgia (golfer's elbow)",
    stage: "Build strength",
    description: "Curling the wrist up against a light weight or band through its full range to strengthen the forearm flexor muscles.",
    equipment: ["A light dumbbell or a resistance band", "A table or your thigh to rest the forearm on"],
    setup: "Sit with your forearm resting along a table or your thigh, palm facing up and your hand just past the edge. Hold a light weight, or step on one end of a band and hold the other.",
    steps: [
      "Let the wrist relax so the weight or band draws the hand back.",
      "Curl the wrist up towards you as far as it comfortably goes.",
      "Pause briefly at the top.",
      "Lower under control back to the start over about three seconds."
    ],
    cues: [
      "Only the wrist moves - the forearm stays still on the support.",
      "Both the lift and the lower are smooth and controlled.",
      "Work to a firm but manageable effort, not to sharp pain."
    ],
    mistakes: [
      "Lifting the forearm off the support to help the movement.",
      "Rushing the lower so the weight drops.",
      "Using a load so heavy the wrist cannot move through its full range.",
      "Stop and message your physio if gripping or lifting becomes sharply painful, or you notice new pins and needles in the hand."
    ],
    defaultDosage: {
      sets: 3,
      reps: 12,
      perDay: 1,
      perWeek: 5,
      tempo: "3 seconds to lower",
      notes: "Start with a very light weight or a light band. Build the load gradually once 3 sets of 12 feel controlled."
    },
    helpsWith: ["Building forearm and grip strength", "Easing inner-elbow pain when gripping", "Getting back to lifting and carrying"]
  },
  {
    id: "ex-153",
    slug: "forearm-pronation-supination",
    title: "Forearm Rotation with Weight",
    bodyPart: "Wrist",
    clinicalArea: "upper_limb",
    tags: ["wrist", "tennis-elbow", "golfers-elbow", "strength-phase"],
    condition: "Elbow tendinopathy (tennis or golfer's elbow)",
    stage: "Build strength",
    description: "Slowly rotating the forearm palm-up and palm-down against a light off-centre weight, loading the muscles that twist the forearm.",
    equipment: ["A light hammer, or a dumbbell held at one end", "A table or your thigh to rest the forearm on"],
    setup: "Sit with your forearm resting along a table or your thigh, wrist and hand just past the edge, elbow bent to a right angle. Hold a light hammer or a dumbbell by one end so the weight sits to one side.",
    steps: [
      "Start with the thumb pointing up and the wrist held straight and still.",
      "Slowly turn the palm up as far as is comfortable.",
      "Slowly turn the palm down, again to a comfortable end point.",
      "Keep the movement slow and even in both directions."
    ],
    cues: [
      "The movement is a slow twist of the forearm - the wrist itself stays straight.",
      "Your elbow stays tucked at your side and does not swing.",
      "Control the weight through the whole arc, especially near the ends."
    ],
    mistakes: [
      "Letting the wrist bend instead of keeping the turn in the forearm.",
      "Swinging the whole arm to throw the weight round.",
      "Holding the weight too far down the handle so it feels heavy too soon.",
      "Stop and message your physio if the elbow pain becomes sharp, or twisting a key or door handle is much more painful afterwards."
    ],
    defaultDosage: {
      sets: 3,
      reps: 10,
      perDay: 1,
      perWeek: 5,
      tempo: "slow and controlled",
      notes: "One rep is a full turn palm-up then palm-down. Slide your hand further down the handle, or add weight, only as it becomes easy."
    },
    helpsWith: ["Coping with twisting tasks like keys, jars and door handles", "Easing elbow pain on the inner or outer side", "Building forearm strength for work and sport"]
  },
  {
    id: "ex-154",
    slug: "wrist-extension-isotonic",
    title: "Wrist Extension with Weight",
    bodyPart: "Wrist",
    clinicalArea: "upper_limb",
    tags: ["wrist", "tennis-elbow", "strength-phase"],
    condition: "Lateral epicondylalgia (tennis elbow)",
    stage: "Build strength",
    description: "Lifting and lowering a light weight through wrist extension using both phases of the movement, progressing the load on the wrist extensor tendon.",
    equipment: ["A light dumbbell or a resistance band", "A table or your thigh to rest the forearm on"],
    setup: "Sit with your forearm resting along a table or your thigh, palm facing down and your hand just past the edge, holding a light weight.",
    steps: [
      "Let the wrist drop so the weight lowers towards the floor.",
      "Lift the back of the hand up as far as the wrist comfortably goes.",
      "Pause briefly at the top.",
      "Lower back down under control over about three seconds."
    ],
    cues: [
      "The forearm stays still on the support - only the wrist moves.",
      "Both lifting and lowering are slow and smooth.",
      "Expect a working ache on top of the forearm that settles within a day."
    ],
    mistakes: [
      "Lifting the elbow or forearm to swing the weight up.",
      "Letting the weight drop quickly on the way down.",
      "Progressing the weight before the current one feels controlled for every set.",
      "Stop and message your physio if the outer-elbow pain sharpens, spreads down the arm, or is clearly worse the next day."
    ],
    defaultDosage: {
      sets: 3,
      reps: 12,
      perDay: 1,
      perWeek: 5,
      tempo: "3 seconds to lower",
      notes: "Start very light. This is the next step on from the eccentric-only version once that feels easy. Build the load slowly."
    },
    helpsWith: ["Loading the tennis-elbow tendon through its full range", "Rebuilding a pain-free grip", "Returning to gripping, lifting and racket sports"]
  },
  {
    id: "ex-155",
    slug: "tyler-twist-flexbar",
    title: "Tyler Twist (Resistance Bar)",
    bodyPart: "Elbow",
    clinicalArea: "upper_limb",
    tags: ["elbow", "tennis-elbow", "strength-phase"],
    condition: "Lateral epicondylalgia (tennis elbow)",
    stage: "Build strength",
    description: "A twisting exercise with a flexible rubber bar that loads the wrist extensor tendon through a controlled release, a well-studied approach for tennis elbow.",
    equipment: ["A flexible resistance bar, such as a red or green rubber FlexBar"],
    setup: "Stand tall holding the bar upright in the sore hand with that wrist bent fully back. Grip the top of the bar with the other hand, palm facing you.",
    steps: [
      "Twist the bar with the top (good) hand while the sore wrist holds its bent-back position.",
      "Bring the bar out in front of you and straighten both arms, keeping the twist held in the bar.",
      "Slowly let the sore wrist untwist the bar over about four seconds until that wrist is bent forward.",
      "Reset your grip and repeat. The sore side only controls the slow untwisting."
    ],
    cues: [
      "The work for the sore arm is the slow, controlled untwist - not the twisting up.",
      "Take about four seconds to release each rep.",
      "Keep your shoulders relaxed and down, not hunched."
    ],
    mistakes: [
      "Letting the bar spring back quickly instead of releasing it slowly.",
      "Using a bar that is too stiff to control at first - start with a lighter one.",
      "Gripping so hard that the hand and forearm cramp.",
      "Stop and message your physio if the elbow pain rises through the set, spreads down the forearm, or is worse the next morning."
    ],
    defaultDosage: {
      sets: 3,
      reps: 15,
      perDay: 1,
      perWeek: 7,
      tempo: "4 seconds to release",
      notes: "Expect a tolerable tendon ache during and after that settles within 24 hours. Move up a bar colour only once 3 sets of 15 feel easy."
    },
    helpsWith: ["Loading the tennis-elbow tendon in a controlled way", "Easing pain on the outside of the elbow", "Rebuilding grip strength for work and sport"]
  },
  {
    id: "ex-156",
    slug: "hip-hitch",
    title: "Hip Hitch (Pelvic Drop)",
    bodyPart: "Hip",
    clinicalArea: "lower_limb",
    tags: ["hip", "glute-strength", "strength-phase"],
    condition: "Gluteal tendinopathy",
    stage: "Build strength",
    description: "Standing on one leg on a step and slowly lowering then lifting the opposite side of the pelvis, training the outer-hip muscles that keep the pelvis level.",
    equipment: ["A step or the bottom stair", "A wall or rail for light balance support"],
    pose: "balance",
    setup: "Stand sideways on a step with one foot, the other foot hanging free over the edge. Rest a hand on a wall or rail for balance only. Stand tall through the standing leg.",
    steps: [
      "Keep the standing knee straight but not locked.",
      "Let the free-side hip drop slowly towards the floor by a few centimetres.",
      "Use the muscles on the side of the standing hip to lift that hip back up until the pelvis is level, or very slightly higher.",
      "Move slowly and with control in both directions."
    ],
    cues: [
      "The movement comes from hitching the pelvis, not from bending or straightening the standing knee.",
      "You feel the work in the side of the standing buttock and hip.",
      "Your upper body stays tall and still - you are not leaning over."
    ],
    mistakes: [
      "Bending and straightening the standing knee to create the movement.",
      "Pushing down hard through the balance hand.",
      "Letting the standing hip sway out to the side.",
      "Stop and message your physio if this brings on sharp outer-hip pain, or pain that lingers and disturbs your sleep that night."
    ],
    defaultDosage: {
      sets: 3,
      reps: 12,
      perDay: 1,
      perWeek: 5,
      tempo: "slow and controlled",
      notes: "Keep the standing hip in neutral rather than letting it drop out sideways, which can compress a sore tendon. Add light hand weights once the movement is easy."
    },
    helpsWith: ["Keeping the pelvis level when you walk and climb stairs", "Building outer-hip strength", "Easing lateral hip pain over time"]
  },
  {
    id: "ex-157",
    slug: "banded-hip-external-rotation",
    title: "Banded Hip External Rotation",
    bodyPart: "Hip",
    clinicalArea: "lower_limb",
    tags: ["hip", "glute-strength", "band", "strength-phase"],
    condition: "Gluteal tendinopathy",
    stage: "Build strength",
    description: "Pressing the thighs apart against a resistance band while seated or side-lying, targeting the deep outer-hip rotators and the gluteal muscles.",
    equipment: ["A short resistance loop band"],
    pose: "bandRotation",
    setup: "Sit on a firm chair with a loop band around both thighs just above the knees, feet flat and hip-width apart. Sit tall.",
    steps: [
      "Keep your feet planted and your knees over your ankles.",
      "Slowly press both knees apart against the band.",
      "Open only as far as you can without your pelvis rocking or your feet rolling.",
      "Bring the knees back together slowly, keeping tension on the band."
    ],
    cues: [
      "The movement is a slow open-and-close, not a series of quick pulses.",
      "You feel the work in the sides and back of the hips.",
      "Your trunk stays upright and still throughout."
    ],
    mistakes: [
      "Letting the knees snap back in rather than lowering with control.",
      "Leaning back or rocking the pelvis to force the knees wider.",
      "Using a band so strong the knees cannot move smoothly.",
      "Stop and message your physio if you feel a deep pinch in the front of the hip or groin, or the outer hip is more painful afterwards."
    ],
    defaultDosage: {
      sets: 3,
      reps: 15,
      perDay: 1,
      perWeek: 5,
      notes: "Can also be done lying on your side with knees bent, lifting the top knee against the band without letting the pelvis roll back. Progress to a stronger band as it becomes easy."
    },
    helpsWith: ["Strengthening the deep outer-hip muscles", "Improving control of the hip and pelvis", "Supporting recovery from lateral hip pain"]
  },
  {
    id: "ex-158",
    slug: "copenhagen-adductor",
    title: "Copenhagen Adductor Hold",
    bodyPart: "Hip",
    clinicalArea: "lower_limb",
    tags: ["hip", "adductor-strength", "return-to-sport"],
    condition: "Groin and adductor loading for sport",
    stage: "Return to activity",
    description: "A side-lying hold with the top leg supported on a bench, building strength through the inner-thigh adductor muscles and the side of the supporting hip.",
    equipment: ["A sturdy bench, sofa or low chair to rest the top leg on", "An exercise mat"],
    setup: "Lie on your side with your forearm on the floor and your elbow under your shoulder. Rest the inside of your top ankle and lower shin on a bench so that leg is roughly level with your body.",
    steps: [
      "Press down through the top leg into the bench and lift your hips up off the floor.",
      "Aim for a straight line from your top shoulder to your top foot.",
      "Hold steady, keeping your body long and your hips level.",
      "Lower back down slowly and rest fully between reps."
    ],
    cues: [
      "The lift comes from squeezing the top leg down into the support.",
      "Your body stays in one straight line, not sagging or piking at the hips.",
      "Keep breathing steadily through the hold."
    ],
    mistakes: [
      "Letting the hips drop or roll backwards during the hold.",
      "Starting with the full version before you can hold the easier bent-knee variation.",
      "Holding your breath and bracing the neck.",
      "Stop and message your physio if you feel a sharp pull in the groin or inner thigh, or pain that is worse the next day."
    ],
    defaultDosage: {
      sets: 3,
      holdSeconds: 10,
      reps: 5,
      perDay: 1,
      perWeek: 3,
      notes: "Start with the top knee bent and resting on the bench, a shorter and easier lever. Build towards a straight top leg and longer holds as it becomes comfortable."
    },
    helpsWith: ["Building inner-thigh and hip strength", "Preparing the hip for sport and change of direction", "Improving pelvic control on one leg"]
  },
  {
    id: "ex-159",
    slug: "single-leg-glute-bridge",
    title: "Single-Leg Glute Bridge",
    bodyPart: "Hip",
    clinicalArea: "lower_limb",
    tags: ["hip", "glute-strength", "strength-phase"],
    condition: "Gluteal weakness and hip or knee pain",
    stage: "Build strength",
    description: "Lifting the hips into a bridge while holding one leg off the floor, roughly doubling the load through the gluteal muscles of the standing leg.",
    equipment: ["An exercise mat"],
    pose: "pelvicTilt",
    setup: "Lie on your back with both knees bent and feet flat, hip-width apart, arms resting by your sides. Lift one foot off the floor and hold that knee towards your chest.",
    steps: [
      "Push through the heel of the foot that is still down and lift your hips up.",
      "Raise up until your body is in a straight line from shoulder to knee.",
      "Keep your pelvis level - do not let the lifted side sag.",
      "Lower slowly back to the floor and repeat, then swap legs."
    ],
    cues: [
      "The push comes through your heel, and you feel the work in your buttock.",
      "Your hips stay level, as if balancing a tray across them.",
      "Your lower back stays long, not arched."
    ],
    mistakes: [
      "Letting the non-working side of the pelvis drop as you lift.",
      "Pushing up mainly with the lower back rather than the buttock.",
      "Rushing the lower instead of controlling it.",
      "Stop and message your physio if you feel pinching in the front of the hip or groin, or lasting outer-hip or back pain afterwards."
    ],
    defaultDosage: {
      sets: 3,
      reps: 10,
      perDay: 1,
      perWeek: 5,
      tempo: "3 seconds to lower",
      notes: "Master the two-legged bridge first. Keep the pelvis level throughout - quality matters more than the number of reps."
    },
    helpsWith: ["Building single-leg buttock strength", "Steadying the pelvis on stairs and when running", "Supporting the hip and the kneecap"]
  },
  {
    id: "ex-160",
    slug: "standing-banded-hip-abduction",
    title: "Standing Banded Hip Abduction",
    bodyPart: "Hip",
    clinicalArea: "lower_limb",
    tags: ["hip", "glute-strength", "band", "strength-phase"],
    condition: "Gluteal tendinopathy",
    stage: "Build strength",
    description: "Standing on one leg and moving the other leg out to the side against a resistance band, strengthening the outer-hip muscles in an upright, functional position.",
    equipment: ["A short resistance loop band", "A wall or worktop for light balance support"],
    setup: "Stand with a loop band around both ankles, feet hip-width apart, next to a wall or worktop you can rest a hand on. Stand tall.",
    steps: [
      "Take most of your weight onto the leg nearest the wall.",
      "Keeping both knees straight, move the outer leg out to the side against the band.",
      "Move it only as far as you can without leaning your trunk or hitching the hip up.",
      "Bring the leg back in slowly, keeping some tension on the band."
    ],
    cues: [
      "Your trunk stays upright and still - the leg moves, not the body.",
      "You feel the work in the side of the standing buttock as well as the moving leg.",
      "Keep your toes pointing forwards, not turning out."
    ],
    mistakes: [
      "Leaning the body away to swing the leg higher.",
      "Letting the moving leg drift forwards instead of straight out to the side.",
      "Pushing hard through the balance hand.",
      "Stop and message your physio if the outer hip becomes sharply painful or is more painful lying on it that night."
    ],
    defaultDosage: {
      sets: 3,
      reps: 15,
      perDay: 1,
      perWeek: 5,
      notes: "The standing leg works to keep you steady, so both hips are training. Move the band up to the calves or thighs, or use a stronger band, to progress."
    },
    helpsWith: ["Strengthening the outer hip in standing", "Steadying the pelvis when walking", "Coping with stairs, hills and single-leg tasks"]
  },
  {
    id: "ex-161",
    slug: "deep-neck-flexor-hold",
    title: "Deep Neck Flexor Endurance Hold",
    bodyPart: "Cervical spine",
    clinicalArea: "spine",
    tags: ["neck", "deep-neck-flexors", "strength-phase"],
    condition: "Non-specific neck pain",
    stage: "Build strength",
    description: "A gentle sustained chin-nod that holds the deep muscles at the front of the neck in a light contraction to build their endurance.",
    equipment: [],
    pose: "chinTuck",
    setup: "Lie on your back with your knees bent and your head resting flat on the surface, or on a folded towel so your face is level. Let your shoulders and jaw relax.",
    steps: [
      "Nod your head very gently, as if saying a small yes, to flatten the back of your neck slightly towards the floor.",
      "Keep the nod small - your head stays resting down, it does not lift.",
      "Hold the gentle nod steady while you breathe normally.",
      "Release slowly and rest for a few seconds before the next hold."
    ],
    cues: [
      "The movement is a tiny nod at the top of the neck, not a chin-to-chest curl.",
      "The muscles at the front of your throat feel like they are working gently, without hardening or shaking.",
      "Your jaw stays loose - your teeth are not clenched."
    ],
    mistakes: [
      "Lifting the head off the surface, which brings in the larger surface muscles.",
      "Pushing the nod so hard the front-of-neck muscles bulge or tremble.",
      "Holding your breath during the hold.",
      "Stop and message your physio if this brings on dizziness, a headache, or pins and needles into the arm."
    ],
    defaultDosage: {
      sets: 3,
      holdSeconds: 10,
      reps: 5,
      perDay: 2,
      perWeek: 7,
      notes: "Build the hold from 5 seconds towards 10, then add reps. Once it is easy lying down, progress to doing it sitting against a wall."
    },
    helpsWith: ["Building endurance in the deep neck muscles", "Coping better with desk work and screen time", "Reducing how often neck pain flares"]
  },
  {
    id: "ex-162",
    slug: "banded-neck-isometrics",
    title: "Banded Neck Isometrics (4-Way)",
    bodyPart: "Cervical spine",
    clinicalArea: "spine",
    tags: ["neck", "isometric", "strength-phase"],
    condition: "Non-specific neck pain",
    stage: "Build strength",
    description: "Gentle press-and-hold contractions of the neck muscles in four directions with no movement, using a hand for light resistance.",
    equipment: [],
    pose: "chinTuck",
    setup: "Sit or stand tall with your head balanced level over your shoulders and your chin very slightly tucked.",
    steps: [
      "Place a palm flat against your forehead and press your head gently forwards into it - the head does not move.",
      "Hold, then relax. Repeat with the palm on the back of the head, pressing gently backwards.",
      "Repeat with a palm on each side in turn, pressing the head gently sideways into the hand.",
      "Keep each press light, around a quarter of your full effort."
    ],
    cues: [
      "Your head stays completely still - only the effort changes.",
      "The chin stays gently tucked and level, not poking forward or tipping up.",
      "Build each press up slowly over two seconds and ease off slowly."
    ],
    mistakes: [
      "Pressing so hard the neck actually moves or the shoulders hunch up.",
      "Holding your breath through the contraction.",
      "Letting the chin poke forward as you press.",
      "Stop and message your physio if the pressing brings on dizziness, visual changes, or pain or tingling spreading into the arm."
    ],
    defaultDosage: {
      sets: 2,
      holdSeconds: 6,
      reps: 4,
      perDay: 1,
      perWeek: 6,
      notes: "One rep is one press in one direction; work through forwards, backwards and each side. Keep the effort light and the neck pain-free."
    },
    helpsWith: ["Building all-round neck strength", "Making the neck feel steadier and less fragile", "Coping with longer spells of sitting and driving"]
  },
  {
    id: "ex-163",
    slug: "prone-neck-extension",
    title: "Prone Neck Extension",
    bodyPart: "Cervical spine",
    clinicalArea: "spine",
    tags: ["neck", "extensor-strength", "return-to-activity"],
    condition: "Non-specific neck pain",
    stage: "Return to activity",
    description: "Lying face down over the edge of a bed and slowly lifting the head against gravity to strengthen the muscles at the back of the neck.",
    equipment: ["A firm bed or bench"],
    setup: "Lie face down with your chest on a firm bed and your head and neck just past the edge, forehead towards the floor. Rest your arms by your sides or on the bed.",
    steps: [
      "Start with the chin gently tucked, not with the head hanging loose.",
      "Slowly lift your head until it is level with your body, leading with the crown of the head, not the chin.",
      "Hold level for a moment, keeping the chin tucked.",
      "Lower slowly back down under control."
    ],
    cues: [
      "The lift stops when your head is in line with your body - you are not arching up higher.",
      "The chin stays tucked so the movement works the deep muscles, not just the surface ones.",
      "The neck moves slowly and smoothly, with no jerking."
    ],
    mistakes: [
      "Throwing the head up quickly or letting it drop on the way down.",
      "Leading with the chin so the head tips back into a crane position.",
      "Lifting past level into a strong backward arch.",
      "Stop and message your physio if this brings on dizziness, a headache, or symptoms spreading into the arm, or sharply worsens your neck pain."
    ],
    defaultDosage: {
      sets: 2,
      reps: 10,
      perDay: 1,
      perWeek: 4,
      tempo: "3 seconds up, 3 seconds down",
      notes: "A late-stage exercise - only add it once the lighter neck work is easy and pain-free. Start with very few reps and build slowly."
    },
    helpsWith: ["Strengthening the muscles at the back of the neck", "Holding the head up comfortably for longer", "Coping with sustained desk and driving postures"]
  },
  {
    id: "ex-164",
    slug: "heavy-slow-calf-raise",
    title: "Heavy Slow Calf Raise",
    bodyPart: "Ankle",
    clinicalArea: "lower_limb",
    tags: ["ankle", "calf-strength", "tendon-loading", "strength-phase"],
    condition: "Achilles tendinopathy",
    stage: "Strength phase",
    description: "A slow, heavily loaded heel raise through full range, the strength end of a staged Achilles loading programme.",
    equipment: ["A step", "A loaded rucksack, dumbbells, or a gym calf-raise machine", "A rail or wall for balance"],
    pose: "heelRaise",
    setup: "Stand with the balls of both feet on the edge of a step, heels off the back, holding a rail. Add load with a weighted rucksack or dumbbells once bodyweight feels easy.",
    steps: [
      "Lower your heels slowly below the level of the step over about three seconds.",
      "Pause briefly at the bottom, feeling the stretch through the calf and Achilles.",
      "Rise up onto your toes slowly over about three seconds, as high as you can.",
      "Pause at the top, then repeat. Progress towards doing it on one leg."
    ],
    cues: [
      "Each rep takes about three seconds up and three seconds down - no bouncing.",
      "Push evenly through the big toe and second toe, not rolling to the outside.",
      "Work to a heavy but manageable effort - the last two or three reps should feel hard."
    ],
    mistakes: [
      "Rushing the reps or using momentum to bounce out of the bottom.",
      "Cutting the range short at the top or the bottom.",
      "Adding a lot of weight in one jump rather than small steps.",
      "Stop and message your physio if the tendon pain climbs above a moderate level during the set, or the tendon is stiffer and more painful the next morning."
    ],
    defaultDosage: {
      sets: 3,
      reps: 8,
      perDay: 1,
      perWeek: 3,
      tempo: "3 seconds up, 3 seconds down",
      notes: "Aim for a load where 8 reps feel hard. Some tendon pain up to about 3 to 5 out of 10 is acceptable if it settles within 24 hours and morning stiffness is not increasing week on week."
    },
    helpsWith: ["Building calf and Achilles tendon strength", "Coping with walking, hills and stairs", "Returning to running and jumping"]
  },
  {
    id: "ex-165",
    slug: "seated-calf-raise",
    title: "Seated Calf Raise (Soleus)",
    bodyPart: "Ankle",
    clinicalArea: "lower_limb",
    tags: ["ankle", "calf-strength", "soleus", "strength-phase"],
    condition: "Achilles tendinopathy",
    stage: "Strength phase",
    description: "A heel raise performed sitting with the knee bent, which shifts the load onto the soleus, the deeper calf muscle that takes most of the strain during running.",
    equipment: ["A firm chair", "A weight to rest on the knees, such as a dumbbell or a loaded bag", "A step or thick book for the feet"],
    pose: "heelRaise",
    setup: "Sit on a firm chair with your feet flat, knees bent to a right angle and directly over your ankles. Rest the balls of your feet on a step or thick book and place a weight across your thighs, close to the knees.",
    steps: [
      "Let your heels lower slowly towards the floor over about three seconds.",
      "Pause briefly at the bottom.",
      "Press through the balls of the feet to lift the heels as high as they go, over about three seconds.",
      "Pause at the top, then repeat."
    ],
    cues: [
      "The knees stay bent at a right angle throughout - the movement is only at the ankles.",
      "Both heels rise and lower together and evenly.",
      "Work to a firm effort where the final reps feel hard."
    ],
    mistakes: [
      "Bouncing the weight with quick, short reps.",
      "Letting the knees drift forwards or the feet roll outwards.",
      "Using so little range that the heels barely move.",
      "Stop and message your physio if the tendon or heel pain rises sharply during the set or is clearly worse the next day."
    ],
    defaultDosage: {
      sets: 3,
      reps: 10,
      perDay: 1,
      perWeek: 3,
      tempo: "3 seconds up, 3 seconds down",
      notes: "The bent knee targets the soleus, which straight-knee heel raises miss. Build the weight gradually. Expect a tolerable working ache that settles within a day."
    },
    helpsWith: ["Strengthening the deeper calf muscle used in running", "Filling a common gap in calf rehab", "Coping with longer walks and runs"]
  },
  {
    id: "ex-166",
    slug: "spanish-squat",
    title: "Spanish Squat (Isometric)",
    bodyPart: "Knee",
    clinicalArea: "lower_limb",
    tags: ["knee", "isometric", "tendon-loading", "early-rehab"],
    condition: "Patellar tendinopathy (flare-up)",
    stage: "Early rehab",
    description: "A held squat with a strong band looped behind the knees and anchored in front, letting you load the quads hard with the shins kept vertical - a low-irritation way to settle tendon pain.",
    equipment: ["A strong resistance band or strap", "A solid anchor point such as a heavy table leg or a door anchor"],
    pose: "squat",
    setup: "Loop a strong band around the back of both knees and anchor the other end to something solid at about knee height in front of you. Step back until the band is tight, feet hip-width apart.",
    steps: [
      "Let the band take some of your weight as you sit back into a squat.",
      "Lower until your knees are bent to roughly a right angle, keeping your shins vertical and your chest up.",
      "Hold the position still, with your weight even through both feet.",
      "Stand back up to finish the hold."
    ],
    cues: [
      "Your shins stay vertical - the band lets you sit back without your knees travelling forward.",
      "The hold feels like steady, strong work in the front of the thighs.",
      "Any tendon pain stays low and does not build through the hold."
    ],
    mistakes: [
      "Letting the knees drift forward over the toes, which loads the tendon more.",
      "Holding your breath - keep breathing through the whole hold.",
      "Putting more weight on the less painful leg.",
      "Stop and message your physio if the knee pain climbs during the hold or is worse the morning after."
    ],
    defaultDosage: {
      sets: 5,
      holdSeconds: 45,
      perDay: 1,
      perWeek: 4,
      tempo: "still hold",
      notes: "Set the depth and band tension so the hold is a firm 6 or 7 out of 10 effort with low pain. Often used before training to reduce tendon pain for a few hours."
    },
    helpsWith: ["Settling tendon pain at the front of the knee", "Loading the thigh muscles with less strain on the kneecap", "Staying in training while a flare calms down"]
  },
  {
    id: "ex-167",
    slug: "reverse-nordic",
    title: "Reverse Nordic (Quad Eccentric)",
    bodyPart: "Knee",
    clinicalArea: "lower_limb",
    tags: ["knee", "quad-strength", "eccentric", "strength-phase"],
    condition: "Patellar tendinopathy",
    stage: "Strength phase",
    description: "Kneeling upright and slowly leaning back from the knees, lowering under control to load the quadriceps and the front of the knee through a long, lengthened range.",
    equipment: ["An exercise mat or a padded surface for the knees"],
    setup: "Kneel upright on a mat with your knees hip-width apart, feet pointing back and ankles relaxed. Cross your arms over your chest or hold them out in front. Keep a straight line from knees to head.",
    steps: [
      "Keeping your hips straight and your body in one line, lean slowly backwards from the knees.",
      "Lower only as far as you can control, letting the fronts of the thighs take the strain.",
      "Pause briefly, then pull yourself back up to upright using your thigh muscles.",
      "Move slowly and smoothly throughout, especially on the way down."
    ],
    cues: [
      "Your body stays in a straight line from knees to head - the hips do not bend.",
      "The lower is slow and controlled, taking three to four seconds.",
      "Start with a small range and build it as your strength improves."
    ],
    mistakes: [
      "Bending at the hips so it becomes a lean rather than a knee movement.",
      "Dropping back quickly instead of lowering with control.",
      "Going deeper than you can control and having to catch yourself.",
      "Stop and message your physio if you feel sharp pain in the knee or kneecap, or the knee is swollen or much more painful the next day."
    ],
    defaultDosage: {
      sets: 3,
      reps: 6,
      perDay: 1,
      perWeek: 3,
      tempo: "3 to 4 seconds to lower",
      notes: "A demanding exercise - start with a very small backward range, or hold a pole in front for support, and build up slowly over weeks."
    },
    helpsWith: ["Building quad strength through a long range", "Loading the front of the knee for jumping sports", "Improving control when landing and slowing down"]
  }
];

export function resolveDosage(
  ex: Exercise,
  assigned?: { dosage?: ExerciseDosage },
): ExerciseDosage {
  return { ...(ex.defaultDosage ?? {}), ...(assigned?.dosage ?? {}) };
}

function frequencyClause(d: ExerciseDosage): string | null {
  let daily: string | null = null;
  if (d.perDay != null && d.perDay >= 1) {
    daily =
      d.perDay === 1 ? "once a day" : d.perDay === 2 ? "twice a day" : `${d.perDay} times a day`;
  }
  let weekly: string | null = null;
  if (d.perWeek != null && d.perWeek >= 1) {
    weekly = d.perWeek >= 7 ? "every day" : `${d.perWeek} days a week`;
  }
  // Show both when they add information: "once a day, 5 days a week". A daily
  // count already implies "every day", so drop a redundant perWeek: 7.
  if (daily && weekly) return weekly === "every day" ? daily : `${daily}, ${weekly}`;
  return daily ?? weekly;
}

function plural(n: number, word: string): string {
  return `${n} ${word}${n === 1 ? "" : "s"}`;
}

export function formatDosage(d: ExerciseDosage): string {
  let core: string | null = null;
  if (d.minutes != null) {
    core = plural(d.minutes, "minute");
  } else if (d.holdSeconds != null && d.reps != null) {
    // a repeated hold — keep both the count and the hold time
    const count = d.sets != null ? `${plural(d.sets, "set")} × ${plural(d.reps, "rep")}` : plural(d.reps, "rep");
    core = `${count}, ${d.holdSeconds}s hold`;
  } else if (d.holdSeconds != null) {
    core = d.sets != null ? `Hold ${d.holdSeconds}s × ${d.sets}` : `Hold ${d.holdSeconds}s`;
  } else if (d.reps != null) {
    core = d.sets != null ? `${plural(d.sets, "set")} × ${plural(d.reps, "rep")}` : plural(d.reps, "rep");
  } else if (d.sets != null) {
    core = plural(d.sets, "set");
  }
  if (core == null) return "As advised by your physio";
  const parts = [core];
  const freq = frequencyClause(d);
  if (freq) parts.push(freq);
  if (d.tempo && d.tempo.trim()) parts.push(d.tempo.trim());
  return parts.join(" · ");
}

// True when the dose specifies actual load — as opposed to the "ask your
// physio" placeholder formatDosage falls back to.
export function hasPrescribedDose(d: ExerciseDosage): boolean {
  return d.sets != null || d.reps != null || d.holdSeconds != null || d.minutes != null;
}

const CAPS: { key: keyof ExerciseDosage; max: number; label: string }[] = [
  { key: "sets", max: 10, label: "Sets" },
  { key: "reps", max: 100, label: "Reps" },
  { key: "holdSeconds", max: 600, label: "Hold" },
  { key: "minutes", max: 90, label: "Minutes" },
  { key: "perDay", max: 10, label: "Times per day" },
];

export function validateDosage(d: ExerciseDosage): string | null {
  for (const { key, max, label } of CAPS) {
    const v = d[key];
    if (v == null) continue;
    if (typeof v !== "number" || !Number.isInteger(v)) return `${label} must be a whole number.`;
    if (v < 0) return `${label} cannot be negative.`;
    if (v > max) return `${label} cannot be more than ${max}.`;
  }
  if (d.perWeek != null) {
    if (!Number.isInteger(d.perWeek) || d.perWeek < 1 || d.perWeek > 7) {
      return "Days per week must be between 1 and 7.";
    }
  }
  if (d.tempo != null && typeof d.tempo !== "string") return "Tempo must be text.";
  if (d.notes != null && (typeof d.notes !== "string" || d.notes.length > 300)) {
    return "Keep the patient note to 300 characters or fewer.";
  }
  return null;
}
