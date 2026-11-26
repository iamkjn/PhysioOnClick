// Six seated neck and shoulder movements from Shivaliba's patient handout
// (25 November 2026). Wording follows the handout, which is the review date
// shown. Published on the owner's instruction, 26 November 2026.
import type { Exercise } from "@/lib/exercises";

const SEATED = "Sit on a firm chair with a back, with your feet resting comfortably on the floor.";
const STOP = "Stop and tell your physio if you get sharp or worsening pain, dizziness, or pins and needles in your arms.";

type Input = Pick<
  Exercise,
  "id" | "slug" | "title" | "bodyPart" | "clinicalArea" | "tags" | "condition" | "description" | "aka" | "steps" | "cues" | "mistakes" | "defaultDosage" | "equipment"
>;

const draft = (e: Input): Exercise => ({
  stage: "Early rehab",
  equipment: ["A firm chair with a back"],
  setup: SEATED,
  pose: null,
  ...e,
  mistakes: [...(e.mistakes ?? []), STOP],
  reviewedOn: "2026-11-25",
});

export const NECK_SHOULDER_2026_11_26: Exercise[] = [
  draft({
    id: "ex-188", slug: "seated-neck-bending", title: "Neck Bending Forward and Back",
    bodyPart: "Cervical spine", clinicalArea: "spine", tags: ["neck", "range-of-motion", "seated"],
    condition: "Neck stiffness", description: "Gently bending the neck forward and back while seated, within a comfortable range.",
    steps: ["Slowly lower your chin towards your chest.", "Come back up, then gently look up towards the ceiling.", "Return to the middle."],
    cues: ["Move slowly and keep breathing."], mistakes: ["Forcing the movement or moving quickly."],
    defaultDosage: { reps: 10, perDay: 2, perWeek: 7 },
  }),
  draft({
    id: "ex-189", slug: "pillow-lift", title: "Pillow Lift Forward and Up",
    bodyPart: "Shoulder", clinicalArea: "upper_limb", tags: ["shoulder", "mobility", "seated", "pillow"],
    condition: "Shoulder stiffness", description: "Lifting a pillow forwards and up with both hands while seated, then lowering it slowly.",
    equipment: ["A firm chair with a back", "A pillow"],
    steps: ["Hold one end of a pillow in each hand.", "Lift it forwards and up, only as far as is comfortable.", "Lower it slowly back to your lap."],
    cues: ["Lower slowly and keep breathing."], mistakes: ["Lifting higher than is comfortable."],
    defaultDosage: { reps: 10, perDay: 2, perWeek: 7 },
  }),
  draft({
    id: "ex-190", slug: "pillow-side-to-side", title: "Pillow Side to Side",
    bodyPart: "Shoulder", clinicalArea: "upper_limb", tags: ["shoulder", "mobility", "seated", "pillow"],
    condition: "Shoulder stiffness", description: "Moving a pillow out to each side and back across while seated.",
    equipment: ["A firm chair with a back", "A pillow"],
    steps: ["Hold the pillow in both hands in front of you.", "Move it slowly out to one side, back across, then to the other side.", "Keep your body still and facing forwards."],
    cues: ["Your body stays still; only your arms move."], mistakes: ["Twisting your body with the pillow."],
    defaultDosage: { reps: 10, perDay: 2, perWeek: 7, notes: "10 times each side." },
  }),
  draft({
    id: "ex-191", slug: "seated-chest-stretch", title: "Seated Chest Stretch",
    bodyPart: "Shoulder", clinicalArea: "upper_limb", tags: ["chest", "flexibility", "seated"],
    condition: "Tight chest and rounded shoulders", description: "Taking the elbows gently back with hands behind the head to open the chest.",
    aka: ["pectoral stretch", "chest stretch"],
    steps: ["Place your hands lightly behind your head. Do not pull on your neck.", "Gently take your elbows back and open your chest.", "Keep breathing normally."],
    cues: ["Your hands rest lightly."], mistakes: ["Pulling on your neck."],
    defaultDosage: { reps: 3, holdSeconds: 15, perDay: 2, perWeek: 7, notes: "Hold for 15 to 20 seconds." },
  }),
  draft({
    id: "ex-192", slug: "hook-grip-pull", title: "Hook Grip Pull",
    bodyPart: "Shoulder", clinicalArea: "upper_limb", tags: ["shoulder", "isometric", "strength", "seated"],
    condition: "Shoulder weakness", description: "Pulling hooked fingers apart without moving, to work the shoulder muscles.",
    aka: ["isometric shoulder pull"],
    steps: ["Hold your hands in front of your chest, elbows out.", "Hook the curled fingers of both hands together.", "Pull your hands apart without letting go. Then relax."],
    cues: ["Pull without moving."], mistakes: ["Holding your breath."],
    defaultDosage: { reps: 10, holdSeconds: 5, perDay: 2, perWeek: 7 },
  }),
  draft({
    id: "ex-193", slug: "fist-press", title: "Fist Press",
    bodyPart: "Shoulder", clinicalArea: "upper_limb", tags: ["shoulder", "isometric", "strength", "seated"],
    condition: "Shoulder weakness", description: "Pressing one fist down and the other up without moving, to work the chest and shoulder muscles.",
    aka: ["isometric fist press"],
    steps: ["Make two fists and place one on top of the other.", "Press the top fist down and the bottom fist up at the same time.", "Hold without moving, relax, then swap which hand is on top."],
    cues: ["Push without moving."], mistakes: ["Holding your breath."],
    defaultDosage: { reps: 10, holdSeconds: 5, perDay: 2, perWeek: 7 },
  }),
];
