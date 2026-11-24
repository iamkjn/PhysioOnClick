// Retention for the website visit statistics (Firestore `growthEvents`,
// written by app/api/growth/track). The privacy policy says they are deleted
// automatically after 2 years; the daily `pruneOldGrowthEvents` job in
// index.ts does that with this logic. Kept free of firebase-admin imports so
// tests/lib/growth-retention.test.ts can run it against a fake database.

export const GROWTH_RETENTION_YEARS = 2;
/** Firestore allows 500 writes per batch; stay under it. */
export const GROWTH_PRUNE_BATCH = 400;
/** Cap per run so one run stays well inside the function timeout; the next day carries on. */
export const GROWTH_PRUNE_MAX_BATCHES = 50;

/** Events created before this instant (ISO, UTC) are older than the retention period. */
export function growthRetentionCutoffIso(now: Date): string {
  const cutoff = new Date(now.getTime());
  cutoff.setUTCFullYear(cutoff.getUTCFullYear() - GROWTH_RETENTION_YEARS);
  return cutoff.toISOString();
}

type DocRef = unknown;
type QuerySnap = { docs: Array<{ ref: DocRef }>; size: number };
type Query = {
  where(field: string, op: "<", value: string): Query;
  orderBy(field: string): Query;
  limit(n: number): Query;
  get(): Promise<QuerySnap>;
};
type Batch = { delete(ref: DocRef): void; commit(): Promise<unknown> };
export type PruneDb = { collection(name: string): Query; batch(): Batch };

/** Deletes visit statistics older than the retention period; returns how many were deleted. */
export async function pruneOldGrowthEvents(db: PruneDb, now: Date = new Date()): Promise<number> {
  const cutoff = growthRetentionCutoffIso(now);
  let deleted = 0;
  for (let round = 0; round < GROWTH_PRUNE_MAX_BATCHES; round++) {
    const snap = await db
      .collection("growthEvents")
      .where("createdAtIso", "<", cutoff)
      .orderBy("createdAtIso")
      .limit(GROWTH_PRUNE_BATCH)
      .get();
    if (snap.size === 0) break;
    const batch = db.batch();
    for (const doc of snap.docs) batch.delete(doc.ref);
    await batch.commit();
    deleted += snap.size;
    if (snap.size < GROWTH_PRUNE_BATCH) break;
  }
  return deleted;
}
