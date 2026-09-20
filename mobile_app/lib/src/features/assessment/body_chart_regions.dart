/// Region key -> body-muscles asset ids that draw it, per view. Ported
/// verbatim from web's `REGION_MUSCLES` (`lib/body-chart.ts`). Muscle path
/// data itself lives in `assets/body_chart/muscle_paths.json`, extracted
/// from the `body-muscles` npm package (Apache-2.0, Copyright 2024 Ivan
/// Vulović) — see NOTICE in that package for attribution.
class RegionMuscles {
  final List<String> front;
  final List<String> back;
  const RegionMuscles({this.front = const [], this.back = const []});
}

const Map<String, RegionMuscles> regionMuscles = {
  'head-jaw': RegionMuscles(front: ['head', 'face'], back: ['head-back', 'nape']),
  'neck': RegionMuscles(front: ['neck-left', 'neck-right'], back: ['nape']),
  'upper-back': RegionMuscles(back: ['traps-upper-left', 'traps-upper-right', 'traps-mid-left', 'traps-mid-right']),
  'mid-back': RegionMuscles(
    back: [
      'lats-upper-left', 'lats-upper-right',
      'lats-mid-left', 'lats-mid-right',
      'lats-lower-left', 'lats-lower-right',
      'traps-lower-left', 'traps-lower-right',
    ],
  ),
  'lower-back': RegionMuscles(
    back: ['spine', 'lower-back-erectors-left', 'lower-back-erectors-right', 'lower-back-ql-left', 'lower-back-ql-right'],
  ),
  'chest': RegionMuscles(front: ['chest-upper-left', 'chest-upper-right', 'chest-lower-left', 'chest-lower-right']),
  'abdomen': RegionMuscles(
    front: [
      'abs-upper-left', 'abs-upper-right',
      'abs-lower-left', 'abs-lower-right',
      'serratus-anterior-left', 'serratus-anterior-right',
    ],
  ),
  'side-left': RegionMuscles(front: ['obliques-left']),
  'side-right': RegionMuscles(front: ['obliques-right']),

  'shoulder-left': RegionMuscles(front: ['shoulder-front-left', 'shoulder-side-left'], back: ['deltoid-rear-left']),
  'shoulder-right': RegionMuscles(front: ['shoulder-front-right', 'shoulder-side-right'], back: ['deltoid-rear-right']),
  'upper-arm-left': RegionMuscles(front: ['biceps-left'], back: ['triceps-long-left', 'triceps-lateral-left']),
  'upper-arm-right': RegionMuscles(front: ['biceps-right'], back: ['triceps-long-right', 'triceps-lateral-right']),
  'elbow-left': RegionMuscles(front: ['elbow-left']),
  'elbow-right': RegionMuscles(front: ['elbow-right']),
  'forearm-left': RegionMuscles(front: ['forearm-left'], back: ['forearm-flexors-left', 'forearm-extensors-left']),
  'forearm-right': RegionMuscles(front: ['forearm-right'], back: ['forearm-flexors-right', 'forearm-extensors-right']),
  'hand-left': RegionMuscles(front: ['hand-left'], back: ['hand-back-left']),
  'hand-right': RegionMuscles(front: ['hand-right'], back: ['hand-back-right']),

  'hip-left': RegionMuscles(front: ['hip-flexor-left', 'adductors-left'], back: ['gluteus-medius-left']),
  'hip-right': RegionMuscles(front: ['hip-flexor-right', 'adductors-right'], back: ['gluteus-medius-right']),
  'buttock-left': RegionMuscles(back: ['gluteus-maximus-left']),
  'buttock-right': RegionMuscles(back: ['gluteus-maximus-right']),
  'thigh-left': RegionMuscles(front: ['quads-left'], back: ['hamstrings-medial-left', 'hamstrings-lateral-left']),
  'thigh-right': RegionMuscles(front: ['quads-right'], back: ['hamstrings-medial-right', 'hamstrings-lateral-right']),
  'knee-left': RegionMuscles(front: ['knee-left'], back: ['knee-back-left']),
  'knee-right': RegionMuscles(front: ['knee-right'], back: ['knee-back-right']),
  'lower-leg-left': RegionMuscles(
    front: ['tibialis-anterior-left'],
    back: ['calves-gastroc-medial-left', 'calves-gastroc-lateral-left', 'calves-soleus-left'],
  ),
  'lower-leg-right': RegionMuscles(
    front: ['tibialis-anterior-right'],
    back: ['calves-gastroc-medial-right', 'calves-gastroc-lateral-right', 'calves-soleus-right'],
  ),
  'foot-left': RegionMuscles(front: ['foot-left'], back: ['foot-back-left']),
  'foot-right': RegionMuscles(front: ['foot-right'], back: ['foot-back-right']),
};

/// Clinical / anatomical names shown in the tap tooltip, ported from web's
/// `BODY_REGIONS[].clinical` (`lib/body-chart.ts`).
const Map<String, String> regionClinicalNames = {
  'head-jaw': 'Head / temporomandibular joint',
  'neck': 'Cervical spine',
  'upper-back': 'Trapezius / thoracic spine',
  'mid-back': 'Thoracic spine / latissimus dorsi',
  'lower-back': 'Lumbar spine / erector spinae',
  'chest': 'Pectorals / sternum / ribs',
  'abdomen': 'Abdominal wall',
  'side-left': 'Left obliques / ribs',
  'side-right': 'Right obliques / ribs',
  'shoulder-left': 'Left deltoid / rotator cuff',
  'shoulder-right': 'Right deltoid / rotator cuff',
  'upper-arm-left': 'Left biceps / triceps / humerus',
  'upper-arm-right': 'Right biceps / triceps / humerus',
  'elbow-left': 'Left elbow joint',
  'elbow-right': 'Right elbow joint',
  'forearm-left': 'Left radius / ulna / forearm muscles',
  'forearm-right': 'Right radius / ulna / forearm muscles',
  'hand-left': 'Left wrist / carpals / fingers',
  'hand-right': 'Right wrist / carpals / fingers',
  'hip-left': 'Left hip joint / adductors',
  'hip-right': 'Right hip joint / adductors',
  'buttock-left': 'Left gluteal muscles',
  'buttock-right': 'Right gluteal muscles',
  'thigh-left': 'Left quadriceps / hamstrings / femur',
  'thigh-right': 'Right quadriceps / hamstrings / femur',
  'knee-left': 'Left knee joint',
  'knee-right': 'Right knee joint',
  'lower-leg-left': 'Left tibia / calf muscles',
  'lower-leg-right': 'Right tibia / calf muscles',
  'foot-left': 'Left ankle / tarsals / toes',
  'foot-right': 'Right ankle / tarsals / toes',
};
