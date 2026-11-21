// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { memoryFirestore } from "../helpers/memory-firestore";

let mem = memoryFirestore();
const verifyIdToken = vi.fn();
const getUserByEmail = vi.fn();
const createUser = vi.fn();
vi.mock("@/lib/firebase-admin", () => ({
  getAdminDb: () => mem.db,
  getAdminAuth: () => ({ verifyIdToken, getUserByEmail, createUser }),
  FieldValue: { serverTimestamp: () => "TS" },
}));
vi.stubEnv("ADMIN_EMAIL", "admin@physioonclick.co.uk");

import { POST } from "@/app/api/admin/patients/route";

function req(body: unknown) {
  return new Request("http://localhost/api/admin/patients", {
    method: "POST",
    headers: { Authorization: "Bearer good", "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  mem = memoryFirestore();
  verifyIdToken.mockResolvedValue({ uid: "admin", email: "admin@physioonclick.co.uk" });
  getUserByEmail.mockResolvedValue(null);
  createUser.mockResolvedValue({ uid: "newPatientUid1" });
});
afterEach(() => vi.clearAllMocks());

describe("POST /api/admin/patients", () => {
  it("is admin-only", async () => {
    verifyIdToken.mockResolvedValue({ uid: "x", email: "x@example.com" });
    expect((await POST(req({ name: "A B", email: "a@example.com" }))).status).toBe(403);
    expect(createUser).not.toHaveBeenCalled();
  });

  it("creates the auth account and a managed patient record with a carer, sending nothing", async () => {
    const res = await POST(req({
      name: "jane doe", email: "Jane@Example.com", dob: "1940-03-02",
      carerName: "John Doe", carerEmail: "john@example.com", carerRelationship: "Son",
    }));
    expect(res.status).toBe(201);
    expect(createUser).toHaveBeenCalledWith({ email: "jane@example.com", displayName: "Jane Doe" });
    expect(mem.get("patients/newPatientUid1")).toMatchObject({
      email: "jane@example.com", displayName: "Jane Doe", dob: "1940-03-02",
      createdByAdmin: true, managedByPhysio: true,
      carerEmails: ["john@example.com"],
      carerContact: { name: "John Doe", email: "john@example.com", relationship: "Son" },
    });
  });

  it("reuses an existing auth account but never overwrites an existing record", async () => {
    getUserByEmail.mockResolvedValue({ uid: "existingUid1", email: "a@example.com" });
    mem.store.set("patients/existingUid1", { displayName: "Already Here" });
    const res = await POST(req({ name: "A B", email: "a@example.com" }));
    expect(res.status).toBe(409);
    expect(await res.json()).toMatchObject({ uid: "existingUid1", existing: true });
    expect(mem.get("patients/existingUid1")).toEqual({ displayName: "Already Here" });
    expect(createUser).not.toHaveBeenCalled();
  });

  it("warns before creating a second account under a name that already has one", async () => {
    mem.store.set("patients/selfSignupUid", { displayName: "John Smith", email: "john@hotmail.example" });
    const res = await POST(req({ name: "john smith", email: "john@icloud.example" }));
    expect(res.status).toBe(409);
    expect(await res.json()).toMatchObject({
      possibleDuplicates: [{ uid: "selfSignupUid", email: "john@hotmail.example", name: "John Smith" }],
    });
    expect(createUser).not.toHaveBeenCalled();
    expect(mem.get("patients/newPatientUid1")).toBeUndefined();

    // The admin confirmed it really is a different person.
    const again = await POST(req({ name: "john smith", email: "john@icloud.example", allowSameName: true }));
    expect(again.status).toBe(201);
    expect(mem.get("patients/newPatientUid1")).toMatchObject({ displayName: "John Smith", email: "john@icloud.example" });
  });

  it("validates", async () => {
    expect((await POST(req({ name: "", email: "a@example.com" }))).status).toBe(400);
    expect((await POST(req({ name: "A", email: "nope" }))).status).toBe(400);
    expect((await POST(req({ name: "A", email: "a@example.com", carerEmail: "a@example.com" }))).status).toBe(400);
  });
});
