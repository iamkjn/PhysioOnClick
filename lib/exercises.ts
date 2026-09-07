import type { ClinicalArea } from "@/lib/assessment-forms";

export type ExerciseDosage = {
  sets?: number;
  reps?: number;
  holdSeconds?: number;
  perDay?: number;
  perWeek?: number;
  tempo?: string;
  notes?: string;
};

export type Exercise = {
  id: string;
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
};

export const exercises: Exercise[] = [
  {
    id: "ex-1",
    title: "Sit to Stand Control",
    bodyPart: "Lower limb",
    clinicalArea: "lower_limb",
    tags: ["knee-replacement", "functional", "early-rehab"],
    condition: "Post knee replacement",
    stage: "Early rehab",
    description: "Builds confidence and functional strength for everyday transfers.",
    videoUrl: "https://www.youtube.com/embed/1iQvKfV5fCE"
  },
  {
    id: "ex-2",
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
    title: "Tandem Balance Hold",
    bodyPart: "Balance",
    clinicalArea: "balance_walking",
    tags: ["falls-prevention", "static-balance"],
    condition: "Falls prevention",
    stage: "Mobility phase",
    description: "Challenges balance safely and can be progressed with hand support as needed.",
    videoUrl: "https://www.youtube.com/embed/qri3WcM6L4o"
  },
  {
    id: "ex-5",
    title: "Straight Leg Raise",
    bodyPart: "Knee",
    clinicalArea: "lower_limb",
    tags: ["knee", "quad-strength", "early-rehab"],
    condition: "Post knee replacement",
    stage: "Early rehab",
    description: "Strengthens the thigh muscle while keeping the knee straight, moving as guided.",
    videoUrl: "https://www.youtube.com/embed/1iQvKfV5fCE"
  },
  {
    id: "ex-6",
    title: "Heel Slide",
    bodyPart: "Knee",
    clinicalArea: "lower_limb",
    tags: ["knee", "range-of-motion", "early-rehab"],
    condition: "Post knee replacement",
    stage: "Early rehab",
    description: "Gently restores knee bending range through a slow, controlled sliding motion.",
    videoUrl: "https://www.youtube.com/embed/uKYLJ3f6QBA"
  },
  {
    id: "ex-7",
    title: "Mini Squat",
    bodyPart: "Knee",
    clinicalArea: "lower_limb",
    tags: ["knee", "osteoarthritis", "strength-phase"],
    condition: "Knee osteoarthritis",
    stage: "Strength phase",
    description: "Builds functional leg strength through a small, controlled bend at the knees and hips.",
    videoUrl: "https://www.youtube.com/embed/wPM8icPu6H8"
  },
  {
    id: "ex-8",
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
    title: "Pendulum Swing",
    bodyPart: "Shoulder",
    clinicalArea: "upper_limb",
    tags: ["shoulder", "rotator-cuff", "early-rehab"],
    condition: "Rotator cuff repair",
    stage: "Early rehab",
    description: "Uses a gentle, relaxed swinging motion to ease shoulder stiffness without active lifting.",
    videoUrl: "https://www.youtube.com/embed/1iQvKfV5fCE"
  },
  {
    id: "ex-10",
    title: "Single Leg Balance",
    bodyPart: "Balance",
    clinicalArea: "balance_walking",
    tags: ["falls-prevention", "dynamic-balance"],
    condition: "Falls prevention",
    stage: "Mobility phase",
    description: "Improves standing balance and confidence, with hand support nearby if needed.",
    videoUrl: "https://www.youtube.com/embed/uKYLJ3f6QBA"
  },
  {
    id: "ex-11",
    title: "Hip Bridge",
    bodyPart: "Hip",
    clinicalArea: "lower_limb",
    tags: ["hip", "glute-strength", "strength-phase"],
    condition: "Hip pain",
    stage: "Strength phase",
    description: "Strengthens the hips and glutes through a slow, controlled lifting and lowering motion.",
    videoUrl: "https://www.youtube.com/embed/wPM8icPu6H8"
  },
  {
    id: "ex-12",
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
    title: "Stationary Bike",
    bodyPart: "Knee",
    clinicalArea: "lower_limb",
    tags: ["knee-replacement", "low-impact", "mobility"],
    condition: "Post knee replacement",
    stage: "Mobility phase",
    description: "Supports gentle, low-impact movement to build knee range and general fitness.",
    videoUrl: "https://www.youtube.com/embed/qri3WcM6L4o"
  },
  // Facial-rehab exercises for facial-palsy / post-stroke / older patients.
  // Their motion check uses the FACE camera engine (symmetry + gentle reps),
  // not the body pose engine — see lib/face-targets.ts (face-* ids).
  {
    id: "face-smile",
    title: "Smile / Mouth Raise",
    bodyPart: "Face",
    clinicalArea: "neuro",
    tags: ["facial-palsy", "stroke", "symmetry"],
    condition: "Facial palsy / stroke recovery",
    stage: "Facial rehab",
    description: "Gently raise both mouth corners into a smile, aiming to move the weaker side to match the stronger one.",
    videoUrl: "https://www.youtube.com/embed/qri3WcM6L4o"
  },
  {
    id: "face-brow-raise",
    title: "Eyebrow Raise",
    bodyPart: "Face",
    clinicalArea: "neuro",
    tags: ["facial-palsy", "stroke", "symmetry"],
    condition: "Facial palsy / stroke recovery",
    stage: "Facial rehab",
    description: "Lift both eyebrows as evenly as you can, then relax — retraining symmetrical forehead control.",
    videoUrl: "https://www.youtube.com/embed/qri3WcM6L4o"
  },
  {
    id: "face-eye-close",
    title: "Gentle Eye Close",
    bodyPart: "Face",
    clinicalArea: "neuro",
    tags: ["facial-palsy", "stroke", "symmetry"],
    condition: "Facial palsy / stroke recovery",
    stage: "Facial rehab",
    description: "Softly close both eyes together and reopen, encouraging even eyelid control on both sides.",
    videoUrl: "https://www.youtube.com/embed/qri3WcM6L4o"
  },
  {
    id: "face-cheek-puff",
    title: "Cheek Puff",
    bodyPart: "Face",
    clinicalArea: "neuro",
    tags: ["facial-palsy", "stroke", "lip-seal"],
    condition: "Facial palsy / stroke recovery",
    stage: "Facial rehab",
    description: "Puff out both cheeks and hold, then release — building lip seal and cheek-muscle control.",
    videoUrl: "https://www.youtube.com/embed/qri3WcM6L4o"
  },
  {
    id: "face-frown",
    title: "Brow Furrow",
    bodyPart: "Face",
    clinicalArea: "neuro",
    tags: ["facial-palsy", "stroke", "symmetry"],
    condition: "Facial palsy / stroke recovery",
    stage: "Facial rehab",
    description: "Pull both eyebrows down and together into a frown, then relax — retraining even upper-face control.",
    videoUrl: "https://www.youtube.com/embed/qri3WcM6L4o"
  },
  {
    id: "face-big-smile",
    title: "Big Smile",
    bodyPart: "Face",
    clinicalArea: "neuro",
    tags: ["facial-palsy", "stroke", "symmetry"],
    condition: "Facial palsy / stroke recovery",
    stage: "Facial rehab",
    description: "A wider smile progression — push both mouth corners up and out as far as feels comfortable, keeping the sides even.",
    videoUrl: "https://www.youtube.com/embed/qri3WcM6L4o"
  },
  {
    id: "face-eye-wide",
    title: "Open Eyes Wide",
    bodyPart: "Face",
    clinicalArea: "neuro",
    tags: ["facial-palsy", "stroke", "symmetry"],
    condition: "Facial palsy / stroke recovery",
    stage: "Facial rehab",
    description: "Open both eyes as wide as you can, as if surprised, then relax — encouraging even eyelid lift on both sides.",
    videoUrl: "https://www.youtube.com/embed/qri3WcM6L4o"
  },
  {
    id: "face-pucker",
    title: "Lip Pucker",
    bodyPart: "Face",
    clinicalArea: "neuro",
    tags: ["facial-palsy", "stroke", "lip-seal"],
    condition: "Facial palsy / stroke recovery",
    stage: "Facial rehab",
    description: "Draw both lips forward into a pucker, as if to kiss or whistle, then relax — building lip-rounding control for speech and drinking.",
    videoUrl: "https://www.youtube.com/embed/qri3WcM6L4o"
  },
  {
    id: "ex-17", title: "McKenzie Press-Up", bodyPart: "Lumbar spine",
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
    id: "ex-19", title: "Cat-Cow Stretch", bodyPart: "Thoracic spine",
    clinicalArea: "spine", tags: ["mid-back", "mobility", "early-rehab"],
    condition: "Thoracic stiffness", stage: "Early rehab",
    description: "Alternates gentle spinal flexion and extension on hands and knees to restore comfortable segmental movement."
  },
  {
    id: "ex-20", title: "Thoracic Rotation (Open Book)", bodyPart: "Thoracic spine",
    clinicalArea: "spine", tags: ["mid-back", "rotation", "mobility"],
    condition: "Thoracic stiffness", stage: "Mobility phase",
    description: "Side-lying rotation opening the chest toward the ceiling, restoring rotation range often lost with prolonged sitting."
  },
  {
    id: "ex-21", title: "Neck Rotation Range", bodyPart: "Cervical spine",
    clinicalArea: "spine", tags: ["neck", "range-of-motion", "early-rehab"],
    condition: "Neck pain", stage: "Early rehab",
    description: "Slow, controlled turning of the head side to side within a comfortable range to restore rotation."
  },
  {
    id: "ex-22", title: "Neck Side Flexion Stretch", bodyPart: "Cervical spine",
    clinicalArea: "spine", tags: ["neck", "flexibility", "early-rehab"],
    condition: "Neck pain", stage: "Early rehab",
    description: "A gentle ear-to-shoulder stretch, held briefly, to ease tight upper trapezius and neck muscles."
  },
  {
    id: "ex-23", title: "Isometric Neck Hold", bodyPart: "Cervical spine",
    clinicalArea: "spine", tags: ["neck", "whiplash", "strength-phase"],
    condition: "Whiplash-associated disorder", stage: "Strength phase",
    description: "Gentle resistance pushing the head into a supporting hand without movement, rebuilding neck muscle endurance safely."
  },
  {
    id: "ex-24", title: "Prone Cobra", bodyPart: "Lumbar spine",
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
    id: "ex-29", title: "Standing Chin Retraction", bodyPart: "Cervical spine",
    clinicalArea: "spine", tags: ["neck", "postural-control", "early-rehab"],
    condition: "Cervicogenic headache", stage: "Early rehab",
    description: "Drawing the chin straight back to correct forward-head posture, a common driver of tension-type headaches."
  },
  {
    id: "ex-30", title: "Levator Scapulae Stretch", bodyPart: "Cervical spine",
    clinicalArea: "spine", tags: ["neck", "flexibility", "mobility"],
    condition: "Neck and upper trap tightness", stage: "Mobility phase",
    description: "A diagonal neck stretch looking down and away to lengthen a commonly tight muscle behind the shoulder blade."
  },
  {
    id: "ex-31", title: "Lumbar Flexion in Lying", bodyPart: "Lumbar spine",
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
    id: "ex-33", title: "Wall Angels", bodyPart: "Thoracic spine",
    clinicalArea: "spine", tags: ["mid-back", "posture", "strength-phase"],
    condition: "Postural thoracic pain", stage: "Strength phase",
    description: "Sliding the arms up and down a wall while keeping contact, retraining shoulder-blade control and upright posture."
  },
  {
    id: "ex-34", title: "Functional Lifting Pattern", bodyPart: "Lumbar spine",
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
  { id: "ex-38", title: "Sleeper Stretch", bodyPart: "Shoulder", clinicalArea: "upper_limb", tags: ["shoulder", "internal-rotation", "mobility"], condition: "Shoulder stiffness", stage: "Mobility phase", description: "Side-lying gentle pressure on the forearm to restore internal rotation range, common after overhead sports." },
  { id: "ex-39", title: "Prone Y-T-W Raises", bodyPart: "Shoulder", clinicalArea: "upper_limb", tags: ["shoulder", "scapular-control", "strength-phase"], condition: "Scapular dyskinesis", stage: "Strength phase", description: "Lying face down, lifting the arms into Y, T and W positions to retrain scapular muscle balance." },
  { id: "ex-40", title: "Elbow Flexion/Extension", bodyPart: "Elbow", clinicalArea: "upper_limb", tags: ["elbow", "range-of-motion", "early-rehab"], condition: "Post-elbow fracture", stage: "Early rehab", description: "Slow bending and straightening of the elbow through the available range to prevent stiffness after immobilisation." },
  { id: "ex-41", title: "Wrist Extensor Stretch", bodyPart: "Wrist", clinicalArea: "upper_limb", tags: ["wrist", "tennis-elbow", "mobility"], condition: "Lateral epicondylalgia (tennis elbow)", stage: "Mobility phase", description: "Gently pulling the wrist into flexion with the elbow straight to stretch the overloaded forearm extensors." },
  { id: "ex-42", title: "Eccentric Wrist Extension", bodyPart: "Wrist", clinicalArea: "upper_limb", tags: ["wrist", "tennis-elbow", "strength-phase"], condition: "Lateral epicondylalgia (tennis elbow)", stage: "Strength phase", description: "Slowly lowering a light weight through wrist extension, the evidence-based loading approach for tendon pain." },
  { id: "ex-43", title: "Wrist Flexor Stretch", bodyPart: "Wrist", clinicalArea: "upper_limb", tags: ["wrist", "golfers-elbow", "mobility"], condition: "Medial epicondylalgia (golfer's elbow)", stage: "Mobility phase", description: "Gently pulling the wrist into extension with the elbow straight to stretch the forearm flexors." },
  { id: "ex-44", title: "Grip Strengthening", bodyPart: "Hand", clinicalArea: "upper_limb", tags: ["hand", "grip", "strength-phase"], condition: "Hand weakness", stage: "Strength phase", description: "Repeated squeezing of a soft ball or putty to rebuild grip strength lost after injury or immobilisation." },
  { id: "ex-45", title: "Tendon Glide Exercises", bodyPart: "Hand", clinicalArea: "upper_limb", tags: ["hand", "carpal-tunnel", "early-rehab"], condition: "Carpal tunnel syndrome", stage: "Early rehab", description: "A sequence of finger positions gliding the flexor tendons through the wrist to reduce stiffness and nerve irritation." },
  { id: "ex-46", title: "Median Nerve Glide", bodyPart: "Wrist", clinicalArea: "upper_limb", tags: ["wrist", "carpal-tunnel", "neural-mobility"], condition: "Carpal tunnel syndrome", stage: "Early rehab", description: "A gentle nerve mobilisation moving the wrist and fingers through positions that glide the median nerve." },
  { id: "ex-47", title: "Scapular Retraction (Band Row)", bodyPart: "Shoulder", clinicalArea: "upper_limb", tags: ["shoulder", "postural-control", "strength-phase"], condition: "Shoulder impingement", stage: "Strength phase", description: "Pulling a resistance band toward the chest, squeezing the shoulder blades together to build postural shoulder strength." },
  { id: "ex-48", title: "Overhead Press Progression", bodyPart: "Shoulder", clinicalArea: "upper_limb", tags: ["shoulder", "return-to-function"], condition: "Shoulder impingement", stage: "Return to function", description: "A light, controlled overhead press building the strength and confidence to return to lifting or overhead sport." },
  { id: "ex-49", title: "Weight-Bearing Through Extended Wrist", bodyPart: "Wrist", clinicalArea: "upper_limb", tags: ["wrist", "post-fracture", "return-to-function"], condition: "Post-wrist fracture", stage: "Return to function", description: "Gradually loading body weight through a flat, extended hand to rebuild wrist tolerance for daily tasks." },
  { id: "ex-50", title: "Pendulum with Light Weight", bodyPart: "Shoulder", clinicalArea: "upper_limb", tags: ["shoulder", "frozen-shoulder", "early-rehab"], condition: "Frozen shoulder", stage: "Early rehab", description: "A weighted pendulum swing using gravity to gently distract and mobilise a stiff, painful shoulder joint." },
  { id: "ex-51", title: "Cross-Body Stretch", bodyPart: "Shoulder", clinicalArea: "upper_limb", tags: ["shoulder", "posterior-capsule", "mobility"], condition: "Posterior shoulder tightness", stage: "Mobility phase", description: "Pulling the arm across the chest to stretch the back of the shoulder, often tight after throwing or racquet sports." },
  {
    id: "ex-52",
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
  { id: "ex-53", title: "Terminal Knee Extension (Band)", bodyPart: "Knee", clinicalArea: "lower_limb", tags: ["knee", "quad-strength", "strength-phase"], condition: "Anterior knee pain", stage: "Strength phase", description: "A resisted band pulling the knee into slight flexion while the quad straightens it, targeting the final degrees of extension." },
  { id: "ex-54", title: "Step-Up", bodyPart: "Knee", clinicalArea: "lower_limb", tags: ["knee", "functional", "strength-phase"], condition: "Patellofemoral pain", stage: "Strength phase", description: "Stepping up onto a low step with control, building single-leg strength for stairs and functional movement." },
  { id: "ex-55", title: "Clam Shell", bodyPart: "Hip", clinicalArea: "lower_limb", tags: ["hip", "glute-strength", "early-rehab"], condition: "Hip and knee pain (gluteal weakness)", stage: "Early rehab", description: "Lying on the side with knees bent, lifting the top knee while keeping feet together to activate the gluteus medius." },
  { id: "ex-56", title: "Side-Lying Hip Abduction", bodyPart: "Hip", clinicalArea: "lower_limb", tags: ["hip", "glute-strength", "strength-phase"], condition: "Gluteal tendinopathy", stage: "Strength phase", description: "Lifting the top leg straight out to the side, building hip abductor strength important for pelvic control." },
  { id: "ex-57", title: "Standing Hip Flexor Stretch", bodyPart: "Hip", clinicalArea: "lower_limb", tags: ["hip", "flexibility", "mobility"], condition: "Hip flexor tightness", stage: "Mobility phase", description: "A lunge-position stretch lengthening the front of the hip, often tight from prolonged sitting." },
  { id: "ex-58", title: "Deep Squat Mobility", bodyPart: "Hip", clinicalArea: "lower_limb", tags: ["hip", "mobility", "return-to-function"], condition: "Hip osteoarthritis", stage: "Return to function", description: "A supported deep squat hold to maintain functional hip and knee range for daily activities like gardening." },
  {
    id: "ex-59",
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
  { id: "ex-65", title: "Wall Squat Hold", bodyPart: "Knee", clinicalArea: "lower_limb", tags: ["knee", "isometric", "early-rehab"], condition: "Patellar tendinopathy (flare-up)", stage: "Early rehab", description: "An isometric squat against a wall, held steady — a low-irritability way to load a painful tendon early on." },
  { id: "ex-66", title: "Split Squat", bodyPart: "Knee", clinicalArea: "lower_limb", tags: ["knee", "functional", "return-to-function"], condition: "ACL rehabilitation", stage: "Return to function", description: "A staggered-stance squat building single-leg strength and control, a key step before returning to sport." },
  { id: "ex-67", title: "Lateral Band Walk", bodyPart: "Hip", clinicalArea: "lower_limb", tags: ["hip", "glute-strength", "return-to-function"], condition: "Patellofemoral pain", stage: "Return to function", description: "Sidestepping against band resistance around the knees, building hip strength that controls knee alignment." },
  { id: "ex-68", title: "Nordic Hamstring Curl (Assisted)", bodyPart: "Hamstring", clinicalArea: "lower_limb", tags: ["hamstring", "eccentric-strength", "return-to-function"], condition: "Hamstring strain", stage: "Return to function", description: "A kneeling, partner- or strap-assisted eccentric hamstring lowering exercise, shown to reduce re-injury risk." },
  { id: "ex-69", title: "Standing Hamstring Stretch", bodyPart: "Hamstring", clinicalArea: "lower_limb", tags: ["hamstring", "flexibility", "mobility"], condition: "Hamstring tightness", stage: "Mobility phase", description: "Hinging forward with a straight leg on a raised support to gently lengthen a tight hamstring." },
  { id: "ex-70", title: "Box Step-Down", bodyPart: "Knee", clinicalArea: "lower_limb", tags: ["knee", "control", "strength-phase"], condition: "Patellofemoral pain", stage: "Strength phase", description: "A slow, controlled step down from a low box, building eccentric quad control that protects the kneecap joint." },
  { id: "ex-71", title: "Static Standing Balance (Eyes Open)", bodyPart: "Balance", clinicalArea: "balance_walking", tags: ["falls-prevention", "static-balance", "early-rehab"], condition: "Falls prevention", stage: "Early rehab", description: "Standing unsupported with feet together, building basic standing balance confidence near a stable surface." },
  { id: "ex-72", title: "Static Standing Balance (Eyes Closed)", bodyPart: "Balance", clinicalArea: "balance_walking", tags: ["falls-prevention", "static-balance", "mobility"], condition: "Falls prevention", stage: "Mobility phase", description: "The same stance with eyes closed, removing visual input to challenge balance systems further, near support." },
  { id: "ex-73", title: "Weight Shifting", bodyPart: "Balance", clinicalArea: "balance_walking", tags: ["falls-prevention", "weight-transfer", "early-rehab"], condition: "Post-stroke balance impairment", stage: "Early rehab", description: "Slowly shifting body weight side to side and forward-back to rebuild confidence loading each leg evenly." },
  { id: "ex-74", title: "Sideways Walking", bodyPart: "Balance", clinicalArea: "balance_walking", tags: ["gait", "hip-strength", "mobility"], condition: "Gait instability", stage: "Mobility phase", description: "Stepping sideways in a controlled line, building hip strength and lateral stability important for uneven ground." },
  { id: "ex-75", title: "Heel-to-Toe Walking (Tandem Gait)", bodyPart: "Balance", clinicalArea: "balance_walking", tags: ["gait", "dynamic-balance", "strength-phase"], condition: "Falls prevention", stage: "Strength phase", description: "Walking in a straight line placing heel directly in front of toe, sharpening dynamic balance and coordination." },
  { id: "ex-76", title: "Marching on the Spot", bodyPart: "Balance", clinicalArea: "balance_walking", tags: ["gait", "hip-flexor", "early-rehab"], condition: "General deconditioning", stage: "Early rehab", description: "Lifting alternate knees while standing near support, building hip flexor strength and single-leg confidence." },
  { id: "ex-77", title: "Backward Walking", bodyPart: "Balance", clinicalArea: "balance_walking", tags: ["gait", "dynamic-balance", "return-to-function"], condition: "Gait re-training", stage: "Return to function", description: "Walking backward a short, safe distance, challenging balance and proprioception differently to forward gait." },
  { id: "ex-78", title: "Sit-to-Stand Repetitions", bodyPart: "Balance", clinicalArea: "balance_walking", tags: ["falls-prevention", "functional", "strength-phase"], condition: "Falls prevention", stage: "Strength phase", description: "Repeated rising from a chair without hands, one of the strongest evidence-based exercises for reducing fall risk." },
  { id: "ex-79", title: "Obstacle Stepping", bodyPart: "Balance", clinicalArea: "balance_walking", tags: ["gait", "dynamic-balance", "return-to-function"], condition: "Falls prevention", stage: "Return to function", description: "Stepping over low objects placed on the floor, practising the foot clearance needed to avoid trips." },
  { id: "ex-80", title: "Stair Negotiation Practice", bodyPart: "Balance", clinicalArea: "balance_walking", tags: ["gait", "functional", "return-to-function"], condition: "Post-surgical mobility", stage: "Return to function", description: "Practising stepping up and down stairs with a rail, rebuilding the confidence and strength for real stairs at home." },
  { id: "ex-81", title: "Single Leg Stance with Arm Reach", bodyPart: "Balance", clinicalArea: "balance_walking", tags: ["dynamic-balance", "sport", "return-to-function"], condition: "Return to sport balance training", stage: "Return to function", description: "Standing on one leg while reaching in different directions, advanced balance work for returning to sport." },
  { id: "ex-82", title: "Treadmill or Level Ground Gait Practice", bodyPart: "Balance", clinicalArea: "balance_walking", tags: ["gait", "endurance", "mobility"], condition: "Reduced walking tolerance", stage: "Mobility phase", description: "Timed walking practice at a comfortable pace, gradually building walking distance and confidence." },
  { id: "ex-83", title: "Standing on One Leg (Hand Support)", bodyPart: "Balance", clinicalArea: "balance_walking", tags: ["falls-prevention", "static-balance", "early-rehab"], condition: "Falls prevention", stage: "Early rehab", description: "Lifting one foot slightly off the floor with a hand resting on a worktop, an accessible starting balance challenge." },
  { id: "ex-84", title: "Turning Practice", bodyPart: "Balance", clinicalArea: "balance_walking", tags: ["gait", "falls-prevention", "mobility"], condition: "Falls prevention", stage: "Mobility phase", description: "Practising controlled 180-degree turns while walking, a common moment of instability and fall risk." },
  { id: "ex-85", title: "Dual-Task Walking", bodyPart: "Balance", clinicalArea: "balance_walking", tags: ["gait", "cognitive-motor", "return-to-function"], condition: "Falls prevention (cognitive-motor)", stage: "Return to function", description: "Walking while carrying out a simple mental task (like counting backward), practising real-world walking demands." },
  { id: "ex-86", title: "Uneven Surface Walking", bodyPart: "Balance", clinicalArea: "balance_walking", tags: ["gait", "proprioception", "return-to-function"], condition: "Return to outdoor mobility", stage: "Return to function", description: "Supervised walking on grass or a slightly uneven surface, rebuilding confidence for real-world terrain." },
  { id: "ex-87", title: "Bed Mobility Rolling", bodyPart: "Neuro", clinicalArea: "neuro", tags: ["stroke", "functional", "early-rehab"], condition: "Post-stroke rehabilitation", stage: "Early rehab", description: "Practising rolling side to side in bed with guided cues, rebuilding basic functional movement after neurological injury." },
  { id: "ex-88", title: "Bridging for Transfers", bodyPart: "Neuro", clinicalArea: "neuro", tags: ["stroke", "functional", "early-rehab"], condition: "Post-stroke rehabilitation", stage: "Early rehab", description: "Lifting the hips off the bed to assist with repositioning and transfers, an early building block for independence." },
  { id: "ex-89", title: "Sit-to-Stand with Support", bodyPart: "Neuro", clinicalArea: "neuro", tags: ["stroke", "parkinsons", "functional", "early-rehab"], condition: "Neurological mobility impairment", stage: "Early rehab", description: "Rising from a chair using armrests as needed, a foundational functional movement retrained after neurological injury." },
  { id: "ex-90", title: "Weight-Bearing Through Affected Leg", bodyPart: "Neuro", clinicalArea: "neuro", tags: ["stroke", "hemiplegia", "mobility"], condition: "Post-stroke hemiplegia", stage: "Mobility phase", description: "Standing with weight guided onto the affected side to rebuild sensation, strength and confidence on that leg." },
  { id: "ex-91", title: "Reaching Tasks (Affected Arm)", bodyPart: "Neuro", clinicalArea: "neuro", tags: ["stroke", "hemiplegia", "upper-limb", "mobility"], condition: "Post-stroke arm weakness", stage: "Mobility phase", description: "Guided reaching for objects using the affected arm, encouraging use and retraining coordinated movement." },
  { id: "ex-92", title: "Parkinson's Big Movements (LSVT-style)", bodyPart: "Neuro", clinicalArea: "neuro", tags: ["parkinsons", "amplitude-training", "strength-phase"], condition: "Parkinson's disease", stage: "Strength phase", description: "Exaggerated, large-amplitude arm and leg movements, based on LSVT BIG principles to counter the small movements typical of Parkinson's." },
  { id: "ex-93", title: "Rhythmic Stepping to a Beat", bodyPart: "Neuro", clinicalArea: "neuro", tags: ["parkinsons", "gait", "return-to-function"], condition: "Parkinson's disease (freezing of gait)", stage: "Return to function", description: "Stepping in place to an external rhythm or count, a cueing strategy that helps reduce freezing episodes." },
  { id: "ex-94", title: "Multiple Sclerosis Fatigue-Paced Circuit", bodyPart: "Neuro", clinicalArea: "neuro", tags: ["multiple-sclerosis", "pacing", "mobility"], condition: "Multiple sclerosis", stage: "Mobility phase", description: "A short, energy-conserving set of gentle movements with rest breaks, following pacing principles for fatigue management." },
  { id: "ex-95", title: "Coordination Drills (Finger to Nose)", bodyPart: "Neuro", clinicalArea: "neuro", tags: ["ataxia", "coordination", "early-rehab"], condition: "Cerebellar ataxia", stage: "Early rehab", description: "Slowly touching the finger to the nose and back, a classic coordination exercise for cerebellar conditions." },
  { id: "ex-96", title: "Heel-Shin Slide (Coordination)", bodyPart: "Neuro", clinicalArea: "neuro", tags: ["ataxia", "coordination", "early-rehab"], condition: "Cerebellar ataxia", stage: "Early rehab", description: "Sliding the heel smoothly down the opposite shin, training coordinated, controlled limb movement." },
  { id: "ex-97", title: "Standing Balance with Visual Feedback", bodyPart: "Neuro", clinicalArea: "neuro", tags: ["stroke", "balance", "mobility"], condition: "Post-stroke balance impairment", stage: "Mobility phase", description: "Standing in front of a mirror to visually correct posture and weight distribution after neurological injury." },
  { id: "ex-98", title: "Functional Grasp and Release", bodyPart: "Neuro", clinicalArea: "neuro", tags: ["stroke", "hand-function", "return-to-function"], condition: "Post-stroke hand weakness", stage: "Return to function", description: "Practising picking up and releasing everyday objects, rebuilding fine motor hand function for daily tasks." },
  { id: "ex-99", title: "Gait Re-Education with Cueing", bodyPart: "Neuro", clinicalArea: "neuro", tags: ["stroke", "parkinsons", "gait", "return-to-function"], condition: "Neurological gait impairment", stage: "Return to function", description: "Walking practice with verbal or visual cues to correct step length and foot clearance affected by neurological injury." },
  { id: "ex-100", title: "Trunk Rotation in Sitting", bodyPart: "Neuro", clinicalArea: "neuro", tags: ["stroke", "core-control", "early-rehab"], condition: "Post-stroke trunk control", stage: "Early rehab", description: "Rotating the upper body side to side while seated, rebuilding trunk control that underpins balance and reaching." },
  { id: "ex-101", title: "Standing Frame or Supported Standing", bodyPart: "Neuro", clinicalArea: "neuro", tags: ["spinal-cord-injury", "standing-tolerance", "early-rehab"], condition: "Spinal cord injury", stage: "Early rehab", description: "Supported standing for a set duration to maintain bone density, circulation and standing tolerance." },
  { id: "ex-102", title: "Dual-Task Cognitive-Motor Training", bodyPart: "Neuro", clinicalArea: "neuro", tags: ["stroke", "cognitive-motor", "return-to-function"], condition: "Post-stroke cognitive-motor impairment", stage: "Return to function", description: "Combining a simple physical task with a cognitive task (like naming items), rebuilding real-world dual-tasking ability." },
  { id: "ex-103", title: "Ankle Pumps (Post-Surgery)", bodyPart: "Post-op", clinicalArea: "post_op", tags: ["post-op", "dvt-prevention", "early-rehab"], condition: "General post-surgical recovery", stage: "Early rehab", description: "Regular ankle pumping in bed to promote circulation and reduce clot risk in the first days after surgery." },
  { id: "ex-104", title: "Quad Sets", bodyPart: "Post-op", clinicalArea: "post_op", tags: ["knee-replacement", "quad-activation", "early-rehab"], condition: "Post knee replacement", stage: "Early rehab", description: "Gently tightening the thigh muscle without bending the knee, reactivating the quadriceps in the earliest days after surgery." },
  { id: "ex-105", title: "Assisted Knee Flexion", bodyPart: "Post-op", clinicalArea: "post_op", tags: ["knee-replacement", "range-of-motion", "early-rehab"], condition: "Post knee replacement", stage: "Early rehab", description: "Using the other leg or a strap to gently assist bending the operated knee, restoring range before stiffness sets in." },
  { id: "ex-106", title: "Hip Abduction in Lying (Post-Op)", bodyPart: "Post-op", clinicalArea: "post_op", tags: ["hip-replacement", "precautions", "early-rehab"], condition: "Post hip replacement", stage: "Early rehab", description: "Sliding the operated leg out to the side within precautions, maintaining hip strength while respecting surgical guidelines." },
  { id: "ex-107", title: "Supported Standing (Post-Hip)", bodyPart: "Post-op", clinicalArea: "post_op", tags: ["hip-replacement", "functional", "early-rehab"], condition: "Post hip replacement", stage: "Early rehab", description: "Standing with a frame or rail soon after surgery, the first step toward safe, independent walking again." },
  { id: "ex-108", title: "Shoulder Pendulum (Post-Rotator Cuff)", bodyPart: "Post-op", clinicalArea: "post_op", tags: ["rotator-cuff-repair", "early-rehab"], condition: "Post rotator cuff repair", stage: "Early rehab", description: "A relaxed pendulum swing while the repair heals, moving the shoulder passively without active muscle effort." },
  { id: "ex-109", title: "Passive Shoulder Flexion (Assisted)", bodyPart: "Post-op", clinicalArea: "post_op", tags: ["rotator-cuff-repair", "range-of-motion", "early-rehab"], condition: "Post rotator cuff repair", stage: "Early rehab", description: "Using the unaffected arm or a pulley to lift the healing arm overhead without the repaired muscle working." },
  { id: "ex-110", title: "Incision Site Scar Mobilisation", bodyPart: "Post-op", clinicalArea: "post_op", tags: ["scar-management", "mobility"], condition: "Post-surgical scar tightness", stage: "Mobility phase", description: "Gentle circular massage around a healed incision to reduce adhesions and improve tissue mobility." },
  { id: "ex-111", title: "Graduated Weight-Bearing", bodyPart: "Post-op", clinicalArea: "post_op", tags: ["fracture-repair", "functional", "mobility"], condition: "Post-fracture fixation", stage: "Mobility phase", description: "Progressively increasing how much body weight is taken through the healing limb, following the surgeon's protocol." },
  { id: "ex-112", title: "Core Bracing (Post-Abdominal Surgery)", bodyPart: "Post-op", clinicalArea: "post_op", tags: ["abdominal-surgery", "core-control", "early-rehab"], condition: "Post-abdominal surgery", stage: "Early rehab", description: "A gentle core engagement technique to support the healing abdominal wall during coughing, moving or lifting." },
  { id: "ex-113", title: "Post-Op Walking Programme", bodyPart: "Post-op", clinicalArea: "post_op", tags: ["functional", "mobility"], condition: "General post-surgical recovery", stage: "Mobility phase", description: "A structured, gradually increasing daily walking distance to rebuild general fitness after time spent recovering." },
  { id: "ex-114", title: "Resisted Knee Extension (Post-ACL)", bodyPart: "Post-op", clinicalArea: "post_op", tags: ["acl-reconstruction", "strength-phase"], condition: "Post-ACL reconstruction", stage: "Strength phase", description: "Light resisted knee straightening within the surgeon's protocol, rebuilding quadriceps strength after graft healing time." },
  { id: "ex-115", title: "Proprioception Board (Post-Ankle Surgery)", bodyPart: "Post-op", clinicalArea: "post_op", tags: ["ankle-surgery", "proprioception", "return-to-function"], condition: "Post-ankle surgery", stage: "Return to function", description: "Balancing on a wobble board once weight-bearing is cleared, restoring the joint position sense lost after surgery." },
  { id: "ex-116", title: "Return-to-Function Strength Circuit", bodyPart: "Post-op", clinicalArea: "post_op", tags: ["functional", "return-to-function"], condition: "Late-stage post-surgical rehabilitation", stage: "Return to function", description: "A combined circuit of functional strength movements marking the transition back to normal activity levels." },
  { id: "ex-117", title: "Breathing Exercises (Post-Thoracic Surgery)", bodyPart: "Post-op", clinicalArea: "post_op", tags: ["thoracic-surgery", "respiratory", "early-rehab"], condition: "Post-thoracic or cardiac surgery", stage: "Early rehab", description: "Deep breathing and supported coughing technique to clear the chest and reduce post-surgical respiratory complications." },
  { id: "ex-118", title: "Graduated Return to Driving Readiness", bodyPart: "Post-op", clinicalArea: "post_op", tags: ["functional", "return-to-function"], condition: "Post-surgical driving readiness", stage: "Return to function", description: "Practising an emergency-stop foot movement and seated reach tasks to check readiness to safely resume driving." },
  { id: "ex-119", title: "Pelvic Floor Activation (Basic)", bodyPart: "Pelvic health", clinicalArea: "pelvic_health", tags: ["pelvic-floor", "incontinence", "early-rehab"], condition: "Stress urinary incontinence", stage: "Early rehab", description: "A gentle 'lift and squeeze' pelvic floor contraction, the foundation exercise for pelvic floor rehabilitation." },
  { id: "ex-120", title: "Pelvic Floor Endurance Hold", bodyPart: "Pelvic health", clinicalArea: "pelvic_health", tags: ["pelvic-floor", "incontinence", "strength-phase"], condition: "Stress urinary incontinence", stage: "Strength phase", description: "Holding a pelvic floor contraction for progressively longer counts, building the endurance needed for daily continence." },
  { id: "ex-121", title: "Fast-Twitch Pelvic Floor 'The Knack'", bodyPart: "Pelvic health", clinicalArea: "pelvic_health", tags: ["pelvic-floor", "incontinence", "strength-phase"], condition: "Stress urinary incontinence (cough/sneeze leakage)", stage: "Strength phase", description: "A quick pre-emptive pelvic floor squeeze timed just before a cough or sneeze, a technique proven to reduce leakage." },
  { id: "ex-122", title: "Deep Core and Pelvic Floor Co-Activation", bodyPart: "Pelvic health", clinicalArea: "pelvic_health", tags: ["pelvic-floor", "core-control", "postnatal", "strength-phase"], condition: "Postnatal core recovery", stage: "Strength phase", description: "Gently drawing in the lower abdomen together with the pelvic floor, rebuilding coordinated deep core support." },
  { id: "ex-123", title: "Diastasis-Safe Curl-Up", bodyPart: "Pelvic health", clinicalArea: "pelvic_health", tags: ["diastasis-recti", "postnatal", "core-control", "mobility"], condition: "Diastasis recti (postnatal)", stage: "Mobility phase", description: "A modified, supported abdominal curl that avoids doming through the midline while abdominal separation heals." },
  { id: "ex-124", title: "Pelvic Floor Relaxation / Drop", bodyPart: "Pelvic health", clinicalArea: "pelvic_health", tags: ["pelvic-floor", "pelvic-pain", "early-rehab"], condition: "Pelvic pain / overactive pelvic floor", stage: "Early rehab", description: "Consciously lengthening and releasing the pelvic floor with breathing, important where the pelvic floor is overactive rather than weak." },
  { id: "ex-125", title: "Diaphragmatic Breathing for Pelvic Floor", bodyPart: "Pelvic health", clinicalArea: "pelvic_health", tags: ["pelvic-floor", "breathing", "early-rehab"], condition: "Pelvic pain / pelvic floor dysfunction", stage: "Early rehab", description: "Slow belly breathing that gently moves the pelvic floor with the diaphragm, foundational for pelvic floor retraining." },
  { id: "ex-126", title: "Bridge with Pelvic Floor Engagement", bodyPart: "Pelvic health", clinicalArea: "pelvic_health", tags: ["pelvic-floor", "glute-strength", "strength-phase"], condition: "Postnatal core and pelvic recovery", stage: "Strength phase", description: "A hip bridge combined with a light pelvic floor lift, integrating pelvic floor control into a functional strength movement." },
  { id: "ex-127", title: "Squat with Pelvic Floor Control", bodyPart: "Pelvic health", clinicalArea: "pelvic_health", tags: ["pelvic-floor", "functional", "return-to-function"], condition: "Pelvic organ prolapse", stage: "Return to function", description: "A controlled squat coordinating a pelvic floor lift on the effort phase, protecting pelvic support during functional lifting." },
  { id: "ex-128", title: "Standing Pelvic Tilt (Pregnancy)", bodyPart: "Pelvic health", clinicalArea: "pelvic_health", tags: ["pregnancy", "pelvic-girdle-pain", "early-rehab"], condition: "Pregnancy-related pelvic girdle pain", stage: "Early rehab", description: "A standing pelvic tilt easing pelvic girdle discomfort, safe throughout pregnancy when guided appropriately." },
  { id: "ex-129", title: "Side-Lying Hip Abduction (Pregnancy-Safe)", bodyPart: "Pelvic health", clinicalArea: "pelvic_health", tags: ["pregnancy", "pelvic-girdle-pain", "strength-phase"], condition: "Pregnancy-related pelvic girdle pain", stage: "Strength phase", description: "A gentle side-lying hip strengthener that avoids provocative positions for pelvic girdle pain during pregnancy." },
  { id: "ex-130", title: "Return-to-Running Pelvic Floor Check", bodyPart: "Pelvic health", clinicalArea: "pelvic_health", tags: ["pelvic-floor", "postnatal", "return-to-function"], condition: "Postnatal return to running", stage: "Return to function", description: "A staged hopping and jogging-on-the-spot check to confirm pelvic floor control before returning to running." },
  { id: "ex-131", title: "Bowel Emptying Positioning", bodyPart: "Pelvic health", clinicalArea: "pelvic_health", tags: ["pelvic-floor", "bowel-function", "early-rehab"], condition: "Constipation / straining", stage: "Early rehab", description: "Using a footstool and forward-lean position on the toilet to align the pelvic floor for easier, less straining bowel emptying." },
  { id: "ex-132", title: "Reverse Kegel (Pelvic Floor Lengthening)", bodyPart: "Pelvic health", clinicalArea: "pelvic_health", tags: ["pelvic-floor", "pelvic-pain", "mobility"], condition: "Overactive pelvic floor / painful intercourse", stage: "Mobility phase", description: "Gently bulging/lengthening the pelvic floor on the out-breath, retraining relaxation where over-tension is the main issue." },
  { id: "ex-133", title: "Animal Walk Circuit", bodyPart: "Paediatric", clinicalArea: "paediatric", tags: ["paediatric", "gross-motor", "early-rehab"], condition: "Developmental coordination disorder", stage: "Early rehab", description: "Bear crawls and crab walks turned into a fun circuit, building gross motor coordination through play." },
  { id: "ex-134", title: "Balance Beam Walk (Tape Line)", bodyPart: "Paediatric", clinicalArea: "paediatric", tags: ["paediatric", "balance", "mobility"], condition: "Balance and coordination difficulties", stage: "Mobility phase", description: "Walking along a taped line on the floor, a playful way to build the same balance skills as formal tandem walking." },
  { id: "ex-135", title: "Ball Catch and Throw", bodyPart: "Paediatric", clinicalArea: "paediatric", tags: ["paediatric", "coordination", "strength-phase"], condition: "Hand-eye coordination difficulties", stage: "Strength phase", description: "Simple catching and throwing games building hand-eye coordination and upper-limb control through play." },
  { id: "ex-136", title: "Obstacle Course Crawl-Through", bodyPart: "Paediatric", clinicalArea: "paediatric", tags: ["paediatric", "gross-motor", "return-to-function"], condition: "Developmental coordination disorder", stage: "Return to function", description: "A fun crawl-through-and-around obstacle course integrating multiple motor skills for real-world play readiness." },
  { id: "ex-137", title: "Toe Walking / Heel Walking Game", bodyPart: "Paediatric", clinicalArea: "paediatric", tags: ["paediatric", "ankle", "gait", "early-rehab"], condition: "Idiopathic toe walking", stage: "Early rehab", description: "A game encouraging alternating heel and toe walking to build ankle range and normal walking pattern awareness." },
  { id: "ex-138", title: "Trampette Bouncing (Supervised)", bodyPart: "Paediatric", clinicalArea: "paediatric", tags: ["paediatric", "balance", "strength-phase"], condition: "Low muscle tone", stage: "Strength phase", description: "Supervised gentle bouncing on a small trampette, building leg strength and balance reactions enjoyably." },
  { id: "ex-139", title: "Prone Extension Play ('Superman')", bodyPart: "Paediatric", clinicalArea: "paediatric", tags: ["paediatric", "core-control", "early-rehab"], condition: "Low muscle tone", stage: "Early rehab", description: "Lying on the tummy lifting arms and legs like flying, building core and back strength through imaginative play." },
  { id: "ex-140", title: "Scooter Board Propulsion", bodyPart: "Paediatric", clinicalArea: "paediatric", tags: ["paediatric", "upper-limb", "core-control", "strength-phase"], condition: "Developmental coordination disorder", stage: "Strength phase", description: "Lying on a scooter board and pulling along with the arms, building upper-body and core strength playfully." },
  { id: "ex-141", title: "Single-Leg Hop Game", bodyPart: "Paediatric", clinicalArea: "paediatric", tags: ["paediatric", "balance", "return-to-function"], condition: "Return to playground activity post-injury", stage: "Return to function", description: "Hopping games on painted spots or hopscotch, rebuilding single-leg power and confidence for playground return." },
  { id: "ex-142", title: "Sensory-Motor Circuit (Multi-Station)", bodyPart: "Paediatric", clinicalArea: "paediatric", tags: ["paediatric", "sensory-integration", "return-to-function"], condition: "Sensory processing difficulties", stage: "Return to function", description: "A short multi-station circuit combining movement and sensory input, tailored to the child's specific needs." },
  { id: "ex-143", title: "General Mobility Warm-Up", bodyPart: "General", clinicalArea: "general", tags: ["general", "warm-up", "early-rehab"], condition: "General deconditioning", stage: "Early rehab", description: "A gentle full-body joint mobility sequence, a safe starting point before any specific condition is confirmed." },
  { id: "ex-144", title: "Graded Walking Programme", bodyPart: "General", clinicalArea: "general", tags: ["general", "cardio", "mobility"], condition: "General deconditioning", stage: "Mobility phase", description: "A gradually increasing daily walking target to rebuild general fitness and activity tolerance." },
  { id: "ex-145", title: "Full-Body Stretch Routine", bodyPart: "General", clinicalArea: "general", tags: ["general", "flexibility", "mobility"], condition: "General stiffness", stage: "Mobility phase", description: "A short sequence of major-muscle-group stretches suitable while a specific diagnosis is still being clarified." },
  { id: "ex-146", title: "Basic Bodyweight Circuit", bodyPart: "General", clinicalArea: "general", tags: ["general", "strength-phase"], condition: "General deconditioning", stage: "Strength phase", description: "Sit-to-stands, wall push-ups and marching on the spot combined into a simple, equipment-free strength circuit." },
  { id: "ex-147", title: "Pain Pacing Activity Plan", bodyPart: "General", clinicalArea: "general", tags: ["general", "pacing", "chronic-pain", "early-rehab"], condition: "Persistent/chronic pain", stage: "Early rehab", description: "A structured activity-and-rest pacing plan, breaking tasks into manageable chunks to avoid boom-bust pain flares." },
  { id: "ex-148", title: "Graded Exposure to Feared Movement", bodyPart: "General", clinicalArea: "general", tags: ["general", "graded-exposure", "chronic-pain", "return-to-function"], condition: "Persistent/chronic pain (fear-avoidance)", stage: "Return to function", description: "Gradually reintroducing a movement the patient has been avoiding, in small confidence-building steps, per graded exposure principles." },
  { id: "ex-149", title: "Return-to-Sport Readiness Circuit", bodyPart: "General", clinicalArea: "general", tags: ["general", "sport", "return-to-function"], condition: "Return to sport (general)", stage: "Return to function", description: "A combined strength, balance and agility circuit used as a final check before clearing return to a chosen sport." },
  { id: "ex-150", title: "Relaxation and Breathing for Pain Management", bodyPart: "General", clinicalArea: "general", tags: ["general", "breathing", "chronic-pain", "early-rehab"], condition: "Persistent/chronic pain", stage: "Early rehab", description: "Slow diaphragmatic breathing and progressive muscle relaxation, supporting the nervous-system side of pain management." }
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

export function formatDosage(d: ExerciseDosage): string {
  let core: string | null = null;
  if (d.holdSeconds != null) {
    core = d.sets != null ? `Hold ${d.holdSeconds}s × ${d.sets}` : `Hold ${d.holdSeconds}s`;
  } else if (d.reps != null) {
    core = d.sets != null ? `${d.sets} sets × ${d.reps} reps` : `${d.reps} reps`;
  } else if (d.sets != null) {
    core = `${d.sets} sets`;
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
  return d.sets != null || d.reps != null || d.holdSeconds != null;
}

const CAPS: { key: keyof ExerciseDosage; max: number; label: string }[] = [
  { key: "sets", max: 10, label: "Sets" },
  { key: "reps", max: 100, label: "Reps" },
  { key: "holdSeconds", max: 600, label: "Hold" },
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
