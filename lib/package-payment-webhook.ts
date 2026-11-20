// Server-only: settles a paid package payment request (Stripe
// checkout.session.completed with metadata.kind = "package-payment").
// Called by app/api/payments/webhook after signature + idempotency checks.
// No Cal.com booking is made: the physio arranges these visits.
import { FieldValue, type Firestore, type DocumentReference } from "@/lib/firebase-admin";
import { makeInvoiceNumber } from "@/lib/invoice";
import { sendReceiptEmail } from "@/lib/emails/receipt-email";
import { packageDatesLabel, packageServiceLabel } from "@/lib/treatment-packages";

type Session = {
  id: string;
  amount_total?: number;
  currency?: string;
  metadata?: Record<string, string>;
};

export async function settlePackagePayment(db: Firestore, paymentRef: DocumentReference, session: Session) {
  const meta = session.metadata ?? {};
  const token = meta.paymentRequestId ?? "";
  const packageId = meta.packageId ?? "";
  const amountPence = session.amount_total ?? 0;
  const paidAt = new Date().toISOString();
  const invoiceNumber = makeInvoiceNumber(session.id);

  const pkgRef = db.collection("sessionPackages").doc(packageId);
  const pkgSnap = packageId ? await pkgRef.get() : null;
  const pkg = pkgSnap?.exists ? (pkgSnap.data() ?? {}) : null;
  const title = String(pkg?.title ?? "Treatment plan");
  const total = Number(pkg?.totalSessions ?? 0);
  const visitType = pkg?.visitType === "home" ? ("home" as const) : undefined;
  const serviceLabel = packageServiceLabel(title, total, visitType);
  const sessionDateText = packageDatesLabel(String(pkg?.startDate ?? ""), String(pkg?.endDate ?? ""));
  const email = meta.email || String(pkg?.email ?? "");
  const name = meta.name || String(pkg?.patientName ?? "");

  await paymentRef.set({
    provider: "stripe",
    kind: "package-payment",
    stripeSessionId: session.id,
    calBookingUid: "",
    amountPence,
    currency: session.currency ?? "gbp",
    status: pkg ? "paid" : "package_missing",
    email,
    patientName: name,
    service: serviceLabel,
    ...(sessionDateText ? { sessionDateText } : {}),
    packageId,
    paymentRequestId: token,
    invoiceNumber,
    paidAt,
    ...(visitType ? { visitType } : {}),
    createdAt: FieldValue.serverTimestamp(),
  });
  if (!pkg) {
    console.error("Package payment for a missing package — follow up", session.id);
    return;
  }

  await pkgRef.update({
    paymentStatus: "paid",
    paidMethod: "stripe",
    paidAt,
    amountPaidPence: amountPence,
    stripeSessionId: session.id,
    invoiceNumber,
    updatedAt: FieldValue.serverTimestamp(),
  });
  if (token) {
    await db.collection("paymentRequests").doc(token).update({ status: "paid", paidAt, stripeSessionId: session.id });
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  let pdfBytes: Uint8Array | undefined;
  try {
    const { generateInvoicePdf } = await import("@/lib/invoice-pdf");
    const { uploadObject } = await import("@/lib/firebase-admin");
    pdfBytes = await generateInvoicePdf({
      invoiceNumber,
      paidAtISO: paidAt,
      amountPence,
      serviceLabel,
      patientName: name,
      patientEmail: email,
      sessionDateISO: null,
      ...(sessionDateText ? { sessionDateText } : {}),
      ...(visitType ? { visitType } : {}),
    });
    const pdfPath = `invoices/${invoiceNumber}.pdf`;
    const up = await uploadObject(pdfPath, pdfBytes, "application/pdf");
    if (up.ok) await paymentRef.set({ invoicePdfPath: pdfPath }, { merge: true });
  } catch (error) {
    console.error("Package invoice PDF failed (non-blocking)", error);
  }

  if (email) {
    try {
      await sendReceiptEmail({
        to: email,
        patientName: name,
        invoiceNumber,
        serviceLabel,
        amountPence,
        receiptUrl: `${siteUrl}/book/receipt/${session.id}`,
        ...(pdfBytes
          ? { pdf: { filename: `invoice-${invoiceNumber}.pdf`, base64: Buffer.from(pdfBytes).toString("base64") } }
          : {}),
      });
    } catch (error) {
      console.error("Package receipt email failed (non-blocking)", error);
    }
  }
}
