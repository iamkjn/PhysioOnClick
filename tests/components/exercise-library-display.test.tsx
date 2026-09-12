import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { conditions } from "@/lib/conditions";
import { exercises } from "@/lib/exercises";
import { ExerciseCard } from "@/components/exercise-library/exercise-card";
import { ConditionCard } from "@/components/exercise-library/condition-card";
import { StagedProgram } from "@/components/exercise-library/staged-program";
import { ByLine } from "@/components/exercise-library/by-line";
import { FaqAccordion } from "@/components/exercise-library/faq-accordion";

const clamShell = exercises.find((e) => e.slug === "clam-shell")!;
const sideLying = exercises.find((e) => e.slug === "side-lying-hip-abduction")!;
const rotatorCuff = conditions.find((c) => c.slug === "rotator-cuff-tendinopathy")!;

describe("ExerciseCard", () => {
  it("renders the title, metadata, a slug link and an illustration", () => {
    const { container } = render(<ExerciseCard exercise={clamShell} />);

    expect(screen.getByText("Clam Shell")).toBeInTheDocument();

    const link = container.querySelector('a[href="/exercises/clam-shell"]');
    expect(link).not.toBeNull();

    expect(container).toHaveTextContent(clamShell.bodyPart);
    expect(container).toHaveTextContent(clamShell.stage);
    expect(container).toHaveTextContent("View details");

    // ExerciseImage renders an <img> when a real illustration exists, otherwise
    // the inline stick-figure <svg> fallback. In jsdom nothing is uploaded.
    expect(container.querySelector("img, svg")).not.toBeNull();
  });
});

describe("ConditionCard", () => {
  it("renders the name, description, count and hub link", () => {
    const { container } = render(
      <ConditionCard condition={rotatorCuff} exerciseCount={7} />,
    );

    expect(
      screen.getByText("Rotator cuff tendinopathy exercises"),
    ).toBeInTheDocument();
    expect(container).toHaveTextContent(rotatorCuff.seoDescription);
    expect(container).toHaveTextContent("7 exercises");
    expect(
      container.querySelector(
        'a[href="/exercises/for/rotator-cuff-tendinopathy"]',
      ),
    ).not.toBeNull();
  });
});

describe("StagedProgram", () => {
  it("renders one section per stage with its exercises", () => {
    const program = [
      {
        stage: {
          stage: "Settle it down",
          blurb: "Calm the joint first with gentle movement.",
          exerciseSlugs: ["clam-shell"],
        },
        exercises: [clamShell],
      },
      {
        stage: {
          stage: "Build strength",
          blurb: "Add load gradually as it eases.",
          exerciseSlugs: ["side-lying-hip-abduction"],
        },
        exercises: [sideLying],
      },
    ];

    const { container } = render(<StagedProgram program={program} />);

    expect(screen.getByText("Settle it down")).toBeInTheDocument();
    expect(screen.getByText("Build strength")).toBeInTheDocument();
    expect(
      screen.getByText("Calm the joint first with gentle movement."),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Add load gradually as it eases."),
    ).toBeInTheDocument();

    const cards = container.querySelectorAll('a[href^="/exercises/"]');
    expect(cards).toHaveLength(2);
  });
});

describe("ByLine", () => {
  it("renders the author, HCPC number and the reviewed date", () => {
    const { container } = render(<ByLine reviewedOn="2026-09-08" />);

    expect(container).toHaveTextContent("Shivaliba Zala");
    expect(container).toHaveTextContent("PH155757");
    expect(container).toHaveTextContent("8 September 2026");
  });
});

describe("FaqAccordion", () => {
  it("renders one <details> per FAQ with the question and answer", () => {
    const faqs = [
      { q: "Is this exercise safe?", a: "Yes, for most people it is very safe." },
      { q: "How long until it helps?", a: "Usually around six to eight weeks." },
    ];

    const { container } = render(<FaqAccordion faqs={faqs} />);

    const items = container.querySelectorAll("details");
    expect(items).toHaveLength(2);

    const summaries = container.querySelectorAll("summary");
    expect(summaries[0]).toHaveTextContent("Is this exercise safe?");
    expect(summaries[1]).toHaveTextContent("How long until it helps?");

    expect(items[0]).toHaveTextContent("Yes, for most people it is very safe.");
    expect(items[1]).toHaveTextContent("Usually around six to eight weeks.");
  });
});
