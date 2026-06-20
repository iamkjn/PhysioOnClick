"use client";

import { useState } from "react";

const SERVICES = [
  "Musculoskeletal Physiotherapy",
  "Post-Surgical Rehabilitation",
  "Neurological Rehabilitation",
  "Paediatric Physiotherapy",
  "Gait & Mobility Assessment",
  "Online Rehab Programme",
];

const TIME_SLOTS = [
  "09:00", "09:30", "10:00", "10:30", "11:00", "11:30",
  "12:00", "13:00", "13:30", "14:00", "14:30", "15:00",
  "15:30", "16:00", "16:30", "17:00",
];

function formatLabel(time: string) {
  const [h, m] = time.split(":").map(Number);
  const period = h < 12 ? "AM" : "PM";
  const hour = h % 12 || 12;
  return `${hour}:${m === 0 ? "00" : m} ${period}`;
}

// Min date = tomorrow
function minDate() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().split("T")[0];
}

type Status = "idle" | "loading" | "success" | "error";

export function BookingForm() {
  const [form, setForm] = useState({
    fullName: "", email: "", phone: "",
    service: "", appointmentDate: "", appointmentTime: "", notes: "",
  });
  const [status, setStatus] = useState<Status>("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [confirmedLabel, setConfirmedLabel] = useState("");

  function set(field: string, value: string) {
    setForm(f => ({ ...f, [field]: value }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");
    setErrorMsg("");

    try {
      const res = await fetch("/api/booking", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Something went wrong.");
      setConfirmedLabel(data.appointmentLabel || `${form.appointmentDate} at ${form.appointmentTime}`);
      setStatus("success");
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Unable to submit. Please try again.");
      setStatus("error");
    }
  }

  if (status === "success") {
    return (
      <div style={{
        maxWidth: 560, margin: "0 auto",
        background: "linear-gradient(135deg, #ECFEFF, #F0FDFF)",
        border: "1.5px solid #A5F3FC", borderRadius: 20,
        padding: "48px 40px", textAlign: "center",
        boxShadow: "0 4px 24px rgba(8,145,178,0.1)",
      }}>
        <div style={{ fontSize: 52, marginBottom: 16 }}>✅</div>
        <h2 style={{ color: "#0E7490", fontSize: 22, fontWeight: 700, marginBottom: 10 }}>
          Request received!
        </h2>
        <p style={{ color: "#164E63", lineHeight: 1.7, marginBottom: 6 }}>
          Thank you, <strong>{form.fullName}</strong>. We&apos;ve received your booking
          request for <strong>{form.service}</strong>.
        </p>
        <p style={{ color: "#164E63", lineHeight: 1.7, marginBottom: 28 }}>
          Requested time: <strong>{confirmedLabel}</strong>
        </p>
        <p style={{ color: "#6B8FA0", fontSize: 14 }}>
          We&apos;ll confirm your appointment by email to <strong>{form.email}</strong> shortly.
        </p>
        <button
          onClick={() => {
            setForm({ fullName: "", email: "", phone: "", service: "", appointmentDate: "", appointmentTime: "", notes: "" });
            setStatus("idle");
          }}
          style={{
            marginTop: 28,
            padding: "11px 28px",
            background: "linear-gradient(135deg, #0891B2, #0E7490)",
            color: "white", border: "none", borderRadius: 30,
            fontWeight: 600, fontSize: 14, cursor: "pointer",
          }}
        >
          Book another appointment
        </button>
      </div>
    );
  }

  const inputStyle: React.CSSProperties = {
    width: "100%", padding: "11px 14px",
    border: "1.5px solid #C8E8F0", borderRadius: 10,
    fontSize: 14, color: "#164E63", background: "#FAFEFF",
    outline: "none", boxSizing: "border-box",
    fontFamily: "inherit",
  };

  const labelStyle: React.CSSProperties = {
    display: "block", fontSize: 13, fontWeight: 600,
    color: "#0E7490", marginBottom: 5,
  };

  const fieldStyle: React.CSSProperties = { flex: 1 };

  return (
    <div style={{ maxWidth: 680, margin: "0 auto" }}>
      {/* Info banner */}
      <div style={{
        background: "linear-gradient(135deg, #ECFEFF, #F0FDFF)",
        border: "1.5px solid #A5F3FC", borderRadius: 14,
        padding: "16px 20px", marginBottom: 32,
        display: "flex", alignItems: "flex-start", gap: 12,
      }}>
        <span style={{ fontSize: 20 }}>📋</span>
        <div>
          <p style={{ margin: 0, color: "#0E7490", fontWeight: 600, fontSize: 14 }}>
            How booking works
          </p>
          <p style={{ margin: "4px 0 0", color: "#164E63", fontSize: 13.5, lineHeight: 1.6 }}>
            Fill in your details below and we&apos;ll confirm your appointment by email within a few hours.
            No payment is taken online — you pay at the session.
          </p>
        </div>
      </div>

      <form onSubmit={submit} noValidate>
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

          {/* Name + Email */}
          <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
            <div style={fieldStyle}>
              <label style={labelStyle}>Full name <span style={{ color: "#0891B2" }}>*</span></label>
              <input
                style={inputStyle} type="text" required
                placeholder="e.g. Jane Smith"
                value={form.fullName}
                onChange={e => set("fullName", e.target.value)}
              />
            </div>
            <div style={fieldStyle}>
              <label style={labelStyle}>Email address <span style={{ color: "#0891B2" }}>*</span></label>
              <input
                style={inputStyle} type="email" required
                placeholder="e.g. jane@example.com"
                value={form.email}
                onChange={e => set("email", e.target.value)}
              />
            </div>
          </div>

          {/* Phone + Service */}
          <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
            <div style={fieldStyle}>
              <label style={labelStyle}>Phone number</label>
              <input
                style={inputStyle} type="tel"
                placeholder="e.g. 07700 900000"
                value={form.phone}
                onChange={e => set("phone", e.target.value)}
              />
            </div>
            <div style={fieldStyle}>
              <label style={labelStyle}>Service <span style={{ color: "#0891B2" }}>*</span></label>
              <select
                style={{ ...inputStyle, appearance: "none", WebkitAppearance: "none", cursor: "pointer" }}
                required
                value={form.service}
                onChange={e => set("service", e.target.value)}
              >
                <option value="">Select a service…</option>
                {SERVICES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>

          {/* Date + Time */}
          <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
            <div style={fieldStyle}>
              <label style={labelStyle}>Preferred date <span style={{ color: "#0891B2" }}>*</span></label>
              <input
                style={inputStyle} type="date" required
                min={minDate()}
                value={form.appointmentDate}
                onChange={e => set("appointmentDate", e.target.value)}
              />
            </div>
            <div style={fieldStyle}>
              <label style={labelStyle}>Preferred time <span style={{ color: "#0891B2" }}>*</span></label>
              <select
                style={{ ...inputStyle, appearance: "none", WebkitAppearance: "none", cursor: "pointer" }}
                required
                value={form.appointmentTime}
                onChange={e => set("appointmentTime", e.target.value)}
              >
                <option value="">Select a time…</option>
                {TIME_SLOTS.map(t => (
                  <option key={t} value={t}>{formatLabel(t)}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label style={labelStyle}>Additional notes</label>
            <textarea
              style={{ ...inputStyle, minHeight: 90, resize: "vertical" }}
              placeholder="Tell us about your condition or any other details…"
              value={form.notes}
              onChange={e => set("notes", e.target.value)}
            />
          </div>

          {/* Error */}
          {status === "error" && (
            <div style={{
              background: "#FEF2F2", border: "1px solid #FECACA",
              borderRadius: 10, padding: "12px 16px",
              color: "#B91C1C", fontSize: 14,
            }}>
              ⚠️ {errorMsg}
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={status === "loading"}
            style={{
              padding: "14px 36px", alignSelf: "flex-start",
              background: status === "loading"
                ? "#A5F3FC"
                : "linear-gradient(135deg, #0891B2, #0E7490)",
              color: "white", border: "none", borderRadius: 30,
              fontWeight: 700, fontSize: 15, cursor: status === "loading" ? "default" : "pointer",
              boxShadow: status === "loading" ? "none" : "0 4px 16px rgba(8,145,178,0.3)",
              transition: "all 0.15s ease",
            }}
          >
            {status === "loading" ? "Sending request…" : "Request appointment →"}
          </button>

          <p style={{ fontSize: 12.5, color: "#6B8FA0", margin: 0 }}>
            * Required fields. We&apos;ll confirm availability and send a calendar invite by email.
          </p>

        </div>
      </form>
    </div>
  );
}
