"use client";
import { useEffect, useState } from "react";
import { collection, doc, onSnapshot, orderBy, query, limit, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { SkeletonTable } from "@/components/skeleton";

type EnquiryRecord = {
  id: string;
  name: string;
  email: string;
  phone: string;
  service: string;
  message: string;
  status: string;
  createdAtLabel: string;
};

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
          phone:          String(data.phone || "Not provided"),
          service:        String(data.service || ""),
          message:        String(data.message || ""),
          status:         String(data.status || "new"),
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
    }
  }

  const newCount = enquiries.filter((e) => e.status === "new").length;

  return (
    <div>
      <div className="dashboard-table-head" style={{ marginBottom: "1rem" }}>
        <div>
          <span style={{ fontSize: 11, fontWeight: 700, color: "var(--color-text-secondary)", textTransform: "uppercase" as const, letterSpacing: "0.08em", fontFamily: "var(--font-sans)" }}>
            Enquiries
          </span>
          <h2 style={{ margin: "0.25rem 0 0", fontFamily: "var(--font-serif)", fontSize: 22, color: "var(--color-navy)" }}>
            Latest contact form submissions
          </h2>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <span className="dashboard-table-count">{enquiries.length} enquiries</span>
          {newCount > 0 && (
            <span className="dashboard-status-pill status-pending">{newCount} new</span>
          )}
        </div>
      </div>

      {loading && <SkeletonTable rows={5} columns={6} />}

      {!loading && enquiries.length === 0 && (
        <p style={{ color: "var(--color-text-secondary)", fontFamily: "var(--font-sans)", padding: "2rem 0" }}>
          No enquiries yet.
        </p>
      )}

      {!loading && enquiries.length > 0 && (
        <div className="dashboard-table-wrap">
          <table className="dashboard-table admin-enquiries-table">
            <caption className="sr-only">Latest contact form enquiries with contact details and status</caption>
            <thead>
              <tr>
                <th scope="col">Received</th>
                <th scope="col">Name</th>
                <th scope="col">Service</th>
                <th scope="col">Email</th>
                <th scope="col">Message</th>
                <th scope="col">Status</th>
              </tr>
            </thead>
            <tbody>
              {enquiries.map((item) => {
                const isExp = expanded[item.id] ?? false;
                return (
                  <tr key={item.id} className="admin-table-row">
                    <td style={{ color: "var(--color-text-secondary)", fontSize: 12, whiteSpace: "nowrap" as const, fontFamily: "var(--font-sans)" }}>
                      {item.createdAtLabel}
                    </td>
                    <td style={{ color: "var(--color-navy)", fontWeight: 600, fontFamily: "var(--font-sans)" }}>
                      {item.name}
                    </td>
                    <td style={{ color: "var(--color-navy)", fontFamily: "var(--font-sans)" }}>
                      {item.service}
                    </td>
                    <td style={{ color: "var(--color-text-secondary)", fontSize: 12, fontFamily: "var(--font-sans)" }}>
                      {item.email}
                    </td>
                    <td className="dashboard-message-cell">
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
                            fontSize: 12,
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
                            paddingRight: "1.5rem",
                            font: "inherit",
                          }}
                        >
                          {Object.entries(STATUS_LABEL).map(([value, label]) => (
                            <option key={value} value={value}>{label}</option>
                          ))}
                        </select>
                        <span
                          aria-hidden="true"
                          style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", pointerEvents: "none", fontSize: 10 }}
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

      {/* Row hover — see admin-bookings-table.tsx for the same pattern and
          the recommended shared globals.css rule in the report. */}
      <style>{`
        .admin-enquiries-table tbody tr.admin-table-row:hover { background: var(--surface-alt); }
      `}</style>
    </div>
  );
}
