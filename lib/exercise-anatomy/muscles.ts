// lib/exercise-anatomy/muscles.ts
// Muscle dictionary for the exercise pages: plain-English names plus the model
// part names each one lights up (base = public/models/body-chart, addon =
// public/models/exercise-anatomy). tests/lib/exercise-anatomy/muscles.test.ts
// checks every pattern against the committed manifests, so a typo fails a test,
// not the page. Pure data with no exercise entries: safe for client bundles.

import type { MuscleGroup } from "@/lib/exercise-anatomy/types";

const MUSCLE_TABLE = {
  // Hip and thigh
  "gluteus-maximus": { label: "Gluteus maximus", plain: "your main buttock muscle", source: "base", parts: [/gluteus maximus/i], view: "back" },
  "gluteus-medius": { label: "Gluteus medius", plain: "side of your hip", source: "base", parts: [/gluteus medius/i], view: "right" },
  "gluteus-minimus": { label: "Gluteus minimus", plain: "deep side of your hip", source: "base", parts: [/gluteus minimus/i], view: "right" },
  "deep-hip-rotators": {
    label: "Deep hip rotators",
    plain: "deep muscles at the back of your hip, including piriformis",
    source: "base",
    parts: [/piriformis|gemellus|obturator (internus|externus)|quadratus femoris/i],
    view: "back",
  },
  iliopsoas: { label: "Iliopsoas", plain: "deep hip flexor at the front of your hip", source: "base", parts: [/psoas major|iliacus/i], view: "front" },
  quadriceps: { label: "Quadriceps", plain: "front of your thigh", source: "base", parts: [/rectus femoris|vastus (lateralis|medialis|intermedius)/i], view: "front" },
  "vastus-medialis": { label: "Vastus medialis", plain: "inner front of your thigh, just above the knee", source: "base", parts: [/vastus medialis/i], view: "front" },
  "rectus-femoris": { label: "Rectus femoris", plain: "the thigh muscle that also lifts your leg at the hip", source: "base", parts: [/rectus femoris/i], view: "front" },
  hamstrings: { label: "Hamstrings", plain: "back of your thigh", source: "base", parts: [/biceps femoris|semitendinosus|semimembranosus/i], view: "back" },
  adductors: { label: "Adductors", plain: "inner thigh", source: "base", parts: [/adductor (longus|brevis|magnus|minimus)|gracilis|pectineus/i], view: "front" },
  "tfl-it-band": { label: "Tensor fasciae latae and IT band", plain: "outside of your hip and thigh", source: "base", parts: [/tensor fasciae latae|iliotibial tract/i], view: "right" },
  patella: { label: "Kneecap (patella)", plain: "the bone at the front of your knee", source: "base", parts: [/patella/i], view: "front" },
  "patellar-tendon": {
    label: "Patellar tendon",
    plain: "the tendon just below your kneecap",
    source: "none",
    parts: [],
    standIn: { parts: [/patella/i], note: "The patellar tendon isn't in the 3D model, so the kneecap it attaches to is lit instead." },
    view: "front",
  },

  // Lower leg and foot
  gastrocnemius: { label: "Gastrocnemius", plain: "the big calf muscle", source: "base", parts: [/gastrocnemius/i], view: "back" },
  soleus: { label: "Soleus", plain: "deep calf muscle", source: "base", parts: [/soleus/i], view: "back" },
  "achilles-tendon": { label: "Achilles tendon", plain: "back of your ankle", source: "base", parts: [/calcaneal tendon/i], view: "back" },
  "tibialis-anterior": { label: "Tibialis anterior", plain: "front of your shin", source: "base", parts: [/tibialis anterior/i], view: "front" },
  "tibialis-posterior": { label: "Tibialis posterior", plain: "deep inside of your lower leg, supporting your arch", source: "base", parts: [/tibialis posterior/i], view: "back" },
  fibularis: { label: "Fibularis (peroneals)", plain: "outside of your lower leg and ankle", source: "base", parts: [/fibularis (longus|brevis)/i], view: "right" },
  "foot-intrinsics": {
    label: "Small foot muscles",
    plain: "the muscles in the sole of your foot",
    source: "base",
    parts: [
      /(lumbrical|plantar interosseous|abductor digiti minimi|flexor digiti minimi brevis|opponens digiti minimi) of (right|left) foot|abductor hallucis|flexor digitorum brevis|flexor hallucis brevis|flexor accessorius|adductor hallucis/i,
    ],
    view: "front",
  },
  "leg-bones": { label: "Leg bones", plain: "the long bones of your thighs and lower legs", source: "base", parts: [/^(right|left) (femur|tibia|fibula)$/i], view: "front" },

  // Shoulder and arm
  deltoid: { label: "Deltoid", plain: "the rounded muscle over your shoulder", source: "base", parts: [/deltoid/i], view: "right" },
  "front-deltoid": { label: "Front deltoid", plain: "front of your shoulder", source: "base", parts: [/clavicular part of (right|left) deltoid/i], view: "front" },
  "rear-deltoid": { label: "Rear deltoid", plain: "back of your shoulder", source: "base", parts: [/spinal part of (right|left) deltoid/i], view: "back" },
  "rotator-cuff": {
    label: "Rotator cuff",
    plain: "four small muscles that keep your shoulder joint centred",
    source: "base",
    parts: [/supraspinatus|infraspinatus|teres minor|subscapularis/i],
    view: "back",
  },
  supraspinatus: { label: "Supraspinatus", plain: "top of your shoulder blade", source: "base", parts: [/supraspinatus/i], view: "back" },
  infraspinatus: { label: "Infraspinatus", plain: "back of your shoulder blade", source: "base", parts: [/infraspinatus/i], view: "back" },
  "teres-minor": { label: "Teres minor", plain: "small muscle under the back of your shoulder", source: "base", parts: [/teres minor/i], view: "back" },
  subscapularis: { label: "Subscapularis", plain: "front of your shoulder blade, against your ribs", source: "base", parts: [/subscapularis/i], view: "front" },
  "teres-major": { label: "Teres major", plain: "lower edge of your shoulder blade", source: "base", parts: [/teres major/i], view: "back" },
  "latissimus-dorsi": {
    label: "Latissimus dorsi",
    plain: "the broad muscle across your back and side",
    source: "none",
    parts: [],
    standIn: {
      parts: [/teres major|serratus posterior inferior/i],
      note: "Latissimus dorsi isn't in the 3D model, so the muscles lying just under it are lit instead.",
    },
    view: "back",
  },
  "pectoralis-major": { label: "Pectoralis major", plain: "your chest muscle", source: "base", parts: [/pectoralis major/i], view: "front" },
  "pectoralis-minor": { label: "Pectoralis minor", plain: "small chest muscle under pectoralis major", source: "base", parts: [/pectoralis minor/i], view: "front" },
  "serratus-anterior": { label: "Serratus anterior", plain: "side of your ribs, holding your shoulder blade flat", source: "base", parts: [/serratus anterior/i], view: "right" },
  rhomboids: { label: "Rhomboids", plain: "between your shoulder blades", source: "base", parts: [/rhomboid (major|minor)/i], view: "back" },
  "upper-trapezius": { label: "Upper trapezius", plain: "top of your shoulders and neck", source: "base", parts: [/descending part of (right|left) trapezius/i], view: "back" },
  "middle-trapezius": { label: "Middle trapezius", plain: "across your upper back", source: "base", parts: [/transverse part of (right|left) trapezius/i], view: "back" },
  "lower-trapezius": { label: "Lower trapezius", plain: "middle of your back, below your shoulder blades", source: "base", parts: [/ascending part of (right|left) trapezius/i], view: "back" },
  "levator-scapulae": { label: "Levator scapulae", plain: "side and back of your neck", source: "base", parts: [/levator scapulae/i], view: "back" },
  "shoulder-joint": {
    label: "Shoulder joint",
    plain: "the ball and socket where your upper arm bone meets your shoulder blade",
    source: "none",
    parts: [],
    standIn: {
      parts: [/^(right|left) (humerus|scapula)$/i],
      note: "The shoulder joint itself isn't in the 3D model, so the upper arm bone and shoulder blade that form it are lit instead.",
    },
    view: "right",
  },
  "biceps-brachii": { label: "Biceps", plain: "front of your upper arm", source: "base", parts: [/biceps brachii/i], view: "front" },
  brachialis: { label: "Brachialis", plain: "deep front of your upper arm", source: "base", parts: [/\bbrachialis\b/i], view: "front" },
  brachioradialis: { label: "Brachioradialis", plain: "thumb side of your forearm, helping bend your elbow", source: "base", parts: [/brachioradialis/i], view: "front" },
  triceps: { label: "Triceps", plain: "back of your upper arm", source: "base", parts: [/triceps brachii|anconeus/i], view: "back" },
  "wrist-extensors": { label: "Wrist extensors", plain: "top of your forearm, bending your wrist back", source: "base", parts: [/extensor carpi (radialis longus|radialis brevis|ulnaris)/i], view: "back" },
  "finger-extensors": {
    label: "Finger and thumb extensors",
    plain: "top of your forearm and back of your hand, straightening your fingers and thumb",
    source: "base",
    parts: [/extensor digitorum$|extensor indicis|extensor digiti minimi|extensor pollicis (longus|brevis)|abductor pollicis longus/i],
    view: "back",
  },
  "wrist-flexors": { label: "Wrist flexors", plain: "inside of your forearm, bending your wrist towards your palm", source: "base", parts: [/flexor carpi (radialis|ulnaris)|palmaris longus/i], view: "front" },
  "finger-flexors": {
    label: "Finger flexors",
    plain: "inside of your forearm, bending your fingers",
    source: "base",
    parts: [/flexor digitorum (superficialis|profundus)|flexor pollicis longus/i],
    view: "front",
  },
  "forearm-rotators": {
    label: "Pronators and supinator",
    plain: "forearm muscles that turn your palm up and down",
    source: "base",
    parts: [/pronator (teres|quadratus)|supinator/i],
    view: "front",
  },
  "wrist-joint": {
    label: "Wrist joint",
    plain: "the small bones and joints of your wrist",
    source: "base",
    parts: [/^(right|left) (scaphoid|lunate|triquetral|pisiform|trapezium|trapezoid|capitate|hamate)$/i],
    view: "front",
  },
  "hand-intrinsics": {
    label: "Small hand muscles",
    plain: "the muscles in your palm and between your fingers",
    source: "base",
    parts: [
      /(lumbricals|interossei) of (right|left) hand|(abductor digiti minimi|flexor digiti minimi brevis|opponens digiti minimi) of (right|left) hand|abductor pollicis brevis|flexor pollicis brevis|opponens pollicis|adductor pollicis/i,
    ],
    view: "front",
  },

  // Nerves and brain (not in the model: stand-ins, or text only for the brain)
  "median-nerve": {
    label: "Median nerve",
    plain: "the nerve running down the inside of your arm to your hand",
    source: "none",
    parts: [],
    standIn: {
      parts: [/flexor digitorum superficialis|flexor carpi radialis|pronator teres|palmaris longus/i],
      note: "Nerves aren't in the 3D model. The median nerve runs between these forearm muscles, so they are lit instead.",
    },
    view: "front",
  },
  "sciatic-nerve": {
    label: "Sciatic nerve",
    plain: "the nerve running from your lower back down the back of your leg",
    source: "none",
    parts: [],
    standIn: {
      parts: [/piriformis|biceps femoris|semitendinosus|semimembranosus/i],
      note: "Nerves aren't in the 3D model. The sciatic nerve runs under piriformis and down between the hamstrings, so they are lit instead.",
    },
    view: "back",
  },
  "nervous-system": {
    label: "Nervous system",
    plain: "your brain and nerves, which can become more sensitive when pain lasts",
    source: "none",
    parts: [],
    view: "front",
  },
  brain: { label: "Brain", plain: "the parts of your brain that plan and control your movements", source: "none", parts: [], view: "front" },

  // Spine and trunk
  "erector-spinae": { label: "Erector spinae", plain: "the long muscles either side of your spine", source: "base", parts: [/iliocostalis|longissimus|\bspinalis\b/i], view: "back" },
  multifidus: {
    label: "Multifidus",
    plain: "small deep muscles that steady each joint of your lower back",
    source: "none",
    parts: [],
    standIn: {
      parts: [/lumbar rotator|interspinales lumborum|lumbar intertransversarius/i],
      note: "Multifidus isn't in the 3D model, so the small deep muscles beside it on your lower spine are lit instead.",
    },
    view: "back",
  },
  "quadratus-lumborum": {
    label: "Quadratus lumborum",
    plain: "deep muscle between your lowest rib and your pelvis",
    source: "none",
    parts: [],
    standIn: {
      parts: [/lateral lumbar intertransversarius|iliocostalis lumborum/i],
      note: "Quadratus lumborum isn't in the 3D model, so the deep muscles next to it are lit instead.",
    },
    view: "back",
  },
  "rectus-abdominis": {
    label: "Rectus abdominis",
    plain: "the long muscle down the front of your tummy",
    source: "none",
    parts: [],
    standIn: {
      parts: [/linea alba|external oblique/i],
      note: "Rectus abdominis isn't in the 3D model, so the tummy muscle beside it and the band down its middle are lit instead.",
    },
    view: "front",
  },
  "transversus-abdominis": {
    label: "Transversus abdominis",
    plain: "the deepest tummy muscle, wrapping round like a corset",
    source: "none",
    parts: [],
    standIn: {
      parts: [/linea alba|external oblique/i],
      note: "Transversus abdominis isn't in the 3D model, so the tummy muscles over it are lit instead.",
    },
    view: "front",
  },
  "external-oblique": { label: "External oblique", plain: "side of your tummy", source: "base", parts: [/external oblique/i], view: "right" },
  intercostals: { label: "Intercostals", plain: "small muscles between your ribs", source: "base", parts: [/external intercostal/i], view: "right" },
  diaphragm: { label: "Diaphragm", plain: "the dome-shaped breathing muscle under your ribs", source: "addon", parts: [/\bdiaphragm\b/i], view: "front" },
  "pelvic-floor": {
    label: "Pelvic floor muscles",
    plain: "the sling of muscles at the base of your pelvis",
    source: "addon",
    parts: [/coccygeus|puborectalis|anal sphincter|perineal/i],
    view: "front",
  },
  "lumbar-discs": {
    label: "Lower back discs",
    plain: "the cushions between the bones of your lower back",
    source: "addon",
    parts: [/intervertebral disk of (first|second|third|fourth|fifth) lumbar vertebra/i],
    view: "back",
  },
  "neck-discs": {
    label: "Neck discs",
    plain: "the cushions between the bones of your neck",
    source: "addon",
    parts: [/intervertebral disk of (axis|(third|fourth|fifth|sixth|seventh) cervical vertebra)/i],
    view: "back",
  },
  "lumbar-spine": { label: "Lower back joints", plain: "the bones and joints of your lower back", source: "base", parts: [/^(first|second|third|fourth|fifth) lumbar vertebra$|^sacrum$/i], view: "back" },
  "thoracic-spine": { label: "Mid-back joints", plain: "the bones and joints of your upper and mid back", source: "base", parts: [/thoracic vertebra$/i], view: "back" },
  "cervical-spine": { label: "Neck joints", plain: "the bones and joints of your neck", source: "base", parts: [/cervical vertebra$|^atlas$|^axis$/i], view: "back" },

  // Neck
  "deep-neck-flexors": {
    label: "Deep neck flexors",
    plain: "deep muscles at the front of your neck",
    source: "addon",
    parts: [/longus colli|longus capitis|rectus capitis (anterior|lateralis)/i],
    view: "right",
  },
  "neck-extensors": {
    label: "Neck extensors",
    plain: "the muscles at the back of your neck",
    source: "base",
    parts: [/semispinalis (capitis|cervicis)|splenius (capitis|cervicis)|longissimus capitis|rectus capitis posterior|obliquus capitis/i],
    view: "back",
  },
  sternocleidomastoid: { label: "Sternocleidomastoid", plain: "the muscle running down the side of your neck", source: "base", parts: [/sternocleidomastoid/i], view: "right" },
  scalenes: { label: "Scalenes", plain: "deep side of your neck", source: "base", parts: [/scalenus/i], view: "right" },

  // Face (no facial muscles in any model we use: text only)
  frontalis: { label: "Frontalis", plain: "the forehead muscle that raises your eyebrows", source: "none", parts: [], view: "front" },
  corrugator: { label: "Corrugator and procerus", plain: "the small muscles between your eyebrows that frown", source: "none", parts: [], view: "front" },
  "orbicularis-oculi": { label: "Orbicularis oculi", plain: "the ring of muscle around your eye", source: "none", parts: [], view: "front" },
  "levator-palpebrae": { label: "Levator palpebrae", plain: "the muscle that lifts your upper eyelid", source: "none", parts: [], view: "front" },
  zygomaticus: { label: "Zygomaticus major", plain: "the cheek muscle that lifts the corners of your mouth", source: "none", parts: [], view: "front" },
  risorius: { label: "Risorius", plain: "the muscle that pulls the corners of your mouth sideways", source: "none", parts: [], view: "front" },
  buccinator: { label: "Buccinator", plain: "the cheek muscle that holds air in your mouth", source: "none", parts: [], view: "front" },
  "orbicularis-oris": { label: "Orbicularis oris", plain: "the ring of muscle around your lips", source: "none", parts: [], view: "front" },

  // Skin and scars (not in any model: text only)
  "scar-tissue": { label: "Scar tissue", plain: "your healed scar and the skin around it", source: "none", parts: [], view: "front" },
} satisfies Record<string, MuscleGroup>;

export type MuscleKey = keyof typeof MUSCLE_TABLE;

/** Widened so every entry reads as a MuscleGroup (optional standIn included). */
export const MUSCLES: Readonly<Record<MuscleKey, MuscleGroup>> = MUSCLE_TABLE;
