import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { ExerciseFigure } from "@/components/exercise-figure";
import { POSE_SPECS, poseForName } from "@/lib/exercise-poses";

describe("ExerciseFigure renders", () => {
  const titles = [
    "Neck Rotation Range",
    "Standing Hip Flexor Stretch",
    "Ankle Pump",
    "Standing Pelvic Tilt (Pregnancy)",
    "Overhead Press Progression",
    "Cat-Cow Stretch",
    "Grip Strengthening",
    // added poses, exercised by name inference
    "Heel Raises",
    "Calf Stretch (Gastrocnemius)",
    "Chin Tuck",
    "Scapular Setting",
    "Shoulder External Rotation (Band)",
    "Wall Slide",
    "Push-Up Plus (Wall or Floor)",
  ];

  it.each(titles)("renders an svg for '%s' without throwing", (name) => {
    const { container } = render(<ExerciseFigure name={name} />);
    expect(container.querySelector("svg")).not.toBeNull();
  });
});

describe("poseForName routing for the new ankle/shoulder/neck moves", () => {
  it.each([
    ["Heel Raises", "heelRaise"],
    ["Eccentric Heel Drop", "heelRaise"],
    ["Calf Stretch (Gastrocnemius)", "calfStretch"],
    ["Chin Tuck", "chinTuck"],
    ["Scapular Setting", "scapularSet"],
    ["Shoulder External Rotation (Band)", "bandRotation"],
    ["Shoulder Internal Rotation (Band)", "bandRotation"],
    ["Resisted Ankle Eversion", "bandRotation"],
    ["Wall Slide", "wallSlide"],
    ["Push-Up Plus (Wall or Floor)", "pushUpPlus"],
    ["Ankle Alphabet", "anklePump"],
    ["Single Leg Balance on Foam", "balance"],
    ["something we have never heard of", "standing"],
  ])("'%s' -> %s", (name, pose) => {
    expect(poseForName(name)).toBe(pose);
  });
});

describe("ExerciseFigure explicit pose", () => {
  it("uses the explicit pose when given, ignoring the name", () => {
    const { container } = render(<ExerciseFigure name="totally unknown movement" pose="squat" />);
    const squat = render(<ExerciseFigure name="Sit to Stand Control" />).container;
    expect(container.querySelectorAll("line").length).toBe(squat.querySelectorAll("line").length);
    expect(container.querySelectorAll("line").length).toBe(POSE_SPECS.squat.segments.length);
  });
  it("falls back to name-guessing when no pose is given", () => {
    const { container } = render(<ExerciseFigure name="Single Leg Balance" />);
    expect(container.querySelector("svg")).toBeInTheDocument();
  });
  it("falls back to standing for an unknown explicit pose value", () => {
    const { container } = render(<ExerciseFigure name="x" pose="not-a-pose" />);
    expect(container.querySelectorAll("line").length).toBe(POSE_SPECS.standing.segments.length);
  });
});
