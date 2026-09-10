import { render, screen, fireEvent, within } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { BodyChart } from "@/components/body-chart";

// "Neck" is a front-only region, "Upper back" is back-only, "Shoulder" is both.

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
    expect(within(tip).getByText("Cervical spine")).toBeInTheDocument();
  });

  it("readOnly regions are not focusable and do not fire onChange", () => {
    const onChange = vi.fn();
    render(<BodyChart value={["neck"]} readOnly onChange={onChange} />);
    const region = screen.getByRole("button", { name: "Neck" });
    expect(region).toHaveAttribute("tabindex", "-1");
    fireEvent.click(region);
    expect(onChange).not.toHaveBeenCalled();
  });

  it("'somewhere else' clears anatomical selections", () => {
    const onChange = vi.fn();
    render(<BodyChart value={["neck"]} onChange={onChange} />);
    fireEvent.click(screen.getByRole("button", { name: /somewhere else/i }));
    expect(onChange).toHaveBeenCalledWith(["somewhere-else"]);
  });

  it("picking an anatomical region clears 'somewhere else'", () => {
    const onChange = vi.fn();
    render(<BodyChart value={["somewhere-else"]} onChange={onChange} />);
    fireEvent.click(screen.getByRole("button", { name: "Neck" }));
    expect(onChange).toHaveBeenCalledWith(["neck"]);
  });

  it("front/back toggle changes which regions are shown", () => {
    render(<BodyChart value={[]} onChange={vi.fn()} />);
    expect(screen.queryByRole("button", { name: "Upper back" })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Back" }));
    expect(screen.getByRole("button", { name: "Upper back" })).toBeInTheDocument();
  });

  it("offers wrist/hand and ankle/foot as chips", () => {
    const onChange = vi.fn();
    render(<BodyChart value={[]} onChange={onChange} />);
    fireEvent.click(screen.getByRole("button", { name: /wrist or hand/i }));
    expect(onChange).toHaveBeenCalledWith(["wrist-hand"]);
  });
});
