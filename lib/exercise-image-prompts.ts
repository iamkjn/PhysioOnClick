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
};

export function hasImagePrompt(id: string): boolean {
  return typeof exerciseImagePrompts[id] === "string";
}
export function fullImagePrompt(id: string): string | null {
  const core = exerciseImagePrompts[id];
  return core ? `${IMAGE_STYLE_PREFIX}${core}${IMAGE_STYLE_SUFFIX}` : null;
}
