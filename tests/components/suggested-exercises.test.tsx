import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { SuggestedExercises } from "@/components/suggested-exercises";
import type { Suggestion } from "@/lib/exercise-suggestions";
import type { Exercise } from "@/lib/site-data";

function makeExercise(overrides: Partial<Exercise> = {}): Exercise {
  return {
    id: "ex-test-1",
    title: "Test Exercise",
    bodyPart: "Knee",
    clinicalArea: "lower_limb",
    tags: ["knee"],
    condition: "Test condition",
    stage: "Early rehab",
    description: "Test description.",
    ...overrides,
  };
}

describe("SuggestedExercises", () => {
  it("renders nothing when there are no suggestions", () => {
    const { container } = render(
      <SuggestedExercises suggestions={[]} onAssign={vi.fn()} assigning={null} />
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("renders each suggestion's title and reason", () => {
    const suggestions: Suggestion[] = [
      { exercise: makeExercise(), reason: "Suggested: matches lower limb", score: 3 },
    ];
    render(<SuggestedExercises suggestions={suggestions} onAssign={vi.fn()} assigning={null} />);
    expect(screen.getByText("Test Exercise")).toBeInTheDocument();
    expect(screen.getByText(/matches lower limb/)).toBeInTheDocument();
  });

  it("calls onAssign with the exercise id when Assign is clicked", async () => {
    const onAssign = vi.fn().mockResolvedValue(undefined);
    const suggestions: Suggestion[] = [
      { exercise: makeExercise({ id: "ex-test-2" }), reason: "Suggested", score: 3 },
    ];
    render(<SuggestedExercises suggestions={suggestions} onAssign={onAssign} assigning={null} />);
    fireEvent.click(screen.getByRole("button", { name: /assign/i }));
    await waitFor(() => expect(onAssign).toHaveBeenCalledWith("ex-test-2"));
  });

  it("disables the Assign button for the exercise currently being assigned", () => {
    const suggestions: Suggestion[] = [
      { exercise: makeExercise({ id: "ex-test-3" }), reason: "Suggested", score: 3 },
    ];
    render(<SuggestedExercises suggestions={suggestions} onAssign={vi.fn()} assigning="ex-test-3" />);
    expect(screen.getByRole("button", { name: /assign/i })).toBeDisabled();
  });
});
