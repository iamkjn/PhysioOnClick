// components/admin-patient-selector.tsx
"use client";

import { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { getDependents } from "@/lib/dependents";

interface PatientRecord {
  uid: string;
  displayName: string;
  email: string;
}

interface Props {
  onSelect: (patientUid: string, personId: string, personName: string) => void;
}

export function AdminPatientSelector({ onSelect }: Props) {
  const [patients, setPatients] = useState<PatientRecord[]>([]);
  const [search, setSearch] = useState("");
  const [selectedPatient, setSelectedPatient] = useState<PatientRecord | null>(null);
  const [personOptions, setPersonOptions] = useState<{ id: string; name: string }[]>([]);

  useEffect(() => {
    if (!db) return;
    getDocs(collection(db, "patients")).then((snap) => {
      setPatients(
        snap.docs.map((d) => ({
          uid: d.id,
          displayName: (d.data().displayName as string) || "Unnamed",
          email: (d.data().email as string) || "",
        }))
      );
    });
  }, []);

  async function selectPatient(p: PatientRecord) {
    setSelectedPatient(p);
    const deps = await getDependents(p.uid);
    const options = [
      { id: p.uid, name: `${p.displayName} (account holder)` },
      ...deps.map((d) => ({ id: d.id, name: `${d.name} (${d.relationship})` })),
    ];
    setPersonOptions(options);
    onSelect(p.uid, p.uid, p.displayName);
  }

  const filtered = patients.filter(
    (p) =>
      p.displayName.toLowerCase().includes(search.toLowerCase()) ||
      p.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="panel stack">
      <h3>Select patient</h3>
      <input
        type="text"
        placeholder="Search by name or email…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        style={{
          padding: "0.6rem 0.85rem",
          border: "1px solid #D1E8EE",
          borderRadius: 10,
          fontSize: 14,
          width: "100%",
          boxSizing: "border-box",
        }}
      />
      {!selectedPatient && (
        <div style={{ display: "grid", gap: "0.5rem", maxHeight: 240, overflowY: "auto" }}>
          {filtered.map((p) => (
            <button
              key={p.uid}
              onClick={() => void selectPatient(p)}
              style={{
                textAlign: "left",
                background: "#F8FBFD",
                border: "1px solid #D1E8EE",
                borderRadius: 10,
                padding: "0.6rem 0.85rem",
                cursor: "pointer",
                fontSize: 14,
              }}
            >
              <strong style={{ color: "#0C2A38" }}>{p.displayName}</strong>
              <span style={{ color: "#5E7A84", marginLeft: 8 }}>{p.email}</span>
            </button>
          ))}
        </div>
      )}
      {selectedPatient && personOptions.length > 1 && (
        <div style={{ display: "grid", gap: "0.5rem" }}>
          <p className="muted">Select person:</p>
          {personOptions.map((opt) => (
            <button
              key={opt.id}
              onClick={() => onSelect(selectedPatient.uid, opt.id, opt.name)}
              style={{
                textAlign: "left",
                background: "#F8FBFD",
                border: "1px solid #D1E8EE",
                borderRadius: 10,
                padding: "0.6rem 0.85rem",
                cursor: "pointer",
                fontSize: 14,
                color: "#0C2A38",
              }}
            >
              {opt.name}
            </button>
          ))}
        </div>
      )}
      {selectedPatient && (
        <button
          onClick={() => {
            setSelectedPatient(null);
            setPersonOptions([]);
          }}
          style={{
            background: "none",
            border: "none",
            color: "#0891B2",
            cursor: "pointer",
            fontSize: 13,
            textAlign: "left",
          }}
        >
          ← Change patient
        </button>
      )}
    </div>
  );
}
