import { describe, expect, it } from "vitest";

import { getSelfTest } from "@/lib/exercise-library";
import { generateSelfTestOgSvg } from "@/lib/exercise-library-svg";

describe("generateSelfTestOgSvg", () => {
  const test = getSelfTest("full-can-test")!;

  it("returns a 1200x630 SVG string with the self-check eyebrow and the test name", () => {
    const svg = generateSelfTestOgSvg(test);
    expect(svg.startsWith("<svg")).toBe(true);
    expect(svg).toContain("1200");
    expect(svg).toContain("630");
    expect(svg.toUpperCase()).toContain("SELF-CHECK TEST");
    expect(svg).toContain("Full Can Test");
  });

  it("XML-escapes every interpolated string (no raw markup leaks through)", () => {
    const svg = generateSelfTestOgSvg({
      ...test,
      name: 'A <b> & "C" test',
      assesses: "x < y & z",
    });
    expect(svg).not.toContain("<b>");
    expect(svg).toContain("&lt;b&gt;");
    expect(svg).toContain("&amp;");
  });
});
