import { bookServiceFor, isBookServiceId } from "@/lib/cal-services";
import { getAdminDb } from "@/lib/firebase-admin";
import type { BookServiceId } from "@/lib/site-data";

const NEW_PATIENT_DISCOUNT_CODE = "NEW10";
const NEW_PATIENT_DISCOUNT_PERCENT = 10;

export type CheckoutDiscount =
  | {
      ok: true;
      code: string;
      percent: number;
      originalAmountPence: number;
      discountAmountPence: number;
      amountPence: number;
    }
  | { ok: false; error: string };

export function normaliseDiscountCode(code: unknown): string {
  return typeof code === "string" ? code.trim().toUpperCase() : "";
}

async function hasPaidBefore(email: string): Promise<boolean> {
  const db = getAdminDb();
  if (!db) return false;
  const snap = await db
    .collection("payments")
    .where("email", "==", email)
    .limit(25)
    .get();
  return snap.docs.some((doc) => doc.data().status === "paid");
}

export async function validateCheckoutDiscount(input: {
  code: unknown;
  email: string;
  service: BookServiceId;
}): Promise<CheckoutDiscount> {
  const code = normaliseDiscountCode(input.code);
  if (!code) return { ok: false, error: "Enter a discount code first." };
  if (!isBookServiceId(input.service)) return { ok: false, error: "Invalid service." };
  if (code !== NEW_PATIENT_DISCOUNT_CODE) return { ok: false, error: "Discount code not recognised." };
  if (await hasPaidBefore(input.email.toLowerCase())) {
    return { ok: false, error: "This discount code is only for new patients." };
  }

  const originalAmountPence = Math.round(bookServiceFor(input.service).price * 100);
  const discountAmountPence = Math.round(originalAmountPence * (NEW_PATIENT_DISCOUNT_PERCENT / 100));
  return {
    ok: true,
    code,
    percent: NEW_PATIENT_DISCOUNT_PERCENT,
    originalAmountPence,
    discountAmountPence,
    amountPence: Math.max(0, originalAmountPence - discountAmountPence),
  };
}
