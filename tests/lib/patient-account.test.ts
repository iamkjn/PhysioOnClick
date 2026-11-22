import { beforeEach, describe, expect, it, vi } from "vitest";
import type { User } from "firebase/auth";

// In-memory docs keyed "collection/id"; setDoc calls are recorded per path.
let store: Record<string, Record<string, unknown> | undefined> = {};
const writes: Record<string, Record<string, unknown>[]> = {};

vi.mock("@/lib/firebase", () => ({ db: {} }));
vi.mock("firebase/firestore", () => ({
  doc: (_db: unknown, collection: string, id: string) => `${collection}/${id}`,
  getDoc: async (path: string) => ({ exists: () => store[path] !== undefined, data: () => store[path] }),
  setDoc: async (path: string, data: Record<string, unknown>) => {
    (writes[path] ??= []).push(data);
  },
  serverTimestamp: () => "TS",
}));

import { ensurePatientRecord } from "@/lib/patient-account";

function authUser(overrides: Partial<User> = {}): User {
  return {
    uid: "u1",
    email: "john@example.com",
    displayName: null,
    photoURL: null,
    phoneNumber: null,
    providerData: [{ providerId: "password" }],
    ...overrides,
  } as unknown as User;
}

beforeEach(() => {
  store = {};
  for (const k of Object.keys(writes)) delete writes[k];
});

describe("ensurePatientRecord", () => {
  it("never blanks a phone, photo or name already saved on the record when signing in", async () => {
    const saved = {
      email: "john@example.com",
      displayName: "John Smith",
      phoneNumber: "07123 456789",
      photoUrl: "https://example.com/me.jpg",
      dob: "1960-02-03",
      createdAt: "ORIGINAL",
    };
    store["patients/u1"] = { ...saved };
    store["users/u1"] = { ...saved };

    await ensurePatientRecord(authUser());

    for (const path of ["patients/u1", "users/u1"]) {
      const written = writes[path].at(-1)!;
      expect(written).not.toHaveProperty("phoneNumber");
      expect(written).not.toHaveProperty("photoUrl");
      expect(written).not.toHaveProperty("displayName");
      // The account's creation date is kept, not reset on every sign-in.
      expect(written).not.toHaveProperty("createdAt");
      expect(written.dob).toBe("1960-02-03");
      expect(written.lastSignInAt).toBe("TS");
    }
  });

  it("fills every field and the creation date for a brand-new account", async () => {
    await ensurePatientRecord(authUser({ displayName: "jane doe" }), undefined, "1990-05-06");

    expect(writes["patients/u1"].at(-1)).toMatchObject({
      uid: "u1",
      email: "john@example.com",
      displayName: "Jane Doe",
      phoneNumber: "",
      photoUrl: "",
      dob: "1990-05-06",
      createdAt: "TS",
    });
  });

  it("still applies a name given at sign-up and a new photo from the sign-in provider", async () => {
    store["patients/u1"] = { displayName: "Old Name", photoUrl: "", phoneNumber: "07123 456789", dob: "1960-02-03" };

    await ensurePatientRecord(authUser({ photoURL: "https://example.com/google.jpg" }), "New Name");

    const written = writes["patients/u1"].at(-1)!;
    expect(written.displayName).toBe("New Name");
    expect(written.photoUrl).toBe("https://example.com/google.jpg");
    expect(written).not.toHaveProperty("phoneNumber");
  });
});
