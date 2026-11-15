// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const verifyIdToken = vi.fn();
const entriesGet = vi.fn();
const entriesAdd = vi.fn();
const listObjects = vi.fn();
const uploadObject = vi.fn();
const downloadObject = vi.fn();
const where = vi.fn(() => ({ get: entriesGet }));

const db = {
  collection: () => ({
    doc: () => ({
      collection: () => ({ where, add: entriesAdd }),
    }),
  }),
};

vi.mock("@/lib/firebase-admin", () => ({
  getAdminDb: () => db,
  getAdminAuth: () => ({ verifyIdToken }),
  listObjects: (...a: unknown[]) => listObjects(...a),
  uploadObject: (...a: unknown[]) => uploadObject(...a),
  downloadObject: (...a: unknown[]) => downloadObject(...a),
  FieldValue: { serverTimestamp: () => "SERVER_TS" },
}));
vi.stubEnv("ADMIN_EMAIL", "admin@physioonclick.co.uk");

import { GET as LIST, POST } from "@/app/api/admin/patient-documents/route";
import { GET as FILE } from "@/app/api/admin/patient-documents/file/route";

const UID = "patientUid123";

function get(path: string, token?: string) {
  return new Request(`http://localhost${path}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
}

function postForm(fields: Record<string, string | File>, token = "good") {
  const form = new FormData();
  for (const [k, v] of Object.entries(fields)) form.set(k, v);
  return new Request("http://localhost/api/admin/patient-documents", {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: form,
  });
}

function entry(id: string, data: Record<string, unknown>) {
  return { id, data: () => data };
}

beforeEach(() => {
  verifyIdToken.mockResolvedValue({ email: "admin@physioonclick.co.uk" });
});
afterEach(() => vi.clearAllMocks());

describe("admin patient documents — auth", () => {
  it("401 without a token, on every route", async () => {
    expect((await LIST(get(`/api/admin/patient-documents?uid=${UID}`))).status).toBe(401);
    expect((await FILE(get(`/api/admin/patient-documents/file?uid=${UID}&path=x`))).status).toBe(401);
    expect((await POST(postForm({ uid: UID }, ""))).status).toBe(401);
  });

  it("403 for a signed-in non-admin (the letters hold special-category health data)", async () => {
    verifyIdToken.mockResolvedValue({ email: "patient@example.com" });
    expect((await LIST(get(`/api/admin/patient-documents?uid=${UID}`, "t"))).status).toBe(403);
    expect((await FILE(get(`/api/admin/patient-documents/file?uid=${UID}&path=clinical-history/${UID}/a.pdf`, "t"))).status).toBe(403);
    expect(downloadObject).not.toHaveBeenCalled();
  });
});

describe("GET /api/admin/patient-documents", () => {
  it("lists the account holder's history (legacy entries without personId) and their uploads, newest first", async () => {
    entriesGet.mockResolvedValue({
      docs: [
        entry("old", { patientUid: UID, title: "Old letter", documentDate: "2025-01-01", storagePath: `clinical-history/${UID}/old.pdf` }),
        entry("new", { patientUid: UID, title: "Discharge", documentDate: "2026-11-03", physioFlags: "On apixaban", storagePath: `clinical-history/${UID}/new.webp`, uploadedAt: { toDate: () => new Date("2026-11-15T10:00:00Z") } }),
        entry("dep", { patientUid: UID, personId: "dependent99", title: "Child letter", documentDate: "2026-10-01", storagePath: "x" }),
      ],
    });
    listObjects.mockResolvedValue([
      { name: `patient-uploads/${UID}/1794766060138-Plan.pdf`, size: 2048, contentType: "application/pdf", updated: "2026-11-15T10:00:00Z" },
    ]);

    const res = await LIST(get(`/api/admin/patient-documents?uid=${UID}`, "good"));
    expect(res.status).toBe(200);
    expect(res.headers.get("Cache-Control")).toContain("no-store");
    expect(where).toHaveBeenCalledWith("patientUid", "==", UID);
    const json = await res.json();
    expect(json.history.map((h: { id: string }) => h.id)).toEqual(["new", "old"]);
    expect(json.history[0].physioFlags).toBe("On apixaban");
    expect(json.history[0].uploadedAt).toBe("2026-11-15T10:00:00.000Z");
    expect(listObjects).toHaveBeenCalledWith(`patient-uploads/${UID}/`);
    expect(json.uploads[0]).toMatchObject({ name: "Plan.pdf", size: 2048 });
  });

  it("shows only that dependent's history and no account uploads on a dependent's view", async () => {
    entriesGet.mockResolvedValue({
      docs: [
        entry("mine", { patientUid: UID, title: "Holder", documentDate: "2026-01-01", storagePath: "x" }),
        entry("dep", { patientUid: UID, personId: "dependent99", title: "Child", documentDate: "2026-02-01", storagePath: "y" }),
      ],
    });
    const res = await LIST(get(`/api/admin/patient-documents?uid=${UID}&person=dependent99`, "good"));
    const json = await res.json();
    expect(json.history.map((h: { id: string }) => h.id)).toEqual(["dep"]);
    expect(json.uploads).toEqual([]);
    expect(listObjects).not.toHaveBeenCalled();
  });

  it("400 for a malformed uid", async () => {
    const res = await LIST(get("/api/admin/patient-documents?uid=../etc", "good"));
    expect(res.status).toBe(400);
  });
});

describe("GET /api/admin/patient-documents/file", () => {
  it("serves a history PDF inline, uncached", async () => {
    downloadObject.mockResolvedValue(new Uint8Array([37, 80, 68, 70]));
    const path = `clinical-history/${UID}/2026-11-03-letter.pdf`;
    const res = await FILE(get(`/api/admin/patient-documents/file?uid=${UID}&path=${encodeURIComponent(path)}`, "good"));
    expect(res.status).toBe(200);
    expect(downloadObject).toHaveBeenCalledWith(path);
    expect(res.headers.get("Content-Type")).toBe("application/pdf");
    expect(res.headers.get("Content-Disposition")).toMatch(/^inline;/);
    expect(res.headers.get("Cache-Control")).toContain("no-store");
    expect(res.headers.get("X-Content-Type-Options")).toBe("nosniff");
  });

  it("never renders a non-allow-listed upload inline (e.g. a patient-supplied .html)", async () => {
    downloadObject.mockResolvedValue(new Uint8Array([60, 104]));
    const path = `patient-uploads/${UID}/123-page.html`;
    const res = await FILE(get(`/api/admin/patient-documents/file?uid=${UID}&path=${encodeURIComponent(path)}`, "good"));
    expect(res.headers.get("Content-Type")).toBe("application/octet-stream");
    expect(res.headers.get("Content-Disposition")).toMatch(/^attachment;/);
  });

  it.each([
    ["another patient's folder", `clinical-history/someoneElse99/x.pdf`],
    ["invoices", "invoices/INV-1.pdf"],
    ["path traversal", `clinical-history/${UID}/../../invoices/INV-1.pdf`],
    ["double slash", `patient-uploads/${UID}//x.pdf`],
  ])("400 for %s", async (_label, path) => {
    const res = await FILE(get(`/api/admin/patient-documents/file?uid=${UID}&path=${encodeURIComponent(path)}`, "good"));
    expect(res.status).toBe(400);
    expect(downloadObject).not.toHaveBeenCalled();
  });

  it("404 when the object is missing", async () => {
    downloadObject.mockResolvedValue(null);
    const res = await FILE(get(`/api/admin/patient-documents/file?uid=${UID}&path=${encodeURIComponent(`clinical-history/${UID}/gone.pdf`)}`, "good"));
    expect(res.status).toBe(404);
  });
});

describe("POST /api/admin/patient-documents", () => {
  const pdf = () => new File([new Uint8Array([37, 80, 68, 70])], "Letter from ward.pdf", { type: "application/pdf" });
  const valid = () => ({ uid: UID, title: "Discharge letter", documentDate: "2026-11-03", type: "discharge-letter", file: pdf() });

  it("stores the file under clinical-history/{uid}/ and records an admin-only entry", async () => {
    uploadObject.mockResolvedValue({ ok: true });
    entriesAdd.mockResolvedValue({ id: "newEntry" });
    const res = await POST(postForm({ ...valid(), physioFlags: "Anticoagulated" }));
    expect(res.status).toBe(201);

    const [path, , contentType] = uploadObject.mock.calls[0];
    expect(path).toMatch(new RegExp(`^clinical-history/${UID}/2026-11-03-\\d+-Letter-from-ward\\.pdf$`));
    expect(contentType).toBe("application/pdf");

    const saved = entriesAdd.mock.calls[0][0];
    expect(saved).toMatchObject({
      patientUid: UID,
      personId: UID,
      visibility: "admin-only",
      title: "Discharge letter",
      physioFlags: "Anticoagulated",
      storagePath: path,
      uploadedBy: "admin@physioonclick.co.uk",
      uploadedAt: "SERVER_TS",
    });
  });

  it("rejects a file type that can't be viewed safely", async () => {
    const html = new File(["<script>"], "x.html", { type: "text/html" });
    const res = await POST(postForm({ ...valid(), file: html }));
    expect(res.status).toBe(400);
    expect(uploadObject).not.toHaveBeenCalled();
  });

  it("rejects a mismatched extension and MIME type", async () => {
    const fake = new File(["x"], "x.pdf", { type: "text/html" });
    const res = await POST(postForm({ ...valid(), file: fake }));
    expect(res.status).toBe(400);
  });

  it("requires a title and an ISO document date", async () => {
    expect((await POST(postForm({ ...valid(), title: "" }))).status).toBe(400);
    expect((await POST(postForm({ ...valid(), documentDate: "03/11/2026" }))).status).toBe(400);
    expect(uploadObject).not.toHaveBeenCalled();
  });

  it("502 and no entry when the storage upload fails", async () => {
    uploadObject.mockResolvedValue({ ok: false });
    const res = await POST(postForm(valid()));
    expect(res.status).toBe(502);
    expect(entriesAdd).not.toHaveBeenCalled();
  });
});

describe("POST — session notes (text only)", () => {
  it("saves a note with no file and no storage upload", async () => {
    entriesAdd.mockResolvedValue({ id: "note1" });
    const res = await POST(postForm({
      uid: UID, title: "Home visit 1", documentDate: "2026-11-15", type: "session-note",
      summary: "Independent walking started.", bookingId: "TnGJ8DQUra34P8CXfjbh",
    }));
    expect(res.status).toBe(201);
    expect(uploadObject).not.toHaveBeenCalled();
    expect(entriesAdd.mock.calls[0][0]).toMatchObject({
      type: "session-note", summary: "Independent walking started.", storagePath: "", size: 0,
      bookingId: "TnGJ8DQUra34P8CXfjbh", visibility: "admin-only",
    });
  });

  it("requires the note text", async () => {
    const res = await POST(postForm({ uid: UID, title: "Home visit 1", documentDate: "2026-11-15", type: "session-note" }));
    expect(res.status).toBe(400);
    expect(entriesAdd).not.toHaveBeenCalled();
  });

  it("still requires a file for documents", async () => {
    const res = await POST(postForm({ uid: UID, title: "Letter", documentDate: "2026-11-15", type: "discharge-letter", summary: "x" }));
    expect(res.status).toBe(400);
  });
});
