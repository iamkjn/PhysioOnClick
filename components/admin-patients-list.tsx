// components/admin-patients-list.tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Avatar } from "@/components/avatar";
import { SkeletonRow } from "@/components/skeleton";
import { useToast } from "@/components/toast-provider";

interface PatientRow {
  uid: string;
  displayName: string;
  email: string;
  phoneNumber?: string;
  photoUrl?: string;
}

export function AdminPatientsList() {
  const [patients, setPatients] = useState<PatientRow[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const toast = useToast();

  useEffect(() => {
    if (!db) { setLoaded(true); return; }
    getDocs(collection(db, "patients"))
      .then((snap) => {
        const rows = snap.docs
          .map((d) => {
            const data = d.data();
            return {
              uid: d.id,
              displayName: (data.displayName as string) || "Unnamed",
              email: (data.email as string) || "",
              phoneNumber: (data.phoneNumber as string) || undefined,
              photoUrl: (data.photoUrl as string) || undefined,
            };
          })
          .sort((a, b) => a.displayName.localeCompare(b.displayName));
        setPatients(rows);
        setLoaded(true);
      })
      .catch(() => {
        setLoadError("Could not load patients. Check your connection and try again.");
        toast.show("Could not load patients.", "error");
        setLoaded(true);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- toast.show is stable; only run on mount
  }, []);

  const filtered = patients.filter((p) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return (
      p.displayName.toLowerCase().includes(q) ||
      p.email.toLowerCase().includes(q) ||
      (p.phoneNumber ?? "").toLowerCase().includes(q)
    );
  });

  return (
    <div className="panel stack">
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: "1rem", flexWrap: "wrap" as const }}>
        <h1 style={{ margin: 0, fontFamily: "var(--font-serif)", fontSize: 22, color: "var(--color-navy)" }}>Patients</h1>
        {loaded && (
          <span className="muted" style={{ fontSize: 13 }}>
            {filtered.length} of {patients.length} patient{patients.length === 1 ? "" : "s"}
          </span>
        )}
      </div>

      <input
        type="text"
        className="input"
        placeholder="Search by name, email or phone…"
        aria-label="Search patients by name, email or phone"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      {loadError && (
        <p role="alert" style={{ color: "var(--color-error)", fontSize: 14, margin: 0 }}>{loadError}</p>
      )}

      {!loaded ? (
        <SkeletonRow count={6} />
      ) : filtered.length === 0 ? (
        <p className="muted" style={{ margin: 0, fontSize: 14 }}>
          {patients.length === 0 ? "No patients yet." : `No patients match “${search}”.`}
        </p>
      ) : (
        <div role="list" aria-label="Patients" style={{ display: "grid", gap: "0.5rem" }}>
          {filtered.map((p) => (
            <Link
              key={p.uid}
              href={`/admin/patients/${p.uid}`}
              role="listitem"
              className="admin-patient-row"
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.85rem",
                textDecoration: "none",
                background: "var(--color-bg)",
                border: "1px solid var(--color-border)",
                borderRadius: "var(--radius-chip)",
                padding: "0.65rem 0.9rem",
              }}
            >
              <Avatar name={p.displayName} imageUrl={p.photoUrl} size={38} />
              <span style={{ display: "grid", gap: 2, minWidth: 0 }}>
                <strong style={{ color: "var(--color-text-primary)", fontSize: 14 }}>{p.displayName}</strong>
                <span
                  style={{
                    color: "var(--color-text-secondary)",
                    fontSize: 13,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {p.email}
                  {p.phoneNumber ? ` · ${p.phoneNumber}` : ""}
                </span>
              </span>
              <span aria-hidden="true" style={{ marginLeft: "auto", color: "var(--color-text-secondary)" }}>→</span>
            </Link>
          ))}
        </div>
      )}

      {/* Scoped hover/focus for the rows above. */}
      <style>{`
        .admin-patient-row:hover { background: var(--surface-alt); border-color: var(--primary); }
        .admin-patient-row:focus-visible { outline: 2px solid var(--color-primary-dark); outline-offset: 2px; }
      `}</style>
    </div>
  );
}
