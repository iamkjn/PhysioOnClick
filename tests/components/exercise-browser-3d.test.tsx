import { afterEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import type { ExerciseBody3DProps } from "@/components/exercise-library/exercise-body-3d";

const { track } = vi.hoisted(() => ({ track: vi.fn() }));
vi.mock("@/lib/body-model-loader", () => ({
  canUse3D: () => true,
  loadBodyModel: () => new Promise(() => {}),
}));
vi.mock("@/lib/analytics", () => ({ trackLibraryEvent: (...args: unknown[]) => track(...args) }));
vi.mock("@/components/exercise-library/exercise-body-3d", () => ({
  ExerciseBody3D: ({ main, corner, afterStage }: ExerciseBody3DProps) => (
    <div data-testid="viewer">
      <div data-testid="stage">
        {main.join(",")}
        {corner}
      </div>
      {afterStage}
    </div>
  ),
}));

import { ExerciseBrowser, type BrowserAnatomy } from "@/components/exercise-library/exercise-browser";
import ExerciseLibraryIndexPage from "@/app/exercises/page";
import { canShow3D, visibleAnatomy } from "@/lib/exercise-anatomy";
import { exercises } from "@/lib/exercises";

const [withAnatomy, without] = exercises;
const anatomyBySlug: Record<string, BrowserAnatomy> = {
  [withAnatomy.slug]: { main: ["gluteus-medius"], helpers: [], view: "right" },
};

function renderBrowser() {
  return render(
    <ExerciseBrowser exercises={[withAnatomy, without]} conditionSlugsBySlug={{}} anatomyBySlug={anatomyBySlug} />,
  );
}

function pick(title: string) {
  const row = [...document.querySelectorAll<HTMLButtonElement>(".exlib-browser__row")].find((b) =>
    b.textContent?.includes(title),
  );
  fireEvent.click(row!);
}

afterEach(() => vi.clearAllMocks());

describe("ExerciseBrowser preview 3D switch", () => {
  it("shows 'See in 3D' under the picture for an exercise with anatomy", () => {
    const { container } = renderBrowser();
    const button = screen.getByRole("button", { name: "See in 3D" });
    expect(button).toHaveClass("exlib-hero-media__toggle--below");
    const media = container.querySelector(".exlib-browser__media")!;
    const image = media.querySelector(".exlib-browser__main-image")!;
    expect(image.compareDocumentPosition(button) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it("swaps to 3D with the button under the stage, then back to the picture", async () => {
    renderBrowser();
    fireEvent.click(screen.getByRole("button", { name: "See in 3D" }));
    const viewer = await screen.findByTestId("viewer");
    const back = screen.getByRole("button", { name: "Picture view" });
    expect(screen.getByTestId("stage")).not.toContainElement(back);
    expect(viewer).toContainElement(back);
    expect(track).toHaveBeenCalledWith("library_3d_view", withAnatomy.slug);
    fireEvent.click(back);
    expect(screen.queryByTestId("viewer")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "See in 3D" })).toBeInTheDocument();
  });

  it("shows no switch for an exercise without anatomy", () => {
    renderBrowser();
    pick(without.title);
    expect(screen.queryByRole("button", { name: "See in 3D" })).not.toBeInTheDocument();
    expect(document.querySelector(".exlib-browser__media .exlib-browser__main-image")).not.toBeNull();
  });

  it("resets to the picture when another exercise is chosen", async () => {
    const other = exercises[2];
    render(
      <ExerciseBrowser
        exercises={[withAnatomy, other]}
        conditionSlugsBySlug={{}}
        anatomyBySlug={{ ...anatomyBySlug, [other.slug]: { main: ["quadriceps"], helpers: [], view: "front" } as BrowserAnatomy }}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "See in 3D" }));
    await screen.findByTestId("viewer");
    pick(other.title);
    expect(screen.queryByTestId("viewer")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "See in 3D" })).toBeInTheDocument();
  });
});

describe("library index passes the server-decided anatomy map", () => {
  it("offers 3D in the preview exactly when the exercise page would", () => {
    render(<ExerciseLibraryIndexPage />);
    const first = document.querySelector(".exlib-browser__row-title")!.textContent!;
    const exercise = exercises.find((e) => e.title === first)!;
    const anatomy = visibleAnatomy(exercise.slug);
    const expected = Boolean(anatomy && canShow3D(anatomy));
    expect(Boolean(screen.queryByRole("button", { name: "See in 3D" }))).toBe(expected);
  });
});
