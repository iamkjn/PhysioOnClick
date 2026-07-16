import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * The shim is exercised through its public API with `fetch` mocked, so these
 * tests assert the actual Firestore REST payloads that go over the wire —
 * a codec or transform bug corrupts real writes silently, so shape is the
 * thing worth pinning down.
 */

const jwtVerifyMock = vi.fn();

vi.mock("jose", () => {
  class FakeSignJWT {
    setProtectedHeader() {
      return this;
    }
    setIssuer() {
      return this;
    }
    setSubject() {
      return this;
    }
    setAudience() {
      return this;
    }
    setIssuedAt() {
      return this;
    }
    setExpirationTime() {
      return this;
    }
    async sign() {
      return "signed-assertion";
    }
  }
  return {
    SignJWT: FakeSignJWT,
    importPKCS8: vi.fn().mockResolvedValue({ type: "private" }),
    createRemoteJWKSet: vi.fn(() => "jwks-resolver"),
    jwtVerify: jwtVerifyMock,
  };
});

const SERVICE_ACCOUNT = JSON.stringify({
  client_email: "svc@physioonclick.iam.gserviceaccount.com",
  private_key: "-----BEGIN PRIVATE KEY-----\\nabc\\n-----END PRIVATE KEY-----\\n",
  project_id: "physioonclick",
});

const TOKEN_RESPONSE = { access_token: "ya29.test-token", expires_in: 3600 };

/** Routes the token exchange vs. the Firestore/Identity call under test. */
function mockFetch(apiResponse: unknown, status = 200) {
  const calls: Array<{ url: string; body: unknown; headers: Record<string, string> }> = [];
  const fetchMock = vi.fn(async (url: string, init?: RequestInit) => {
    if (String(url).includes("oauth2.googleapis.com/token")) {
      return new Response(JSON.stringify(TOKEN_RESPONSE), { status: 200 });
    }
    calls.push({
      url: String(url),
      body: init?.body ? JSON.parse(String(init.body)) : undefined,
      headers: (init?.headers ?? {}) as Record<string, string>,
    });
    return new Response(JSON.stringify(apiResponse), { status });
  });
  vi.stubGlobal("fetch", fetchMock);
  return { calls, fetchMock };
}

async function loadModule() {
  // Reset so the module-level access-token cache never leaks between tests.
  vi.resetModules();
  return import("@/lib/firebase-admin");
}

beforeEach(() => {
  vi.unstubAllGlobals();
  jwtVerifyMock.mockReset();
  process.env.FIREBASE_SERVICE_ACCOUNT_JSON = SERVICE_ACCOUNT;
  process.env.FIREBASE_ADMIN_PROJECT_ID = "physioonclick";
  delete process.env.FIRESTORE_EMULATOR_HOST;
  delete process.env.FIREBASE_AUTH_EMULATOR_HOST;
});

describe("emulator routing", () => {
  it("sends the owner token to the Firestore emulator, not a signed one", async () => {
    process.env.FIRESTORE_EMULATOR_HOST = "127.0.0.1:8080";
    const { calls } = mockFetch({});
    const { getAdminDb } = await loadModule();
    await getAdminDb()!.collection("t").doc("d").set({ a: 1 });

    expect(calls[0].url).toContain("http://127.0.0.1:8080/v1/");
    expect(calls[0].headers.Authorization).toBe("Bearer owner");
  });

  it("still reaches production Firestore with a real token when only AUTH is emulated", async () => {
    // The exact mixed config in .env.local. A single usingEmulator flag would
    // send "Bearer owner" to real production Firestore here.
    process.env.FIREBASE_AUTH_EMULATOR_HOST = "127.0.0.1:9099";
    const { calls } = mockFetch({});
    const { getAdminDb } = await loadModule();
    await getAdminDb()!.collection("t").doc("d").set({ a: 1 });

    expect(calls[0].url).toContain("https://firestore.googleapis.com");
    expect(calls[0].headers.Authorization).toBe("Bearer ya29.test-token");
    expect(calls[0].headers.Authorization).not.toBe("Bearer owner");
  });

  it("works against the emulator with no service account configured", async () => {
    delete process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
    process.env.FIRESTORE_EMULATOR_HOST = "127.0.0.1:8080";
    mockFetch({});
    const { getAdminDb } = await loadModule();
    expect(getAdminDb()).not.toBeNull();
  });

  it("refuses to skip signature checks when NODE_ENV is production", async () => {
    process.env.FIREBASE_AUTH_EMULATOR_HOST = "127.0.0.1:9099";
    const prev = process.env.NODE_ENV;
    // @ts-expect-error -- NODE_ENV is readonly in the Next types
    process.env.NODE_ENV = "production";
    mockFetch({});
    const { getAdminAuth } = await loadModule();
    await expect(getAdminAuth()!.verifyIdToken("anything")).rejects.toThrow(/never be set in production/);
    // @ts-expect-error -- restoring the original value
    process.env.NODE_ENV = prev;
  });
});

describe("credentials", () => {
  it("returns null clients when no service account is configured", async () => {
    delete process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
    const { getAdminDb, getAdminAuth } = await loadModule();
    expect(getAdminDb()).toBeNull();
    expect(getAdminAuth()).toBeNull();
  });

  it("returns null rather than throwing when the service account is malformed", async () => {
    process.env.FIREBASE_SERVICE_ACCOUNT_JSON = "{not json";
    const { getAdminDb } = await loadModule();
    expect(getAdminDb()).toBeNull();
  });

  it("caches the access token across calls instead of re-signing each request", async () => {
    const { fetchMock } = mockFetch({});
    const { getAdminDb } = await loadModule();
    const db = getAdminDb()!;
    await db.collection("bookings").doc("a").set({ x: 1 });
    await db.collection("bookings").doc("b").set({ x: 2 });

    const tokenCalls = fetchMock.mock.calls.filter((c) =>
      String(c[0]).includes("oauth2.googleapis.com/token"),
    );
    expect(tokenCalls).toHaveLength(1);
  });

  it("sends the bearer token on Firestore requests", async () => {
    const { calls } = mockFetch({});
    const { getAdminDb } = await loadModule();
    await getAdminDb()!.collection("bookings").doc("a").set({ x: 1 });
    expect(calls[0].headers.Authorization).toBe("Bearer ya29.test-token");
  });
});

describe("value codec", () => {
  it("encodes each JS type to its Firestore typed value", async () => {
    const { calls } = mockFetch({});
    const { getAdminDb } = await loadModule();

    await getAdminDb()!
      .collection("t")
      .doc("d")
      .set({
        str: "hello",
        int: 42,
        float: 1.5,
        bool: true,
        nil: null,
        when: new Date("2026-01-02T03:04:05.000Z"),
        list: ["a", 1],
        nested: { inner: "v" },
      });

    const fields = (calls[0].body as any).writes[0].update.fields;
    expect(fields.str).toEqual({ stringValue: "hello" });
    // Integers must go as strings — Firestore rejects a bare JSON number here.
    expect(fields.int).toEqual({ integerValue: "42" });
    expect(fields.float).toEqual({ doubleValue: 1.5 });
    expect(fields.bool).toEqual({ booleanValue: true });
    expect(fields.nil).toEqual({ nullValue: null });
    expect(fields.when).toEqual({ timestampValue: "2026-01-02T03:04:05.000Z" });
    expect(fields.list).toEqual({
      arrayValue: { values: [{ stringValue: "a" }, { integerValue: "1" }] },
    });
    expect(fields.nested).toEqual({
      mapValue: { fields: { inner: { stringValue: "v" } } },
    });
  });

  it("decodes typed values back to JS, including nested and timestamp", async () => {
    mockFetch({
      fields: {
        title: { stringValue: "Knee rehab" },
        count: { integerValue: "3" },
        ratio: { doubleValue: 0.5 },
        done: { booleanValue: false },
        missing: { nullValue: null },
        tags: { arrayValue: { values: [{ stringValue: "a" }, { stringValue: "b" }] } },
        meta: { mapValue: { fields: { k: { stringValue: "v" } } } },
        createdAt: { timestampValue: "2026-01-02T03:04:05.000Z" },
      },
    });
    const { getAdminDb } = await loadModule();
    const snap = await getAdminDb()!.collection("t").doc("d").get();
    const data = snap.data()!;

    expect(snap.exists).toBe(true);
    expect(data.title).toBe("Knee rehab");
    expect(data.count).toBe(3);
    expect(data.ratio).toBe(0.5);
    expect(data.done).toBe(false);
    expect(data.missing).toBeNull();
    expect(data.tags).toEqual(["a", "b"]);
    expect(data.meta).toEqual({ k: "v" });
    // Timestamps decode to a Timestamp-alike so `.toDate()` consumers keep working.
    expect(data.createdAt.toDate().toISOString()).toBe("2026-01-02T03:04:05.000Z");
  });

  it("reports a missing document as non-existent rather than throwing", async () => {
    mockFetch({ error: { code: 404 } }, 404);
    const { getAdminDb } = await loadModule();
    const snap = await getAdminDb()!.collection("t").doc("nope").get();
    expect(snap.exists).toBe(false);
    expect(snap.data()).toBeUndefined();
  });

  it("throws on a real Firestore error so callers do not treat it as empty", async () => {
    mockFetch({ error: { message: "permission denied" } }, 403);
    const { getAdminDb } = await loadModule();
    await expect(getAdminDb()!.collection("t").doc("d").get()).rejects.toThrow(/403/);
  });
});

describe("sentinel transforms", () => {
  it("lifts serverTimestamp out of fields into a REQUEST_TIME transform", async () => {
    const { calls } = mockFetch({});
    const { getAdminDb, FieldValue } = await loadModule();

    await getAdminDb()!
      .collection("bookings")
      .doc("b1")
      .set({ name: "Jane", createdAt: FieldValue.serverTimestamp() });

    const write = (calls[0].body as any).writes[0];
    // The sentinel must NOT be encoded as a field, or Firestore rejects it.
    expect(write.update.fields.createdAt).toBeUndefined();
    expect(write.update.fields.name).toEqual({ stringValue: "Jane" });
    expect(write.updateTransforms).toEqual([
      { fieldPath: "createdAt", setToServerValue: "REQUEST_TIME" },
    ]);
  });

  it("lifts arrayUnion into an appendMissingElements transform", async () => {
    const { calls } = mockFetch({});
    const { getAdminDb, FieldValue } = await loadModule();

    await getAdminDb()!
      .collection("chats")
      .doc("c1")
      .update({ messages: FieldValue.arrayUnion({ role: "user" }, { role: "model" }) });

    const write = (calls[0].body as any).writes[0];
    expect(write.updateTransforms).toEqual([
      {
        fieldPath: "messages",
        appendMissingElements: {
          values: [
            { mapValue: { fields: { role: { stringValue: "user" } } } },
            { mapValue: { fields: { role: { stringValue: "model" } } } },
          ],
        },
      },
    ]);
  });

  it("excludes transform fields from the updateMask on update", async () => {
    const { calls } = mockFetch({});
    const { getAdminDb, FieldValue } = await loadModule();

    await getAdminDb()!
      .collection("chats")
      .doc("c1")
      .update({ status: "open", updatedAt: FieldValue.serverTimestamp() });

    const write = (calls[0].body as any).writes[0];
    // A masked field with no value in `fields` is DELETED before transforms run.
    // Including updatedAt here makes arrayUnion wipe the existing array — this
    // exact payload was verified against the Firestore emulator.
    expect(write.updateMask.fieldPaths).toEqual(["status"]);
    expect(write.currentDocument).toEqual({ exists: true });
  });

  it("never masks an arrayUnion field, so the existing array survives", async () => {
    const { calls } = mockFetch({});
    const { getAdminDb, FieldValue } = await loadModule();

    await getAdminDb()!
      .collection("chats")
      .doc("c1")
      .update({ messages: FieldValue.arrayUnion("new"), status: "active" });

    const write = (calls[0].body as any).writes[0];
    expect(write.updateMask.fieldPaths).toEqual(["status"]);
    expect(write.updateMask.fieldPaths).not.toContain("messages");
  });

  it("excludes transform fields from the updateMask on a merge set too", async () => {
    const { calls } = mockFetch({});
    const { getAdminDb, FieldValue } = await loadModule();

    await getAdminDb()!
      .collection("chats")
      .doc("c1")
      .set({ tags: FieldValue.arrayUnion("x"), name: "Jane" }, { merge: true });

    expect((calls[0].body as any).writes[0].updateMask.fieldPaths).toEqual(["name"]);
  });

  it("omits updateMask for a full set so the document is replaced", async () => {
    const { calls } = mockFetch({});
    const { getAdminDb } = await loadModule();
    await getAdminDb()!.collection("t").doc("d").set({ a: 1 });
    expect((calls[0].body as any).writes[0].updateMask).toBeUndefined();
  });

  it("adds an updateMask for a merge set", async () => {
    const { calls } = mockFetch({});
    const { getAdminDb } = await loadModule();
    await getAdminDb()!.collection("t").doc("d").set({ a: 1 }, { merge: true });
    expect((calls[0].body as any).writes[0].updateMask.fieldPaths).toEqual(["a"]);
  });
});

describe("queries", () => {
  it("sends a bare fieldFilter for a single where", async () => {
    const { calls } = mockFetch([]);
    const { getAdminDb } = await loadModule();
    await getAdminDb()!.collection("bookings").where("email", "==", "a@b.com").get();

    const q = (calls[0].body as any).structuredQuery;
    expect(q.from).toEqual([{ collectionId: "bookings" }]);
    expect(q.where).toEqual({
      fieldFilter: {
        field: { fieldPath: "email" },
        op: "EQUAL",
        value: { stringValue: "a@b.com" },
      },
    });
    expect(q.where.compositeFilter).toBeUndefined();
  });

  it("wraps multiple wheres in an AND compositeFilter", async () => {
    const { calls } = mockFetch([]);
    const { getAdminDb } = await loadModule();
    await getAdminDb()!
      .collection("bookings")
      .where("email", "==", "a@b.com")
      .where("status", "==", "upcoming")
      .orderBy("createdAt", "desc")
      .limit(5)
      .get();

    const q = (calls[0].body as any).structuredQuery;
    expect(q.where.compositeFilter.op).toBe("AND");
    expect(q.where.compositeFilter.filters).toHaveLength(2);
    expect(q.orderBy).toEqual([{ field: { fieldPath: "createdAt" }, direction: "DESCENDING" }]);
    expect(q.limit).toBe(5);
  });

  it("rejects an unsupported operator instead of sending a bad query", async () => {
    mockFetch([]);
    const { getAdminDb } = await loadModule();
    expect(() => getAdminDb()!.collection("t").where("a", "~=", 1)).toThrow(/Unsupported/);
  });

  it("maps query rows to docs and skips readTime-only padding", async () => {
    mockFetch([
      { readTime: "2026-01-01T00:00:00Z" },
      {
        document: {
          name: "projects/physioonclick/databases/(default)/documents/bookings/abc123",
          fields: { email: { stringValue: "a@b.com" } },
        },
      },
    ]);
    const { getAdminDb } = await loadModule();
    const snap = await getAdminDb()!.collection("bookings").where("email", "==", "a@b.com").get();

    expect(snap.size).toBe(1);
    expect(snap.empty).toBe(false);
    expect(snap.docs[0].id).toBe("abc123");
    expect(snap.docs[0].data().email).toBe("a@b.com");
    expect(snap.docs[0].ref.path).toBe("bookings/abc123");
  });

  it("treats a padding-only response as empty", async () => {
    mockFetch([{ readTime: "2026-01-01T00:00:00Z" }]);
    const { getAdminDb } = await loadModule();
    const snap = await getAdminDb()!.collection("bookings").where("email", "==", "x").get();
    expect(snap.empty).toBe(true);
    expect(snap.size).toBe(0);
  });

  it("queries a subcollection against its parent document path", async () => {
    const { calls } = mockFetch([]);
    const { getAdminDb } = await loadModule();
    await getAdminDb()!.collection("patients/p1/entries").where("score", ">=", 3).get();

    expect(calls[0].url).toContain("/documents/patients/p1:runQuery");
    expect((calls[0].body as any).structuredQuery.from).toEqual([{ collectionId: "entries" }]);
  });
});

describe("add + batch", () => {
  it("generates a 20-char auto id for add()", async () => {
    mockFetch({});
    const { getAdminDb } = await loadModule();
    const ref = await getAdminDb()!.collection("enquiries").add({ name: "Jane" });
    expect(ref.id).toHaveLength(20);
    expect(ref.id).toMatch(/^[A-Za-z0-9]{20}$/);
  });

  it("sends all batched writes in a single commit", async () => {
    const { calls } = mockFetch({});
    const { getAdminDb } = await loadModule();
    const db = getAdminDb()!;
    const batch = db.batch();
    batch.update(db.collection("bookings").doc("a"), { bookedBy: "u1" });
    batch.update(db.collection("bookings").doc("b"), { bookedBy: "u1" });
    await batch.commit();

    expect(calls).toHaveLength(1);
    expect((calls[0].body as any).writes).toHaveLength(2);
  });

  it("does not fire a request for an empty batch", async () => {
    const { calls } = mockFetch({});
    const { getAdminDb } = await loadModule();
    await getAdminDb()!.batch().commit();
    expect(calls).toHaveLength(0);
  });
});

describe("auth", () => {
  it("pins RS256 and the project issuer/audience when verifying an ID token", async () => {
    mockFetch({});
    jwtVerifyMock.mockResolvedValue({ payload: { sub: "uid-1", email: "a@b.com" } });
    const { getAdminAuth } = await loadModule();

    const decoded = await getAdminAuth()!.verifyIdToken("token-abc");

    expect(decoded.uid).toBe("uid-1");
    expect(decoded.email).toBe("a@b.com");
    const [, , options] = jwtVerifyMock.mock.calls[0];
    // Pinning the algorithm is what stops an `alg: none` / HS256 forgery.
    expect(options.algorithms).toEqual(["RS256"]);
    expect(options.issuer).toBe("https://securetoken.google.com/physioonclick");
    expect(options.audience).toBe("physioonclick");
  });

  it("rejects a token whose signature does not verify", async () => {
    mockFetch({});
    jwtVerifyMock.mockRejectedValue(new Error("signature verification failed"));
    const { getAdminAuth } = await loadModule();
    await expect(getAdminAuth()!.verifyIdToken("bad")).rejects.toThrow();
  });

  it("rejects a verified token that carries no subject", async () => {
    mockFetch({});
    jwtVerifyMock.mockResolvedValue({ payload: { email: "a@b.com" } });
    const { getAdminAuth } = await loadModule();
    await expect(getAdminAuth()!.verifyIdToken("no-sub")).rejects.toThrow(/subject/);
  });

  it("requests an email sign-in link and returns the oobLink", async () => {
    const { calls } = mockFetch({ oobLink: "https://example.com/signin?oob=xyz" });
    const { getAdminAuth } = await loadModule();

    const link = await getAdminAuth()!.generateSignInWithEmailLink("a@b.com", {
      url: "https://site/auth/verify",
      handleCodeInApp: true,
    });

    expect(link).toBe("https://example.com/signin?oob=xyz");
    expect(calls[0].url).toContain("accounts:sendOobCode");
    expect(calls[0].body).toMatchObject({
      requestType: "EMAIL_SIGNIN",
      email: "a@b.com",
      continueUrl: "https://site/auth/verify",
      // Without returnOobLink Google emails the link itself and we get nothing back.
      returnOobLink: true,
    });
  });

  it("throws when sendOobCode returns no link", async () => {
    mockFetch({});
    const { getAdminAuth } = await loadModule();
    await expect(
      getAdminAuth()!.generateSignInWithEmailLink("a@b.com", { url: "https://site" }),
    ).rejects.toThrow(/no link/);
  });
});
