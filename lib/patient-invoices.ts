import { getAdminDb } from "@/lib/firebase-admin";
import { bookServiceFor, isBookServiceId } from "@/lib/cal-services";

export type PatientInvoice = {
  invoiceNumber: string;
  paidAt: string;
  amountPence: number;
  service: string;
  serviceLabel: string;
  /** Name of the member (self or dependent) the session was booked for. */
  patientName: string;
  sessionDate: string | null;
  hasPdf: boolean;
};

function toISO(sd: unknown): string | null {
  if (typeof sd === "string") return sd;
  if (sd && typeof sd === "object" && "toDate" in sd && typeof (sd as { toDate: unknown }).toDate === "function") {
    return (sd as { toDate: () => Date }).toDate().toISOString();
  }
  if (sd instanceof Date) return sd.toISOString();
  return null;
}

/**
 * All paid invoices belonging to an account holder — which naturally spans
 * every member (self + dependents), because dependent bookings are paid under
 * the account holder's email. Each invoice is joined to its booking so the row
 * can be attributed to the specific member the session was for.
 *
 * Runs with the Admin SDK (clients can't read `payments` directly — see
 * firestore.rules), so callers MUST verify the requester owns this email first.
 */
export async function getInvoicesForEmail(email: string): Promise<PatientInvoice[]> {
  if (!email) return [];
  const db = getAdminDb();
  if (!db) return [];

  const snap = await db
    .collection("payments")
    .where("email", "==", email)
    .where("status", "==", "paid")
    .get();
  if (snap.empty) return [];

  const invoices = await Promise.all(
    snap.docs.map(async (docSnap) => {
      const pay = docSnap.data() as {
        invoiceNumber?: string;
        paidAt?: string;
        amountPence?: number;
        service?: string;
        calBookingUid?: string;
        invoicePdfPath?: string;
      };
      if (!pay.invoiceNumber) return null;

      const service = pay.service ?? "";
      const serviceLabel = isBookServiceId(service) ? bookServiceFor(service).title : service;

      let patientName = "";
      let sessionDate: string | null = null;
      if (pay.calBookingUid) {
        const bookSnap = await db
          .collection("bookings")
          .where("calBookingUid", "==", pay.calBookingUid)
          .limit(1)
          .get();
        if (!bookSnap.empty) {
          const b = bookSnap.docs[0].data() as { patientName?: string; fullName?: string; sessionDate?: unknown };
          patientName = b.patientName || b.fullName || "";
          sessionDate = toISO(b.sessionDate);
        }
      }

      return {
        invoiceNumber: pay.invoiceNumber,
        paidAt: pay.paidAt ?? "",
        amountPence: pay.amountPence ?? 0,
        service,
        serviceLabel,
        patientName: patientName || "You",
        sessionDate,
        hasPdf: !!pay.invoicePdfPath,
      } satisfies PatientInvoice;
    })
  );

  return invoices
    .filter((i): i is PatientInvoice => i !== null)
    .sort((a, b) => (b.paidAt || "").localeCompare(a.paidAt || ""));
}
