import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";

// vi.mock factories are hoisted above everything, so shared mocks come from vi.hoisted.
const { stage, created, loadBodyModel, loadAnatomyAddon } = vi.hoisted(() => ({
  stage: { setView: vi.fn(), setWholeBody: vi.fn(), dispose: vi.fn() },
  created: { handlers: null as null | { onTap(label: string | null): void; onContextLost(): void; onRotate(): void }, sources: 0 },
  loadBodyModel: vi.fn(),
  loadAnatomyAddon: vi.fn(),
}));

vi.mock("three", () => ({}));
vi.mock("three/examples/jsm/controls/OrbitControls.js", () => ({ OrbitControls: class {} }));
vi.mock("@/components/exercise-library/exercise-body-3d-stage", () => ({
  createAnatomyStage: vi.fn((_t: unknown, _o: unknown, _h: unknown, sources: unknown[], _opts: unknown, handlers: { onTap(label: string | null): void; onContextLost(): void; onRotate(): void }) => {
    created.handlers = handlers;
    created.sources = sources.length;
    return stage;
  }),
}));
vi.mock("@/lib/body-model-loader", () => ({
  loadBodyModel: () => loadBodyModel(),
  onBodyModelProgress: () => () => {},
}));
vi.mock("@/lib/exercise-anatomy/addon-loader", () => ({ loadAnatomyAddon: () => loadAnatomyAddon() }));

import { ExerciseBody3D } from "@/components/exercise-library/exercise-body-3d";

beforeEach(() => {
  created.handlers = null;
  created.sources = 0;
  loadBodyModel.mockResolvedValue({ manifest: {}, chunks: [] });
  loadAnatomyAddon.mockResolvedValue({ manifest: {}, chunks: [] });
});
afterEach(() => vi.clearAllMocks());

describe("ExerciseBody3D", () => {
  it("loads, then shows the controls, legend and stand-in note", async () => {
    render(<ExerciseBody3D title="Bird Dog" main={["multifidus"]} helpers={["gluteus-maximus"]} view="back" onError={vi.fn()} />);
    expect(screen.getByText("Loading the 3D body…")).toBeInTheDocument();
    await waitFor(() => expect(screen.getByRole("button", { name: "Back view" })).toBeEnabled());
    expect(screen.getByText("Main focus")).toBeInTheDocument();
    expect(screen.getByText("Helpers")).toBeInTheDocument();
    expect(screen.getByText(/Multifidus isn't in the 3D model/)).toBeInTheDocument();
    expect(screen.getByRole("img", { name: /Multifidus as the main focus/ })).toBeInTheDocument();
    expect(created.sources).toBe(1);
    expect(loadAnatomyAddon).not.toHaveBeenCalled();
  });

  it("keeps the corner button outside the image role", async () => {
    render(
      <ExerciseBody3D
        title="Clam"
        main={["gluteus-medius"]}
        helpers={[]}
        view="right"
        corner={<button type="button">Back to picture</button>}
        onError={vi.fn()}
      />,
    );
    await waitFor(() => expect(screen.getByRole("button", { name: "Back view" })).toBeEnabled());
    const corner = screen.getByRole("button", { name: "Back to picture" });
    expect(corner).toBeInTheDocument();
    expect(screen.getByRole("img").contains(corner)).toBe(false);
  });

  it("loads the add-on when a muscle lives there", async () => {
    render(<ExerciseBody3D title="Kegel" main={["pelvic-floor"]} helpers={[]} view="front" onError={vi.fn()} />);
    await waitFor(() => expect(created.sources).toBe(2));
    expect(screen.queryByText("Helpers")).not.toBeInTheDocument();
  });

  it("turns the body, zooms out and names a tapped part", async () => {
    render(<ExerciseBody3D title="Clam" main={["gluteus-medius"]} helpers={[]} view="right" onError={vi.fn()} />);
    await waitFor(() => expect(screen.getByRole("button", { name: "Back view" })).toBeEnabled());
    fireEvent.click(screen.getByRole("button", { name: "Back view" }));
    expect(stage.setView).toHaveBeenCalledWith("back");
    fireEvent.click(screen.getByRole("button", { name: "Whole body" }));
    expect(stage.setWholeBody).toHaveBeenCalledWith(true);
    expect(screen.getByRole("button", { name: "Close-up" })).toBeInTheDocument();
    act(() => created.handlers!.onTap("Gluteus medius: side of your hip (main focus)"));
    expect(screen.getByText("Gluteus medius: side of your hip (main focus)")).toBeInTheDocument();
  });

  it("reports a failed download", async () => {
    loadBodyModel.mockRejectedValue(new Error("offline"));
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
    const onError = vi.fn();
    render(<ExerciseBody3D title="Clam" main={["gluteus-medius"]} helpers={[]} view="right" onError={onError} />);
    await waitFor(() => expect(onError).toHaveBeenCalled());
    consoleError.mockRestore();
  });

  it("never builds the scene if it unmounts before the model arrives", async () => {
    let resolve!: (model: unknown) => void;
    loadBodyModel.mockReturnValue(new Promise((r) => { resolve = r; }));
    const { unmount } = render(<ExerciseBody3D title="Clam" main={["gluteus-medius"]} helpers={[]} view="right" onError={vi.fn()} />);
    unmount();
    resolve({ manifest: {}, chunks: [] });
    await new Promise((r) => setTimeout(r, 50));
    expect(created.handlers).toBeNull();
    expect(stage.dispose).not.toHaveBeenCalled();
  });

  it("reports a lost WebGL context", async () => {
    const onError = vi.fn();
    render(<ExerciseBody3D title="Clam" main={["gluteus-medius"]} helpers={[]} view="right" onError={onError} />);
    await waitFor(() => expect(created.handlers).not.toBeNull());
    act(() => created.handlers!.onContextLost());
    expect(onError).toHaveBeenCalled();
  });

  it("disposes the scene when it unmounts", async () => {
    const { unmount } = render(<ExerciseBody3D title="Clam" main={["gluteus-medius"]} helpers={[]} view="right" onError={vi.fn()} />);
    await waitFor(() => expect(screen.getByRole("button", { name: "Back view" })).toBeEnabled());
    unmount();
    expect(stage.dispose).toHaveBeenCalled();
  });
});
