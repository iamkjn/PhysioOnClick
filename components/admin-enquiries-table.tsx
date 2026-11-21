"use client";
import { useEffect, useState } from "react";
import { collection, doc, onSnapshot, orderBy, query, limit, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { SkeletonTable } from "@/components/skeleton";
import { useToast } from "@/components/toast-provider";
import { channelLabel } from "@/lib/traffic-source";
import { timeLabels } from "@/lib/visit-request";

type EnquiryRecord = {
  id: string;
  name: string;
  email: string;
  phone: string;
  service: string;
  message: string;
  status: string;
  createdAtLabel: string;
  /** Set on "Request a home visit" call-back requests. */
  isVisitRequest: boolean;
  postcode: string;
  covered: boolean;
  visitTimes: string[];
  channel: string;
};

function telHref(phone: string) {
  const digits = phone.replace(/[^\d+]/g, "");
  return `tel:${digits.startsWith("0") ? `+44${digits.slice(1)}` : digits}`;
}

/** Opens Admin → Patients with "Add patient" pre-filled from a call-back request. */
export function addPatientHref(item: { name: string; phone: string }) {
  const params = new URLSearchParams({ add: "1", name: item.name, phone: item.phone });
  return `/admin/patients?${params.toString()}`;
}

// dashboard-status-pill only ships status-pending/-confirmed/-cancelled
// modifiers (warning/success/error) — "new" reuses the warning-toned pending
// modifier, "in-progress" falls back to the base pill (primary), and
// "resolved" reuses the success-toned confirmed modifier.
const STATUS_PILL_CLASS: Record<string, string> = {
  "new":         "dashboard-status-pill status-pending",
  "in-progress": "dashboard-status-pill",
  "resolved":    "dashboard-status-pill status-confirmed",
};

const STATUS_LABEL: Record<string, string> = {
  "new": "New",
  "in-progress": "In progress",
  "resolved": "Resolved",
};

export function AdminEnquiriesTable() {
  const toast = useToast();
  const [enquiries, setEnquiries] = useState<EnquiryRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (!db) return;
    const q = query(collection(db, "enquiries"), orderBy("createdAt", "desc"), limit(25));
    return onSnapshot(q, (snapshot) => {
      setEnquiries(snapshot.docs.map((d) => {
        const data = d.data();
        const ts = typeof data.createdAt?.toDate === "function" ? data.createdAt.toDate() : null;
        return {
          id: d.id,
          name:           String(data.name || ""),
          email:          String(data.email || ""),
          phone:          String(data.phone || ""),
          service:        String(data.service || ""),
          message:        String(data.message || ""),
          status:         String(data.status || "new"),
          isVisitRequest: data.kind === "visit-request",
          postcode:       String(data.postcode || ""),
          covered:        data.covered === true,
          visitTimes:     Array.isArray(data.visitTimes) ? data.visitTimes.map(String) : [],
          channel:        String(data.channel || ""),
          createdAtLabel: ts
            ? ts.toLocaleString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })
            : "Just now",
        };
      }));
      setLoading(false);
    });
  }, []);

  async function updateStatus(id: string, current: string, next: string) {
    setEnquiries((prev) => prev.map((e) => e.id === id ? { ...e, status: next } : e));
    if (!db) return;
    try {
      await updateDoc(doc(db, "enquiries", id), { status: next });
    } catch {
      setEnquiries((prev) => prev.map((e) => e.id === id ? { ...e, status: current } : e));
      toast.show("Couldn't update the status. Please try again.", "error");
    }
  }

  const newCount = enquiries.filter((e) => e.status === "new").length;

  return (
    <div>
      <div className="dashboard-table-head">
        <div>
          <span className="dashboard-eyebrow">
            Enquiries
          </span>
          <h2>
            Call-back requests and contact form messages
          </h2>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "var(--space-3)" }}>
          <span className="dashboard-table-count">{enquiries.length} enquiries</span>
          {newCount > 0 && (
            <span className="dashboard-status-pill status-pending">{newCount} new</span>
          )}
        </div>
      </div>

      {loading && <SkeletonTable rows={5} columns={6} />}

      {!loading && enquiries.length === 0 && (
        <p style={{ color: "var(--color-text-secondary)", fontFamily: "var(--font-sans)", padding: "var(--space-6) 0" }}>
          No enquiries yet.
        </p>
      )}

      {!loading && enquiries.length > 0 && (
        <div className="dashboard-table-wrap">
          <table className="dashboard-table">
            <caption className="sr-only">Latest contact form enquiries with contact details and status</caption>
            <thead>
              <tr>
                <th scope="col">Received</th>
                <th scope="col">Name</th>
                <th scope="col">Service</th>
                <th scope="col">Contact</th>
                <th scope="col">Message</th>
                <th scope="col">Status</th>
              </tr>
            </thead>
            <tbody>
              {enquiries.map((item) => {
                const isExp = expanded[item.id] ?? false;
                return (
                  <tr key={item.id} className="admin-table-row">
                    <td style={{ color: "var(--color-text-secondary)", fontSize: "var(--text-xs)", whiteSpace: "nowrap" as const, fontFamily: "var(--font-sans)" }}>
                      {item.createdAtLabel}
                    </td>
                    <td style={{ color: "var(--color-navy)", fontWeight: 600, fontFamily: "var(--font-sans)" }}>
                      {item.name}
                    </td>
                    <td style={{ color: "var(--color-navy)", fontFamily: "var(--font-sans)" }}>
                      {item.service}
                    </td>
                    <td style={{ color: "var(--color-text-secondary)", fontSize: "var(--text-xs)", fontFamily: "var(--font-sans)" }}>
                      {item.phone ? (
                        <a href={telHref(item.phone)} style={{ fontWeight: 700, fontSize: "var(--text-sm)" }}>{item.phone}</a>
                      ) : null}
                      {item.email ? <div>{item.email}</div> : null}
                      {item.isVisitRequest ? (
                        <div style={{ marginTop: 4 }}>
                          <a href={addPatientHref(item)} className="button small secondary">Add as patient</a>
                        </div>
                      ) : null}
                    </td>
                    <td className="dashboard-message-cell">
                      {item.isVisitRequest ? (
                        <p style={{ margin: "0 0 4px", color: "var(--color-navy)", fontFamily: "var(--font-sans)", fontWeight: 600 }}>
                          {item.postcode} {item.covered ? "(in area)" : "(outside the home-visit area)"}
                          {item.visitTimes.length ? ` · Suits: ${timeLabels(item.visitTimes).join(", ")}` : ""}
                          {item.channel && item.channel !== "direct" ? ` · From ${channelLabel(item.channel)}` : ""}
                        </p>
                      ) : null}
                      <p
                        style={{
                          margin: 0,
                          color: "var(--color-navy)",
                          fontFamily: "var(--font-sans)",
                          display: "-webkit-box",
                          WebkitLineClamp: isExp ? "unset" : 2,
                          WebkitBoxOrient: "vertical" as const,
                          overflow: isExp ? "visible" : "hidden",
                        }}
                      >
                        {item.message}
                      </p>
                      {item.message.length > 80 && (
                        <button
                          onClick={() => setExpanded((p) => ({ ...p, [item.id]: !isExp }))}
                          aria-expanded={isExp}
                          style={{
                            background: "none",
                            border: "none",
                            color: "var(--color-primary-dark)",
                            fontSize: "var(--text-xs)",
                            fontWeight: 600,
                            cursor: "pointer",
                            padding: "2px 0",
                            fontFamily: "var(--font-sans)",
                          }}
                        >
                          {isExp ? "Show less" : "Read more"}
                        </button>
                      )}
                    </td>
                    <td>
                      <span style={{ position: "relative", display: "inline-block" }}>
                        <select
                          value={item.status}
                          onChange={(e) => updateStatus(item.id, item.status, e.target.value)}
                          title="Change status"
                          aria-label={`Change status for ${item.name || "this enquiry"}`}
                          className={STATUS_PILL_CLASS[item.status] ?? "dashboard-status-pill"}
                          style={{
                            border: "none",
                            cursor: "pointer",
                            appearance: "none",
                            WebkitAppearance: "none",
                            paddingRight: "var(--space-5)",
                            font: "inherit",
                          }}
                        >
                          {Object.entries(STATUS_LABEL).map(([value, label]) => (
                            <option key={value} value={value}>{label}</option>
                          ))}
                        </select>
                        <span
                          aria-hidden="true"
                          style={{ position: "absolute", right: "var(--space-2)", top: "50%", transform: "translateY(-50%)", pointerEvents: "none", fontSize: 10 }}
                        >▾</span>
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
