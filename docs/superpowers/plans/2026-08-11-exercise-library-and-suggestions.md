# Exercise Library Overhaul + Assessment/Session Suggestions Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Grow the exercise library to 150+ tagged exercises and add a deterministic suggestion engine that surfaces relevant exercises on the assessment-review and write-summary admin screens.

**Architecture:** `Exercise` gains `clinicalArea`/`tags` fields shared with the assessment form's `ClinicalArea` enum. A new pure module (`lib/exercise-suggestions.ts`) scores the library against assessment/session free text. A new shared component (`components/suggested-exercises.tsx`) renders scored results with one-click assign, reused on both `admin-assessment-review.tsx` and `summary-form.tsx`.

**Tech Stack:** Next.js 15 / React 19, TypeScript, Vitest + Testing Library, Firebase Firestore (existing `lib/recovery.ts` assign flow — untouched).

## Global Constraints

- Never change existing exercise `id` values (`ex-1`..`ex-16`, `face-*`) — they're referenced by Firestore `assignedExercises` docs.
- `ClinicalArea` type must be imported from `lib/assessment-forms.ts`, never redefined.
- Suggestion engine is pure/deterministic — no network calls, no Gemini/AI usage.
- `videoUrl` becomes optional; every new exercise still needs a stick-figure pose (fallback to `standing` is acceptable but should be avoided where a closer pose exists).
- Run `npm run test:run` and `npx tsc --noEmit` before each commit that touches shared types.

---

### Task 1: Extend the `Exercise` type and retag existing exercises

**Files:**
- Modify: `lib/site-data.ts:40-48` (type), `lib/site-data.ts:331-559` (existing 24 entries)
- Test: `tests/lib/site-data.test.ts` (create if it doesn't exist)

**Interfaces:**
- Produces: `Exercise` type with new fields `clinicalArea: ClinicalArea` (required) and `tags: string[]` (required), `videoUrl?: string` (now optional). Later tasks import `Exercise` and `exercises` from `lib/site-data.ts` unchanged otherwise.

- [ ] **Step 1: Write the failing test**

Create `tests/lib/site-data.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { exercises } from "@/lib/site-data";

const VALID_AREAS = new Set([
  "spine", "upper_limb", "lower_limb", "balance_walking",
  "neuro", "post_op", "pelvic_health", "paediatric", "general",
]);

describe("exercises library", () => {
  it("every exercise has a valid clinicalArea and non-empty tags", () => {
    for (const ex of exercises) {
      expect(VALID_AREAS.has(ex.clinicalArea)).toBe(true);
      expect(Array.isArray(ex.tags)).toBe(true);
      expect(ex.tags.length).toBeGreaterThan(0);
    }
  });

  it("has no duplicate ids", () => {
    const ids = exercises.map((e) => e.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("keeps existing exercise ids unchanged", () => {
    const ids = new Set(exercises.map((e) => e.id));
    for (let i = 1; i <= 16; i++) expect(ids.has(`ex-${i}`)).toBe(true);
    for (const id of [
      "face-smile", "face-brow-raise", "face-eye-close", "face-cheek-puff",
      "face-frown", "face-big-smile", "face-eye-wide", "face-pucker",
    ]) expect(ids.has(id)).toBe(true);
  });

  it("has grown the library to 150 or more exercises", () => {
    expect(exercises.length).toBeGreaterThanOrEqual(150);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/lib/site-data.test.ts`
Expected: FAIL — `clinicalArea`/`tags` undefined on existing entries, and count is 24, not ≥150 (this second assertion stays red until Tasks 2-9 finish; that's expected for this task — see Step 4).

- [ ] **Step 3: Add the fields to the type and retag the 24 existing entries**

In `lib/site-data.ts`, add the import and update the type:

```ts
import type { ClinicalArea } from "@/lib/assessment-forms";

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
};
```

Add `clinicalArea` and `tags` to each of the 24 existing entries (append the two fields, keep everything else identical), using this mapping:

| id | clinicalArea | tags |
|---|---|---|
| ex-1 Sit to Stand Control | lower_limb | ["knee-replacement", "functional", "early-rehab"] |
| ex-2 Scapular Setting | upper_limb | ["shoulder", "activation", "early-rehab"] |
| ex-3 Bridge Progression | spine | ["low-back", "hip-strength", "strength-phase"] |
| ex-4 Tandem Balance Hold | balance_walking | ["falls-prevention", "static-balance"] |
| ex-5 Straight Leg Raise | lower_limb | ["knee", "quad-strength", "early-rehab"] |
| ex-6 Heel Slide | lower_limb | ["knee", "range-of-motion", "early-rehab"] |
| ex-7 Mini Squat | lower_limb | ["knee", "osteoarthritis", "strength-phase"] |
| ex-8 Shoulder Flexion | upper_limb | ["shoulder", "impingement", "mobility"] |
| ex-9 Pendulum Swing | upper_limb | ["shoulder", "rotator-cuff", "early-rehab"] |
| ex-10 Single Leg Balance | balance_walking | ["falls-prevention", "dynamic-balance"] |
| ex-11 Hip Bridge | lower_limb | ["hip", "glute-strength", "strength-phase"] |
| ex-12 Heel Raises | lower_limb | ["ankle", "calf-strength", "strength-phase"] |
| ex-13 Chin Tuck | spine | ["neck", "postural-control", "early-rehab"] |
| ex-14 Dead Bug | spine | ["low-back", "core-control", "strength-phase"] |
| ex-15 Bird Dog | spine | ["low-back", "spinal-stability", "strength-phase"] |
| ex-16 Stationary Bike | lower_limb | ["knee-replacement", "low-impact", "mobility"] |
| face-smile | neuro | ["facial-palsy", "stroke", "symmetry"] |
| face-brow-raise | neuro | ["facial-palsy", "stroke", "symmetry"] |
| face-eye-close | neuro | ["facial-palsy", "stroke", "symmetry"] |
| face-cheek-puff | neuro | ["facial-palsy", "stroke", "lip-seal"] |
| face-frown | neuro | ["facial-palsy", "stroke", "symmetry"] |
| face-big-smile | neuro | ["facial-palsy", "stroke", "symmetry"] |
| face-eye-wide | neuro | ["facial-palsy", "stroke", "symmetry"] |
| face-pucker | neuro | ["facial-palsy", "stroke", "lip-seal"] |

Example for `ex-1`:

```ts
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
```

Apply the same pattern (add `clinicalArea` + `tags` after `bodyPart`, keep every other field byte-identical) to all 24 entries per the table above.

- [ ] **Step 4: Run test to verify progress**

Run: `npx vitest run tests/lib/site-data.test.ts`
Expected: first 3 tests (`clinicalArea`/`tags` present, no duplicate ids, existing ids unchanged) PASS. The 4th test (`≥150 exercises`) still FAILS — leave it failing; Tasks 2-9 will turn it green. Note this in the commit message.

- [ ] **Step 5: Type-check and commit**

```bash
npx tsc --noEmit
git add lib/site-data.ts tests/lib/site-data.test.ts
git commit -m "feat: add clinicalArea/tags to Exercise type, retag existing 24 exercises"
```

---

### Task 2: Add spine exercises (18 new)

**Files:**
- Modify: `lib/site-data.ts` (append to the `exercises` array, after the existing `face-pucker` entry)

**Interfaces:**
- Consumes: `Exercise` type from Task 1.
- Produces: 18 new entries with ids `ex-17` through `ex-34`.

- [ ] **Step 1: Append 18 spine exercises**

Add these entries to the `exercises` array in `lib/site-data.ts`, each following the exact shape from Task 1 (all fields required except `videoUrl`, which is omitted here — stick-figure diagram only, per the design's videos-optional decision):

```ts
{
  id: "ex-17", title: "McKenzie Press-Up", bodyPart: "Lumbar spine",
  clinicalArea: "spine", tags: ["low-back", "disc", "extension-bias", "early-rehab"],
  condition: "Lumbar disc-related back pain", stage: "Early rehab",
  description: "Gentle repeated lower-back extension to centralise leg symptoms toward the spine, following the McKenzie extension principle."
},
{
  id: "ex-18", title: "Standing Extension", bodyPart: "Lumbar spine",
  clinicalArea: "spine", tags: ["low-back", "disc", "extension-bias", "mobility"],
  condition: "Lumbar disc-related back pain", stage: "Mobility phase",
  description: "An upright version of the press-up, hands on hips, easing the spine backward for symptom relief between exercise sessions."
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
  description: "Lying face down, lifting the chest slightly using back extensors to build postural endurance for desk-based pain."
},
{
  id: "ex-25", title: "Side Plank (Modified)", bodyPart: "Lumbar spine",
  clinicalArea: "spine", tags: ["low-back", "core-control", "strength-phase"],
  condition: "Low back pain", stage: "Strength phase",
  description: "A knee-supported side plank building lateral trunk stability, progressing spinal load tolerance safely."
},
{
  id: "ex-26", title: "Segmental Rolling", bodyPart: "Lumbar spine",
  clinicalArea: "spine", tags: ["low-back", "mobility", "early-rehab"],
  condition: "Acute low back pain", stage: "Early rehab",
  description: "Rolling from back to side in a controlled, segmental way to reintroduce comfortable movement after an acute flare."
},
{
  id: "ex-27", title: "Pelvic Tilt", bodyPart: "Lumbar spine",
  clinicalArea: "spine", tags: ["low-back", "pregnancy", "early-rehab"],
  condition: "Pregnancy-related back pain", stage: "Early rehab",
  description: "A small rocking of the pelvis to ease lumbar tension, safe and gentle enough for antenatal and postnatal back pain."
},
{
  id: "ex-28", title: "Quadruped Arm/Leg Reach", bodyPart: "Lumbar spine",
  clinicalArea: "spine", tags: ["low-back", "spinal-stability", "strength-phase"],
  condition: "Chronic low back pain", stage: "Return to function",
  description: "An advanced bird-dog progression adding controlled reach, challenging balance and trunk control together."
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
  description: "Gently drawing both knees toward the chest to ease stenosis-related symptoms, which typically prefer flexion over extension."
},
{
  id: "ex-32", title: "Sciatic Nerve Glide", bodyPart: "Lumbar spine",
  clinicalArea: "spine", tags: ["low-back", "sciatica", "neural-mobility", "early-rehab"],
  condition: "Sciatica", stage: "Early rehab",
  description: "A gentle sliding nerve mobilisation of the leg and ankle to ease nerve-related sensitivity down the leg."
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
  description: "Practising a hip-hinge lifting technique with a light load, building confidence for safe lifting at work or home."
},
```

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add lib/site-data.ts
git commit -m "feat: add 18 spine exercises to the library"
```

---

### Task 3: Add upper-limb exercises (18 new)

**Files:**
- Modify: `lib/site-data.ts` (append `ex-35` through `ex-52`)

- [ ] **Step 1: Append 18 upper-limb exercises**

```ts
{ id: "ex-35", title: "Shoulder External Rotation (Band)", bodyPart: "Shoulder", clinicalArea: "upper_limb", tags: ["shoulder", "rotator-cuff", "strength-phase"], condition: "Rotator cuff tendinopathy", stage: "Strength phase", description: "Elbow tucked to the side, rotating the forearm outward against light resistance to strengthen the rotator cuff." },
{ id: "ex-36", title: "Shoulder Internal Rotation (Band)", bodyPart: "Shoulder", clinicalArea: "upper_limb", tags: ["shoulder", "rotator-cuff", "strength-phase"], condition: "Rotator cuff tendinopathy", stage: "Strength phase", description: "The mirrored inward rotation movement, balancing strength around the shoulder joint." },
{ id: "ex-37", title: "Wall Slide", bodyPart: "Shoulder", clinicalArea: "upper_limb", tags: ["shoulder", "impingement", "mobility"], condition: "Shoulder impingement", stage: "Mobility phase", description: "Sliding the arms up a wall keeping contact throughout, restoring overhead range without excess strain." },
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
{ id: "ex-52", title: "Push-Up Plus (Wall or Floor)", bodyPart: "Shoulder", clinicalArea: "upper_limb", tags: ["shoulder", "scapular-control", "return-to-function"], condition: "Scapular dyskinesis", stage: "Return to function", description: "A standard push-up with an extra protraction at the top to fully engage the serratus anterior for scapular control." },
```

- [ ] **Step 2: Type-check and commit**

```bash
npx tsc --noEmit
git add lib/site-data.ts
git commit -m "feat: add 18 upper-limb exercises to the library"
```

---

### Task 4: Add lower-limb exercises (18 new)

**Files:**
- Modify: `lib/site-data.ts` (append `ex-53` through `ex-70`)

- [ ] **Step 1: Append 18 lower-limb exercises**

```ts
{ id: "ex-53", title: "Terminal Knee Extension (Band)", bodyPart: "Knee", clinicalArea: "lower_limb", tags: ["knee", "quad-strength", "strength-phase"], condition: "Anterior knee pain", stage: "Strength phase", description: "A resisted band pulling the knee into slight flexion while the quad straightens it, targeting the final degrees of extension." },
{ id: "ex-54", title: "Step-Up", bodyPart: "Knee", clinicalArea: "lower_limb", tags: ["knee", "functional", "strength-phase"], condition: "Patellofemoral pain", stage: "Strength phase", description: "Stepping up onto a low step with control, building single-leg strength for stairs and functional movement." },
{ id: "ex-55", title: "Clam Shell", bodyPart: "Hip", clinicalArea: "lower_limb", tags: ["hip", "glute-strength", "early-rehab"], condition: "Hip and knee pain (gluteal weakness)", stage: "Early rehab", description: "Lying on the side with knees bent, lifting the top knee while keeping feet together to activate the gluteus medius." },
{ id: "ex-56", title: "Side-Lying Hip Abduction", bodyPart: "Hip", clinicalArea: "lower_limb", tags: ["hip", "glute-strength", "strength-phase"], condition: "Gluteal tendinopathy", stage: "Strength phase", description: "Lifting the top leg straight out to the side, building hip abductor strength important for pelvic control." },
{ id: "ex-57", title: "Standing Hip Flexor Stretch", bodyPart: "Hip", clinicalArea: "lower_limb", tags: ["hip", "flexibility", "mobility"], condition: "Hip flexor tightness", stage: "Mobility phase", description: "A lunge-position stretch lengthening the front of the hip, often tight from prolonged sitting." },
{ id: "ex-58", title: "Deep Squat Mobility", bodyPart: "Hip", clinicalArea: "lower_limb", tags: ["hip", "mobility", "return-to-function"], condition: "Hip osteoarthritis", stage: "Return to function", description: "A supported deep squat hold to maintain functional hip and knee range for daily activities like gardening." },
{ id: "ex-59", title: "Ankle Pump", bodyPart: "Ankle", clinicalArea: "lower_limb", tags: ["ankle", "swelling", "early-rehab"], condition: "Ankle sprain (acute)", stage: "Early rehab", description: "Pointing and flexing the foot repeatedly to reduce swelling and maintain ankle mobility soon after injury." },
{ id: "ex-60", title: "Ankle Alphabet", bodyPart: "Ankle", clinicalArea: "lower_limb", tags: ["ankle", "range-of-motion", "early-rehab"], condition: "Ankle sprain", stage: "Early rehab", description: "Tracing letters of the alphabet with the foot in the air to gently restore ankle range in every direction." },
{ id: "ex-61", title: "Resisted Ankle Eversion", bodyPart: "Ankle", clinicalArea: "lower_limb", tags: ["ankle", "instability", "strength-phase"], condition: "Chronic ankle instability", stage: "Strength phase", description: "A band pulling the foot inward while the peroneal muscles resist, key for lateral ankle stability." },
{ id: "ex-62", title: "Single Leg Balance on Foam", bodyPart: "Ankle", clinicalArea: "lower_limb", tags: ["ankle", "balance", "instability", "return-to-function"], condition: "Chronic ankle instability", stage: "Return to function", description: "Standing on one leg on an unstable surface, retraining ankle proprioception for sport and uneven ground." },
{ id: "ex-63", title: "Calf Stretch (Gastrocnemius)", bodyPart: "Ankle", clinicalArea: "lower_limb", tags: ["ankle", "achilles", "flexibility", "mobility"], condition: "Achilles tendinopathy", stage: "Mobility phase", description: "A straight-knee wall stretch lengthening the calf, easing tightness that loads the Achilles tendon." },
{ id: "ex-64", title: "Eccentric Heel Drop", bodyPart: "Ankle", clinicalArea: "lower_limb", tags: ["ankle", "achilles", "strength-phase"], condition: "Achilles tendinopathy", stage: "Strength phase", description: "Slowly lowering the heel below step level, the standard evidence-based loading exercise for Achilles tendon pain." },
{ id: "ex-65", title: "Wall Squat Hold", bodyPart: "Knee", clinicalArea: "lower_limb", tags: ["knee", "isometric", "early-rehab"], condition: "Patellar tendinopathy (flare-up)", stage: "Early rehab", description: "An isometric squat against a wall, held steady — a low-irritability way to load a painful tendon early on." },
{ id: "ex-66", title: "Split Squat", bodyPart: "Knee", clinicalArea: "lower_limb", tags: ["knee", "functional", "return-to-function"], condition: "ACL rehabilitation", stage: "Return to function", description: "A staggered-stance squat building single-leg strength and control, a key step before returning to sport." },
{ id: "ex-67", title: "Lateral Band Walk", bodyPart: "Hip", clinicalArea: "lower_limb", tags: ["hip", "glute-strength", "return-to-function"], condition: "Patellofemoral pain", stage: "Return to function", description: "Sidestepping against band resistance around the knees, building hip strength that controls knee alignment." },
{ id: "ex-68", title: "Nordic Hamstring Curl (Assisted)", bodyPart: "Hamstring", clinicalArea: "lower_limb", tags: ["hamstring", "eccentric-strength", "return-to-function"], condition: "Hamstring strain", stage: "Return to function", description: "A kneeling, partner- or strap-assisted eccentric hamstring lowering exercise, shown to reduce re-injury risk." },
{ id: "ex-69", title: "Standing Hamstring Stretch", bodyPart: "Hamstring", clinicalArea: "lower_limb", tags: ["hamstring", "flexibility", "mobility"], condition: "Hamstring tightness", stage: "Mobility phase", description: "Hinging forward with a straight leg on a raised support to gently lengthen a tight hamstring." },
{ id: "ex-70", title: "Box Step-Down", bodyPart: "Knee", clinicalArea: "lower_limb", tags: ["knee", "control", "strength-phase"], condition: "Patellofemoral pain", stage: "Strength phase", description: "A slow, controlled step down from a low box, building eccentric quad control that protects the kneecap joint." },
```

- [ ] **Step 2: Type-check and commit**

```bash
npx tsc --noEmit
git add lib/site-data.ts
git commit -m "feat: add 18 lower-limb exercises to the library"
```

---

### Task 5: Add balance/walking exercises (16 new)

**Files:**
- Modify: `lib/site-data.ts` (append `ex-71` through `ex-86`)

- [ ] **Step 1: Append 16 balance/walking exercises**

```ts
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
```

- [ ] **Step 2: Type-check and commit**

```bash
npx tsc --noEmit
git add lib/site-data.ts
git commit -m "feat: add 16 balance/walking exercises to the library"
```

---

### Task 6: Add neuro exercises (16 new)

**Files:**
- Modify: `lib/site-data.ts` (append `ex-87` through `ex-102`)

- [ ] **Step 1: Append 16 neuro exercises**

```ts
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
```

- [ ] **Step 2: Type-check and commit**

```bash
npx tsc --noEmit
git add lib/site-data.ts
git commit -m "feat: add 16 neuro exercises to the library"
```

---

### Task 7: Add post-op exercises (16 new)

**Files:**
- Modify: `lib/site-data.ts` (append `ex-103` through `ex-118`)

- [ ] **Step 1: Append 16 post-op exercises**

```ts
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
```

- [ ] **Step 2: Type-check and commit**

```bash
npx tsc --noEmit
git add lib/site-data.ts
git commit -m "feat: add 16 post-op exercises to the library"
```

---

### Task 8: Add pelvic health exercises (14 new)

**Files:**
- Modify: `lib/site-data.ts` (append `ex-119` through `ex-132`)

- [ ] **Step 1: Append 14 pelvic health exercises**

```ts
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
```

- [ ] **Step 2: Type-check and commit**

```bash
npx tsc --noEmit
git add lib/site-data.ts
git commit -m "feat: add 14 pelvic health exercises to the library"
```

---

### Task 9: Add paediatric and general exercises (18 new) — crosses 150 total

**Files:**
- Modify: `lib/site-data.ts` (append `ex-133` through `ex-150`)

- [ ] **Step 1: Append 10 paediatric exercises**

```ts
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
```

- [ ] **Step 2: Append 8 general exercises**

```ts
{ id: "ex-143", title: "General Mobility Warm-Up", bodyPart: "General", clinicalArea: "general", tags: ["general", "warm-up", "early-rehab"], condition: "General deconditioning", stage: "Early rehab", description: "A gentle full-body joint mobility sequence, a safe starting point before any specific condition is confirmed." },
{ id: "ex-144", title: "Graded Walking Programme", bodyPart: "General", clinicalArea: "general", tags: ["general", "cardio", "mobility"], condition: "General deconditioning", stage: "Mobility phase", description: "A gradually increasing daily walking target to rebuild general fitness and activity tolerance." },
{ id: "ex-145", title: "Full-Body Stretch Routine", bodyPart: "General", clinicalArea: "general", tags: ["general", "flexibility", "mobility"], condition: "General stiffness", stage: "Mobility phase", description: "A short sequence of major-muscle-group stretches suitable while a specific diagnosis is still being clarified." },
{ id: "ex-146", title: "Basic Bodyweight Circuit", bodyPart: "General", clinicalArea: "general", tags: ["general", "strength-phase"], condition: "General deconditioning", stage: "Strength phase", description: "Sit-to-stands, wall push-ups and marching on the spot combined into a simple, equipment-free strength circuit." },
{ id: "ex-147", title: "Pain Pacing Activity Plan", bodyPart: "General", clinicalArea: "general", tags: ["general", "pacing", "chronic-pain", "early-rehab"], condition: "Persistent/chronic pain", stage: "Early rehab", description: "A structured activity-and-rest pacing plan, breaking tasks into manageable chunks to avoid boom-bust pain flares." },
{ id: "ex-148", title: "Graded Exposure to Feared Movement", bodyPart: "General", clinicalArea: "general", tags: ["general", "graded-exposure", "chronic-pain", "return-to-function"], condition: "Persistent/chronic pain (fear-avoidance)", stage: "Return to function", description: "Gradually reintroducing a movement the patient has been avoiding, in small confidence-building steps, per graded exposure principles." },
{ id: "ex-149", title: "Return-to-Sport Readiness Circuit", bodyPart: "General", clinicalArea: "general", tags: ["general", "sport", "return-to-function"], condition: "Return to sport (general)", stage: "Return to function", description: "A combined strength, balance and agility circuit used as a final check before clearing return to a chosen sport." },
{ id: "ex-150", title: "Relaxation and Breathing for Pain Management", bodyPart: "General", clinicalArea: "general", tags: ["general", "breathing", "chronic-pain", "early-rehab"], condition: "Persistent/chronic pain", stage: "Early rehab", description: "Slow diaphragmatic breathing and progressive muscle relaxation, supporting the nervous-system side of pain management." },
```

- [ ] **Step 3: Run the full site-data test suite**

Run: `npx vitest run tests/lib/site-data.test.ts`
Expected: all 4 tests PASS, including `exercises.length >= 150`.

- [ ] **Step 4: Type-check and commit**

```bash
npx tsc --noEmit
git add lib/site-data.ts
git commit -m "feat: add paediatric and general exercises, cross 150-exercise library milestone"
```

---

### Task 10: Extend stick-figure poses for new exercise categories

**Files:**
- Modify: `components/exercise-figure.tsx:1-61`
- Test: `tests/components/exercise-figure.test.tsx` (create if it doesn't exist)

**Interfaces:**
- Consumes: nothing new (self-contained component).
- Produces: `poseForName(name: string): Pose` now recognises 7 additional keyword groups; `Pose` union grows by 7 new members.

- [ ] **Step 1: Write the failing test**

Create `tests/components/exercise-figure.test.tsx`:

```tsx
import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { ExerciseFigure } from "@/components/exercise-figure";

describe("ExerciseFigure new poses", () => {
  const titles = [
    "Neck Rotation Range",
    "Standing Hip Flexor Stretch",
    "Ankle Pump",
    "Standing Pelvic Tilt (Pregnancy)",
    "Overhead Press Progression",
    "Cat-Cow Stretch",
    "Grip Strengthening",
  ];

  it.each(titles)("renders an svg for '%s' without throwing", (title) => {
    const { container } = render(<ExerciseFigure title={title} />);
    expect(container.querySelector("svg")).not.toBeNull();
  });
});
```

Check the actual exported component name/props first — read `components/exercise-figure.tsx` in full (it was only partially read during design) and match the test to its real export signature before running.

- [ ] **Step 2: Run test to verify it fails or passes trivially**

Run: `npx vitest run tests/components/exercise-figure.test.tsx`
Expected: passes trivially today (everything falls back to `standing`) — this test only proves non-crashing, not pose correctness, so also add the assertions in Step 3 before trusting it.

- [ ] **Step 3: Add pose-correctness assertions and new poses**

Extend the test file with an export-level check instead (poses aren't exposed as props, so test the keyword router directly if it's exported, otherwise skip to Step 4 and rely on the render-without-throwing test as the safety net — do not fabricate an export that doesn't exist).

Add 7 new poses to `SPECS` in `components/exercise-figure.tsx` (append to the `Pose` union and `SPECS` map):

```ts
type Pose = "legRaise" | "kneeExt" | "heelSlide" | "balance" | "bike" | "squat" | "pendulum" | "standing"
  | "neckTurn" | "hipStretch" | "anklePump" | "pelvicTilt" | "overheadReach" | "catCow" | "gripSqueeze";
```

```ts
neckTurn: {
  circles: [[32, 11, 5]],
  segments: [[32, 16, 32, 34], [32, 21, 22, 29], [32, 21, 42, 29], [32, 34, 24, 48], [32, 34, 40, 48], [28, 9, 36, 13]],
},
hipStretch: {
  circles: [[24, 13, 5]],
  segments: [[24, 18, 30, 33], [30, 33, 44, 30], [44, 30, 48, 46], [30, 33, 22, 46], [16, 40, 30, 33], [20, 48, 52, 48]],
},
anklePump: {
  circles: [[18, 40, 4.5]],
  segments: [[18, 40, 34, 41], [34, 41, 34, 46], [34, 46, 48, 44], [12, 48, 54, 48]],
},
pelvicTilt: {
  circles: [[32, 12, 5]],
  segments: [[32, 17, 30, 33], [30, 33, 22, 48], [30, 33, 38, 48], [24, 32, 38, 34]],
},
overheadReach: {
  circles: [[32, 10, 5]],
  segments: [[32, 15, 32, 33], [32, 18, 20, 6], [32, 18, 44, 6], [32, 33, 24, 48], [32, 33, 40, 48]],
},
catCow: {
  circles: [[16, 30, 4]],
  segments: [[16, 34, 32, 26], [32, 26, 50, 32], [16, 34, 12, 46], [50, 32, 54, 46], [24, 20, 40, 22]],
},
gripSqueeze: {
  circles: [[30, 30, 6]],
  segments: [[24, 30, 20, 24], [36, 30, 40, 24], [24, 32, 20, 38], [36, 32, 40, 38]],
},
```

Extend `poseForName`:

```ts
function poseForName(name: string): Pose {
  const n = name.toLowerCase();
  if (n.includes("leg raise") || n.includes("straight leg")) return "legRaise";
  if (n.includes("knee ext")) return "kneeExt";
  if (n.includes("heel slide")) return "heelSlide";
  if (n.includes("balance")) return "balance";
  if (n.includes("bike") || n.includes("cycl")) return "bike";
  if (n.includes("squat") || n.includes("sit to stand") || n.includes("sit-to-stand")) return "squat";
  if (n.includes("neck") && (n.includes("rotation") || n.includes("turn"))) return "neckTurn";
  if (n.includes("hip flexor") || n.includes("hip stretch") || n.includes("hamstring stretch")) return "hipStretch";
  if (n.includes("ankle pump") || n.includes("ankle alphabet")) return "anklePump";
  if (n.includes("pelvic tilt")) return "pelvicTilt";
  if (n.includes("overhead") || n.includes("press-up") || n.includes("press up") || n.includes("extension")) return "overheadReach";
  if (n.includes("cat-cow") || n.includes("cat cow") || n.includes("thoracic rotation")) return "catCow";
  if (n.includes("grip") || n.includes("tendon glide")) return "gripSqueeze";
  if (n.includes("pendulum") || n.includes("flexion") || n.includes("shoulder") || n.includes("scapular")) return "pendulum";
  return "standing";
}
```

Place the new `if` branches **before** the existing `pendulum` catch-all line (shoulder/flexion keywords), since several new titles (e.g. "Shoulder Flexion" already existed and must keep routing to `pendulum`; only strictly new keyword patterns like "overhead", "press-up" should be intercepted first) — verify by re-reading the full current file before editing, since only lines 1-61 were seen during design.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/components/exercise-figure.test.tsx`
Expected: PASS.

- [ ] **Step 5: Type-check and commit**

```bash
npx tsc --noEmit
git add components/exercise-figure.tsx tests/components/exercise-figure.test.tsx
git commit -m "feat: add 7 new stick-figure poses for expanded exercise categories"
```

---

### Task 11: Build the suggestion engine

**Files:**
- Create: `lib/exercise-suggestions.ts`
- Test: `tests/lib/exercise-suggestions.test.ts`

**Interfaces:**
- Consumes: `Exercise`, `exercises` from `lib/site-data.ts` (Task 1); `ClinicalArea` from `lib/assessment-forms.ts`.
- Produces: `export type SuggestionInput = { clinicalArea?: ClinicalArea; freeText?: string; alreadyAssignedIds: string[] }`, `export type Suggestion = { exercise: Exercise; reason: string; score: number }`, `export function suggestExercises(input: SuggestionInput, limit?: number): Suggestion[]`. Tasks 12-13 import these directly.

- [ ] **Step 1: Write the failing tests**

Create `tests/lib/exercise-suggestions.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { suggestExercises } from "@/lib/exercise-suggestions";

describe("suggestExercises", () => {
  it("scores an exact clinicalArea match higher than no match", () => {
    const results = suggestExercises({ clinicalArea: "lower_limb", alreadyAssignedIds: [] });
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].exercise.clinicalArea).toBe("lower_limb");
  });

  it("boosts score when freeText contains a matching tag keyword", () => {
    const results = suggestExercises({
      clinicalArea: "lower_limb",
      freeText: "patient reports knee pain after replacement surgery",
      alreadyAssignedIds: [],
    });
    const top = results[0];
    expect(top.exercise.tags.some((t) => "knee pain after replacement surgery".includes(t) || t.includes("knee"))).toBe(true);
  });

  it("excludes already-assigned exercise ids", () => {
    const results = suggestExercises({ clinicalArea: "lower_limb", alreadyAssignedIds: ["ex-1", "ex-5", "ex-6", "ex-7", "ex-16"] });
    const ids = results.map((r) => r.exercise.id);
    expect(ids).not.toContain("ex-1");
    expect(ids).not.toContain("ex-5");
  });

  it("prefers earlier-stage exercises when scores tie", () => {
    const results = suggestExercises({ clinicalArea: "spine", alreadyAssignedIds: [] }, 20);
    const stages = results.map((r) => r.exercise.stage);
    const firstEarly = stages.indexOf("Early rehab");
    const firstReturn = stages.indexOf("Return to function");
    if (firstEarly !== -1 && firstReturn !== -1) {
      expect(firstEarly).toBeLessThan(firstReturn);
    }
  });

  it("returns at most `limit` results", () => {
    const results = suggestExercises({ clinicalArea: "general", alreadyAssignedIds: [] }, 3);
    expect(results.length).toBeLessThanOrEqual(3);
  });

  it("gives every result a non-empty, deterministic reason string", () => {
    const a = suggestExercises({ clinicalArea: "upper_limb", freeText: "shoulder pain", alreadyAssignedIds: [] });
    const b = suggestExercises({ clinicalArea: "upper_limb", freeText: "shoulder pain", alreadyAssignedIds: [] });
    expect(a.map((r) => r.reason)).toEqual(b.map((r) => r.reason));
    expect(a.every((r) => r.reason.length > 0)).toBe(true);
  });

  it("returns an empty array when clinicalArea and freeText are both absent", () => {
    const results = suggestExercises({ alreadyAssignedIds: [] });
    expect(results).toEqual([]);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/lib/exercise-suggestions.test.ts`
Expected: FAIL — `Cannot find module '@/lib/exercise-suggestions'`.

- [ ] **Step 3: Implement the suggestion engine**

Create `lib/exercise-suggestions.ts`:

```ts
import { exercises, type Exercise } from "@/lib/site-data";
import type { ClinicalArea } from "@/lib/assessment-forms";

export type SuggestionInput = {
  clinicalArea?: ClinicalArea;
  freeText?: string;
  alreadyAssignedIds: string[];
};

export type Suggestion = {
  exercise: Exercise;
  reason: string;
  score: number;
};

const STAGE_ORDER: Record<string, number> = {
  "Early rehab": 0,
  "Mobility phase": 1,
  "Strength phase": 2,
  "Return to function": 3,
  "Facial rehab": 1,
};

function stageRank(stage: string): number {
  return STAGE_ORDER[stage] ?? 4;
}

export function suggestExercises(input: SuggestionInput, limit = 6): Suggestion[] {
  const { clinicalArea, freeText, alreadyAssignedIds } = input;
  if (!clinicalArea && !freeText) return [];

  const assigned = new Set(alreadyAssignedIds);
  const text = (freeText ?? "").toLowerCase();

  const scored: Suggestion[] = [];

  for (const exercise of exercises) {
    if (assigned.has(exercise.id)) continue;

    let score = 0;
    const matchedReasons: string[] = [];

    if (clinicalArea && exercise.clinicalArea === clinicalArea) {
      score += 3;
      matchedReasons.push(`matches ${clinicalArea.replace("_", " ")}`);
    }

    if (text.length > 0) {
      for (const tag of exercise.tags) {
        const tagWords = tag.replace(/-/g, " ");
        if (text.includes(tagWords) || tagWords.split(" ").some((w) => w.length > 3 && text.includes(w))) {
          score += 2;
          matchedReasons.push(`'${tag}' in notes`);
        }
      }
      const conditionWords = exercise.condition.toLowerCase().split(/[\s/()]+/).filter((w) => w.length > 3);
      if (conditionWords.some((w) => text.includes(w))) {
        score += 1;
        matchedReasons.push(`condition '${exercise.condition}' referenced`);
      }
    }

    if (score === 0) continue;

    const reason = matchedReasons.length > 0
      ? `Suggested: ${matchedReasons.slice(0, 2).join(", ")}`
      : "Suggested";

    scored.push({ exercise, reason, score });
  }

  scored.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    const stageDiff = stageRank(a.exercise.stage) - stageRank(b.exercise.stage);
    if (stageDiff !== 0) return stageDiff;
    return a.exercise.id.localeCompare(b.exercise.id);
  });

  return scored.slice(0, limit);
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/lib/exercise-suggestions.test.ts`
Expected: PASS on all 7 tests.

- [ ] **Step 5: Type-check and commit**

```bash
npx tsc --noEmit
git add lib/exercise-suggestions.ts tests/lib/exercise-suggestions.test.ts
git commit -m "feat: add deterministic exercise suggestion engine"
```

---

### Task 12: Build the shared `SuggestedExercises` component

**Files:**
- Create: `components/suggested-exercises.tsx`
- Test: `tests/components/suggested-exercises.test.tsx`

**Interfaces:**
- Consumes: `Suggestion` type from `lib/exercise-suggestions.ts` (Task 11).
- Produces: `export function SuggestedExercises({ suggestions, onAssign, assigning }: { suggestions: Suggestion[]; onAssign: (exerciseId: string) => Promise<void>; assigning: string | null }): JSX.Element | null`. Tasks 13-14 import this directly.

- [ ] **Step 1: Write the failing test**

Create `tests/components/suggested-exercises.test.tsx`:

```tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { SuggestedExercises } from "@/components/suggested-exercises";
import type { Suggestion } from "@/lib/exercise-suggestions";
import type { Exercise } from "@/lib/site-data";

function makeExercise(overrides: Partial<Exercise> = {}): Exercise {
  return {
    id: "ex-test-1",
    title: "Test Exercise",
    bodyPart: "Knee",
    clinicalArea: "lower_limb",
    tags: ["knee"],
    condition: "Test condition",
    stage: "Early rehab",
    description: "Test description.",
    ...overrides,
  };
}

describe("SuggestedExercises", () => {
  it("renders nothing when there are no suggestions", () => {
    const { container } = render(
      <SuggestedExercises suggestions={[]} onAssign={vi.fn()} assigning={null} />
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("renders each suggestion's title and reason", () => {
    const suggestions: Suggestion[] = [
      { exercise: makeExercise(), reason: "Suggested: matches lower limb", score: 3 },
    ];
    render(<SuggestedExercises suggestions={suggestions} onAssign={vi.fn()} assigning={null} />);
    expect(screen.getByText("Test Exercise")).toBeInTheDocument();
    expect(screen.getByText(/matches lower limb/)).toBeInTheDocument();
  });

  it("calls onAssign with the exercise id when Assign is clicked", async () => {
    const onAssign = vi.fn().mockResolvedValue(undefined);
    const suggestions: Suggestion[] = [
      { exercise: makeExercise({ id: "ex-test-2" }), reason: "Suggested", score: 3 },
    ];
    render(<SuggestedExercises suggestions={suggestions} onAssign={onAssign} assigning={null} />);
    fireEvent.click(screen.getByRole("button", { name: /assign/i }));
    await waitFor(() => expect(onAssign).toHaveBeenCalledWith("ex-test-2"));
  });

  it("disables the Assign button for the exercise currently being assigned", () => {
    const suggestions: Suggestion[] = [
      { exercise: makeExercise({ id: "ex-test-3" }), reason: "Suggested", score: 3 },
    ];
    render(<SuggestedExercises suggestions={suggestions} onAssign={vi.fn()} assigning="ex-test-3" />);
    expect(screen.getByRole("button", { name: /assign/i })).toBeDisabled();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/components/suggested-exercises.test.tsx`
Expected: FAIL — `Cannot find module '@/components/suggested-exercises'`.

- [ ] **Step 3: Implement the component**

Create `components/suggested-exercises.tsx`:

```tsx
"use client";

import type { Suggestion } from "@/lib/exercise-suggestions";

interface Props {
  suggestions: Suggestion[];
  onAssign: (exerciseId: string) => Promise<void>;
  assigning: string | null;
}

export function SuggestedExercises({ suggestions, onAssign, assigning }: Props) {
  if (suggestions.length === 0) return null;

  return (
    <div className="suggested-exercises panel stack">
      <h4 className="summary-section-title">Suggested exercises</h4>
      <ul className="suggested-exercises-list">
        {suggestions.map(({ exercise, reason }) => (
          <li key={exercise.id} className="suggested-exercise-row">
            <div className="suggested-exercise-info">
              <span className="suggested-exercise-title">{exercise.title}</span>
              <span className="suggested-exercise-badge">{exercise.clinicalArea.replace("_", " ")}</span>
              <span className="suggested-exercise-reason">{reason}</span>
            </div>
            <button
              type="button"
              className="suggested-exercise-assign"
              disabled={assigning === exercise.id}
              onClick={() => onAssign(exercise.id)}
            >
              {assigning === exercise.id ? "Assigning…" : "Assign"}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/components/suggested-exercises.test.tsx`
Expected: PASS on all 4 tests.

- [ ] **Step 5: Type-check and commit**

```bash
npx tsc --noEmit
git add components/suggested-exercises.tsx tests/components/suggested-exercises.test.tsx
git commit -m "feat: add shared SuggestedExercises component"
```

---

### Task 13: Wire suggestions into the assessment review screen

**Files:**
- Modify: `components/admin-assessment-review.tsx`
- Test: `tests/components/admin-assessment-review.test.tsx` (extend existing file if present; if it doesn't exist, check for it under a different name via `find tests -iname '*assessment-review*'` before creating a new one)

**Interfaces:**
- Consumes: `suggestExercises` (Task 11), `SuggestedExercises` (Task 12), `assignExercise`/`getAssignedExercises` from `lib/recovery.ts` (existing, signatures confirmed: `assignExercise(uid, personId, exerciseId, physioUid): Promise<void>`, `getAssignedExercises(uid, personId): Promise<AssignedExercise[]>`).

- [ ] **Step 1: Locate the exact render point**

Run: `grep -n "clinicalAreaLabels\|redFlagText\|return (" components/admin-assessment-review.tsx | head -30`

Read the full file to find where each assessment record is rendered (the section listing `presentingComplaint`, `symptoms`, etc.) — the new panel goes immediately after that section, inside the same per-record block, so it has access to the current `PatientAssessmentFormRecord` plus the `patientUid`/`personId` props already passed into the component.

- [ ] **Step 2: Write the failing test**

Add to (or create) `tests/components/admin-assessment-review.test.tsx` a case asserting the suggestions panel appears with the assessment's `clinicalArea` reflected — write this test only after Step 1's read confirms the component's actual prop/data shape (do not guess field names; copy them from the file). Follow the existing test file's setup pattern for mocking `lib/assessment-forms.ts` and `lib/recovery.ts` (check `tests/components/admin-exercise-assigner.test.tsx` for the established Firebase-mock pattern in this repo and mirror it).

- [ ] **Step 3: Run test to verify it fails**

Run: `npx vitest run tests/components/admin-assessment-review.test.tsx`
Expected: FAIL — suggestions panel not yet rendered.

- [ ] **Step 4: Add the suggestions panel**

Import at the top of `components/admin-assessment-review.tsx`:

```ts
import { suggestExercises } from "@/lib/exercise-suggestions";
import { SuggestedExercises } from "@/components/suggested-exercises";
import { assignExercise, getAssignedExercises } from "@/lib/recovery";
```

Add state near the component's existing `useState` calls:

```ts
const [assignedIds, setAssignedIds] = useState<string[]>([]);
const [assigningId, setAssigningId] = useState<string | null>(null);
```

Load currently assigned ids once `patientUid`/`personId` are known (mirror the existing `useEffect` pattern already in this file for loading assessment forms):

```ts
useEffect(() => {
  let cancelled = false;
  getAssignedExercises(patientUid, personId).then((list) => {
    if (!cancelled) setAssignedIds(list.map((a) => a.exerciseId));
  });
  return () => { cancelled = true; };
}, [patientUid, personId]);
```

Inside the per-record render block, after the presenting-complaint/symptoms/goals section, compute suggestions and render the panel:

```tsx
{(() => {
  const freeText = [form.presentingComplaint, form.symptoms, form.functionalImpact, form.goals]
    .filter(Boolean)
    .join(" ");
  const suggestions = suggestExercises(
    { clinicalArea: form.subjective.clinicalArea, freeText, alreadyAssignedIds: assignedIds },
    5
  );
  return (
    <SuggestedExercises
      suggestions={suggestions}
      assigning={assigningId}
      onAssign={async (exerciseId) => {
        const adminUid = auth?.currentUser?.uid;
        if (!adminUid) return;
        setAssigningId(exerciseId);
        try {
          await assignExercise(patientUid, personId, exerciseId, adminUid);
          setAssignedIds((prev) => [...prev, exerciseId]);
        } finally {
          setAssigningId(null);
        }
      }}
    />
  );
})()}
```

Replace `form` in the snippet above with whatever variable name the file actually uses for the current assessment record in its render loop (confirmed in Step 1) — do not introduce a variable that doesn't exist in the surrounding scope.

- [ ] **Step 5: Run test to verify it passes**

Run: `npx vitest run tests/components/admin-assessment-review.test.tsx`
Expected: PASS.

- [ ] **Step 6: Type-check and commit**

```bash
npx tsc --noEmit
git add components/admin-assessment-review.tsx tests/components/admin-assessment-review.test.tsx
git commit -m "feat: surface suggested exercises on the assessment review screen"
```

---

### Task 14: Wire suggestions into the write-summary drawer

**Files:**
- Modify: `components/summary-form.tsx`
- Test: `tests/components/summary-form.test.tsx` (extend existing file if present; otherwise check `find tests -iname '*summary-form*'` before creating)

**Interfaces:**
- Consumes: `suggestExercises` (Task 11), `SuggestedExercises` (Task 12), `getAssignedExercises`/`assignExercise` from `lib/recovery.ts`, `getPatientAssessmentForms` from `lib/assessment-forms.ts` (existing, signature confirmed: `getPatientAssessmentForms(uid, personId): Promise<PatientAssessmentFormRecord[]>`, sorted newest-first).

- [ ] **Step 1: Write the failing test**

Add a case to `tests/components/summary-form.test.tsx` asserting a "Suggested for this session" panel renders when `workedOn`/`nextSteps` text contains a matching keyword — check the existing test file's mocking setup for `app/admin/actions.ts` and `lib/goals.ts` (already mocked there per `summary-form.tsx:1-9`) and add mocks for `lib/assessment-forms.ts` and `lib/recovery.ts` following the same pattern, and for `lib/exercise-suggestions`/`components/suggested-exercises` only if the existing test setup requires deep mocking — prefer using the real modules since they're pure/deterministic.

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/components/summary-form.test.tsx`
Expected: FAIL — panel not yet present.

- [ ] **Step 3: Add suggestions to the drawer**

Import at the top of `components/summary-form.tsx`:

```ts
import { suggestExercises } from "@/lib/exercise-suggestions";
import { SuggestedExercises } from "@/components/suggested-exercises";
import { assignExercise, getAssignedExercises } from "@/lib/recovery";
import { getPatientAssessmentForms } from "@/lib/assessment-forms";
```

Add state alongside the existing `streakGoal` state (near `summary-form.tsx:52`):

```ts
const [assignedIds, setAssignedIds] = useState<string[]>([]);
const [latestClinicalArea, setLatestClinicalArea] = useState<PatientAssessmentFormRecord["subjective"]["clinicalArea"] | undefined>(undefined);
const [assigningId, setAssigningId] = useState<string | null>(null);
```

Import the type alongside the other imports: `import type { PatientAssessmentFormRecord } from "@/lib/assessment-forms";`

Extend the existing "load when drawer opens" `useEffect` (the one loading `getStreakGoal`, around `summary-form.tsx:77-84`) to also load assigned exercises and the most recent assessment's clinical area:

```ts
useEffect(() => {
  if (!open || !patientUid) return;
  let cancelled = false;
  getStreakGoal(patientUid, booking.patientId)
    .then((g) => { if (!cancelled) setStreakGoalState(g ?? 0); })
    .catch(() => {});
  getAssignedExercises(patientUid, booking.patientId)
    .then((list) => { if (!cancelled) setAssignedIds(list.map((a) => a.exerciseId)); })
    .catch(() => {});
  getPatientAssessmentForms(patientUid, booking.patientId)
    .then((forms) => { if (!cancelled && forms.length > 0) setLatestClinicalArea(forms[0].subjective.clinicalArea); })
    .catch(() => {});
  return () => { cancelled = true; };
}, [open, patientUid, booking.patientId]);
```

In the JSX, immediately before the `<AdminExerciseAssigner .../>` line (`summary-form.tsx:257`), add:

```tsx
<SuggestedExercises
  suggestions={suggestExercises(
    { clinicalArea: latestClinicalArea, freeText: `${form.workedOn} ${form.nextSteps}`, alreadyAssignedIds: assignedIds },
    5
  )}
  assigning={assigningId}
  onAssign={async (exerciseId) => {
    if (!adminUid) return;
    setAssigningId(exerciseId);
    try {
      await assignExercise(patientUid, booking.patientId, exerciseId, adminUid);
      setAssignedIds((prev) => [...prev, exerciseId]);
    } finally {
      setAssigningId(null);
    }
  }}
/>
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/components/summary-form.test.tsx`
Expected: PASS.

- [ ] **Step 5: Type-check and full test run**

```bash
npx tsc --noEmit
npm run test:run
```

Expected: no type errors, full suite green.

- [ ] **Step 6: Commit**

```bash
git add components/summary-form.tsx tests/components/summary-form.test.tsx
git commit -m "feat: surface suggested exercises in the write-summary drawer"
```

---

### Task 15: Final verification pass

**Files:** none (verification only)

- [ ] **Step 1: Run the full test suite**

Run: `npm run test:run`
Expected: all tests pass, including all new files from Tasks 1-14.

- [ ] **Step 2: Run the linter and type check**

```bash
npm run lint
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Confirm the library size and no id collisions one more time**

Run: `npx vitest run tests/lib/site-data.test.ts`
Expected: PASS, `exercises.length >= 150`.

- [ ] **Step 4: Manual smoke check in dev**

Start the dev server (`npm run dev`), sign in as admin, open a patient's assessment review and the write-summary drawer, confirm the "Suggested exercises" panels render and the Assign button works end-to-end against the Firebase emulators (`npm run emulators` in a separate terminal if not already running).

- [ ] **Step 5: Commit any final fixes**

If Steps 1-4 surface issues, fix them and commit with a message describing the specific fix (no placeholder messages).

## Self-review notes

- **Spec coverage:** Data model (Task 1), 150+ exercises across all clinical areas (Tasks 2-9), stick-figure diagrams (Task 10), suggestion engine (Task 11), shared UI component (Task 12), both integration points — assessment review and summary form (Tasks 13-14), testing (woven into every task) — all covered.
- **Placeholder scan:** No TBD/TODO left; content tasks specify exact exercise data rather than "write similar exercises."
- **Type consistency:** `Suggestion`, `SuggestionInput`, `SuggestedExercises` props match across Tasks 11-14; `assignExercise`/`getAssignedExercises` signatures copied verbatim from `lib/recovery.ts` rather than assumed.
- **Known plan risk:** Tasks 13-14 ask the implementer to re-read files only partially seen during planning (`admin-assessment-review.tsx`, `summary-form.tsx` full bodies) before wiring — this is intentional (avoids guessing at unseen variable names) rather than a placeholder, but flagging it: those two tasks carry more judgment than the others and are good candidates for closer review.
