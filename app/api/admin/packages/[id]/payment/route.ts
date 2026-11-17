import { NextResponse } from "next/server";
import { FieldValue } from "@/lib/firebase-admin";
import { requireAdminRequest } from "@/lib/admin-request";
import { loadManualPackage, noStore } from "@/lib/admin-packages-server";
import { readCarerContact, readCarerEmails } from "@/lib/carer-access";
import { buildPaymentLinkEmail } from "@/lib/emails/payment-link-email";
import { formatDateRange } from "@/lib/treatment-packages";

// Admin-only payment actions for a physio-arranged package:
//   create-link  make (or return) the /pay/{token} link. Sends NOTHING.
//   send-link    email that link to the patient and their carers.
//   mark-paid    record a payment taken another way (cash, bank transfer).

const PAID_METHODS = ["cash", "bank-transfer", "card-in-person", "other"] as const;

function firstName(name: string): string {
  return name.trim().split(/\s+/)[0] ?? "";
}

function newToken(): string {
  // 32 hex chars from a CSPRNG: the link itself is the access check, like a
  // Stripe hosted-checkout URL.
  return crypto.randomUUID().replace(/-/g, "");
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const gate = await requireAdminRequest(request);
  if ("error" in gate) return gate.error;
  const { id } = await params;

  let body: { action?: unknown; method?: unknown };
  try {
    body = (await request.json()) as { action?: unknown; method?: unknown };
  } catch {
    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  }

  const loaded = await loadManualPackage(id);
  if (!loaded.ok) return loaded.response;
  const { db, data } = loaded;
  const pkgRef = db.collection("sessionPackages").doc(id);
  const price = Number(data.pricePence ?? 0);
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

  if (body.action === "mark-paid") {
    const method = PAID_METHODS.find((m) => m === body.method);
    if (!method) return NextResponse.json({ error: "Choose how it was paid." }, { status: 400 });
    if (data.paymentStatus === "paid") return NextResponse.json({ error: "Already marked as paid." }, { status: 400 });
    const paidAt = new Date().toISOString();
    await pkgRef.update({
      paymentStatus: "paid",
      paidMethod: method,
      paidAt,
      amountPaidPence: price,
      updatedAt: FieldValue.serverTimestamp(),
    });
    if (typeof data.paymentRequestId === "string" && data.paymentRequestId) {
      await db.collection("paymentRequests").doc(data.paymentRequestId).update({ status: "paid", paidAt, paidMethod: method });
    }
    return NextResponse.json({ ok: true, paymentStatus: "paid" }, { headers: noStore });
  }

  if (data.paymentStatus === "paid") return NextResponse.json({ error: "This package is already paid." }, { status: 400 });
  if (!(price > 0)) return NextResponse.json({ error: "Set a price for this package first." }, { status: 400 });

  if (body.action === "create-link") {
    let token = typeof data.paymentRequestId === "string" ? data.paymentRequestId : "";
    if (!token) {
      token = newToken();
      await db.collection("paymentRequests").doc(token).set({
        packageId: id,
        ownerUid: String(data.ownerUid ?? ""),
        status: "open",
        createdBy: gate.decoded.email ?? gate.decoded.uid,
        createdAt: FieldValue.serverTimestamp(),
      });
    }
    const url = new URL(`/pay/${token}`, siteUrl).toString();
    await pkgRef.update({
      paymentRequestId: token,
      paymentUrl: url,
      ...(data.paymentStatus === "link-sent" ? {} : { paymentStatus: "link-ready" }),
      updatedAt: FieldValue.serverTimestamp(),
    });
    return NextResponse.json({ url, paymentStatus: data.paymentStatus === "link-sent" ? "link-sent" : "link-ready" }, { headers: noStore });
  }

  if (body.action === "send-link") {
    const url = typeof data.paymentUrl === "string" ? data.paymentUrl : "";
    if (!url) return NextResponse.json({ error: "Create the payment link first." }, { status: 400 });

    const patientSnap = await db.collection("patients").doc(String(data.ownerUid ?? "")).get();
    const patient = (patientSnap.data() ?? {}) as Record<string, unknown>;
    const patientEmail = typeof patient.email === "string" ? patient.email.trim().toLowerCase() : "";
    const patientName = String(data.patientName || patient.displayName || "");
    const contact = readCarerContact(patient);
    const recipients: { email: string; name: string; patientName?: string }[] = [];
    if (patientEmail) recipients.push({ email: patientEmail, name: firstName(patientName) });
    for (const email of readCarerEmails(patient)) {
      if (email === patientEmail) continue;
      const name = contact && contact.email === email ? firstName(contact.name) : "";
      recipients.push({ email, name, patientName: patientName || undefined });
    }
    if (!recipients.length) return NextResponse.json({ error: "No email address on this record." }, { status: 400 });

    const apiKey = process.env.RESEND_API_KEY;
    const from = process.env.ENQUIRY_EMAIL_FROM || "PhysioOnClick <onboarding@resend.dev>";
    const total = Number(data.totalSessions ?? 0);
    const sessionsLine = `${total} ${data.visitType === "home" ? "home visit" : "video session"}${total === 1 ? "" : "s"}`;
    const datesLine = formatDateRange(String(data.startDate ?? ""), String(data.endDate ?? ""));

    const sent: string[] = [];
    const failed: string[] = [];
    for (const r of recipients) {
      const mail = buildPaymentLinkEmail({
        recipientName: r.name,
        patientName: r.patientName,
        packageTitle: String(data.title ?? "Treatment plan"),
        sessionsLine,
        datesLine,
        amountPence: price,
        payUrl: url,
      });
      try {
        if (!apiKey) {
          if (process.env.NODE_ENV !== "production") {
            console.log(`[dev] payment link for ${r.email}: ${url}`);
            sent.push(r.email);
            continue;
          }
          throw new Error("RESEND_API_KEY not configured");
        }
        const res = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            from,
            to: [r.email],
            reply_to: "hello@physioonclick.co.uk",
            subject: mail.subject,
            html: mail.html,
            text: mail.text,
          }),
        });
        if (!res.ok) throw new Error(`Resend ${res.status}`);
        sent.push(r.email);
      } catch (error) {
        console.error("payment link email failed for one recipient:", error instanceof Error ? error.message : error);
        failed.push(r.email);
      }
    }
    if (sent.length) {
      await pkgRef.update({
        paymentStatus: "link-sent",
        paymentLinkSentAt: new Date().toISOString(),
        paymentLinkSentTo: sent,
        updatedAt: FieldValue.serverTimestamp(),
      });
    }
    return NextResponse.json({ sent, failed }, { status: failed.length && !sent.length ? 502 : 200, headers: noStore });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
