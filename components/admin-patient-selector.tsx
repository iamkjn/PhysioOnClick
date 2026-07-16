// components/admin-patient-selector.tsx
"use client";

import { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { getDependents } from "@/lib/dependents";
import { SkeletonRow } from "@/components/skeleton";
import { useToast } from "@/components/toast-provider";

interface PatientRecord {
  uid: string;
  displayName: string;
  email: string;
}

interface Props {
  onSelect: (patientUid: string, personId: string, personName: string) => void;
}

// Lightweight roving-focus for the two option lists below — native <button>
// elements already work with Tab + Enter/Space, this just adds Up/Down as a
// progressive enhancement for fast keyboard-driven patient lookup.
function handleOptionListKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
  if (e.key !== "ArrowDown" && e.key !== "ArrowUp") return;
  const buttons = Array.from(e.currentTarget.querySelectorAll<HTMLButtonElement>("button"));
  const currentIndex = buttons.indexOf(document.activeElement as HTMLButtonElement);
  if (currentIndex === -1) return;
  e.preventDefault();
  const nextIndex = e.key === "ArrowDown"
    ? (currentIndex + 1) % buttons.length
    : (currentIndex - 1 + buttons.length) % buttons.length;
  buttons[nextIndex]?.focus();
}

export function AdminPatientSelector({ onSelect }: Props) {
  const [patients, setPatients] = useState<PatientRecord[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [selectedPatient, setSelectedPatient] = useState<PatientRecord | null>(null);
  const [personOptions, setPersonOptions] = useState<{ id: string; name: string }[]>([]);
  const [selectedPersonId, setSelectedPersonId] = useState<string | null>(null);
  const toast = useToast();

  useEffect(() => {
    if (!db) { setLoaded(true); return; }
    getDocs(collection(db, "patients"))
      .then((snap) => {
        setPatients(
          snap.docs.map((d) => ({
            uid: d.id,
            displayName: (d.data().displayName as string) || "Unnamed",
            email: (d.data().email as string) || "",
          }))
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

  async function selectPatient(p: PatientRecord) {
    setSelectedPatient(p);
    const deps = await getDependents(p.uid);
    const options = [
      { id: p.uid, name: `${p.displayName} (account holder)` },
      ...deps.map((d) => ({ id: d.id, name: `${d.name} (${d.relationship})` })),
    ];
    setPersonOptions(options);
    setSelectedPersonId(p.uid);
    onSelect(p.uid, p.uid, p.displayName);
  }

  function selectPerson(personId: string, personName: string) {
    if (!selectedPatient) return;
    setSelectedPersonId(personId);
    onSelect(selectedPatient.uid, personId, personName);
  }

  const filtered = patients.filter(
    (p) =>
      p.displayName.toLowerCase().includes(search.toLowerCase()) ||
      p.email.toLowerCase().includes(search.toLowerCase())
  );

  if (!loaded) {
    return (
      <div className="panel stack">
        <h2 style={{ fontSize: "var(--text-lg)", margin: 0 }}>Select patient</h2>
        <SkeletonRow count={4} />
      </div>
    );
  }

  return (
    <div className="panel stack">
      {/* h2, not h3 — this panel is the first content section under the
          page's h1, and AdminExerciseAssigner/AdminClinicalEntry below it
          are also h2, so the recovery page reads h1 → h2 with no skipped
          level. Font-size is pinned to the old h3 size so nothing visually
          changes. */}
      <h2 style={{ fontSize: "var(--text-lg)", margin: 0 }}>Select patient</h2>
      <input
        type="text"
        className="input"
        placeholder="Search by name or email…"
        aria-label="Search patients by name or email"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />
      {loadError && (
        <p role="alert" style={{ color: "var(--color-error)", fontSize: 14, margin: 0 }}>{loadError}</p>
      )}
      {!selectedPatient && (
        <div
          role="group"
          aria-label="Patients"
          onKeyDown={handleOptionListKeyDown}
          style={{ display: "grid", gap: "0.5rem", maxHeight: 240, overflowY: "auto" }}
        >
          {filtered.map((p) => (
            <button
              key={p.uid}
              className="admin-selector-row"
              onClick={() => void selectPatient(p)}
              style={{
                textAlign: "left",
                background: "var(--color-bg)",
                border: "1px solid var(--color-border)",
                borderRadius: "var(--radius-chip)",
                padding: "0.6rem 0.85rem",
                cursor: "pointer",
                fontSize: 14,
                transition: "background-color 140ms ease, border-color 140ms ease",
              }}
            >
              <strong style={{ color: "var(--color-text-primary)" }}>{p.displayName}</strong>
              <span style={{ color: "var(--color-text-secondary)", marginLeft: 8 }}>{p.email}</span>
            </button>
          ))}
          {filtered.length === 0 && (
            <p className="muted" style={{ margin: 0, fontSize: 14 }}>No patients match &ldquo;{search}&rdquo;.</p>
          )}
        </div>
      )}
      {selectedPatient && personOptions.length > 1 && (
        <div style={{ display: "grid", gap: "0.5rem" }}>
          <p className="muted" style={{ fontSize: 14 }}>Select person:</p>
          <div role="group" aria-label="People on this account" onKeyDown={handleOptionListKeyDown} style={{ display: "grid", gap: "0.5rem" }}>
            {personOptions.map((opt) => {
              const isSelected = selectedPersonId === opt.id;
              return (
                <button
                  key={opt.id}
                  className={`admin-selector-row${isSelected ? " is-selected" : ""}`}
                  aria-pressed={isSelected}
                  onClick={() => selectPerson(opt.id, opt.name)}
                  style={{
                    textAlign: "left",
                    // Selected = tint bg + accent border, never a solid fill.
                    background: isSelected ? "var(--color-primary-light)" : "var(--color-bg)",
                    border: `1.5px solid ${isSelected ? "var(--primary)" : "var(--color-border)"}`,
                    borderRadius: "var(--radius-chip)",
                    padding: "0.6rem 0.85rem",
                    cursor: "pointer",
                    fontSize: 14,
                    fontWeight: isSelected ? 700 : 400,
                    color: isSelected ? "var(--primary-dark)" : "var(--color-text-primary)",
                    transition: "background-color 140ms ease, border-color 140ms ease",
                  }}
                >
                  {opt.name}
                </button>
              );
            })}
          </div>
        </div>
      )}
      {selectedPatient && (
        <button
          onClick={() => {
            setSelectedPatient(null);
            setPersonOptions([]);
            setSelectedPersonId(null);
          }}
          style={{
            background: "none",
            border: "none",
            color: "var(--primary)",
            cursor: "pointer",
            fontSize: 14,
            fontWeight: 600,
            textAlign: "left",
            padding: "0.4rem 0",
          }}
        >
          ← Change patient
        </button>
      )}

      {/* Scoped hover for the selector rows above — see report for the
          recommended shared class this duplicates. */}
      <style>{`
        .admin-selector-row:not(.is-selected):hover { background: var(--surface-alt); }
      `}</style>
    </div>
  );
}
