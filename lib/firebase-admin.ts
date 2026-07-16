import { SignJWT, createRemoteJWKSet, decodeJwt, importPKCS8, jwtVerify } from "jose";

/**
 * REST-backed replacement for the `firebase-admin` SDK.
 *
 * WHY THIS EXISTS: firebase-admin cannot run on the Cloudflare Workers runtime.
 * Its credential layer (google-auth-library) calls `XMLHttpRequest`, which
 * workerd has no constructor for, and Firestore defaults to gRPC transport
 * which Workers has no support for. See
 * https://github.com/firebase/firebase-admin-node/issues/2069 (open since 2023).
 *
 * This module speaks the Firestore + Identity Toolkit REST APIs over plain
 * `fetch` and signs tokens with WebCrypto (via jose), so it runs on Workers
 * unmodified. It deliberately mirrors the subset of the firebase-admin surface
 * this app actually uses, so call sites did not have to change:
 *
 *   db.collection() / db.doc() / db.batch()
 *   .where() .orderBy() .limit() .get() .add() .set() .update() .delete()
 *   snapshot.docs/.empty/.size, doc.data()/.exists/.id/.ref
 *   FieldValue.serverTimestamp() / FieldValue.arrayUnion()
 *   auth.verifyIdToken() / auth.generateSignInWithEmailLink()
 *
 * ponytail: this is not a general Firestore client. Anything outside the list
 * above (transactions, collectionGroup, aggregates, streaming) is unimplemented
 * on purpose — add it only when a call site needs it.
 *
 * NOTE: FIREBASE_SERVICE_ACCOUNT_PATH is no longer supported. Workers has no
 * filesystem, so the service account must be inlined via
 * FIREBASE_SERVICE_ACCOUNT_JSON.
 */

const TOKEN_URL = "https://oauth2.googleapis.com/token";
const JWKS_URL =
  "https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com";

/**
 * firebase-admin used to pick these up on its own, which is what made
 * `npm run emulators` work. The shim has to honour them explicitly or local
 * dev silently talks to live production Firestore instead.
 */
const firestoreEmulator = process.env.FIRESTORE_EMULATOR_HOST;
const authEmulator = process.env.FIREBASE_AUTH_EMULATOR_HOST;

const FIRESTORE_HOST = firestoreEmulator
  ? `http://${firestoreEmulator}/v1`
  : "https://firestore.googleapis.com/v1";

const IDENTITY_HOST = authEmulator
  ? `http://${authEmulator}/identitytoolkit.googleapis.com/v1`
  : "https://identitytoolkit.googleapis.com/v1";

/**
 * Emulator state is tracked PER SERVICE, never as one flag. The two are set
 * independently (.env.local currently sets the auth one and not the firestore
 * one), and a single boolean would send the emulator's "owner" token to real
 * production Firestore.
 */
function isEmulatedUrl(url: string): boolean {
  if (firestoreEmulator && url.startsWith(FIRESTORE_HOST)) return true;
  if (authEmulator && url.startsWith(IDENTITY_HOST)) return true;
  return false;
}

const SCOPES = [
  "https://www.googleapis.com/auth/datastore",
  "https://www.googleapis.com/auth/firebase",
  "https://www.googleapis.com/auth/identitytoolkit",
].join(" ");

/* -------------------------------------------------------------------------- */
/* Credentials                                                                 */
/* -------------------------------------------------------------------------- */

type ServiceAccount = {
  client_email: string;
  private_key: string;
  project_id?: string;
};

function loadServiceAccount(): ServiceAccount | null {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as ServiceAccount;
    if (!parsed.client_email || !parsed.private_key) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function getProjectId(): string {
  return (
    process.env.FIREBASE_ADMIN_PROJECT_ID ||
    loadServiceAccount()?.project_id ||
    "physioonclick"
  );
}

let tokenCache: { token: string; expiresAt: number } | null = null;

/** Exchanges a signed service-account assertion for a Google OAuth2 access token. */
async function getAccessToken(): Promise<string> {
  const sa = loadServiceAccount();
  if (!sa) throw new Error("FIREBASE_SERVICE_ACCOUNT_JSON is not configured");

  const now = Math.floor(Date.now() / 1000);
  // Refresh a minute early so a token never expires mid-flight.
  if (tokenCache && tokenCache.expiresAt > now + 60) return tokenCache.token;

  // Env vars often carry the PEM with escaped newlines; real newlines pass through.
  const pem = sa.private_key.replace(/\\n/g, "\n");
  const key = await importPKCS8(pem, "RS256");

  const assertion = await new SignJWT({ scope: SCOPES })
    .setProtectedHeader({ alg: "RS256" })
    .setIssuer(sa.client_email)
    .setSubject(sa.client_email)
    .setAudience(TOKEN_URL)
    .setIssuedAt(now)
    .setExpirationTime(now + 3600)
    .sign(key);

  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion,
    }),
  });

  if (!res.ok) {
    throw new Error(`Token exchange failed (${res.status}): ${await res.text()}`);
  }

  const json = (await res.json()) as { access_token: string; expires_in: number };
  tokenCache = { token: json.access_token, expiresAt: now + json.expires_in };
  return json.access_token;
}

async function apiFetch(url: string, init?: RequestInit): Promise<Response> {
  // Emulators accept a fixed "owner" token and expose no OAuth endpoint.
  const token = isEmulatedUrl(url) ? "owner" : await getAccessToken();
  return fetch(url, {
    ...init,
    headers: {
      ...(init?.headers ?? {}),
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });
}

/* -------------------------------------------------------------------------- */
/* Value codec (JS <-> Firestore REST typed values)                            */
/* -------------------------------------------------------------------------- */

/** Mirrors firebase-admin's Timestamp closely enough for `.toDate()` consumers. */
export class Timestamp {
  constructor(
    readonly seconds: number,
    readonly nanoseconds: number,
  ) {}
  toDate(): Date {
    return new Date(this.seconds * 1000 + Math.floor(this.nanoseconds / 1e6));
  }
  toMillis(): number {
    return this.seconds * 1000 + Math.floor(this.nanoseconds / 1e6);
  }
  static fromDate(date: Date): Timestamp {
    const ms = date.getTime();
    return new Timestamp(Math.floor(ms / 1000), (ms % 1000) * 1e6);
  }
}

const SERVER_TIMESTAMP = Symbol("serverTimestamp");

class ArrayUnionValue {
  constructor(readonly values: unknown[]) {}
}

export const FieldValue = {
  serverTimestamp: () => SERVER_TIMESTAMP as unknown as Date,
  arrayUnion: (...values: unknown[]) => new ArrayUnionValue(values) as unknown as unknown[],
};

type FirestoreValue = Record<string, unknown>;

function encodeValue(value: unknown): FirestoreValue {
  if (value === null || value === undefined) return { nullValue: null };
  if (typeof value === "boolean") return { booleanValue: value };
  if (typeof value === "number") {
    return Number.isInteger(value)
      ? { integerValue: String(value) }
      : { doubleValue: value };
  }
  if (typeof value === "string") return { stringValue: value };
  if (value instanceof Date) return { timestampValue: value.toISOString() };
  if (value instanceof Timestamp) return { timestampValue: value.toDate().toISOString() };
  if (Array.isArray(value)) {
    return { arrayValue: { values: value.map(encodeValue) } };
  }
  if (typeof value === "object") {
    return { mapValue: { fields: encodeFields(value as Record<string, unknown>) } };
  }
  throw new Error(`Unsupported Firestore value: ${typeof value}`);
}

function encodeFields(data: Record<string, unknown>): Record<string, FirestoreValue> {
  const fields: Record<string, FirestoreValue> = {};
  for (const [key, value] of Object.entries(data)) {
    // Sentinels are lifted out into transforms by buildWrite(), never encoded.
    if (value === SERVER_TIMESTAMP || value instanceof ArrayUnionValue) continue;
    if (value === undefined) continue;
    fields[key] = encodeValue(value);
  }
  return fields;
}

function decodeValue(value: FirestoreValue): unknown {
  if ("nullValue" in value) return null;
  if ("booleanValue" in value) return value.booleanValue;
  if ("integerValue" in value) return Number(value.integerValue);
  if ("doubleValue" in value) return value.doubleValue;
  if ("stringValue" in value) return value.stringValue;
  if ("timestampValue" in value) return Timestamp.fromDate(new Date(value.timestampValue as string));
  if ("arrayValue" in value) {
    const arr = (value.arrayValue as { values?: FirestoreValue[] })?.values ?? [];
    return arr.map(decodeValue);
  }
  if ("mapValue" in value) {
    const fields = (value.mapValue as { fields?: Record<string, FirestoreValue> })?.fields ?? {};
    return decodeFields(fields);
  }
  if ("bytesValue" in value) return value.bytesValue;
  if ("referenceValue" in value) return value.referenceValue;
  if ("geoPointValue" in value) return value.geoPointValue;
  return null;
}

function decodeFields(fields: Record<string, FirestoreValue>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(fields)) out[key] = decodeValue(value);
  return out;
}

/* -------------------------------------------------------------------------- */
/* Writes                                                                      */
/* -------------------------------------------------------------------------- */

type Write = Record<string, unknown>;

/**
 * Builds a Firestore REST `Write`. Sentinel values (serverTimestamp/arrayUnion)
 * cannot travel as plain fields — they lift into `updateTransforms`.
 */
function buildWrite(
  name: string,
  data: Record<string, unknown>,
  mode: "set" | "merge" | "update",
): Write {
  const transforms: Record<string, unknown>[] = [];
  for (const [key, value] of Object.entries(data)) {
    if (value === SERVER_TIMESTAMP) {
      transforms.push({ fieldPath: key, setToServerValue: "REQUEST_TIME" });
    } else if (value instanceof ArrayUnionValue) {
      transforms.push({
        fieldPath: key,
        appendMissingElements: { values: value.values.map(encodeValue) },
      });
    }
  }

  const write: Write = {
    update: { name, fields: encodeFields(data) },
  };

  if (transforms.length) write.updateTransforms = transforms;

  // A bare `set` replaces the document, so it must not carry an updateMask.
  if (mode !== "set") {
    // Transform fields MUST be excluded from the mask. A field named in the
    // mask but absent from `update.fields` is DELETED by the server, and the
    // transform then applies to the emptied field — so arrayUnion silently
    // discards the existing array instead of appending to it. Verified against
    // the Firestore emulator; serverTimestamp hides this bug (delete-then-set
    // looks identical to set), arrayUnion exposes it.
    const maskPaths = Object.keys(data).filter(
      (key) => data[key] !== SERVER_TIMESTAMP && !(data[key] instanceof ArrayUnionValue),
    );
    write.updateMask = { fieldPaths: maskPaths };
  }
  if (mode === "update") {
    write.currentDocument = { exists: true };
  }

  return write;
}

async function commitWrites(projectId: string, writes: Write[]): Promise<void> {
  if (!writes.length) return;
  const res = await apiFetch(
    `${FIRESTORE_HOST}/projects/${projectId}/databases/(default)/documents:commit`,
    { method: "POST", body: JSON.stringify({ writes }) },
  );
  if (!res.ok) {
    throw new Error(`Firestore commit failed (${res.status}): ${await res.text()}`);
  }
}

/* -------------------------------------------------------------------------- */
/* Auto IDs                                                                    */
/* -------------------------------------------------------------------------- */

const AUTO_ID_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

/** Matches Firestore's own 20-char auto-ID shape. */
function autoId(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(20));
  let id = "";
  for (const byte of bytes) id += AUTO_ID_ALPHABET[byte % AUTO_ID_ALPHABET.length];
  return id;
}

/* -------------------------------------------------------------------------- */
/* Snapshots                                                                   */
/* -------------------------------------------------------------------------- */

/**
 * Matches firebase-admin's `DocumentData`, which is `any`-valued rather than
 * `unknown`-valued. Keeping the looser type is deliberate: it is what call
 * sites were already written against, and tightening it here would turn a
 * transport swap into an unrelated type-safety refactor across ~40 sites.
 */
export type DocumentData = Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any

export class DocumentSnapshot {
  constructor(
    readonly id: string,
    readonly ref: DocumentReference,
    protected readonly fields: DocumentData | null,
  ) {}
  get exists(): boolean {
    return this.fields !== null;
  }
  data(): DocumentData | undefined {
    return this.fields ?? undefined;
  }
}

/**
 * A document that came back from a query, so it provably exists. Mirrors
 * firebase-admin, where `QueryDocumentSnapshot.data()` is non-optional —
 * without this split every `d.data()` call site needs a null check.
 */
export class QueryDocumentSnapshot extends DocumentSnapshot {
  constructor(id: string, ref: DocumentReference, fields: DocumentData) {
    super(id, ref, fields);
  }
  override data(): DocumentData {
    return this.fields as DocumentData;
  }
}

export class QuerySnapshot {
  constructor(readonly docs: QueryDocumentSnapshot[]) {}
  get empty(): boolean {
    return this.docs.length === 0;
  }
  get size(): number {
    return this.docs.length;
  }
  forEach(fn: (doc: QueryDocumentSnapshot) => void): void {
    this.docs.forEach(fn);
  }
}

/* -------------------------------------------------------------------------- */
/* References + queries                                                        */
/* -------------------------------------------------------------------------- */

const OPERATORS: Record<string, string> = {
  "==": "EQUAL",
  "!=": "NOT_EQUAL",
  "<": "LESS_THAN",
  "<=": "LESS_THAN_OR_EQUAL",
  ">": "GREATER_THAN",
  ">=": "GREATER_THAN_OR_EQUAL",
  "array-contains": "ARRAY_CONTAINS",
  "array-contains-any": "ARRAY_CONTAINS_ANY",
  in: "IN",
  "not-in": "NOT_IN",
};

type Filter = { field: string; op: string; value: unknown };
type Order = { field: string; direction: "ASCENDING" | "DESCENDING" };

export class DocumentReference {
  constructor(
    private readonly db: Firestore,
    readonly path: string,
  ) {}

  get id(): string {
    return this.path.split("/").pop()!;
  }

  /** Fully-qualified REST resource name. */
  get name(): string {
    return `projects/${this.db.projectId}/databases/(default)/documents/${this.path}`;
  }

  collection(id: string): CollectionReference {
    return new CollectionReference(this.db, `${this.path}/${id}`);
  }

  async get(): Promise<DocumentSnapshot> {
    const res = await apiFetch(`${FIRESTORE_HOST}/${this.name}`);
    if (res.status === 404) return new DocumentSnapshot(this.id, this, null);
    if (!res.ok) {
      throw new Error(`Firestore get failed (${res.status}): ${await res.text()}`);
    }
    const doc = (await res.json()) as { fields?: Record<string, FirestoreValue> };
    return new DocumentSnapshot(this.id, this, decodeFields(doc.fields ?? {}));
  }

  async set(data: Record<string, unknown>, options?: { merge?: boolean }): Promise<void> {
    await commitWrites(this.db.projectId, [
      buildWrite(this.name, data, options?.merge ? "merge" : "set"),
    ]);
  }

  async update(data: Record<string, unknown>): Promise<void> {
    await commitWrites(this.db.projectId, [buildWrite(this.name, data, "update")]);
  }

  async delete(): Promise<void> {
    await commitWrites(this.db.projectId, [{ delete: this.name }]);
  }
}

export class Query {
  constructor(
    protected readonly db: Firestore,
    protected readonly path: string,
    protected readonly filters: Filter[] = [],
    protected readonly orders: Order[] = [],
    protected readonly limitCount?: number,
  ) {}

  where(field: string, op: string, value: unknown): Query {
    if (!OPERATORS[op]) throw new Error(`Unsupported query operator: ${op}`);
    return new Query(
      this.db,
      this.path,
      [...this.filters, { field, op, value }],
      this.orders,
      this.limitCount,
    );
  }

  orderBy(field: string, direction: "asc" | "desc" = "asc"): Query {
    return new Query(
      this.db,
      this.path,
      this.filters,
      [...this.orders, { field, direction: direction === "desc" ? "DESCENDING" : "ASCENDING" }],
      this.limitCount,
    );
  }

  limit(count: number): Query {
    return new Query(this.db, this.path, this.filters, this.orders, count);
  }

  /** Splits "a/b/c/coll" into the parent document path and the collection id. */
  private splitPath(): { parent: string; collectionId: string } {
    const segments = this.path.split("/");
    const collectionId = segments.pop()!;
    return { parent: segments.join("/"), collectionId };
  }

  protected buildStructuredQuery(): Record<string, unknown> {
    const query: Record<string, unknown> = {
      from: [{ collectionId: this.splitPath().collectionId }],
    };

    const fieldFilters = this.filters.map((f) => ({
      fieldFilter: {
        field: { fieldPath: f.field },
        op: OPERATORS[f.op],
        value: encodeValue(f.value),
      },
    }));

    if (fieldFilters.length === 1) {
      query.where = fieldFilters[0];
    } else if (fieldFilters.length > 1) {
      query.where = { compositeFilter: { op: "AND", filters: fieldFilters } };
    }

    if (this.orders.length) {
      query.orderBy = this.orders.map((o) => ({
        field: { fieldPath: o.field },
        direction: o.direction,
      }));
    }
    if (this.limitCount !== undefined) query.limit = this.limitCount;

    return query;
  }

  async get(): Promise<QuerySnapshot> {
    const { parent } = this.splitPath();
    const base = `projects/${this.db.projectId}/databases/(default)/documents`;
    const url = `${FIRESTORE_HOST}/${parent ? `${base}/${parent}` : base}:runQuery`;

    const res = await apiFetch(url, {
      method: "POST",
      body: JSON.stringify({ structuredQuery: this.buildStructuredQuery() }),
    });
    if (!res.ok) {
      throw new Error(`Firestore query failed (${res.status}): ${await res.text()}`);
    }

    const rows = (await res.json()) as Array<{
      document?: { name: string; fields?: Record<string, FirestoreValue> };
    }>;

    const docs: QueryDocumentSnapshot[] = [];
    for (const row of rows) {
      // Rows without `document` are readTime-only padding for empty results.
      if (!row.document) continue;
      const path = row.document.name.split("/documents/")[1];
      const ref = new DocumentReference(this.db, path);
      docs.push(new QueryDocumentSnapshot(ref.id, ref, decodeFields(row.document.fields ?? {})));
    }
    return new QuerySnapshot(docs);
  }
}

export class CollectionReference extends Query {
  doc(id?: string): DocumentReference {
    return new DocumentReference(this.db, `${this.path}/${id ?? autoId()}`);
  }

  async add(data: Record<string, unknown>): Promise<DocumentReference> {
    const ref = this.doc();
    await ref.set(data);
    return ref;
  }
}

export class WriteBatch {
  private readonly writes: Write[] = [];
  constructor(private readonly db: Firestore) {}

  set(ref: DocumentReference, data: Record<string, unknown>, options?: { merge?: boolean }): this {
    this.writes.push(buildWrite(ref.name, data, options?.merge ? "merge" : "set"));
    return this;
  }
  update(ref: DocumentReference, data: Record<string, unknown>): this {
    this.writes.push(buildWrite(ref.name, data, "update"));
    return this;
  }
  delete(ref: DocumentReference): this {
    this.writes.push({ delete: ref.name });
    return this;
  }
  async commit(): Promise<void> {
    await commitWrites(this.db.projectId, this.writes);
  }
}

export class Firestore {
  constructor(readonly projectId: string) {}

  collection(path: string): CollectionReference {
    return new CollectionReference(this, path);
  }
  doc(path: string): DocumentReference {
    return new DocumentReference(this, path);
  }
  batch(): WriteBatch {
    return new WriteBatch(this);
  }
}

/* -------------------------------------------------------------------------- */
/* Auth                                                                        */
/* -------------------------------------------------------------------------- */

const jwks = createRemoteJWKSet(new URL(JWKS_URL));

export type DecodedIdToken = {
  uid: string;
  email?: string;
  [claim: string]: unknown;
};

export class Auth {
  constructor(private readonly projectId: string) {}

  /**
   * Verifies a Firebase ID token: RS256 signature against Google's rotating
   * JWKS, plus issuer/audience/expiry. `algorithms` is pinned deliberately —
   * without it a token could claim `alg: none` or a symmetric alg and bypass
   * signature checking entirely.
   */
  async verifyIdToken(token: string): Promise<DecodedIdToken> {
    if (authEmulator) {
      // The Auth emulator mints UNSIGNED tokens (alg: none), so there is no
      // signature to check — firebase-admin skips verification against it too.
      // Hard-failing in production means a stray FIREBASE_AUTH_EMULATOR_HOST
      // can never silently turn into an auth bypass on a live deploy.
      if (process.env.NODE_ENV === "production") {
        throw new Error("FIREBASE_AUTH_EMULATOR_HOST must never be set in production");
      }
      const payload = decodeJwt(token);
      if (!payload.sub) throw new Error("ID token has no subject");
      return { ...payload, uid: payload.sub, email: payload.email as string | undefined };
    }

    const { payload } = await jwtVerify(token, jwks, {
      issuer: `https://securetoken.google.com/${this.projectId}`,
      audience: this.projectId,
      algorithms: ["RS256"],
    });
    if (!payload.sub) throw new Error("ID token has no subject");
    return { ...payload, uid: payload.sub, email: payload.email as string | undefined };
  }

  async generateSignInWithEmailLink(
    email: string,
    settings: { url: string; handleCodeInApp?: boolean },
  ): Promise<string> {
    const res = await apiFetch(`${IDENTITY_HOST}/accounts:sendOobCode`, {
      method: "POST",
      body: JSON.stringify({
        requestType: "EMAIL_SIGNIN",
        email,
        continueUrl: settings.url,
        canHandleCodeInApp: settings.handleCodeInApp ?? true,
        // Returns the link instead of having Google email it, so we can send
        // it through Resend with our own template.
        returnOobLink: true,
      }),
    });
    if (!res.ok) {
      throw new Error(`sendOobCode failed (${res.status}): ${await res.text()}`);
    }
    const json = (await res.json()) as { oobLink?: string };
    if (!json.oobLink) throw new Error("sendOobCode returned no link");
    return json.oobLink;
  }
}

/* -------------------------------------------------------------------------- */
/* Public entry points (unchanged signatures)                                  */
/* -------------------------------------------------------------------------- */

export function getAdminDb(): Firestore | null {
  if (!firestoreEmulator && !loadServiceAccount()) return null;
  return new Firestore(getProjectId());
}

export function getAdminAuth(): Auth | null {
  if (!authEmulator && !loadServiceAccount()) return null;
  return new Auth(getProjectId());
}
