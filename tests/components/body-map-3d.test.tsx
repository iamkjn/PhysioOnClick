import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, within } from "@testing-library/react";
import type { BodyChart3DProps } from "@/components/body-chart-3d";

const { support, track, loadBodyModel, chartProps } = vi.hoisted(() => ({
  support: { ok: true },
  track: vi.fn(),
  loadBodyModel: vi.fn(() => new Promise(() => {})),
  chartProps: { last: null as null | { single?: boolean; value: string[] } },
}));
vi.mock("@/lib/body-model-loader", () => ({
  canUse3D: () => support.ok,
  loadBodyModel: () => loadBodyModel(),
}));
vi.mock("@/lib/analytics", () => ({ trackLibraryEvent: (...args: unknown[]) => track(...args) }));
// Stands in for the three.js chart: buttons play the part of taps on the model.
vi.mock("@/components/body-chart-3d", () => ({
  BodyChart3D: ({ value, onChange, onError, single }: BodyChart3DProps) => {
    chartProps.last = { single, value };
    return (
      <div data-testid="chart">
        <span data-testid="chart-value">{value.join(",")}</span>
        {["knee-left", "thigh-right", "chest"].map((key) => (
          <button key={key} type="button" onClick={() => onChange([key])}>
            tap {key}
          </button>
        ))}
        <button type="button" onClick={onError}>
          stub error
        </button>
      </div>
    );
  },
}));

import { BodyMap3D } from "@/components/exercise-library/body-map-3d";

beforeEach(() => {
  support.ok = true;
  chartProps.last = null;
});
afterEach(() => vi.clearAllMocks());

async function openPicker() {
  render(<BodyMap3D />);
  fireEvent.click(screen.getByRole("button", { name: "Pick on a 3D body" }));
  return screen.findByTestId("chart");
}

describe("BodyMap3D", () => {
  it("renders nothing when the browser can't do 3D", () => {
    support.ok = false;
    const { container } = render(<BodyMap3D />);
    expect(container).toBeEmptyDOMElement();
  });

  it("offers the 3D body when supported, closed by default", () => {
    render(<BodyMap3D />);
    const button = screen.getByRole("button", { name: "Pick on a 3D body" });
    expect(button).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByText("Tap where it hurts. Drag to turn the body.")).not.toBeInTheDocument();
  });

  it("opens the chart in single-select mode with the prompt, and logs it", async () => {
    await openPicker();
    expect(screen.getByText("Tap where it hurts. Drag to turn the body.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Hide 3D body" })).toHaveAttribute("aria-expanded", "true");
    expect(chartProps.last?.single).toBe(true);
    expect(track).toHaveBeenCalledWith("library_3d_picker_open", "exercises");
  });

  it("shows the tapped region and its area link, without navigating", async () => {
    await openPicker();
    fireEvent.click(screen.getByRole("button", { name: "tap knee-left" }));
    expect(screen.getByText("Left knee")).toBeInTheDocument();
    const link = screen.getByRole("link", { name: "See knee exercises" });
    expect(link).toHaveAttribute("href", "/exercises/area/knee");
    expect(screen.getByTestId("chart-value")).toHaveTextContent("knee-left");
    fireEvent.click(link);
    expect(track).toHaveBeenCalledWith("library_3d_picker_area_click", "knee");
  });

  it("replaces the selection and lists every covering area", async () => {
    await openPicker();
    fireEvent.click(screen.getByRole("button", { name: "tap knee-left" }));
    fireEvent.click(screen.getByRole("button", { name: "tap thigh-right" }));
    expect(screen.getByTestId("chart-value")).toHaveTextContent(/^thigh-right$/);
    expect(screen.getByText("Right thigh")).toBeInTheDocument();
    expect(screen.queryByText("Left knee")).not.toBeInTheDocument();
    const links = screen.getAllByRole("link");
    expect(links.map((l) => [l.textContent, l.getAttribute("href")])).toEqual([
      ["See hip & groin exercises", "/exercises/area/hip"],
      ["See knee exercises", "/exercises/area/knee"],
    ]);
  });

  it("is honest about regions the library has no set for", async () => {
    await openPicker();
    fireEvent.click(screen.getByRole("button", { name: "tap chest" }));
    expect(screen.getByText("Chest")).toBeInTheDocument();
    expect(screen.getByText(/We don't have a set of exercises for this area yet/)).toBeInTheDocument();
    const links = screen.getAllByRole("link");
    expect(links).toHaveLength(1);
    expect(links[0]).toHaveAttribute("href", "/book");
    expect(screen.queryByRole("link", { name: /^See / })).not.toBeInTheDocument();
  });

  it("closes back to the cards only, keeping focus on the toggle", async () => {
    await openPicker();
    fireEvent.click(screen.getByRole("button", { name: "tap knee-left" }));
    const hide = screen.getByRole("button", { name: "Hide 3D body" });
    hide.focus();
    fireEvent.click(hide);
    expect(screen.queryByTestId("chart")).not.toBeInTheDocument();
    expect(screen.queryByText("Left knee")).not.toBeInTheDocument();
    const show = screen.getByRole("button", { name: "Pick on a 3D body" });
    expect(document.activeElement).toBe(show);
  });

  it("hides the 3D quietly when it fails", async () => {
    await openPicker();
    fireEvent.click(within(screen.getByTestId("chart")).getByRole("button", { name: "stub error" }));
    expect(screen.queryByTestId("chart")).not.toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent("The 3D body couldn't load");
    expect(screen.getByRole("button", { name: "Pick on a 3D body" })).toBeInTheDocument();
  });
});
