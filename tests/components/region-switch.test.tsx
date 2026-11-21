import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

let region: "uk" | "overseas" | "unknown" = "unknown";
vi.mock("@/lib/visitor-region", () => ({ browserRegion: () => region }));

import { RegionSwitch } from "@/components/region-switch";

describe("RegionSwitch", () => {
  beforeEach(() => {
    region = "unknown";
  });

  it("shows the UK version to UK visitors", () => {
    region = "uk";
    render(<RegionSwitch fallback={<p>default</p>} uk={<p>uk offer</p>} overseas={<p>overseas note</p>} />);
    expect(screen.getByText("uk offer")).toBeInTheDocument();
  });

  it("shows the overseas version to everyone else", () => {
    region = "overseas";
    render(<RegionSwitch fallback={<p>default</p>} uk={<p>uk offer</p>} overseas={<p>overseas note</p>} />);
    expect(screen.getByText("overseas note")).toBeInTheDocument();
  });

  it("keeps the default when the region is unknown, or when a region has no version of its own", () => {
    render(<RegionSwitch fallback={<p>default</p>} uk={<p>uk offer</p>} />);
    expect(screen.getByText("default")).toBeInTheDocument();
    region = "overseas";
    render(<RegionSwitch fallback={<p>default 2</p>} uk={<p>uk offer</p>} />);
    expect(screen.getByText("default 2")).toBeInTheDocument();
  });

  it("can hide something for one region", () => {
    region = "overseas";
    const { container } = render(<RegionSwitch fallback={<a href="/book">Book</a>} overseas={null} />);
    expect(container).toBeEmptyDOMElement();
  });
});
