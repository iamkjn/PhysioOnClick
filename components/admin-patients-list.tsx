// components/admin-patients-list.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { calcAge } from "@/lib/age";
import { formatPersonName } from "@/lib/name-format";
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
          const name = formatPersonName(data.displayName as string | undefined, "Unnamed");
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
            name: formatPersonName(data.name as string | undefined, "Unnamed"),
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
    <div className="admin-directory">
      <section className="admin-page-hero admin-page-hero--compact">
        <div>
          <span className="dashboard-eyebrow">People</span>
          <h1>Patients</h1>
          <p>Search primary accounts and dependent profiles from one place.</p>
        </div>
        {loaded && (
          <div className="admin-page-metrics" aria-label="Patient counts">
            <span><strong>{filtered.length}</strong> shown</span>
            <span><strong>{primaryCount}</strong> primary</span>
            <span><strong>{dependentCount}</strong> dependent</span>
          </div>
        )}
      </section>

      <div className="admin-directory-toolbar">
        <input
          type="text"
          className="input"
          placeholder="Search by name, relationship, primary account, email or phone..."
          aria-label="Search patients"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <div role="group" aria-label="Filter patients" className="admin-segmented-filter">
          {(Object.keys(FILTER_LABEL) as Filter[]).map((f) => (
            <button
              key={f}
              type="button"
              aria-pressed={filter === f}
              onClick={() => setFilter(f)}
              className={filter === f ? "is-active" : ""}
            >
              {FILTER_LABEL[f]}
            </button>
          ))}
        </div>
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
        <div role="list" aria-label="Patients" className="admin-directory-list">
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
              >
                <Avatar name={p.name} imageUrl={p.photoUrl} size={38} />
                <span className="admin-patient-row-copy">
                  <strong>
                    {p.name}
                    {p.kind === "dependent" && (
                      <span className="dashboard-status-pill admin-patient-kind-pill">
                        {p.relationship}
                      </span>
                    )}
                  </strong>
                  <span>
                    {sub}
                  </span>
                </span>
                <span aria-hidden="true" className="admin-patient-row-arrow">→</span>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
