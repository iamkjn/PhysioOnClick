import { afterEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { ExerciseAnatomySection } from "@/components/exercise-library/exercise-anatomy-section";
import { HEALING_CLOSING, TISSUE_LINES } from "@/lib/exercise-anatomy/healing";
import type { ExerciseAnatomy } from "@/lib/exercise-anatomy/types";

const entry: ExerciseAnatomy = {
  main: ["gluteus-medius"],
  helpers: ["deep-hip-rotators"],
  howItHelps: "It strengthens the side of your hip. That keeps your knee in line when you walk.",
  tissue: "muscle-tendon",
  status: "draft",
};

afterEach(() => vi.unstubAllEnvs());

describe("ExerciseAnatomySection", () => {
  it("lists the main focus and helpers in plain words, then how it helps", () => {
    render(<ExerciseAnatomySection anatomy={entry} stage="Strength phase" />);
    expect(screen.getByRole("heading", { level: 2, name: "What it works and how it helps" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 3, name: "Main focus" })).toBeInTheDocument();
    expect(screen.getByText("Gluteus medius")).toBeInTheDocument();
    expect(screen.getByText(/\(side of your hip\)/)).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 3, name: "Also working" })).toBeInTheDocument();
    expect(screen.getByText(entry.howItHelps)).toBeInTheDocument();
  });

  it("leaves out 'Also working' when there are no helpers", () => {
    render(<ExerciseAnatomySection anatomy={{ ...entry, helpers: [] }} stage="Strength phase" />);
    expect(screen.queryByRole("heading", { name: "Also working" })).not.toBeInTheDocument();
  });

  it("shows the approved healing copy with the drafts flag off", () => {
    vi.stubEnv("NEXT_PUBLIC_EXERCISE_ANATOMY_DRAFTS", "");
    const { container } = render(<ExerciseAnatomySection anatomy={entry} stage="Strength phase" />);
    expect(container.querySelector("[data-healing]")).not.toBeNull();
  });

  it("marks this exercise's stage and shows its tissue line when the copy is visible", () => {
    vi.stubEnv("NEXT_PUBLIC_EXERCISE_ANATOMY_DRAFTS", "1");
    const { container } = render(<ExerciseAnatomySection anatomy={entry} stage="Strength phase" />);
    const current = container.querySelector('[aria-current="step"]')!;
    expect(current).toHaveTextContent("Strength");
    expect(current).toHaveTextContent("This exercise");
    expect(container.querySelectorAll(".exlib-anatomy__stages li")).toHaveLength(4);
    expect(screen.getByText(TISSUE_LINES["muscle-tendon"])).toBeInTheDocument();
    expect(screen.getByText(HEALING_CLOSING)).toBeInTheDocument();
  });

  it("separates the label, the marker and the caption with spaces", () => {
    vi.stubEnv("NEXT_PUBLIC_EXERCISE_ANATOMY_DRAFTS", "1");
    const { container } = render(<ExerciseAnatomySection anatomy={entry} stage="Strength phase" />);
    expect(container.querySelector('[aria-current="step"]')!.textContent).toBe(
      "Strength This exercise Build strength so the area copes with more."
    );
  });

  it("drops the stages strip for facial rehab but keeps the tissue line", () => {
    vi.stubEnv("NEXT_PUBLIC_EXERCISE_ANATOMY_DRAFTS", "1");
    const face: ExerciseAnatomy = { ...entry, main: ["zygomaticus"], helpers: [], tissue: "nerve-brain" };
    const { container } = render(<ExerciseAnatomySection anatomy={face} stage="Facial rehab" />);
    expect(container.querySelector(".exlib-anatomy__stages")).toBeNull();
    expect(screen.getByText(TISSUE_LINES["nerve-brain"])).toBeInTheDocument();
  });
});
