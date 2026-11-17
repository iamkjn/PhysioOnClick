import { describe, expect, it } from "vitest";
import { checkNewPassword } from "@/components/set-password-form";

describe("checkNewPassword", () => {
  it("needs at least 8 characters", () => {
    expect(checkNewPassword("short", "short")).toMatch(/at least 8/);
  });
  it("needs both boxes to match", () => {
    expect(checkNewPassword("longenough1", "longenough2")).toMatch(/don't match/);
  });
  it("accepts a matching password of 8+ characters", () => {
    expect(checkNewPassword("longenough1", "longenough1")).toBe("");
  });
});
