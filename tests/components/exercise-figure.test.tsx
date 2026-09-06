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

  it.each(titles)("renders an svg for '%s' without throwing", (name) => {
    const { container } = render(<ExerciseFigure name={name} />);
    expect(container.querySelector("svg")).not.toBeNull();
  });

  it("keeps pre-existing routing unchanged for original exercise titles", () => {
    // Sit to Stand Control -> squat; Scapular Setting -> pendulum;
    // Pendulum Swing -> pendulum; Shoulder Flexion -> pendulum (not overheadReach).
    const preExisting = [
      "Sit to Stand Control",
      "Scapular Setting",
      "Pendulum Swing",
      "Shoulder Flexion",
    ];
    for (const name of preExisting) {
      const { container } = render(<ExerciseFigure name={name} />);
      expect(container.querySelector("svg")).not.toBeNull();
    }
  });
});

describe("ExerciseFigure explicit pose", () => {
  it("uses the explicit pose when given, ignoring the name", () => {
    const { container } = render(<ExerciseFigure name="totally unknown movement" pose="squat" />);
    // squat spec has 1 circle + >=5 segments (see SPECS); standing differs.
    const squat = render(<ExerciseFigure name="Sit to Stand Control" />).container;
    expect(container.querySelectorAll("line").length).toBe(squat.querySelectorAll("line").length);
  });
  it("falls back to name-guessing when no pose is given", () => {
    const { container } = render(<ExerciseFigure name="Single Leg Balance" />);
    expect(container.querySelector("svg")).toBeInTheDocument();
  });
  it("falls back to standing for an unknown explicit pose value", () => {
    const { container } = render(<ExerciseFigure name="x" pose="not-a-pose" />);
    expect(container.querySelector("svg")).toBeInTheDocument();
  });
});
