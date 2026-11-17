"use client";

import { useState } from "react";

export function PayButton({ token, label }: { token: string; label: string }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function pay() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/pay/${encodeURIComponent(token)}`, { method: "POST" });
      const json = (await res.json().catch(() => ({}))) as { url?: string; error?: string };
      if (!res.ok || !json.url) throw new Error(json.error || "Could not start the payment.");
      window.location.assign(json.url);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not start the payment.");
      setBusy(false);
    }
  }

  return (
    <div className="stack">
      <button type="button" className="button primary pay-page__button" disabled={busy} onClick={() => void pay()}>
        {busy ? "Opening secure payment…" : label}
      </button>
      {error && <p className="field-error" role="alert">{error}</p>}
    </div>
  );
}
