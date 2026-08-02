import { afterEach, describe, expect, it, vi } from "vitest";

const verifyIdToken = vi.fn();
const paymentsGet = vi.fn();
const db = { collection: () => ({ where: () => ({ limit: () => ({ get: paymentsGet }) }) }) };
vi.mock("@/lib/firebase-admin", () => ({
  getAdminDb: () => db,
  getAdminAuth: () => ({ verifyIdToken }),
  downloadObject: vi.fn().mockResolvedValue(new Uint8Array([37, 80, 68, 70])),
}));
vi.stubEnv("ADMIN_EMAIL", "admin@physioonclick.co.uk");
import { GET } from "@/app/api/admin/invoice/[invoice]/route";

function req(token?: string) {
  return new Request("http://localhost/api/admin/invoice/INV-1", {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
}
const ctx = { params: Promise.resolve({ invoice: "INV-1" }) };

afterEach(() => vi.restoreAllMocks());

describe("GET /api/admin/invoice/[invoice]", () => {
  it("401 without a valid admin token", async () => {
    verifyIdToken.mockRejectedValue(new Error("bad"));
    const res = await GET(req("nope"), ctx);
    expect(res.status).toBe(401);
  });

  it("403 for a valid but non-admin token (PII must not leak)", async () => {
    verifyIdToken.mockResolvedValue({ email: "someone.else@example.com" });
    const res = await GET(req("valid-but-not-admin"), ctx);
    expect(res.status).toBe(403);
  });

  it("returns the PDF for an admin", async () => {
    verifyIdToken.mockResolvedValue({ email: "admin@physioonclick.co.uk" });
    paymentsGet.mockResolvedValue({ empty: false, docs: [{ data: () => ({ invoicePdfPath: "invoices/INV-1.pdf", status: "paid" }) }] });
    const res = await GET(req("good"), ctx);
    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Type")).toContain("application/pdf");
  });

  it("404 when the invoice/pdf is missing", async () => {
    verifyIdToken.mockResolvedValue({ email: "admin@physioonclick.co.uk" });
    paymentsGet.mockResolvedValue({ empty: true, docs: [] });
    const res = await GET(req("good"), ctx);
    expect(res.status).toBe(404);
  });
});
