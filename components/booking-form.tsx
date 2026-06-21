"use client";

import { useState } from "react";

const SERVICES = [
  { emoji: "💪", label: "Musculoskeletal Physiotherapy" },
  { emoji: "🦿", label: "Post-Surgical Rehabilitation" },
  { emoji: "🧠", label: "Neurological Rehabilitation" },
  { emoji: "👶", label: "Paediatric Physiotherapy" },
  { emoji: "🚶", label: "Gait & Mobility Assessment" },
  { emoji: "💻", label: "Online Rehab Programme" },
];

const PRICING: Record<string, string> = {
  "Musculoskeletal Physiotherapy": "Initial Assessment £65 · Follow-up £50",
  "Post-Surgical Rehabilitation": "Initial Assessment £65 · Follow-up £50",
  "Neurological Rehabilitation": "Initial Assessment £65 · Follow-up £50",
  "Paediatric Physiotherapy": "Initial Assessment £65 · Follow-up £50",
  "Gait & Mobility Assessment": "Initial Assessment £65 · Follow-up £50",
  "Online Rehab Programme": "Initial Online Assessment £55 · Follow-up £45",
};

const TIME_SLOTS = [
  "09:00", "09:30", "10:00", "10:30", "11:00", "11:30",
  "12:00", "13:00", "13:30", "14:00", "14:30", "15:00",
  "15:30", "16:00", "16:30", "17:00",
];

function formatTime(t: string) {
  const [h, m] = t.split(":").map(Number);
  const p = h < 12 ? "AM" : "PM";
  return `${h % 12 || 12}:${m === 0 ? "00" : m} ${p}`;
}

function minDate() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().split("T")[0];
}

type Status = "idle" | "loading" | "success" | "error";

export function BookingForm({ initialService = "" }: { initialService?: string }) {
  const [form, setForm] = useState({
    fullName: "", email: "", phone: "",
    service: initialService,
    appointmentDate: "", appointmentTime: "", notes: "",
    consent: false,
  });
  const [status, setStatus] = useState<Status>("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [confirmedLabel, setConfirmedLabel] = useState("");
  const [meetLink, setMeetLink] = useState("");

  const set = (field: string, value: string | boolean) =>
    setForm(f => ({ ...f, [field]: value }));

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
      setMeetLink(data.meetLink || "");
      setStatus("success");
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Unable to submit. Please try again.");
      setStatus("error");
    }
  }

  if (status === "success") {
    return (
      <div style={{
        maxWidth: 600, margin: "0 auto",
        background: "white", borderRadius: 20, padding: "52px 48px",
        textAlign: "center", boxShadow: "0 4px 32px rgba(8,145,178,0.12)",
        border: "1.5px solid #A5F3FC",
      }}>
        <div style={{ fontSize: 56, marginBottom: 20 }}>🎉</div>
        <h2 style={{ color: "#0E7490", fontSize: 24, fontWeight: 700, margin: "0 0 12px" }}>
          Appointment request sent!
        </h2>
        <p style={{ color: "#164E63", lineHeight: 1.7, margin: "0 0 8px" }}>
          Thank you, <strong>{form.fullName}</strong>. We&apos;ve received your request
          for <strong>{form.service}</strong>.
        </p>
        <p style={{ color: "#164E63", lineHeight: 1.7, margin: "0 0 28px" }}>
          Requested slot: <strong>{confirmedLabel}</strong>
        </p>
        {meetLink ? (
          <div style={{
            background: "#ECFEFF", border: "1.5px solid #A5F3FC", borderRadius: 12,
            padding: "16px 20px", marginBottom: 28,
          }}>
            <p style={{ margin: "0 0 8px", fontWeight: 700, color: "#0E7490", fontSize: 14 }}>
              📹 Your Google Meet link
            </p>
            <a href={meetLink} target="_blank" rel="noopener noreferrer"
              style={{ color: "#0891B2", fontSize: 14, wordBreak: "break-all" }}>
              {meetLink}
            </a>
            <p style={{ margin: "8px 0 0", fontSize: 12.5, color: "#6B8FA0" }}>
              This link has also been sent to <strong>{form.email}</strong>
            </p>
          </div>
        ) : (
          <div style={{
            background: "#F0FDFF", borderRadius: 12, padding: "14px 20px",
            marginBottom: 28, color: "#6B8FA0", fontSize: 14, lineHeight: 1.6,
          }}>
            We&apos;ll confirm availability and send a calendar invite to <strong>{form.email}</strong> within a few hours.
          </div>
        )}
        <button
          onClick={() => { setForm({ fullName: "", email: "", phone: "", service: "", appointmentDate: "", appointmentTime: "", notes: "", consent: false }); setStatus("idle"); }}
          style={{
            padding: "12px 32px", borderRadius: 30,
            background: "linear-gradient(135deg, #0891B2, #0E7490)",
            color: "white", border: "none", fontWeight: 600, fontSize: 15, cursor: "pointer",
          }}
        >
          Book another appointment
        </button>
      </div>
    );
  }

  const input: React.CSSProperties = {
    width: "100%", padding: "12px 16px", fontSize: 14.5,
    border: "1.5px solid #D1ECF3", borderRadius: 10,
    color: "#164E63", background: "white", outline: "none",
    boxSizing: "border-box", fontFamily: "inherit", transition: "border-color 0.15s",
  };

  const label: React.CSSProperties = {
    display: "block", fontSize: 13, fontWeight: 600, color: "#0E7490", marginBottom: 6,
  };

  const required = <span style={{ color: "#0891B2" }}>*</span>;

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: 32, alignItems: "start" }}>

      {/* ── Form card ── */}
      <div style={{
        background: "white", borderRadius: 20, padding: "36px 40px",
        boxShadow: "0 4px 32px rgba(0,0,0,0.07)", border: "1px solid #E8F6FA",
      }}>
        <h2 style={{ margin: "0 0 6px", color: "#164E63", fontSize: 20, fontWeight: 700 }}>
          Your details
        </h2>
        <p style={{ margin: "0 0 28px", color: "#6B8FA0", fontSize: 14 }}>
          All fields marked * are required. We confirm within a few hours.
        </p>

        <form onSubmit={submit} noValidate>
          <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>

            {/* Name + Email */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <div>
                <label style={label}>Full name {required}</label>
                <input style={input} type="text" required placeholder="Jane Smith"
                  value={form.fullName} onChange={e => set("fullName", e.target.value)} />
              </div>
              <div>
                <label style={label}>Email address {required}</label>
                <input style={input} type="email" required placeholder="jane@example.com"
                  value={form.email} onChange={e => set("email", e.target.value)} />
              </div>
            </div>

            {/* Phone + Service */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <div>
                <label style={label}>Phone number</label>
                <input style={input} type="tel" placeholder="07700 900000"
                  value={form.phone} onChange={e => set("phone", e.target.value)} />
              </div>
              <div>
                <label style={label}>Service {required}</label>
                <select style={{ ...input, cursor: "pointer" }} required
                  value={form.service} onChange={e => set("service", e.target.value)}>
                  <option value="">Select a service…</option>
                  {SERVICES.map(s => (
                    <option key={s.label} value={s.label}>{s.emoji} {s.label}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Pricing hint */}
            {form.service && PRICING[form.service] && (
              <div style={{
                background: "#F0FDFF", border: "1px solid #A5F3FC", borderRadius: 10,
                padding: "10px 16px", fontSize: 13.5, color: "#0E7490",
                display: "flex", alignItems: "center", gap: 8,
              }}>
                <span>💰</span>
                <span>{PRICING[form.service]}</span>
              </div>
            )}

            {/* Date + Time */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <div>
                <label style={label}>Preferred date {required}</label>
                <input style={input} type="date" required min={minDate()}
                  value={form.appointmentDate} onChange={e => set("appointmentDate", e.target.value)} />
              </div>
              <div>
                <label style={label}>Preferred time {required}</label>
                <select style={{ ...input, cursor: "pointer" }} required
                  value={form.appointmentTime} onChange={e => set("appointmentTime", e.target.value)}>
                  <option value="">Select a time…</option>
                  {TIME_SLOTS.map(t => (
                    <option key={t} value={t}>{formatTime(t)}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Notes */}
            <div>
              <label style={label}>Additional notes</label>
              <textarea
                style={{ ...input, minHeight: 100, resize: "vertical" }}
                placeholder="Briefly describe your condition, main symptoms, or anything helpful for us to know…"
                value={form.notes} onChange={e => set("notes", e.target.value)}
              />
            </div>

            {/* Error */}
            {status === "error" && (
              <div style={{
                background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 10,
                padding: "12px 16px", color: "#B91C1C", fontSize: 14,
              }}>
                ⚠️ {errorMsg}
              </div>
            )}

            {/* Consent */}
            <label style={{ display: "flex", alignItems: "flex-start", gap: 10, cursor: "pointer", fontSize: 13.5, color: "#164E63", lineHeight: 1.5 }}>
              <input
                type="checkbox"
                required
                checked={form.consent}
                onChange={e => set("consent", e.target.checked)}
                style={{ marginTop: 2, flexShrink: 0, accentColor: "#0891B2", width: 16, height: 16 }}
              />
              <span>
                I consent to online consultation and the storage of my personal and clinical data as described in the{" "}
                <a href="/privacy-policy" style={{ color: "#0891B2", textDecoration: "underline" }}>Privacy Policy</a>.
              </span>
            </label>

            {/* Submit */}
            <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
              <button
                type="submit"
                disabled={status === "loading"}
                style={{
                  padding: "14px 36px", borderRadius: 30, border: "none", cursor: status === "loading" ? "default" : "pointer",
                  background: status === "loading" ? "#A5F3FC" : "linear-gradient(135deg, #0891B2, #0E7490)",
                  color: "white", fontWeight: 700, fontSize: 15,
                  boxShadow: status === "loading" ? "none" : "0 4px 16px rgba(8,145,178,0.3)",
                  transition: "all 0.15s",
                }}
              >
                {status === "loading" ? "Sending…" : "Request appointment →"}
              </button>
              <p style={{ margin: 0, fontSize: 12.5, color: "#6B8FA0" }}>
                No payment taken online. You pay at the session.
              </p>
            </div>

          </div>
        </form>
      </div>

      {/* ── Sidebar ── */}
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

        {/* What to expect */}
        <div style={{
          background: "linear-gradient(135deg, #ECFEFF, #F0FDFF)",
          border: "1.5px solid #A5F3FC", borderRadius: 16, padding: "24px 22px",
        }}>
          <p style={{ margin: "0 0 16px", fontWeight: 700, color: "#0E7490", fontSize: 15 }}>
            What to expect
          </p>
          {[
            ["✅", "Confirmation email within a few hours"],
            ["📅", "Calendar invite sent once confirmed"],
            ["💳", "No payment online — pay at session"],
            ["🏥", "No GP referral required"],
            ["📍", "In-person (Glasgow) or online UK-wide"],
            ["↩️", "Free to cancel 24hrs in advance"],
          ].map(([icon, text]) => (
            <div key={text} style={{ display: "flex", gap: 10, alignItems: "flex-start", marginBottom: 10 }}>
              <span style={{ fontSize: 16, flexShrink: 0, marginTop: 1 }}>{icon}</span>
              <span style={{ fontSize: 13.5, color: "#164E63", lineHeight: 1.5 }}>{text}</span>
            </div>
          ))}
        </div>

        {/* Pricing */}
        <div style={{
          background: "white", border: "1px solid #E8F6FA", borderRadius: 16, padding: "22px",
          boxShadow: "0 2px 12px rgba(0,0,0,0.05)",
        }}>
          <p style={{ margin: "0 0 14px", fontWeight: 700, color: "#0E7490", fontSize: 15 }}>
            💰 Session pricing
          </p>
          {[
            ["Initial Assessment", "45 min", "£65"],
            ["Follow-Up", "30 min", "£50"],
            ["Extended Session", "60 min", "£80"],
            ["Online Initial", "45 min", "£55"],
            ["Online Follow-Up", "30 min", "£45"],
          ].map(([name, dur, price]) => (
            <div key={name} style={{
              display: "flex", justifyContent: "space-between", alignItems: "center",
              padding: "7px 0", borderBottom: "1px solid #F0FDFF",
            }}>
              <div>
                <span style={{ fontSize: 13, color: "#164E63", fontWeight: 500 }}>{name}</span>
                <span style={{ fontSize: 12, color: "#6B8FA0", marginLeft: 6 }}>{dur}</span>
              </div>
              <span style={{ fontWeight: 700, color: "#0891B2", fontSize: 14 }}>{price}</span>
            </div>
          ))}
          <p style={{ margin: "12px 0 0", fontSize: 12, color: "#6B8FA0" }}>
            4-session bundle £180 · 8-session bundle £340
          </p>
        </div>

        {/* Contact */}
        <div style={{
          background: "#164E63", borderRadius: 16, padding: "20px 22px", color: "white",
        }}>
          <p style={{ margin: "0 0 8px", fontWeight: 700, fontSize: 14 }}>Need help?</p>
          <p style={{ margin: 0, fontSize: 13, lineHeight: 1.6, opacity: 0.85 }}>
            Email us at<br />
            <strong style={{ opacity: 1 }}>hello@physioonclick.co.uk</strong>
          </p>
        </div>

      </div>
    </div>
  );
}
