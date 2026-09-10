import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { BodyChart } from "@/components/body-chart";

describe("BodyChart", () => {
  it("toggles a region on click", () => {
    const onChange = vi.fn();
    render(<BodyChart value={[]} onChange={onChange} />);
    fireEvent.click(screen.getByRole("button", { name: /^neck$/i }));
    expect(onChange).toHaveBeenCalledWith(["neck"]);
  });

  it("deselects a region that is already selected", () => {
    const onChange = vi.fn();
    render(<BodyChart value={["neck"]} onChange={onChange} />);
    fireEvent.click(screen.getByRole("button", { name: /^neck$/i }));
    expect(onChange).toHaveBeenCalledWith([]);
  });

  it("toggles via the keyboard", () => {
    const onChange = vi.fn();
    render(<BodyChart value={[]} onChange={onChange} />);
    fireEvent.keyDown(screen.getByRole("button", { name: /^neck$/i }), { key: "Enter" });
    expect(onChange).toHaveBeenCalledWith(["neck"]);
  });

  it("readOnly regions are not focusable and do not fire onChange", () => {
    const onChange = vi.fn();
    render(<BodyChart value={["neck"]} readOnly onChange={onChange} />);
    const region = screen.getByRole("button", { name: /^neck$/i });
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
    fireEvent.click(screen.getByRole("button", { name: /^neck$/i }));
    expect(onChange).toHaveBeenCalledWith(["neck"]);
  });

  it("front/back toggle changes which regions are shown", () => {
    render(<BodyChart value={[]} onChange={vi.fn()} />);
    // upper back is a back-only region
    expect(screen.queryByRole("button", { name: /upper back/i })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /back view/i }));
    expect(screen.getByRole("button", { name: /upper back/i })).toBeInTheDocument();
  });
});
