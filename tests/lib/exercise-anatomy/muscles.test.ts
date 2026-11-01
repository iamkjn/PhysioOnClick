// @vitest-environment node
import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import type { BodyModelManifest } from "@/lib/body-model-format";
import { MUSCLES, type MuscleKey } from "@/lib/exercise-anatomy/muscles";

const base = JSON.parse(
  fs.readFileSync(path.join(process.cwd(), "public", "models", "body-chart", "manifest.json"), "utf8")
) as BodyModelManifest;
const baseNames = base.parts.map((p) => p.name);
const entries = Object.entries(MUSCLES) as [MuscleKey, (typeof MUSCLES)[MuscleKey]][];

/** null when the patterns light at least one part, on both sides if the parts are sided. */
function sideProblem(names: readonly string[], patterns: readonly RegExp[]): string | null {
  const hits = names.filter((n) => patterns.some((r) => r.test(n)));
  if (!hits.length) return "matches no part";
  const sided = hits.filter((n) => /\b(right|left)\b/i.test(n));
  const both = sided.some((n) => /\bright\b/i.test(n)) && sided.some((n) => /\bleft\b/i.test(n));
  return sided.length && !both ? "matches one side only" : null;
}

describe("muscle dictionary", () => {
  it("uses case-insensitive, stateless patterns", () => {
    for (const [key, m] of entries) {
      for (const r of m.parts) {
        expect(r.flags, key).toContain("i");
        expect(r.global || r.sticky, key).toBe(false);
      }
    }
  });

  it("lights base-model parts on both sides for every base muscle", () => {
    for (const [key, m] of entries.filter(([, m]) => m.source === "base")) {
      expect(sideProblem(baseNames, m.parts), key).toBeNull();
    }
  });

  it("gives a muscle that is not in the model no parts", () => {
    for (const [key, m] of entries.filter(([, m]) => m.source === "none")) {
      expect(m.parts, key).toHaveLength(0);
    }
  });

  it("has no stand-ins: a group lights only its own parts", () => {
    for (const [key, m] of entries) expect(Object.keys(m).sort(), key).toEqual(["label", "parts", "plain", "source", "view"]);
  });

  it("writes labels capitalised and plain words lower-case with no full stop", () => {
    for (const [key, m] of entries) {
      expect(m.label, key).toMatch(/^[A-Z]/);
      expect(m.plain, key).toMatch(/^[a-z]/);
      expect(m.plain, key).not.toMatch(/\.$/);
    }
  });

  it("keeps the face out of 3D (the model has no facial muscles)", () => {
    for (const key of ["frontalis", "orbicularis-oculi", "zygomaticus", "orbicularis-oris", "buccinator"] as MuscleKey[]) {
      expect(MUSCLES[key].source).toBe("none");
      expect(MUSCLES[key].parts).toHaveLength(0);
    }
  });
});
