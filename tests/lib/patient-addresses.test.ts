import { beforeEach, describe, expect, it, vi } from "vitest";

const m = vi.hoisted(() => ({
  addDoc: vi.fn(),
  getDocs: vi.fn(),
  getDoc: vi.fn(),
  deleteDoc: vi.fn(),
  updateDoc: vi.fn(),
  setDoc: vi.fn(),
  batchDelete: vi.fn(),
  batchUpdate: vi.fn(),
  batchCommit: vi.fn(),
  where: vi.fn((f: string, op: string, v: unknown) => ({ f, op, v })),
}));

vi.mock("@/lib/firebase", () => ({ db: { __db: true } }));
vi.mock("firebase/firestore", () => ({
  collection: vi.fn((_db: unknown, name: string) => ({ path: name })),
  doc: vi.fn((_db: unknown, ...parts: string[]) => ({ path: parts.join("/") })),
  query: vi.fn((...args: unknown[]) => ({ q: args })),
  where: m.where,
  writeBatch: vi.fn(() => ({ delete: m.batchDelete, update: m.batchUpdate, commit: m.batchCommit })),
  orderBy: vi.fn((f: string, d?: string) => ({ f, d })),
  serverTimestamp: vi.fn(() => "TS"),
  deleteField: vi.fn(() => "DELETE"),
  addDoc: m.addDoc,
  getDocs: m.getDocs,
  getDoc: m.getDoc,
  deleteDoc: m.deleteDoc,
  updateDoc: m.updateDoc,
  setDoc: m.setDoc,
}));

import {
  addAddress,
  addressDisplay,
  deleteAddress,
  getAddresses,
  getUsualAddressId,
  setUsualAddress,
  updateAddress,
} from "@/lib/patient-addresses";

beforeEach(() => {
  Object.values(m).forEach((f) => f.mockClear());
  [m.addDoc, m.getDocs, m.getDoc, m.deleteDoc, m.updateDoc, m.setDoc, m.batchCommit].forEach((f) => f.mockReset());
});

describe("addressDisplay", () => {
  it("prefers label, falls back to line, appends postcode", () => {
    expect(addressDisplay({ label: "Mum's", line: "1 High St", postcode: "G31 4HS" })).toBe("Mum's, G31 4HS");
    expect(addressDisplay({ label: "", line: "1 High St", postcode: "G31 4HS" })).toBe("1 High St, G31 4HS");
  });
});

describe("addAddress", () => {
  it("normalises postcode, trims line and caps label", async () => {
    m.addDoc.mockResolvedValue({ id: "a1" });
    const id = await addAddress("u1", { label: "  " + "x".repeat(60) + " ", line: "  1  High St ", postcode: "g314hs" });
    expect(id).toBe("a1");
    const data = m.addDoc.mock.calls[0][1];
    expect(data.postcode).toBe("G31 4HS");
    expect(data.line).toBe("1 High St");
    expect(data.label).toBe("x".repeat(40));
    expect(data.ownerUid).toBe("u1");
    expect(data.createdAt).toBe("TS");
    expect(data.updatedAt).toBe("TS");
  });
  it("rejects invalid postcode and empty line", async () => {
    await expect(addAddress("u1", { line: "1 High St", postcode: "nope" })).rejects.toThrow();
    await expect(addAddress("u1", { line: "  ", postcode: "G31 4HS" })).rejects.toThrow();
    expect(m.addDoc).not.toHaveBeenCalled();
  });
});

describe("updateAddress", () => {
  it("writes validated fields without touching ownerUid", async () => {
    await updateAddress("a1", { label: "Home", line: "2 Low Rd", postcode: "g1 1aa" });
    const [ref, data] = m.updateDoc.mock.calls[0];
    expect(ref.path).toBe("patientAddresses/a1");
    expect(data).toMatchObject({ label: "Home", line: "2 Low Rd", postcode: "G1 1AA", updatedAt: "TS" });
    expect(data.ownerUid).toBeUndefined();
  });
});

describe("getAddresses", () => {
  it("maps docs", async () => {
    m.getDocs.mockResolvedValue({
      docs: [{ id: "a1", data: () => ({ ownerUid: "u1", label: "H", line: "1 St", postcode: "G1 1AA" }) }],
    });
    expect(await getAddresses("u1")).toEqual([
      { id: "a1", ownerUid: "u1", label: "H", line: "1 St", postcode: "G1 1AA" },
    ]);
  });
});

describe("deleteAddress", () => {
  it("clears defaults pointing at it in one atomic batch, leaves others", async () => {
    m.getDoc.mockResolvedValue({ exists: () => true, data: () => ({ defaultAddressId: "a1" }) });
    m.getDocs.mockResolvedValue({
      docs: [
        { id: "dep1", data: () => ({ defaultAddressId: "a1" }) },
        { id: "dep2", data: () => ({ defaultAddressId: "other" }) },
      ],
    });
    await deleteAddress("u1", "a1");
    expect(m.batchDelete.mock.calls[0][0].path).toBe("patientAddresses/a1");
    const paths = m.batchUpdate.mock.calls.map((c) => c[0].path);
    expect(paths).toContain("users/u1");
    expect(paths).toContain("dependents/dep1");
    expect(paths).not.toContain("dependents/dep2");
    expect(m.batchCommit).toHaveBeenCalledTimes(1);
    expect(m.deleteDoc).not.toHaveBeenCalled();
    expect(m.updateDoc).not.toHaveBeenCalled();
  });
  it("queries only the caller's dependents that point at this address", async () => {
    m.getDoc.mockResolvedValue({ exists: () => false, data: () => undefined });
    m.getDocs.mockResolvedValue({ docs: [] });
    await deleteAddress("u1", "a1");
    expect(m.where).toHaveBeenCalledWith("ownerId", "==", "u1");
    expect(m.where).toHaveBeenCalledWith("defaultAddressId", "==", "a1");
  });
  it("does not touch user doc when its default is another address", async () => {
    m.getDoc.mockResolvedValue({ exists: () => true, data: () => ({ defaultAddressId: "zzz" }) });
    m.getDocs.mockResolvedValue({ docs: [] });
    await deleteAddress("u1", "a1");
    expect(m.batchUpdate).not.toHaveBeenCalled();
    expect(m.batchCommit).toHaveBeenCalledTimes(1);
  });
});

describe("usual address", () => {
  it("refuses an address the caller does not own (or that does not exist)", async () => {
    m.getDoc.mockResolvedValue({ exists: () => true, data: () => ({ ownerUid: "someone-else" }) });
    await expect(setUsualAddress("u1", null, "a1")).rejects.toThrow();
    m.getDoc.mockResolvedValue({ exists: () => false, data: () => undefined });
    await expect(setUsualAddress("u1", "dep1", "a1")).rejects.toThrow();
    expect(m.setDoc).not.toHaveBeenCalled();
    expect(m.updateDoc).not.toHaveBeenCalled();
  });
  it("writes users/{uid} for the account holder", async () => {
    m.getDoc.mockResolvedValue({ exists: () => true, data: () => ({ ownerUid: "u1" }) });
    await setUsualAddress("u1", null, "a1");
    const [ref, data] = m.setDoc.mock.calls[0];
    expect(ref.path).toBe("users/u1");
    expect(data).toEqual({ defaultAddressId: "a1" });
    expect(m.setDoc.mock.calls[0][2]).toEqual({ merge: true });
  });
  it("writes dependents/{id} for a dependent", async () => {
    m.getDoc.mockResolvedValue({ exists: () => true, data: () => ({ ownerUid: "u1" }) });
    await setUsualAddress("u1", "dep1", "a1");
    expect(m.updateDoc.mock.calls[0][0].path).toBe("dependents/dep1");
    expect(m.updateDoc.mock.calls[0][1]).toEqual({ defaultAddressId: "a1" });
  });
  it("clears with deleteField when null", async () => {
    await setUsualAddress("u1", "dep1", null);
    expect(m.updateDoc.mock.calls[0][1]).toEqual({ defaultAddressId: "DELETE" });
  });
  it("reads the id", async () => {
    m.getDoc.mockResolvedValue({ exists: () => true, data: () => ({ defaultAddressId: "a9" }) });
    expect(await getUsualAddressId("u1", "dep1")).toBe("a9");
    m.getDoc.mockResolvedValue({ exists: () => false, data: () => undefined });
    expect(await getUsualAddressId("u1", null)).toBeNull();
  });
});
