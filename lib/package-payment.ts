// Server-only: the public view of a package payment request (/pay/{token}).
// The token is a 32-hex CSPRNG id and is the only access check, the same trust
// model as a Stripe hosted-checkout or receipt URL. Only what the payer needs
// to see is returned: first name, plan, sessions, dates and amount.
import { getAdminDb } from "@/lib/firebase-admin";
import { formatDateRange } from "@/lib/treatment-packages";
import { createStripeCheckout } from "@/lib/payments/stripe";

export const PAY_TOKEN_RE = /^[a-f0-9]{32}$/;

export type PaymentRequestView = {
  token: string;
  packageId: string;
  firstName: string;
  patientName: string;
  email: string;
  title: string;
  totalSessions: number;
  visitType: "home" | "video";
  datesLine: string;
  amountPence: number;
  status: "open" | "paid" | "unavailable";
};

export async function getPaymentRequest(token: string): Promise<PaymentRequestView | null> {
  if (!PAY_TOKEN_RE.test(token)) return null;
  const db = getAdminDb();
  if (!db) return null;
  const reqSnap = await db.collection("paymentRequests").doc(token).get();
  if (!reqSnap.exists) return null;
  const req = reqSnap.data() ?? {};
  const packageId = typeof req.packageId === "string" ? req.packageId : "";
  if (!packageId) return null;
  const pkgSnap = await db.collection("sessionPackages").doc(packageId).get();
  if (!pkgSnap.exists) return null;
  const pkg = pkgSnap.data() ?? {};
  // A link only belongs to the package that issued it; a replaced link is dead.
  if (pkg.paymentRequestId !== token) return null;

  const patientName = String(pkg.patientName ?? "").trim();
  const amountPence = Number(pkg.pricePence ?? 0);
  const status =
    req.status === "paid" || pkg.paymentStatus === "paid"
      ? "paid"
      : amountPence > 0
        ? "open"
        : "unavailable";
  return {
    token,
    packageId,
    firstName: patientName.split(/\s+/)[0] ?? "",
    patientName,
    email: String(pkg.email ?? ""),
    title: String(pkg.title ?? "Treatment plan"),
    totalSessions: Number(pkg.totalSessions ?? 0),
    visitType: pkg.visitType === "home" ? "home" : "video",
    datesLine: formatDateRange(String(pkg.startDate ?? ""), String(pkg.endDate ?? "")),
    amountPence,
    status,
  };
}

/**
 * Starts a fresh Stripe Checkout for an open package payment request. The
 * amount always comes from the package doc. `returnPath` is where Stripe sends
 * the payer back (the /pay page, or the patient portal).
 */
export async function startPackageCheckout(
  view: PaymentRequestView,
  returnPath = `/pay/${view.token}`,
): Promise<{ ok: true; url: string } | { ok: false; error: string }> {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const back = new URL(returnPath, siteUrl);
  const success = new URL(back);
  success.searchParams.set("paid", "1");
  const sessionsLabel = `${view.totalSessions} ${view.visitType === "home" ? "home visit" : "video session"}${view.totalSessions === 1 ? "" : "s"}`;
  const result = await createStripeCheckout({
    intent: {
      // Required by the shared BookingIntent shape; unused for a package payment.
      service: "follow-up",
      startISO: "",
      name: view.patientName,
      email: view.email,
      timeZone: "Europe/London",
      visitType: view.visitType,
    },
    amountPence: view.amountPence,
    serviceLabel: `${view.title} (${sessionsLabel})`,
    successUrl: success.toString(),
    cancelUrl: back.toString(),
    metadataOverride: {
      kind: "package-payment",
      paymentRequestId: view.token,
      packageId: view.packageId,
      name: view.patientName,
      email: view.email,
    },
  });
  return result.ok ? { ok: true, url: result.url } : { ok: false, error: result.error };
}
