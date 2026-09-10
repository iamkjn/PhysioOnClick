import { render, screen, fireEvent, within } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { BodyChart } from "@/components/body-chart";

// "Neck" is on both views; "Upper back & shoulder blades" is back-only.

describe("BodyChart", () => {
  it("toggles a region on click", () => {
    const onChange = vi.fn();
    render(<BodyChart value={[]} onChange={onChange} />);
    fireEvent.click(screen.getByRole("button", { name: "Neck" }));
    expect(onChange).toHaveBeenCalledWith(["neck"]);
  });

  it("deselects a region that is already selected", () => {
    const onChange = vi.fn();
    render(<BodyChart value={["neck"]} onChange={onChange} />);
    fireEvent.click(screen.getByRole("button", { name: "Neck" }));
    expect(onChange).toHaveBeenCalledWith([]);
  });

  it("toggles via the keyboard", () => {
    const onChange = vi.fn();
    render(<BodyChart value={[]} onChange={onChange} />);
    fireEvent.keyDown(screen.getByRole("button", { name: "Neck" }), { key: "Enter" });
    expect(onChange).toHaveBeenCalledWith(["neck"]);
  });

  it("shows a tooltip with the plain and clinical names on hover", () => {
    render(<BodyChart value={[]} onChange={vi.fn()} />);
    fireEvent.mouseEnter(screen.getByRole("button", { name: "Neck" }));
    const tip = screen.getByRole("status");
    expect(within(tip).getByText("Neck")).toBeInTheDocument();
    expect(within(tip).getByText(/cervical spine/i)).toBeInTheDocument();
  });

  it("readOnly regions are not focusable and do not fire onChange", () => {
    const onChange = vi.fn();
    render(<BodyChart value={["neck"]} readOnly onChange={onChange} />);
    const region = screen.getByRole("button", { name: "Neck" });
    expect(region).toHaveAttribute("tabindex", "-1");
    fireEvent.click(region);
    expect(onChange).not.toHaveBeenCalled();
  });

  it("'somewhere else' clears anatomical selections and vice versa", () => {
    const a = vi.fn();
    const { rerender } = render(<BodyChart value={["neck"]} onChange={a} />);
    fireEvent.click(screen.getByRole("button", { name: /somewhere else/i }));
    expect(a).toHaveBeenCalledWith(["somewhere-else"]);

    const b = vi.fn();
    rerender(<BodyChart value={["somewhere-else"]} onChange={b} />);
    fireEvent.click(screen.getByRole("button", { name: "Neck" }));
    expect(b).toHaveBeenCalledWith(["neck"]);
  });

  it("front/back toggle changes which regions are shown", () => {
    render(<BodyChart value={[]} onChange={vi.fn()} />);
    expect(screen.queryByRole("button", { name: /upper back/i })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Back" }));
    expect(screen.getByRole("button", { name: /upper back/i })).toBeInTheDocument();
  });

  it("has a Show bones toggle and renders a skeleton layer", () => {
    const { container } = render(<BodyChart value={[]} onChange={vi.fn()} />);
    expect(container.querySelector(".body-chart__skeleton")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /show bones/i }));
    expect(container.querySelector(".body-chart.show-bones")).toBeInTheDocument();
  });

  it("has front-view hand and foot regions", () => {
    render(<BodyChart value={[]} onChange={vi.fn()} />);
    expect(screen.getByRole("button", { name: /left wrist or hand/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /left ankle or foot/i })).toBeInTheDocument();
  });
});
