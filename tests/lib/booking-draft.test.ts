import { beforeEach, describe, expect, it } from "vitest";

import { clearBookingDraft, DRAFT_TTL_MS, loadBookingDraft, parseDraft, saveBookingDraft } from "@/lib/booking-draft";

const future = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString();

describe("booking draft", () => {
  beforeEach(() => window.localStorage.clear());

  it("round-trips the patient's choices", () => {
    saveBookingDraft({ serviceId: "follow-up", focusAreas: ["Shoulder"], visitType: "video", slot: future });
    const draft = loadBookingDraft();
    expect(draft).toMatchObject({ serviceId: "follow-up", focusAreas: ["Shoulder"], visitType: "video", slot: future, step: 2 });
  });

  it("stores no personal data", () => {
    saveBookingDraft({ serviceId: "initial-assessment", focusAreas: [], visitType: "home", slot: null });
    const raw = JSON.parse(window.localStorage.getItem("poc-booking-draft")!);
    expect(Object.keys(raw).sort()).toEqual(["focusAreas", "savedAt", "serviceId", "slot", "step", "v", "visitType"]);
  });

  it("clears", () => {
    saveBookingDraft({ serviceId: "follow-up", focusAreas: [], visitType: "video", slot: null });
    clearBookingDraft();
    expect(loadBookingDraft()).toBeNull();
  });

  it("expires after 7 days and drops past slots", () => {
    const now = Date.now();
    const base = { v: 1, serviceId: "follow-up", focusAreas: [], visitType: "video", step: 2 };
    expect(parseDraft({ ...base, slot: null, savedAt: now - DRAFT_TTL_MS - 1 }, now)).toBeNull();
    expect(parseDraft({ ...base, slot: "2020-01-01T10:00:00Z", savedAt: now }, now)?.slot).toBeNull();
  });

  it("rejects junk", () => {
    expect(parseDraft({ v: 1, serviceId: "nope", savedAt: Date.now() })).toBeNull();
    window.localStorage.setItem("poc-booking-draft", "{not json");
    expect(loadBookingDraft()).toBeNull();
  });
});
