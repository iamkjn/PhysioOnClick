import { afterEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";

// The 3D viewer chunk can't be downloaded: a throwing factory makes the
// component's import() reject, exactly like a network failure would.
vi.mock("@/lib/body-model-loader", () => ({
  canUse3D: () => true,
  loadBodyModel: vi.fn(() => new Promise(() => {})),
}));
vi.mock("@/lib/analytics", () => ({ trackLibraryEvent: vi.fn() }));
vi.mock("@/components/exercise-library/exercise-body-3d", () => {
  throw new Error("chunk failed to load");
});

import { ExerciseHeroMedia } from "@/components/exercise-library/exercise-hero-media";

function renderMedia() {
  return render(
    <ExerciseHeroMedia slug="clam-shell" title="Clam Shell" main={["gluteus-medius"]} helpers={[]} view="right">
      <div data-testid="picture" />
    </ExerciseHeroMedia>
  );
}

afterEach(() => vi.clearAllMocks());

describe("ExerciseHeroMedia when the 3D viewer chunk fails to download", () => {
  it("reports it while 3D is open", async () => {
    renderMedia();
    fireEvent.click(screen.getByRole("button", { name: "View in 3D" }));
    await waitFor(() => expect(screen.getByRole("status")).toHaveTextContent("The 3D view couldn't load"));
    expect(screen.getByRole("button", { name: "View in 3D" })).toBeInTheDocument();
  });

  it("stays quiet if the patient already went back to the picture", async () => {
    renderMedia();
    fireEvent.click(screen.getByRole("button", { name: "View in 3D" }));
    fireEvent.click(screen.getByRole("button", { name: "Back to picture" }));
    await new Promise((r) => setTimeout(r, 50));
    expect(screen.queryByText(/couldn.t load/)).not.toBeInTheDocument();
    expect(screen.getByTestId("picture")).toBeVisible();
  });
});
