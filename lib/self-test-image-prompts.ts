// Style contract for the AI-generated self-check test photos.
//
// This is the photo analogue of `lib/exercise-image-prompts.ts`. The key
// difference from the exercise set: the self-check tests use a *realistic
// photograph* of a person demonstrating the test position, not an anatomical
// illustration - the reference sample cards use photos, and a photo reads as
// "a real thing you can copy" rather than "a diagram to interpret".
//
// A full prompt is `${SELF_TEST_IMAGE_STYLE_PREFIX}${core}${SELF_TEST_IMAGE_STYLE_SUFFIX}`
// where the per-step `core` (below) is one plain Latin-1 phrase describing the
// position that step depicts. Consistent model, plain wardrobe and plain
// neutral studio background across the whole set; a single sky-blue (#0EA5E9)
// direction arrow appears ONLY on the steps where the movement direction
// matters. See docs/exercise-image-style.md ("Self-check test photos").

import { selfTests } from "@/lib/self-tests";

export const SELF_TEST_IMAGE_STYLE_PREFIX =
  "Realistic clean photograph of a single person demonstrating a physiotherapy self-check test, ";
export const SELF_TEST_IMAGE_STYLE_SUFFIX =
  ", consistent adult model in plain grey activewear on a plain pale studio background, natural even lighting, a single sky-blue (#0EA5E9) arrow only where it shows the direction of movement, three-quarter camera angle, no text, no labels, no watermark, photorealistic";

/**
 * One `core` phrase per `step.imageId` in `lib/self-tests.ts`. Every key here
 * is a step image id of the form `test-<slug>-<n>`; the value describes what
 * that step's `label` + `instruction` should look like as a photo. There are
 * 49 keys - one for every step across the 12 launch-set self-tests. The
 * dev-only guard at the bottom of this file (and
 * tests/lib/self-test-image-prompts.test.ts) keeps this set exactly in step
 * with `selfTests`.
 */
export const selfTestImagePrompts: Record<string, string> = {
  // Full Can Test - supraspinatus / rotator cuff (shoulder)
  "test-full-can-1":
    "the person standing tall and relaxed with both arms hanging straight down by the sides and the shoulders level, seen from the front",
  "test-full-can-2":
    "the person raising one straight arm from the side up to shoulder height and about thirty degrees forward of straight out to the side so it lines up with the shoulder blade, elbow straight, a sky-blue (#0EA5E9) arrow curving upward to show the arm lifting, seen from the front",
  "test-full-can-3":
    "the person holding one arm out at shoulder height and about thirty degrees forward of the body, rotating the whole arm so the thumb points up to the ceiling as if holding a full can of drink, a short curved sky-blue (#0EA5E9) arrow at the wrist showing the arm turning thumb-up, seen from the front",
  "test-full-can-4":
    "the person holding the arm out at shoulder height with the thumb up, pressing the back of the wrist gently up against the underside of a table edge, a short sky-blue (#0EA5E9) arrow pointing up at the wrist to show the light upward effort, seen from the front",

  // Hawkins-Kennedy Test - rotator cuff pinch (shoulder)
  "test-hawkins-kennedy-1":
    "the person with one arm lifted straight in front to shoulder height and the elbow bent to a right angle so the forearm points out to the side with the palm facing down, seen from the front",
  "test-hawkins-kennedy-2":
    "the person cupping the lifted elbow in the opposite hand to support it, the upper arm kept level at shoulder height and the forearm horizontal, seen from the front",
  "test-hawkins-kennedy-3":
    "the person using the free hand to guide the forearm downward towards the floor so the shoulder rotates inward, a sky-blue arrow curving down to show the direction, seen from the front",
  "test-hawkins-kennedy-4":
    "the person at the end of the inward rotation with the forearm pointing down towards the floor and the other hand resting near the front of the sore shoulder, seen from the front",

  // Painful Arc Self-Check - band of painful range (shoulder)
  "test-painful-arc-1":
    "the person standing tall with both arms hanging by the sides and the thumbs pointing forwards, shoulders relaxed down, seen from the front",
  "test-painful-arc-2":
    "the person raising one straight arm out to the side towards overhead with the thumb pointing up and the elbow straight, a sky-blue arrow along the arc to show the upward path, seen from the front",
  "test-painful-arc-3":
    "the person holding the straight arm out to the side at about shoulder height, the mid part of the sideways lift where a painful band is felt, seen from the front",
  "test-painful-arc-4":
    "the person raising the other straight arm out to the side to the same height to compare the two shoulders, seen from the front",

  // Resisted Wrist Extension Test - tennis elbow (elbow and wrist)
  "test-wrist-ext-1":
    "the person holding one arm straight out in front at shoulder height with the elbow straight, the palm facing down and the hand in a loose fist, seen from the side",
  "test-wrist-ext-2":
    "the person with the arm straight out in front bending the wrist back so the knuckles lift up towards the ceiling, a sky-blue arrow pointing up to show the wrist movement, seen from the side",
  "test-wrist-ext-3":
    "the person pressing down on the back of the raised hand with the other hand while the cocked wrist holds firm against it, the arm still straight out in front, seen from the side",
  "test-wrist-ext-4":
    "a close view of the person resting a fingertip on the bony bump on the outside of the elbow where the pain of this test is felt, seen from the side",

  // Resisted Wrist Flexion Test - golfer's elbow (elbow and wrist)
  "test-wrist-flex-1":
    "the person holding one arm straight out in front at shoulder height with the elbow straight, the palm facing up and the hand open, seen from the side",
  "test-wrist-flex-2":
    "the person with the arm straight out in front curling the wrist so the open palm lifts up towards the face, a sky-blue arrow showing the wrist curling upward, seen from the side",
  "test-wrist-flex-3":
    "the person pushing the raised palm back down with the other hand while the curled wrist holds firm against it, the arm still straight out in front, seen from the side",
  "test-wrist-flex-4":
    "a close view of the person resting a fingertip on the bony bump on the inside of the elbow where the pain of this test is felt, seen from the side",

  // Slump Self-Check - sciatic nerve sensitivity (back and neck)
  "test-slump-1":
    "the person sitting fully upright on the edge of a firm chair with the hands clasped behind the lower back and the backs of the knees against the chair edge, seen from the side",
  "test-slump-2":
    "the person letting the lower back and upper back round forward into a slump with the breastbone dropping while the head stays up and level, seen from the side",
  "test-slump-3":
    "the person still slumped forward slowly straightening one knee out in front until a gentle pull is felt, a sky-blue arrow showing the lower leg lifting towards straight, seen from the side",
  "test-slump-4":
    "the person holding the knee straight out in front and pulling the toes and foot up towards the shin, still slumped forward, seen from the side",
  "test-slump-5":
    "the person holding the slumped position with the knee straight and the foot pulled up while tucking the chin down towards the chest, a sky-blue arrow showing the head nodding down and back up, seen from the side",

  // Straight Leg Raise Self-Check - sciatic nerve on stretch (back and neck)
  "test-slr-1":
    "the person lying flat on their back on a bed with both legs straight and relaxed and the head resting down, seen from the side",
  "test-slr-2":
    "the person lying on their back raising one leg towards the ceiling with the knee kept straight and the other leg flat, a sky-blue arrow showing the leg lifting, seen from the side",
  "test-slr-3":
    "the person lying on their back holding the straight leg raised part way up, well short of vertical, at the point where a pull is felt down the back of the leg, seen from the side",
  "test-slr-4":
    "the person lying on their back lowering the raised leg back down to the bed before testing the other straight leg to compare, seen from the side",

  // Chin Tuck and Rotation Range Check - neck joint and muscle movement (back and neck)
  "test-chin-tuck-1":
    "the person sitting upright and side-on in a firm chair, feet flat, shoulders relaxed, looking straight ahead with the chin level",
  "test-chin-tuck-2":
    "the person seated upright turning the head to look over the right shoulder as far as is comfortable, shoulders staying square to the front, a small sky-blue arrow curving to show the head rotating right",
  "test-chin-tuck-3":
    "the person seated upright turning the head to look over the left shoulder, shoulders staying square, a small sky-blue arrow curving to show the head rotating left",
  "test-chin-tuck-4":
    "the person seated upright drawing the chin straight back into a gentle double chin without tipping the head down, seen from the side, a short straight sky-blue arrow pointing backward at chin level",

  // Single-Leg Decline Squat Check - kneecap and its tendon (knee)
  "test-decline-squat-1":
    "the person standing on a firm wedge about twenty degrees steep with the toes pointing downhill and one hand resting lightly on a rail for balance, seen from the side",
  "test-decline-squat-2":
    "the person on the sloped wedge shifting weight onto one leg and lifting the other foot just clear of the ground with the trunk upright, seen from the side",
  "test-decline-squat-3":
    "the person on the sloped wedge slowly bending the standing knee forward over the foot into a shallow quarter squat on one leg, a sky-blue arrow showing the downward lowering, seen from the side",
  "test-decline-squat-4":
    "the person on the sloped wedge straightening the standing leg to rise back up out of the single-leg squat with a hand near the front of the knee, seen from the side",

  // Trendelenburg Mirror Check - side-of-hip muscles (hip)
  "test-trendelenburg-1":
    "the person standing tall facing a mirror with the feet hip-width apart and both hands resting on the hips, seen from the front",
  "test-trendelenburg-2":
    "the person standing on one leg with the other knee bent and that foot lifted a few centimetres off the floor, both hands still on the hips, seen from the front",
  "test-trendelenburg-3":
    "the person balancing on one leg with the hip on the lifted-leg side dropping downward so the pelvis is no longer level, a sky-blue arrow showing that hip dropping, seen from the front",
  "test-trendelenburg-4":
    "the person balancing on one leg with a hand resting on the bony point on the outside of the standing hip, seen from the front",

  // Single-Leg Calf Raise Check - calf and Achilles (ankle and foot)
  "test-calf-raise-1":
    "the person standing facing a wall with the fingertips resting lightly on it, standing on one leg with the other foot lifted behind, seen from the side",
  "test-calf-raise-2":
    "the person pushing up as high as possible onto the ball of one foot with the heel lifted high and the knee straight, a sky-blue arrow pointing up to show the heel rising, seen from the side",
  "test-calf-raise-3":
    "the person lowering the heel slowly all the way back down to the floor on the standing leg, ready to repeat the rise, seen from the side",
  "test-calf-raise-4":
    "the person on the standing leg with the heel only rising part way because the calf has tired, about to swap to test the other leg, seen from the side",

  // Active Knee Extension Check - hamstring length (sports and return to activity)
  "test-ake-1":
    "the person lying on their back in an open doorway with one leg flat through the doorway and the other thigh raised vertical resting against the door frame with the hip bent to a right angle, seen from the side",
  "test-ake-2":
    "the person holding the raised thigh still and vertical against the door frame with the knee bent and relaxed and the other leg flat on the floor, seen from the side",
  "test-ake-3":
    "the person slowly straightening the raised knee up towards the ceiling while the thigh stays against the door frame, a sky-blue arrow showing the lower leg lifting towards straight, seen from the side",
  "test-ake-4":
    "the person holding the raised knee part way to straight with the thigh still against the frame, noting how far short of fully straight the lower leg stops, seen from the side",
};

export function hasSelfTestImagePrompt(id: string): boolean {
  return typeof selfTestImagePrompts[id] === "string";
}

export function fullSelfTestImagePrompt(id: string): string | null {
  const core = selfTestImagePrompts[id];
  return core
    ? `${SELF_TEST_IMAGE_STYLE_PREFIX}${core}${SELF_TEST_IMAGE_STYLE_SUFFIX}`
    : null;
}

/**
 * Self-test step image ids whose photo has actually been generated, clinically
 * reviewed, brand-footed and uploaded to Storage. This is the go-live gate the
 * self-test page uses to decide "show the real photo" vs "show a labelled
 * placeholder". It is deliberately NOT `hasSelfTestImagePrompt` - a prompt can
 * be authored (this file) long before any image exists. Until an id is added
 * here the step renders a labelled placeholder and the page still ships. Add
 * ids in the same commit that runs the upload script for them, and keep this a
 * strict subset of the authored prompts.
 */
export const uploadedSelfTestImageIds: ReadonlySet<string> = new Set<string>([]);

export function hasUploadedSelfTestImage(id: string): boolean {
  return uploadedSelfTestImageIds.has(id);
}

// Dev-only integrity guard: the prompt set must mirror the `step.imageId`
// values in `selfTests` exactly - no missing prompts, no orphan keys.
if (process.env.NODE_ENV !== "production") {
  const stepIds = new Set(
    selfTests.flatMap((t) => t.steps.map((s) => s.imageId)),
  );
  const promptKeys = new Set(Object.keys(selfTestImagePrompts));
  for (const id of stepIds) {
    if (!promptKeys.has(id)) {
      console.warn(`[self-test-image-prompts] missing prompt for step image "${id}"`);
    }
  }
  for (const key of promptKeys) {
    if (!stepIds.has(key)) {
      console.warn(`[self-test-image-prompts] orphan prompt key "${key}"`);
    }
  }
}
