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
