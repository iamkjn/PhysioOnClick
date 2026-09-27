"use client";

import { useEffect, useMemo, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { Bot, CheckCircle2, Mail, Plus, Send, Sparkles, Trash2 } from "lucide-react";

import { auth, db } from "@/lib/firebase";
import { assignExercise } from "@/lib/recovery";
import { exercises as catalogue, formatDosage, type Exercise, type ExerciseDosage } from "@/lib/exercises";
import { formatPersonName } from "@/lib/name-format";
import { useToast } from "@/components/toast-provider";
import { ExerciseImage } from "@/components/exercise-image";

type Recipient = {
  key: string;
  patientUid: string;
  personId: string;
  name: string;
  email: string;
  description: string;
};

type PlannedExercise = {
  id: string;
  title: string;
  slug: string;
  bodyPart: string;
  condition: string;
  stage: string;
  reason: string;
  dosage: ExerciseDosage;
  dosageLabel: string;
  selected: boolean;
};

type PlanResponse = {
  summary: string;
  safetyNotes: string[];
  exercises: Omit<PlannedExercise, "selected">[];
};

const EMPTY_DOSAGE: ExerciseDosage = {};

function dosageInputValue(value: number | undefined): string {
  return value === undefined ? "" : String(value);
}

function numberOrUndefined(value: string): number | undefined {
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  const parsed = Number(trimmed);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : undefined;
}

function exerciseById(id: string): Exercise | undefined {
  return catalogue.find((exercise) => exercise.id === id);
}

export function AdminAiWorkspace({ adminUid }: { adminUid: string }) {
  const toast = useToast();
  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [loadedRecipients, setLoadedRecipients] = useState(false);
  const [selectedRecipient, setSelectedRecipient] = useState<Recipient | null>(null);
  const [patientSearch, setPatientSearch] = useState("");
  const [manualEmail, setManualEmail] = useState("");
  const [manualName, setManualName] = useState("");
  const [request, setRequest] = useState("");
  const [exerciseSearch, setExerciseSearch] = useState("");
  const [pickedIds, setPickedIds] = useState<string[]>([]);
  const [summary, setSummary] = useState("");
  const [safetyNotes, setSafetyNotes] = useState<string[]>([]);
  const [plan, setPlan] = useState<PlannedExercise[]>([]);
  const [planning, setPlanning] = useState(false);
  const [assigning, setAssigning] = useState(false);
  const [emailing, setEmailing] = useState(false);
  const [note, setNote] = useState("");

  useEffect(() => {
    if (!db) {
      setLoadedRecipients(true);
      return;
    }
    let live = true;
    Promise.all([
      getDocs(collection(db, "patients")),
      getDocs(collection(db, "dependents")),
    ])
      .then(([patientsSnap, dependentsSnap]) => {
        if (!live) return;
        const owners = new Map<string, { name: string; email: string }>();
        const primary: Recipient[] = patientsSnap.docs.map((docSnap) => {
          const data = docSnap.data();
          const name = formatPersonName(data.displayName as string | undefined, "Unnamed patient");
          const email = String(data.email || "");
          owners.set(docSnap.id, { name, email });
          return {
            key: `patient:${docSnap.id}`,
            patientUid: docSnap.id,
            personId: docSnap.id,
            name,
            email,
            description: "Primary patient account",
          };
        });
        const dependents: Recipient[] = dependentsSnap.docs.map((docSnap) => {
          const data = docSnap.data();
          const ownerId = String(data.ownerId || "");
          const owner = owners.get(ownerId);
          const name = formatPersonName(data.name as string | undefined, "Unnamed dependent");
          return {
            key: `dependent:${docSnap.id}`,
            patientUid: ownerId,
            personId: docSnap.id,
            name,
            email: owner?.email ?? "",
            description: `${String(data.relationship || "Dependent")} on ${owner?.name ?? "primary account"}`,
          };
        });
        setRecipients(
          [...primary, ...dependents]
            .filter((recipient) => recipient.email && recipient.patientUid)
            .sort((a, b) => a.name.localeCompare(b.name))
        );
        setLoadedRecipients(true);
      })
      .catch(() => {
        if (!live) return;
        setLoadedRecipients(true);
        toast.show("Could not load patient list.", "error");
      });
    return () => {
      live = false;
    };
  }, [toast]);

  const filteredRecipients = useMemo(() => {
    const q = patientSearch.trim().toLowerCase();
    if (!q) return recipients.slice(0, 8);
    return recipients
      .filter((recipient) => [recipient.name, recipient.email, recipient.description].join(" ").toLowerCase().includes(q))
      .slice(0, 12);
  }, [patientSearch, recipients]);

  const filteredExercises = useMemo(() => {
    const q = exerciseSearch.trim().toLowerCase();
    if (!q) return catalogue.filter((exercise) => !exercise.retired).slice(0, 12);
    return catalogue
      .filter((exercise) => {
        if (exercise.retired) return false;
        return [
          exercise.title,
          exercise.bodyPart,
          exercise.condition,
          exercise.stage,
          exercise.description,
          ...(exercise.tags ?? []),
          ...(exercise.helpsWith ?? []),
        ].join(" ").toLowerCase().includes(q);
      })
      .slice(0, 12);
  }, [exerciseSearch]);

  const selectedPlan = plan.filter((exercise) => exercise.selected);
  const targetEmail = selectedRecipient?.email || manualEmail.trim();
  const targetName = selectedRecipient?.name || manualName.trim();

  function addExercise(exercise: Exercise) {
    setPickedIds((current) => current.includes(exercise.id) ? current : [...current, exercise.id]);
    setPlan((current) => {
      if (current.some((item) => item.id === exercise.id)) return current.map((item) => item.id === exercise.id ? { ...item, selected: true } : item);
      const dosage = exercise.defaultDosage ?? EMPTY_DOSAGE;
      return [
        ...current,
        {
          id: exercise.id,
          title: exercise.title,
          slug: exercise.slug,
          bodyPart: exercise.bodyPart,
          condition: exercise.condition,
          stage: exercise.stage,
          reason: "Added manually from the PhysioOnClick exercise library.",
          dosage,
          dosageLabel: formatDosage(dosage),
          selected: true,
        },
      ];
    });
  }

  function updateDosage(id: string, patch: Partial<ExerciseDosage>) {
    setPlan((current) =>
      current.map((item) => {
        if (item.id !== id) return item;
        const dosage = { ...item.dosage, ...patch };
        return { ...item, dosage, dosageLabel: formatDosage(dosage) };
      })
    );
  }

  async function generatePlan() {
    if (!request.trim() && pickedIds.length === 0) {
      toast.show("Describe what the patient needs or add an exercise first.", "error");
      return;
    }
    const token = await auth?.currentUser?.getIdToken().catch(() => null);
    if (!token) {
      toast.show("Please sign in again.", "error");
      return;
    }
    setPlanning(true);
    try {
      const response = await fetch("/api/admin/assistant/plan", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          request,
          patientName: targetName,
          selectedExerciseIds: pickedIds,
        }),
      });
      const data = (await response.json().catch(() => ({}))) as Partial<PlanResponse> & { error?: string };
      if (!response.ok) throw new Error(data.error || "Could not create plan.");
      setSummary(data.summary || "");
      setSafetyNotes(data.safetyNotes ?? []);
      setPlan((data.exercises ?? []).map((exercise) => ({ ...exercise, selected: true })));
      setPickedIds((data.exercises ?? []).map((exercise) => exercise.id));
      toast.show("AI exercise plan drafted. Review before sending.", "success");
    } catch (error) {
      toast.show(error instanceof Error ? error.message : "Could not create plan.", "error");
    } finally {
      setPlanning(false);
    }
  }

  async function assignSelected() {
    if (!selectedRecipient) {
      toast.show("Select a patient account before assigning.", "error");
      return;
    }
    if (selectedPlan.length === 0) {
      toast.show("Select at least one exercise.", "error");
      return;
    }
    setAssigning(true);
    try {
      for (const item of selectedPlan) {
        await assignExercise(selectedRecipient.patientUid, selectedRecipient.personId, item.id, adminUid, item.dosage);
      }
      toast.show(`${selectedPlan.length} exercise${selectedPlan.length === 1 ? "" : "s"} assigned to ${selectedRecipient.name}.`, "success");
    } catch {
      toast.show("Could not assign all exercises. Please check the patient account.", "error");
    } finally {
      setAssigning(false);
    }
  }

  async function emailSelected() {
    if (!targetEmail) {
      toast.show("Add a recipient email or select a patient.", "error");
      return;
    }
    if (selectedPlan.length === 0) {
      toast.show("Select at least one exercise.", "error");
      return;
    }
    const token = await auth?.currentUser?.getIdToken().catch(() => null);
    if (!token) {
      toast.show("Please sign in again.", "error");
      return;
    }
    setEmailing(true);
    try {
      for (const item of selectedPlan) {
        const source = exerciseById(item.id);
        await fetch("/api/admin/library/share-exercise", {
          method: "POST",
          headers: {
            "content-type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            toEmail: targetEmail,
            toName: targetName,
            exerciseTitle: item.title,
            exerciseSlug: item.slug,
            exerciseDescription: source?.description ?? item.reason,
            setup: source?.setup ?? "",
            steps: source?.steps ?? [],
            cues: source?.cues ?? [],
            note: [item.reason, item.dosageLabel, note].filter(Boolean).join("\n\n"),
          }),
        }).then(async (res) => {
          if (!res.ok) {
            const data = (await res.json().catch(() => ({}))) as { error?: string };
            throw new Error(data.error || "Email failed");
          }
        });
      }
      toast.show(`${selectedPlan.length} exercise email${selectedPlan.length === 1 ? "" : "s"} sent.`, "success");
    } catch (error) {
      toast.show(error instanceof Error ? error.message : "Could not email all exercises.", "error");
    } finally {
      setEmailing(false);
    }
  }

  return (
    <div className="admin-ai-workspace">
      <section className="admin-page-hero admin-page-hero--compact">
        <div>
          <span className="dashboard-eyebrow">Admin AI assistant</span>
          <h1>Exercise plan co-pilot</h1>
          <p>Ask for a patient plan, review the chosen library exercises and dose, then assign to the patient account or email the plan.</p>
        </div>
        <div className="admin-page-metrics">
          <span><strong>{catalogue.filter((exercise) => !exercise.retired).length}</strong> library exercises</span>
          <span><strong>{selectedPlan.length}</strong> selected</span>
        </div>
      </section>

      <div className="admin-ai-workspace-grid">
        <section className="panel admin-ai-card">
          <div className="admin-ai-card-head">
            <Sparkles aria-hidden="true" />
            <div>
              <h2>Tell the assistant what you need</h2>
              <p>Include body area, diagnosis/impression, irritability, goal and any precautions.</p>
            </div>
          </div>
          <textarea
            className="input"
            rows={7}
            value={request}
            onChange={(event) => setRequest(event.target.value)}
            placeholder="Example: Anish has low back pain with sitting intolerance, pain 6/10, no red flags, needs gentle starter exercises and advice for desk work."
          />
          <button type="button" className="button admin-hero-primary" onClick={() => void generatePlan()} disabled={planning}>
            <Bot aria-hidden="true" />
            {planning ? "Drafting..." : "Draft exercise plan"}
          </button>

          <div className="admin-ai-manual-add">
            <label className="admin-library-field">
              <span>Add exercises manually</span>
              <input className="input" value={exerciseSearch} onChange={(event) => setExerciseSearch(event.target.value)} placeholder="Search catalogue..." />
            </label>
            <div className="admin-ai-mini-list">
              {filteredExercises.map((exercise) => (
                <button key={exercise.id} type="button" onClick={() => addExercise(exercise)}>
                  <Plus aria-hidden="true" />
                  <span>{exercise.title}</span>
                  <small>{exercise.bodyPart} · {exercise.condition}</small>
                </button>
              ))}
            </div>
          </div>
        </section>

        <section className="panel admin-ai-card admin-ai-plan-card">
          <div className="admin-ai-card-head">
            <CheckCircle2 aria-hidden="true" />
            <div>
              <h2>Review plan</h2>
              <p>Nothing is sent or assigned until you confirm it here.</p>
            </div>
          </div>

          {summary && <p className="admin-ai-plan-summary">{summary}</p>}
          {safetyNotes.length > 0 && (
            <ul className="admin-ai-safety-list">
              {safetyNotes.map((item, index) => <li key={index}>{item}</li>)}
            </ul>
          )}

          {plan.length === 0 ? (
            <div className="clinical-picker__empty">
              <strong>No draft yet</strong>
              <span>Ask the assistant to draft a plan, or add exercises manually.</span>
            </div>
          ) : (
            <div className="admin-ai-plan-list">
              {plan.map((item) => {
                const source = exerciseById(item.id);
                return (
                  <article key={item.id} className={`admin-ai-plan-item${item.selected ? " is-selected" : ""}`}>
                    {source && <ExerciseImage exerciseId={source.id} name={source.title} pose={source.pose} size={76} />}
                    <div className="admin-ai-plan-item-copy">
                      <label>
                        <input
                          type="checkbox"
                          checked={item.selected}
                          onChange={(event) => setPlan((current) => current.map((candidate) => candidate.id === item.id ? { ...candidate, selected: event.target.checked } : candidate))}
                        />
                        <strong>{item.title}</strong>
                      </label>
                      <span>{item.stage} · {item.condition}</span>
                      <p>{item.reason}</p>
                    </div>
                    <div className="admin-ai-dose-grid">
                      <input aria-label={`${item.title} sets`} placeholder="Sets" value={dosageInputValue(item.dosage.sets)} onChange={(event) => updateDosage(item.id, { sets: numberOrUndefined(event.target.value) })} />
                      <input aria-label={`${item.title} reps`} placeholder="Reps" value={dosageInputValue(item.dosage.reps)} onChange={(event) => updateDosage(item.id, { reps: numberOrUndefined(event.target.value) })} />
                      <input aria-label={`${item.title} hold seconds`} placeholder="Hold s" value={dosageInputValue(item.dosage.holdSeconds)} onChange={(event) => updateDosage(item.id, { holdSeconds: numberOrUndefined(event.target.value) })} />
                      <input aria-label={`${item.title} per day`} placeholder="/day" value={dosageInputValue(item.dosage.perDay)} onChange={(event) => updateDosage(item.id, { perDay: numberOrUndefined(event.target.value) })} />
                      <input aria-label={`${item.title} per week`} placeholder="/week" value={dosageInputValue(item.dosage.perWeek)} onChange={(event) => updateDosage(item.id, { perWeek: numberOrUndefined(event.target.value) })} />
                      <button type="button" aria-label={`Remove ${item.title}`} onClick={() => setPlan((current) => current.filter((candidate) => candidate.id !== item.id))}>
                        <Trash2 aria-hidden="true" />
                      </button>
                    </div>
                    <input
                      className="input admin-ai-dose-note"
                      value={item.dosage.notes ?? ""}
                      onChange={(event) => updateDosage(item.id, { notes: event.target.value || undefined })}
                      placeholder="Dose notes for the patient..."
                    />
                  </article>
                );
              })}
            </div>
          )}
        </section>

        <section className="panel admin-ai-card">
          <div className="admin-ai-card-head">
            <Send aria-hidden="true" />
            <div>
              <h2>Assign or send</h2>
              <p>Select an existing patient account, or use any email address.</p>
            </div>
          </div>

          <label className="admin-library-field">
            <span>Find patient</span>
            <input className="input" value={patientSearch} onChange={(event) => setPatientSearch(event.target.value)} placeholder="Search name, dependent, email..." />
          </label>
          <div className="admin-ai-recipient-list">
            {!loadedRecipients ? (
              <p className="muted">Loading patients...</p>
            ) : filteredRecipients.length === 0 ? (
              <p className="muted">No matches. You can enter an email manually.</p>
            ) : (
              filteredRecipients.map((recipient) => (
                <button
                  key={recipient.key}
                  type="button"
                  className={selectedRecipient?.key === recipient.key ? "is-selected" : ""}
                  onClick={() => {
                    setSelectedRecipient(recipient);
                    setPatientSearch(recipient.name);
                    setManualEmail("");
                    setManualName("");
                  }}
                >
                  <strong>{recipient.name}</strong>
                  <span>{recipient.email}</span>
                  <small>{recipient.description}</small>
                </button>
              ))
            )}
          </div>

          <div className="admin-ai-or"><span>or email manually</span></div>
          <label className="admin-library-field">
            <span>Email</span>
            <input
              className="input"
              type="email"
              value={manualEmail}
              onChange={(event) => {
                setManualEmail(event.target.value);
                setSelectedRecipient(null);
              }}
              placeholder="patient@example.com"
            />
          </label>
          <label className="admin-library-field">
            <span>Name, optional</span>
            <input className="input" value={manualName} onChange={(event) => setManualName(event.target.value)} placeholder="Patient name" />
          </label>
          <label className="admin-library-field">
            <span>Optional note</span>
            <textarea className="input" rows={3} value={note} onChange={(event) => setNote(event.target.value)} placeholder="Add clinical context, frequency reminder or precautions." />
          </label>

          <div className="admin-ai-action-grid">
            <button type="button" className="button secondary" onClick={() => void assignSelected()} disabled={assigning || !selectedRecipient || selectedPlan.length === 0}>
              <CheckCircle2 aria-hidden="true" />
              {assigning ? "Assigning..." : "Assign to account"}
            </button>
            <button type="button" className="button admin-hero-primary" onClick={() => void emailSelected()} disabled={emailing || !targetEmail || selectedPlan.length === 0}>
              <Mail aria-hidden="true" />
              {emailing ? "Sending..." : "Email selected"}
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
