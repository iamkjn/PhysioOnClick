// lib/red-flag-groups.ts
// Maps the patient's picked body-chart regions to the condition-specific
// red-flag question groups that are relevant to them (lib/assessment-forms.ts
// ConditionGroup). Keeps e.g. cervicalVascular questions off a knee-only
// assessment, while still surfacing the systemic groups (inflammatory
// arthritis, cancer/MSCC) for everyone, since those aren't region-specific.

import type { ConditionGroup } from "@/lib/assessment-forms";
import { BODY_REGIONS } from "@/lib/body-chart";

const REGION_BY_KEY = new Map(BODY_REGIONS.map((r) => [r.key, r]));

const NECK_REGIONS = new Set(["neck", "head-jaw"]);
const SPINE_LOWER_REGIONS = new Set(["lower-back", "mid-back", "upper-back"]);
const LEG_REGIONS = new Set([
  "hip-left",
  "hip-right",
  "buttock-left",
  "buttock-right",
  "thigh-left",
  "thigh-right",
  "knee-left",
  "knee-right",
  "lower-leg-left",
  "lower-leg-right",
  "foot-left",
  "foot-right",
]);

/**
 * Systemic groups are relevant regardless of body region, so they're always
 * included whenever the patient has picked at least one region (or "somewhere
 * else"). Region-specific groups are added on top of that.
 */
export function regionToConditionGroups(regions: string[]): ConditionGroup[] {
  const groups = new Set<ConditionGroup>();
  if (regions.length === 0) return [];

  groups.add("inflammatoryArthritisAxSpA");
  groups.add("cancerMSCC");

  const real = regions.filter((r) => REGION_BY_KEY.has(r));
  if (real.some((r) => NECK_REGIONS.has(r))) {
    groups.add("cervicalVascular");
  }
  if (real.some((r) => SPINE_LOWER_REGIONS.has(r) || LEG_REGIONS.has(r))) {
    groups.add("caudaEquina");
    groups.add("spinalFragilityFracture");
  }

  return Array.from(groups);
}
