// components/admin-patients-list.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { calcAge } from "@/lib/age";
import { Avatar } from "@/components/avatar";
import { SkeletonRow } from "@/components/skeleton";
import { useToast } from "@/components/toast-provider";

type PersonKind = "primary" | "dependent";

interface PersonRow {
  key: string;
  kind: PersonKind;
  href: string;
  name: string;
  photoUrl?: string;
  dob?: string;
  // primary only
  email?: string;
  phoneNumber?: string;
  // dependent only
  relationship?: string;
  ownerName?: string;
  ownerEmail?: string;
}

type Filter = "all" | "primary" | "dependent";

const FILTER_LABEL: Record<Filter, string> = {
  all: "All",
  primary: "Primary",
  dependent: "Dependents",
};

export function AdminPatientsList() {
  const [rows, setRows] = useState<PersonRow[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const toast = useToast();

  useEffect(() => {
    if (!db) { setLoaded(true); return; }
    Promise.all([
      getDocs(collection(db, "patients")),
      getDocs(collection(db, "dependents")),
    ])
      .then(([patientsSnap, dependentsSnap]) => {
        const owners = new Map<string, { name: string; email: string }>();
        const primaries: PersonRow[] = patientsSnap.docs.map((d) => {
          const data = d.data();
          const name = (data.displayName as string) || "Unnamed";
          owners.set(d.id, { name, email: (data.email as string) || "" });
          return {
            key: `p:${d.id}`,
            kind: "primary" as const,
            href: `/admin/patients/${d.id}`,
            name,
            photoUrl: (data.photoUrl as string) || undefined,
            dob: (data.dob as string) || undefined,
            email: (data.email as string) || "",
            phoneNumber: (data.phoneNumber as string) || undefined,
          };
        });
        const dependents: PersonRow[] = dependentsSnap.docs.map((d) => {
          const data = d.data();
          const owner = owners.get(data.ownerId as string);
          return {
            key: `d:${d.id}`,
            kind: "dependent" as const,
            href: `/admin/patients/${data.ownerId}?person=${d.id}`,
            name: (data.name as string) || "Unnamed",
            photoUrl: (data.avatarUrl as string) || undefined,
            dob: (data.dob as string) || undefined,
            relationship: (data.relationship as string) || "Dependent",
            ownerName: owner?.name ?? "their primary account",
            ownerEmail: owner?.email ?? "",
          };
        });
        setRows(
          [...primaries, ...dependents].sort((a, b) => a.name.localeCompare(b.name))
        );
        setLoaded(true);
      })
      .catch(() => {
        setLoadError("Could not load patients. Check your connection and try again.");
        toast.show("Could not load patients.", "error");
        setLoaded(true);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- toast.show is stable; only run on mount
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter((r) => {
      if (filter !== "all" && r.kind !== filter) return false;
      if (!q) return true;
      return (
        r.name.toLowerCase().includes(q) ||
        (r.email ?? "").toLowerCase().includes(q) ||
        (r.phoneNumber ?? "").toLowerCase().includes(q) ||
        (r.relationship ?? "").toLowerCase().includes(q) ||
        (r.ownerName ?? "").toLowerCase().includes(q) ||
        (r.ownerEmail ?? "").toLowerCase().includes(q)
      );
    });
  }, [rows, search, filter]);

  const primaryCount = rows.filter((r) => r.kind === "primary").length;
  const dependentCount = rows.length - primaryCount;

  return (
    <div className="panel stack">
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: "var(--space-4)", flexWrap: "wrap" as const }}>
        <h1 style={{ margin: 0, fontFamily: "var(--font-serif)", fontSize: 22, color: "var(--color-navy)" }}>Patients</h1>
        {loaded && (
          <span className="muted" style={{ fontSize: "var(--text-xs)" }}>
            {filtered.length} shown · {primaryCount} primary · {dependentCount} dependent
          </span>
        )}
      </div>

      <input
        type="text"
        className="input"
        placeholder="Search by name, relationship, primary account, email or phone…"
        aria-label="Search patients"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      <div role="group" aria-label="Filter patients" style={{ display: "flex", gap: "var(--space-2)", flexWrap: "wrap" as const }}>
        {(Object.keys(FILTER_LABEL) as Filter[]).map((f) => (
          <button
            key={f}
            type="button"
            className="button small"
            aria-pressed={filter === f}
            onClick={() => setFilter(f)}
            style={{
              padding: "0 12px",
              fontSize: "var(--text-xs)",
              border: `1.5px solid ${filter === f ? "var(--primary)" : "var(--color-border)"}`,
              background: filter === f ? "var(--color-primary-light)" : "transparent",
              color: filter === f ? "var(--color-primary-dark)" : "var(--color-text-secondary)",
              cursor: "pointer",
            }}
          >
            {FILTER_LABEL[f]}
          </button>
        ))}
      </div>

      {loadError && (
        <p role="alert" style={{ color: "var(--color-error)", fontSize: "var(--text-sm)", margin: 0 }}>{loadError}</p>
      )}

      {!loaded ? (
        <SkeletonRow count={6} />
      ) : filtered.length === 0 ? (
        <p className="muted" style={{ margin: 0, fontSize: "var(--text-sm)" }}>
          {rows.length === 0 ? "No patients yet." : "No patients match your search."}
        </p>
      ) : (
        <div role="list" aria-label="Patients" style={{ display: "grid", gap: "var(--space-2)" }}>
          {filtered.map((p) => {
            const age = calcAge(p.dob);
            const sub =
              p.kind === "primary"
                ? `${p.email}${p.phoneNumber ? ` · ${p.phoneNumber}` : ""}${age !== null ? ` · ${age} yrs` : ""}`
                : `${p.relationship} of ${p.ownerName}${age !== null ? ` · ${age} yrs` : ""}`;
            return (
              <Link
                key={p.key}
                href={p.href}
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
                <Avatar name={p.name} imageUrl={p.photoUrl} size={38} />
                <span style={{ display: "grid", gap: 2, minWidth: 0 }}>
                  <strong style={{ color: "var(--color-text-primary)", fontSize: "var(--text-sm)", display: "flex", alignItems: "center", gap: "0.4rem" }}>
                    {p.name}
                    {p.kind === "dependent" && (
                      <span
                        className="dashboard-status-pill"
                        style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: "0.04em" }}
                      >
                        {p.relationship}
                      </span>
                    )}
                  </strong>
                  <span
                    style={{
                      color: "var(--color-text-secondary)",
                      fontSize: "var(--text-xs)",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {sub}
                  </span>
                </span>
                <span aria-hidden="true" style={{ marginLeft: "auto", color: "var(--color-text-secondary)" }}>→</span>
              </Link>
            );
          })}
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
