import { afterEach, beforeEach, describe, it, expect, vi } from "vitest";
import { canUse3D, resetBodyModelForTests } from "@/lib/body-model-loader";

beforeEach(() => {
  resetBodyModelForTests();
  vi.stubGlobal("DecompressionStream", class {});
});
afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("canUse3D", () => {
  it("is false without WebGL", () => {
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(null as never);
    expect(canUse3D()).toBe(false);
  });

  it("is true with WebGL", () => {
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue({} as never);
    expect(canUse3D()).toBe(true);
  });

  it("is false when the browser asks to save data", () => {
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue({} as never);
    vi.stubGlobal("navigator", { connection: { saveData: true } });
    expect(canUse3D()).toBe(false);
  });

  it("is false without DecompressionStream", () => {
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue({} as never);
    vi.stubGlobal("DecompressionStream", undefined);
    expect(canUse3D()).toBe(false);
  });
});
