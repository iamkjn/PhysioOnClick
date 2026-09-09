import { describe, expect, it } from "vitest";
import { render } from "@testing-library/react";

import { ExerciseSafetyNote } from "@/components/exercise-library/exercise-safety-note";

describe("ExerciseSafetyNote", () => {
  it("full: renders the h2, an intro, a 5-item list and the 'see a doctor' closing line", () => {
    const { container } = render(<ExerciseSafetyNote variant="full" />);

    const wrapper = container.querySelector("[data-safety-note]");
    expect(wrapper).not.toBeNull();
    expect(wrapper?.getAttribute("data-variant")).toBe("full");

    const heading = container.querySelector("h2");
    expect(heading?.textContent).toBe("Using these exercises safely");

    const items = container.querySelectorAll("li");
    expect(items).toHaveLength(5);

    // distinctive fragments of at least 3 of the 5 points
    expect(container).toHaveTextContent("Build up gradually.");
    expect(container).toHaveTextContent(
      "up to about 3 or 4 out of 10 that settles within a day is fine",
    );
    expect(container).toHaveTextContent(
      "pain that wakes you at night, or pain that is clearly worse the next morning",
    );
    expect(container).toHaveTextContent("not a substitute for a personal assessment");

    expect(container).toHaveTextContent(
      "see a doctor rather than starting exercises",
    );
  });

  it("compact: renders the h2 and the single-sentence version, no 5-item list", () => {
    const { container } = render(<ExerciseSafetyNote variant="compact" />);

    const wrapper = container.querySelector("[data-safety-note]");
    expect(wrapper).not.toBeNull();
    expect(wrapper?.getAttribute("data-variant")).toBe("compact");

    expect(container.querySelector("h2")?.textContent).toBe(
      "Using these exercises safely",
    );

    expect(container).toHaveTextContent(
      "Build up gradually, expect some mild soreness that settles within a day",
    );
    expect(container).toHaveTextContent(
      "book an assessment if you are unsure or not improving",
    );

    expect(container.querySelectorAll("li")).toHaveLength(0);
    expect(container.querySelector("ul")).toBeNull();
  });

  it("defaults to the compact variant", () => {
    const { container } = render(<ExerciseSafetyNote />);
    expect(
      container.querySelector("[data-safety-note]")?.getAttribute("data-variant"),
    ).toBe("compact");
    expect(container.querySelectorAll("li")).toHaveLength(0);
  });

  it("both variants carry data-safety-note and are ASCII / Latin-1 only", () => {
    for (const variant of ["full", "compact"] as const) {
      const { container } = render(<ExerciseSafetyNote variant={variant} />);
      expect(container.querySelector("[data-safety-note]")).not.toBeNull();
      const text = container.textContent ?? "";
      const offending = [...text].filter((ch) => ch.codePointAt(0)! > 0xff);
      expect(offending, `non-Latin-1 chars in ${variant}: ${offending}`).toEqual(
        [],
      );
    }
  });
});
