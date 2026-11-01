// @vitest-environment node
import { describe, expect, it } from "vitest";
import type { ModelPart } from "@/lib/body-model-format";
import {
  MATERIAL,
  ROLE,
  displayPartName,
  drawGroups,
  fitDistance,
  needsAddon,
  partLabel,
  partRoles,
  subsetBoxes,
  unionBox,
  unlitMuscles,
  unlitNote,
} from "@/lib/exercise-anatomy/scene";

const SYSTEMS = ["skeletal", "muscular", "connective"];
const part = (name: string, system: number, firstIndex: number, indexCount: number): ModelPart => ({
  name,
  system,
  chunk: 0,
  firstVertex: 0,
  vertexCount: 3,
  firstIndex,
  indexCount,
});

describe("partRoles", () => {
  const parts = [
    part("Right gluteus medius", 1, 0, 3),
    part("Right piriformis", 1, 3, 3),
    part("Right femur", 0, 6, 3),
    part("Right lumbar rotator", 1, 9, 3),
  ];

  it("marks main and helper parts, leaving the rest", () => {
    expect([...partRoles(parts, ["gluteus-medius"], ["deep-hip-rotators"])]).toEqual([ROLE.main, ROLE.helper, ROLE.other, ROLE.other]);
  });

  it("lets main win when a part is in both", () => {
    expect([...partRoles(parts, ["deep-hip-rotators"], ["deep-hip-rotators"])][1]).toBe(ROLE.main);
  });

  it("lights nothing for a muscle that is not in the model", () => {
    expect([...partRoles(parts, ["multifidus"], [])]).toEqual([0, 0, 0, 0]);
  });

  it("lights nothing for a face muscle", () => {
    expect([...partRoles(parts, ["zygomaticus"], [])]).toEqual([0, 0, 0, 0]);
  });
});

describe("drawGroups", () => {
  it("merges neighbouring parts that share a material and splits bone from muscle", () => {
    const parts = [part("A", 1, 0, 3), part("B", 1, 3, 6), part("C", 0, 9, 3), part("D", 1, 12, 3)];
    const roles = new Uint8Array([ROLE.main, ROLE.main, ROLE.other, ROLE.other]);
    expect(drawGroups(parts, roles, SYSTEMS)).toEqual([
      { start: 0, count: 9, materialIndex: MATERIAL.main },
      { start: 9, count: 3, materialIndex: MATERIAL.bone },
      { start: 12, count: 3, materialIndex: MATERIAL.muscle },
    ]);
  });
});

describe("boxes and framing", () => {
  const boxes = new Float32Array([0, 0, 0, 1, 1, 1, -1, 2, -1, 0, 3, 0]);

  it("copies the chosen boxes in order", () => {
    expect([...subsetBoxes(boxes, [1])]).toEqual([-1, 2, -1, 0, 3, 0]);
  });

  it("unions boxes across chunks, or returns null for none", () => {
    expect(unionBox([[boxes, 0], [boxes, 1]])).toEqual([-1, 0, -1, 1, 3, 1]);
    expect(unionBox([])).toBeNull();
  });

  it("backs off far enough to fit the box plus margin", () => {
    const tanHalf = Math.tan((30 * Math.PI) / 360);
    expect(fitDistance({ height: 1, width: 0.2 }, 30, 1, 0)).toBeCloseTo(0.5 / tanHalf);
    expect(fitDistance({ height: 1, width: 0.2 }, 30, 1, 0.25)).toBeCloseTo(0.75 / tanHalf);
    // A narrow stage is limited by width instead.
    expect(fitDistance({ height: 0.2, width: 1 }, 30, 0.5, 0)).toBeCloseTo(0.5 / (tanHalf * 0.5));
  });
});

describe("labels", () => {
  it("drops left/right from part names", () => {
    expect(displayPartName("Long head of right biceps femoris")).toBe("Long head of biceps femoris");
    expect(displayPartName("thoracic rotator")).toBe("Thoracic rotator");
  });

  it("names lit parts by their muscle and role", () => {
    expect(partLabel("Right gluteus medius", ["gluteus-medius"], [])).toBe("Gluteus medius: side of your hip (main focus)");
    expect(partLabel("Left piriformis", ["gluteus-medius"], ["deep-hip-rotators"])).toBe(
      "Deep hip rotators: deep muscles at the back of your hip, including piriformis (helper)"
    );
  });

  it("names a part of an unmodelled muscle's old neighbour by its own name", () => {
    // Teres major used to stand in for latissimus dorsi; now it is just a body part.
    expect(partLabel("Right teres major", ["latissimus-dorsi"], [])).toBe("Teres major");
  });

  it("names a part by the muscle it belongs to even when an unmodelled one is also main", () => {
    // Dead bug: rectus abdominis is not in the model, the external oblique is.
    expect(partLabel("Right external oblique", ["rectus-abdominis", "external-oblique"], [])).toBe(
      "External oblique: side of your tummy (main focus)"
    );
  });

  it("falls back to the part's own name", () => {
    expect(partLabel("Right femur", ["gluteus-medius"], [])).toBe("Femur");
  });
});

describe("needsAddon, unlitMuscles and unlitNote", () => {
  it("asks for the add-on only when a muscle lives there", () => {
    expect(needsAddon(["gluteus-medius", "hamstrings"])).toBe(false);
    expect(needsAddon(["gluteus-maximus", "pelvic-floor"])).toBe(true);
  });

  it("lists the muscles that are not in the model, once each, in the order given", () => {
    expect(unlitMuscles(["gluteus-medius", "hamstrings"])).toEqual([]);
    expect(unlitMuscles(["rectus-abdominis", "external-oblique"])).toEqual(["Rectus abdominis"]);
    expect(unlitMuscles(["multifidus", "gluteus-medius", "rectus-abdominis", "multifidus"])).toEqual(["Multifidus", "Rectus abdominis"]);
  });

  it("writes no note when every muscle is in the model", () => {
    expect(unlitNote([])).toBeNull();
    expect(unlitNote(["gluteus-medius", "pelvic-floor"])).toBeNull();
  });

  it("names the muscles that are not lit, first letter lower-cased", () => {
    expect(unlitNote(["rectus-abdominis", "external-oblique"])).toBe("Not in the 3D model, so not lit: rectus abdominis.");
    expect(unlitNote(["multifidus", "rectus-abdominis", "gluteus-medius", "multifidus"])).toBe(
      "Not in the 3D model, so not lit: multifidus, rectus abdominis."
    );
  });
});
