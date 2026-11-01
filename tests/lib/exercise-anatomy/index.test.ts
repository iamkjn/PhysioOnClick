// @vitest-environment node
import { afterEach, describe, expect, it, vi } from "vitest";
import { canShow3D, entryProblems, isVisible, startView, visibleAnatomy } from "@/lib/exercise-anatomy";
import { HEALING_STAGES, healingCopyVisible } from "@/lib/exercise-anatomy/healing";
import type { ExerciseAnatomy } from "@/lib/exercise-anatomy/types";

const entry = (over: Partial<ExerciseAnatomy> = {}): ExerciseAnatomy => ({
  main: ["gluteus-medius"],
  helpers: ["deep-hip-rotators"],
  howItHelps: "It strengthens the side of your hip. That keeps your knee in line when you walk.",
  tissue: "muscle-tendon",
  status: "draft",
  ...over,
});

afterEach(() => vi.unstubAllEnvs());

describe("isVisible", () => {
  it("hides drafts unless the drafts flag is on", () => {
    vi.stubEnv("NEXT_PUBLIC_EXERCISE_ANATOMY_DRAFTS", "");
    expect(isVisible(entry())).toBe(false);
    vi.stubEnv("NEXT_PUBLIC_EXERCISE_ANATOMY_DRAFTS", "1");
    expect(isVisible(entry())).toBe(true);
  });

  it("always shows approved entries", () => {
    vi.stubEnv("NEXT_PUBLIC_EXERCISE_ANATOMY_DRAFTS", "");
    expect(isVisible(entry({ status: "approved" }))).toBe(true);
  });
});

describe("healing copy", () => {
  it("follows the drafts flag while it is still a draft", () => {
    vi.stubEnv("NEXT_PUBLIC_EXERCISE_ANATOMY_DRAFTS", "");
    expect(healingCopyVisible()).toBe(false);
    vi.stubEnv("NEXT_PUBLIC_EXERCISE_ANATOMY_DRAFTS", "1");
    expect(healingCopyVisible()).toBe(true);
  });

  it("names the catalogue's four stages in order", () => {
    expect(HEALING_STAGES.map((s) => s.stage)).toEqual(["Early rehab", "Mobility phase", "Strength phase", "Return to function"]);
  });
});

describe("canShow3D", () => {
  it("allows muscles that are in the model or the add-on", () => {
    expect(canShow3D(entry())).toBe(true);
    expect(canShow3D(entry({ main: ["pelvic-floor"] }))).toBe(true);
  });

  it("needs at least one main muscle that is actually in the model", () => {
    expect(canShow3D(entry({ main: ["multifidus"] }))).toBe(false);
    expect(canShow3D(entry({ main: ["erector-spinae", "multifidus"] }))).toBe(true);
  });

  it("refuses face muscles and clinical overrides", () => {
    expect(canShow3D(entry({ main: ["zygomaticus"], helpers: [] }))).toBe(false);
    expect(canShow3D(entry({ hide3D: true }))).toBe(false);
  });
});

describe("startView", () => {
  it("uses the first main muscle's side unless the entry overrides it", () => {
    expect(startView(entry())).toBe("right");
    expect(startView(entry({ view: "back" }))).toBe("back");
  });
});

describe("entryProblems", () => {
  it("passes a well-formed entry", () => {
    expect(entryProblems(entry())).toEqual([]);
  });

  it("flags counts, duplicates, length, sentences and promises", () => {
    expect(entryProblems(entry({ main: [] }))).toContain("main needs 1-3 muscles");
    expect(entryProblems(entry({ helpers: ["adductors", "hamstrings", "quadriceps", "soleus", "triceps"] }))).toContain(
      "helpers allows at most 4"
    );
    expect(entryProblems(entry({ helpers: ["gluteus-medius"] }))).toContain("a muscle is listed twice");
    expect(entryProblems(entry({ howItHelps: "One sentence only." }))).toContain("howItHelps has 1 sentences (2-3)");
    expect(entryProblems(entry({ howItHelps: `${"word ".repeat(61).trim()}. Two.` })).some((p) => p.startsWith("howItHelps has 62 words"))).toBe(
      true
    );
    expect(entryProblems(entry({ howItHelps: "This will heal your hip. Do it daily." }))).toContain("howItHelps makes a promise");
  });
});

describe("visibleAnatomy", () => {
  it("ignores object built-ins and unknown slugs, even with drafts on", () => {
    vi.stubEnv("NEXT_PUBLIC_EXERCISE_ANATOMY_DRAFTS", "1");
    expect(visibleAnatomy("constructor")).toBeNull();
    expect(visibleAnatomy("__proto__")).toBeNull();
    expect(visibleAnatomy("not-an-exercise")).toBeNull();
  });
});
