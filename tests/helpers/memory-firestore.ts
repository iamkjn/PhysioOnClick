// Tiny in-memory stand-in for the lib/firebase-admin Firestore surface the
// admin package routes use: collection/doc/get/set/update/add/where/limit.
type Data = Record<string, unknown>;

export function memoryFirestore(seed: Record<string, Data> = {}) {
  const store = new Map<string, Data>(Object.entries(seed));
  let autoId = 0;

  function docRef(path: string) {
    const id = path.split("/").pop()!;
    return {
      id,
      path,
      async get() {
        const data = store.get(path);
        return { id, exists: data !== undefined, data: () => (data ? { ...data } : undefined), ref: docRef(path) };
      },
      async set(data: Data, opts?: { merge?: boolean }) {
        store.set(path, opts?.merge ? { ...(store.get(path) ?? {}), ...data } : { ...data });
      },
      async update(data: Data) {
        if (!store.has(path)) throw new Error(`update on missing doc ${path}`);
        store.set(path, { ...store.get(path)!, ...data });
      },
      async delete() {
        store.delete(path);
      },
      collection(name: string) {
        return collectionRef(`${path}/${name}`);
      },
    };
  }

  function query(colPath: string, filters: Array<[string, unknown]>, max = Infinity) {
    return {
      where(field: string, _op: string, value: unknown) {
        return query(colPath, [...filters, [field, value]], max);
      },
      limit(n: number) {
        return query(colPath, filters, n);
      },
      async get() {
        const docs = [...store.entries()]
          .filter(([p]) => p.startsWith(`${colPath}/`) && !p.slice(colPath.length + 1).includes("/"))
          .filter(([, d]) => filters.every(([f, v]) => d[f] === v))
          .slice(0, max)
          .map(([p, d]) => ({ id: p.split("/").pop()!, data: () => ({ ...d }), ref: docRef(p) }));
        return { empty: docs.length === 0, docs, size: docs.length };
      },
    };
  }

  function collectionRef(colPath: string) {
    return {
      ...query(colPath, []),
      doc(id?: string) {
        return docRef(`${colPath}/${id ?? `autoDoc${String(++autoId).padStart(6, "0")}`}`);
      },
      async add(data: Data) {
        const ref = docRef(`${colPath}/autoDoc${String(++autoId).padStart(6, "0")}`);
        await ref.set(data);
        return ref;
      },
    };
  }

  return {
    store,
    db: { collection: (name: string) => collectionRef(name), doc: (p: string) => docRef(p) },
    get: (path: string) => store.get(path),
    all: (colPath: string) =>
      [...store.entries()].filter(([p]) => p.startsWith(`${colPath}/`) && !p.slice(colPath.length + 1).includes("/")),
  };
}
