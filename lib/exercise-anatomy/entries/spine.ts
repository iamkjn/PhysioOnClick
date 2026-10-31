// lib/exercise-anatomy/entries/spine.ts
// Draft anatomy for lower back, neck, mid-back and core exercises.
// Drafts show on dev only until Shivaliba approves them (status "approved").

import type { ExerciseAnatomy } from "@/lib/exercise-anatomy/types";

export const SPINE: Record<string, ExerciseAnatomy> = {
  // Lumbar spine
  "bridge-progression": {
    main: ["gluteus-maximus"],
    helpers: ["hamstrings", "erector-spinae", "gluteus-medius"],
    howItHelps:
      "Lifting and lowering your hips with control strengthens your buttock muscles, with help from the backs of your thighs and the long muscles beside your spine. Stronger hip and trunk muscles help share the load with your back, which can make bending, lifting and getting up from a chair feel easier.",
    tissue: "joint-ligament",
    status: "draft",
  },
  "bird-dog": {
    main: ["erector-spinae", "multifidus"],
    helpers: ["gluteus-maximus", "external-oblique"],
    howItHelps:
      "Reaching out one arm and the opposite leg while your back stays still trains the muscles beside your spine, including the small deep ones, to hold it steady. Better control of your back while your arms and legs move can help you bend, reach and carry with more confidence.",
    tissue: "joint-ligament",
    status: "draft",
  },
  "mckenzie-press-up": {
    main: ["lumbar-discs", "lumbar-spine"],
    helpers: [],
    howItHelps:
      "Pressing your upper body up while your hips stay relaxed gently bends your lower back backwards, moving its joints and discs. For many people, repeating it helps back and leg symptoms ease, or move up out of the leg towards the back, which is a good sign. This can make sitting, standing and walking more comfortable.",
    tissue: "joint-ligament",
    status: "draft",
  },
  "standing-extension": {
    main: ["lumbar-discs", "lumbar-spine"],
    helpers: [],
    howItHelps:
      "Leaning gently backwards from standing eases the joints and discs of your lower back into the same backward bend as the press-up, without needing to lie down. Because you can do it almost anywhere, it can be a handy way to ease your back between exercise sessions or after a long spell of sitting.",
    tissue: "joint-ligament",
    status: "draft",
  },
  "prone-cobra": {
    main: ["erector-spinae", "middle-trapezius", "lower-trapezius"],
    helpers: ["rhomboids"],
    howItHelps:
      "Lifting your chest a small way off the floor works the long muscles beside your spine and the muscles between your shoulder blades. Building their endurance can help you sit at a desk or stand for longer in comfort, without your back tiring so quickly.",
    status: "draft",
  },
  "side-plank-modified": {
    main: ["external-oblique", "quadratus-lumborum"],
    helpers: ["gluteus-medius"],
    howItHelps:
      "Holding your body in a straight line on your side works the muscles down the side of your trunk that stop it bending sideways. Stronger side muscles can help keep your back steady when you carry a bag in one hand, reach to one side or get in and out of bed.",
    tissue: "joint-ligament",
    status: "draft",
  },
  "segmental-rolling": {
    main: ["thoracic-spine", "lumbar-spine"],
    helpers: ["external-oblique"],
    howItHelps:
      "Rolling onto your side one part at a time gently moves your mid and lower back, with the muscles at the side of your tummy turning your trunk. Finding a slow, relaxed way to roll during a flare-up can make getting in and out of bed easier and help you move with confidence while your back settles.",
    tissue: "joint-ligament",
    status: "draft",
  },
  "pelvic-tilt": {
    main: ["lumbar-spine", "rectus-abdominis"],
    helpers: [],
    howItHelps:
      "Gently tightening your lower tummy rolls your pelvis back, so your lower back flattens and then releases in a small, easy rocking movement. Moving your lower back like this can ease tension and stiffness during and after pregnancy, which may make standing, walking and getting comfortable in bed easier.",
    view: "right",
    status: "draft",
  },
  "quadruped-arm-leg-reach": {
    main: ["erector-spinae", "multifidus"],
    helpers: ["gluteus-maximus", "external-oblique", "iliopsoas"],
    howItHelps:
      "Reaching out and then drawing your elbow and knee in, while your back stays still, makes the muscles beside your spine and around your trunk work harder to keep you steady. Building this control while you balance can help you trust your back again in busier tasks, such as gardening, sport and lifting.",
    status: "draft",
  },
  "lumbar-flexion-in-lying": {
    main: ["lumbar-spine", "erector-spinae"],
    helpers: [],
    howItHelps:
      "Drawing your knees towards your chest gently rounds your lower back, stretching the muscles beside your spine and opening up the spaces the nerves pass through. If you have spinal stenosis, you may find this position eases your back and leg symptoms, making it a useful way to settle things after standing or walking.",
    tissue: "joint-ligament",
    status: "draft",
  },
  "sciatic-nerve-glide": {
    main: ["sciatic-nerve"],
    helpers: [],
    howItHelps:
      "Straightening your knee as you look up, then bending it as you look down, helps your sciatic nerve slide gently back and forth without being stretched hard. Keeping the nerve moving like this can ease sensitivity down your leg, which may make sitting, walking and bending more comfortable.",
    tissue: "nerve-brain",
    status: "draft",
  },
  "functional-lifting-pattern": {
    main: ["gluteus-maximus", "quadriceps"],
    helpers: ["hamstrings", "erector-spinae"],
    howItHelps:
      "Lifting a light object by bending at your hips and knees lets your buttock and thigh muscles drive the lift, while the long muscles beside your spine hold your back in its natural curve. Practising with light loads and building up gradually can help you lift at home and at work with more confidence.",
    view: "right",
    status: "draft",
  },

  // Cervical spine
  "neck-rotation-range": {
    main: ["cervical-spine"],
    helpers: ["sternocleidomastoid", "neck-extensors"],
    howItHelps:
      "Slowly turning your head from side to side moves the small joints of your neck through a comfortable range, with the muscles at the side and back of your neck doing the turning. Keeping your neck moving can ease stiffness and make it easier to look over your shoulder when you drive or cross the road.",
    tissue: "joint-ligament",
    status: "draft",
  },
  "neck-side-flexion-stretch": {
    main: ["upper-trapezius", "scalenes"],
    helpers: ["levator-scapulae"],
    howItHelps:
      "Tilting your ear towards your shoulder gently stretches the muscles down the opposite side of your neck and across the top of that shoulder. Easing tightness here can make your neck feel looser and more comfortable when you look around or sit for long spells.",
    status: "draft",
  },
  "isometric-neck-hold": {
    main: ["sternocleidomastoid", "scalenes", "neck-extensors"],
    helpers: ["deep-neck-flexors"],
    howItHelps:
      "Pressing your head gently into your hand, which stops it moving, makes the muscles all around your neck work while the joints stay still. Building their endurance with light, steady holds can help your neck cope better with driving, desk work and everyday tasks after whiplash.",
    tissue: "joint-ligament",
    status: "draft",
  },
  "standing-chin-retraction": {
    main: ["deep-neck-flexors"],
    helpers: ["neck-extensors"],
    howItHelps:
      "With your head against the wall, gliding your chin straight back works the deep muscles at the front of your neck and gently stretches the small muscles at the base of your skull. Easing tension at the top of your neck may help reduce headaches that start there and make long spells at a screen more comfortable.",
    tissue: "joint-ligament",
    status: "draft",
  },
  "levator-scapulae-stretch": {
    main: ["levator-scapulae"],
    helpers: ["upper-trapezius"],
    howItHelps:
      "Looking down towards the opposite armpit, with your hand keeping your shoulder down, stretches the muscle that runs from the side of your neck to the top of your shoulder blade. Easing tightness here can make turning and tilting your head more comfortable and may ease the ache at the base of your neck.",
    status: "draft",
  },
  "deep-neck-flexor-hold": {
    main: ["deep-neck-flexors"],
    helpers: [],
    howItHelps:
      "Holding a tiny, gentle nod trains the deep muscles at the front of your neck, which help hold it steady, without the bigger surface muscles taking over. Building their endurance can help your neck cope better with desk work and screen time, and may mean neck pain flares up less often.",
    tissue: "joint-ligament",
    status: "draft",
  },
  "prone-neck-extension": {
    main: ["neck-extensors"],
    helpers: ["deep-neck-flexors"],
    howItHelps:
      "Lifting your head level against gravity, with your chin gently tucked, strengthens the muscles at the back of your neck that hold your head up. Stronger neck muscles with more stamina can help you hold your head comfortably for longer at a desk, behind the wheel or when reading.",
    tissue: "joint-ligament",
    status: "draft",
  },

  // Neck
  "chin-tuck": {
    main: ["deep-neck-flexors"],
    helpers: ["neck-extensors"],
    howItHelps:
      "Sliding your chin straight back, like a drawer closing, gently works the deep muscles at the front of your neck and eases the muscles at the base of your skull. Practising this small movement can ease neck stiffness and help you sit and use a screen with your head comfortably balanced.",
    tissue: "joint-ligament",
    status: "draft",
  },

  // Thoracic spine
  "cat-cow-stretch": {
    main: ["thoracic-spine", "lumbar-spine"],
    helpers: ["erector-spinae"],
    howItHelps:
      "Slowly rounding and then gently arching your back, in time with your breathing, moves each part of your spine through a comfortable range. Keeping your mid and lower back moving like this can ease stiffness and make bending and reaching feel freer.",
    status: "draft",
  },
  "thoracic-rotation-open-book": {
    main: ["thoracic-spine"],
    helpers: ["pectoralis-major"],
    howItHelps:
      "Opening your top arm towards the ceiling while your knees stay together turns your mid-back and gently stretches across the front of your chest. Getting more twist back through your mid-back can make it easier to look over your shoulder, reach behind you and turn in your seat.",
    status: "draft",
  },
  "wall-angels": {
    main: ["lower-trapezius", "middle-trapezius", "serratus-anterior"],
    helpers: ["rhomboids"],
    howItHelps:
      "Sliding your arms up and down the wall while keeping contact trains the muscles around your shoulder blades to guide them smoothly as your mid-back stays upright. Better control here can make reaching overhead and sitting tall feel easier, and may ease aching across your upper back.",
    status: "draft",
  },

  // Core
  "dead-bug": {
    main: ["transversus-abdominis", "external-oblique"],
    helpers: ["rectus-abdominis", "iliopsoas"],
    howItHelps:
      "Keeping your lower back gently pressed down while you slowly move an arm and the opposite leg trains your deep and side tummy muscles to hold your trunk steady. This control can help your back feel steadier when you reach, lift, carry or play sport.",
    tissue: "joint-ligament",
    status: "draft",
  },
};
