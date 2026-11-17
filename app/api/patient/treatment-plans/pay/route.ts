import { NextResponse } from "next/server";
import { FieldValue } from "@/lib/firebase-admin";
import { resolvePlanAccess } from "@/lib/patient-plan-access";
import { getPaymentRequest, startPackageCheckout } from "@/lib/package-payment";

// "Pay now" from the patient portal, for the patient or a verified carer.
// Reuses the package's payment request (creating one if the admin hasn't),
// so the portal, the /pay link and the webhook all settle the same record.
// Sends no email.

const RETURN_PATHS = new Set(["/patient", "/patient/appointments"]);
const ID_RE = /^[A-Za-z0-9_-]{6,128}$/;

export async function POST(request: Request) {
  let body: { owner?: unknown; packageId?: unknown; returnPath?: unknown };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  }
  const owner = typeof body.owner === "string" ? body.owner : "";
  const packageId = typeof body.packageId === "string" ? body.packageId : "";
  const returnPath = typeof body.returnPath === "string" && RETURN_PATHS.has(body.returnPath) ? body.returnPath : "/patient";
  if (!ID_RE.test(packageId)) return NextResponse.json({ error: "Bad request" }, { status: 400 });

  const access = await resolvePlanAccess(request, owner);
  if (!access.ok) return NextResponse.json({ error: "Unavailable" }, { status: access.status });
  if (!access.managedByPhysio) return NextResponse.json({ error: "Plan not found" }, { status: 404 });
  const { db } = access;

  const pkgRef = db.collection("sessionPackages").doc(packageId);
  const snap = await pkgRef.get();
  const pkg = snap.data();
  if (!snap.exists || !pkg || pkg.ownerUid !== owner || pkg.manual !== true) {
    return NextResponse.json({ error: "Plan not found" }, { status: 404 });
  }
  if (pkg.paymentStatus === "paid") return NextResponse.json({ error: "This plan is already paid." }, { status: 409 });
  if (!(Number(pkg.pricePence) > 0)) return NextResponse.json({ error: "Nothing to pay." }, { status: 400 });

  let token = typeof pkg.paymentRequestId === "string" ? pkg.paymentRequestId : "";
  if (!token) {
    token = crypto.randomUUID().replace(/-/g, "");
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
    await db.collection("paymentRequests").doc(token).set({
      packageId,
      ownerUid: owner,
      status: "open",
      createdBy: `portal:${access.decoded.uid}`,
      createdAt: FieldValue.serverTimestamp(),
    });
    await pkgRef.update({
      paymentRequestId: token,
      paymentUrl: new URL(`/pay/${token}`, siteUrl).toString(),
      ...(pkg.paymentStatus === "link-sent" ? {} : { paymentStatus: "link-ready" }),
      updatedAt: FieldValue.serverTimestamp(),
    });
  }

  const view = await getPaymentRequest(token);
  if (!view || view.status !== "open") return NextResponse.json({ error: "This plan can't be paid right now." }, { status: 400 });
  const result = await startPackageCheckout(view, returnPath);
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 502 });
  return NextResponse.json({ url: result.url });
}
