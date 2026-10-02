import { stripLinks } from "@/lib/content-types";
import { guideWebPage, onlinePhysioWebPage } from "@/lib/structured-data";
import { guides } from "@/lib/guides";
import { onlinePhysioPages } from "@/lib/online-physio-pages";

describe("stripLinks", () => {
  it("keeps the label and drops the target", () => {
    expect(stripLinks("See [our pricing](/pricing) and [x](/y/z).")).toBe("See our pricing and x.");
  });
  it("leaves plain text alone", () => {
    expect(stripLinks("No links.")).toBe("No links.");
  });
});

describe("JSON-LD has no link syntax", () => {
  it("guide and landing page graphs", () => {
    for (const g of guides) expect(JSON.stringify(guideWebPage(g, `/guides/${g.slug}`))).not.toContain("](");
    for (const p of onlinePhysioPages) {
      expect(JSON.stringify(onlinePhysioWebPage(p, `/online-physiotherapy-for/${p.slug}`))).not.toContain("](");
    }
  });
});
