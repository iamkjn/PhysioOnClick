import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import type { ExerciseBody3DProps } from "@/components/exercise-library/exercise-body-3d";

const { support, track } = vi.hoisted(() => ({ support: { ok: true }, track: vi.fn() }));
vi.mock("@/lib/body-model-loader", () => ({
  canUse3D: () => support.ok,
  loadBodyModel: vi.fn(() => new Promise(() => {})),
}));
vi.mock("@/lib/analytics", () => ({ trackLibraryEvent: (...args: unknown[]) => track(...args) }));
vi.mock("@/components/exercise-library/exercise-body-3d", () => ({
  ExerciseBody3D: ({ corner, onError, main }: ExerciseBody3DProps) => (
    <div data-testid="viewer">
      <span>{main.join(",")}</span>
      {corner}
      <button type="button" onClick={onError}>
        stub error
      </button>
    </div>
  ),
}));

import { ExerciseHeroMedia } from "@/components/exercise-library/exercise-hero-media";

function renderMedia() {
  return render(
    <ExerciseHeroMedia slug="clam-shell" title="Clam Shell" main={["gluteus-medius"]} helpers={[]} view="right">
      <img alt="Clam Shell exercise demonstration" src="/x.png" />
    </ExerciseHeroMedia>
  );
}

beforeEach(() => {
  support.ok = true;
});
afterEach(() => vi.clearAllMocks());

describe("ExerciseHeroMedia", () => {
  it("shows only the picture when the browser can't do 3D", () => {
    support.ok = false;
    renderMedia();
    expect(screen.getByAltText("Clam Shell exercise demonstration")).toBeVisible();
    expect(screen.queryByRole("button", { name: "View in 3D" })).not.toBeInTheDocument();
  });

  it("swaps the picture for the 3D view and logs it", async () => {
    renderMedia();
    fireEvent.click(screen.getByRole("button", { name: "View in 3D" }));
    expect(await screen.findByTestId("viewer")).toBeInTheDocument();
    expect(screen.getByAltText("Clam Shell exercise demonstration")).not.toBeVisible();
    expect(track).toHaveBeenCalledWith("library_3d_view", "clam-shell");
    expect(document.activeElement).toBe(screen.getByRole("button", { name: "Back to picture" }));
  });

  it("goes back to the picture and returns focus to the switch", async () => {
    renderMedia();
    fireEvent.click(screen.getByRole("button", { name: "View in 3D" }));
    await screen.findByTestId("viewer");
    fireEvent.click(screen.getByRole("button", { name: "Back to picture" }));
    expect(screen.queryByTestId("viewer")).not.toBeInTheDocument();
    expect(screen.getByAltText("Clam Shell exercise demonstration")).toBeVisible();
    expect(document.activeElement).toBe(screen.getByRole("button", { name: "View in 3D" }));
  });

  it("falls back to the picture with a note when 3D fails", async () => {
    renderMedia();
    fireEvent.click(screen.getByRole("button", { name: "View in 3D" }));
    await screen.findByTestId("viewer");
    fireEvent.click(screen.getByRole("button", { name: "stub error" }));
    expect(screen.queryByTestId("viewer")).not.toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent("The 3D view couldn't load");
    expect(screen.getByRole("button", { name: "View in 3D" })).toBeInTheDocument();
  });
});
