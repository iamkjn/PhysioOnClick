import crypto from "node:crypto";
import { describe, expect, it } from "vitest";
import { verifyStripeSignature } from "@/lib/payments/stripe";

const SECRET = "whsec_test";
const BODY = JSON.stringify({ id: "evt_1", type: "checkout.session.completed" });

function sign(body: string, ts: number, secret: string): string {
  const v1 = crypto.createHmac("sha256", secret).update(`${ts}.${body}`).digest("hex");
  return `t=${ts},v1=${v1}`;
}

describe("verifyStripeSignature", () => {
  it("accepts a correctly signed payload", () => {
    const header = sign(BODY, Math.floor(Date.now() / 1000), SECRET);
    expect(verifyStripeSignature(BODY, header, SECRET)).toBe(true);
  });

  it("rejects a tampered body", () => {
    const header = sign(BODY, Math.floor(Date.now() / 1000), SECRET);
    expect(verifyStripeSignature(BODY + "x", header, SECRET)).toBe(false);
  });

  it("rejects a wrong secret", () => {
    const header = sign(BODY, Math.floor(Date.now() / 1000), SECRET);
    expect(verifyStripeSignature(BODY, header, "whsec_other")).toBe(false);
  });

  it("rejects a malformed header", () => {
    expect(verifyStripeSignature(BODY, "garbage", SECRET)).toBe(false);
  });
});
