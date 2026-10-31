// lib/exercise-anatomy/entries/upper-limb.ts
// Draft anatomy for shoulder, wrist, elbow and hand exercises.
// Drafts show on dev only until Shivaliba approves them (status "approved").

import type { ExerciseAnatomy } from "@/lib/exercise-anatomy/types";

export const UPPER_LIMB: Record<string, ExerciseAnatomy> = {
  // Shoulder
  "scapular-setting": {
    main: ["lower-trapezius", "middle-trapezius"],
    helpers: ["rhomboids"],
    howItHelps:
      "Gently drawing your shoulder blades down and slightly together, with only a small effort, wakes up the muscles across your upper and middle back that steady them. A steadier shoulder blade gives your arm a firmer base, which can ease the strain on a sore shoulder when you reach, lift and carry.",
    tissue: "muscle-tendon",
    status: "draft",
  },
  "shoulder-flexion": {
    main: ["front-deltoid"],
    helpers: ["serratus-anterior", "rotator-cuff"],
    howItHelps:
      "Raising your arm forwards and up works the front of your shoulder, while the muscles around your shoulder blade and joint guide the movement. Gradually reaching a little higher, without forcing into pain, can make it easier to reach a shelf, brush your hair and get dressed.",
    tissue: "muscle-tendon",
    status: "draft",
  },
  "pendulum-swing": {
    main: ["shoulder-joint"],
    helpers: [],
    howItHelps:
      "Letting your arm hang and swing from a gentle rock of your body moves your shoulder joint while the muscles around it stay relaxed. Keeping the joint moving like this helps limit stiffness without asking the repaired tendon to work, which can make dressing and washing easier to get back to as you recover.",
    tissue: "post-surgery",
    status: "draft",
  },
  "shoulder-external-rotation-band": {
    main: ["infraspinatus", "teres-minor"],
    helpers: [],
    howItHelps:
      "Turning your forearm outwards against the band strengthens the rotator cuff muscles on the back of your shoulder blade, which turn your arm out and help keep the ball of your shoulder centred in its socket. Stronger cuff muscles and tendons can help your shoulder cope with reaching, lifting and overhead tasks.",
    tissue: "muscle-tendon",
    status: "draft",
  },
  "shoulder-internal-rotation-band": {
    main: ["subscapularis"],
    helpers: ["pectoralis-major"],
    howItHelps:
      "Turning your forearm inwards against the band strengthens the rotator cuff muscle on the front of your shoulder blade, with help from your chest muscle. Working it alongside the muscles that turn your arm out helps balance strength around the joint, which can make lifting, pushing and reaching behind your back feel steadier.",
    tissue: "muscle-tendon",
    status: "draft",
  },
  "wall-slide": {
    main: ["serratus-anterior", "lower-trapezius"],
    helpers: ["deltoid"],
    howItHelps:
      "Sliding your forearms up the wall works the muscles that turn your shoulder blades upwards and hold them against your ribs, helping your arms rise smoothly. Gently winning back this overhead range can make reaching into high cupboards, hanging out washing and doing your hair more comfortable.",
    tissue: "muscle-tendon",
    status: "draft",
  },
  "sleeper-stretch": {
    main: ["infraspinatus", "teres-minor"],
    helpers: [],
    howItHelps:
      "Gently pressing your forearm towards the floor stretches the muscles and tissues at the back of your shoulder, which can tighten up, especially if you throw or play overhead sports. Easing this tightness can help you get back the inward turn of your arm used for reaching behind your back, tucking in a shirt and throwing.",
    status: "draft",
  },
  "prone-y-t-w-raises": {
    main: ["lower-trapezius", "middle-trapezius", "rhomboids"],
    helpers: ["rear-deltoid", "infraspinatus", "teres-minor"],
    howItHelps:
      "Lifting your arms into Y, T and W shapes works the muscles across your upper and middle back that draw your shoulder blades down and together. Better control of your shoulder blades gives your arm a steadier base, which can help your shoulder move more smoothly when you reach overhead, lift and carry.",
    tissue: "muscle-tendon",
    status: "draft",
  },
  "scapular-retraction-band-row": {
    main: ["middle-trapezius", "rhomboids"],
    helpers: ["lower-trapezius", "rear-deltoid"],
    howItHelps:
      "Pulling your elbows back and drawing your shoulder blades together works the muscles between and just below your shoulder blades. Stronger upper-back muscles give your shoulder blades better control as your arms move, which can ease the strain on a sore shoulder and help with pulling tasks like opening heavy doors.",
    tissue: "muscle-tendon",
    status: "draft",
  },
  "overhead-press-progression": {
    main: ["deltoid"],
    helpers: ["triceps", "serratus-anterior", "rotator-cuff"],
    howItHelps:
      "Pressing light weights overhead strengthens your shoulder muscles and the back of your upper arms, while the muscles around your shoulder blade and joint help steady the movement. Building strength and confidence overhead can help you get back to lifting things onto high shelves, overhead work and sport.",
    tissue: "muscle-tendon",
    status: "draft",
  },
  "pendulum-with-light-weight": {
    main: ["shoulder-joint"],
    helpers: [],
    howItHelps:
      "Holding a light weight lets gravity gently draw your arm downwards as it swings, which can help ease a stiff, painful shoulder joint while the muscles around it stay relaxed. Keeping a frozen shoulder gently moving like this may help you keep the movement you need for dressing, washing and reaching.",
    tissue: "joint-ligament",
    status: "draft",
  },
  "cross-body-stretch": {
    main: ["rear-deltoid", "infraspinatus", "teres-minor"],
    helpers: [],
    howItHelps:
      "Drawing your arm across your chest stretches the muscles and tissues at the back of your shoulder, which often tighten after throwing or racquet sports. Easing this tightness can help your shoulder move more freely when you reach across your body, throw or swing a racquet.",
    status: "draft",
  },
  "push-up-plus-wall-or-floor": {
    main: ["serratus-anterior"],
    helpers: ["pectoralis-major", "triceps", "front-deltoid"],
    howItHelps:
      "The extra push at the top of each push-up works the muscle on the side of your ribs that holds your shoulder blade flat and moves it forwards, while the push-up itself works your chest and arms. Better shoulder blade control can help your shoulder cope with pushing, reaching and taking weight through your arms.",
    tissue: "muscle-tendon",
    status: "draft",
  },

  // Wrist
  "wrist-extensor-stretch": {
    main: ["wrist-extensors"],
    helpers: ["finger-extensors"],
    howItHelps:
      "With your elbow straight, bending your wrist down stretches the muscles along the top of your forearm, which attach at the outside of your elbow. Easing tightness here can make gripping, lifting and typing more comfortable while a sore tennis elbow settles.",
    tissue: "muscle-tendon",
    status: "draft",
  },
  "eccentric-wrist-extension": {
    main: ["wrist-extensors"],
    helpers: [],
    howItHelps:
      "Slowly lowering the weight works the muscles along the top of your forearm as they lengthen, loading the sore tendon at the outside of your elbow in a controlled way. Tendons tend to get stronger and less sensitive with steady loading like this, which can make gripping, lifting and carrying easier.",
    tissue: "muscle-tendon",
    status: "draft",
  },
  "wrist-flexor-stretch": {
    main: ["wrist-flexors"],
    helpers: ["finger-flexors"],
    howItHelps:
      "With your elbow straight, pulling your hand back stretches the muscles on the palm side of your forearm, which attach at the inside of your elbow. Easing tightness here can make gripping, lifting and carrying more comfortable while a sore golfer's elbow settles.",
    tissue: "muscle-tendon",
    status: "draft",
  },
  "median-nerve-glide": {
    main: ["median-nerve"],
    helpers: [],
    howItHelps:
      "Bending your wrist back as you tilt your head towards that arm, then reversing both, gently slides the median nerve along its path through your arm and wrist. Keeping the nerve moving freely may help settle tingling and discomfort, which can make gripping, writing and typing more comfortable.",
    tissue: "nerve-brain",
    status: "draft",
  },
  "weight-bearing-through-extended-wrist": {
    main: ["wrist-joint", "wrist-flexors"],
    helpers: ["finger-flexors"],
    howItHelps:
      "Leaning your weight through a flat hand gradually loads the bones and joints of your wrist as it bends back, and stretches the muscles on the palm side of your forearm. Building this tolerance step by step can help your wrist cope with pushing up from a chair, leaning on a worktop and getting up off the floor.",
    tissue: "joint-ligament",
    status: "draft",
  },
  "eccentric-wrist-flexion": {
    main: ["wrist-flexors"],
    helpers: ["finger-flexors"],
    howItHelps:
      "Slowly lowering the weight works the muscles on the palm side of your forearm as they lengthen, loading the sore tendon on the inside of your elbow in a controlled way. Tendons tend to get stronger and less sensitive with steady loading like this, which can make gripping, lifting and carrying easier.",
    tissue: "muscle-tendon",
    status: "draft",
  },
  "resisted-wrist-flexion": {
    main: ["wrist-flexors"],
    helpers: ["finger-flexors"],
    howItHelps:
      "Curling your wrist up against a light weight or band strengthens the muscles on the palm side of your forearm, both as you lift and as you lower. Stronger forearm muscles and tendons can help ease inner-elbow pain when you grip, and help you get back to lifting and carrying.",
    tissue: "muscle-tendon",
    status: "draft",
  },
  "forearm-pronation-supination": {
    main: ["forearm-rotators"],
    helpers: ["biceps-brachii", "wrist-extensors", "wrist-flexors"],
    howItHelps:
      "Turning your palm up and down against an off-centre weight strengthens the muscles that rotate your forearm, while the muscles around your wrist hold it steady. This builds strength for twisting tasks such as turning keys, opening jars and using door handles, which can be painful with a sore elbow.",
    tissue: "muscle-tendon",
    status: "draft",
  },
  "wrist-extension-isotonic": {
    main: ["wrist-extensors"],
    helpers: [],
    howItHelps:
      "Lifting and lowering a light weight with your wrist, as far as is comfortable each way, strengthens the muscles along the top of your forearm and their tendon at the outside of your elbow. Steadily building this strength can make gripping, lifting and racquet sports easier to get back to.",
    tissue: "muscle-tendon",
    status: "draft",
  },

  // Elbow
  "elbow-flexion-extension": {
    main: ["biceps-brachii", "brachialis"],
    helpers: ["brachioradialis", "triceps"],
    howItHelps:
      "Slowly bending and straightening your elbow works the muscles at the front of your upper arm, while the back of your arm eases into a stretch as you bend. Keeping the joint moving after a fracture helps limit stiffness, which can make eating, washing your face and reaching for things easier.",
    tissue: "joint-ligament",
    status: "draft",
  },
  "tyler-twist-flexbar": {
    main: ["wrist-extensors"],
    helpers: ["finger-flexors"],
    howItHelps:
      "Letting the bar untwist slowly makes the muscles along the top of your forearm work as they lengthen, loading the sore tendon at the outside of your elbow with your arm straight. Steady, controlled loading like this can help the tendon become less sensitive and stronger for gripping, lifting and sport.",
    tissue: "muscle-tendon",
    status: "draft",
  },

  // Hand
  "grip-strengthening": {
    main: ["finger-flexors", "hand-intrinsics"],
    helpers: ["wrist-extensors"],
    howItHelps:
      "Squeezing a soft ball or putty works the forearm muscles that bend your fingers, along with the small muscles in your hand and thumb. Rebuilding grip strength can make everyday tasks like opening jars, carrying shopping and holding a cup easier after an injury or a spell in a cast.",
    tissue: "muscle-tendon",
    status: "draft",
  },
  "tendon-glide-exercises": {
    main: ["finger-flexors", "median-nerve"],
    helpers: ["hand-intrinsics"],
    howItHelps:
      "Moving your fingers through a set of shapes helps the tendons that bend them, and the median nerve beside them, glide through the tunnel at your wrist. Keeping them moving freely may help ease stiffness and tingling, which can make gripping, writing and fine hand tasks more comfortable.",
    tissue: "nerve-brain",
    status: "draft",
  },
};
