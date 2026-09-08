import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  getPlan,
  addToPlan,
  removeFromPlan,
  onPlanChange,
} from "@/lib/exercise-plan-store";

const KEY = "pooc:exercise-plan";

beforeEach(() => {
  try {
    window.localStorage.clear();
  } catch {
    /* ignore */
  }
});

afterEach(() => {
  // vitest `clearMocks` clears calls but not implementations — restore spies so a
  // throwing `getItem` stub cannot leak into the next test.
  vi.restoreAllMocks();
});

describe("getPlan", () => {
  it("returns [] when localStorage.getItem throws (private window / blocked)", () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("storage disabled");
    });
    expect(getPlan()).toEqual([]);
  });

  it("returns [] when the stored value is not valid JSON", () => {
    window.localStorage.setItem(KEY, "{ not json");
    expect(getPlan()).toEqual([]);
  });

  it("returns [] when the stored JSON is not an array", () => {
    window.localStorage.setItem(KEY, JSON.stringify({ slug: "clam-shell" }));
    expect(getPlan()).toEqual([]);
  });

  it("returns [] when there is nothing stored", () => {
    expect(getPlan()).toEqual([]);
  });

  it("returns the stored slug array", () => {
    window.localStorage.setItem(KEY, JSON.stringify(["clam-shell", "glute-bridge"]));
    expect(getPlan()).toEqual(["clam-shell", "glute-bridge"]);
  });
});

describe("addToPlan / removeFromPlan", () => {
  it("addToPlan persists the slug and returns the new array", () => {
    expect(addToPlan("clam-shell")).toEqual(["clam-shell"]);
    expect(getPlan()).toEqual(["clam-shell"]);
  });

  it("addToPlan dedupes an already-present slug", () => {
    addToPlan("clam-shell");
    expect(addToPlan("clam-shell")).toEqual(["clam-shell"]);
    expect(getPlan()).toEqual(["clam-shell"]);
  });

  it("removeFromPlan drops the slug and returns the new array", () => {
    addToPlan("clam-shell");
    addToPlan("glute-bridge");
    expect(removeFromPlan("clam-shell")).toEqual(["glute-bridge"]);
    expect(getPlan()).toEqual(["glute-bridge"]);
  });

  it("removeFromPlan on an absent slug is a no-op", () => {
    addToPlan("clam-shell");
    expect(removeFromPlan("not-there")).toEqual(["clam-shell"]);
  });
});

describe("onPlanChange", () => {
  it("fires the callback with the new array after addToPlan, and unsubscribes cleanly", () => {
    const cb = vi.fn();
    const off = onPlanChange(cb);

    addToPlan("clam-shell");
    expect(cb).toHaveBeenCalledWith(["clam-shell"]);

    off();
    addToPlan("glute-bridge");
    expect(cb).toHaveBeenCalledTimes(1);
  });

  it("also responds to a cross-tab `storage` event", () => {
    const cb = vi.fn();
    const off = onPlanChange(cb);

    window.localStorage.setItem(KEY, JSON.stringify(["side-plank"]));
    window.dispatchEvent(new StorageEvent("storage", { key: KEY }));
    expect(cb).toHaveBeenCalledWith(["side-plank"]);

    off();
  });
});
