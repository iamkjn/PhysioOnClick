// @vitest-environment node
//
// The shim signs a real JWT with `jose` using the service-account private key
// (see getAccessToken() in lib/firebase-admin.ts). A placeholder PEM can't be
// imported by jose, so we generate a throwaway RSA keypair below and use its
// PKCS8 PEM as `private_key` — that lets getAccessToken() actually sign and
// reach the mocked token endpoint in each test.
//
// The suite is forced onto the `node` environment (default elsewhere is
// jsdom, see vitest.config.ts) because jose's WebCrypto signer does an
// `instanceof Uint8Array` check that fails under jsdom: jsdom's realm
// produces a Uint8Array that jose's own webapi bundle doesn't recognize as
// one, so `.sign()` throws "payload must be an instance of Uint8Array" even
// with a perfectly valid RSA key. This is a jose/jsdom environment mismatch,
// not a key problem — confirmed by reproducing the same signing call
// standalone under plain Node (works) vs. under this project's default
// jsdom test environment (fails identically regardless of key validity).
import { generateKeyPairSync } from "node:crypto";
import { afterEach, describe, expect, it, vi } from "vitest";
const { privateKey } = generateKeyPairSync("rsa", {
  modulusLength: 2048,
  privateKeyEncoding: { type: "pkcs8", format: "pem" },
  publicKeyEncoding: { type: "spki", format: "pem" },
});

const SA = {
  type: "service_account",
  project_id: "p",
  private_key_id: "k",
  private_key: privateKey,
  client_email: "svc@p.iam.gserviceaccount.com",
};

afterEach(() => vi.restoreAllMocks());

describe("Storage helpers", () => {
  it("uploadObject posts bytes to the storage upload API with bearer auth", async () => {
    vi.stubEnv("FIREBASE_SERVICE_ACCOUNT_JSON", JSON.stringify(SA));
    vi.stubEnv("FIREBASE_ADMIN_STORAGE_BUCKET", "mybucket.firebasestorage.app");
    const fetchMock = vi.fn(async (url: string, init?: RequestInit) => {
      if (String(url).includes("oauth2.googleapis.com/token")) {
        return new Response(JSON.stringify({ access_token: "tok", expires_in: 3600 }), { status: 200 });
      }
      return new Response(JSON.stringify({ name: "invoices/x.pdf" }), { status: 200 });
    });
    vi.stubGlobal("fetch", fetchMock as unknown as typeof fetch);

    const { uploadObject } = await import("@/lib/firebase-admin");
    const res = await uploadObject("invoices/INV-1.pdf", new Uint8Array([37, 80, 68, 70]), "application/pdf");
    expect(res.ok).toBe(true);
    const uploadCall = fetchMock.mock.calls.find((c) => String(c[0]).includes("/upload/storage/v1/"));
    expect(uploadCall).toBeTruthy();
    const init = uploadCall![1] as RequestInit;
    expect((init.headers as Record<string, string>)["Content-Type"]).toBe("application/pdf");
    expect(String(uploadCall![0])).toContain("name=invoices%2FINV-1.pdf");
  });

  it("returns { ok: false } when FIREBASE_ADMIN_STORAGE_BUCKET is not configured", async () => {
    vi.stubEnv("FIREBASE_SERVICE_ACCOUNT_JSON", JSON.stringify(SA));
    vi.stubEnv("FIREBASE_ADMIN_STORAGE_BUCKET", "");
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock as unknown as typeof fetch);

    const { uploadObject } = await import("@/lib/firebase-admin");
    const res = await uploadObject("invoices/INV-1.pdf", new Uint8Array([1]), "application/pdf");
    expect(res.ok).toBe(false);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("returns { ok: false } when the upload request fails", async () => {
    vi.stubEnv("FIREBASE_SERVICE_ACCOUNT_JSON", JSON.stringify(SA));
    vi.stubEnv("FIREBASE_ADMIN_STORAGE_BUCKET", "mybucket.firebasestorage.app");
    const fetchMock = vi.fn(async (url: string) => {
      if (String(url).includes("oauth2.googleapis.com/token")) {
        return new Response(JSON.stringify({ access_token: "tok", expires_in: 3600 }), { status: 200 });
      }
      return new Response("nope", { status: 500 });
    });
    vi.stubGlobal("fetch", fetchMock as unknown as typeof fetch);

    const { uploadObject } = await import("@/lib/firebase-admin");
    const res = await uploadObject("invoices/INV-1.pdf", new Uint8Array([1]), "application/pdf");
    expect(res.ok).toBe(false);
  });

  it("downloadObject gets bytes from the storage API with bearer auth and alt=media", async () => {
    vi.stubEnv("FIREBASE_SERVICE_ACCOUNT_JSON", JSON.stringify(SA));
    vi.stubEnv("FIREBASE_ADMIN_STORAGE_BUCKET", "mybucket.firebasestorage.app");
    const bytes = new Uint8Array([37, 80, 68, 70]);
    const fetchMock = vi.fn(async (url: string, init?: RequestInit) => {
      if (String(url).includes("oauth2.googleapis.com/token")) {
        return new Response(JSON.stringify({ access_token: "tok", expires_in: 3600 }), { status: 200 });
      }
      return new Response(bytes, { status: 200 });
    });
    vi.stubGlobal("fetch", fetchMock as unknown as typeof fetch);

    const { downloadObject } = await import("@/lib/firebase-admin");
    const result = await downloadObject("invoices/INV-1.pdf");
    expect(result).not.toBeNull();
    expect(Array.from(result!)).toEqual([37, 80, 68, 70]);

    const downloadCall = fetchMock.mock.calls.find((c) => String(c[0]).includes("/storage/v1/b/"));
    expect(downloadCall).toBeTruthy();
    expect(String(downloadCall![0])).toContain("/o/invoices%2FINV-1.pdf");
    expect(String(downloadCall![0])).toContain("alt=media");
    const init = downloadCall![1] as RequestInit;
    expect((init.headers as Record<string, string>).Authorization).toBe("Bearer tok");
  });

  it("downloadObject returns null when the object is missing", async () => {
    vi.stubEnv("FIREBASE_SERVICE_ACCOUNT_JSON", JSON.stringify(SA));
    vi.stubEnv("FIREBASE_ADMIN_STORAGE_BUCKET", "mybucket.firebasestorage.app");
    const fetchMock = vi.fn(async (url: string) => {
      if (String(url).includes("oauth2.googleapis.com/token")) {
        return new Response(JSON.stringify({ access_token: "tok", expires_in: 3600 }), { status: 200 });
      }
      return new Response("not found", { status: 404 });
    });
    vi.stubGlobal("fetch", fetchMock as unknown as typeof fetch);

    const { downloadObject } = await import("@/lib/firebase-admin");
    const result = await downloadObject("invoices/missing.pdf");
    expect(result).toBeNull();
  });
});
