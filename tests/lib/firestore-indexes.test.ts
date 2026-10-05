import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("firestore.indexes.json", () => {
  it("has the patientAddresses ownerUid+createdAt composite index", () => {
    const json = JSON.parse(readFileSync("firestore.indexes.json", "utf8"));
    expect(json.indexes).toContainEqual({
      collectionGroup: "patientAddresses",
      queryScope: "COLLECTION",
      fields: [
        { fieldPath: "ownerUid", order: "ASCENDING" },
        { fieldPath: "createdAt", order: "ASCENDING" },
      ],
    });
  });
});
