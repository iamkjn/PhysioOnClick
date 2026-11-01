# Exercise 3D Anatomy — every exercise, with the exact structures lit

**For clinical review by Shivaliba (registered physiotherapist).** Same format as
`anatomy-batch-1-top-20.md` (start there), covering all 174 exercises.

**Things to know about the 3D body:**
- It is one adult male model (BodyParts3D, an open anatomy dataset). The same body shows on
  pregnancy, postnatal and children's pages; if you'd rather a page had no 3D, tick "Hide 3D".
- **Only the exact structure named is ever lit.** Each muscle below lists the exact model structures
  it lights. These lists are locked by an automated test, so they can't drift without a code change.
- Some structures are not in the model at all: latissimus dorsi, rectus abdominis, transversus abdominis,
  internal oblique, quadratus lumborum, multifidus, the patellar tendon, knee ligaments, limb nerves and
  the facial muscles. They stay in the text, nothing is lit in their place, and a note under the body
  says "Not in the 3D model, so not lit: …". If none of an exercise's main structures is in the model,
  the page has no 3D view, just the text.
- Joints themselves aren't in the model, so where an exercise targets a joint, the bones that form it
  are lit and named as bones (for example "Shoulder joint bones", "Neck vertebrae").
- Main structures are bright blue, helpers light blue; everything else is see-through.
- Both sides of the body are lit, as patients do each side in turn.
- The source has longus colli (deep neck flexor) on the left only; the right one is a mirror image of the
  left, so the neck looks symmetrical. The disc between T12 and L1 is missing from the source (no page
  lights it).

## Check these first

The 1 Nov 2026 accuracy pass changed 21 exercises. These 16 were medium-confidence calls, so they need a physio's eye most:

- [Thoracic Rotation (Open Book)](#thoracic-rotation-open-book) — Pectoralis major moved from helper to main focus
- [Neck Side Flexion Stretch](#neck-side-flexion-stretch) — Levator scapulae removed as a helper
- [Wall Slide](#wall-slide) — Whole deltoid narrowed to the front deltoid
- [Shoulder Internal Rotation (Band)](#shoulder-internal-rotation-band) — Latissimus dorsi added as a helper (text only, not in the model)
- [Scapular Retraction (Band Row)](#scapular-retraction-band-row) — Latissimus dorsi added as a helper (text only, not in the model)
- [Wrist Flexor Stretch](#wrist-flexor-stretch) — Finger flexors moved from helper to main focus
- [Tendon Glide Exercises](#tendon-glide-exercises) — Median nerve moved from helper to main focus (text only)
- [Clam Shell](#clam-shell) — Gluteus minimus swapped for gluteus maximus as a helper
- [Deep Squat Mobility](#deep-squat-mobility) — Soleus removed as a helper
- [Coordination Drills (Finger to Nose)](#coordination-drills-finger-to-nose) — Brachialis added to main focus
- [Graduated Weight-Bearing](#graduated-weight-bearing) — Leg bones made the main focus; thigh and buttock muscles moved to helpers
- [Bridge with Pelvic Floor Engagement](#bridge-with-pelvic-floor-engagement) — Transversus abdominis added as a helper (text only)
- [Side-Lying Hip Abduction (Pregnancy-Safe)](#side-lying-hip-abduction-pregnancy-safe) — Gluteus minimus swapped for gluteus maximus as a helper
- [Banded Hip External Rotation](#banded-hip-external-rotation) — Gluteus minimus removed as a helper
- [Sensory-Motor Circuit (Multi-Station)](#sensory-motor-circuit-multi-station) — Main focus changed to the brain, so the page has no 3D view
- [General Mobility Warm-Up](#general-mobility-warm-up) — Joints made the main focus (shoulder, mid-back, neck); deltoid and iliopsoas moved to helpers

---

## Lower limb

### <a id="straight-leg-raise"></a>Straight Leg Raise
_Knee · Early rehab_

Dev page: https://dev.physioonclick.co.uk/exercises/straight-leg-raise

- **Main focus** (bright blue):
  - **Quadriceps** (front of your thigh) — lights: rectus femoris (both sides), vastus intermedius (both sides), vastus lateralis (both sides), vastus medialis (both sides)
- **Also working** (light blue):
  - **Iliopsoas** (deep hip flexor at the front of your hip) — lights: iliacus (both sides), psoas major (both sides)
- **How this helps your recovery:** Straight leg raises strengthen the front of your thigh without needing to bend a sore or recently operated knee. A strong thigh muscle helps you hold your knee straight and steady when you stand, walk and get in and out of bed.
- **Tissue line:** After surgery
- **3D view:** yes, starting from the front

- [ ] **Approved** &nbsp;&nbsp; - [ ] **Hide 3D on this page** &nbsp;&nbsp; Notes:

---

### <a id="heel-slide"></a>Heel Slide
_Knee · Early rehab_

Dev page: https://dev.physioonclick.co.uk/exercises/heel-slide

- **Main focus** (bright blue):
  - **Hamstrings** (back of your thigh) — lights: long head of biceps femoris (both sides), semimembranosus (both sides), semitendinosus (both sides), short head of biceps femoris (both sides)
  - **Quadriceps** (front of your thigh) — lights: rectus femoris (both sides), vastus intermedius (both sides), vastus lateralis (both sides), vastus medialis (both sides)
- **Also working** (light blue):
  - **Iliopsoas** (deep hip flexor at the front of your hip) — lights: iliacus (both sides), psoas major (both sides)
- **How this helps your recovery:** Heel slides gently work your knee into more bend, with the back of your thigh doing the bending as the front of your thigh eases into a stretch. Getting back more knee bend can make it easier to sit in a chair, climb stairs and get in and out of a car.
- **Tissue line:** After surgery
- **3D view:** yes, starting from the right side

- [ ] **Approved** &nbsp;&nbsp; - [ ] **Hide 3D on this page** &nbsp;&nbsp; Notes:

---

### <a id="mini-squat"></a>Mini Squat
_Knee · Strength phase_

Dev page: https://dev.physioonclick.co.uk/exercises/mini-squat

- **Main focus** (bright blue):
  - **Quadriceps** (front of your thigh) — lights: rectus femoris (both sides), vastus intermedius (both sides), vastus lateralis (both sides), vastus medialis (both sides)
  - **Gluteus maximus** (your main buttock muscle) — lights: gluteus maximus (both sides)
- **Also working** (light blue):
  - **Gluteus medius** (side of your hip) — lights: gluteus medius (both sides)
  - **Hamstrings** (back of your thigh) — lights: long head of biceps femoris (both sides), semimembranosus (both sides), semitendinosus (both sides), short head of biceps femoris (both sides)
- **How this helps your recovery:** Mini squats strengthen the front of your thigh and your buttock muscles through a small bend that is gentle on a sore knee. Stronger muscles around the knee help support the joint, making it easier to stand up from a chair, manage stairs and walk further.
- **Tissue line:** Joints and ligaments
- **3D view:** yes, starting from the front

- [ ] **Approved** &nbsp;&nbsp; - [ ] **Hide 3D on this page** &nbsp;&nbsp; Notes:

---

### <a id="stationary-bike"></a>Stationary Bike
_Knee · Mobility phase_

Dev page: https://dev.physioonclick.co.uk/exercises/stationary-bike

- **Main focus** (bright blue):
  - **Quadriceps** (front of your thigh) — lights: rectus femoris (both sides), vastus intermedius (both sides), vastus lateralis (both sides), vastus medialis (both sides)
- **Also working** (light blue):
  - **Gluteus maximus** (your main buttock muscle) — lights: gluteus maximus (both sides)
  - **Hamstrings** (back of your thigh) — lights: long head of biceps femoris (both sides), semimembranosus (both sides), semitendinosus (both sides), short head of biceps femoris (both sides)
  - **Gastrocnemius** (the big calf muscle) — lights: lateral head of gastrocnemius (both sides), medial head of gastrocnemius (both sides)
- **How this helps your recovery:** Each turn of the pedals gently bends and straightens your knee while the front of your thigh does easy, low-impact work. This helps loosen a stiff knee and builds the stamina you need for walking and everyday activity.
- **Tissue line:** After surgery
- **3D view:** yes, starting from the front

- [ ] **Approved** &nbsp;&nbsp; - [ ] **Hide 3D on this page** &nbsp;&nbsp; Notes:

---

### <a id="terminal-knee-extension-band"></a>Terminal Knee Extension (Band)
_Knee · Strength phase_

Dev page: https://dev.physioonclick.co.uk/exercises/terminal-knee-extension-band

- **Main focus** (bright blue):
  - **Quadriceps** (front of your thigh) — lights: rectus femoris (both sides), vastus intermedius (both sides), vastus lateralis (both sides), vastus medialis (both sides)
- **How this helps your recovery:** Straightening your knee against the band works your thigh muscle through the last part of the movement, which you often feel most just above your kneecap. Being able to straighten your knee fully and firmly helps it feel steadier when you stand, walk and use stairs.
- **Tissue line:** Joints and ligaments
- **3D view:** yes, starting from the front

- [ ] **Approved** &nbsp;&nbsp; - [ ] **Hide 3D on this page** &nbsp;&nbsp; Notes:

---

### <a id="step-up"></a>Step-Up
_Knee · Strength phase_

Dev page: https://dev.physioonclick.co.uk/exercises/step-up

- **Main focus** (bright blue):
  - **Quadriceps** (front of your thigh) — lights: rectus femoris (both sides), vastus intermedius (both sides), vastus lateralis (both sides), vastus medialis (both sides)
  - **Gluteus maximus** (your main buttock muscle) — lights: gluteus maximus (both sides)
- **Also working** (light blue):
  - **Gluteus medius** (side of your hip) — lights: gluteus medius (both sides)
  - **Hamstrings** (back of your thigh) — lights: long head of biceps femoris (both sides), semimembranosus (both sides), semitendinosus (both sides), short head of biceps femoris (both sides)
- **How this helps your recovery:** Step-ups strengthen the front of your thigh and your buttock on one leg, while the side of your hip works to keep your pelvis level and your knee in line. This builds the strength and control you need for stairs, kerbs and walking up slopes.
- **Tissue line:** Joints and ligaments
- **3D view:** yes, starting from the front

- [ ] **Approved** &nbsp;&nbsp; - [ ] **Hide 3D on this page** &nbsp;&nbsp; Notes:

---

### <a id="wall-squat-hold"></a>Wall Squat Hold
_Knee · Early rehab_

Dev page: https://dev.physioonclick.co.uk/exercises/wall-squat-hold

- **Main focus** (bright blue):
  - **Quadriceps** (front of your thigh) — lights: rectus femoris (both sides), vastus intermedius (both sides), vastus lateralis (both sides), vastus medialis (both sides)
  - **Patellar tendon** (the tendon just below your kneecap) — not in the 3D model, so not lit
- **How this helps your recovery:** Holding a shallow squat against the wall works the front of your thigh and loads the tendon below your kneecap without moving the knee. Steady holds like this are a gentle way to keep the tendon working during a flare-up, so you can stay active while the pain settles.
- **Tissue line:** Muscles and tendons
- **3D view:** yes, starting from the front
- **Note under the 3D body:** Not in the 3D model, so not lit: patellar tendon.

- [ ] **Approved** &nbsp;&nbsp; - [ ] **Hide 3D on this page** &nbsp;&nbsp; Notes:

---

### <a id="split-squat"></a>Split Squat
_Knee · Return to function_

Dev page: https://dev.physioonclick.co.uk/exercises/split-squat

- **Main focus** (bright blue):
  - **Quadriceps** (front of your thigh) — lights: rectus femoris (both sides), vastus intermedius (both sides), vastus lateralis (both sides), vastus medialis (both sides)
  - **Gluteus maximus** (your main buttock muscle) — lights: gluteus maximus (both sides)
- **Also working** (light blue):
  - **Gluteus medius** (side of your hip) — lights: gluteus medius (both sides)
  - **Adductors** (inner thigh) — lights: adductor brevis (both sides), adductor longus (both sides), adductor magnus (both sides), adductor minimus (both sides), gracilis (both sides), pectineus (both sides)
  - **Hamstrings** (back of your thigh) — lights: long head of biceps femoris (both sides), semimembranosus (both sides), semitendinosus (both sides), short head of biceps femoris (both sides)
- **How this helps your recovery:** Split squats build strength in the front of your thigh and your buttock one leg at a time, while training your knee to stay in line over your foot. That strength and control help your knee cope with the landing, pivoting and quick changes of direction that sport asks of it.
- **Tissue line:** Joints and ligaments
- **3D view:** yes, starting from the front

- [ ] **Approved** &nbsp;&nbsp; - [ ] **Hide 3D on this page** &nbsp;&nbsp; Notes:

---

### <a id="box-step-down"></a>Box Step-Down
_Knee · Strength phase_

Dev page: https://dev.physioonclick.co.uk/exercises/box-step-down

- **Main focus** (bright blue):
  - **Quadriceps** (front of your thigh) — lights: rectus femoris (both sides), vastus intermedius (both sides), vastus lateralis (both sides), vastus medialis (both sides)
  - **Gluteus medius** (side of your hip) — lights: gluteus medius (both sides)
- **Also working** (light blue):
  - **Gluteus maximus** (your main buttock muscle) — lights: gluteus maximus (both sides)
- **How this helps your recovery:** Lowering yourself slowly off the step trains the front of your thigh to control your weight as the knee bends, while the side of your hip keeps your knee in line. Better control can make going downstairs and downhill easier on the joint behind your kneecap.
- **Tissue line:** Joints and ligaments
- **3D view:** yes, starting from the front

- [ ] **Approved** &nbsp;&nbsp; - [ ] **Hide 3D on this page** &nbsp;&nbsp; Notes:

---

### <a id="spanish-squat"></a>Spanish Squat (Isometric)
_Knee · Early rehab_

Dev page: https://dev.physioonclick.co.uk/exercises/spanish-squat

- **Main focus** (bright blue):
  - **Quadriceps** (front of your thigh) — lights: rectus femoris (both sides), vastus intermedius (both sides), vastus lateralis (both sides), vastus medialis (both sides)
  - **Patellar tendon** (the tendon just below your kneecap) — not in the 3D model, so not lit
- **Also working** (light blue):
  - **Gluteus maximus** (your main buttock muscle) — lights: gluteus maximus (both sides)
- **How this helps your recovery:** Holding this squat works the front of your thighs hard and loads the tendon just below your kneecap steadily, while the band keeps your shins upright. Steady holds like this let you keep loading the tendon during a flare-up, so you can stay active and keep training while it calms down.
- **Tissue line:** Muscles and tendons
- **3D view:** yes, starting from the front
- **Note under the 3D body:** Not in the 3D model, so not lit: patellar tendon.

- [ ] **Approved** &nbsp;&nbsp; - [ ] **Hide 3D on this page** &nbsp;&nbsp; Notes:

---

### <a id="reverse-nordic"></a>Reverse Nordic (Quad Eccentric)
_Knee · Strength phase_

Dev page: https://dev.physioonclick.co.uk/exercises/reverse-nordic

- **Main focus** (bright blue):
  - **Quadriceps** (front of your thigh) — lights: rectus femoris (both sides), vastus intermedius (both sides), vastus lateralis (both sides), vastus medialis (both sides)
  - **Patellar tendon** (the tendon just below your kneecap) — not in the 3D model, so not lit
- **Also working** (light blue):
  - **Iliopsoas** (deep hip flexor at the front of your hip) — lights: iliacus (both sides), psoas major (both sides)
- **How this helps your recovery:** Leaning back slowly from your knees works the front of your thigh and the tendon below your kneecap while the muscle lengthens under control. This builds strength through a long range, which helps your knee cope with jumping, landing and slowing down in sport.
- **Tissue line:** Muscles and tendons
- **3D view:** yes, starting from the front
- **Note under the 3D body:** Not in the 3D model, so not lit: patellar tendon.

- [ ] **Approved** &nbsp;&nbsp; - [ ] **Hide 3D on this page** &nbsp;&nbsp; Notes:

---

### <a id="hip-bridge"></a>Hip Bridge
_Hip · Strength phase_

Dev page: https://dev.physioonclick.co.uk/exercises/hip-bridge

- **Main focus** (bright blue):
  - **Gluteus maximus** (your main buttock muscle) — lights: gluteus maximus (both sides)
- **Also working** (light blue):
  - **Hamstrings** (back of your thigh) — lights: long head of biceps femoris (both sides), semimembranosus (both sides), semitendinosus (both sides), short head of biceps femoris (both sides)
  - **Gluteus medius** (side of your hip) — lights: gluteus medius (both sides)
- **How this helps your recovery:** Bridges strengthen your main buttock muscles, with help from the backs of your thighs, as you lift and lower your hips with control. Strong buttock muscles help support your hips and lower back when you stand up from a chair, climb stairs and walk.
- **Tissue line:** Muscles and tendons
- **3D view:** yes, starting from the back

- [ ] **Approved** &nbsp;&nbsp; - [ ] **Hide 3D on this page** &nbsp;&nbsp; Notes:

---

### <a id="clam-shell"></a>Clam Shell
_Hip · Early rehab_

Dev page: https://dev.physioonclick.co.uk/exercises/clam-shell

> **Changed in the 1 Nov accuracy pass (medium confidence):** Gluteus minimus swapped for gluteus maximus as a helper, because minimus does not turn the hip out (its front fibres turn it in when the hip is bent); upper maximus does.

- **Main focus** (bright blue):
  - **Gluteus medius** (side of your hip) — lights: gluteus medius (both sides)
- **Also working** (light blue):
  - **Gluteus maximus** (your main buttock muscle) — lights: gluteus maximus (both sides)
  - **Deep hip rotators** (deep muscles at the back of your hip, including piriformis) — lights: gemellus inferior (both sides), gemellus superior (both sides), obturator externus (both sides), obturator internus (both sides), piriformis (both sides), quadratus femoris (both sides)
- **How this helps your recovery:** Clams wake up and strengthen the muscles on the side of your hip without loading a sore knee or back. Stronger hip muscles keep your knee in line and your pelvis level when you walk, climb stairs or stand on one leg.
- **Tissue line:** Muscles and tendons
- **3D view:** yes, starting from the right side

- [ ] **Approved** &nbsp;&nbsp; - [ ] **Hide 3D on this page** &nbsp;&nbsp; Notes:

---

### <a id="side-lying-hip-abduction"></a>Side-Lying Hip Abduction
_Hip · Strength phase_

Dev page: https://dev.physioonclick.co.uk/exercises/side-lying-hip-abduction

- **Main focus** (bright blue):
  - **Gluteus medius** (side of your hip) — lights: gluteus medius (both sides)
- **Also working** (light blue):
  - **Gluteus minimus** (deep side of your hip) — lights: gluteus minimus (both sides)
  - **Tensor fasciae latae and IT band** (outside of your hip and thigh) — lights: iliotibial tract (both sides), tensor fasciae latae (both sides)
- **How this helps your recovery:** Lifting your leg out to the side strengthens the muscles and tendons on the side of your hip that hold your pelvis level. Stronger outer-hip muscles help keep your pelvis steady when you walk, climb stairs or stand on one leg.
- **Tissue line:** Muscles and tendons
- **3D view:** yes, starting from the right side

- [ ] **Approved** &nbsp;&nbsp; - [ ] **Hide 3D on this page** &nbsp;&nbsp; Notes:

---

### <a id="standing-hip-flexor-stretch"></a>Standing Hip Flexor Stretch
_Hip · Mobility phase_

Dev page: https://dev.physioonclick.co.uk/exercises/standing-hip-flexor-stretch

- **Main focus** (bright blue):
  - **Iliopsoas** (deep hip flexor at the front of your hip) — lights: iliacus (both sides), psoas major (both sides)
  - **Rectus femoris** (the thigh muscle that also lifts your leg at the hip) — lights: rectus femoris (both sides)
- **Also working** (light blue):
  - **Gluteus maximus** (your main buttock muscle) — lights: gluteus maximus (both sides)
- **How this helps your recovery:** Tucking your tailbone under and shifting forwards stretches the muscles at the front of the hip and thigh of your back leg. Easing tightness here, which often builds up from long spells of sitting, can let you stand taller and stride out more freely.
- **Tissue line:** none (stages strip only)
- **3D view:** yes, starting from the front

- [ ] **Approved** &nbsp;&nbsp; - [ ] **Hide 3D on this page** &nbsp;&nbsp; Notes:

---

### <a id="deep-squat-mobility"></a>Deep Squat Mobility
_Hip · Return to function_

Dev page: https://dev.physioonclick.co.uk/exercises/deep-squat-mobility

> **Changed in the 1 Nov accuracy pass (medium confidence):** Soleus removed as a helper, because it is only stretched passively in a supported hold.

- **Main focus** (bright blue):
  - **Gluteus maximus** (your main buttock muscle) — lights: gluteus maximus (both sides)
  - **Adductors** (inner thigh) — lights: adductor brevis (both sides), adductor longus (both sides), adductor magnus (both sides), adductor minimus (both sides), gracilis (both sides), pectineus (both sides)
- **Also working** (light blue):
  - **Quadriceps** (front of your thigh) — lights: rectus femoris (both sides), vastus intermedius (both sides), vastus lateralis (both sides), vastus medialis (both sides)
- **How this helps your recovery:** Holding a supported deep squat gently bends your hips and knees as far as is comfortable, while your buttock and inner-thigh muscles ease into a stretch. Keeping this range helps with low tasks such as gardening, picking things up from the floor and getting up from a low seat.
- **Tissue line:** Joints and ligaments
- **3D view:** yes, starting from the back

- [ ] **Approved** &nbsp;&nbsp; - [ ] **Hide 3D on this page** &nbsp;&nbsp; Notes:

---

### <a id="lateral-band-walk"></a>Lateral Band Walk
_Hip · Return to function_

Dev page: https://dev.physioonclick.co.uk/exercises/lateral-band-walk

- **Main focus** (bright blue):
  - **Gluteus medius** (side of your hip) — lights: gluteus medius (both sides)
- **Also working** (light blue):
  - **Gluteus minimus** (deep side of your hip) — lights: gluteus minimus (both sides)
  - **Gluteus maximus** (your main buttock muscle) — lights: gluteus maximus (both sides)
  - **Tensor fasciae latae and IT band** (outside of your hip and thigh) — lights: iliotibial tract (both sides), tensor fasciae latae (both sides)
  - **Quadriceps** (front of your thigh) — lights: rectus femoris (both sides), vastus intermedius (both sides), vastus lateralis (both sides), vastus medialis (both sides)
- **How this helps your recovery:** Stepping sideways against the band works the muscles on the side of your hips, while the front of your thighs hold the low squat. These hip muscles help keep your knees in line over your feet, which can ease the strain on the front of your knee when you walk, run and use stairs.
- **Tissue line:** Joints and ligaments
- **3D view:** yes, starting from the right side

- [ ] **Approved** &nbsp;&nbsp; - [ ] **Hide 3D on this page** &nbsp;&nbsp; Notes:

---

### <a id="hip-hitch"></a>Hip Hitch (Pelvic Drop)
_Hip · Strength phase_

Dev page: https://dev.physioonclick.co.uk/exercises/hip-hitch

- **Main focus** (bright blue):
  - **Gluteus medius** (side of your hip) — lights: gluteus medius (both sides)
- **Also working** (light blue):
  - **Gluteus minimus** (deep side of your hip) — lights: gluteus minimus (both sides)
  - **Tensor fasciae latae and IT band** (outside of your hip and thigh) — lights: iliotibial tract (both sides), tensor fasciae latae (both sides)
- **How this helps your recovery:** Lifting your pelvis level from a dip trains the muscles on the side of your standing hip, the ones that stop your pelvis dropping each time you take a step. Building them up helps you keep your pelvis steadier when you walk and climb stairs.
- **Tissue line:** Muscles and tendons
- **3D view:** yes, starting from the right side

- [ ] **Approved** &nbsp;&nbsp; - [ ] **Hide 3D on this page** &nbsp;&nbsp; Notes:

---

### <a id="banded-hip-external-rotation"></a>Banded Hip External Rotation
_Hip · Strength phase_

Dev page: https://dev.physioonclick.co.uk/exercises/banded-hip-external-rotation

> **Changed in the 1 Nov accuracy pass (medium confidence):** Gluteus minimus removed as a helper, because it does not turn the hip outward.

- **Main focus** (bright blue):
  - **Deep hip rotators** (deep muscles at the back of your hip, including piriformis) — lights: gemellus inferior (both sides), gemellus superior (both sides), obturator externus (both sides), obturator internus (both sides), piriformis (both sides), quadratus femoris (both sides)
  - **Gluteus medius** (side of your hip) — lights: gluteus medius (both sides)
- **Also working** (light blue):
  - **Gluteus maximus** (your main buttock muscle) — lights: gluteus maximus (both sides)
- **How this helps your recovery:** Pressing your knees apart against the band works the deep muscles at the back of your hip and the side of your buttock. These muscles help steady the ball of your hip in its socket and control your hip and pelvis as you walk, climb stairs and stand on one leg.
- **Tissue line:** Muscles and tendons
- **3D view:** yes, starting from the back

- [ ] **Approved** &nbsp;&nbsp; - [ ] **Hide 3D on this page** &nbsp;&nbsp; Notes:

---

### <a id="copenhagen-adductor"></a>Copenhagen Adductor Hold
_Hip · Return to function_

Dev page: https://dev.physioonclick.co.uk/exercises/copenhagen-adductor

- **Main focus** (bright blue):
  - **Adductors** (inner thigh) — lights: adductor brevis (both sides), adductor longus (both sides), adductor magnus (both sides), adductor minimus (both sides), gracilis (both sides), pectineus (both sides)
- **Also working** (light blue):
  - **Gluteus medius** (side of your hip) — lights: gluteus medius (both sides)
  - **External oblique** (side of your tummy) — lights: external oblique (both sides)
  - **Quadratus lumborum** (deep muscle between your lowest rib and your pelvis) — not in the 3D model, so not lit
- **How this helps your recovery:** Pressing your top leg into the bench to hold your body up works your inner-thigh muscles hard, along with the side of your hip and trunk. Stronger inner-thigh muscles help your groin cope with the kicking, sprinting and sharp changes of direction that sport demands.
- **Tissue line:** Muscles and tendons
- **3D view:** yes, starting from the front
- **Note under the 3D body:** Not in the 3D model, so not lit: quadratus lumborum.

- [ ] **Approved** &nbsp;&nbsp; - [ ] **Hide 3D on this page** &nbsp;&nbsp; Notes:

---

### <a id="single-leg-glute-bridge"></a>Single-Leg Glute Bridge
_Hip · Strength phase_

Dev page: https://dev.physioonclick.co.uk/exercises/single-leg-glute-bridge

- **Main focus** (bright blue):
  - **Gluteus maximus** (your main buttock muscle) — lights: gluteus maximus (both sides)
- **Also working** (light blue):
  - **Hamstrings** (back of your thigh) — lights: long head of biceps femoris (both sides), semimembranosus (both sides), semitendinosus (both sides), short head of biceps femoris (both sides)
  - **Gluteus medius** (side of your hip) — lights: gluteus medius (both sides)
- **How this helps your recovery:** Bridging on one leg puts much more load through the buttock of your working leg, while the back of your thigh helps lift and the side of your hip keeps your pelvis level. This builds the single-leg strength that steadies your pelvis on stairs and when running, and supports your hip and knee.
- **Tissue line:** Muscles and tendons
- **3D view:** yes, starting from the back

- [ ] **Approved** &nbsp;&nbsp; - [ ] **Hide 3D on this page** &nbsp;&nbsp; Notes:

---

### <a id="standing-banded-hip-abduction"></a>Standing Banded Hip Abduction
_Hip · Strength phase_

Dev page: https://dev.physioonclick.co.uk/exercises/standing-banded-hip-abduction

- **Main focus** (bright blue):
  - **Gluteus medius** (side of your hip) — lights: gluteus medius (both sides)
- **Also working** (light blue):
  - **Gluteus minimus** (deep side of your hip) — lights: gluteus minimus (both sides)
  - **Tensor fasciae latae and IT band** (outside of your hip and thigh) — lights: iliotibial tract (both sides), tensor fasciae latae (both sides)
- **How this helps your recovery:** Moving your leg out against the band works the muscles on the side of both hips: the moving leg lifts, and the standing leg holds your pelvis steady. This builds outer-hip strength upright, in the position you use for walking, hills, stairs and other single-leg tasks.
- **Tissue line:** Muscles and tendons
- **3D view:** yes, starting from the right side

- [ ] **Approved** &nbsp;&nbsp; - [ ] **Hide 3D on this page** &nbsp;&nbsp; Notes:

---

### <a id="heel-raises"></a>Heel Raises
_Ankle · Strength phase_

Dev page: https://dev.physioonclick.co.uk/exercises/heel-raises

- **Main focus** (bright blue):
  - **Gastrocnemius** (the big calf muscle) — lights: lateral head of gastrocnemius (both sides), medial head of gastrocnemius (both sides)
  - **Soleus** (deep calf muscle) — lights: soleus (both sides)
- **Also working** (light blue):
  - **Fibularis longus and brevis (peroneals)** (outside of your lower leg and ankle) — lights: fibularis brevis (both sides), fibularis longus (both sides)
  - **Tibialis posterior** (deep in the back of your lower leg, its tendon running behind your inner ankle to support your arch) — lights: tibialis posterior (both sides)
- **How this helps your recovery:** Rising onto your toes and lowering slowly strengthens your calf muscles, while the smaller muscles around your ankle work to keep it steady and in line. Stronger calf and ankle muscles help your ankle cope with walking, stairs and uneven ground after a sprain.
- **Tissue line:** Joints and ligaments
- **3D view:** yes, starting from the back

- [ ] **Approved** &nbsp;&nbsp; - [ ] **Hide 3D on this page** &nbsp;&nbsp; Notes:

---

### <a id="ankle-pump"></a>Ankle Pump
_Ankle · Early rehab_

Dev page: https://dev.physioonclick.co.uk/exercises/ankle-pump

- **Main focus** (bright blue):
  - **Gastrocnemius** (the big calf muscle) — lights: lateral head of gastrocnemius (both sides), medial head of gastrocnemius (both sides)
  - **Soleus** (deep calf muscle) — lights: soleus (both sides)
  - **Tibialis anterior** (front of your shin) — lights: tibialis anterior (both sides)
- **How this helps your recovery:** Pointing and pulling up your foot works the muscles at the back and front of your lower leg, which squeeze like a pump to help move swelling away from your ankle. Moving the ankle gently also helps stop it stiffening while it settles.
- **Tissue line:** Joints and ligaments
- **3D view:** yes, starting from the right side

- [ ] **Approved** &nbsp;&nbsp; - [ ] **Hide 3D on this page** &nbsp;&nbsp; Notes:

---

### <a id="ankle-alphabet"></a>Ankle Alphabet
_Ankle · Early rehab_

Dev page: https://dev.physioonclick.co.uk/exercises/ankle-alphabet

- **Main focus** (bright blue):
  - **Tibialis anterior** (front of your shin) — lights: tibialis anterior (both sides)
  - **Fibularis longus and brevis (peroneals)** (outside of your lower leg and ankle) — lights: fibularis brevis (both sides), fibularis longus (both sides)
  - **Tibialis posterior** (deep in the back of your lower leg, its tendon running behind your inner ankle to support your arch) — lights: tibialis posterior (both sides)
- **Also working** (light blue):
  - **Gastrocnemius** (the big calf muscle) — lights: lateral head of gastrocnemius (both sides), medial head of gastrocnemius (both sides)
  - **Soleus** (deep calf muscle) — lights: soleus (both sides)
- **How this helps your recovery:** Tracing letters with your toes moves your ankle up, down and side to side, gently working the muscles all around your lower leg. Getting back movement in every direction helps your ankle cope with walking, turning and uneven ground as the sprain settles.
- **Tissue line:** Joints and ligaments
- **3D view:** yes, starting from the right side

- [ ] **Approved** &nbsp;&nbsp; - [ ] **Hide 3D on this page** &nbsp;&nbsp; Notes:

---

### <a id="resisted-ankle-eversion"></a>Resisted Ankle Eversion
_Ankle · Strength phase_

Dev page: https://dev.physioonclick.co.uk/exercises/resisted-ankle-eversion

- **Main focus** (bright blue):
  - **Fibularis longus and brevis (peroneals)** (outside of your lower leg and ankle) — lights: fibularis brevis (both sides), fibularis longus (both sides)
- **How this helps your recovery:** Turning your foot outwards against the band strengthens the muscles down the outside of your lower leg, which act against your ankle rolling over. Stronger outer-ankle muscles help steady an ankle that tends to give way, whether on uneven ground, kerbs or the sports pitch.
- **Tissue line:** Joints and ligaments
- **3D view:** yes, starting from the right side

- [ ] **Approved** &nbsp;&nbsp; - [ ] **Hide 3D on this page** &nbsp;&nbsp; Notes:

---

### <a id="single-leg-balance-on-foam"></a>Single Leg Balance on Foam
_Ankle · Return to function_

Dev page: https://dev.physioonclick.co.uk/exercises/single-leg-balance-on-foam

- **Main focus** (bright blue):
  - **Fibularis longus and brevis (peroneals)** (outside of your lower leg and ankle) — lights: fibularis brevis (both sides), fibularis longus (both sides)
  - **Tibialis anterior** (front of your shin) — lights: tibialis anterior (both sides)
  - **Tibialis posterior** (deep in the back of your lower leg, its tendon running behind your inner ankle to support your arch) — lights: tibialis posterior (both sides)
- **Also working** (light blue):
  - **Soleus** (deep calf muscle) — lights: soleus (both sides)
  - **Gluteus medius** (side of your hip) — lights: gluteus medius (both sides)
- **How this helps your recovery:** Balancing on a soft surface makes the muscles around your ankle react quickly with lots of small corrections. This retrains your ankle's sense of position, helping it feel steadier on uneven ground and when you return to sport.
- **Tissue line:** Joints and ligaments
- **3D view:** yes, starting from the right side

- [ ] **Approved** &nbsp;&nbsp; - [ ] **Hide 3D on this page** &nbsp;&nbsp; Notes:

---

### <a id="calf-stretch-gastrocnemius"></a>Calf Stretch (Gastrocnemius)
_Ankle · Mobility phase_

Dev page: https://dev.physioonclick.co.uk/exercises/calf-stretch-gastrocnemius

> **Changed in the 1 Nov accuracy pass (high confidence):** Soleus removed as a helper, because it is relaxed in a straight-knee stretch.

- **Main focus** (bright blue):
  - **Gastrocnemius** (the big calf muscle) — lights: lateral head of gastrocnemius (both sides), medial head of gastrocnemius (both sides)
- **How this helps your recovery:** Leaning into the wall with your back knee straight gently stretches the big calf muscle. Easing calf tightness may reduce the pull on your Achilles tendon, which can make walking, stairs and your first steps in the morning more comfortable.
- **Tissue line:** Muscles and tendons
- **3D view:** yes, starting from the back

- [ ] **Approved** &nbsp;&nbsp; - [ ] **Hide 3D on this page** &nbsp;&nbsp; Notes:

---

### <a id="eccentric-heel-drop"></a>Eccentric Heel Drop
_Ankle · Strength phase_

Dev page: https://dev.physioonclick.co.uk/exercises/eccentric-heel-drop

- **Main focus** (bright blue):
  - **Achilles tendon** (back of your ankle) — lights: calcaneal tendon (both sides)
  - **Gastrocnemius** (the big calf muscle) — lights: lateral head of gastrocnemius (both sides), medial head of gastrocnemius (both sides)
  - **Soleus** (deep calf muscle) — lights: soleus (both sides)
- **How this helps your recovery:** Lowering your heel slowly on one leg loads your Achilles tendon and calf muscles in a steady, controlled way. Tendons tend to get stronger and less sensitive with gradual loading like this, helping you cope better with walking, stairs and running.
- **Tissue line:** Muscles and tendons
- **3D view:** yes, starting from the back

- [ ] **Approved** &nbsp;&nbsp; - [ ] **Hide 3D on this page** &nbsp;&nbsp; Notes:

---

### <a id="heavy-slow-calf-raise"></a>Heavy Slow Calf Raise
_Ankle · Strength phase_

Dev page: https://dev.physioonclick.co.uk/exercises/heavy-slow-calf-raise

- **Main focus** (bright blue):
  - **Gastrocnemius** (the big calf muscle) — lights: lateral head of gastrocnemius (both sides), medial head of gastrocnemius (both sides)
  - **Soleus** (deep calf muscle) — lights: soleus (both sides)
  - **Achilles tendon** (back of your ankle) — lights: calcaneal tendon (both sides)
- **Also working** (light blue):
  - **Fibularis longus and brevis (peroneals)** (outside of your lower leg and ankle) — lights: fibularis brevis (both sides), fibularis longus (both sides)
  - **Tibialis posterior** (deep in the back of your lower leg, its tendon running behind your inner ankle to support your arch) — lights: tibialis posterior (both sides)
- **How this helps your recovery:** Slow, heavy raises through your full range build strength in your calf muscles and Achilles tendon. Tendons adapt to load that is increased steadily, which helps them cope with walking, hills and stairs, and with running and jumping when you return to them.
- **Tissue line:** Muscles and tendons
- **3D view:** yes, starting from the back

- [ ] **Approved** &nbsp;&nbsp; - [ ] **Hide 3D on this page** &nbsp;&nbsp; Notes:

---

### <a id="seated-calf-raise"></a>Seated Calf Raise (Soleus)
_Ankle · Strength phase_

Dev page: https://dev.physioonclick.co.uk/exercises/seated-calf-raise

- **Main focus** (bright blue):
  - **Soleus** (deep calf muscle) — lights: soleus (both sides)
  - **Achilles tendon** (back of your ankle) — lights: calcaneal tendon (both sides)
- **How this helps your recovery:** Raising your heels with your knees bent shifts the work onto the deeper calf muscle, which straight-knee raises work less, and loads the Achilles tendon it pulls on. A strong deep calf helps with longer walks and runs, where it takes much of the strain.
- **Tissue line:** Muscles and tendons
- **3D view:** yes, starting from the back

- [ ] **Approved** &nbsp;&nbsp; - [ ] **Hide 3D on this page** &nbsp;&nbsp; Notes:

---

### <a id="nordic-hamstring-curl-assisted"></a>Nordic Hamstring Curl (Assisted)
_Hamstring · Return to function_

Dev page: https://dev.physioonclick.co.uk/exercises/nordic-hamstring-curl-assisted

- **Main focus** (bright blue):
  - **Hamstrings** (back of your thigh) — lights: long head of biceps femoris (both sides), semimembranosus (both sides), semitendinosus (both sides), short head of biceps femoris (both sides)
- **Also working** (light blue):
  - **Gluteus maximus** (your main buttock muscle) — lights: gluteus maximus (both sides)
  - **Erector spinae (trunk part)** (the long muscles either side of your spine, from your pelvis up to the base of your neck) — lights: iliocostalis lumborum (both sides), iliocostalis thoracis (both sides), longissimus thoracis (both sides), spinalis thoracis (both sides)
- **How this helps your recovery:** Lowering your body slowly works the back of your thighs hard while the muscles lengthen, much like the strain they take when you sprint. Building this strength helps a recovering hamstring cope with fast running and sport.
- **Tissue line:** Muscles and tendons
- **3D view:** yes, starting from the back

- [ ] **Approved** &nbsp;&nbsp; - [ ] **Hide 3D on this page** &nbsp;&nbsp; Notes:

---

### <a id="standing-hamstring-stretch"></a>Standing Hamstring Stretch
_Hamstring · Mobility phase_

Dev page: https://dev.physioonclick.co.uk/exercises/standing-hamstring-stretch

> **Changed in the 1 Nov accuracy pass (high confidence):** Gastrocnemius removed as a helper, because it is only under passive tension, not working.

- **Main focus** (bright blue):
  - **Hamstrings** (back of your thigh) — lights: long head of biceps femoris (both sides), semimembranosus (both sides), semitendinosus (both sides), short head of biceps femoris (both sides)
- **How this helps your recovery:** Hinging forwards from your hips with your raised leg straight gently stretches the back of your thigh. Easing hamstring tightness can make bending, reaching your feet and taking longer strides feel more comfortable.
- **Tissue line:** none (stages strip only)
- **3D view:** yes, starting from the back

- [ ] **Approved** &nbsp;&nbsp; - [ ] **Hide 3D on this page** &nbsp;&nbsp; Notes:

---

### <a id="sit-to-stand-control"></a>Sit to Stand Control
_Lower limb · Early rehab_

Dev page: https://dev.physioonclick.co.uk/exercises/sit-to-stand-control

- **Main focus** (bright blue):
  - **Quadriceps** (front of your thigh) — lights: rectus femoris (both sides), vastus intermedius (both sides), vastus lateralis (both sides), vastus medialis (both sides)
  - **Gluteus maximus** (your main buttock muscle) — lights: gluteus maximus (both sides)
- **Also working** (light blue):
  - **Hamstrings** (back of your thigh) — lights: long head of biceps femoris (both sides), semimembranosus (both sides), semitendinosus (both sides), short head of biceps femoris (both sides)
  - **Gluteus medius** (side of your hip) — lights: gluteus medius (both sides)
- **How this helps your recovery:** Standing up and sitting down slowly strengthens the front of your thighs and your buttocks in a movement you use every day. Practising it with control helps build the strength and confidence to get up from chairs, the toilet and the car more easily.
- **Tissue line:** After surgery
- **3D view:** yes, starting from the front

- [ ] **Approved** &nbsp;&nbsp; - [ ] **Hide 3D on this page** &nbsp;&nbsp; Notes:

---

## Upper limb

### <a id="scapular-setting"></a>Scapular Setting
_Shoulder · Early rehab_

Dev page: https://dev.physioonclick.co.uk/exercises/scapular-setting

- **Main focus** (bright blue):
  - **Lower trapezius** (middle of your back, between and below your shoulder blades) — lights: ascending part of trapezius (both sides)
  - **Middle trapezius** (across your upper back) — lights: transverse part of trapezius (both sides)
- **Also working** (light blue):
  - **Rhomboids** (between your shoulder blades) — lights: rhomboid major (both sides), rhomboid minor (both sides)
- **How this helps your recovery:** Gently drawing your shoulder blades down and slightly together, with only a small effort, wakes up the muscles across your upper and middle back that steady them. A steadier shoulder blade gives your arm a firmer base, which can ease the strain on a sore shoulder when you reach, lift and carry.
- **Tissue line:** Muscles and tendons
- **3D view:** yes, starting from the back

- [ ] **Approved** &nbsp;&nbsp; - [ ] **Hide 3D on this page** &nbsp;&nbsp; Notes:

---

### <a id="shoulder-flexion"></a>Shoulder Flexion
_Shoulder · Mobility phase_

Dev page: https://dev.physioonclick.co.uk/exercises/shoulder-flexion

- **Main focus** (bright blue):
  - **Front deltoid** (front of your shoulder) — lights: clavicular part of deltoid (both sides)
- **Also working** (light blue):
  - **Serratus anterior** (side of your ribs, holding your shoulder blade flat) — lights: serratus anterior (both sides)
  - **Rotator cuff** (four small muscles that keep your shoulder joint centred) — lights: infraspinatus muscle (both sides), subscapularis (both sides), supraspinatus (both sides), teres minor (both sides)
- **How this helps your recovery:** Raising your arm forwards and up works the front of your shoulder, while the muscles around your shoulder blade and joint guide the movement. Gradually reaching a little higher, without forcing into pain, can make it easier to reach a shelf, brush your hair and get dressed.
- **Tissue line:** Muscles and tendons
- **3D view:** yes, starting from the front

- [ ] **Approved** &nbsp;&nbsp; - [ ] **Hide 3D on this page** &nbsp;&nbsp; Notes:

---

### <a id="pendulum-swing"></a>Pendulum Swing
_Shoulder · Early rehab_

Dev page: https://dev.physioonclick.co.uk/exercises/pendulum-swing

- **Main focus** (bright blue):
  - **Shoulder joint bones** (your upper arm bone and shoulder blade, which meet at the shoulder joint) — lights: humerus (both sides), scapula (both sides)
- **How this helps your recovery:** Letting your arm hang and swing from a gentle rock of your body moves your shoulder joint while the muscles around it stay relaxed. Keeping the joint moving like this helps limit stiffness while putting very little load on the repaired tendon, which can make dressing and washing easier to get back to as you recover.
- **Tissue line:** After surgery
- **3D view:** yes, starting from the right side

- [ ] **Approved** &nbsp;&nbsp; - [ ] **Hide 3D on this page** &nbsp;&nbsp; Notes:

---

### <a id="shoulder-external-rotation-band"></a>Shoulder External Rotation (Band)
_Shoulder · Strength phase_

Dev page: https://dev.physioonclick.co.uk/exercises/shoulder-external-rotation-band

- **Main focus** (bright blue):
  - **Infraspinatus** (back of your shoulder blade) — lights: infraspinatus muscle (both sides)
  - **Teres minor** (small muscle under the back of your shoulder) — lights: teres minor (both sides)
- **How this helps your recovery:** Turning your forearm outwards against the band strengthens the rotator cuff muscles on the back of your shoulder blade, which turn your arm out and help keep the ball of your shoulder centred in its socket. Stronger cuff muscles and tendons can help your shoulder cope with reaching, lifting and overhead tasks.
- **Tissue line:** Muscles and tendons
- **3D view:** yes, starting from the back

- [ ] **Approved** &nbsp;&nbsp; - [ ] **Hide 3D on this page** &nbsp;&nbsp; Notes:

---

### <a id="shoulder-internal-rotation-band"></a>Shoulder Internal Rotation (Band)
_Shoulder · Strength phase_

Dev page: https://dev.physioonclick.co.uk/exercises/shoulder-internal-rotation-band

> **Changed in the 1 Nov accuracy pass (medium confidence):** Latissimus dorsi added as a helper (text only, not in the model), because it is a major internal rotator.

- **Main focus** (bright blue):
  - **Subscapularis** (front of your shoulder blade, against your ribs) — lights: subscapularis (both sides)
- **Also working** (light blue):
  - **Pectoralis major** (your chest muscle) — lights: abdominal part of pectoralis major (both sides), clavicular part of pectoralis major (both sides), sternocostal part of pectoralis major (both sides)
  - **Latissimus dorsi** (the broad muscle across your back and side) — not in the 3D model, so not lit
  - **Teres major** (lower edge of your shoulder blade) — lights: teres major (both sides)
- **How this helps your recovery:** Turning your forearm inwards against the band strengthens the rotator cuff muscle on the front of your shoulder blade, with help from your chest muscle. Working it alongside the muscles that turn your arm out helps balance strength around the joint, which can make lifting, pushing and reaching behind your back feel steadier.
- **Tissue line:** Muscles and tendons
- **3D view:** yes, starting from the front
- **Note under the 3D body:** Not in the 3D model, so not lit: latissimus dorsi.

- [ ] **Approved** &nbsp;&nbsp; - [ ] **Hide 3D on this page** &nbsp;&nbsp; Notes:

---

### <a id="wall-slide"></a>Wall Slide
_Shoulder · Mobility phase_

Dev page: https://dev.physioonclick.co.uk/exercises/wall-slide

> **Changed in the 1 Nov accuracy pass (medium confidence):** Whole deltoid narrowed to the front deltoid, because sliding the arms up the wall is shoulder flexion; the rear deltoid is inactive.

- **Main focus** (bright blue):
  - **Serratus anterior** (side of your ribs, holding your shoulder blade flat) — lights: serratus anterior (both sides)
  - **Lower trapezius** (middle of your back, between and below your shoulder blades) — lights: ascending part of trapezius (both sides)
- **Also working** (light blue):
  - **Front deltoid** (front of your shoulder) — lights: clavicular part of deltoid (both sides)
- **How this helps your recovery:** Sliding your forearms up the wall works the muscles that turn your shoulder blades upwards and hold them against your ribs, helping your arms rise smoothly. Gently winning back this overhead range can make reaching into high cupboards, hanging out washing and doing your hair more comfortable.
- **Tissue line:** Muscles and tendons
- **3D view:** yes, starting from the right side

- [ ] **Approved** &nbsp;&nbsp; - [ ] **Hide 3D on this page** &nbsp;&nbsp; Notes:

---

### <a id="sleeper-stretch"></a>Sleeper Stretch
_Shoulder · Mobility phase_

Dev page: https://dev.physioonclick.co.uk/exercises/sleeper-stretch

- **Main focus** (bright blue):
  - **Infraspinatus** (back of your shoulder blade) — lights: infraspinatus muscle (both sides)
  - **Teres minor** (small muscle under the back of your shoulder) — lights: teres minor (both sides)
- **How this helps your recovery:** Gently pressing your forearm towards the floor stretches the muscles and tissues at the back of your shoulder, which can tighten up, especially if you throw or play overhead sports. Easing this tightness can help you get back the inward turn of your arm used for reaching behind your back, tucking in a shirt and throwing.
- **Tissue line:** none (stages strip only)
- **3D view:** yes, starting from the back

- [ ] **Approved** &nbsp;&nbsp; - [ ] **Hide 3D on this page** &nbsp;&nbsp; Notes:

---

### <a id="prone-y-t-w-raises"></a>Prone Y-T-W Raises
_Shoulder · Strength phase_

Dev page: https://dev.physioonclick.co.uk/exercises/prone-y-t-w-raises

- **Main focus** (bright blue):
  - **Lower trapezius** (middle of your back, between and below your shoulder blades) — lights: ascending part of trapezius (both sides)
  - **Middle trapezius** (across your upper back) — lights: transverse part of trapezius (both sides)
  - **Rhomboids** (between your shoulder blades) — lights: rhomboid major (both sides), rhomboid minor (both sides)
- **Also working** (light blue):
  - **Rear deltoid** (back of your shoulder) — lights: spinal part of deltoid (both sides)
  - **Infraspinatus** (back of your shoulder blade) — lights: infraspinatus muscle (both sides)
  - **Teres minor** (small muscle under the back of your shoulder) — lights: teres minor (both sides)
- **How this helps your recovery:** Lifting your arms into Y, T and W shapes works the muscles across your upper and middle back that draw your shoulder blades down and together. Better control of your shoulder blades gives your arm a steadier base, which can help your shoulder move more smoothly when you reach overhead, lift and carry.
- **Tissue line:** Muscles and tendons
- **3D view:** yes, starting from the back

- [ ] **Approved** &nbsp;&nbsp; - [ ] **Hide 3D on this page** &nbsp;&nbsp; Notes:

---

### <a id="scapular-retraction-band-row"></a>Scapular Retraction (Band Row)
_Shoulder · Strength phase_

Dev page: https://dev.physioonclick.co.uk/exercises/scapular-retraction-band-row

> **Changed in the 1 Nov accuracy pass (medium confidence):** Latissimus dorsi added as a helper (text only, not in the model), because pulling the elbows back is shoulder extension, which it drives.

- **Main focus** (bright blue):
  - **Middle trapezius** (across your upper back) — lights: transverse part of trapezius (both sides)
  - **Rhomboids** (between your shoulder blades) — lights: rhomboid major (both sides), rhomboid minor (both sides)
- **Also working** (light blue):
  - **Lower trapezius** (middle of your back, between and below your shoulder blades) — lights: ascending part of trapezius (both sides)
  - **Rear deltoid** (back of your shoulder) — lights: spinal part of deltoid (both sides)
  - **Latissimus dorsi** (the broad muscle across your back and side) — not in the 3D model, so not lit
- **How this helps your recovery:** Pulling your elbows back and drawing your shoulder blades together works the muscles between and just below your shoulder blades. Stronger upper-back muscles give your shoulder blades better control as your arms move, which can ease the strain on a sore shoulder and help with pulling tasks like opening heavy doors.
- **Tissue line:** Muscles and tendons
- **3D view:** yes, starting from the back
- **Note under the 3D body:** Not in the 3D model, so not lit: latissimus dorsi.

- [ ] **Approved** &nbsp;&nbsp; - [ ] **Hide 3D on this page** &nbsp;&nbsp; Notes:

---

### <a id="overhead-press-progression"></a>Overhead Press Progression
_Shoulder · Return to function_

Dev page: https://dev.physioonclick.co.uk/exercises/overhead-press-progression

- **Main focus** (bright blue):
  - **Deltoid** (the rounded muscle over your shoulder) — lights: acromial part of deltoid (both sides), clavicular part of deltoid (both sides), spinal part of deltoid (both sides)
- **Also working** (light blue):
  - **Triceps** (back of your upper arm) — lights: lateral head of triceps brachii (both sides), long head of triceps brachii (both sides), medial head of triceps brachii (both sides)
  - **Serratus anterior** (side of your ribs, holding your shoulder blade flat) — lights: serratus anterior (both sides)
  - **Rotator cuff** (four small muscles that keep your shoulder joint centred) — lights: infraspinatus muscle (both sides), subscapularis (both sides), supraspinatus (both sides), teres minor (both sides)
- **How this helps your recovery:** Pressing light weights overhead strengthens your shoulder muscles and the back of your upper arms, while the muscles around your shoulder blade and joint help steady the movement. Building strength and confidence overhead can help you get back to lifting things onto high shelves, overhead work and sport.
- **Tissue line:** Muscles and tendons
- **3D view:** yes, starting from the right side

- [ ] **Approved** &nbsp;&nbsp; - [ ] **Hide 3D on this page** &nbsp;&nbsp; Notes:

---

### <a id="pendulum-with-light-weight"></a>Pendulum with Light Weight
_Shoulder · Early rehab_

Dev page: https://dev.physioonclick.co.uk/exercises/pendulum-with-light-weight

- **Main focus** (bright blue):
  - **Shoulder joint bones** (your upper arm bone and shoulder blade, which meet at the shoulder joint) — lights: humerus (both sides), scapula (both sides)
- **How this helps your recovery:** Holding a light weight lets gravity gently draw your arm downwards as it swings, which can help ease a stiff, painful shoulder joint while the muscles around it stay relaxed. Keeping a frozen shoulder gently moving like this may help you keep the movement you need for dressing, washing and reaching.
- **Tissue line:** Joints and ligaments
- **3D view:** yes, starting from the right side

- [ ] **Approved** &nbsp;&nbsp; - [ ] **Hide 3D on this page** &nbsp;&nbsp; Notes:

---

### <a id="cross-body-stretch"></a>Cross-Body Stretch
_Shoulder · Mobility phase_

Dev page: https://dev.physioonclick.co.uk/exercises/cross-body-stretch

- **Main focus** (bright blue):
  - **Rear deltoid** (back of your shoulder) — lights: spinal part of deltoid (both sides)
  - **Infraspinatus** (back of your shoulder blade) — lights: infraspinatus muscle (both sides)
  - **Teres minor** (small muscle under the back of your shoulder) — lights: teres minor (both sides)
- **How this helps your recovery:** Drawing your arm across your chest stretches the muscles and tissues at the back of your shoulder, which often tighten after throwing or racquet sports. Easing this tightness can help your shoulder move more freely when you reach across your body, throw or swing a racquet.
- **Tissue line:** none (stages strip only)
- **3D view:** yes, starting from the back

- [ ] **Approved** &nbsp;&nbsp; - [ ] **Hide 3D on this page** &nbsp;&nbsp; Notes:

---

### <a id="push-up-plus-wall-or-floor"></a>Push-Up Plus (Wall or Floor)
_Shoulder · Return to function_

Dev page: https://dev.physioonclick.co.uk/exercises/push-up-plus-wall-or-floor

- **Main focus** (bright blue):
  - **Serratus anterior** (side of your ribs, holding your shoulder blade flat) — lights: serratus anterior (both sides)
- **Also working** (light blue):
  - **Pectoralis major** (your chest muscle) — lights: abdominal part of pectoralis major (both sides), clavicular part of pectoralis major (both sides), sternocostal part of pectoralis major (both sides)
  - **Triceps** (back of your upper arm) — lights: lateral head of triceps brachii (both sides), long head of triceps brachii (both sides), medial head of triceps brachii (both sides)
  - **Front deltoid** (front of your shoulder) — lights: clavicular part of deltoid (both sides)
- **How this helps your recovery:** The extra push at the top of each push-up works the muscle on the side of your ribs that holds your shoulder blade flat and moves it forwards, while the push-up itself works your chest and arms. Better shoulder blade control can help your shoulder cope with pushing, reaching and taking weight through your arms.
- **Tissue line:** Muscles and tendons
- **3D view:** yes, starting from the right side

- [ ] **Approved** &nbsp;&nbsp; - [ ] **Hide 3D on this page** &nbsp;&nbsp; Notes:

---

### <a id="wrist-extensor-stretch"></a>Wrist Extensor Stretch
_Wrist · Mobility phase_

Dev page: https://dev.physioonclick.co.uk/exercises/wrist-extensor-stretch

> **Changed in the 1 Nov accuracy pass (high confidence):** Finger extensors removed as a helper, because they are only partly stretched, not working.

- **Main focus** (bright blue):
  - **Wrist extensors** (top of your forearm, bending your wrist back) — lights: extensor carpi radialis brevis (both sides), extensor carpi radialis longus (both sides), extensor carpi ulnaris (both sides)
- **How this helps your recovery:** With your elbow straight, bending your wrist down stretches the muscles along the top of your forearm, which attach at the outside of your elbow. Easing tightness here can make gripping, lifting and typing more comfortable when tennis elbow is sore.
- **Tissue line:** Muscles and tendons
- **3D view:** yes, starting from the back

- [ ] **Approved** &nbsp;&nbsp; - [ ] **Hide 3D on this page** &nbsp;&nbsp; Notes:

---

### <a id="eccentric-wrist-extension"></a>Eccentric Wrist Extension
_Wrist · Strength phase_

Dev page: https://dev.physioonclick.co.uk/exercises/eccentric-wrist-extension

- **Main focus** (bright blue):
  - **Wrist extensors** (top of your forearm, bending your wrist back) — lights: extensor carpi radialis brevis (both sides), extensor carpi radialis longus (both sides), extensor carpi ulnaris (both sides)
- **How this helps your recovery:** Slowly lowering the weight works the muscles along the top of your forearm as they lengthen, loading the sore tendon at the outside of your elbow in a controlled way. Tendons tend to get stronger and less sensitive with steady loading like this, which can make gripping, lifting and carrying easier.
- **Tissue line:** Muscles and tendons
- **3D view:** yes, starting from the back

- [ ] **Approved** &nbsp;&nbsp; - [ ] **Hide 3D on this page** &nbsp;&nbsp; Notes:

---

### <a id="wrist-flexor-stretch"></a>Wrist Flexor Stretch
_Wrist · Mobility phase_

Dev page: https://dev.physioonclick.co.uk/exercises/wrist-flexor-stretch

> **Changed in the 1 Nov accuracy pass (medium confidence):** Finger flexors moved from helper to main focus, because pulling the fingers back stretches them fully.

- **Main focus** (bright blue):
  - **Wrist flexors** (inside of your forearm, bending your wrist towards your palm) — lights: flexor carpi radialis (both sides), humeral head of flexor carpi ulnaris (both sides), palmaris longus (both sides), ulnar head of flexor carpi ulnaris (both sides)
  - **Finger and thumb flexors** (inside of your forearm, bending your fingers and thumb) — lights: flexor digitorum profundus (both sides), flexor digitorum superficialis (both sides), flexor pollicis longus (both sides)
- **How this helps your recovery:** With your elbow straight, pulling your hand back stretches the muscles on the palm side of your forearm, which attach at the inside of your elbow. Easing tightness here can make gripping, lifting and carrying more comfortable when golfer's elbow is sore.
- **Tissue line:** Muscles and tendons
- **3D view:** yes, starting from the front

- [ ] **Approved** &nbsp;&nbsp; - [ ] **Hide 3D on this page** &nbsp;&nbsp; Notes:

---

### <a id="median-nerve-glide"></a>Median Nerve Glide
_Wrist · Early rehab_

Dev page: https://dev.physioonclick.co.uk/exercises/median-nerve-glide

- **Main focus** (bright blue):
  - **Median nerve** (the nerve running down the inside of your arm to your hand) — not in the 3D model, so not lit
- **How this helps your recovery:** Bending your wrist back as you tilt your head towards that arm, then reversing both, gently slides the median nerve along its path through your arm and wrist. Keeping the nerve moving freely may help settle tingling and discomfort, which can make gripping, writing and typing more comfortable.
- **Tissue line:** Nerves and the brain
- **3D view:** no, none of its main structures is in the 3D model — text only

- [ ] **Approved** &nbsp;&nbsp; - [ ] **Hide 3D on this page** &nbsp;&nbsp; Notes:

---

### <a id="weight-bearing-through-extended-wrist"></a>Weight-Bearing Through Extended Wrist
_Wrist · Return to function_

Dev page: https://dev.physioonclick.co.uk/exercises/weight-bearing-through-extended-wrist

- **Main focus** (bright blue):
  - **Wrist bones** (the eight small bones of your wrist, which form its joints) — lights: capitate (both sides), hamate (both sides), lunate (both sides), pisiform (both sides), scaphoid (both sides), trapezium (both sides), trapezoid (both sides), triquetral (both sides)
  - **Wrist flexors** (inside of your forearm, bending your wrist towards your palm) — lights: flexor carpi radialis (both sides), humeral head of flexor carpi ulnaris (both sides), palmaris longus (both sides), ulnar head of flexor carpi ulnaris (both sides)
- **Also working** (light blue):
  - **Finger and thumb flexors** (inside of your forearm, bending your fingers and thumb) — lights: flexor digitorum profundus (both sides), flexor digitorum superficialis (both sides), flexor pollicis longus (both sides)
- **How this helps your recovery:** Leaning your weight through a flat hand gradually loads the bones and joints of your wrist as it bends back, and stretches the muscles on the palm side of your forearm. Building this tolerance step by step can help your wrist cope with pushing up from a chair, leaning on a worktop and getting up off the floor.
- **Tissue line:** Joints and ligaments
- **3D view:** yes, starting from the front

- [ ] **Approved** &nbsp;&nbsp; - [ ] **Hide 3D on this page** &nbsp;&nbsp; Notes:

---

### <a id="eccentric-wrist-flexion"></a>Eccentric Wrist Flexion
_Wrist · Strength phase_

Dev page: https://dev.physioonclick.co.uk/exercises/eccentric-wrist-flexion

- **Main focus** (bright blue):
  - **Wrist flexors** (inside of your forearm, bending your wrist towards your palm) — lights: flexor carpi radialis (both sides), humeral head of flexor carpi ulnaris (both sides), palmaris longus (both sides), ulnar head of flexor carpi ulnaris (both sides)
- **Also working** (light blue):
  - **Finger and thumb flexors** (inside of your forearm, bending your fingers and thumb) — lights: flexor digitorum profundus (both sides), flexor digitorum superficialis (both sides), flexor pollicis longus (both sides)
- **How this helps your recovery:** Slowly lowering the weight works the muscles on the palm side of your forearm as they lengthen, loading the sore tendon on the inside of your elbow in a controlled way. Tendons tend to get stronger and less sensitive with steady loading like this, which can make gripping, lifting and carrying easier.
- **Tissue line:** Muscles and tendons
- **3D view:** yes, starting from the front

- [ ] **Approved** &nbsp;&nbsp; - [ ] **Hide 3D on this page** &nbsp;&nbsp; Notes:

---

### <a id="resisted-wrist-flexion"></a>Resisted Wrist Flexion
_Wrist · Strength phase_

Dev page: https://dev.physioonclick.co.uk/exercises/resisted-wrist-flexion

- **Main focus** (bright blue):
  - **Wrist flexors** (inside of your forearm, bending your wrist towards your palm) — lights: flexor carpi radialis (both sides), humeral head of flexor carpi ulnaris (both sides), palmaris longus (both sides), ulnar head of flexor carpi ulnaris (both sides)
- **Also working** (light blue):
  - **Finger and thumb flexors** (inside of your forearm, bending your fingers and thumb) — lights: flexor digitorum profundus (both sides), flexor digitorum superficialis (both sides), flexor pollicis longus (both sides)
- **How this helps your recovery:** Curling your wrist up against a light weight or band strengthens the muscles on the palm side of your forearm, both as you lift and as you lower. Stronger forearm muscles and tendons can help ease inner-elbow pain when you grip, and help you get back to lifting and carrying.
- **Tissue line:** Muscles and tendons
- **3D view:** yes, starting from the front

- [ ] **Approved** &nbsp;&nbsp; - [ ] **Hide 3D on this page** &nbsp;&nbsp; Notes:

---

### <a id="forearm-pronation-supination"></a>Forearm Rotation with Weight
_Wrist · Strength phase_

Dev page: https://dev.physioonclick.co.uk/exercises/forearm-pronation-supination

- **Main focus** (bright blue):
  - **Pronators and supinator** (forearm muscles that turn your palm up and down) — lights: humeral head of pronator teres (both sides), pronator quadratus (both sides), supinator (both sides), ulnar head of pronator teres (both sides)
- **Also working** (light blue):
  - **Biceps** (front of your upper arm) — lights: long head of biceps brachii (both sides), short head of biceps brachii (both sides)
  - **Wrist extensors** (top of your forearm, bending your wrist back) — lights: extensor carpi radialis brevis (both sides), extensor carpi radialis longus (both sides), extensor carpi ulnaris (both sides)
  - **Wrist flexors** (inside of your forearm, bending your wrist towards your palm) — lights: flexor carpi radialis (both sides), humeral head of flexor carpi ulnaris (both sides), palmaris longus (both sides), ulnar head of flexor carpi ulnaris (both sides)
- **How this helps your recovery:** Turning your palm up and down against an off-centre weight strengthens the muscles that rotate your forearm, while the muscles around your wrist hold it steady. This builds strength for twisting tasks such as turning keys, opening jars and using door handles, which can be painful with a sore elbow.
- **Tissue line:** Muscles and tendons
- **3D view:** yes, starting from the front

- [ ] **Approved** &nbsp;&nbsp; - [ ] **Hide 3D on this page** &nbsp;&nbsp; Notes:

---

### <a id="wrist-extension-isotonic"></a>Wrist Extension with Weight
_Wrist · Strength phase_

Dev page: https://dev.physioonclick.co.uk/exercises/wrist-extension-isotonic

- **Main focus** (bright blue):
  - **Wrist extensors** (top of your forearm, bending your wrist back) — lights: extensor carpi radialis brevis (both sides), extensor carpi radialis longus (both sides), extensor carpi ulnaris (both sides)
- **How this helps your recovery:** Lifting and lowering a light weight with your wrist, as far as is comfortable each way, strengthens the muscles along the top of your forearm and their tendon at the outside of your elbow. Steadily building this strength can make gripping, lifting and racquet sports easier to get back to.
- **Tissue line:** Muscles and tendons
- **3D view:** yes, starting from the back

- [ ] **Approved** &nbsp;&nbsp; - [ ] **Hide 3D on this page** &nbsp;&nbsp; Notes:

---

### <a id="elbow-flexion-extension"></a>Elbow Flexion/Extension
_Elbow · Early rehab_

Dev page: https://dev.physioonclick.co.uk/exercises/elbow-flexion-extension

- **Main focus** (bright blue):
  - **Biceps** (front of your upper arm) — lights: long head of biceps brachii (both sides), short head of biceps brachii (both sides)
  - **Brachialis** (deep front of your upper arm) — lights: brachialis (both sides)
- **Also working** (light blue):
  - **Brachioradialis** (thumb side of your forearm, helping bend your elbow) — lights: brachioradialis (both sides)
  - **Triceps** (back of your upper arm) — lights: lateral head of triceps brachii (both sides), long head of triceps brachii (both sides), medial head of triceps brachii (both sides)
- **How this helps your recovery:** Slowly bending and straightening your elbow works the muscles at the front of your upper arm, while the back of your arm eases into a stretch as you bend. Keeping the joint moving after a fracture helps limit stiffness, which can make eating, washing your face and reaching for things easier.
- **Tissue line:** Joints and ligaments
- **3D view:** yes, starting from the front

- [ ] **Approved** &nbsp;&nbsp; - [ ] **Hide 3D on this page** &nbsp;&nbsp; Notes:

---

### <a id="tyler-twist-flexbar"></a>Tyler Twist (Resistance Bar)
_Elbow · Strength phase_

Dev page: https://dev.physioonclick.co.uk/exercises/tyler-twist-flexbar

- **Main focus** (bright blue):
  - **Wrist extensors** (top of your forearm, bending your wrist back) — lights: extensor carpi radialis brevis (both sides), extensor carpi radialis longus (both sides), extensor carpi ulnaris (both sides)
- **Also working** (light blue):
  - **Finger and thumb flexors** (inside of your forearm, bending your fingers and thumb) — lights: flexor digitorum profundus (both sides), flexor digitorum superficialis (both sides), flexor pollicis longus (both sides)
- **How this helps your recovery:** Letting the bar untwist slowly makes the muscles along the top of your forearm work as they lengthen, loading the sore tendon at the outside of your elbow with your arm straight. Steady, controlled loading like this can help the tendon become less sensitive and stronger for gripping, lifting and sport.
- **Tissue line:** Muscles and tendons
- **3D view:** yes, starting from the back

- [ ] **Approved** &nbsp;&nbsp; - [ ] **Hide 3D on this page** &nbsp;&nbsp; Notes:

---

### <a id="grip-strengthening"></a>Grip Strengthening
_Hand · Strength phase_

Dev page: https://dev.physioonclick.co.uk/exercises/grip-strengthening

- **Main focus** (bright blue):
  - **Finger and thumb flexors** (inside of your forearm, bending your fingers and thumb) — lights: flexor digitorum profundus (both sides), flexor digitorum superficialis (both sides), flexor pollicis longus (both sides)
  - **Small hand muscles** (the muscles in your palm and between the bones of your hand) — lights: abductor digiti minimi of hand (both sides), abductor pollicis brevis (both sides), flexor digiti minimi brevis of hand (both sides), flexor pollicis brevis (both sides), oblique head of adductor pollicis (both sides), opponens digiti minimi of hand (both sides), opponens pollicis (both sides), set of dorsal interossei of hand (both sides), set of lumbricals of hand (both sides), set of palmar interossei of hand (both sides), superficial head of flexor pollicis brevis (both sides), transverse head of adductor pollicis (both sides)
- **Also working** (light blue):
  - **Wrist extensors** (top of your forearm, bending your wrist back) — lights: extensor carpi radialis brevis (both sides), extensor carpi radialis longus (both sides), extensor carpi ulnaris (both sides)
- **How this helps your recovery:** Squeezing a soft ball or putty works the forearm muscles that bend your fingers, along with the small muscles in your hand and thumb. Rebuilding grip strength can make everyday tasks like opening jars, carrying shopping and holding a cup easier after an injury or a spell in a cast.
- **Tissue line:** Muscles and tendons
- **3D view:** yes, starting from the front

- [ ] **Approved** &nbsp;&nbsp; - [ ] **Hide 3D on this page** &nbsp;&nbsp; Notes:

---

### <a id="tendon-glide-exercises"></a>Tendon Glide Exercises
_Hand · Early rehab_

Dev page: https://dev.physioonclick.co.uk/exercises/tendon-glide-exercises

> **Changed in the 1 Nov accuracy pass (medium confidence):** Median nerve moved from helper to main focus (text only), because the nerve is a structure being glided, not a helper muscle.

- **Main focus** (bright blue):
  - **Finger and thumb flexors** (inside of your forearm, bending your fingers and thumb) — lights: flexor digitorum profundus (both sides), flexor digitorum superficialis (both sides), flexor pollicis longus (both sides)
  - **Median nerve** (the nerve running down the inside of your arm to your hand) — not in the 3D model, so not lit
- **Also working** (light blue):
  - **Small hand muscles** (the muscles in your palm and between the bones of your hand) — lights: abductor digiti minimi of hand (both sides), abductor pollicis brevis (both sides), flexor digiti minimi brevis of hand (both sides), flexor pollicis brevis (both sides), oblique head of adductor pollicis (both sides), opponens digiti minimi of hand (both sides), opponens pollicis (both sides), set of dorsal interossei of hand (both sides), set of lumbricals of hand (both sides), set of palmar interossei of hand (both sides), superficial head of flexor pollicis brevis (both sides), transverse head of adductor pollicis (both sides)
- **How this helps your recovery:** Moving your fingers through a set of shapes helps the tendons that bend them, and the median nerve beside them, glide through the tunnel at your wrist. Keeping them moving freely may help ease stiffness and tingling, which can make gripping, writing and fine hand tasks more comfortable.
- **Tissue line:** Nerves and the brain
- **3D view:** yes, starting from the front
- **Note under the 3D body:** Not in the 3D model, so not lit: median nerve.

- [ ] **Approved** &nbsp;&nbsp; - [ ] **Hide 3D on this page** &nbsp;&nbsp; Notes:

---

## Spine and neck

### <a id="bridge-progression"></a>Bridge Progression
_Lumbar spine · Strength phase_

Dev page: https://dev.physioonclick.co.uk/exercises/bridge-progression

- **Main focus** (bright blue):
  - **Gluteus maximus** (your main buttock muscle) — lights: gluteus maximus (both sides)
- **Also working** (light blue):
  - **Hamstrings** (back of your thigh) — lights: long head of biceps femoris (both sides), semimembranosus (both sides), semitendinosus (both sides), short head of biceps femoris (both sides)
  - **Erector spinae (trunk part)** (the long muscles either side of your spine, from your pelvis up to the base of your neck) — lights: iliocostalis lumborum (both sides), iliocostalis thoracis (both sides), longissimus thoracis (both sides), spinalis thoracis (both sides)
  - **Gluteus medius** (side of your hip) — lights: gluteus medius (both sides)
- **How this helps your recovery:** Lifting and lowering your hips with control strengthens your buttock muscles, with help from the backs of your thighs and the long muscles beside your spine. Stronger hip and trunk muscles help share the load with your back, which can make bending, lifting and getting up from a chair feel easier.
- **Tissue line:** none (stages strip only)
- **3D view:** yes, starting from the back

- [ ] **Approved** &nbsp;&nbsp; - [ ] **Hide 3D on this page** &nbsp;&nbsp; Notes:

---

### <a id="bird-dog"></a>Bird Dog
_Lumbar spine · Strength phase_

Dev page: https://dev.physioonclick.co.uk/exercises/bird-dog

- **Main focus** (bright blue):
  - **Erector spinae (trunk part)** (the long muscles either side of your spine, from your pelvis up to the base of your neck) — lights: iliocostalis lumborum (both sides), iliocostalis thoracis (both sides), longissimus thoracis (both sides), spinalis thoracis (both sides)
  - **Multifidus** (small deep muscles that steady each joint of your lower back) — not in the 3D model, so not lit
- **Also working** (light blue):
  - **Gluteus maximus** (your main buttock muscle) — lights: gluteus maximus (both sides)
  - **External oblique** (side of your tummy) — lights: external oblique (both sides)
- **How this helps your recovery:** Reaching out one arm and the opposite leg while your back stays still trains the muscles beside your spine, including the small deep ones, to hold it steady. Better control of your back while your arms and legs move can help you bend, reach and carry with more confidence.
- **Tissue line:** none (stages strip only)
- **3D view:** yes, starting from the back
- **Note under the 3D body:** Not in the 3D model, so not lit: multifidus.

- [ ] **Approved** &nbsp;&nbsp; - [ ] **Hide 3D on this page** &nbsp;&nbsp; Notes:

---

### <a id="mckenzie-press-up"></a>McKenzie Press-Up
_Lumbar spine · Early rehab_

Dev page: https://dev.physioonclick.co.uk/exercises/mckenzie-press-up

- **Main focus** (bright blue):
  - **Lower back discs** (the cushions between the bones of your lower back) — lights: intervertebral disk of fifth lumbar vertebra, intervertebral disk of first lumbar vertebra, intervertebral disk of fourth lumbar vertebra, intervertebral disk of second lumbar vertebra, intervertebral disk of third lumbar vertebra
  - **Lower back vertebrae and sacrum** (the five bones of your lower back and the sacrum below them, which form its joints) — lights: fifth lumbar vertebra, first lumbar vertebra, fourth lumbar vertebra, sacrum, second lumbar vertebra, third lumbar vertebra
- **How this helps your recovery:** Pressing your upper body up while your hips stay relaxed gently bends your lower back backwards, moving its joints and discs. For many people, repeating it helps back and leg symptoms ease, or move up out of the leg towards the back, which is a good sign. This can make sitting, standing and walking more comfortable.
- **Tissue line:** none (stages strip only)
- **3D view:** yes, starting from the right side

- [ ] **Approved** &nbsp;&nbsp; - [ ] **Hide 3D on this page** &nbsp;&nbsp; Notes:

---

### <a id="standing-extension"></a>Standing Extension
_Lumbar spine · Mobility phase_

Dev page: https://dev.physioonclick.co.uk/exercises/standing-extension

- **Main focus** (bright blue):
  - **Lower back discs** (the cushions between the bones of your lower back) — lights: intervertebral disk of fifth lumbar vertebra, intervertebral disk of first lumbar vertebra, intervertebral disk of fourth lumbar vertebra, intervertebral disk of second lumbar vertebra, intervertebral disk of third lumbar vertebra
  - **Lower back vertebrae and sacrum** (the five bones of your lower back and the sacrum below them, which form its joints) — lights: fifth lumbar vertebra, first lumbar vertebra, fourth lumbar vertebra, sacrum, second lumbar vertebra, third lumbar vertebra
- **How this helps your recovery:** Leaning gently backwards from standing takes the joints and discs of your lower back into a backward bend, like the press-up does, without needing to lie down. Because you can do it almost anywhere, it can be a handy way to ease your back between exercise sessions or after a long spell of sitting.
- **Tissue line:** none (stages strip only)
- **3D view:** yes, starting from the right side

- [ ] **Approved** &nbsp;&nbsp; - [ ] **Hide 3D on this page** &nbsp;&nbsp; Notes:

---

### <a id="prone-cobra"></a>Prone Cobra
_Lumbar spine · Strength phase_

Dev page: https://dev.physioonclick.co.uk/exercises/prone-cobra

- **Main focus** (bright blue):
  - **Erector spinae (trunk part)** (the long muscles either side of your spine, from your pelvis up to the base of your neck) — lights: iliocostalis lumborum (both sides), iliocostalis thoracis (both sides), longissimus thoracis (both sides), spinalis thoracis (both sides)
  - **Middle trapezius** (across your upper back) — lights: transverse part of trapezius (both sides)
  - **Lower trapezius** (middle of your back, between and below your shoulder blades) — lights: ascending part of trapezius (both sides)
- **Also working** (light blue):
  - **Rhomboids** (between your shoulder blades) — lights: rhomboid major (both sides), rhomboid minor (both sides)
- **How this helps your recovery:** Lifting your chest a small way off the floor works the long muscles beside your spine and the muscles between your shoulder blades. Building their endurance can help you sit at a desk or stand for longer in comfort, without your back tiring so quickly.
- **Tissue line:** none (stages strip only)
- **3D view:** yes, starting from the back

- [ ] **Approved** &nbsp;&nbsp; - [ ] **Hide 3D on this page** &nbsp;&nbsp; Notes:

---

### <a id="side-plank-modified"></a>Side Plank (Modified)
_Lumbar spine · Strength phase_

Dev page: https://dev.physioonclick.co.uk/exercises/side-plank-modified

- **Main focus** (bright blue):
  - **External oblique** (side of your tummy) — lights: external oblique (both sides)
  - **Quadratus lumborum** (deep muscle between your lowest rib and your pelvis) — not in the 3D model, so not lit
- **Also working** (light blue):
  - **Gluteus medius** (side of your hip) — lights: gluteus medius (both sides)
- **How this helps your recovery:** Holding your body in a straight line on your side works the muscles down the side of your trunk that stop it bending sideways. Stronger side muscles can help keep your back steady when you carry a bag in one hand, reach to one side or get in and out of bed.
- **Tissue line:** none (stages strip only)
- **3D view:** yes, starting from the right side
- **Note under the 3D body:** Not in the 3D model, so not lit: quadratus lumborum.

- [ ] **Approved** &nbsp;&nbsp; - [ ] **Hide 3D on this page** &nbsp;&nbsp; Notes:

---

### <a id="segmental-rolling"></a>Segmental Rolling
_Lumbar spine · Early rehab_

Dev page: https://dev.physioonclick.co.uk/exercises/segmental-rolling

- **Main focus** (bright blue):
  - **Mid-back vertebrae** (the 12 bones of your spine between your neck and lower back, which form its joints) — lights: eighth thoracic vertebra, eleventh thoracic vertebra, fifth thoracic vertebra, first thoracic vertebra, fourth thoracic vertebra, ninth thoracic vertebra, second thoracic vertebra, seventh thoracic vertebra, sixth thoracic vertebra, tenth thoracic vertebra, third thoracic vertebra, twelfth thoracic vertebra
  - **Lower back vertebrae and sacrum** (the five bones of your lower back and the sacrum below them, which form its joints) — lights: fifth lumbar vertebra, first lumbar vertebra, fourth lumbar vertebra, sacrum, second lumbar vertebra, third lumbar vertebra
- **How this helps your recovery:** Rolling onto your side one part at a time gently moves your mid and lower back without needing a big effort. Finding a slow, relaxed way to roll during a flare-up can make getting in and out of bed easier and help you move with confidence while your back settles.
- **Tissue line:** none (stages strip only)
- **3D view:** yes, starting from the back

- [ ] **Approved** &nbsp;&nbsp; - [ ] **Hide 3D on this page** &nbsp;&nbsp; Notes:

---

### <a id="pelvic-tilt"></a>Pelvic Tilt
_Lumbar spine · Early rehab_

Dev page: https://dev.physioonclick.co.uk/exercises/pelvic-tilt

- **Main focus** (bright blue):
  - **Lower back vertebrae and sacrum** (the five bones of your lower back and the sacrum below them, which form its joints) — lights: fifth lumbar vertebra, first lumbar vertebra, fourth lumbar vertebra, sacrum, second lumbar vertebra, third lumbar vertebra
  - **Rectus abdominis** (the long muscle down the front of your tummy) — not in the 3D model, so not lit
- **How this helps your recovery:** Gently tightening your lower tummy rolls your pelvis back, so your lower back flattens and then releases in a small, easy rocking movement. Moving your lower back like this can ease tension and stiffness during and after pregnancy, which may make standing, walking and getting comfortable in bed easier.
- **Tissue line:** none (stages strip only)
- **3D view:** yes, starting from the right side
- **Note under the 3D body:** Not in the 3D model, so not lit: rectus abdominis.

- [ ] **Approved** &nbsp;&nbsp; - [ ] **Hide 3D on this page** &nbsp;&nbsp; Notes:

---

### <a id="quadruped-arm-leg-reach"></a>Quadruped Arm/Leg Reach
_Lumbar spine · Return to function_

Dev page: https://dev.physioonclick.co.uk/exercises/quadruped-arm-leg-reach

- **Main focus** (bright blue):
  - **Erector spinae (trunk part)** (the long muscles either side of your spine, from your pelvis up to the base of your neck) — lights: iliocostalis lumborum (both sides), iliocostalis thoracis (both sides), longissimus thoracis (both sides), spinalis thoracis (both sides)
  - **Multifidus** (small deep muscles that steady each joint of your lower back) — not in the 3D model, so not lit
- **Also working** (light blue):
  - **Gluteus maximus** (your main buttock muscle) — lights: gluteus maximus (both sides)
  - **External oblique** (side of your tummy) — lights: external oblique (both sides)
  - **Iliopsoas** (deep hip flexor at the front of your hip) — lights: iliacus (both sides), psoas major (both sides)
- **How this helps your recovery:** Reaching out and then drawing your elbow and knee in, while your back stays still, makes the muscles beside your spine and around your trunk work harder to keep you steady. Building this control while you balance can help you trust your back again in busier tasks, such as gardening, sport and lifting.
- **Tissue line:** none (stages strip only)
- **3D view:** yes, starting from the back
- **Note under the 3D body:** Not in the 3D model, so not lit: multifidus.

- [ ] **Approved** &nbsp;&nbsp; - [ ] **Hide 3D on this page** &nbsp;&nbsp; Notes:

---

### <a id="lumbar-flexion-in-lying"></a>Lumbar Flexion in Lying
_Lumbar spine · Early rehab_

Dev page: https://dev.physioonclick.co.uk/exercises/lumbar-flexion-in-lying

- **Main focus** (bright blue):
  - **Lower back vertebrae and sacrum** (the five bones of your lower back and the sacrum below them, which form its joints) — lights: fifth lumbar vertebra, first lumbar vertebra, fourth lumbar vertebra, sacrum, second lumbar vertebra, third lumbar vertebra
  - **Erector spinae (trunk part)** (the long muscles either side of your spine, from your pelvis up to the base of your neck) — lights: iliocostalis lumborum (both sides), iliocostalis thoracis (both sides), longissimus thoracis (both sides), spinalis thoracis (both sides)
- **How this helps your recovery:** Drawing your knees towards your chest gently rounds your lower back, stretching the muscles beside your spine and, for many people, giving the nerves a little more room. If you have spinal stenosis, you may find this position eases your back and leg symptoms, making it a useful way to settle things after standing or walking.
- **Tissue line:** none (stages strip only)
- **3D view:** yes, starting from the back

- [ ] **Approved** &nbsp;&nbsp; - [ ] **Hide 3D on this page** &nbsp;&nbsp; Notes:

---

### <a id="sciatic-nerve-glide"></a>Sciatic Nerve Glide
_Lumbar spine · Early rehab_

Dev page: https://dev.physioonclick.co.uk/exercises/sciatic-nerve-glide

- **Main focus** (bright blue):
  - **Sciatic nerve** (the nerve running from your lower back down the back of your leg) — not in the 3D model, so not lit
- **How this helps your recovery:** Straightening your knee as you look up, then bending it as you look down, helps your sciatic nerve slide gently back and forth without being stretched hard. Keeping the nerve moving like this can ease sensitivity down your leg, which may make sitting, walking and bending more comfortable.
- **Tissue line:** Nerves and the brain
- **3D view:** no, none of its main structures is in the 3D model — text only

- [ ] **Approved** &nbsp;&nbsp; - [ ] **Hide 3D on this page** &nbsp;&nbsp; Notes:

---

### <a id="functional-lifting-pattern"></a>Functional Lifting Pattern
_Lumbar spine · Return to function_

Dev page: https://dev.physioonclick.co.uk/exercises/functional-lifting-pattern

- **Main focus** (bright blue):
  - **Gluteus maximus** (your main buttock muscle) — lights: gluteus maximus (both sides)
  - **Quadriceps** (front of your thigh) — lights: rectus femoris (both sides), vastus intermedius (both sides), vastus lateralis (both sides), vastus medialis (both sides)
- **Also working** (light blue):
  - **Hamstrings** (back of your thigh) — lights: long head of biceps femoris (both sides), semimembranosus (both sides), semitendinosus (both sides), short head of biceps femoris (both sides)
  - **Erector spinae (trunk part)** (the long muscles either side of your spine, from your pelvis up to the base of your neck) — lights: iliocostalis lumborum (both sides), iliocostalis thoracis (both sides), longissimus thoracis (both sides), spinalis thoracis (both sides)
- **How this helps your recovery:** Lifting a light object by bending at your hips and knees lets your buttock and thigh muscles drive the lift, while the long muscles beside your spine keep your back steady. Practising with light loads and building up gradually can help you lift at home and at work with more confidence.
- **Tissue line:** none (stages strip only)
- **3D view:** yes, starting from the right side

- [ ] **Approved** &nbsp;&nbsp; - [ ] **Hide 3D on this page** &nbsp;&nbsp; Notes:

---

### <a id="neck-rotation-range"></a>Neck Rotation Range
_Cervical spine · Early rehab_

Dev page: https://dev.physioonclick.co.uk/exercises/neck-rotation-range

- **Main focus** (bright blue):
  - **Neck vertebrae** (the seven bones of your spine in your neck, which form its joints) — lights: atlas, axis, fifth cervical vertebra, fourth cervical vertebra, seventh cervical vertebra, sixth cervical vertebra, third cervical vertebra
- **Also working** (light blue):
  - **Sternocleidomastoid** (the muscle running down the side of your neck) — lights: sternocleidomastoid (both sides)
  - **Neck extensors** (the muscles at the back of your neck) — lights: cervical rotator (both sides), iliocostalis cervicis (both sides), longissimus capitis (both sides), longissimus cervicis (both sides), obliquus capitis inferior (both sides), obliquus capitis superior (both sides), rectus capitis posterior major (both sides), rectus capitis posterior minor (both sides), semispinalis capitis (both sides), semispinalis cervicis (both sides), set of interspinales cervicis, spinalis, splenius capitis (both sides), splenius cervicis (both sides)
- **How this helps your recovery:** Slowly turning your head from side to side moves the small joints of your neck through a comfortable range, with the muscles at the side and back of your neck doing the turning. Keeping your neck moving can ease stiffness and make it easier to look over your shoulder when you drive or cross the road.
- **Tissue line:** none (stages strip only)
- **3D view:** yes, starting from the back

- [ ] **Approved** &nbsp;&nbsp; - [ ] **Hide 3D on this page** &nbsp;&nbsp; Notes:

---

### <a id="neck-side-flexion-stretch"></a>Neck Side Flexion Stretch
_Cervical spine · Early rehab_

Dev page: https://dev.physioonclick.co.uk/exercises/neck-side-flexion-stretch

> **Changed in the 1 Nov accuracy pass (medium confidence):** Levator scapulae removed as a helper, because it is only stretched a little, not working.

- **Main focus** (bright blue):
  - **Upper trapezius** (top of your shoulders and neck) — lights: descending part of trapezius (both sides)
  - **Scalenes** (deep side of your neck) — lights: scalenus anterior (both sides), scalenus medius (both sides), scalenus posterior (both sides)
- **How this helps your recovery:** Tilting your ear towards your shoulder gently stretches the muscles down the opposite side of your neck and across the top of the shoulder on that side. Easing tightness here can make your neck feel looser and more comfortable when you look around or sit for long spells.
- **Tissue line:** none (stages strip only)
- **3D view:** yes, starting from the back

- [ ] **Approved** &nbsp;&nbsp; - [ ] **Hide 3D on this page** &nbsp;&nbsp; Notes:

---

### <a id="isometric-neck-hold"></a>Isometric Neck Hold
_Cervical spine · Strength phase_

Dev page: https://dev.physioonclick.co.uk/exercises/isometric-neck-hold

- **Main focus** (bright blue):
  - **Sternocleidomastoid** (the muscle running down the side of your neck) — lights: sternocleidomastoid (both sides)
  - **Scalenes** (deep side of your neck) — lights: scalenus anterior (both sides), scalenus medius (both sides), scalenus posterior (both sides)
  - **Neck extensors** (the muscles at the back of your neck) — lights: cervical rotator (both sides), iliocostalis cervicis (both sides), longissimus capitis (both sides), longissimus cervicis (both sides), obliquus capitis inferior (both sides), obliquus capitis superior (both sides), rectus capitis posterior major (both sides), rectus capitis posterior minor (both sides), semispinalis capitis (both sides), semispinalis cervicis (both sides), set of interspinales cervicis, spinalis, splenius capitis (both sides), splenius cervicis (both sides)
- **Also working** (light blue):
  - **Deep neck flexors** (deep muscles at the front of your neck) — lights: inferior oblique part of longus colli (both sides), longus capitis (both sides), rectus capitis anterior (both sides), superior oblique part of longus colli (both sides), vertical intermediate part of longus colli (both sides)
- **How this helps your recovery:** Pressing your head gently into your hand, which stops it moving, makes the muscles all around your neck work while the joints stay still. Building their endurance with light, steady holds can help your neck cope better with driving, desk work and everyday tasks after whiplash.
- **Tissue line:** Joints and ligaments
- **3D view:** yes, starting from the right side

- [ ] **Approved** &nbsp;&nbsp; - [ ] **Hide 3D on this page** &nbsp;&nbsp; Notes:

---

### <a id="standing-chin-retraction"></a>Standing Chin Retraction
_Cervical spine · Early rehab_

Dev page: https://dev.physioonclick.co.uk/exercises/standing-chin-retraction

- **Main focus** (bright blue):
  - **Deep neck flexors** (deep muscles at the front of your neck) — lights: inferior oblique part of longus colli (both sides), longus capitis (both sides), rectus capitis anterior (both sides), superior oblique part of longus colli (both sides), vertical intermediate part of longus colli (both sides)
- **Also working** (light blue):
  - **Neck extensors** (the muscles at the back of your neck) — lights: cervical rotator (both sides), iliocostalis cervicis (both sides), longissimus capitis (both sides), longissimus cervicis (both sides), obliquus capitis inferior (both sides), obliquus capitis superior (both sides), rectus capitis posterior major (both sides), rectus capitis posterior minor (both sides), semispinalis capitis (both sides), semispinalis cervicis (both sides), set of interspinales cervicis, spinalis, splenius capitis (both sides), splenius cervicis (both sides)
- **How this helps your recovery:** With your head against the wall, gliding your chin straight back works the deep muscles at the front of your neck and gently stretches the small muscles at the base of your skull. Easing tension at the top of your neck may help reduce headaches that start there and make long spells at a screen more comfortable.
- **Tissue line:** none (stages strip only)
- **3D view:** yes, starting from the right side

- [ ] **Approved** &nbsp;&nbsp; - [ ] **Hide 3D on this page** &nbsp;&nbsp; Notes:

---

### <a id="levator-scapulae-stretch"></a>Levator Scapulae Stretch
_Cervical spine · Mobility phase_

Dev page: https://dev.physioonclick.co.uk/exercises/levator-scapulae-stretch

> **Changed in the 1 Nov accuracy pass (high confidence):** Upper trapezius removed as a helper, because it does no work while the hand holds the shoulder down.

- **Main focus** (bright blue):
  - **Levator scapulae** (side and back of your neck) — lights: levator scapulae (both sides)
- **How this helps your recovery:** Looking down towards the opposite armpit, with your hand keeping your shoulder down, stretches the muscle that runs from the side of your neck to the top of your shoulder blade. Easing tightness here can make turning and tilting your head more comfortable and may ease the ache at the base of your neck.
- **Tissue line:** none (stages strip only)
- **3D view:** yes, starting from the back

- [ ] **Approved** &nbsp;&nbsp; - [ ] **Hide 3D on this page** &nbsp;&nbsp; Notes:

---

### <a id="deep-neck-flexor-hold"></a>Deep Neck Flexor Endurance Hold
_Cervical spine · Strength phase_

Dev page: https://dev.physioonclick.co.uk/exercises/deep-neck-flexor-hold

- **Main focus** (bright blue):
  - **Deep neck flexors** (deep muscles at the front of your neck) — lights: inferior oblique part of longus colli (both sides), longus capitis (both sides), rectus capitis anterior (both sides), superior oblique part of longus colli (both sides), vertical intermediate part of longus colli (both sides)
- **How this helps your recovery:** Holding a tiny, gentle nod trains the deep muscles at the front of your neck, which help hold it steady, without the bigger surface muscles taking over. Building their endurance can help your neck cope better with desk work and screen time, and may mean neck pain flares up less often.
- **Tissue line:** none (stages strip only)
- **3D view:** yes, starting from the right side

- [ ] **Approved** &nbsp;&nbsp; - [ ] **Hide 3D on this page** &nbsp;&nbsp; Notes:

---

### <a id="prone-neck-extension"></a>Prone Neck Extension
_Cervical spine · Return to function_

Dev page: https://dev.physioonclick.co.uk/exercises/prone-neck-extension

- **Main focus** (bright blue):
  - **Neck extensors** (the muscles at the back of your neck) — lights: cervical rotator (both sides), iliocostalis cervicis (both sides), longissimus capitis (both sides), longissimus cervicis (both sides), obliquus capitis inferior (both sides), obliquus capitis superior (both sides), rectus capitis posterior major (both sides), rectus capitis posterior minor (both sides), semispinalis capitis (both sides), semispinalis cervicis (both sides), set of interspinales cervicis, spinalis, splenius capitis (both sides), splenius cervicis (both sides)
- **Also working** (light blue):
  - **Deep neck flexors** (deep muscles at the front of your neck) — lights: inferior oblique part of longus colli (both sides), longus capitis (both sides), rectus capitis anterior (both sides), superior oblique part of longus colli (both sides), vertical intermediate part of longus colli (both sides)
- **How this helps your recovery:** Lifting your head level against gravity, with your chin gently tucked, strengthens the muscles at the back of your neck that hold your head up. Stronger neck muscles with more stamina can help you hold your head comfortably for longer at a desk, behind the wheel or when reading.
- **Tissue line:** none (stages strip only)
- **3D view:** yes, starting from the back

- [ ] **Approved** &nbsp;&nbsp; - [ ] **Hide 3D on this page** &nbsp;&nbsp; Notes:

---

### <a id="chin-tuck"></a>Chin Tuck
_Neck · Early rehab_

Dev page: https://dev.physioonclick.co.uk/exercises/chin-tuck

- **Main focus** (bright blue):
  - **Deep neck flexors** (deep muscles at the front of your neck) — lights: inferior oblique part of longus colli (both sides), longus capitis (both sides), rectus capitis anterior (both sides), superior oblique part of longus colli (both sides), vertical intermediate part of longus colli (both sides)
- **Also working** (light blue):
  - **Neck extensors** (the muscles at the back of your neck) — lights: cervical rotator (both sides), iliocostalis cervicis (both sides), longissimus capitis (both sides), longissimus cervicis (both sides), obliquus capitis inferior (both sides), obliquus capitis superior (both sides), rectus capitis posterior major (both sides), rectus capitis posterior minor (both sides), semispinalis capitis (both sides), semispinalis cervicis (both sides), set of interspinales cervicis, spinalis, splenius capitis (both sides), splenius cervicis (both sides)
- **How this helps your recovery:** Sliding your chin straight back, like a drawer closing, gently works the deep muscles at the front of your neck and eases the muscles at the base of your skull. Practising this small movement can ease neck stiffness and help you sit and use a screen with your head comfortably balanced.
- **Tissue line:** none (stages strip only)
- **3D view:** yes, starting from the right side

- [ ] **Approved** &nbsp;&nbsp; - [ ] **Hide 3D on this page** &nbsp;&nbsp; Notes:

---

### <a id="cat-cow-stretch"></a>Cat-Cow Stretch
_Thoracic spine · Early rehab_

Dev page: https://dev.physioonclick.co.uk/exercises/cat-cow-stretch

- **Main focus** (bright blue):
  - **Mid-back vertebrae** (the 12 bones of your spine between your neck and lower back, which form its joints) — lights: eighth thoracic vertebra, eleventh thoracic vertebra, fifth thoracic vertebra, first thoracic vertebra, fourth thoracic vertebra, ninth thoracic vertebra, second thoracic vertebra, seventh thoracic vertebra, sixth thoracic vertebra, tenth thoracic vertebra, third thoracic vertebra, twelfth thoracic vertebra
  - **Lower back vertebrae and sacrum** (the five bones of your lower back and the sacrum below them, which form its joints) — lights: fifth lumbar vertebra, first lumbar vertebra, fourth lumbar vertebra, sacrum, second lumbar vertebra, third lumbar vertebra
- **Also working** (light blue):
  - **Erector spinae (trunk part)** (the long muscles either side of your spine, from your pelvis up to the base of your neck) — lights: iliocostalis lumborum (both sides), iliocostalis thoracis (both sides), longissimus thoracis (both sides), spinalis thoracis (both sides)
- **How this helps your recovery:** Slowly rounding and then gently arching your back, in time with your breathing, moves each part of your spine through a comfortable range. Keeping your mid and lower back moving like this can ease stiffness and make bending and reaching feel freer.
- **Tissue line:** none (stages strip only)
- **3D view:** yes, starting from the back

- [ ] **Approved** &nbsp;&nbsp; - [ ] **Hide 3D on this page** &nbsp;&nbsp; Notes:

---

### <a id="thoracic-rotation-open-book"></a>Thoracic Rotation (Open Book)
_Thoracic spine · Mobility phase_

Dev page: https://dev.physioonclick.co.uk/exercises/thoracic-rotation-open-book

> **Changed in the 1 Nov accuracy pass (medium confidence):** Pectoralis major moved from helper to main focus, because it is being stretched as the arm opens, not working.

- **Main focus** (bright blue):
  - **Mid-back vertebrae** (the 12 bones of your spine between your neck and lower back, which form its joints) — lights: eighth thoracic vertebra, eleventh thoracic vertebra, fifth thoracic vertebra, first thoracic vertebra, fourth thoracic vertebra, ninth thoracic vertebra, second thoracic vertebra, seventh thoracic vertebra, sixth thoracic vertebra, tenth thoracic vertebra, third thoracic vertebra, twelfth thoracic vertebra
  - **Pectoralis major** (your chest muscle) — lights: abdominal part of pectoralis major (both sides), clavicular part of pectoralis major (both sides), sternocostal part of pectoralis major (both sides)
- **How this helps your recovery:** Opening your top arm towards the ceiling while your knees stay together turns your mid-back and gently stretches across the front of your chest. Getting more twist back through your mid-back can make it easier to look over your shoulder, reach behind you and turn in your seat.
- **Tissue line:** none (stages strip only)
- **3D view:** yes, starting from the back

- [ ] **Approved** &nbsp;&nbsp; - [ ] **Hide 3D on this page** &nbsp;&nbsp; Notes:

---

### <a id="wall-angels"></a>Wall Angels
_Thoracic spine · Strength phase_

Dev page: https://dev.physioonclick.co.uk/exercises/wall-angels

- **Main focus** (bright blue):
  - **Lower trapezius** (middle of your back, between and below your shoulder blades) — lights: ascending part of trapezius (both sides)
  - **Middle trapezius** (across your upper back) — lights: transverse part of trapezius (both sides)
  - **Serratus anterior** (side of your ribs, holding your shoulder blade flat) — lights: serratus anterior (both sides)
- **Also working** (light blue):
  - **Rhomboids** (between your shoulder blades) — lights: rhomboid major (both sides), rhomboid minor (both sides)
- **How this helps your recovery:** Sliding your arms up and down the wall while keeping contact trains the muscles around your shoulder blades to guide them smoothly as your mid-back stays upright. Better control here can make reaching overhead and sitting tall feel easier, and may ease aching across your upper back.
- **Tissue line:** none (stages strip only)
- **3D view:** yes, starting from the back

- [ ] **Approved** &nbsp;&nbsp; - [ ] **Hide 3D on this page** &nbsp;&nbsp; Notes:

---

### <a id="dead-bug"></a>Dead Bug
_Core · Strength phase_

Dev page: https://dev.physioonclick.co.uk/exercises/dead-bug

- **Main focus** (bright blue):
  - **Rectus abdominis** (the long muscle down the front of your tummy) — not in the 3D model, so not lit
  - **External oblique** (side of your tummy) — lights: external oblique (both sides)
- **Also working** (light blue):
  - **Iliopsoas** (deep hip flexor at the front of your hip) — lights: iliacus (both sides), psoas major (both sides)
- **How this helps your recovery:** Keeping your lower back gently pressed down while you slowly move an arm and the opposite leg trains your tummy muscles, at the front and the side, to hold your trunk steady. This control can help your back feel steadier when you reach, lift, carry or play sport.
- **Tissue line:** none (stages strip only)
- **3D view:** yes, starting from the front
- **Note under the 3D body:** Not in the 3D model, so not lit: rectus abdominis.

- [ ] **Approved** &nbsp;&nbsp; - [ ] **Hide 3D on this page** &nbsp;&nbsp; Notes:

---

## Pelvic health, face and paediatric

### <a id="pelvic-floor-activation-basic"></a>Pelvic Floor Activation (Basic)
_Pelvic health · Early rehab_

Dev page: https://dev.physioonclick.co.uk/exercises/pelvic-floor-activation-basic

- **Main focus** (bright blue):
  - **Pelvic floor muscles** (the sling of muscles at the base of your pelvis) — lights: coccygeus (both sides), external anal sphincter, iliococcygeus (both sides), pubococcygeus (both sides), puborectalis (both sides)
- **How this helps your recovery:** Squeezing and lifting the muscles at the base of your pelvis, then fully letting go, teaches you to find and work your pelvic floor on its own. A clear lift and a full release are the starting point for building strength, which can help with bladder control and may mean fewer leaks when you cough, laugh or lift.
- **Tissue line:** Pelvic floor
- **3D view:** yes, starting from the front

- [ ] **Approved** &nbsp;&nbsp; - [ ] **Hide 3D on this page** &nbsp;&nbsp; Notes:

---

### <a id="pelvic-floor-endurance-hold"></a>Pelvic Floor Endurance Hold
_Pelvic health · Strength phase_

Dev page: https://dev.physioonclick.co.uk/exercises/pelvic-floor-endurance-hold

- **Main focus** (bright blue):
  - **Pelvic floor muscles** (the sling of muscles at the base of your pelvis) — lights: coccygeus (both sides), external anal sphincter, iliococcygeus (both sides), pubococcygeus (both sides), puborectalis (both sides)
- **How this helps your recovery:** Holding a steady pelvic floor lift for longer builds the stamina of these muscles, so they can keep supporting your bladder and bowel for longer. Better endurance may help reduce leaks as you stand, walk and go about your day, including later on when your muscles are more tired.
- **Tissue line:** Pelvic floor
- **3D view:** yes, starting from the front

- [ ] **Approved** &nbsp;&nbsp; - [ ] **Hide 3D on this page** &nbsp;&nbsp; Notes:

---

### <a id="fast-twitch-pelvic-floor-the-knack"></a>Fast-Twitch Pelvic Floor 'The Knack'
_Pelvic health · Strength phase_

Dev page: https://dev.physioonclick.co.uk/exercises/fast-twitch-pelvic-floor-the-knack

- **Main focus** (bright blue):
  - **Pelvic floor muscles** (the sling of muscles at the base of your pelvis) — lights: coccygeus (both sides), external anal sphincter, iliococcygeus (both sides), pubococcygeus (both sides), puborectalis (both sides)
- **How this helps your recovery:** Quick, firm squeezes with a full release in between train your pelvic floor to switch on fast. Doing one squeeze just before you cough, sneeze, laugh or lift, known as the knack, helps your pelvic floor brace against the sudden pressure, which may help reduce leaks at those moments.
- **Tissue line:** Pelvic floor
- **3D view:** yes, starting from the front

- [ ] **Approved** &nbsp;&nbsp; - [ ] **Hide 3D on this page** &nbsp;&nbsp; Notes:

---

### <a id="deep-core-and-pelvic-floor-co-activation"></a>Deep Core and Pelvic Floor Co-Activation
_Pelvic health · Strength phase_

Dev page: https://dev.physioonclick.co.uk/exercises/deep-core-and-pelvic-floor-co-activation

- **Main focus** (bright blue):
  - **Pelvic floor muscles** (the sling of muscles at the base of your pelvis) — lights: coccygeus (both sides), external anal sphincter, iliococcygeus (both sides), pubococcygeus (both sides), puborectalis (both sides)
  - **Transversus abdominis** (the deepest tummy muscle, wrapping round like a corset) — not in the 3D model, so not lit
- **How this helps your recovery:** Lifting your pelvic floor while you gently draw in your lower tummy trains these muscles to work together, as they do naturally. Rebuilding this teamwork after pregnancy can help your tummy and pelvis feel more supported when you lift, carry or get up from the floor.
- **Tissue line:** Pelvic floor
- **3D view:** yes, starting from the front
- **Note under the 3D body:** Not in the 3D model, so not lit: transversus abdominis.

- [ ] **Approved** &nbsp;&nbsp; - [ ] **Hide 3D on this page** &nbsp;&nbsp; Notes:

---

### <a id="diastasis-safe-curl-up"></a>Diastasis-Safe Curl-Up
_Pelvic health · Mobility phase_

Dev page: https://dev.physioonclick.co.uk/exercises/diastasis-safe-curl-up

> **Changed in the 1 Nov accuracy pass (high confidence):** Transversus abdominis added as a helper (text only), because the steps draw the lower tummy in throughout.

- **Main focus** (bright blue):
  - **Rectus abdominis** (the long muscle down the front of your tummy) — not in the 3D model, so not lit
- **Also working** (light blue):
  - **Pelvic floor muscles** (the sling of muscles at the base of your pelvis) — lights: coccygeus (both sides), external anal sphincter, iliococcygeus (both sides), pubococcygeus (both sides), puborectalis (both sides)
  - **Transversus abdominis** (the deepest tummy muscle, wrapping round like a corset) — not in the 3D model, so not lit
- **How this helps your recovery:** Lifting your head and shoulders a small way, with the towel for support, gently works the long muscle down the front of your tummy. Keeping the middle flat, with no doming, means you build strength at a level your tummy can control, which can make sitting up, getting out of bed and lifting more comfortable.
- **Tissue line:** none (stages strip only)
- **3D view:** no, none of its main structures is in the 3D model — text only

- [ ] **Approved** &nbsp;&nbsp; - [ ] **Hide 3D on this page** &nbsp;&nbsp; Notes:

---

### <a id="pelvic-floor-relaxation-drop"></a>Pelvic Floor Relaxation / Drop
_Pelvic health · Early rehab_

Dev page: https://dev.physioonclick.co.uk/exercises/pelvic-floor-relaxation-drop

- **Main focus** (bright blue):
  - **Pelvic floor muscles** (the sling of muscles at the base of your pelvis) — lights: coccygeus (both sides), external anal sphincter, iliococcygeus (both sides), pubococcygeus (both sides), puborectalis (both sides)
- **Also working** (light blue):
  - **Diaphragm** (the dome-shaped breathing muscle under your ribs) — lights: diaphragm
- **How this helps your recovery:** Slow breathing while you let the muscles at the base of your pelvis soften and lengthen helps them let go, rather than staying tight. If your pelvic floor holds on to too much tension, learning to relax it may help ease pelvic pain and make emptying your bladder and bowel more comfortable.
- **Tissue line:** none (stages strip only)
- **3D view:** yes, starting from the front

- [ ] **Approved** &nbsp;&nbsp; - [ ] **Hide 3D on this page** &nbsp;&nbsp; Notes:

---

### <a id="diaphragmatic-breathing-for-pelvic-floor"></a>Diaphragmatic Breathing for Pelvic Floor
_Pelvic health · Early rehab_

Dev page: https://dev.physioonclick.co.uk/exercises/diaphragmatic-breathing-for-pelvic-floor

- **Main focus** (bright blue):
  - **Diaphragm** (the dome-shaped breathing muscle under your ribs) — lights: diaphragm
  - **Pelvic floor muscles** (the sling of muscles at the base of your pelvis) — lights: coccygeus (both sides), external anal sphincter, iliococcygeus (both sides), pubococcygeus (both sides), puborectalis (both sides)
- **How this helps your recovery:** Slow belly breathing lets your main breathing muscle and your pelvic floor move together, both gently dropping as you breathe in and rising back to rest as you breathe out. Getting this easy rhythm back can help a tense pelvic floor relax, and gives you a good base for your other pelvic floor exercises.
- **Tissue line:** none (stages strip only)
- **3D view:** yes, starting from the front

- [ ] **Approved** &nbsp;&nbsp; - [ ] **Hide 3D on this page** &nbsp;&nbsp; Notes:

---

### <a id="bridge-with-pelvic-floor-engagement"></a>Bridge with Pelvic Floor Engagement
_Pelvic health · Strength phase_

Dev page: https://dev.physioonclick.co.uk/exercises/bridge-with-pelvic-floor-engagement

> **Changed in the 1 Nov accuracy pass (medium confidence):** Transversus abdominis added as a helper (text only), because the steps draw the lower tummy in throughout.

- **Main focus** (bright blue):
  - **Gluteus maximus** (your main buttock muscle) — lights: gluteus maximus (both sides)
  - **Pelvic floor muscles** (the sling of muscles at the base of your pelvis) — lights: coccygeus (both sides), external anal sphincter, iliococcygeus (both sides), pubococcygeus (both sides), puborectalis (both sides)
- **Also working** (light blue):
  - **Hamstrings** (back of your thigh) — lights: long head of biceps femoris (both sides), semimembranosus (both sides), semitendinosus (both sides), short head of biceps femoris (both sides)
  - **Gluteus medius** (side of your hip) — lights: gluteus medius (both sides)
  - **Transversus abdominis** (the deepest tummy muscle, wrapping round like a corset) — not in the 3D model, so not lit
- **How this helps your recovery:** Lifting your pelvic floor just before you raise your hips, and keeping it lifted, links pelvic floor control with a bridge that strengthens your buttock muscles. Practising the two together can help your pelvic floor keep supporting you during everyday effort, such as lifting, climbing stairs or getting up from the floor.
- **Tissue line:** Pelvic floor
- **3D view:** yes, starting from the back
- **Note under the 3D body:** Not in the 3D model, so not lit: transversus abdominis.

- [ ] **Approved** &nbsp;&nbsp; - [ ] **Hide 3D on this page** &nbsp;&nbsp; Notes:

---

### <a id="squat-with-pelvic-floor-control"></a>Squat with Pelvic Floor Control
_Pelvic health · Return to function_

Dev page: https://dev.physioonclick.co.uk/exercises/squat-with-pelvic-floor-control

- **Main focus** (bright blue):
  - **Pelvic floor muscles** (the sling of muscles at the base of your pelvis) — lights: coccygeus (both sides), external anal sphincter, iliococcygeus (both sides), pubococcygeus (both sides), puborectalis (both sides)
  - **Quadriceps** (front of your thigh) — lights: rectus femoris (both sides), vastus intermedius (both sides), vastus lateralis (both sides), vastus medialis (both sides)
  - **Gluteus maximus** (your main buttock muscle) — lights: gluteus maximus (both sides)
- **Also working** (light blue):
  - **Gluteus medius** (side of your hip) — lights: gluteus medius (both sides)
  - **Hamstrings** (back of your thigh) — lights: long head of biceps femoris (both sides), semimembranosus (both sides), semitendinosus (both sides), short head of biceps femoris (both sides)
- **How this helps your recovery:** Breathing out and lifting your pelvic floor as you push up to stand teaches it to switch on at the hardest part of the movement, while your thigh and buttock muscles do the lifting. This habit can help your pelvic floor support you when you squat to pick something up, lift or get up from a low seat.
- **Tissue line:** Pelvic floor
- **3D view:** yes, starting from the right side

- [ ] **Approved** &nbsp;&nbsp; - [ ] **Hide 3D on this page** &nbsp;&nbsp; Notes:

---

### <a id="standing-pelvic-tilt-pregnancy"></a>Standing Pelvic Tilt (Pregnancy)
_Pelvic health · Early rehab_

Dev page: https://dev.physioonclick.co.uk/exercises/standing-pelvic-tilt-pregnancy

- **Main focus** (bright blue):
  - **Lower back vertebrae and sacrum** (the five bones of your lower back and the sacrum below them, which form its joints) — lights: fifth lumbar vertebra, first lumbar vertebra, fourth lumbar vertebra, sacrum, second lumbar vertebra, third lumbar vertebra
  - **Rectus abdominis** (the long muscle down the front of your tummy) — not in the 3D model, so not lit
- **How this helps your recovery:** Gently tightening your lower tummy rolls your pelvis so your lower back flattens towards the wall, then releases, in a small, easy rocking movement. Moving your pelvis and lower back gently like this can ease stiffness and discomfort around your pelvis during pregnancy, which may make standing and walking more comfortable.
- **Tissue line:** none (stages strip only)
- **3D view:** yes, starting from the right side
- **Note under the 3D body:** Not in the 3D model, so not lit: rectus abdominis.

- [ ] **Approved** &nbsp;&nbsp; - [ ] **Hide 3D on this page** &nbsp;&nbsp; Notes:

---

### <a id="side-lying-hip-abduction-pregnancy-safe"></a>Side-Lying Hip Abduction (Pregnancy-Safe)
_Pelvic health · Strength phase_

Dev page: https://dev.physioonclick.co.uk/exercises/side-lying-hip-abduction-pregnancy-safe

> **Changed in the 1 Nov accuracy pass (medium confidence):** Gluteus minimus swapped for gluteus maximus as a helper, because the steps describe a clamshell (outward rotation).

- **Main focus** (bright blue):
  - **Gluteus medius** (side of your hip) — lights: gluteus medius (both sides)
- **Also working** (light blue):
  - **Deep hip rotators** (deep muscles at the back of your hip, including piriformis) — lights: gemellus inferior (both sides), gemellus superior (both sides), obturator externus (both sides), obturator internus (both sides), piriformis (both sides), quadratus femoris (both sides)
  - **Gluteus maximus** (your main buttock muscle) — lights: gluteus maximus (both sides)
- **How this helps your recovery:** Lifting your top knee a small way, with your feet together and pillows for support, strengthens the muscles on the side of your hip while your pelvis stays still. Stronger hip muscles can help steady your pelvis, which may make walking, climbing stairs and turning over in bed more comfortable during pregnancy.
- **Tissue line:** none (stages strip only)
- **3D view:** yes, starting from the right side

- [ ] **Approved** &nbsp;&nbsp; - [ ] **Hide 3D on this page** &nbsp;&nbsp; Notes:

---

### <a id="return-to-running-pelvic-floor-check"></a>Return-to-Running Pelvic Floor Check
_Pelvic health · Return to function_

Dev page: https://dev.physioonclick.co.uk/exercises/return-to-running-pelvic-floor-check

- **Main focus** (bright blue):
  - **Pelvic floor muscles** (the sling of muscles at the base of your pelvis) — lights: coccygeus (both sides), external anal sphincter, iliococcygeus (both sides), pubococcygeus (both sides), puborectalis (both sides)
- **Also working** (light blue):
  - **Quadriceps** (front of your thigh) — lights: rectus femoris (both sides), vastus intermedius (both sides), vastus lateralis (both sides), vastus medialis (both sides)
  - **Gluteus maximus** (your main buttock muscle) — lights: gluteus maximus (both sides)
  - **Gastrocnemius** (the big calf muscle) — lights: lateral head of gastrocnemius (both sides), medial head of gastrocnemius (both sides)
- **How this helps your recovery:** Jogging, hopping and single-leg moves put quick, repeated pressure on your pelvic floor, so this check shows how well it copes with impact before you run. Getting through with no leaks, heaviness or pain suggests you may be ready to build up gradually, while any symptoms are a sign to stop and talk to your physio.
- **Tissue line:** Pelvic floor
- **3D view:** yes, starting from the front

- [ ] **Approved** &nbsp;&nbsp; - [ ] **Hide 3D on this page** &nbsp;&nbsp; Notes:

---

### <a id="bowel-emptying-positioning"></a>Bowel Emptying Positioning
_Pelvic health · Early rehab_

Dev page: https://dev.physioonclick.co.uk/exercises/bowel-emptying-positioning

- **Main focus** (bright blue):
  - **Pelvic floor muscles** (the sling of muscles at the base of your pelvis) — lights: coccygeus (both sides), external anal sphincter, iliococcygeus (both sides), pubococcygeus (both sides), puborectalis (both sides)
- **How this helps your recovery:** Raising your knees above your hips and leaning forward helps the pelvic floor muscle that loops around your back passage relax, straightening the way out. With a relaxed tummy and gentle breathing instead of straining, this can make opening your bowels easier and put less strain on your pelvic floor.
- **Tissue line:** none (stages strip only)
- **3D view:** yes, starting from the front

- [ ] **Approved** &nbsp;&nbsp; - [ ] **Hide 3D on this page** &nbsp;&nbsp; Notes:

---

### <a id="reverse-kegel-pelvic-floor-lengthening"></a>Reverse Kegel (Pelvic Floor Lengthening)
_Pelvic health · Mobility phase_

Dev page: https://dev.physioonclick.co.uk/exercises/reverse-kegel-pelvic-floor-lengthening

- **Main focus** (bright blue):
  - **Pelvic floor muscles** (the sling of muscles at the base of your pelvis) — lights: coccygeus (both sides), external anal sphincter, iliococcygeus (both sides), pubococcygeus (both sides), puborectalis (both sides)
- **How this helps your recovery:** Letting your pelvic floor gently lengthen and soften slightly downward as you breathe out is the opposite of a squeeze, and helps muscles that hold too much tension learn to let go. A pelvic floor that can relax fully may help ease pelvic pain and make sex and emptying your bladder and bowel more comfortable.
- **Tissue line:** none (stages strip only)
- **3D view:** yes, starting from the front

- [ ] **Approved** &nbsp;&nbsp; - [ ] **Hide 3D on this page** &nbsp;&nbsp; Notes:

---

### <a id="smile-mouth-raise"></a>Smile / Mouth Raise
_Face · Facial rehab_

Dev page: https://dev.physioonclick.co.uk/exercises/smile-mouth-raise

- **Main focus** (bright blue):
  - **Zygomaticus major** (the cheek muscle that lifts the corners of your mouth) — not in the 3D model, so not lit
- **How this helps your recovery:** Gently lifting both corners of your mouth works the cheek muscles that raise them, while matching the stronger side to the weaker one keeps the movement even. Small, controlled practice like this can help your brain relearn a balanced smile, which may make your face feel more natural when you talk, eat and smile.
- **Tissue line:** Nerves and the brain
- **3D view:** no, none of its main structures is in the 3D model — text only

- [ ] **Approved** &nbsp;&nbsp; - [ ] **Hide 3D on this page** &nbsp;&nbsp; Notes:

---

### <a id="eyebrow-raise"></a>Eyebrow Raise
_Face · Facial rehab_

Dev page: https://dev.physioonclick.co.uk/exercises/eyebrow-raise

- **Main focus** (bright blue):
  - **Frontalis** (the forehead muscle that raises your eyebrows) — not in the 3D model, so not lit
- **How this helps your recovery:** Raising both eyebrows works your forehead muscle, with the stronger side held back so the weaker side can keep up. Slow, even practice can help your brain relearn balanced movement across your forehead, so expressions such as surprise look and feel more even.
- **Tissue line:** Nerves and the brain
- **3D view:** no, none of its main structures is in the 3D model — text only

- [ ] **Approved** &nbsp;&nbsp; - [ ] **Hide 3D on this page** &nbsp;&nbsp; Notes:

---

### <a id="gentle-eye-close"></a>Gentle Eye Close
_Face · Facial rehab_

Dev page: https://dev.physioonclick.co.uk/exercises/gentle-eye-close

- **Main focus** (bright blue):
  - **Orbicularis oculi** (the ring of muscle around your eye) — not in the 3D model, so not lit
- **How this helps your recovery:** Softly closing both eyes works the ring of muscle around each eye, which protects your eye when you blink and sleep. Gentle, even practice without squeezing can help your eyelids close more fully and comfortably, and keeping your mouth still lets your eyes do the work on their own.
- **Tissue line:** Nerves and the brain
- **3D view:** no, none of its main structures is in the 3D model — text only

- [ ] **Approved** &nbsp;&nbsp; - [ ] **Hide 3D on this page** &nbsp;&nbsp; Notes:

---

### <a id="cheek-puff"></a>Cheek Puff
_Face · Facial rehab_

Dev page: https://dev.physioonclick.co.uk/exercises/cheek-puff

- **Main focus** (bright blue):
  - **Orbicularis oris** (the ring of muscle around your lips) — not in the 3D model, so not lit
  - **Buccinator** (the cheek muscle that holds air in your mouth) — not in the 3D model, so not lit
- **How this helps your recovery:** Puffing out your cheeks with your lips sealed works the ring of muscle around your lips and the cheek muscles that hold air in. Better lip seal and cheek control can make it easier to drink without spilling, stop food collecting in your cheek and speak clearly.
- **Tissue line:** Nerves and the brain
- **3D view:** no, none of its main structures is in the 3D model — text only

- [ ] **Approved** &nbsp;&nbsp; - [ ] **Hide 3D on this page** &nbsp;&nbsp; Notes:

---

### <a id="brow-furrow"></a>Brow Furrow
_Face · Facial rehab_

Dev page: https://dev.physioonclick.co.uk/exercises/brow-furrow

- **Main focus** (bright blue):
  - **Corrugator and procerus** (the small muscles between your eyebrows that frown) — not in the 3D model, so not lit
- **How this helps your recovery:** Drawing your eyebrows down and together works the small frowning muscles between them. Keeping the crease centred, with your jaw and eyes relaxed, can help your brain relearn even control of your upper face, so expressions like concentrating look more balanced.
- **Tissue line:** Nerves and the brain
- **3D view:** no, none of its main structures is in the 3D model — text only

- [ ] **Approved** &nbsp;&nbsp; - [ ] **Hide 3D on this page** &nbsp;&nbsp; Notes:

---

### <a id="big-smile"></a>Big Smile
_Face · Facial rehab_

Dev page: https://dev.physioonclick.co.uk/exercises/big-smile

- **Main focus** (bright blue):
  - **Zygomaticus major** (the cheek muscle that lifts the corners of your mouth) — not in the 3D model, so not lit
  - **Risorius** (the muscle that pulls the corners of your mouth sideways) — not in the 3D model, so not lit
- **How this helps your recovery:** Widening your smile up and out works the cheek muscles that lift the corners of your mouth and the muscle that pulls them sideways. Holding the stronger side back so both sides move together can help you build a fuller, more even smile, which may help you feel more confident when you laugh and talk.
- **Tissue line:** Nerves and the brain
- **3D view:** no, none of its main structures is in the 3D model — text only

- [ ] **Approved** &nbsp;&nbsp; - [ ] **Hide 3D on this page** &nbsp;&nbsp; Notes:

---

### <a id="open-eyes-wide"></a>Open Eyes Wide
_Face · Facial rehab_

Dev page: https://dev.physioonclick.co.uk/exercises/open-eyes-wide

- **Main focus** (bright blue):
  - **Levator palpebrae** (the muscle that lifts your upper eyelid) — not in the 3D model, so not lit
- **How this helps your recovery:** Opening your eyes wide while your eyebrows stay still works the muscle that lifts each upper eyelid, so your forehead does not take over. Practising an even opening on both sides can help your eyes look more balanced, which may help your face feel more natural when you talk with people.
- **Tissue line:** Nerves and the brain
- **3D view:** no, none of its main structures is in the 3D model — text only

- [ ] **Approved** &nbsp;&nbsp; - [ ] **Hide 3D on this page** &nbsp;&nbsp; Notes:

---

### <a id="lip-pucker"></a>Lip Pucker
_Face · Facial rehab_

Dev page: https://dev.physioonclick.co.uk/exercises/lip-pucker

- **Main focus** (bright blue):
  - **Orbicularis oris** (the ring of muscle around your lips) — not in the 3D model, so not lit
- **How this helps your recovery:** Drawing your lips forward into a pucker works the ring of muscle around your lips. Keeping the pucker centred, rather than pulled towards the stronger side, can help your lips move more evenly, which may make drinking through a straw, whistling and forming sounds clearly easier.
- **Tissue line:** Nerves and the brain
- **3D view:** no, none of its main structures is in the 3D model — text only

- [ ] **Approved** &nbsp;&nbsp; - [ ] **Hide 3D on this page** &nbsp;&nbsp; Notes:

---

### <a id="animal-walk-circuit"></a>Animal Walk Circuit
_Paediatric · Early rehab_

Dev page: https://dev.physioonclick.co.uk/exercises/animal-walk-circuit

- **Main focus** (bright blue):
  - **Deltoid** (the rounded muscle over your shoulder) — lights: acromial part of deltoid (both sides), clavicular part of deltoid (both sides), spinal part of deltoid (both sides)
  - **External oblique** (side of your tummy) — lights: external oblique (both sides)
  - **Gluteus maximus** (your main buttock muscle) — lights: gluteus maximus (both sides)
- **Also working** (light blue):
  - **Triceps** (back of your upper arm) — lights: lateral head of triceps brachii (both sides), long head of triceps brachii (both sides), medial head of triceps brachii (both sides)
  - **Quadriceps** (front of your thigh) — lights: rectus femoris (both sides), vastus intermedius (both sides), vastus lateralis (both sides), vastus medialis (both sides)
  - **Hamstrings** (back of your thigh) — lights: long head of biceps femoris (both sides), semimembranosus (both sides), semitendinosus (both sides), short head of biceps femoris (both sides)
- **How this helps your recovery:** Bear and crab walks have your child take their weight through their hands and feet, working their shoulders, tummy and buttocks while their arms and legs learn to move in turn. Building whole-body strength and coordination through play can help your child with climbing, running and keeping up in the playground.
- **Tissue line:** none (stages strip only)
- **3D view:** yes, starting from the right side

- [ ] **Approved** &nbsp;&nbsp; - [ ] **Hide 3D on this page** &nbsp;&nbsp; Notes:

---

### <a id="balance-beam-walk-tape-line"></a>Balance Beam Walk (Tape Line)
_Paediatric · Mobility phase_

Dev page: https://dev.physioonclick.co.uk/exercises/balance-beam-walk-tape-line

- **Main focus** (bright blue):
  - **Fibularis longus and brevis (peroneals)** (outside of your lower leg and ankle) — lights: fibularis brevis (both sides), fibularis longus (both sides)
  - **Tibialis anterior** (front of your shin) — lights: tibialis anterior (both sides)
  - **Gluteus medius** (side of your hip) — lights: gluteus medius (both sides)
- **Also working** (light blue):
  - **Tibialis posterior** (deep in the back of your lower leg, its tendon running behind your inner ankle to support your arch) — lights: tibialis posterior (both sides)
  - **Soleus** (deep calf muscle) — lights: soleus (both sides)
- **How this helps your recovery:** Walking along a narrow line makes the muscles around your child's ankles and the sides of their hips make lots of small corrections to keep them steady. Practising this as a game can help your child's balance and body awareness, so they feel steadier on kerbs, uneven ground and playground equipment.
- **Tissue line:** none (stages strip only)
- **3D view:** yes, starting from the right side

- [ ] **Approved** &nbsp;&nbsp; - [ ] **Hide 3D on this page** &nbsp;&nbsp; Notes:

---

### <a id="ball-catch-and-throw"></a>Ball Catch and Throw
_Paediatric · Strength phase_

Dev page: https://dev.physioonclick.co.uk/exercises/ball-catch-and-throw

- **Main focus** (bright blue):
  - **Front deltoid** (front of your shoulder) — lights: clavicular part of deltoid (both sides)
  - **Pectoralis major** (your chest muscle) — lights: abdominal part of pectoralis major (both sides), clavicular part of pectoralis major (both sides), sternocostal part of pectoralis major (both sides)
  - **Triceps** (back of your upper arm) — lights: lateral head of triceps brachii (both sides), long head of triceps brachii (both sides), medial head of triceps brachii (both sides)
- **Also working** (light blue):
  - **Biceps** (front of your upper arm) — lights: long head of biceps brachii (both sides), short head of biceps brachii (both sides)
  - **Finger and thumb flexors** (inside of your forearm, bending your fingers and thumb) — lights: flexor digitorum profundus (both sides), flexor digitorum superficialis (both sides), flexor pollicis longus (both sides)
- **How this helps your recovery:** Rolling, catching and throwing a soft ball works your child's shoulder, chest and arm muscles while their eyes guide their hands. Practising at a distance where they mostly succeed can help your child build hand-eye coordination and confidence for ball games and other activities that need both hands working together.
- **Tissue line:** none (stages strip only)
- **3D view:** yes, starting from the front

- [ ] **Approved** &nbsp;&nbsp; - [ ] **Hide 3D on this page** &nbsp;&nbsp; Notes:

---

### <a id="obstacle-course-crawl-through"></a>Obstacle Course Crawl-Through
_Paediatric · Return to function_

Dev page: https://dev.physioonclick.co.uk/exercises/obstacle-course-crawl-through

- **Main focus** (bright blue):
  - **Deltoid** (the rounded muscle over your shoulder) — lights: acromial part of deltoid (both sides), clavicular part of deltoid (both sides), spinal part of deltoid (both sides)
  - **Gluteus maximus** (your main buttock muscle) — lights: gluteus maximus (both sides)
  - **Quadriceps** (front of your thigh) — lights: rectus femoris (both sides), vastus intermedius (both sides), vastus lateralis (both sides), vastus medialis (both sides)
- **Also working** (light blue):
  - **Triceps** (back of your upper arm) — lights: lateral head of triceps brachii (both sides), long head of triceps brachii (both sides), medial head of triceps brachii (both sides)
  - **Iliopsoas** (deep hip flexor at the front of your hip) — lights: iliacus (both sides), psoas major (both sides)
- **How this helps your recovery:** Crawling under, climbing over and squeezing through the stations works your child's shoulders, hips and thighs while they plan each move. Putting several skills together in one course can help your child practise the moving, climbing and problem-solving they need for parks, playgrounds and play with friends.
- **Tissue line:** none (stages strip only)
- **3D view:** yes, starting from the right side

- [ ] **Approved** &nbsp;&nbsp; - [ ] **Hide 3D on this page** &nbsp;&nbsp; Notes:

---

### <a id="toe-walking-heel-walking-game"></a>Toe Walking / Heel Walking Game
_Paediatric · Early rehab_

Dev page: https://dev.physioonclick.co.uk/exercises/toe-walking-heel-walking-game

- **Main focus** (bright blue):
  - **Tibialis anterior** (front of your shin) — lights: tibialis anterior (both sides)
  - **Gastrocnemius** (the big calf muscle) — lights: lateral head of gastrocnemius (both sides), medial head of gastrocnemius (both sides)
- **Also working** (light blue):
  - **Soleus** (deep calf muscle) — lights: soleus (both sides)
- **How this helps your recovery:** Penguin walking on the heels works the muscle at the front of your child's shin that lifts the toes, while gently stretching the calf at the back. Switching between heel, tiptoe and heel-first steps in a game can help your child notice and practise landing on the heel first, and keep their ankles moving through their full range.
- **Tissue line:** none (stages strip only)
- **3D view:** yes, starting from the right side

- [ ] **Approved** &nbsp;&nbsp; - [ ] **Hide 3D on this page** &nbsp;&nbsp; Notes:

---

### <a id="trampette-bouncing-supervised"></a>Trampette Bouncing (Supervised)
_Paediatric · Strength phase_

Dev page: https://dev.physioonclick.co.uk/exercises/trampette-bouncing-supervised

- **Main focus** (bright blue):
  - **Quadriceps** (front of your thigh) — lights: rectus femoris (both sides), vastus intermedius (both sides), vastus lateralis (both sides), vastus medialis (both sides)
  - **Gluteus maximus** (your main buttock muscle) — lights: gluteus maximus (both sides)
  - **Gastrocnemius** (the big calf muscle) — lights: lateral head of gastrocnemius (both sides), medial head of gastrocnemius (both sides)
- **Also working** (light blue):
  - **Soleus** (deep calf muscle) — lights: soleus (both sides)
- **How this helps your recovery:** Gentle, rhythmic bouncing works the muscles at the front of your child's thighs, their buttocks and their calves as they press down and spring up. The springy surface also challenges their balance in a fun way, which can help your child build leg strength, steadiness and stamina for walking, running and play.
- **Tissue line:** none (stages strip only)
- **3D view:** yes, starting from the right side

- [ ] **Approved** &nbsp;&nbsp; - [ ] **Hide 3D on this page** &nbsp;&nbsp; Notes:

---

### <a id="prone-extension-play-superman"></a>Prone Extension Play ('Superman')
_Paediatric · Early rehab_

Dev page: https://dev.physioonclick.co.uk/exercises/prone-extension-play-superman

- **Main focus** (bright blue):
  - **Erector spinae (trunk part)** (the long muscles either side of your spine, from your pelvis up to the base of your neck) — lights: iliocostalis lumborum (both sides), iliocostalis thoracis (both sides), longissimus thoracis (both sides), spinalis thoracis (both sides)
  - **Gluteus maximus** (your main buttock muscle) — lights: gluteus maximus (both sides)
- **Also working** (light blue):
  - **Hamstrings** (back of your thigh) — lights: long head of biceps femoris (both sides), semimembranosus (both sides), semitendinosus (both sides), short head of biceps femoris (both sides)
  - **Lower trapezius** (middle of your back, between and below your shoulder blades) — lights: ascending part of trapezius (both sides)
  - **Neck extensors** (the muscles at the back of your neck) — lights: cervical rotator (both sides), iliocostalis cervicis (both sides), longissimus capitis (both sides), longissimus cervicis (both sides), obliquus capitis inferior (both sides), obliquus capitis superior (both sides), rectus capitis posterior major (both sides), rectus capitis posterior minor (both sides), semispinalis capitis (both sides), semispinalis cervicis (both sides), set of interspinales cervicis, spinalis, splenius capitis (both sides), splenius cervicis (both sides)
- **How this helps your recovery:** Lifting the head, arms and legs off the floor like a flying superhero works the long muscles beside your child's spine and their buttock muscles. Building strength in the back of the body can help your child sit up tall, hold their head up during play and table activities, and keep going for longer before they tire.
- **Tissue line:** none (stages strip only)
- **3D view:** yes, starting from the back

- [ ] **Approved** &nbsp;&nbsp; - [ ] **Hide 3D on this page** &nbsp;&nbsp; Notes:

---

### <a id="scooter-board-propulsion"></a>Scooter Board Propulsion
_Paediatric · Strength phase_

Dev page: https://dev.physioonclick.co.uk/exercises/scooter-board-propulsion

- **Main focus** (bright blue):
  - **Latissimus dorsi** (the broad muscle across your back and side) — not in the 3D model, so not lit
  - **Erector spinae (trunk part)** (the long muscles either side of your spine, from your pelvis up to the base of your neck) — lights: iliocostalis lumborum (both sides), iliocostalis thoracis (both sides), longissimus thoracis (both sides), spinalis thoracis (both sides)
- **Also working** (light blue):
  - **Rear deltoid** (back of your shoulder) — lights: spinal part of deltoid (both sides)
  - **Triceps** (back of your upper arm) — lights: lateral head of triceps brachii (both sides), long head of triceps brachii (both sides), medial head of triceps brachii (both sides)
  - **Neck extensors** (the muscles at the back of your neck) — lights: cervical rotator (both sides), iliocostalis cervicis (both sides), longissimus capitis (both sides), longissimus cervicis (both sides), obliquus capitis inferior (both sides), obliquus capitis superior (both sides), rectus capitis posterior major (both sides), rectus capitis posterior minor (both sides), semispinalis capitis (both sides), semispinalis cervicis (both sides), set of interspinales cervicis, spinalis, splenius capitis (both sides), splenius cervicis (both sides)
- **How this helps your recovery:** Pulling along the floor with both arms works the broad muscles of your child's back and shoulders, while the muscles beside the spine keep their head and chest lifted. Building upper-body and trunk strength in a game can help your child with climbing, reaching and sitting steadily at a table.
- **Tissue line:** none (stages strip only)
- **3D view:** yes, starting from the back
- **Note under the 3D body:** Not in the 3D model, so not lit: latissimus dorsi.

- [ ] **Approved** &nbsp;&nbsp; - [ ] **Hide 3D on this page** &nbsp;&nbsp; Notes:

---

### <a id="single-leg-hop-game"></a>Single-Leg Hop Game
_Paediatric · Return to function_

Dev page: https://dev.physioonclick.co.uk/exercises/single-leg-hop-game

- **Main focus** (bright blue):
  - **Quadriceps** (front of your thigh) — lights: rectus femoris (both sides), vastus intermedius (both sides), vastus lateralis (both sides), vastus medialis (both sides)
  - **Gastrocnemius** (the big calf muscle) — lights: lateral head of gastrocnemius (both sides), medial head of gastrocnemius (both sides)
  - **Gluteus maximus** (your main buttock muscle) — lights: gluteus maximus (both sides)
- **Also working** (light blue):
  - **Soleus** (deep calf muscle) — lights: soleus (both sides)
  - **Gluteus medius** (side of your hip) — lights: gluteus medius (both sides)
- **How this helps your recovery:** Hopping from spot to spot works the thigh, calf and buttock muscles of your child's leg as they push off and land softly. Starting on the stronger leg and building up on the injured one can help your child rebuild power, balance and trust in their leg as they return to running, jumping and playground games.
- **Tissue line:** none (stages strip only)
- **3D view:** yes, starting from the right side

- [ ] **Approved** &nbsp;&nbsp; - [ ] **Hide 3D on this page** &nbsp;&nbsp; Notes:

---

### <a id="sensory-motor-circuit-multi-station"></a>Sensory-Motor Circuit (Multi-Station)
_Paediatric · Return to function_

Dev page: https://dev.physioonclick.co.uk/exercises/sensory-motor-circuit-multi-station

> **Changed in the 1 Nov accuracy pass (medium confidence):** Main focus changed to the brain, so the page has no 3D view, because the stations, and so the muscles, vary by child.

- **Main focus** (bright blue):
  - **Brain** (the parts of your brain that take in what you sense, plan your movements and share your attention) — not in the 3D model, so not lit
- **How this helps your recovery:** Your child's physio chooses the stations, so the muscles worked will vary. A mix of movement and calming input, such as a firm cushion squash or slow rocking, may help your child feel more settled and ready to focus, play and join in.
- **Tissue line:** none (stages strip only)
- **3D view:** no, none of its main structures is in the 3D model — text only

- [ ] **Approved** &nbsp;&nbsp; - [ ] **Hide 3D on this page** &nbsp;&nbsp; Notes:

---

## After surgery and general

### <a id="ankle-pumps-post-surgery"></a>Ankle Pumps (Post-Surgery)
_Post-op · Early rehab_

Dev page: https://dev.physioonclick.co.uk/exercises/ankle-pumps-post-surgery

- **Main focus** (bright blue):
  - **Gastrocnemius** (the big calf muscle) — lights: lateral head of gastrocnemius (both sides), medial head of gastrocnemius (both sides)
  - **Soleus** (deep calf muscle) — lights: soleus (both sides)
  - **Tibialis anterior** (front of your shin) — lights: tibialis anterior (both sides)
- **How this helps your recovery:** Pointing your feet away and pulling them back works your calf muscles and the muscle at the front of your shin. As your calves squeeze and relax, they can help keep blood moving in your legs while you are resting in bed more than usual, and help limit stiffness in your ankles.
- **Tissue line:** After surgery
- **3D view:** yes, starting from the right side

- [ ] **Approved** &nbsp;&nbsp; - [ ] **Hide 3D on this page** &nbsp;&nbsp; Notes:

---

### <a id="quad-sets"></a>Quad Sets
_Post-op · Early rehab_

Dev page: https://dev.physioonclick.co.uk/exercises/quad-sets

- **Main focus** (bright blue):
  - **Quadriceps** (front of your thigh) — lights: rectus femoris (both sides), vastus intermedius (both sides), vastus lateralis (both sides), vastus medialis (both sides)
- **How this helps your recovery:** Tightening the front of your thigh while your knee stays straight helps wake up a thigh muscle that can be slow to work after knee surgery. Getting this muscle working again is an early step towards holding your knee straight and steady when you stand, walk and get in and out of bed.
- **Tissue line:** After surgery
- **3D view:** yes, starting from the front

- [ ] **Approved** &nbsp;&nbsp; - [ ] **Hide 3D on this page** &nbsp;&nbsp; Notes:

---

### <a id="assisted-knee-flexion"></a>Assisted Knee Flexion
_Post-op · Early rehab_

Dev page: https://dev.physioonclick.co.uk/exercises/assisted-knee-flexion

- **Main focus** (bright blue):
  - **Quadriceps** (front of your thigh) — lights: rectus femoris (both sides), vastus intermedius (both sides), vastus lateralis (both sides), vastus medialis (both sides)
- **How this helps your recovery:** A strap or your other leg gently bends your operated knee while your thigh muscles stay relaxed, easing the front of your thigh into a stretch. Winning back knee bend, within the range your surgeon or physio allows, can make it easier to sit in a chair, use stairs and get in and out of a car.
- **Tissue line:** After surgery
- **3D view:** yes, starting from the right side

- [ ] **Approved** &nbsp;&nbsp; - [ ] **Hide 3D on this page** &nbsp;&nbsp; Notes:

---

### <a id="hip-abduction-in-lying-post-op"></a>Hip Abduction in Lying (Post-Op)
_Post-op · Early rehab_

Dev page: https://dev.physioonclick.co.uk/exercises/hip-abduction-in-lying-post-op

- **Main focus** (bright blue):
  - **Gluteus medius** (side of your hip) — lights: gluteus medius (both sides)
- **Also working** (light blue):
  - **Gluteus minimus** (deep side of your hip) — lights: gluteus minimus (both sides)
  - **Tensor fasciae latae and IT band** (outside of your hip and thigh) — lights: iliotibial tract (both sides), tensor fasciae latae (both sides)
- **How this helps your recovery:** Sliding your leg out to the side, with your kneecap and toes pointing up, gently works the muscles on the side of your hip while you keep to your hip precautions. Working these muscles after a hip replacement can help them hold your pelvis level as you get back to standing and walking.
- **Tissue line:** After surgery
- **3D view:** yes, starting from the right side

- [ ] **Approved** &nbsp;&nbsp; - [ ] **Hide 3D on this page** &nbsp;&nbsp; Notes:

---

### <a id="supported-standing-post-hip"></a>Supported Standing (Post-Hip)
_Post-op · Early rehab_

Dev page: https://dev.physioonclick.co.uk/exercises/supported-standing-post-hip

- **Main focus** (bright blue):
  - **Quadriceps** (front of your thigh) — lights: rectus femoris (both sides), vastus intermedius (both sides), vastus lateralis (both sides), vastus medialis (both sides)
  - **Gluteus maximus** (your main buttock muscle) — lights: gluteus maximus (both sides)
- **Also working** (light blue):
  - **Triceps** (back of your upper arm) — lights: lateral head of triceps brachii (both sides), long head of triceps brachii (both sides), medial head of triceps brachii (both sides)
- **How this helps your recovery:** Pushing up through your hands and your other leg works your thigh and buttock muscles, with the backs of your arms helping, and lowering slowly works them again. Standing for short spells, keeping to the weight your surgeon allows through the operated leg, helps build strength and confidence for your first steps with a frame.
- **Tissue line:** After surgery
- **3D view:** yes, starting from the front

- [ ] **Approved** &nbsp;&nbsp; - [ ] **Hide 3D on this page** &nbsp;&nbsp; Notes:

---

### <a id="shoulder-pendulum-post-rotator-cuff"></a>Shoulder Pendulum (Post-Rotator Cuff)
_Post-op · Early rehab_

Dev page: https://dev.physioonclick.co.uk/exercises/shoulder-pendulum-post-rotator-cuff

- **Main focus** (bright blue):
  - **Shoulder joint bones** (your upper arm bone and shoulder blade, which meet at the shoulder joint) — lights: humerus (both sides), scapula (both sides)
- **How this helps your recovery:** Letting your arm hang and swing from a gentle rock of your body moves your shoulder joint while the repaired muscles stay relaxed. Small, easy swings within your surgical protocol help limit stiffness while putting very little load on the repair, which can make washing and dressing easier to get back to as you recover.
- **Tissue line:** After surgery
- **3D view:** yes, starting from the right side

- [ ] **Approved** &nbsp;&nbsp; - [ ] **Hide 3D on this page** &nbsp;&nbsp; Notes:

---

### <a id="passive-shoulder-flexion-assisted"></a>Passive Shoulder Flexion (Assisted)
_Post-op · Early rehab_

Dev page: https://dev.physioonclick.co.uk/exercises/passive-shoulder-flexion-assisted

- **Main focus** (bright blue):
  - **Shoulder joint bones** (your upper arm bone and shoulder blade, which meet at the shoulder joint) — lights: humerus (both sides), scapula (both sides)
- **How this helps your recovery:** Using your good arm and a light stick to lift your operated arm overhead moves your shoulder joint while the repaired muscles stay relaxed. Working only in the range your surgeon or physio has allowed helps limit stiffness while the repair heals, which can make reaching, washing your hair and dressing easier as you recover.
- **Tissue line:** After surgery
- **3D view:** yes, starting from the right side

- [ ] **Approved** &nbsp;&nbsp; - [ ] **Hide 3D on this page** &nbsp;&nbsp; Notes:

---

### <a id="incision-site-scar-mobilisation"></a>Incision Site Scar Mobilisation
_Post-op · Mobility phase_

Dev page: https://dev.physioonclick.co.uk/exercises/incision-site-scar-mobilisation

- **Main focus** (bright blue):
  - **Scar tissue** (your healed scar and the skin around it) — not in the 3D model, so not lit
- **How this helps your recovery:** Once your wound has fully healed and your surgeon or physio says it is fine to start, moving the skin in small, slow circles around the scar can help it glide over the tissue underneath instead of sticking down. This may help the scar feel softer and less tight, and make moving that area more comfortable.
- **Tissue line:** After surgery
- **3D view:** no, none of its main structures is in the 3D model — text only

- [ ] **Approved** &nbsp;&nbsp; - [ ] **Hide 3D on this page** &nbsp;&nbsp; Notes:

---

### <a id="graduated-weight-bearing"></a>Graduated Weight-Bearing
_Post-op · Mobility phase_

Dev page: https://dev.physioonclick.co.uk/exercises/graduated-weight-bearing

> **Changed in the 1 Nov accuracy pass (medium confidence):** Leg bones made the main focus; thigh and buttock muscles moved to helpers, because the protocol controls load through the healing limb; the muscles only steady it.

- **Main focus** (bright blue):
  - **Leg bones** (the long bones of your thighs and lower legs) — lights: femur (both sides), fibula (both sides), tibia (both sides)
- **Also working** (light blue):
  - **Quadriceps** (front of your thigh) — lights: rectus femoris (both sides), vastus intermedius (both sides), vastus lateralis (both sides), vastus medialis (both sides)
  - **Gluteus maximus** (your main buttock muscle) — lights: gluteus maximus (both sides)
- **How this helps your recovery:** Pressing your healing leg onto the scales teaches you how the weight your surgeon allows feels, while your thigh and buttock muscles hold the leg steady. Putting through the right amount, and no more, helps you follow your surgeon's plan as you build back towards walking with less support.
- **Tissue line:** After surgery
- **3D view:** yes, starting from the front

- [ ] **Approved** &nbsp;&nbsp; - [ ] **Hide 3D on this page** &nbsp;&nbsp; Notes:

---

### <a id="core-bracing-post-abdominal-surgery"></a>Core Bracing (Post-Abdominal Surgery)
_Post-op · Early rehab_

Dev page: https://dev.physioonclick.co.uk/exercises/core-bracing-post-abdominal-surgery

- **Main focus** (bright blue):
  - **Transversus abdominis** (the deepest tummy muscle, wrapping round like a corset) — not in the 3D model, so not lit
- **How this helps your recovery:** Gently drawing in your lower tummy as you breathe out lightly works your tummy muscles, including the deep one that wraps round like a corset. Using this soft brace, with a towel or your hands pressed over the wound, can help your middle feel more supported when you cough, sneeze, roll over or stand up.
- **Tissue line:** After surgery
- **3D view:** no, none of its main structures is in the 3D model — text only

- [ ] **Approved** &nbsp;&nbsp; - [ ] **Hide 3D on this page** &nbsp;&nbsp; Notes:

---

### <a id="post-op-walking-programme"></a>Post-Op Walking Programme
_Post-op · Mobility phase_

Dev page: https://dev.physioonclick.co.uk/exercises/post-op-walking-programme

- **Main focus** (bright blue):
  - **Gluteus medius** (side of your hip) — lights: gluteus medius (both sides)
  - **Quadriceps** (front of your thigh) — lights: rectus femoris (both sides), vastus intermedius (both sides), vastus lateralis (both sides), vastus medialis (both sides)
  - **Gastrocnemius** (the big calf muscle) — lights: lateral head of gastrocnemius (both sides), medial head of gastrocnemius (both sides)
- **Also working** (light blue):
  - **Gluteus maximus** (your main buttock muscle) — lights: gluteus maximus (both sides)
  - **Soleus** (deep calf muscle) — lights: soleus (both sides)
  - **Tibialis anterior** (front of your shin) — lights: tibialis anterior (both sides)
- **How this helps your recovery:** Walking works the muscles of your hips, thighs and calves, and gently gets your heart and lungs working too. Building up your time a little at a time, within any limits from your surgeon or physio, can help you get back the stamina you need for everyday life after time spent recovering.
- **Tissue line:** After surgery
- **3D view:** yes, starting from the right side

- [ ] **Approved** &nbsp;&nbsp; - [ ] **Hide 3D on this page** &nbsp;&nbsp; Notes:

---

### <a id="resisted-knee-extension-post-acl"></a>Resisted Knee Extension (Post-ACL)
_Post-op · Strength phase_

Dev page: https://dev.physioonclick.co.uk/exercises/resisted-knee-extension-post-acl

- **Main focus** (bright blue):
  - **Quadriceps** (front of your thigh) — lights: rectus femoris (both sides), vastus intermedius (both sides), vastus lateralis (both sides), vastus medialis (both sides)
- **How this helps your recovery:** Straightening your knee against a light band strengthens the front of your thigh, which can lose strength after ACL surgery. Working within the range and load your surgeon's protocol allows helps you rebuild that strength step by step, so your knee can feel steadier for walking, stairs and, later on, sport.
- **Tissue line:** After surgery
- **3D view:** yes, starting from the front

- [ ] **Approved** &nbsp;&nbsp; - [ ] **Hide 3D on this page** &nbsp;&nbsp; Notes:

---

### <a id="proprioception-board-post-ankle-surgery"></a>Proprioception Board (Post-Ankle Surgery)
_Post-op · Return to function_

Dev page: https://dev.physioonclick.co.uk/exercises/proprioception-board-post-ankle-surgery

- **Main focus** (bright blue):
  - **Fibularis longus and brevis (peroneals)** (outside of your lower leg and ankle) — lights: fibularis brevis (both sides), fibularis longus (both sides)
  - **Tibialis anterior** (front of your shin) — lights: tibialis anterior (both sides)
  - **Tibialis posterior** (deep in the back of your lower leg, its tendon running behind your inner ankle to support your arch) — lights: tibialis posterior (both sides)
- **Also working** (light blue):
  - **Soleus** (deep calf muscle) — lights: soleus (both sides)
  - **Small foot muscles** (the muscles in the sole of your foot) — lights: abductor digiti minimi of foot (both sides), abductor hallucis (both sides), first lumbrical of foot (both sides), first plantar interosseous of foot (both sides), flexor accessorius (both sides), flexor digiti minimi brevis of foot (both sides), flexor digitorum brevis (both sides), fourth lumbrical of foot (both sides), lateral head of flexor hallucis brevis (both sides), medial head of flexor hallucis brevis (both sides), oblique head of adductor hallucis (both sides), opponens digiti minimi of foot (both sides), second lumbrical of foot (both sides), second plantar interosseous of foot (both sides), third lumbrical of foot (both sides), third plantar interosseous of foot (both sides), transverse head of adductor hallucis (both sides)
- **How this helps your recovery:** Keeping the board level makes the muscles around your ankle and foot react with lots of small corrections. Once your surgeon has cleared you to take full weight, this can help retrain your ankle's sense of position, so it feels steadier on uneven ground, slopes and stairs.
- **Tissue line:** After surgery
- **3D view:** yes, starting from the right side

- [ ] **Approved** &nbsp;&nbsp; - [ ] **Hide 3D on this page** &nbsp;&nbsp; Notes:

---

### <a id="return-to-function-strength-circuit"></a>Return-to-Function Strength Circuit
_Post-op · Return to function_

Dev page: https://dev.physioonclick.co.uk/exercises/return-to-function-strength-circuit

- **Main focus** (bright blue):
  - **Quadriceps** (front of your thigh) — lights: rectus femoris (both sides), vastus intermedius (both sides), vastus lateralis (both sides), vastus medialis (both sides)
  - **Gluteus maximus** (your main buttock muscle) — lights: gluteus maximus (both sides)
  - **Gastrocnemius** (the big calf muscle) — lights: lateral head of gastrocnemius (both sides), medial head of gastrocnemius (both sides)
- **Also working** (light blue):
  - **Gluteus medius** (side of your hip) — lights: gluteus medius (both sides)
  - **Soleus** (deep calf muscle) — lights: soleus (both sides)
  - **Rhomboids** (between your shoulder blades) — lights: rhomboid major (both sides), rhomboid minor (both sides)
  - **Middle trapezius** (across your upper back) — lights: transverse part of trapezius (both sides)
- **How this helps your recovery:** Movements such as sit-to-stands, step-ups, band rows and calf raises work your thighs, buttocks, calves and upper back in ways you use every day. Building up the circuit steadily, within any limits from your surgeon or physio, can help both sides share the work evenly as you get back to your normal activities.
- **Tissue line:** After surgery
- **3D view:** yes, starting from the front

- [ ] **Approved** &nbsp;&nbsp; - [ ] **Hide 3D on this page** &nbsp;&nbsp; Notes:

---

### <a id="breathing-exercises-post-thoracic-surgery"></a>Breathing Exercises (Post-Thoracic Surgery)
_Post-op · Early rehab_

Dev page: https://dev.physioonclick.co.uk/exercises/breathing-exercises-post-thoracic-surgery

- **Main focus** (bright blue):
  - **Diaphragm** (the dome-shaped breathing muscle under your ribs) — lights: diaphragm
  - **External intercostals** (small muscles between your ribs that lift them as you breathe in) — lights: external intercostal muscle
- **How this helps your recovery:** Slow, deep breaths into your lower ribs work your main breathing muscle and the small muscles between your ribs, which can help air reach the lower parts of your lungs. Huffing or coughing gently with the pillow held firmly over your wound helps you clear your chest more comfortably, so breathing can feel easier as you recover.
- **Tissue line:** After surgery
- **3D view:** yes, starting from the front

- [ ] **Approved** &nbsp;&nbsp; - [ ] **Hide 3D on this page** &nbsp;&nbsp; Notes:

---

### <a id="graduated-return-to-driving-readiness"></a>Graduated Return to Driving Readiness
_Post-op · Return to function_

Dev page: https://dev.physioonclick.co.uk/exercises/graduated-return-to-driving-readiness

- **Main focus** (bright blue):
  - **Quadriceps** (front of your thigh) — lights: rectus femoris (both sides), vastus intermedius (both sides), vastus lateralis (both sides), vastus medialis (both sides)
  - **Neck vertebrae** (the seven bones of your spine in your neck, which form its joints) — lights: atlas, axis, fifth cervical vertebra, fourth cervical vertebra, seventh cervical vertebra, sixth cervical vertebra, third cervical vertebra
- **Also working** (light blue):
  - **Gastrocnemius** (the big calf muscle) — lights: lateral head of gastrocnemius (both sides), medial head of gastrocnemius (both sides)
  - **Mid-back vertebrae** (the 12 bones of your spine between your neck and lower back, which form its joints) — lights: eighth thoracic vertebra, eleventh thoracic vertebra, fifth thoracic vertebra, first thoracic vertebra, fourth thoracic vertebra, ninth thoracic vertebra, second thoracic vertebra, seventh thoracic vertebra, sixth thoracic vertebra, tenth thoracic vertebra, third thoracic vertebra, twelfth thoracic vertebra
- **How this helps your recovery:** Pressing the brake hard works the front of your thigh, and checking your mirrors and blind spots turns your neck and upper back. Practising in your parked car can show you whether these movements feel quick and comfortable. Feeling comfortable here does not mean you are cleared to drive, so always check with your surgeon and insurer first.
- **Tissue line:** After surgery
- **3D view:** yes, starting from the right side

- [ ] **Approved** &nbsp;&nbsp; - [ ] **Hide 3D on this page** &nbsp;&nbsp; Notes:

---

### <a id="general-mobility-warm-up"></a>General Mobility Warm-Up
_General · Early rehab_

Dev page: https://dev.physioonclick.co.uk/exercises/general-mobility-warm-up

> **Changed in the 1 Nov accuracy pass (medium confidence):** Joints made the main focus (shoulder, mid-back, neck); deltoid and iliopsoas moved to helpers, because the warm-up takes the main joints through movement.

- **Main focus** (bright blue):
  - **Shoulder joint bones** (your upper arm bone and shoulder blade, which meet at the shoulder joint) — lights: humerus (both sides), scapula (both sides)
  - **Mid-back vertebrae** (the 12 bones of your spine between your neck and lower back, which form its joints) — lights: eighth thoracic vertebra, eleventh thoracic vertebra, fifth thoracic vertebra, first thoracic vertebra, fourth thoracic vertebra, ninth thoracic vertebra, second thoracic vertebra, seventh thoracic vertebra, sixth thoracic vertebra, tenth thoracic vertebra, third thoracic vertebra, twelfth thoracic vertebra
  - **Neck vertebrae** (the seven bones of your spine in your neck, which form its joints) — lights: atlas, axis, fifth cervical vertebra, fourth cervical vertebra, seventh cervical vertebra, sixth cervical vertebra, third cervical vertebra
- **Also working** (light blue):
  - **Deltoid** (the rounded muscle over your shoulder) — lights: acromial part of deltoid (both sides), clavicular part of deltoid (both sides), spinal part of deltoid (both sides)
  - **Upper trapezius** (top of your shoulders and neck) — lights: descending part of trapezius (both sides)
  - **Iliopsoas** (deep hip flexor at the front of your hip) — lights: iliacus (both sides), psoas major (both sides)
  - **Gastrocnemius** (the big calf muscle) — lights: lateral head of gastrocnemius (both sides), medial head of gastrocnemius (both sides)
- **How this helps your recovery:** Shoulder rolls, head turns, arm circles, gentle twists, marching and rocking from toes to heels take your main joints through easy, comfortable movement. Warming up like this can help your body feel looser and readier for other exercise, and it makes a gentle movement break during long spells of sitting.
- **Tissue line:** none (stages strip only)
- **3D view:** yes, starting from the right side

- [ ] **Approved** &nbsp;&nbsp; - [ ] **Hide 3D on this page** &nbsp;&nbsp; Notes:

---

### <a id="graded-walking-programme"></a>Graded Walking Programme
_General · Mobility phase_

Dev page: https://dev.physioonclick.co.uk/exercises/graded-walking-programme

- **Main focus** (bright blue):
  - **Gluteus medius** (side of your hip) — lights: gluteus medius (both sides)
  - **Quadriceps** (front of your thigh) — lights: rectus femoris (both sides), vastus intermedius (both sides), vastus lateralis (both sides), vastus medialis (both sides)
  - **Gastrocnemius** (the big calf muscle) — lights: lateral head of gastrocnemius (both sides), medial head of gastrocnemius (both sides)
- **Also working** (light blue):
  - **Gluteus maximus** (your main buttock muscle) — lights: gluteus maximus (both sides)
  - **Soleus** (deep calf muscle) — lights: soleus (both sides)
  - **Tibialis anterior** (front of your shin) — lights: tibialis anterior (both sides)
- **How this helps your recovery:** Walking works the muscles of your hips, thighs and calves while gently raising your heart rate. Starting at a time you can manage even on a poor day, and adding a little only when your current time feels easy, can help you rebuild fitness and stamina without the ups and downs of overdoing it.
- **Tissue line:** none (stages strip only)
- **3D view:** yes, starting from the right side

- [ ] **Approved** &nbsp;&nbsp; - [ ] **Hide 3D on this page** &nbsp;&nbsp; Notes:

---

### <a id="full-body-stretch-routine"></a>Full-Body Stretch Routine
_General · Mobility phase_

Dev page: https://dev.physioonclick.co.uk/exercises/full-body-stretch-routine

- **Main focus** (bright blue):
  - **Hamstrings** (back of your thigh) — lights: long head of biceps femoris (both sides), semimembranosus (both sides), semitendinosus (both sides), short head of biceps femoris (both sides)
  - **Quadriceps** (front of your thigh) — lights: rectus femoris (both sides), vastus intermedius (both sides), vastus lateralis (both sides), vastus medialis (both sides)
  - **Gastrocnemius** (the big calf muscle) — lights: lateral head of gastrocnemius (both sides), medial head of gastrocnemius (both sides)
- **Also working** (light blue):
  - **Pectoralis major** (your chest muscle) — lights: abdominal part of pectoralis major (both sides), clavicular part of pectoralis major (both sides), sternocostal part of pectoralis major (both sides)
  - **Rhomboids** (between your shoulder blades) — lights: rhomboid major (both sides), rhomboid minor (both sides)
  - **Upper trapezius** (top of your shoulders and neck) — lights: descending part of trapezius (both sides)
- **How this helps your recovery:** Holding gentle stretches for your calves, the front and back of your thighs, your chest, upper back and neck eases the big muscles that often feel stiff. Done regularly, this can help your body feel looser and make bending, reaching and turning your head more comfortable.
- **Tissue line:** none (stages strip only)
- **3D view:** yes, starting from the back

- [ ] **Approved** &nbsp;&nbsp; - [ ] **Hide 3D on this page** &nbsp;&nbsp; Notes:

---

### <a id="basic-bodyweight-circuit"></a>Basic Bodyweight Circuit
_General · Strength phase_

Dev page: https://dev.physioonclick.co.uk/exercises/basic-bodyweight-circuit

- **Main focus** (bright blue):
  - **Quadriceps** (front of your thigh) — lights: rectus femoris (both sides), vastus intermedius (both sides), vastus lateralis (both sides), vastus medialis (both sides)
  - **Gluteus maximus** (your main buttock muscle) — lights: gluteus maximus (both sides)
  - **Pectoralis major** (your chest muscle) — lights: abdominal part of pectoralis major (both sides), clavicular part of pectoralis major (both sides), sternocostal part of pectoralis major (both sides)
- **Also working** (light blue):
  - **Triceps** (back of your upper arm) — lights: lateral head of triceps brachii (both sides), long head of triceps brachii (both sides), medial head of triceps brachii (both sides)
  - **Front deltoid** (front of your shoulder) — lights: clavicular part of deltoid (both sides)
  - **Iliopsoas** (deep hip flexor at the front of your hip) — lights: iliacus (both sides), psoas major (both sides)
- **How this helps your recovery:** Sit-to-stands work your thighs and buttocks, wall push-ups work your chest, shoulders and the backs of your arms, and marching keeps your hips moving and raises your heart rate. Together they can help build the everyday strength you need to get up from a chair, push open doors and stay active, using just a chair and a wall.
- **Tissue line:** none (stages strip only)
- **3D view:** yes, starting from the front

- [ ] **Approved** &nbsp;&nbsp; - [ ] **Hide 3D on this page** &nbsp;&nbsp; Notes:

---

### <a id="pain-pacing-activity-plan"></a>Pain Pacing Activity Plan
_General · Early rehab_

Dev page: https://dev.physioonclick.co.uk/exercises/pain-pacing-activity-plan

- **Main focus** (bright blue):
  - **Nervous system** (your brain and nerves, which can become more sensitive when pain lasts) — not in the 3D model, so not lit
- **How this helps your recovery:** Doing a steady, planned amount of an activity, with breaks before pain builds, helps you avoid the cycle of overdoing it on good days and paying for it afterwards. Small, regular increases give your body and nervous system time to adjust, which can help you do more of the things that matter to you with fewer flare-ups.
- **Tissue line:** none (stages strip only)
- **3D view:** no, none of its main structures is in the 3D model — text only

- [ ] **Approved** &nbsp;&nbsp; - [ ] **Hide 3D on this page** &nbsp;&nbsp; Notes:

---

### <a id="graded-exposure-to-feared-movement"></a>Graded Exposure to Feared Movement
_General · Return to function_

Dev page: https://dev.physioonclick.co.uk/exercises/graded-exposure-to-feared-movement

- **Main focus** (bright blue):
  - **Nervous system** (your brain and nerves, which can become more sensitive when pain lasts) — not in the 3D model, so not lit
- **How this helps your recovery:** Breaking a movement you have been avoiding into small steps, and repeating each one calmly until it feels routine, helps your brain and body feel less on guard about it. As your confidence grows, the movement can start to feel easier and less worrying, helping you get back to everyday tasks such as bending, reaching or twisting.
- **Tissue line:** none (stages strip only)
- **3D view:** no, none of its main structures is in the 3D model — text only

- [ ] **Approved** &nbsp;&nbsp; - [ ] **Hide 3D on this page** &nbsp;&nbsp; Notes:

---

### <a id="return-to-sport-readiness-circuit"></a>Return-to-Sport Readiness Circuit
_General · Return to function_

Dev page: https://dev.physioonclick.co.uk/exercises/return-to-sport-readiness-circuit

- **Main focus** (bright blue):
  - **Quadriceps** (front of your thigh) — lights: rectus femoris (both sides), vastus intermedius (both sides), vastus lateralis (both sides), vastus medialis (both sides)
  - **Gluteus maximus** (your main buttock muscle) — lights: gluteus maximus (both sides)
  - **Gastrocnemius** (the big calf muscle) — lights: lateral head of gastrocnemius (both sides), medial head of gastrocnemius (both sides)
- **Also working** (light blue):
  - **Gluteus medius** (side of your hip) — lights: gluteus medius (both sides)
  - **Soleus** (deep calf muscle) — lights: soleus (both sides)
  - **Hamstrings** (back of your thigh) — lights: long head of biceps femoris (both sides), semimembranosus (both sides), semitendinosus (both sides), short head of biceps femoris (both sides)
- **How this helps your recovery:** Single-leg squats, hops, side-to-side bounds and shuttle runs work your thighs, buttocks and calves hard, testing your strength, balance and control at the speeds your sport needs. Comparing your injured side with the other over several sessions can help you and your physio judge when you are ready to return, rather than relying on one test.
- **Tissue line:** none (stages strip only)
- **3D view:** yes, starting from the right side

- [ ] **Approved** &nbsp;&nbsp; - [ ] **Hide 3D on this page** &nbsp;&nbsp; Notes:

---

### <a id="relaxation-and-breathing-for-pain-management"></a>Relaxation and Breathing for Pain Management
_General · Early rehab_

Dev page: https://dev.physioonclick.co.uk/exercises/relaxation-and-breathing-for-pain-management

- **Main focus** (bright blue):
  - **Diaphragm** (the dome-shaped breathing muscle under your ribs) — lights: diaphragm
- **How this helps your recovery:** Slow belly breathing works your main breathing muscle, and a gentle out-breath that is a little longer than the in-breath can help your body settle. Tensing and then letting go of each muscle group helps you notice and release tension, which may help take the edge off pain and make it easier to rest.
- **Tissue line:** none (stages strip only)
- **3D view:** yes, starting from the front

- [ ] **Approved** &nbsp;&nbsp; - [ ] **Hide 3D on this page** &nbsp;&nbsp; Notes:

---

## Balance and neurological

### <a id="tandem-balance-hold"></a>Tandem Balance Hold
_Balance · Mobility phase_

Dev page: https://dev.physioonclick.co.uk/exercises/tandem-balance-hold

- **Main focus** (bright blue):
  - **Fibularis longus and brevis (peroneals)** (outside of your lower leg and ankle) — lights: fibularis brevis (both sides), fibularis longus (both sides)
  - **Tibialis anterior** (front of your shin) — lights: tibialis anterior (both sides)
  - **Gluteus medius** (side of your hip) — lights: gluteus medius (both sides)
- **Also working** (light blue):
  - **Tibialis posterior** (deep in the back of your lower leg, its tendon running behind your inner ankle to support your arch) — lights: tibialis posterior (both sides)
  - **Soleus** (deep calf muscle) — lights: soleus (both sides)
- **How this helps your recovery:** Standing with one foot directly in front of the other narrows your base, so the muscles around your ankles and the sides of your hips make lots of small corrections to keep you steady. Practising with a firm surface within reach can help you feel steadier on your feet, which may help lower your risk of a fall.
- **Tissue line:** none (stages strip only)
- **3D view:** yes, starting from the right side

- [ ] **Approved** &nbsp;&nbsp; - [ ] **Hide 3D on this page** &nbsp;&nbsp; Notes:

---

### <a id="single-leg-balance"></a>Single Leg Balance
_Balance · Mobility phase_

Dev page: https://dev.physioonclick.co.uk/exercises/single-leg-balance

- **Main focus** (bright blue):
  - **Gluteus medius** (side of your hip) — lights: gluteus medius (both sides)
  - **Fibularis longus and brevis (peroneals)** (outside of your lower leg and ankle) — lights: fibularis brevis (both sides), fibularis longus (both sides)
  - **Tibialis anterior** (front of your shin) — lights: tibialis anterior (both sides)
- **Also working** (light blue):
  - **Gluteus minimus** (deep side of your hip) — lights: gluteus minimus (both sides)
  - **Tibialis posterior** (deep in the back of your lower leg, its tendon running behind your inner ankle to support your arch) — lights: tibialis posterior (both sides)
  - **Soleus** (deep calf muscle) — lights: soleus (both sides)
- **How this helps your recovery:** Standing on one leg makes the muscles on the side of your standing hip work to keep your pelvis level, while the muscles around your ankle make small corrections. Building this control with a support nearby can help you feel steadier in the single-leg moments of everyday life, such as walking, climbing stairs and stepping up a kerb.
- **Tissue line:** none (stages strip only)
- **3D view:** yes, starting from the right side

- [ ] **Approved** &nbsp;&nbsp; - [ ] **Hide 3D on this page** &nbsp;&nbsp; Notes:

---

### <a id="static-standing-balance-eyes-open"></a>Static Standing Balance (Eyes Open)
_Balance · Early rehab_

Dev page: https://dev.physioonclick.co.uk/exercises/static-standing-balance-eyes-open

- **Main focus** (bright blue):
  - **Soleus** (deep calf muscle) — lights: soleus (both sides)
  - **Tibialis anterior** (front of your shin) — lights: tibialis anterior (both sides)
- **Also working** (light blue):
  - **Gastrocnemius** (the big calf muscle) — lights: lateral head of gastrocnemius (both sides), medial head of gastrocnemius (both sides)
- **How this helps your recovery:** Standing still with your feet together narrows your base, so the muscles of your calves and shins make small, steady adjustments at your ankles to keep you upright. Practising near a firm surface can help build your standing balance and confidence for everyday moments, such as standing at the sink, at a worktop or in a queue.
- **Tissue line:** none (stages strip only)
- **3D view:** yes, starting from the right side

- [ ] **Approved** &nbsp;&nbsp; - [ ] **Hide 3D on this page** &nbsp;&nbsp; Notes:

---

### <a id="static-standing-balance-eyes-closed"></a>Static Standing Balance (Eyes Closed)
_Balance · Mobility phase_

Dev page: https://dev.physioonclick.co.uk/exercises/static-standing-balance-eyes-closed

- **Main focus** (bright blue):
  - **Soleus** (deep calf muscle) — lights: soleus (both sides)
  - **Tibialis anterior** (front of your shin) — lights: tibialis anterior (both sides)
- **Also working** (light blue):
  - **Gastrocnemius** (the big calf muscle) — lights: lateral head of gastrocnemius (both sides), medial head of gastrocnemius (both sides)
  - **Small foot muscles** (the muscles in the sole of your foot) — lights: abductor digiti minimi of foot (both sides), abductor hallucis (both sides), first lumbrical of foot (both sides), first plantar interosseous of foot (both sides), flexor accessorius (both sides), flexor digiti minimi brevis of foot (both sides), flexor digitorum brevis (both sides), fourth lumbrical of foot (both sides), lateral head of flexor hallucis brevis (both sides), medial head of flexor hallucis brevis (both sides), oblique head of adductor hallucis (both sides), opponens digiti minimi of foot (both sides), second lumbrical of foot (both sides), second plantar interosseous of foot (both sides), third lumbrical of foot (both sides), third plantar interosseous of foot (both sides), transverse head of adductor hallucis (both sides)
- **How this helps your recovery:** With your eyes closed, your body relies more on what your feet feel and on the balance sense in your inner ear, so your calf, shin and foot muscles work harder at your ankles. Practising with a hand on your support can help you feel steadier when it is harder to see, such as in dim light.
- **Tissue line:** none (stages strip only)
- **3D view:** yes, starting from the right side

- [ ] **Approved** &nbsp;&nbsp; - [ ] **Hide 3D on this page** &nbsp;&nbsp; Notes:

---

### <a id="weight-shifting"></a>Weight Shifting
_Balance · Early rehab_

Dev page: https://dev.physioonclick.co.uk/exercises/weight-shifting

- **Main focus** (bright blue):
  - **Gluteus medius** (side of your hip) — lights: gluteus medius (both sides)
  - **Soleus** (deep calf muscle) — lights: soleus (both sides)
  - **Tibialis anterior** (front of your shin) — lights: tibialis anterior (both sides)
- **Also working** (light blue):
  - **Gastrocnemius** (the big calf muscle) — lights: lateral head of gastrocnemius (both sides), medial head of gastrocnemius (both sides)
  - **Quadriceps** (front of your thigh) — lights: rectus femoris (both sides), vastus intermedius (both sides), vastus lateralis (both sides), vastus medialis (both sides)
- **How this helps your recovery:** Slowly moving your weight from side to side, then forwards and back, works the muscles at the sides of your hips and around your ankles that control how far you can lean. With a worktop or sturdy chair to hold, getting used to taking weight evenly through each leg can help you feel more confident standing and stepping.
- **Tissue line:** Nerves and the brain
- **3D view:** yes, starting from the right side

- [ ] **Approved** &nbsp;&nbsp; - [ ] **Hide 3D on this page** &nbsp;&nbsp; Notes:

---

### <a id="sideways-walking"></a>Sideways Walking
_Balance · Mobility phase_

Dev page: https://dev.physioonclick.co.uk/exercises/sideways-walking

- **Main focus** (bright blue):
  - **Gluteus medius** (side of your hip) — lights: gluteus medius (both sides)
- **Also working** (light blue):
  - **Gluteus minimus** (deep side of your hip) — lights: gluteus minimus (both sides)
  - **Tensor fasciae latae and IT band** (outside of your hip and thigh) — lights: iliotibial tract (both sides), tensor fasciae latae (both sides)
  - **Adductors** (inner thigh) — lights: adductor brevis (both sides), adductor longus (both sides), adductor magnus (both sides), adductor minimus (both sides), gracilis (both sides), pectineus (both sides)
- **How this helps your recovery:** Stepping sideways works the muscles on the side of your hips, which steady your pelvis each time your weight moves from one leg to the other. Stronger, better-controlled hip muscles can help you feel steadier when you step aside on a busy pavement, move around the kitchen or walk on uneven ground.
- **Tissue line:** none (stages strip only)
- **3D view:** yes, starting from the right side

- [ ] **Approved** &nbsp;&nbsp; - [ ] **Hide 3D on this page** &nbsp;&nbsp; Notes:

---

### <a id="heel-to-toe-walking-tandem-gait"></a>Heel-to-Toe Walking (Tandem Gait)
_Balance · Strength phase_

Dev page: https://dev.physioonclick.co.uk/exercises/heel-to-toe-walking-tandem-gait

- **Main focus** (bright blue):
  - **Fibularis longus and brevis (peroneals)** (outside of your lower leg and ankle) — lights: fibularis brevis (both sides), fibularis longus (both sides)
  - **Tibialis anterior** (front of your shin) — lights: tibialis anterior (both sides)
  - **Gluteus medius** (side of your hip) — lights: gluteus medius (both sides)
- **Also working** (light blue):
  - **Tibialis posterior** (deep in the back of your lower leg, its tendon running behind your inner ankle to support your arch) — lights: tibialis posterior (both sides)
  - **Soleus** (deep calf muscle) — lights: soleus (both sides)
- **How this helps your recovery:** Walking heel to toe along a line narrows your base, so the muscles around your ankles and the sides of your hips make lots of small corrections with every step. Practising beside a wall or worktop can sharpen your balance on the move, which may help you feel steadier in narrow spaces such as hallways and doorways.
- **Tissue line:** none (stages strip only)
- **3D view:** yes, starting from the right side

- [ ] **Approved** &nbsp;&nbsp; - [ ] **Hide 3D on this page** &nbsp;&nbsp; Notes:

---

### <a id="marching-on-the-spot"></a>Marching on the Spot
_Balance · Early rehab_

Dev page: https://dev.physioonclick.co.uk/exercises/marching-on-the-spot

- **Main focus** (bright blue):
  - **Iliopsoas** (deep hip flexor at the front of your hip) — lights: iliacus (both sides), psoas major (both sides)
  - **Gluteus medius** (side of your hip) — lights: gluteus medius (both sides)
- **Also working** (light blue):
  - **Rectus femoris** (the thigh muscle that also lifts your leg at the hip) — lights: rectus femoris (both sides)
- **How this helps your recovery:** Lifting each knee in turn works the deep hip flexor at the front of your hip, while the side of your standing hip keeps your pelvis level. This can help you lift your feet clear of the ground as you walk and feel more confident on one leg, such as on stairs or stepping up a kerb.
- **Tissue line:** none (stages strip only)
- **3D view:** yes, starting from the front

- [ ] **Approved** &nbsp;&nbsp; - [ ] **Hide 3D on this page** &nbsp;&nbsp; Notes:

---

### <a id="backward-walking"></a>Backward Walking
_Balance · Return to function_

Dev page: https://dev.physioonclick.co.uk/exercises/backward-walking

- **Main focus** (bright blue):
  - **Hamstrings** (back of your thigh) — lights: long head of biceps femoris (both sides), semimembranosus (both sides), semitendinosus (both sides), short head of biceps femoris (both sides)
  - **Gluteus maximus** (your main buttock muscle) — lights: gluteus maximus (both sides)
  - **Quadriceps** (front of your thigh) — lights: rectus femoris (both sides), vastus intermedius (both sides), vastus lateralis (both sides), vastus medialis (both sides)
- **Also working** (light blue):
  - **Gastrocnemius** (the big calf muscle) — lights: lateral head of gastrocnemius (both sides), medial head of gastrocnemius (both sides)
  - **Soleus** (deep calf muscle) — lights: soleus (both sides)
- **How this helps your recovery:** Reaching each foot behind you works the muscles at the back of your hips and thighs, while your thigh and calf muscles control the landing as you lower your heel. Because you cannot see behind you, practising can sharpen your feel for where your feet are, which may help you step back from a door or cupboard more steadily.
- **Tissue line:** none (stages strip only)
- **3D view:** yes, starting from the right side

- [ ] **Approved** &nbsp;&nbsp; - [ ] **Hide 3D on this page** &nbsp;&nbsp; Notes:

---

### <a id="sit-to-stand-repetitions"></a>Sit-to-Stand Repetitions
_Balance · Strength phase_

Dev page: https://dev.physioonclick.co.uk/exercises/sit-to-stand-repetitions

- **Main focus** (bright blue):
  - **Quadriceps** (front of your thigh) — lights: rectus femoris (both sides), vastus intermedius (both sides), vastus lateralis (both sides), vastus medialis (both sides)
  - **Gluteus maximus** (your main buttock muscle) — lights: gluteus maximus (both sides)
- **Also working** (light blue):
  - **Hamstrings** (back of your thigh) — lights: long head of biceps femoris (both sides), semimembranosus (both sides), semitendinosus (both sides), short head of biceps femoris (both sides)
  - **Gluteus medius** (side of your hip) — lights: gluteus medius (both sides)
- **How this helps your recovery:** Standing up from a chair and lowering slowly back down, with your arms folded, works the front of your thighs and your buttocks hard. Stronger legs can make getting up from chairs, the toilet and the car easier, and building this strength may help lower your risk of a fall.
- **Tissue line:** none (stages strip only)
- **3D view:** yes, starting from the front

- [ ] **Approved** &nbsp;&nbsp; - [ ] **Hide 3D on this page** &nbsp;&nbsp; Notes:

---

### <a id="obstacle-stepping"></a>Obstacle Stepping
_Balance · Return to function_

Dev page: https://dev.physioonclick.co.uk/exercises/obstacle-stepping

- **Main focus** (bright blue):
  - **Iliopsoas** (deep hip flexor at the front of your hip) — lights: iliacus (both sides), psoas major (both sides)
  - **Tibialis anterior** (front of your shin) — lights: tibialis anterior (both sides)
- **Also working** (light blue):
  - **Hamstrings** (back of your thigh) — lights: long head of biceps femoris (both sides), semimembranosus (both sides), semitendinosus (both sides), short head of biceps femoris (both sides)
- **How this helps your recovery:** Stepping over low objects works the deep hip flexor that lifts your knee and the muscle at the front of your shin that lifts your toes, so your foot clears the ground. Practising this can help you lift your feet more reliably, which may help lower your risk of tripping on kerbs, rugs and doorsteps.
- **Tissue line:** none (stages strip only)
- **3D view:** yes, starting from the front

- [ ] **Approved** &nbsp;&nbsp; - [ ] **Hide 3D on this page** &nbsp;&nbsp; Notes:

---

### <a id="stair-negotiation-practice"></a>Stair Negotiation Practice
_Balance · Return to function_

Dev page: https://dev.physioonclick.co.uk/exercises/stair-negotiation-practice

- **Main focus** (bright blue):
  - **Quadriceps** (front of your thigh) — lights: rectus femoris (both sides), vastus intermedius (both sides), vastus lateralis (both sides), vastus medialis (both sides)
  - **Gluteus maximus** (your main buttock muscle) — lights: gluteus maximus (both sides)
- **How this helps your recovery:** Going up and down one step at a time works the front of your thighs and your buttocks, with your stronger leg leading up and your weaker or operated leg leading down. Practising with the handrail, within any limits from your surgeon or physio, can help you build the strength and confidence to manage the stairs at home.
- **Tissue line:** After surgery
- **3D view:** yes, starting from the front

- [ ] **Approved** &nbsp;&nbsp; - [ ] **Hide 3D on this page** &nbsp;&nbsp; Notes:

---

### <a id="single-leg-stance-with-arm-reach"></a>Single Leg Stance with Arm Reach
_Balance · Return to function_

Dev page: https://dev.physioonclick.co.uk/exercises/single-leg-stance-with-arm-reach

- **Main focus** (bright blue):
  - **Gluteus medius** (side of your hip) — lights: gluteus medius (both sides)
  - **Gluteus maximus** (your main buttock muscle) — lights: gluteus maximus (both sides)
  - **Quadriceps** (front of your thigh) — lights: rectus femoris (both sides), vastus intermedius (both sides), vastus lateralis (both sides), vastus medialis (both sides)
- **Also working** (light blue):
  - **Tibialis posterior** (deep in the back of your lower leg, its tendon running behind your inner ankle to support your arch) — lights: tibialis posterior (both sides)
  - **External oblique** (side of your tummy) — lights: external oblique (both sides)
- **How this helps your recovery:** Reaching in different directions on one leg makes the muscles of your standing hip and thigh work to keep your pelvis level and your knee in line over your foot. This can build the control you need as your body moves over a planted foot when you land, change direction or reach for a ball in sport.
- **Tissue line:** none (stages strip only)
- **3D view:** yes, starting from the right side

- [ ] **Approved** &nbsp;&nbsp; - [ ] **Hide 3D on this page** &nbsp;&nbsp; Notes:

---

### <a id="treadmill-or-level-ground-gait-practice"></a>Treadmill or Level Ground Gait Practice
_Balance · Mobility phase_

Dev page: https://dev.physioonclick.co.uk/exercises/treadmill-or-level-ground-gait-practice

- **Main focus** (bright blue):
  - **Gluteus medius** (side of your hip) — lights: gluteus medius (both sides)
  - **Quadriceps** (front of your thigh) — lights: rectus femoris (both sides), vastus intermedius (both sides), vastus lateralis (both sides), vastus medialis (both sides)
  - **Gastrocnemius** (the big calf muscle) — lights: lateral head of gastrocnemius (both sides), medial head of gastrocnemius (both sides)
- **Also working** (light blue):
  - **Gluteus maximus** (your main buttock muscle) — lights: gluteus maximus (both sides)
  - **Soleus** (deep calf muscle) — lights: soleus (both sides)
  - **Tibialis anterior** (front of your shin) — lights: tibialis anterior (both sides)
- **How this helps your recovery:** Walking at a comfortable pace works the muscles of your hips, thighs and calves while gently raising your heart rate. Adding a little time only when your current walk feels easy can help you walk further with more confidence, whether that is to the shops, the bus stop or round the park.
- **Tissue line:** none (stages strip only)
- **3D view:** yes, starting from the right side

- [ ] **Approved** &nbsp;&nbsp; - [ ] **Hide 3D on this page** &nbsp;&nbsp; Notes:

---

### <a id="standing-on-one-leg-hand-support"></a>Standing on One Leg (Hand Support)
_Balance · Early rehab_

Dev page: https://dev.physioonclick.co.uk/exercises/standing-on-one-leg-hand-support

- **Main focus** (bright blue):
  - **Gluteus medius** (side of your hip) — lights: gluteus medius (both sides)
- **Also working** (light blue):
  - **Gluteus minimus** (deep side of your hip) — lights: gluteus minimus (both sides)
  - **Fibularis longus and brevis (peroneals)** (outside of your lower leg and ankle) — lights: fibularis brevis (both sides), fibularis longus (both sides)
  - **Tibialis anterior** (front of your shin) — lights: tibialis anterior (both sides)
- **How this helps your recovery:** Lifting one foot just clear of the floor, with a hand resting on the worktop, works the muscles on the side of your standing hip that keep your pelvis level. This is a gentle starting point for the single-leg moments of everyday life, such as walking, climbing stairs and stepping up a kerb.
- **Tissue line:** none (stages strip only)
- **3D view:** yes, starting from the right side

- [ ] **Approved** &nbsp;&nbsp; - [ ] **Hide 3D on this page** &nbsp;&nbsp; Notes:

---

### <a id="turning-practice"></a>Turning Practice
_Balance · Mobility phase_

Dev page: https://dev.physioonclick.co.uk/exercises/turning-practice

- **Main focus** (bright blue):
  - **Gluteus medius** (side of your hip) — lights: gluteus medius (both sides)
- **Also working** (light blue):
  - **Deep hip rotators** (deep muscles at the back of your hip, including piriformis) — lights: gemellus inferior (both sides), gemellus superior (both sides), obturator externus (both sides), obturator internus (both sides), piriformis (both sides), quadratus femoris (both sides)
- **How this helps your recovery:** Turning in a curve with several small steps keeps your weight moving from foot to foot, working the muscles at the side and back of your hips that steady and turn your pelvis. With a wall or worktop within reach, slow turns with your eyes leading can help you feel steadier when you change direction in the kitchen or hallway.
- **Tissue line:** none (stages strip only)
- **3D view:** yes, starting from the right side

- [ ] **Approved** &nbsp;&nbsp; - [ ] **Hide 3D on this page** &nbsp;&nbsp; Notes:

---

### <a id="dual-task-walking"></a>Dual-Task Walking
_Balance · Return to function_

Dev page: https://dev.physioonclick.co.uk/exercises/dual-task-walking

- **Main focus** (bright blue):
  - **Gluteus medius** (side of your hip) — lights: gluteus medius (both sides)
  - **Quadriceps** (front of your thigh) — lights: rectus femoris (both sides), vastus intermedius (both sides), vastus lateralis (both sides), vastus medialis (both sides)
  - **Gastrocnemius** (the big calf muscle) — lights: lateral head of gastrocnemius (both sides), medial head of gastrocnemius (both sides)
- **How this helps your recovery:** Walking works the muscles of your hips, thighs and calves, and adding a simple thinking task trains your brain to keep your walking steady while your attention is elsewhere. With someone beside you or a wall alongside at first, this can help you feel more confident when you walk and think at once, such as chatting with a friend.
- **Tissue line:** none (stages strip only)
- **3D view:** yes, starting from the right side

- [ ] **Approved** &nbsp;&nbsp; - [ ] **Hide 3D on this page** &nbsp;&nbsp; Notes:

---

### <a id="uneven-surface-walking"></a>Uneven Surface Walking
_Balance · Return to function_

Dev page: https://dev.physioonclick.co.uk/exercises/uneven-surface-walking

- **Main focus** (bright blue):
  - **Fibularis longus and brevis (peroneals)** (outside of your lower leg and ankle) — lights: fibularis brevis (both sides), fibularis longus (both sides)
  - **Tibialis anterior** (front of your shin) — lights: tibialis anterior (both sides)
  - **Tibialis posterior** (deep in the back of your lower leg, its tendon running behind your inner ankle to support your arch) — lights: tibialis posterior (both sides)
- **Also working** (light blue):
  - **Soleus** (deep calf muscle) — lights: soleus (both sides)
  - **Iliopsoas** (deep hip flexor at the front of your hip) — lights: iliacus (both sides), psoas major (both sides)
- **How this helps your recovery:** Walking on grass or a gently uneven path makes the muscles around your ankles adjust to the bumps with every step, while slightly higher steps work the front of your hips. Practising on dry, firm ground with a helper beside you can help you feel steadier and more confident on paths, in the park or in the garden.
- **Tissue line:** none (stages strip only)
- **3D view:** yes, starting from the right side

- [ ] **Approved** &nbsp;&nbsp; - [ ] **Hide 3D on this page** &nbsp;&nbsp; Notes:

---

### <a id="bed-mobility-rolling"></a>Bed Mobility Rolling
_Neuro · Early rehab_

Dev page: https://dev.physioonclick.co.uk/exercises/bed-mobility-rolling

- **Main focus** (bright blue):
  - **External oblique** (side of your tummy) — lights: external oblique (both sides)
  - **Pectoralis major** (your chest muscle) — lights: abdominal part of pectoralis major (both sides), clavicular part of pectoralis major (both sides), sternocostal part of pectoralis major (both sides)
- **Also working** (light blue):
  - **Front deltoid** (front of your shoulder) — lights: clavicular part of deltoid (both sides)
  - **Sternocleidomastoid** (the muscle running down the side of your neck) — lights: sternocleidomastoid (both sides)
- **How this helps your recovery:** Turning your head, reaching your arm across and letting your knees drop works the muscles at the side of your tummy and across your chest to roll you over as one unit. Practising this can help you move more independently in bed, so you can get comfortable, change position and get ready to sit up.
- **Tissue line:** Nerves and the brain
- **3D view:** yes, starting from the right side

- [ ] **Approved** &nbsp;&nbsp; - [ ] **Hide 3D on this page** &nbsp;&nbsp; Notes:

---

### <a id="bridging-for-transfers"></a>Bridging for Transfers
_Neuro · Early rehab_

Dev page: https://dev.physioonclick.co.uk/exercises/bridging-for-transfers

- **Main focus** (bright blue):
  - **Gluteus maximus** (your main buttock muscle) — lights: gluteus maximus (both sides)
- **Also working** (light blue):
  - **Hamstrings** (back of your thigh) — lights: long head of biceps femoris (both sides), semimembranosus (both sides), semitendinosus (both sides), short head of biceps femoris (both sides)
  - **Gluteus medius** (side of your hip) — lights: gluteus medius (both sides)
- **How this helps your recovery:** Pressing through both feet to lift your hips works your buttocks and the backs of your thighs, while keeping your hips level asks your weaker side to do its share. Being able to lift your hips can make it easier to move up the bed, pull up trousers while lying down and get ready to move across for a transfer.
- **Tissue line:** Nerves and the brain
- **3D view:** yes, starting from the back

- [ ] **Approved** &nbsp;&nbsp; - [ ] **Hide 3D on this page** &nbsp;&nbsp; Notes:

---

### <a id="sit-to-stand-with-support"></a>Sit-to-Stand with Support
_Neuro · Early rehab_

Dev page: https://dev.physioonclick.co.uk/exercises/sit-to-stand-with-support

- **Main focus** (bright blue):
  - **Quadriceps** (front of your thigh) — lights: rectus femoris (both sides), vastus intermedius (both sides), vastus lateralis (both sides), vastus medialis (both sides)
  - **Gluteus maximus** (your main buttock muscle) — lights: gluteus maximus (both sides)
- **Also working** (light blue):
  - **Triceps** (back of your upper arm) — lights: lateral head of triceps brachii (both sides), long head of triceps brachii (both sides), medial head of triceps brachii (both sides)
- **How this helps your recovery:** Leaning forwards and pushing through your feet and the armrests works the front of your thighs and your buttocks, with the backs of your arms helping, and lowering slowly works them again. Practising with your weight even through both feet can help you stand up and sit down more steadily from your chair, the toilet or the bed.
- **Tissue line:** Nerves and the brain
- **3D view:** yes, starting from the front

- [ ] **Approved** &nbsp;&nbsp; - [ ] **Hide 3D on this page** &nbsp;&nbsp; Notes:

---

### <a id="weight-bearing-through-affected-leg"></a>Weight-Bearing Through Affected Leg
_Neuro · Mobility phase_

Dev page: https://dev.physioonclick.co.uk/exercises/weight-bearing-through-affected-leg

- **Main focus** (bright blue):
  - **Gluteus medius** (side of your hip) — lights: gluteus medius (both sides)
  - **Quadriceps** (front of your thigh) — lights: rectus femoris (both sides), vastus intermedius (both sides), vastus lateralis (both sides), vastus medialis (both sides)
- **How this helps your recovery:** Shifting your weight onto your affected leg, with the knee soft rather than locked, works the side of your hip and the front of your thigh to hold you steady over that foot. Feeling the leg take your weight can help rebuild strength and confidence in it, a step towards standing, stepping and walking more evenly.
- **Tissue line:** Nerves and the brain
- **3D view:** yes, starting from the right side

- [ ] **Approved** &nbsp;&nbsp; - [ ] **Hide 3D on this page** &nbsp;&nbsp; Notes:

---

### <a id="reaching-tasks-affected-arm"></a>Reaching Tasks (Affected Arm)
_Neuro · Mobility phase_

Dev page: https://dev.physioonclick.co.uk/exercises/reaching-tasks-affected-arm

- **Main focus** (bright blue):
  - **Front deltoid** (front of your shoulder) — lights: clavicular part of deltoid (both sides)
  - **Triceps** (back of your upper arm) — lights: lateral head of triceps brachii (both sides), long head of triceps brachii (both sides), medial head of triceps brachii (both sides)
- **Also working** (light blue):
  - **Serratus anterior** (side of your ribs, holding your shoulder blade flat) — lights: serratus anterior (both sides)
  - **Wrist extensors** (top of your forearm, bending your wrist back) — lights: extensor carpi radialis brevis (both sides), extensor carpi radialis longus (both sides), extensor carpi ulnaris (both sides)
- **How this helps your recovery:** Sliding your affected hand out to an object and back works the front of your shoulder and the back of your upper arm, while your trunk stays still. Using the affected arm as much as you can, and resting when it tires, can help your brain relearn reaching for everyday tasks such as picking up a cup or the remote.
- **Tissue line:** Nerves and the brain
- **3D view:** yes, starting from the front

- [ ] **Approved** &nbsp;&nbsp; - [ ] **Hide 3D on this page** &nbsp;&nbsp; Notes:

---

### <a id="parkinsons-big-movements-lsvt-style"></a>Parkinson's Big Movements (LSVT-style)
_Neuro · Strength phase_

Dev page: https://dev.physioonclick.co.uk/exercises/parkinsons-big-movements-lsvt-style

- **Main focus** (bright blue):
  - **Deltoid** (the rounded muscle over your shoulder) — lights: acromial part of deltoid (both sides), clavicular part of deltoid (both sides), spinal part of deltoid (both sides)
  - **Quadriceps** (front of your thigh) — lights: rectus femoris (both sides), vastus intermedius (both sides), vastus lateralis (both sides), vastus medialis (both sides)
  - **Gluteus maximus** (your main buttock muscle) — lights: gluteus maximus (both sides)
- **Also working** (light blue):
  - **Iliopsoas** (deep hip flexor at the front of your hip) — lights: iliacus (both sides), psoas major (both sides)
  - **Erector spinae (trunk part)** (the long muscles either side of your spine, from your pelvis up to the base of your neck) — lights: iliocostalis lumborum (both sides), iliocostalis thoracis (both sides), longissimus thoracis (both sides), spinalis thoracis (both sides)
- **How this helps your recovery:** Huge arm reaches and long steps work the muscles of your shoulders, hips and thighs through their fullest range, while standing tall works the muscles along your spine. With Parkinson's, movements can become smaller without you noticing. Practising movements that feel bigger than they need to be can help your everyday steps and reaches become larger and more confident.
- **Tissue line:** none (stages strip only)
- **3D view:** yes, starting from the right side

- [ ] **Approved** &nbsp;&nbsp; - [ ] **Hide 3D on this page** &nbsp;&nbsp; Notes:

---

### <a id="rhythmic-stepping-to-a-beat"></a>Rhythmic Stepping to a Beat
_Neuro · Return to function_

Dev page: https://dev.physioonclick.co.uk/exercises/rhythmic-stepping-to-a-beat

- **Main focus** (bright blue):
  - **Iliopsoas** (deep hip flexor at the front of your hip) — lights: iliacus (both sides), psoas major (both sides)
  - **Tibialis anterior** (front of your shin) — lights: tibialis anterior (both sides)
- **Also working** (light blue):
  - **Rectus femoris** (the thigh muscle that also lifts your leg at the hip) — lights: rectus femoris (both sides)
- **How this helps your recovery:** Stepping in time to a beat works the deep hip flexors that lift your knees and the shin muscles that lift your toes, so each foot clears the floor and lands heel first. For many people with Parkinson's, a steady rhythm helps keep steps even, and restarting the beat can help you get going again if your feet freeze.
- **Tissue line:** none (stages strip only)
- **3D view:** yes, starting from the front

- [ ] **Approved** &nbsp;&nbsp; - [ ] **Hide 3D on this page** &nbsp;&nbsp; Notes:

---

### <a id="multiple-sclerosis-fatigue-paced-circuit"></a>Multiple Sclerosis Fatigue-Paced Circuit
_Neuro · Mobility phase_

Dev page: https://dev.physioonclick.co.uk/exercises/multiple-sclerosis-fatigue-paced-circuit

- **Main focus** (bright blue):
  - **Quadriceps** (front of your thigh) — lights: rectus femoris (both sides), vastus intermedius (both sides), vastus lateralis (both sides), vastus medialis (both sides)
  - **Gluteus maximus** (your main buttock muscle) — lights: gluteus maximus (both sides)
  - **Gastrocnemius** (the big calf muscle) — lights: lateral head of gastrocnemius (both sides), medial head of gastrocnemius (both sides)
- **Also working** (light blue):
  - **Iliopsoas** (deep hip flexor at the front of your hip) — lights: iliacus (both sides), psoas major (both sides)
  - **Soleus** (deep calf muscle) — lights: soleus (both sides)
  - **Gluteus medius** (side of your hip) — lights: gluteus medius (both sides)
- **How this helps your recovery:** Slow sit-to-stands, seated marches, heel raises and side steps gently work your thighs, buttocks, hips and calves, with a rest after each part. Resting before you feel tired, and stopping early if your legs feel heavy, can help you stay active and build some strength while you manage MS fatigue.
- **Tissue line:** none (stages strip only)
- **3D view:** yes, starting from the front

- [ ] **Approved** &nbsp;&nbsp; - [ ] **Hide 3D on this page** &nbsp;&nbsp; Notes:

---

### <a id="coordination-drills-finger-to-nose"></a>Coordination Drills (Finger to Nose)
_Neuro · Early rehab_

Dev page: https://dev.physioonclick.co.uk/exercises/coordination-drills-finger-to-nose

> **Changed in the 1 Nov accuracy pass (medium confidence):** Brachialis added to main focus, because it is the main elbow bender in every forearm position.

- **Main focus** (bright blue):
  - **Biceps** (front of your upper arm) — lights: long head of biceps brachii (both sides), short head of biceps brachii (both sides)
  - **Brachialis** (deep front of your upper arm) — lights: brachialis (both sides)
  - **Triceps** (back of your upper arm) — lights: lateral head of triceps brachii (both sides), long head of triceps brachii (both sides), medial head of triceps brachii (both sides)
- **Also working** (light blue):
  - **Front deltoid** (front of your shoulder) — lights: clavicular part of deltoid (both sides)
- **How this helps your recovery:** Bending your elbow to bring your finger to your nose, then straightening it to reach the target, works the muscles at the front and back of your upper arm in turn. Slow, smooth practice, with your eyes guiding your finger, can help your brain fine-tune these movements, which may make everyday tasks such as eating and drinking feel more controlled.
- **Tissue line:** none (stages strip only)
- **3D view:** yes, starting from the front

- [ ] **Approved** &nbsp;&nbsp; - [ ] **Hide 3D on this page** &nbsp;&nbsp; Notes:

---

### <a id="heel-shin-slide-coordination"></a>Heel-Shin Slide (Coordination)
_Neuro · Early rehab_

Dev page: https://dev.physioonclick.co.uk/exercises/heel-shin-slide-coordination

- **Main focus** (bright blue):
  - **Hamstrings** (back of your thigh) — lights: long head of biceps femoris (both sides), semimembranosus (both sides), semitendinosus (both sides), short head of biceps femoris (both sides)
  - **Quadriceps** (front of your thigh) — lights: rectus femoris (both sides), vastus intermedius (both sides), vastus lateralis (both sides), vastus medialis (both sides)
- **Also working** (light blue):
  - **Iliopsoas** (deep hip flexor at the front of your hip) — lights: iliacus (both sides), psoas major (both sides)
  - **Adductors** (inner thigh) — lights: adductor brevis (both sides), adductor longus (both sides), adductor magnus (both sides), adductor minimus (both sides), gracilis (both sides), pectineus (both sides)
- **How this helps your recovery:** Sliding your heel slowly down and back up your other shin works the muscles at the back and front of your thigh in turn, while your hip holds the leg steady. Keeping your heel on a straight track gives your brain practice at guiding your leg, which may help you place your feet more accurately as you walk.
- **Tissue line:** none (stages strip only)
- **3D view:** yes, starting from the right side

- [ ] **Approved** &nbsp;&nbsp; - [ ] **Hide 3D on this page** &nbsp;&nbsp; Notes:

---

### <a id="standing-balance-with-visual-feedback"></a>Standing Balance with Visual Feedback
_Neuro · Mobility phase_

Dev page: https://dev.physioonclick.co.uk/exercises/standing-balance-with-visual-feedback

- **Main focus** (bright blue):
  - **Gluteus medius** (side of your hip) — lights: gluteus medius (both sides)
  - **Erector spinae (trunk part)** (the long muscles either side of your spine, from your pelvis up to the base of your neck) — lights: iliocostalis lumborum (both sides), iliocostalis thoracis (both sides), longissimus thoracis (both sides), spinalis thoracis (both sides)
- **Also working** (light blue):
  - **Quadriceps** (front of your thigh) — lights: rectus femoris (both sides), vastus intermedius (both sides), vastus lateralis (both sides), vastus medialis (both sides)
- **How this helps your recovery:** Using the mirror to line up your shoulders and hips and spread your weight evenly works the muscles at the sides of your hips and along your spine to hold you upright. Seeing what straight looks like can help your brain relearn where the middle is, so you may feel steadier standing without leaning on your stronger leg.
- **Tissue line:** Nerves and the brain
- **3D view:** yes, starting from the back

- [ ] **Approved** &nbsp;&nbsp; - [ ] **Hide 3D on this page** &nbsp;&nbsp; Notes:

---

### <a id="functional-grasp-and-release"></a>Functional Grasp and Release
_Neuro · Return to function_

Dev page: https://dev.physioonclick.co.uk/exercises/functional-grasp-and-release

- **Main focus** (bright blue):
  - **Finger and thumb extensors** (top of your forearm and back of your hand, straightening your fingers and thumb) — lights: extensor digiti minimi (both sides), extensor digitorum (both sides), extensor indicis (both sides), extensor pollicis brevis (both sides), extensor pollicis longus (both sides)
  - **Finger and thumb flexors** (inside of your forearm, bending your fingers and thumb) — lights: flexor digitorum profundus (both sides), flexor digitorum superficialis (both sides), flexor pollicis longus (both sides)
- **Also working** (light blue):
  - **Wrist extensors** (top of your forearm, bending your wrist back) — lights: extensor carpi radialis brevis (both sides), extensor carpi radialis longus (both sides), extensor carpi ulnaris (both sides)
  - **Small hand muscles** (the muscles in your palm and between the bones of your hand) — lights: abductor digiti minimi of hand (both sides), abductor pollicis brevis (both sides), flexor digiti minimi brevis of hand (both sides), flexor pollicis brevis (both sides), oblique head of adductor pollicis (both sides), opponens digiti minimi of hand (both sides), opponens pollicis (both sides), set of dorsal interossei of hand (both sides), set of lumbricals of hand (both sides), set of palmar interossei of hand (both sides), superficial head of flexor pollicis brevis (both sides), transverse head of adductor pollicis (both sides)
- **How this helps your recovery:** Opening your hand wide, closing it round an object and then letting go works the forearm muscles that straighten and bend your fingers, along with the small muscles in your hand. Practising with everyday objects can help your affected hand get better at holding and releasing things, such as a cup, a pen or your keys.
- **Tissue line:** Nerves and the brain
- **3D view:** yes, starting from the back

- [ ] **Approved** &nbsp;&nbsp; - [ ] **Hide 3D on this page** &nbsp;&nbsp; Notes:

---

### <a id="gait-re-education-with-cueing"></a>Gait Re-Education with Cueing
_Neuro · Return to function_

Dev page: https://dev.physioonclick.co.uk/exercises/gait-re-education-with-cueing

- **Main focus** (bright blue):
  - **Tibialis anterior** (front of your shin) — lights: tibialis anterior (both sides)
  - **Iliopsoas** (deep hip flexor at the front of your hip) — lights: iliacus (both sides), psoas major (both sides)
- **How this helps your recovery:** Aiming for each floor marker and thinking 'heel first, lift my toes' works the deep hip flexor that swings your leg through and the shin muscle that lifts your toes clear of the floor. Practising with cues can help your brain relearn a longer, more even step, so your feet may scuff and catch the floor less often.
- **Tissue line:** Nerves and the brain
- **3D view:** yes, starting from the right side

- [ ] **Approved** &nbsp;&nbsp; - [ ] **Hide 3D on this page** &nbsp;&nbsp; Notes:

---

### <a id="trunk-rotation-in-sitting"></a>Trunk Rotation in Sitting
_Neuro · Early rehab_

Dev page: https://dev.physioonclick.co.uk/exercises/trunk-rotation-in-sitting

- **Main focus** (bright blue):
  - **External oblique** (side of your tummy) — lights: external oblique (both sides)
  - **Mid-back vertebrae** (the 12 bones of your spine between your neck and lower back, which form its joints) — lights: eighth thoracic vertebra, eleventh thoracic vertebra, fifth thoracic vertebra, first thoracic vertebra, fourth thoracic vertebra, ninth thoracic vertebra, second thoracic vertebra, seventh thoracic vertebra, sixth thoracic vertebra, tenth thoracic vertebra, third thoracic vertebra, twelfth thoracic vertebra
- **Also working** (light blue):
  - **Erector spinae (trunk part)** (the long muscles either side of your spine, from your pelvis up to the base of your neck) — lights: iliocostalis lumborum (both sides), iliocostalis thoracis (both sides), longissimus thoracis (both sides), spinalis thoracis (both sides)
- **How this helps your recovery:** Turning your upper body to each side while your hips stay still works the muscles at the sides of your tummy and moves your mid-back, while the muscles along your spine keep you sitting tall. Better trunk control can help you sit more steadily and reach to the side, which may make dressing and washing easier.
- **Tissue line:** Nerves and the brain
- **3D view:** yes, starting from the right side

- [ ] **Approved** &nbsp;&nbsp; - [ ] **Hide 3D on this page** &nbsp;&nbsp; Notes:

---

### <a id="standing-frame-or-supported-standing"></a>Standing Frame or Supported Standing
_Neuro · Early rehab_

Dev page: https://dev.physioonclick.co.uk/exercises/standing-frame-or-supported-standing

- **Main focus** (bright blue):
  - **Leg bones** (the long bones of your thighs and lower legs) — lights: femur (both sides), fibula (both sides), tibia (both sides)
- **How this helps your recovery:** Standing in the frame puts your body weight through the long bones of your legs, which may help keep them stronger. Building up your standing time only as your team advises can help your body get used to being upright, and gives you a change of position from sitting.
- **Tissue line:** none (stages strip only)
- **3D view:** yes, starting from the front

- [ ] **Approved** &nbsp;&nbsp; - [ ] **Hide 3D on this page** &nbsp;&nbsp; Notes:

---

### <a id="dual-task-cognitive-motor-training"></a>Dual-Task Cognitive-Motor Training
_Neuro · Return to function_

Dev page: https://dev.physioonclick.co.uk/exercises/dual-task-cognitive-motor-training

- **Main focus** (bright blue):
  - **Brain** (the parts of your brain that take in what you sense, plan your movements and share your attention) — not in the 3D model, so not lit
- **How this helps your recovery:** Keeping a simple movement going while you do a thinking task trains your brain to share its attention between the two, as everyday life often asks it to. Building this up gradually, with a helper watching your balance, can help you move more steadily while you talk or think, such as chatting while you make a cup of tea.
- **Tissue line:** Nerves and the brain
- **3D view:** no, none of its main structures is in the 3D model — text only

- [ ] **Approved** &nbsp;&nbsp; - [ ] **Hide 3D on this page** &nbsp;&nbsp; Notes:

---
