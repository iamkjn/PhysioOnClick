import { describe, expect, it } from "vitest";

import { HOME_VISIT_DISTRICTS } from "@/lib/home-visit-area";
import { postTown } from "@/lib/post-town";

describe("postTown", () => {
  it("has a town for every district we visit", () => {
    expect([...HOME_VISIT_DISTRICTS].filter((d) => !postTown(`${d} 1AA`))).toEqual([]);
  });

  it("reads the district however the postcode is typed", () => {
    expect(postTown("g314hs")).toBe("Glasgow");
    expect(postTown("PA1 1AA")).toBe("Paisley");
    expect(postTown("SW1A 1AA")).toBe("");
  });
});
