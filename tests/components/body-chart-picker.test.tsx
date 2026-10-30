import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, it, expect, vi } from "vitest";

vi.mock("@/lib/body-model-loader", () => ({ canUse3D: vi.fn(() => true) }));
vi.mock("@/components/body-chart-3d", () => ({
  BodyChart3D: ({ onReady, onError }: { onReady?: () => void; onError?: () => void }) => (
    <div data-testid="chart-3d">
      <button type="button" onClick={() => onReady?.()}>
        stub ready
      </button>
      <button type="button" onClick={() => onError?.()}>
        stub error
      </button>
    </div>
  ),
}));

import { canUse3D } from "@/lib/body-model-loader";
import { BodyChartPicker, LOAD_TIMEOUT_MS } from "@/components/body-chart-picker";

const flatChart = () => screen.queryByRole("group", { name: /body chart, front view/i });

beforeEach(() => {
  vi.mocked(canUse3D).mockReturnValue(true);
  sessionStorage.clear();
});
afterEach(() => {
  vi.useRealTimers();
});

describe("BodyChartPicker", () => {
  it("shows the flat chart when 3D isn't supported", () => {
    vi.mocked(canUse3D).mockReturnValue(false);
    render(<BodyChartPicker value={[]} onChange={vi.fn()} />);
    expect(flatChart()).toBeInTheDocument();
    expect(screen.queryByTestId("chart-3d")).not.toBeInTheDocument();
  });

  it("shows the 3D chart when supported", () => {
    render(<BodyChartPicker value={[]} onChange={vi.fn()} />);
    expect(screen.getByTestId("chart-3d")).toBeInTheDocument();
    expect(flatChart()).not.toBeInTheDocument();
  });

  it("falls back to the flat chart if the 3D chart fails", () => {
    render(<BodyChartPicker value={[]} onChange={vi.fn()} />);
    fireEvent.click(screen.getByRole("button", { name: "stub error" }));
    expect(flatChart()).toBeInTheDocument();
  });

  it("falls back to the flat chart if 3D isn't ready in time", () => {
    vi.useFakeTimers();
    render(<BodyChartPicker value={[]} onChange={vi.fn()} />);
    act(() => {
      vi.advanceTimersByTime(LOAD_TIMEOUT_MS);
    });
    expect(flatChart()).toBeInTheDocument();
  });

  it("keeps the 3D chart once it is ready, even after the timeout", () => {
    vi.useFakeTimers();
    render(<BodyChartPicker value={[]} onChange={vi.fn()} />);
    fireEvent.click(screen.getByRole("button", { name: "stub ready" }));
    act(() => {
      vi.advanceTimersByTime(LOAD_TIMEOUT_MS * 2);
    });
    expect(screen.getByTestId("chart-3d")).toBeInTheDocument();
  });

  it("switches to the simple chart on request and stays there", () => {
    render(<BodyChartPicker value={["neck"]} onChange={vi.fn()} />);
    fireEvent.click(screen.getByRole("button", { name: /use simple chart instead/i }));
    expect(flatChart()).toBeInTheDocument();
    expect(screen.queryByTestId("chart-3d")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /use simple chart instead/i })).not.toBeInTheDocument();
  });

  it("passes selections through from the flat chart", () => {
    vi.mocked(canUse3D).mockReturnValue(false);
    const onChange = vi.fn();
    render(<BodyChartPicker value={[]} onChange={onChange} />);
    fireEvent.click(screen.getByRole("button", { name: "Neck" }));
    expect(onChange).toHaveBeenCalledWith(["neck"]);
  });

  it("moves keyboard focus to the flat chart when the patient asks for it", () => {
    render(<BodyChartPicker value={[]} onChange={vi.fn()} />);
    fireEvent.click(screen.getByRole("button", { name: /use simple chart instead/i }));
    expect(document.activeElement).toBe(screen.getByRole("button", { name: "Front" }));
  });

  it("does not steal focus when it falls back on its own", () => {
    render(<BodyChartPicker value={[]} onChange={vi.fn()} />);
    fireEvent.click(screen.getByRole("button", { name: "stub error" }));
    expect(flatChart()).toBeInTheDocument();
    expect(document.activeElement).not.toBe(screen.getByRole("button", { name: "Front" }));
  });

  it("remembers the simple chart for the rest of the session", () => {
    const { unmount } = render(<BodyChartPicker value={[]} onChange={vi.fn()} />);
    fireEvent.click(screen.getByRole("button", { name: /use simple chart instead/i }));
    unmount();
    render(<BodyChartPicker value={[]} onChange={vi.fn()} />);
    expect(flatChart()).toBeInTheDocument();
    expect(screen.queryByTestId("chart-3d")).not.toBeInTheDocument();
  });

  it("remembers an automatic fallback too", () => {
    const { unmount } = render(<BodyChartPicker value={[]} onChange={vi.fn()} />);
    fireEvent.click(screen.getByRole("button", { name: "stub error" }));
    unmount();
    render(<BodyChartPicker value={[]} onChange={vi.fn()} />);
    expect(flatChart()).toBeInTheDocument();
  });
});
