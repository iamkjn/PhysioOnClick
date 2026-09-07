export const IMAGE_STYLE_PREFIX =
  "Flat 2D vector illustration, clean and minimal, single human figure with neutral leggings and top, no facial features, ";
export const IMAGE_STYLE_SUFFIX =
  ", a single sky-blue (#0EA5E9) curved arrow showing the direction of movement, navy (#14213D) line work, warm off-white (#FBF7F0) background, no text, no labels, no watermark, medically accurate joint positions, 3/4 side view";

export const exerciseImagePrompts: Record<string, string> = {
  "ex-3": "a person lying on their back on an exercise mat with knees bent and feet flat, hips lifted into a bridge so the body forms a straight line from shoulders to knees",
  "ex-14": "a person lying on their back, both arms reaching straight up and hips and knees bent to right angles, slowly lowering one opposite arm and leg towards the floor (dead bug)",
  "ex-15": "a person on hands and knees on a mat, reaching one arm forward and the opposite leg straight back, both level with the flat back (bird dog)",
  "ex-17": "a person lying face down propping the upper body up on straight arms with hips and legs relaxed on the mat, lower back gently arched (press-up / cobra)",
  "ex-18": "a person standing with hands supporting the lower back, leaning the upper body gently backwards",
  "ex-24": "a person lying face down, chest and forehead lifted a small way off the mat, arms by the sides with palms turned outward and shoulder blades drawn together (prone cobra)",
  "ex-25": "a person in a side-lying position propped on one forearm with knees bent, hips lifted so the body is a straight line from head to knees (modified side plank)",
  "ex-26": "a person on a mat rolling smoothly from lying on their back onto their side, one body segment at a time",
  "ex-27": "a person lying on their back with knees bent, gently tilting the pelvis to flatten the lower back towards the floor (pelvic tilt)",
  "ex-28": "a person on hands and knees reaching one arm forward and the opposite leg back, then drawing that elbow and knee together under the body",
  "ex-31": "a person lying on their back gently drawing both bent knees up towards the chest, hands behind the thighs (lumbar flexion in lying)",
  "ex-32": "a person sitting upright on a chair, straightening one leg forward while lifting the head to look up, then bending the knee while tucking the chin (seated nerve glide)",
  "ex-34": "a person hinging at the hips with a flat back and slightly bent knees to lift a small box from the floor, keeping it close to the body",

  // Batch A — ankle / shoulder / neck (Anish George's plan). Ankle range
  // movements are drawn as a two-panel start/end pair per the style spec.
  "ex-2": "a person seen from behind sitting upright, shoulders relaxed, gently drawing both shoulder blades down and slightly together",
  "ex-8": "a person standing tall, raising one straight arm forwards and up overhead as far as is comfortable, thumb leading the movement",
  "ex-12": "a person standing tall with fingertips resting lightly on a kitchen counter for balance, rising up onto the balls of both feet with the heels lifted high",
  "ex-13": "a person seated upright in profile, keeping the face vertical while gliding the head and chin straight backwards to make a gentle double chin",
  "ex-35": "a person standing side-on holding a short resistance band, the working elbow tucked against the side over a small rolled towel, rotating the forearm outward away from the body",
  "ex-36": "a person standing side-on holding a short resistance band, the working elbow tucked against the side over a small rolled towel, rotating the forearm inward across the stomach",
  "ex-37": "a person facing a wall with both forearms and hands flat against it in a goalpost shape, sliding the arms slowly upward while keeping contact with the wall",
  "ex-52": "a person in a straight-bodied push-up position at the top of the movement, pushing a little further so the upper back rounds gently and the shoulder blades spread apart",
  "ex-59": "two side-by-side panels of the same person seated with the injured leg raised on a cushion: left panel pointing the foot away, right panel pulling the toes and foot back up towards the shin",
  "ex-60": "a person seated with one foot lifted off the floor, tracing a large letter shape in the air with the big toe, the movement coming only from the ankle",
  "ex-61": "two side-by-side panels of the same person seated with the leg out straight and a resistance band looped around the outside of the foot and anchored to the opposite side: left panel foot relaxed inward, right panel turning the sole of the foot outward against the band",
  "ex-62": "a person balancing on one leg on a soft cushion or wobble pad, the other foot lifted clear, fingertips hovering near a wall for safety, the standing knee slightly bent",
  "ex-63": "a person standing facing a wall with both hands on it, one leg stepped straight back with the heel flat on the floor and the front knee bent, leaning the hips towards the wall",
  "ex-64": "a person standing on the edge of a step with the balls of both feet on the step and the heels hanging off the back, holding a handrail, slowly lowering one heel down below the level of the step",
};

export function hasImagePrompt(id: string): boolean {
  return typeof exerciseImagePrompts[id] === "string";
}
export function fullImagePrompt(id: string): string | null {
  const core = exerciseImagePrompts[id];
  return core ? `${IMAGE_STYLE_PREFIX}${core}${IMAGE_STYLE_SUFFIX}` : null;
}

/**
 * Exercise ids whose illustration has actually been generated, clinically
 * reviewed, and uploaded to Storage (`exercise-images/{id}.png`). This is the
 * gate the web card and the PDF use to decide "show the real image" vs "fall
 * back to the stick figure" — it is deliberately NOT `hasImagePrompt`, because
 * a prompt can be authored (this file) long before the image is live. Add an
 * id here in the same commit that runs `scripts/upload-exercise-images.ts`
 * for it.
 */
export const uploadedImageIds: ReadonlySet<string> = new Set<string>([
  // batch 1 + batch A: prompts authored, generation blocked on image-gen API
]);

export function hasUploadedImage(id: string): boolean {
  return uploadedImageIds.has(id);
}
