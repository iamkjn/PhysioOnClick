import { getAdminDb } from "@/lib/firebase-admin";
import { bookServiceFor, isBookServiceId } from "@/lib/cal-services";

export type ReceiptData = {
  invoiceNumber: string;
  paidAt: string;
  amountPence: number;
  service: string;
  serviceLabel: string;
  patientName: string;
  patientEmail: string;
  sessionDate: string | null;
  status: string;
};

export async function getReceiptBySession(sessionId: string): Promise<ReceiptData | null> {
  if (!sessionId) return null;
  const db = getAdminDb();
  if (!db) return null;

  const paySnap = await db
    .collection("payments")
    .where("stripeSessionId", "==", sessionId)
    .limit(1)
    .get();
  if (paySnap.empty) return null;

  const pay = paySnap.docs[0].data() as {
    status?: string;
    invoiceNumber?: string;
    paidAt?: string;
    amountPence?: number;
    service?: string;
    email?: string;
    calBookingUid?: string;
  };
  if (pay.status !== "paid" || !pay.invoiceNumber) return null;

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
      const b = bookSnap.docs[0].data() as { fullName?: string; sessionDate?: unknown };
      patientName = b.fullName ?? "";
      const sd = b.sessionDate;
      if (typeof sd === "string") sessionDate = sd;
      else if (sd && typeof sd === "object" && "toDate" in sd && typeof (sd as { toDate: unknown }).toDate === "function") {
        sessionDate = (sd as { toDate: () => Date }).toDate().toISOString();
      } else if (sd instanceof Date) sessionDate = sd.toISOString();
    }
  }

  return {
    invoiceNumber: pay.invoiceNumber,
    paidAt: pay.paidAt ?? "",
    amountPence: pay.amountPence ?? 0,
    service,
    serviceLabel,
    patientName,
    patientEmail: pay.email ?? "",
    sessionDate,
    status: pay.status,
  };
}
