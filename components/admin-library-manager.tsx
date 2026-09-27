"use client";

import { useEffect, useMemo, useState } from "react";
import { collection, doc, getDocs, serverTimestamp, setDoc } from "firebase/firestore";
import { CheckCircle2, Mail, Plus, Search, Send } from "lucide-react";
import { db, auth } from "@/lib/firebase";
import { exercises, type Exercise } from "@/lib/exercises";
import { selfTests, type SelfTest, type SelfTestStep } from "@/lib/self-tests";
import { ExerciseImage } from "@/components/exercise-image";
import { SelfTestImage } from "@/components/exercise-library/self-test-image";
import { SkeletonRow } from "@/components/skeleton";
import { useToast } from "@/components/toast-provider";

type LibraryKind = "exercise" | "selfTest";
type ReviewStatus = "draft" | "needs-review" | "reviewed";

type ExerciseFields = {
  id: string;
  slug: string;
  title: string;
  bodyPart: string;
  clinicalArea: string;
  condition: string;
  stage: string;
  description: string;
  setup: string;
  tags: string[];
  equipment: string[];
  steps: string[];
  cues: string[];
  mistakes: string[];
  reviewedBy: string;
  reviewNotes: string;
  status: ReviewStatus;
};

type SelfTestFields = {
  slug: string;
  name: string;
  bodyArea: string;
  assesses: string;
  whatItChecks: string;
  whoShouldNotDoThis: string;
  conditionSlugs: string[];
  steps: SelfTestStep[];
  negativeResult: string[];
  positiveResult: string[];
  tips: string[];
  interpretation: string;
  reviewedBy: string;
  reviewedOn: string;
  reviewNotes: string;
  status: ReviewStatus;
};

type ExerciseRecord = ExerciseFields & {
  key: string;
  source: "catalogue" | "draft";
  saved: boolean;
};

type SelfTestRecord = SelfTestFields & {
  key: string;
  source: "catalogue" | "draft";
  saved: boolean;
};

type SavedRecord = Partial<Omit<ExerciseFields, "steps"> & Omit<SelfTestFields, "steps">> & {
  steps?: string[] | SelfTestStep[];
  source?: "catalogue" | "draft";
  sourceId?: string;
  kind?: LibraryKind;
};

type ShareRecipient = {
  key: string;
  name: string;
  email: string;
  description: string;
};

type SharePanelState = {
  open: boolean;
  exercise: ExerciseRecord | null;
  email: string;
  name: string;
  note: string;
  search: string;
  sending: boolean;
};

const EMPTY_EXERCISE: ExerciseFields = {
  id: "",
  slug: "",
  title: "",
  bodyPart: "",
  clinicalArea: "",
  condition: "",
  stage: "",
  description: "",
  setup: "",
  tags: [],
  equipment: [],
  steps: [],
  cues: [],
  mistakes: [],
  reviewedBy: "",
  reviewNotes: "",
  status: "draft",
};

const EMPTY_SELF_TEST: SelfTestFields = {
  slug: "",
  name: "",
  bodyArea: "",
  assesses: "",
  whatItChecks: "",
  whoShouldNotDoThis: "",
  conditionSlugs: [],
  steps: [],
  negativeResult: [],
  positiveResult: [],
  tips: [],
  interpretation: "",
  reviewedBy: "",
  reviewedOn: "",
  reviewNotes: "",
  status: "draft",
};

function lines(value: string): string[] {
  return value.split("\n").map((line) => line.trim()).filter(Boolean);
}

function csv(value: string): string[] {
  return value.split(",").map((item) => item.trim()).filter(Boolean);
}

function asMultiline(value: string[] | undefined): string {
  return (value ?? []).join("\n");
}

function asCsv(value: string[] | undefined): string {
  return (value ?? []).join(", ");
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function exerciseFromStatic(exercise: Exercise): ExerciseRecord {
  return {
    key: exercise.id,
    id: exercise.id,
    slug: exercise.slug,
    title: exercise.title,
    bodyPart: exercise.bodyPart,
    clinicalArea: exercise.clinicalArea,
    condition: exercise.condition,
    stage: exercise.stage,
    description: exercise.description,
    setup: exercise.setup ?? "",
    tags: exercise.tags ?? [],
    equipment: exercise.equipment ?? [],
    steps: exercise.steps ?? [],
    cues: exercise.cues ?? [],
    mistakes: exercise.mistakes ?? [],
    reviewedBy: "",
    reviewNotes: "",
    status: exercise.retired ? "needs-review" : "reviewed",
    source: "catalogue",
    saved: false,
  };
}

function selfTestFromStatic(test: SelfTest): SelfTestRecord {
  return {
    key: test.slug,
    slug: test.slug,
    name: test.name,
    bodyArea: test.bodyArea,
    assesses: test.assesses,
    whatItChecks: test.whatItChecks,
    whoShouldNotDoThis: test.whoShouldNotDoThis,
    conditionSlugs: test.conditionSlugs,
    steps: test.steps,
    negativeResult: test.negativeResult,
    positiveResult: test.positiveResult,
    tips: test.tips,
    interpretation: test.interpretation,
    reviewedBy: test.reviewedBy,
    reviewedOn: test.reviewedOn,
    reviewNotes: "",
    status: "reviewed",
    source: "catalogue",
    saved: false,
  };
}

function parseSteps(value: string): SelfTestStep[] {
  return value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line, index) => {
      const [label = `Step ${index + 1}`, instruction = "", imageId = ""] = line.split("|").map((part) => part.trim());
      return {
        label,
        instruction: instruction.split(";").map((part) => part.trim()).filter(Boolean),
        imageId,
      };
    });
}

function stepsToText(steps: SelfTestStep[] | undefined): string {
  return (steps ?? [])
    .map((step) => `${step.label} | ${step.instruction.join("; ")} | ${step.imageId}`)
    .join("\n");
}

function isSelfTestStepArray(value: unknown): value is SelfTestStep[] {
  return Array.isArray(value) && value.every((step) => typeof step === "object" && step !== null && "label" in step);
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === "string");
}

function mergeExercise(base: ExerciseRecord, saved?: SavedRecord): ExerciseRecord {
  if (!saved) return base;
  const { steps: savedSteps, ...savedFields } = saved;
  return {
    ...base,
    ...savedFields,
    steps: isStringArray(savedSteps) ? savedSteps : base.steps,
    key: base.key,
    source: (saved.source as "catalogue" | "draft" | undefined) ?? base.source,
    saved: true,
  };
}

function mergeSelfTest(base: SelfTestRecord, saved?: SavedRecord): SelfTestRecord {
  if (!saved) return base;
  const { steps: savedSteps, ...savedFields } = saved;
  return {
    ...base,
    ...savedFields,
    steps: isSelfTestStepArray(savedSteps) ? savedSteps : base.steps,
    key: base.key,
    source: (saved.source as "catalogue" | "draft" | undefined) ?? base.source,
    saved: true,
  };
}

function statusLabel(status: ReviewStatus) {
  if (status === "needs-review") return "Needs review";
  if (status === "reviewed") return "Reviewed";
  return "Draft";
}

function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

export function AdminLibraryManager() {
  const toast = useToast();
  const [activeKind, setActiveKind] = useState<LibraryKind>("exercise");
  const [queryText, setQueryText] = useState("");
  const [savedExercises, setSavedExercises] = useState<Record<string, SavedRecord>>({});
  const [savedSelfTests, setSavedSelfTests] = useState<Record<string, SavedRecord>>({});
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [exerciseForm, setExerciseForm] = useState(EMPTY_EXERCISE);
  const [selfTestForm, setSelfTestForm] = useState(EMPTY_SELF_TEST);
  const [exerciseText, setExerciseText] = useState({
    tags: "",
    equipment: "",
    steps: "",
    cues: "",
    mistakes: "",
  });
  const [selfTestText, setSelfTestText] = useState({
    conditionSlugs: "",
    steps: "",
    negativeResult: "",
    positiveResult: "",
    tips: "",
  });
  const [shareRecipients, setShareRecipients] = useState<ShareRecipient[]>([]);
  const [shareRecipientsLoaded, setShareRecipientsLoaded] = useState(false);
  const [sharePanel, setSharePanel] = useState<SharePanelState>({
    open: false,
    exercise: null,
    email: "",
    name: "",
    note: "",
    search: "",
    sending: false,
  });

  useEffect(() => {
    if (!db) {
      setLoaded(true);
      return;
    }
    let live = true;
    Promise.all([
      getDocs(collection(db, "admin", "library", "exercises")),
      getDocs(collection(db, "admin", "library", "selfTests")),
    ])
      .then(([exerciseSnap, selfTestSnap]) => {
        if (!live) return;
        setSavedExercises(Object.fromEntries(exerciseSnap.docs.map((d) => [d.id, d.data() as SavedRecord])));
        setSavedSelfTests(Object.fromEntries(selfTestSnap.docs.map((d) => [d.id, d.data() as SavedRecord])));
        setLoaded(true);
      })
      .catch(() => {
        if (!live) return;
        toast.show("Could not load admin library drafts.", "error");
        setLoaded(true);
      });
    return () => {
      live = false;
    };
  }, [toast]);

  useEffect(() => {
    if (!db) {
      setShareRecipientsLoaded(true);
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
        const patients: ShareRecipient[] = patientsSnap.docs.map((d) => {
          const data = d.data();
          const name = String(data.displayName || "Unnamed patient").trim();
          const email = String(data.email || "").trim();
          owners.set(d.id, { name, email });
          return {
            key: `patient:${d.id}`,
            name,
            email,
            description: "Primary patient account",
          };
        });
        const dependents: ShareRecipient[] = dependentsSnap.docs.map((d) => {
          const data = d.data();
          const owner = owners.get(String(data.ownerId || ""));
          const name = String(data.name || "Unnamed dependent").trim();
          return {
            key: `dependent:${d.id}`,
            name,
            email: owner?.email ?? "",
            description: `${String(data.relationship || "Dependent")} on ${owner?.name ?? "primary account"}`,
          };
        });
        setShareRecipients(
          [...patients, ...dependents]
            .filter((recipient) => recipient.email)
            .sort((a, b) => a.name.localeCompare(b.name))
        );
        setShareRecipientsLoaded(true);
      })
      .catch(() => {
        if (!live) return;
        setShareRecipientsLoaded(true);
      });
    return () => {
      live = false;
    };
  }, []);

  const exerciseRows = useMemo(() => {
    const staticRows = exercises.map(exerciseFromStatic).map((row) => mergeExercise(row, savedExercises[row.key]));
    const staticKeys = new Set(staticRows.map((row) => row.key));
    const drafts = Object.entries(savedExercises)
      .filter(([key, record]) => !staticKeys.has(key) || record.source === "draft")
      .map(([key, record]): ExerciseRecord => {
        const { steps: savedSteps, ...fields } = record;
        return {
          ...EMPTY_EXERCISE,
          ...fields,
          steps: isStringArray(savedSteps) ? savedSteps : [],
          key,
          id: String(record.id || key),
          slug: String(record.slug || key),
          title: String(record.title || "Untitled exercise"),
          source: "draft" as const,
          saved: true,
        };
      });
    return [...drafts, ...staticRows];
  }, [savedExercises]);

  const selfTestRows = useMemo(() => {
    const staticRows = selfTests.map(selfTestFromStatic).map((row) => mergeSelfTest(row, savedSelfTests[row.key]));
    const staticKeys = new Set(staticRows.map((row) => row.key));
    const drafts = Object.entries(savedSelfTests)
      .filter(([key, record]) => !staticKeys.has(key) || record.source === "draft")
      .map(([key, record]): SelfTestRecord => {
        const { steps: savedSteps, ...fields } = record;
        return {
          ...EMPTY_SELF_TEST,
          ...fields,
          steps: isSelfTestStepArray(savedSteps) ? savedSteps : [],
          key,
          slug: String(record.slug || key),
          name: String(record.name || "Untitled self-test"),
          source: "draft" as const,
          saved: true,
        };
      });
    return [...drafts, ...staticRows];
  }, [savedSelfTests]);

  const filteredExercises = useMemo(() => {
    const q = queryText.trim().toLowerCase();
    if (!q) return exerciseRows;
    return exerciseRows.filter((item) =>
      [item.title, item.slug, item.bodyPart, item.condition, item.stage, item.description, ...item.tags]
        .join(" ")
        .toLowerCase()
        .includes(q)
    );
  }, [exerciseRows, queryText]);

  const filteredSelfTests = useMemo(() => {
    const q = queryText.trim().toLowerCase();
    if (!q) return selfTestRows;
    return selfTestRows.filter((item) =>
      [item.name, item.slug, item.bodyArea, item.assesses, item.whatItChecks, ...item.conditionSlugs]
        .join(" ")
        .toLowerCase()
        .includes(q)
    );
  }, [selfTestRows, queryText]);

  const selectedExercise = activeKind === "exercise"
    ? exerciseRows.find((item) => item.key === selectedKey) ?? null
    : null;
  const selectedSelfTest = activeKind === "selfTest"
    ? selfTestRows.find((item) => item.key === selectedKey) ?? null
    : null;

  function selectExercise(item: ExerciseRecord) {
    setActiveKind("exercise");
    setSelectedKey(item.key);
    setExerciseForm(item);
    setExerciseText({
      tags: asCsv(item.tags),
      equipment: asMultiline(item.equipment),
      steps: asMultiline(item.steps),
      cues: asMultiline(item.cues),
      mistakes: asMultiline(item.mistakes),
    });
  }

  function selectSelfTest(item: SelfTestRecord) {
    setActiveKind("selfTest");
    setSelectedKey(item.key);
    setSelfTestForm(item);
    setSelfTestText({
      conditionSlugs: asCsv(item.conditionSlugs),
      steps: stepsToText(item.steps),
      negativeResult: asMultiline(item.negativeResult),
      positiveResult: asMultiline(item.positiveResult),
      tips: asMultiline(item.tips),
    });
  }

  function newExercise() {
    const draft = {
      ...EMPTY_EXERCISE,
      id: `admin-ex-${Date.now()}`,
      status: "draft" as const,
      reviewedBy: auth?.currentUser?.displayName || "Admin",
    };
    setActiveKind("exercise");
    setSelectedKey(null);
    setExerciseForm(draft);
    setExerciseText({ tags: "", equipment: "", steps: "", cues: "", mistakes: "" });
  }

  function newSelfTest() {
    const draft = {
      ...EMPTY_SELF_TEST,
      status: "draft" as const,
      reviewedBy: auth?.currentUser?.displayName || "Admin",
      reviewedOn: new Date().toISOString().slice(0, 10),
    };
    setActiveKind("selfTest");
    setSelectedKey(null);
    setSelfTestForm(draft);
    setSelfTestText({ conditionSlugs: "", steps: "", negativeResult: "", positiveResult: "", tips: "" });
  }

  async function saveExercise() {
    if (!db) return;
    const slug = exerciseForm.slug.trim() || slugify(exerciseForm.title);
    const id = exerciseForm.id.trim() || `admin-ex-${slug}`;
    if (!slug || !exerciseForm.title.trim()) {
      toast.show("Add an exercise title and slug before saving.", "error");
      return;
    }
    const existingStatic = exercises.some((exercise) => exercise.id === id);
    const record: ExerciseFields & { source: "catalogue" | "draft"; sourceId: string; kind: LibraryKind; updatedBy?: string; updatedAt?: unknown } = {
      ...exerciseForm,
      id,
      slug,
      title: exerciseForm.title.trim(),
      tags: csv(exerciseText.tags),
      equipment: lines(exerciseText.equipment),
      steps: lines(exerciseText.steps),
      cues: lines(exerciseText.cues),
      mistakes: lines(exerciseText.mistakes),
      source: existingStatic ? "catalogue" : "draft",
      sourceId: id,
      kind: "exercise",
      updatedBy: auth?.currentUser?.uid,
      updatedAt: serverTimestamp(),
    };
    setSaving(true);
    try {
      await setDoc(doc(db, "admin", "library", "exercises", id), record, { merge: true });
      setSavedExercises((prev) => ({ ...prev, [id]: record }));
      setSelectedKey(id);
      toast.show("Exercise draft saved.", "success");
    } catch {
      toast.show("Could not save this exercise draft.", "error");
    } finally {
      setSaving(false);
    }
  }

  async function saveSelfTest() {
    if (!db) return;
    const slug = selfTestForm.slug.trim() || slugify(selfTestForm.name);
    if (!slug || !selfTestForm.name.trim()) {
      toast.show("Add a self-test name and slug before saving.", "error");
      return;
    }
    const existingStatic = selfTests.some((test) => test.slug === slug);
    const record: SelfTestFields & { source: "catalogue" | "draft"; sourceId: string; kind: LibraryKind; updatedBy?: string; updatedAt?: unknown } = {
      ...selfTestForm,
      slug,
      name: selfTestForm.name.trim(),
      conditionSlugs: csv(selfTestText.conditionSlugs),
      steps: parseSteps(selfTestText.steps),
      negativeResult: lines(selfTestText.negativeResult),
      positiveResult: lines(selfTestText.positiveResult),
      tips: lines(selfTestText.tips),
      source: existingStatic ? "catalogue" : "draft",
      sourceId: slug,
      kind: "selfTest",
      updatedBy: auth?.currentUser?.uid,
      updatedAt: serverTimestamp(),
    };
    setSaving(true);
    try {
      await setDoc(doc(db, "admin", "library", "selfTests", slug), record, { merge: true });
      setSavedSelfTests((prev) => ({ ...prev, [slug]: record }));
      setSelectedKey(slug);
      toast.show("Self-test draft saved.", "success");
    } catch {
      toast.show("Could not save this self-test draft.", "error");
    } finally {
      setSaving(false);
    }
  }

  function openSharePanel(exercise: ExerciseRecord) {
    setSharePanel({
      open: true,
      exercise,
      email: "",
      name: "",
      note: "",
      search: "",
      sending: false,
    });
  }

  function selectShareRecipient(recipient: ShareRecipient) {
    setSharePanel((prev) => ({
      ...prev,
      email: recipient.email,
      name: recipient.name,
      search: recipient.name,
    }));
  }

  async function sendExerciseShare() {
    const exercise = sharePanel.exercise;
    const email = sharePanel.email.trim().toLowerCase();
    if (!exercise) return;
    if (!isValidEmail(email)) {
      toast.show("Enter a valid recipient email.", "error");
      return;
    }
    const token = await auth?.currentUser?.getIdToken().catch(() => null);
    if (!token) {
      toast.show("Please sign in again before sending.", "error");
      return;
    }
    setSharePanel((prev) => ({ ...prev, sending: true }));
    try {
      const response = await fetch("/api/admin/library/share-exercise", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          toEmail: email,
          toName: sharePanel.name,
          exerciseTitle: exercise.title,
          exerciseSlug: exercise.slug,
          exerciseDescription: exercise.description,
          setup: exercise.setup,
          steps: exercise.steps,
          cues: exercise.cues,
          note: sharePanel.note,
        }),
      });
      const data = (await response.json().catch(() => ({}))) as { error?: string; sent?: boolean; reason?: string };
      if (!response.ok) throw new Error(data.error || "Could not send exercise.");
      toast.show(data.sent ? "Exercise shared by email." : "Exercise share saved; email service is not configured on this environment.", data.sent ? "success" : "info");
      setSharePanel((prev) => ({ ...prev, open: false, sending: false }));
    } catch (error) {
      toast.show(error instanceof Error ? error.message : "Could not send this exercise.", "error");
      setSharePanel((prev) => ({ ...prev, sending: false }));
    }
  }

  const filteredShareRecipients = useMemo(() => {
    const q = sharePanel.search.trim().toLowerCase();
    if (!q) return shareRecipients.slice(0, 8);
    return shareRecipients
      .filter((recipient) =>
        [recipient.name, recipient.email, recipient.description].join(" ").toLowerCase().includes(q)
      )
      .slice(0, 8);
  }, [sharePanel.search, shareRecipients]);

  return (
    <div className="admin-library">
      <section className="admin-page-hero admin-page-hero--compact">
        <div>
          <span className="dashboard-eyebrow">Clinical content</span>
          <h1>Exercise and self-test library</h1>
          <p>Review catalogue content, record edits and add draft exercises or self-check tests for clinical sign-off.</p>
        </div>
        <div className="admin-page-metrics" aria-label="Library counts">
          <span><strong>{exerciseRows.length}</strong> exercises</span>
          <span><strong>{selfTestRows.length}</strong> self-tests</span>
          <span><strong>{Object.keys(savedExercises).length + Object.keys(savedSelfTests).length}</strong> saved drafts</span>
        </div>
      </section>

      <div className="admin-library-toolbar">
        <div className="admin-segmented-filter" role="tablist" aria-label="Library type">
          <button type="button" className={activeKind === "exercise" ? "is-active" : ""} onClick={() => { setActiveKind("exercise"); setSelectedKey(null); }}>
            Exercises
          </button>
          <button type="button" className={activeKind === "selfTest" ? "is-active" : ""} onClick={() => { setActiveKind("selfTest"); setSelectedKey(null); }}>
            Self-test scans
          </button>
        </div>
        <label className="admin-library-search">
          <Search aria-hidden="true" />
          <span className="sr-only">Search library</span>
          <input
            value={queryText}
            onChange={(event) => setQueryText(event.target.value)}
            placeholder="Search title, area, condition or tag..."
          />
        </label>
        <button type="button" className="button admin-hero-primary" onClick={activeKind === "exercise" ? newExercise : newSelfTest}>
          <Plus aria-hidden="true" />
          Add {activeKind === "exercise" ? "exercise" : "self-test"}
        </button>
      </div>

      {!loaded ? (
        <div className="panel stack">
          <SkeletonRow count={6} />
        </div>
      ) : (
        <div className="admin-library-layout">
          <section className="admin-library-list" aria-label={activeKind === "exercise" ? "Exercises" : "Self-tests"}>
            {activeKind === "exercise" ? (
              filteredExercises.map((item) => (
                <button
                  key={item.key}
                  type="button"
                  className={`admin-library-row${selectedExercise?.key === item.key ? " is-selected" : ""}`}
                  onClick={() => selectExercise(item)}
                >
                  <ExerciseImage exerciseId={item.id} name={item.title} size={58} pose={null} />
                  <span>
                    <strong>{item.title}</strong>
                    <small>{item.bodyPart || "No body area"} · {item.condition || "No condition"}</small>
                  </span>
                  <span className={`admin-library-status is-${item.status}`}>
                    {item.saved ? <CheckCircle2 aria-hidden="true" /> : null}
                    {statusLabel(item.status)}
                  </span>
                </button>
              ))
            ) : (
              filteredSelfTests.map((item) => (
                <button
                  key={item.key}
                  type="button"
                  className={`admin-library-row${selectedSelfTest?.key === item.key ? " is-selected" : ""}`}
                  onClick={() => selectSelfTest(item)}
                >
                  <SelfTestImage imageId={item.steps[0]?.imageId ?? ""} label={item.name} stepNumber={1} />
                  <span>
                    <strong>{item.name}</strong>
                    <small>{item.bodyArea || "No body area"} · {item.conditionSlugs.join(", ") || "No condition"}</small>
                  </span>
                  <span className={`admin-library-status is-${item.status}`}>
                    {item.saved ? <CheckCircle2 aria-hidden="true" /> : null}
                    {statusLabel(item.status)}
                  </span>
                </button>
              ))
            )}
          </section>

          <section className="panel admin-library-editor" aria-label="Library editor">
            {activeKind === "exercise" ? (
              <ExerciseEditor
                form={exerciseForm}
                text={exerciseText}
                onFormChange={setExerciseForm}
                onTextChange={setExerciseText}
                onSave={() => void saveExercise()}
                onShare={() => openSharePanel({
                  ...exerciseForm,
                  key: selectedExercise?.key ?? (exerciseForm.id || exerciseForm.slug),
                  tags: csv(exerciseText.tags),
                  equipment: lines(exerciseText.equipment),
                  steps: lines(exerciseText.steps),
                  cues: lines(exerciseText.cues),
                  mistakes: lines(exerciseText.mistakes),
                  source: selectedExercise?.source ?? "draft",
                  saved: selectedExercise?.saved ?? false,
                })}
                saving={saving}
              />
            ) : (
              <SelfTestEditor
                form={selfTestForm}
                text={selfTestText}
                onFormChange={setSelfTestForm}
                onTextChange={setSelfTestText}
                onSave={() => void saveSelfTest()}
                saving={saving}
              />
            )}
            {sharePanel.open && sharePanel.exercise ? (
              <ExerciseSharePanel
                exercise={sharePanel.exercise}
                panel={sharePanel}
                recipients={filteredShareRecipients}
                recipientsLoaded={shareRecipientsLoaded}
                onPanelChange={setSharePanel}
                onSelectRecipient={selectShareRecipient}
                onSend={() => void sendExerciseShare()}
              />
            ) : null}
          </section>
        </div>
      )}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="admin-library-field">
      <span>{label}</span>
      {children}
    </label>
  );
}

function ExerciseEditor({
  form,
  text,
  onFormChange,
  onTextChange,
  onSave,
  onShare,
  saving,
}: {
  form: ExerciseFields;
  text: { tags: string; equipment: string; steps: string; cues: string; mistakes: string };
  onFormChange: (next: ExerciseFields) => void;
  onTextChange: (next: { tags: string; equipment: string; steps: string; cues: string; mistakes: string }) => void;
  onSave: () => void;
  onShare: () => void;
  saving: boolean;
}) {
  return (
    <>
      <div className="admin-patient-section-head">
        <div>
          <span className="dashboard-eyebrow">Exercise editor</span>
          <h2>{form.title || "Select or add an exercise"}</h2>
        </div>
        <div className="admin-library-editor-actions">
          <button type="button" className="button secondary" onClick={onShare} disabled={!form.title.trim()}>
            <Mail aria-hidden="true" />
            Share
          </button>
          <button type="button" className="button admin-hero-primary" onClick={onSave} disabled={saving}>
            {saving ? "Saving..." : "Save draft"}
          </button>
        </div>
      </div>
      <div className="admin-library-form-grid">
        <Field label="Title"><input className="input" value={form.title} onChange={(e) => onFormChange({ ...form, title: e.target.value, slug: form.slug || slugify(e.target.value) })} /></Field>
        <Field label="Slug"><input className="input" value={form.slug} onChange={(e) => onFormChange({ ...form, slug: e.target.value })} /></Field>
        <Field label="ID"><input className="input" value={form.id} onChange={(e) => onFormChange({ ...form, id: e.target.value })} /></Field>
        <Field label="Status">
          <select className="input" value={form.status} onChange={(e) => onFormChange({ ...form, status: e.target.value as ReviewStatus })}>
            <option value="draft">Draft</option>
            <option value="needs-review">Needs review</option>
            <option value="reviewed">Reviewed</option>
          </select>
        </Field>
        <Field label="Body area"><input className="input" value={form.bodyPart} onChange={(e) => onFormChange({ ...form, bodyPart: e.target.value })} /></Field>
        <Field label="Clinical area"><input className="input" value={form.clinicalArea} onChange={(e) => onFormChange({ ...form, clinicalArea: e.target.value })} /></Field>
        <Field label="Condition"><input className="input" value={form.condition} onChange={(e) => onFormChange({ ...form, condition: e.target.value })} /></Field>
        <Field label="Stage"><input className="input" value={form.stage} onChange={(e) => onFormChange({ ...form, stage: e.target.value })} /></Field>
      </div>
      <Field label="Description"><textarea className="input" rows={3} value={form.description} onChange={(e) => onFormChange({ ...form, description: e.target.value })} /></Field>
      <Field label="Setup"><textarea className="input" rows={3} value={form.setup} onChange={(e) => onFormChange({ ...form, setup: e.target.value })} /></Field>
      <Field label="Tags, comma separated"><input className="input" value={text.tags} onChange={(e) => onTextChange({ ...text, tags: e.target.value })} /></Field>
      <Field label="Equipment, one per line"><textarea className="input" rows={3} value={text.equipment} onChange={(e) => onTextChange({ ...text, equipment: e.target.value })} /></Field>
      <Field label="Steps, one per line"><textarea className="input" rows={5} value={text.steps} onChange={(e) => onTextChange({ ...text, steps: e.target.value })} /></Field>
      <Field label="Cues, one per line"><textarea className="input" rows={4} value={text.cues} onChange={(e) => onTextChange({ ...text, cues: e.target.value })} /></Field>
      <Field label="Mistakes / stop notes, one per line"><textarea className="input" rows={4} value={text.mistakes} onChange={(e) => onTextChange({ ...text, mistakes: e.target.value })} /></Field>
      <Field label="Clinical review notes"><textarea className="input" rows={3} value={form.reviewNotes} onChange={(e) => onFormChange({ ...form, reviewNotes: e.target.value })} /></Field>
    </>
  );
}

function ExerciseSharePanel({
  exercise,
  panel,
  recipients,
  recipientsLoaded,
  onPanelChange,
  onSelectRecipient,
  onSend,
}: {
  exercise: ExerciseRecord;
  panel: SharePanelState;
  recipients: ShareRecipient[];
  recipientsLoaded: boolean;
  onPanelChange: (next: SharePanelState | ((prev: SharePanelState) => SharePanelState)) => void;
  onSelectRecipient: (recipient: ShareRecipient) => void;
  onSend: () => void;
}) {
  return (
    <div className="admin-library-share" role="region" aria-label="Share exercise by email">
      <div className="admin-library-share-head">
        <div>
          <span className="dashboard-eyebrow">Share exercise</span>
          <h3>{exercise.title}</h3>
          <p>Send this exercise to a patient account or any email address.</p>
        </div>
        <button type="button" className="button secondary" onClick={() => onPanelChange((prev) => ({ ...prev, open: false }))}>
          Close
        </button>
      </div>
      <div className="admin-library-share-grid">
        <div className="admin-library-share-picker">
          <Field label="Search patients">
            <input
              className="input"
              value={panel.search}
              onChange={(event) => onPanelChange((prev) => ({ ...prev, search: event.target.value }))}
              placeholder="Search patient, dependent or email..."
            />
          </Field>
          <div className="admin-library-share-results" role="list" aria-label="Matching patients">
            {!recipientsLoaded ? (
              <p className="muted">Loading patients...</p>
            ) : recipients.length === 0 ? (
              <p className="muted">No matching patient emails. You can still enter an email manually.</p>
            ) : (
              recipients.map((recipient) => (
                <button key={recipient.key} type="button" onClick={() => onSelectRecipient(recipient)}>
                  <strong>{recipient.name}</strong>
                  <span>{recipient.email}</span>
                  <small>{recipient.description}</small>
                </button>
              ))
            )}
          </div>
        </div>
        <div className="admin-library-share-compose">
          <Field label="Recipient email">
            <input
              className="input"
              type="email"
              value={panel.email}
              onChange={(event) => onPanelChange((prev) => ({ ...prev, email: event.target.value }))}
              placeholder="patient@example.com"
            />
          </Field>
          <Field label="Recipient name, optional">
            <input
              className="input"
              value={panel.name}
              onChange={(event) => onPanelChange((prev) => ({ ...prev, name: event.target.value }))}
              placeholder="Patient name"
            />
          </Field>
          <Field label="Optional note">
            <textarea
              className="input"
              rows={3}
              value={panel.note}
              onChange={(event) => onPanelChange((prev) => ({ ...prev, note: event.target.value }))}
              placeholder="Add any dosage, frequency or context you want the patient to see."
            />
          </Field>
          <button type="button" className="button admin-hero-primary" onClick={onSend} disabled={panel.sending}>
            <Send aria-hidden="true" />
            {panel.sending ? "Sending..." : "Send exercise"}
          </button>
        </div>
      </div>
    </div>
  );
}

function SelfTestEditor({
  form,
  text,
  onFormChange,
  onTextChange,
  onSave,
  saving,
}: {
  form: SelfTestFields;
  text: { conditionSlugs: string; steps: string; negativeResult: string; positiveResult: string; tips: string };
  onFormChange: (next: SelfTestFields) => void;
  onTextChange: (next: { conditionSlugs: string; steps: string; negativeResult: string; positiveResult: string; tips: string }) => void;
  onSave: () => void;
  saving: boolean;
}) {
  return (
    <>
      <div className="admin-patient-section-head">
        <div>
          <span className="dashboard-eyebrow">Self-test editor</span>
          <h2>{form.name || "Select or add a self-test"}</h2>
        </div>
        <button type="button" className="button admin-hero-primary" onClick={onSave} disabled={saving}>
          {saving ? "Saving..." : "Save draft"}
        </button>
      </div>
      <div className="admin-library-form-grid">
        <Field label="Name"><input className="input" value={form.name} onChange={(e) => onFormChange({ ...form, name: e.target.value, slug: form.slug || slugify(e.target.value) })} /></Field>
        <Field label="Slug"><input className="input" value={form.slug} onChange={(e) => onFormChange({ ...form, slug: e.target.value })} /></Field>
        <Field label="Status">
          <select className="input" value={form.status} onChange={(e) => onFormChange({ ...form, status: e.target.value as ReviewStatus })}>
            <option value="draft">Draft</option>
            <option value="needs-review">Needs review</option>
            <option value="reviewed">Reviewed</option>
          </select>
        </Field>
        <Field label="Body area"><input className="input" value={form.bodyArea} onChange={(e) => onFormChange({ ...form, bodyArea: e.target.value })} /></Field>
        <Field label="Reviewed by"><input className="input" value={form.reviewedBy} onChange={(e) => onFormChange({ ...form, reviewedBy: e.target.value })} /></Field>
        <Field label="Reviewed on"><input className="input" value={form.reviewedOn} onChange={(e) => onFormChange({ ...form, reviewedOn: e.target.value })} /></Field>
      </div>
      <Field label="Assesses"><textarea className="input" rows={2} value={form.assesses} onChange={(e) => onFormChange({ ...form, assesses: e.target.value })} /></Field>
      <Field label="What it checks"><textarea className="input" rows={3} value={form.whatItChecks} onChange={(e) => onFormChange({ ...form, whatItChecks: e.target.value })} /></Field>
      <Field label="Who should not do this"><textarea className="input" rows={3} value={form.whoShouldNotDoThis} onChange={(e) => onFormChange({ ...form, whoShouldNotDoThis: e.target.value })} /></Field>
      <Field label="Condition slugs, comma separated"><input className="input" value={text.conditionSlugs} onChange={(e) => onTextChange({ ...text, conditionSlugs: e.target.value })} /></Field>
      <Field label="Steps: label | instructions separated by ; | image id"><textarea className="input" rows={5} value={text.steps} onChange={(e) => onTextChange({ ...text, steps: e.target.value })} /></Field>
      <Field label="Negative result bullets"><textarea className="input" rows={3} value={text.negativeResult} onChange={(e) => onTextChange({ ...text, negativeResult: e.target.value })} /></Field>
      <Field label="Positive result bullets"><textarea className="input" rows={3} value={text.positiveResult} onChange={(e) => onTextChange({ ...text, positiveResult: e.target.value })} /></Field>
      <Field label="Tips"><textarea className="input" rows={3} value={text.tips} onChange={(e) => onTextChange({ ...text, tips: e.target.value })} /></Field>
      <Field label="Interpretation"><textarea className="input" rows={3} value={form.interpretation} onChange={(e) => onFormChange({ ...form, interpretation: e.target.value })} /></Field>
      <Field label="Clinical review notes"><textarea className="input" rows={3} value={form.reviewNotes} onChange={(e) => onFormChange({ ...form, reviewNotes: e.target.value })} /></Field>
    </>
  );
}
