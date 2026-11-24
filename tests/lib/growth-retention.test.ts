import { describe, expect, it } from "vitest";

import {
  GROWTH_PRUNE_BATCH,
  growthRetentionCutoffIso,
  pruneOldGrowthEvents,
  type PruneDb,
} from "../../functions/src/growth-retention";

/** A tiny in-memory stand-in for the Firestore calls the job makes. */
function fakeDb(createdAtIsos: string[]) {
  const docs = new Map(createdAtIsos.map((iso, i) => [`e${i}`, { id: `e${i}`, createdAtIso: iso }]));
  let commits = 0;
  const db: PruneDb = {
    collection: () => {
      let cutoff = "";
      let max = Infinity;
      const q = {
        where: (_field: string, _op: "<", value: string) => ((cutoff = value), q),
        orderBy: () => q,
        limit: (n: number) => ((max = n), q),
        get: async () => {
          const found = [...docs.values()]
            .filter((d) => d.createdAtIso < cutoff)
            .sort((a, b) => a.createdAtIso.localeCompare(b.createdAtIso))
            .slice(0, max)
            .map((d) => ({ ref: d.id }));
          return { docs: found, size: found.length };
        },
      };
      return q;
    },
    batch: () => {
      const pending: string[] = [];
      return {
        delete: (ref) => pending.push(ref as string),
        commit: async () => {
          commits++;
          for (const id of pending) docs.delete(id);
        },
      };
    },
  };
  return { db, remaining: () => [...docs.values()].map((d) => d.createdAtIso), commits: () => commits };
}

describe("growth statistics retention (2 years)", () => {
  it("cuts off exactly two years back", () => {
    expect(growthRetentionCutoffIso(new Date("2026-11-24T03:30:00.000Z"))).toBe("2024-11-24T03:30:00.000Z");
  });

  it("deletes only events older than two years", async () => {
    const { db, remaining } = fakeDb([
      "2024-11-23T23:59:59.000Z", // older than two years: deleted
      "2024-11-24T03:29:00.000Z", // older than two years: deleted
      "2024-11-24T03:30:00.000Z", // exactly at the cutoff: kept
      "2025-06-01T12:00:00.000Z",
      "2026-11-24T01:00:00.000Z",
    ]);
    const deleted = await pruneOldGrowthEvents(db, new Date("2026-11-24T03:30:00.000Z"));
    expect(deleted).toBe(2);
    expect(remaining()).toEqual(["2024-11-24T03:30:00.000Z", "2025-06-01T12:00:00.000Z", "2026-11-24T01:00:00.000Z"]);
  });

  it("deletes in batches when there are many old events", async () => {
    const old = Array.from({ length: GROWTH_PRUNE_BATCH * 2 + 5 }, (_, i) =>
      new Date(Date.UTC(2023, 0, 1, 0, 0, i)).toISOString(),
    );
    const { db, remaining, commits } = fakeDb([...old, "2026-01-01T00:00:00.000Z"]);
    const deleted = await pruneOldGrowthEvents(db, new Date("2026-11-24T03:30:00.000Z"));
    expect(deleted).toBe(old.length);
    expect(commits()).toBe(3);
    expect(remaining()).toEqual(["2026-01-01T00:00:00.000Z"]);
  });

  it("does nothing when nothing is old enough", async () => {
    const { db, commits } = fakeDb(["2026-11-01T00:00:00.000Z"]);
    expect(await pruneOldGrowthEvents(db, new Date("2026-11-24T03:30:00.000Z"))).toBe(0);
    expect(commits()).toBe(0);
  });
});
