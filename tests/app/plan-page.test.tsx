import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import PlanPage, { metadata } from "@/app/plan/page";
import { formatPounds, homeVisitPricePence } from "@/lib/home-visit-pricing";

// /plan is the fridge-magnet QR target: the patient's exercises and next
// visit first, then a pitch for whoever spots the magnet.
describe("/plan (fridge magnet QR page)", () => {
  it("is kept out of search", () => {
    expect(metadata.robots).toMatchObject({ index: false });
  });

  it("sends the patient to their exercises and to book their next visit", () => {
    const { container } = render(<PlanPage />);
    expect(container.querySelector('a[href="/patient/exercises"]')?.textContent).toBe("Open my exercises");
    const books = [...container.querySelectorAll('a[href="/book?visit=home"]')].map((a) => a.textContent);
    expect(books).toEqual(["Book my next visit", "Book a home visit"]);
  });

  it("pitches evenings, weekends, family and the all-in price to a newcomer", () => {
    const text = render(<PlanPage />).container.textContent ?? "";
    expect(text).toContain("Saw this on a friend’s fridge?");
    expect(text).toContain("on weekday evenings from 6pm to 9pm, and on Saturdays and Sundays from 9am to 7pm");
    expect(text).toContain("Family members or carers are welcome to join");
    expect(text).toContain(`Home assessment ${formatPounds(homeVisitPricePence("initial-assessment"))}, all in`);
    expect(text).not.toMatch(/travel fee/i);
  });
});

describe("IndexNow key file", () => {
  it("is one public/<key>.txt whose contents are its own name", () => {
    const dir = join(process.cwd(), "public");
    const files = readdirSync(dir).filter((f) => /^[0-9a-f]{32}\.txt$/.test(f));
    expect(files).toHaveLength(1);
    expect(readFileSync(join(dir, files[0]), "utf8").trim()).toBe(files[0].replace(".txt", ""));
  });
});
