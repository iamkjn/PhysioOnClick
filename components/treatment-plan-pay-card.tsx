// components/treatment-plan-pay-card.tsx
"use client";

import { useEffect, useState } from "react";
import { auth } from "@/lib/firebase";
import { formatPounds } from "@/lib/home-visit-pricing";

type Plan = {
  id: string;
  title: string;
  visitType: "home" | "video";
  totalSessions: number;
  usedSessions: number;
  datesLine: string;
  amountPence: number;
  paid: boolean;
};

interface Props {
  /** Whose plans: the signed-in patient, or the patient a carer is helping. */
  ownerUid: string;
  /** Where Stripe returns to after paying. */
  returnPath: "/patient" | "/patient/appointments";
}

// Physio-arranged treatment plan with a price: shows the total and a
// "Pay now" button (Stripe, card / Apple Pay / Google Pay). The patient or any
// carer on their record can pay. Renders nothing when there's no priced plan.
export function TreatmentPlanPayCard({ ownerUid, returnPath }: Props) {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [justPaid, setJustPaid] = useState(false);
  const [reload, setReload] = useState(0);

  useEffect(() => {
    if (new URLSearchParams(window.location.search).get("paid") === "1") {
      setJustPaid(true);
      // The webhook usually lands within seconds; refresh once it has.
      const t = setTimeout(() => setReload((n) => n + 1), 5000);
      return () => clearTimeout(t);
    }
  }, []);

  useEffect(() => {
    let live = true;
    const user = auth?.currentUser;
    if (!user || !ownerUid) return;
    user
      .getIdToken()
      .then((token) =>
        fetch(`/api/patient/treatment-plans?owner=${encodeURIComponent(ownerUid)}`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      )
      .then((res) => (res.ok ? res.json() : { plans: [] }))
      .then((json: { plans?: Plan[] }) => {
        if (live) setPlans(json.plans ?? []);
      })
      .catch(() => {
        if (live) setPlans([]);
      });
    return () => {
      live = false;
    };
  }, [ownerUid, reload]);

  async function pay(plan: Plan) {
    setBusy(plan.id);
    setError(null);
    try {
      const token = await auth?.currentUser?.getIdToken();
      if (!token) throw new Error("Please sign in again.");
      const res = await fetch("/api/patient/treatment-plans/pay", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ owner: ownerUid, packageId: plan.id, returnPath }),
      });
      const json = (await res.json().catch(() => ({}))) as { url?: string; error?: string };
      if (!res.ok || !json.url) throw new Error(json.error || "Could not start the payment.");
      window.location.assign(json.url);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not start the payment.");
      setBusy(null);
    }
  }

  if (plans.length === 0) return null;

  return (
    <section className="plan-pay" aria-label="Treatment plan payment">
      {plans.map((plan) => {
        const kind = plan.visitType === "home" ? "home visit" : "video session";
        return (
          <article key={plan.id} className={`plan-pay__card${plan.paid ? " is-paid" : ""}`}>
            <div className="plan-pay__info">
              <span className="plan-pay__eyebrow">Your treatment plan</span>
              <h3>{plan.title}</h3>
              <p>
                {plan.totalSessions} {kind}
                {plan.totalSessions === 1 ? "" : "s"}
                {plan.datesLine ? ` · ${plan.datesLine}` : ""} · {plan.usedSessions} done
              </p>
            </div>
            <div className="plan-pay__total">
              <span>{plan.paid ? "Paid" : "Total due"}</span>
              <strong>{formatPounds(plan.amountPence)}</strong>
              {plan.paid ? (
                <span className="plan-pay__paid">Paid, thank you</span>
              ) : justPaid ? (
                <span className="plan-pay__pending">Payment received, confirming…</span>
              ) : (
                <button type="button" className="button primary" disabled={busy !== null} onClick={() => void pay(plan)}>
                  {busy === plan.id ? "Opening secure payment…" : `Pay ${formatPounds(plan.amountPence)} now`}
                </button>
              )}
            </div>
          </article>
        );
      })}
      {error && <p className="field-error" role="alert">{error}</p>}
      <p className="plan-pay__fine">Secure card payment by Stripe (debit, credit, Apple Pay or Google Pay). A receipt and invoice are emailed once paid.</p>
    </section>
  );
}
