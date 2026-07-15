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

const STATUS_CYCLE: Record<string, string> = {
  "new":         "in-progress",
  "in-progress": "resolved",
  "resolved":    "new",
};

const STATUS_STYLES: Record<string, { bg: string; color: string; label: string }> = {
  "new":         { bg: "var(--color-gold-light)",  color: "var(--color-gold)",  label: "New" },
  "in-progress": { bg: "var(--color-primary-light)",  color: "var(--color-primary)",  label: "In progress" },
  "resolved":    { bg: "#D1FAE5",                  color: "var(--color-success)",             label: "Resolved" },
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

  async function cycleStatus(id: string, current: string) {
    const next = STATUS_CYCLE[current] ?? "new";
    setEnquiries((prev) => prev.map((e) => e.id === id ? { ...e, status: next } : e));
    if (!db) return;
    try {
      await updateDoc(doc(db, "enquiries", id), { status: next });
    } catch {
      setEnquiries((prev) => prev.map((e) => e.id === id ? { ...e, status: current } : e));
    }
  }

  const newCount = enquiries.filter((e) => e.status === "new").length;

  const th: React.CSSProperties = {
    color: "#fff",
    fontWeight: 600,
    fontSize: 12,
    padding: "0.625rem 0.75rem",
    textAlign: "left" as const,
    whiteSpace: "nowrap" as const,
    fontFamily: "var(--font-sans)",
  };
  const td: React.CSSProperties = { padding: "0.75rem", verticalAlign: "top" as const };

  return (
    <div>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: "1rem" }}>
        <div>
          <span style={{ fontSize: 11, fontWeight: 700, color: "var(--color-text-secondary)", textTransform: "uppercase" as const, letterSpacing: "0.08em", fontFamily: "var(--font-sans)" }}>
            Enquiries
          </span>
          <h2 style={{ margin: "0.25rem 0 0", fontFamily: "var(--font-serif)", fontSize: 22, color: "var(--color-navy)" }}>
            Latest contact form submissions
          </h2>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <span style={{ fontSize: 13, color: "var(--color-text-secondary)", fontFamily: "var(--font-sans)" }}>
            {enquiries.length} enquiries
          </span>
          {newCount > 0 && (
            <span style={{ background: "var(--color-gold-light)", color: "var(--color-gold)", borderRadius: 999, padding: "3px 10px", fontSize: 12, fontWeight: 700, fontFamily: "var(--font-sans)" }}>
              {newCount} new
            </span>
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
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
            <thead>
              <tr style={{ background: "var(--color-navy)" }}>
                <th style={th}>Received</th>
                <th style={th}>Name</th>
                <th style={th}>Service</th>
                <th style={th}>Email</th>
                <th style={th}>Message</th>
                <th style={th}>Status</th>
              </tr>
            </thead>
            <tbody>
              {enquiries.map((item, i) => {
                const s = STATUS_STYLES[item.status] ?? STATUS_STYLES.new;
                const isExp = expanded[item.id] ?? false;
                return (
                  <tr
                    key={item.id}
                    style={{
                      background: i % 2 === 0 ? "var(--color-surface)" : "var(--color-primary-light)",
                      borderBottom: "1px solid var(--color-border)",
                    }}
                  >
                    <td style={{ ...td, color: "var(--color-text-secondary)", fontSize: 12, whiteSpace: "nowrap" as const, fontFamily: "var(--font-sans)" }}>
                      {item.createdAtLabel}
                    </td>
                    <td style={{ ...td, color: "var(--color-navy)", fontWeight: 600, fontFamily: "var(--font-sans)" }}>
                      {item.name}
                    </td>
                    <td style={{ ...td, color: "var(--color-navy)", fontFamily: "var(--font-sans)" }}>
                      {item.service}
                    </td>
                    <td style={{ ...td, color: "var(--color-text-secondary)", fontSize: 12, fontFamily: "var(--font-sans)" }}>
                      {item.email}
                    </td>
                    <td style={{ ...td, maxWidth: 280 }}>
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
                          style={{
                            background: "none",
                            border: "none",
                            color: "var(--color-primary)",
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
                    <td style={td}>
                      <button
                        onClick={() => cycleStatus(item.id, item.status)}
                        title="Click to update status"
                        style={{
                          background: s.bg,
                          color: s.color,
                          border: "none",
                          borderRadius: 999,
                          padding: "4px 12px",
                          fontSize: 12,
                          fontWeight: 700,
                          cursor: "pointer",
                          fontFamily: "var(--font-sans)",
                        }}
                      >
                        {s.label}
                      </button>
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
