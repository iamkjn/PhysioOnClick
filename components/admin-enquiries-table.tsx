"use client";
import { useEffect, useState } from "react";
import { collection, query, orderBy, limit, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";

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

const STATUS_STYLES: Record<string, { bg: string; color: string }> = {
  new:      { bg: "var(--color-gold-light)",  color: "var(--color-gold)" },
  read:     { bg: "var(--color-teal-light)",  color: "var(--color-teal)" },
  resolved: { bg: "#D1FAE5",                  color: "#059669" },
};

export function AdminEnquiriesTable() {
  const [enquiries, setEnquiries] = useState<EnquiryRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!db) return;
    const q = query(collection(db, "enquiries"), orderBy("createdAt", "desc"), limit(25));
    return onSnapshot(q, (snapshot) => {
      setEnquiries(snapshot.docs.map((doc) => {
        const d = doc.data();
        const createdAt =
          typeof d.createdAt?.toDate === "function"
            ? d.createdAt.toDate().toLocaleString("en-GB", {
                day: "2-digit",
                month: "short",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })
            : "Just now";
        return {
          id: doc.id,
          name:           String(d.name || ""),
          email:          String(d.email || ""),
          phone:          String(d.phone || "Not provided"),
          service:        String(d.service || ""),
          message:        String(d.message || ""),
          status:         String(d.status || "new"),
          createdAtLabel: createdAt,
        };
      }));
      setLoading(false);
    });
  }, []);

  const th: React.CSSProperties = { color: "#fff", fontWeight: 600, fontSize: 12, padding: "0.625rem 0.75rem", textAlign: "left" as const, whiteSpace: "nowrap" as const, fontFamily: "var(--font-sans)" };
  const td: React.CSSProperties = { padding: "0.75rem", verticalAlign: "top" as const };

  return (
    <div>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: "1rem" }}>
        <div>
          <span style={{ fontSize: 11, fontWeight: 700, color: "var(--color-text-secondary)", textTransform: "uppercase" as const, letterSpacing: "0.08em", fontFamily: "var(--font-sans)" }}>Enquiries</span>
          <h2 style={{ margin: "0.25rem 0 0", fontFamily: "var(--font-serif)", fontSize: 22, color: "var(--color-navy)" }}>Latest contact form submissions</h2>
        </div>
        <span style={{ fontSize: 13, color: "var(--color-text-secondary)", fontFamily: "var(--font-sans)" }}>{enquiries.length} shown · sorted by newest</span>
      </div>

      {loading && <p style={{ color: "var(--color-text-secondary)", fontFamily: "var(--font-sans)" }}>Loading enquiries…</p>}

      {!loading && enquiries.length === 0 && (
        <p style={{ color: "var(--color-text-secondary)", fontFamily: "var(--font-sans)", padding: "2rem 0" }}>
          No enquiries yet. New contact form submissions will appear here.
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
                <th style={th}>Phone</th>
                <th style={th}>Message</th>
                <th style={th}>Status</th>
              </tr>
            </thead>
            <tbody>
              {enquiries.map((item, i) => {
                const s = STATUS_STYLES[item.status] ?? STATUS_STYLES.new;
                const rowBg = i % 2 === 0 ? "var(--color-surface)" : "var(--color-teal-light)";
                return (
                  <tr key={item.id} style={{ background: rowBg, borderBottom: "1px solid var(--color-border)" }}>
                    <td style={{ ...td, color: "var(--color-text-secondary)", fontFamily: "var(--font-sans)", fontSize: 12 }}>{item.createdAtLabel}</td>
                    <td style={{ ...td, color: "var(--color-navy)", fontWeight: 600, fontFamily: "var(--font-sans)" }}>{item.name}</td>
                    <td style={{ ...td, color: "var(--color-navy)", fontFamily: "var(--font-sans)" }}>{item.service}</td>
                    <td style={{ ...td, color: "var(--color-teal)", fontFamily: "var(--font-sans)" }}>{item.email}</td>
                    <td style={{ ...td, color: "var(--color-navy)", fontFamily: "var(--font-sans)" }}>{item.phone}</td>
                    <td style={{ ...td, color: "var(--color-navy)", fontFamily: "var(--font-sans)", maxWidth: 280, wordBreak: "break-word" as const }}>{item.message}</td>
                    <td style={td}>
                      <span style={{ background: s.bg, color: s.color, borderRadius: 999, padding: "3px 10px", fontSize: 12, fontWeight: 700, fontFamily: "var(--font-sans)" }}>
                        {item.status}
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
