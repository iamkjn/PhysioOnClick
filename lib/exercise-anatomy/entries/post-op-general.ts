// lib/exercise-anatomy/entries/post-op-general.ts
// Draft anatomy for post-operative and general exercises.
// Scar mobilisation, pain pacing and graded exposure use text-only groups, so
// their pages show no 3D button.
// Drafts show on dev only until Shivaliba approves them (status "approved").

import type { ExerciseAnatomy } from "@/lib/exercise-anatomy/types";

export const POST_OP_GENERAL: Record<string, ExerciseAnatomy> = {
  // Post-op
  "ankle-pumps-post-surgery": {
    main: ["gastrocnemius", "soleus", "tibialis-anterior"],
    helpers: [],
    howItHelps:
      "Pointing your feet away and pulling them back works your calf muscles and the muscle at the front of your shin. As your calves squeeze and relax, they can help keep blood moving in your legs while you are resting in bed more than usual, and help limit stiffness in your ankles.",
    tissue: "post-surgery",
    view: "right",
    status: "approved",
  },
  "quad-sets": {
    main: ["quadriceps"],
    helpers: [],
    howItHelps:
      "Tightening the front of your thigh while your knee stays straight helps wake up a thigh muscle that can be slow to work after knee surgery. Getting this muscle working again is an early step towards holding your knee straight and steady when you stand, walk and get in and out of bed.",
    tissue: "post-surgery",
    status: "approved",
  },
  "assisted-knee-flexion": {
    main: ["quadriceps"],
    helpers: [],
    howItHelps:
      "A strap or your other leg gently bends your operated knee while your thigh muscles stay relaxed, easing the front of your thigh into a stretch. Winning back knee bend, within the range your surgeon or physio allows, can make it easier to sit in a chair, use stairs and get in and out of a car.",
    tissue: "post-surgery",
    view: "right",
    status: "approved",
  },
  "hip-abduction-in-lying-post-op": {
    main: ["gluteus-medius"],
    helpers: ["gluteus-minimus", "tfl-it-band"],
    howItHelps:
      "Sliding your leg out to the side, with your kneecap and toes pointing up, gently works the muscles on the side of your hip while you keep to your hip precautions. Working these muscles after a hip replacement can help them hold your pelvis level as you get back to standing and walking.",
    tissue: "post-surgery",
    status: "approved",
  },
  "supported-standing-post-hip": {
    main: ["quadriceps", "gluteus-maximus"],
    helpers: ["triceps"],
    howItHelps:
      "Pushing up through your hands and your other leg works your thigh and buttock muscles, with the backs of your arms helping, and lowering slowly works them again. Standing for short spells, keeping to the weight your surgeon allows through the operated leg, helps build strength and confidence for your first steps with a frame.",
    tissue: "post-surgery",
    status: "approved",
  },
  "shoulder-pendulum-post-rotator-cuff": {
    main: ["shoulder-joint"],
    helpers: [],
    howItHelps:
      "Letting your arm hang and swing from a gentle rock of your body moves your shoulder joint while the repaired muscles stay relaxed. Small, easy swings within your surgical protocol help limit stiffness while putting very little load on the repair, which can make washing and dressing easier to get back to as you recover.",
    tissue: "post-surgery",
    status: "approved",
  },
  "passive-shoulder-flexion-assisted": {
    main: ["shoulder-joint"],
    helpers: [],
    howItHelps:
      "Using your good arm and a light stick to lift your operated arm overhead moves your shoulder joint while the repaired muscles stay relaxed. Working only in the range your surgeon or physio has allowed helps limit stiffness while the repair heals, which can make reaching, washing your hair and dressing easier as you recover.",
    tissue: "post-surgery",
    status: "approved",
  },
  "incision-site-scar-mobilisation": {
    main: ["scar-tissue"],
    helpers: [],
    howItHelps:
      "Once your wound has fully healed and your surgeon or physio says it is fine to start, moving the skin in small, slow circles around the scar can help it glide over the tissue underneath instead of sticking down. This may help the scar feel softer and less tight, and make moving that area more comfortable.",
    tissue: "post-surgery",
    status: "approved",
  },
  "graduated-weight-bearing": {
    main: ["leg-bones"],
    helpers: ["quadriceps", "gluteus-maximus"],
    howItHelps:
      "Pressing your healing leg onto the scales teaches you how the weight your surgeon allows feels, while your thigh and buttock muscles hold the leg steady. Putting through the right amount, and no more, helps you follow your surgeon's plan as you build back towards walking with less support.",
    tissue: "post-surgery",
    status: "approved",
  },
  "core-bracing-post-abdominal-surgery": {
    main: ["transversus-abdominis"],
    helpers: [],
    howItHelps:
      "Gently drawing in your lower tummy as you breathe out lightly works your tummy muscles, including the deep one that wraps round like a corset. Using this soft brace, with a towel or your hands pressed over the wound, can help your middle feel more supported when you cough, sneeze, roll over or stand up.",
    tissue: "post-surgery",
    status: "approved",
  },
  "post-op-walking-programme": {
    main: ["gluteus-medius", "quadriceps", "gastrocnemius"],
    helpers: ["gluteus-maximus", "soleus", "tibialis-anterior"],
    howItHelps:
      "Walking works the muscles of your hips, thighs and calves, and gently gets your heart and lungs working too. Building up your time a little at a time, within any limits from your surgeon or physio, can help you get back the stamina you need for everyday life after time spent recovering.",
    tissue: "post-surgery",
    status: "approved",
  },
  "resisted-knee-extension-post-acl": {
    main: ["quadriceps"],
    helpers: [],
    howItHelps:
      "Straightening your knee against a light band strengthens the front of your thigh, which can lose strength after ACL surgery. Working within the range and load your surgeon's protocol allows helps you rebuild that strength step by step, so your knee can feel steadier for walking, stairs and, later on, sport.",
    tissue: "post-surgery",
    status: "approved",
  },
  "proprioception-board-post-ankle-surgery": {
    main: ["fibularis", "tibialis-anterior", "tibialis-posterior"],
    helpers: ["soleus", "foot-intrinsics"],
    howItHelps:
      "Keeping the board level makes the muscles around your ankle and foot react with lots of small corrections. Once your surgeon has cleared you to take full weight, this can help retrain your ankle's sense of position, so it feels steadier on uneven ground, slopes and stairs.",
    tissue: "post-surgery",
    status: "approved",
  },
  "return-to-function-strength-circuit": {
    main: ["quadriceps", "gluteus-maximus", "gastrocnemius"],
    helpers: ["gluteus-medius", "soleus", "rhomboids", "middle-trapezius"],
    howItHelps:
      "Movements such as sit-to-stands, step-ups, band rows and calf raises work your thighs, buttocks, calves and upper back in ways you use every day. Building up the circuit steadily, within any limits from your surgeon or physio, can help both sides share the work evenly as you get back to your normal activities.",
    tissue: "post-surgery",
    status: "approved",
  },
  "breathing-exercises-post-thoracic-surgery": {
    main: ["diaphragm", "intercostals"],
    helpers: [],
    howItHelps:
      "Slow, deep breaths into your lower ribs work your main breathing muscle and the small muscles between your ribs, which can help air reach the lower parts of your lungs. Huffing or coughing gently with the pillow held firmly over your wound helps you clear your chest more comfortably, so breathing can feel easier as you recover.",
    tissue: "post-surgery",
    status: "approved",
  },
  "graduated-return-to-driving-readiness": {
    main: ["quadriceps", "cervical-spine"],
    helpers: ["gastrocnemius", "thoracic-spine"],
    howItHelps:
      "Pressing the brake hard works the front of your thigh, and checking your mirrors and blind spots turns your neck and upper back. Practising in your parked car can show you whether these movements feel quick and comfortable. Feeling comfortable here does not mean you are cleared to drive, so always check with your surgeon and insurer first.",
    tissue: "post-surgery",
    view: "right",
    status: "approved",
  },

  // General
  "general-mobility-warm-up": {
    main: ["shoulder-joint", "thoracic-spine", "cervical-spine"],
    helpers: ["deltoid", "upper-trapezius", "iliopsoas", "gastrocnemius"],
    howItHelps:
      "Shoulder rolls, head turns, arm circles, gentle twists, marching and rocking from toes to heels take your main joints through easy, comfortable movement. Warming up like this can help your body feel looser and readier for other exercise, and it makes a gentle movement break during long spells of sitting.",
    status: "approved",
  },
  "graded-walking-programme": {
    main: ["gluteus-medius", "quadriceps", "gastrocnemius"],
    helpers: ["gluteus-maximus", "soleus", "tibialis-anterior"],
    howItHelps:
      "Walking works the muscles of your hips, thighs and calves while gently raising your heart rate. Starting at a time you can manage even on a poor day, and adding a little only when your current time feels easy, can help you rebuild fitness and stamina without the ups and downs of overdoing it.",
    status: "approved",
  },
  "full-body-stretch-routine": {
    main: ["hamstrings", "quadriceps", "gastrocnemius"],
    helpers: ["pectoralis-major", "rhomboids", "upper-trapezius"],
    howItHelps:
      "Holding gentle stretches for your calves, the front and back of your thighs, your chest, upper back and neck eases the big muscles that often feel stiff. Done regularly, this can help your body feel looser and make bending, reaching and turning your head more comfortable.",
    status: "approved",
  },
  "basic-bodyweight-circuit": {
    main: ["quadriceps", "gluteus-maximus", "pectoralis-major"],
    helpers: ["triceps", "front-deltoid", "iliopsoas"],
    howItHelps:
      "Sit-to-stands work your thighs and buttocks, wall push-ups work your chest, shoulders and the backs of your arms, and marching keeps your hips moving and raises your heart rate. Together they can help build the everyday strength you need to get up from a chair, push open doors and stay active, using just a chair and a wall.",
    status: "approved",
  },
  "pain-pacing-activity-plan": {
    main: ["nervous-system"],
    helpers: [],
    howItHelps:
      "Doing a steady, planned amount of an activity, with breaks before pain builds, helps you avoid the cycle of overdoing it on good days and paying for it afterwards. Small, regular increases give your body and nervous system time to adjust, which can help you do more of the things that matter to you with fewer flare-ups.",
    status: "approved",
  },
  "graded-exposure-to-feared-movement": {
    main: ["nervous-system"],
    helpers: [],
    howItHelps:
      "Breaking a movement you have been avoiding into small steps, and repeating each one calmly until it feels routine, helps your brain and body feel less on guard about it. As your confidence grows, the movement can start to feel easier and less worrying, helping you get back to everyday tasks such as bending, reaching or twisting.",
    status: "approved",
  },
  "return-to-sport-readiness-circuit": {
    main: ["quadriceps", "gluteus-maximus", "gastrocnemius"],
    helpers: ["gluteus-medius", "soleus", "hamstrings"],
    howItHelps:
      "Single-leg squats, hops, side-to-side bounds and shuttle runs work your thighs, buttocks and calves hard, testing your strength, balance and control at the speeds your sport needs. Comparing your injured side with the other over several sessions can help you and your physio judge when you are ready to return, rather than relying on one test.",
    view: "right",
    status: "approved",
  },
  "relaxation-and-breathing-for-pain-management": {
    main: ["diaphragm"],
    helpers: [],
    howItHelps:
      "Slow belly breathing works your main breathing muscle, and a gentle out-breath that is a little longer than the in-breath can help your body settle. Tensing and then letting go of each muscle group helps you notice and release tension, which may help take the edge off pain and make it easier to rest.",
    status: "approved",
  },
};
