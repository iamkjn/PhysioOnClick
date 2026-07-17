import { beforeEach, describe, expect, it, vi } from "vitest";

const addDocMock = vi.fn().mockResolvedValue({ id: "enquiry-1" });

vi.mock("firebase/firestore", () => ({
  addDoc: (...args: unknown[]) => addDocMock(...args),
  collection: vi.fn().mockReturnValue("enquiries-col"),
  getCountFromServer: vi.fn(),
  onSnapshot: vi.fn(),
  orderBy: vi.fn(),
  query: vi.fn(),
  serverTimestamp: vi.fn().mockReturnValue("__SERVER_TIMESTAMP__"),
  where: vi.fn(),
}));

vi.mock("@/lib/firebase", () => ({ db: {} }));

import { saveEnquiry } from "@/lib/firestore-helpers";

describe("saveEnquiry", () => {
  beforeEach(() => addDocMock.mockClear());

  // The fallback write must match the doc shape /api/enquiry produces —
  // firestore.rules requires status == "new" on client-side creates.
  it("writes the same doc shape as the API route", async () => {
    await saveEnquiry({
      name: "Jane Smith",
      email: "Jane@Example.com",
      phone: "",
      service: "Initial Assessment",
      message: "I would like help with recurring shoulder pain after exercise.",
    });

    expect(addDocMock).toHaveBeenCalledOnce();
    const doc = addDocMock.mock.calls[0][1] as Record<string, unknown>;
    expect(doc).toMatchObject({
      name: "Jane Smith",
      email: "Jane@Example.com",
      emailLower: "jane@example.com",
      status: "new",
      source: "website-contact-form",
      createdAt: "__SERVER_TIMESTAMP__",
    });
  });
});
