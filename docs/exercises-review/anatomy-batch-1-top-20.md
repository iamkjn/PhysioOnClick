# Exercise 3D Anatomy — Batch 1: the 20 most-visited exercise pages

**For clinical review by Shivaliba (registered physiotherapist).**

Each exercise page is getting two new things: a **"View in 3D"** button on the picture that shows the
muscles the exercise works, lit on a turning 3D body, and a short section called
**"What it works and how it helps"** under the booking prompt. The exercise picture itself is unchanged
and is still what everyone sees first.

Everything below is an **AI-drafted starting point**, not clinical fact. It has been through AI
clinical-accuracy checks, including an exact-match pass on 1 Nov 2026, but nothing reaches the live site
until you tick **Approved**. These 20 are the exercise pages people see most on Google (Search Console,
1 Aug – 30 Oct 2026), so they go first. Every exercise, with the same detail, is in
`anatomy-all-exercises.md`.

**How to look at one:** open its dev link, tap **View in 3D** (top-right of the picture), turn the
body with the Front / Back / Left / Right buttons, and tap a lit muscle to see its name. Then scroll
down past "Not getting better…" to the new section.

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

Ways to give feedback: write in the **Notes:** line, edit the wording inline, or mark up on a call.

---

## Shared wording (appears on every page)

**Recovery stages strip** — the exercise's own stage is highlighted and marked "This exercise":

- **Early rehab:** Calm pain and keep moving gently.
- **Mobility:** Win back comfortable movement.
- **Strength:** Build strength so the area copes with more.
- **Return to function:** Get back to work, sport and daily life.

**Tissue lines** — each exercise shows at most one, or none:

- Muscles and tendons: a strained muscle often settles within a few weeks. Tendons get stronger more slowly, so build up your exercises steadily and give them time.
- Joints and ligaments: stronger muscles around a sore joint share the load and help it settle. After a sprain, your ligaments can keep getting stronger for months, so build up steadily.
- After surgery: follow your surgeon's and physio's limits first. As the area heals, you rebuild strength and confidence step by step.
- Nerves and the brain: a sensitive or irritated nerve often settles gradually. After a nerve or brain injury, recovery can be slow and carry on for months. Gentle, regular practice helps your nerves move more freely and your brain relearn movement, so build up steadily.
- Pelvic floor: like any muscle, your pelvic floor can get stronger with regular practice. It can take a few months to notice a difference, so keep going as your physio advises.

**Closing line:** Everyone progresses at their own pace. Your physio will tell you when to move on.

- [ ] **Approved** &nbsp;&nbsp; Notes:

---

## 1. Spanish Squat (Isometric)
_Knee · Early rehab · 1,057 Google impressions in 90 days_

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

## 2. Wall Slide
_Shoulder · Mobility phase · 445 Google impressions in 90 days_

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

## 3. Ankle Pumps (Post-Surgery)
_Post-op · Early rehab · 431 Google impressions in 90 days_

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

## 4. Hip Hitch (Pelvic Drop)
_Hip · Strength phase · 367 Google impressions in 90 days_

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

## 5. Wall Squat Hold
_Knee · Early rehab · 338 Google impressions in 90 days_

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

## 6. Quad Sets
_Post-op · Early rehab · 312 Google impressions in 90 days_

Dev page: https://dev.physioonclick.co.uk/exercises/quad-sets

- **Main focus** (bright blue):
  - **Quadriceps** (front of your thigh) — lights: rectus femoris (both sides), vastus intermedius (both sides), vastus lateralis (both sides), vastus medialis (both sides)
- **How this helps your recovery:** Tightening the front of your thigh while your knee stays straight helps wake up a thigh muscle that can be slow to work after knee surgery. Getting this muscle working again is an early step towards holding your knee straight and steady when you stand, walk and get in and out of bed.
- **Tissue line:** After surgery
- **3D view:** yes, starting from the front

- [ ] **Approved** &nbsp;&nbsp; - [ ] **Hide 3D on this page** &nbsp;&nbsp; Notes:

---

## 7. Elbow Flexion/Extension
_Elbow · Early rehab · 311 Google impressions in 90 days_

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

## 8. Isometric Neck Hold
_Cervical spine · Strength phase · 220 Google impressions in 90 days_

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

## 9. Weight Shifting
_Balance · Early rehab · 209 Google impressions in 90 days_

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

## 10. Box Step-Down
_Knee · Strength phase · 195 Google impressions in 90 days_

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

## 11. Prone Y-T-W Raises
_Shoulder · Strength phase · 184 Google impressions in 90 days_

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

## 12. Scapular Retraction (Band Row)
_Shoulder · Strength phase · 172 Google impressions in 90 days_

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

## 13. Marching on the Spot
_Balance · Early rehab · 152 Google impressions in 90 days_

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

## 14. Ankle Pump
_Ankle · Early rehab · 146 Google impressions in 90 days_

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

## 15. Chin Tuck
_Neck · Early rehab · 146 Google impressions in 90 days_

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

## 16. Tyler Twist (Resistance Bar)
_Elbow · Strength phase · 144 Google impressions in 90 days_

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

## 17. Levator Scapulae Stretch
_Cervical spine · Mobility phase · 137 Google impressions in 90 days_

Dev page: https://dev.physioonclick.co.uk/exercises/levator-scapulae-stretch

> **Changed in the 1 Nov accuracy pass (high confidence):** Upper trapezius removed as a helper, because it does no work while the hand holds the shoulder down.

- **Main focus** (bright blue):
  - **Levator scapulae** (side and back of your neck) — lights: levator scapulae (both sides)
- **How this helps your recovery:** Looking down towards the opposite armpit, with your hand keeping your shoulder down, stretches the muscle that runs from the side of your neck to the top of your shoulder blade. Easing tightness here can make turning and tilting your head more comfortable and may ease the ache at the base of your neck.
- **Tissue line:** none (stages strip only)
- **3D view:** yes, starting from the back

- [ ] **Approved** &nbsp;&nbsp; - [ ] **Hide 3D on this page** &nbsp;&nbsp; Notes:

---

## 18. Seated Calf Raise (Soleus)
_Ankle · Strength phase · 135 Google impressions in 90 days_

Dev page: https://dev.physioonclick.co.uk/exercises/seated-calf-raise

- **Main focus** (bright blue):
  - **Soleus** (deep calf muscle) — lights: soleus (both sides)
  - **Achilles tendon** (back of your ankle) — lights: calcaneal tendon (both sides)
- **How this helps your recovery:** Raising your heels with your knees bent shifts the work onto the deeper calf muscle, which straight-knee raises work less, and loads the Achilles tendon it pulls on. A strong deep calf helps with longer walks and runs, where it takes much of the strain.
- **Tissue line:** Muscles and tendons
- **3D view:** yes, starting from the back

- [ ] **Approved** &nbsp;&nbsp; - [ ] **Hide 3D on this page** &nbsp;&nbsp; Notes:

---

## 19. Resisted Ankle Eversion
_Ankle · Strength phase · 134 Google impressions in 90 days_

Dev page: https://dev.physioonclick.co.uk/exercises/resisted-ankle-eversion

- **Main focus** (bright blue):
  - **Fibularis longus and brevis (peroneals)** (outside of your lower leg and ankle) — lights: fibularis brevis (both sides), fibularis longus (both sides)
- **How this helps your recovery:** Turning your foot outwards against the band strengthens the muscles down the outside of your lower leg, which act against your ankle rolling over. Stronger outer-ankle muscles help steady an ankle that tends to give way, whether on uneven ground, kerbs or the sports pitch.
- **Tissue line:** Joints and ligaments
- **3D view:** yes, starting from the right side

- [ ] **Approved** &nbsp;&nbsp; - [ ] **Hide 3D on this page** &nbsp;&nbsp; Notes:

---

## 20. Thoracic Rotation (Open Book)
_Thoracic spine · Mobility phase · 129 Google impressions in 90 days_

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
