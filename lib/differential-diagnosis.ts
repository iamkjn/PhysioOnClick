// lib/differential-diagnosis.ts
// Pure, rule-based differential-diagnosis derivation for the admin "Start
// Session" wizard's Step 3. NOT an AI/ML model — it simply pulls the
// condition slugs each positive self-test points towards (lib/self-tests.ts),
// resolves display labels via lib/conditions.ts, ranks by how many positive
// tests support each condition (ties broken by clinicalArea match), and
// dedupes.

import { selfTests } from "@/lib/self-tests";
import { conditions } from "@/lib/conditions";
import type { ClinicalArea } from "@/lib/assessment-forms";

export type SelfTestResult = {
  slug: string;
  result: "positive" | "negative";
  notes?: string;
};

export type DiagnosisCandidate = {
  conditionSlug: string;
  label: string;
  confidence: "suggested" | "confirmed";
};

const CONDITION_BY_SLUG = new Map(conditions.map((c) => [c.slug, c]));
const SELF_TEST_BY_SLUG = new Map(selfTests.map((t) => [t.slug, t]));

// Rough condition -> clinicalArea mapping via bodyArea text, used only to
// break ties when two candidates have the same support count.
function conditionClinicalAreaGuess(bodyArea: string): ClinicalArea {
  const b = bodyArea.toLowerCase();
  if (b.includes("neck") || b.includes("back") || b.includes("spine")) return "spine";
  if (b.includes("shoulder") || b.includes("elbow") || b.includes("wrist") || b.includes("hand") || b.includes("arm")) {
    return "upper_limb";
  }
  if (b.includes("hip") || b.includes("knee") || b.includes("ankle") || b.includes("foot") || b.includes("leg")) {
    return "lower_limb";
  }
  if (b.includes("balance") || b.includes("fall")) return "balance_walking";
  return "general";
}

export function deriveDifferentialDiagnosis(
  selfTestResults: SelfTestResult[],
  clinicalArea?: ClinicalArea,
): DiagnosisCandidate[] {
  const support = new Map<string, number>();

  for (const result of selfTestResults) {
    if (result.result !== "positive") continue;
    const test = SELF_TEST_BY_SLUG.get(result.slug);
    if (!test) continue;
    for (const conditionSlug of test.conditionSlugs) {
      support.set(conditionSlug, (support.get(conditionSlug) ?? 0) + 1);
    }
  }

  const candidates: (DiagnosisCandidate & { score: number; areaMatch: boolean })[] = [];
  for (const [conditionSlug, count] of support.entries()) {
    const condition = CONDITION_BY_SLUG.get(conditionSlug);
    const label = condition?.name ?? conditionSlug;
    const areaMatch = condition ? (!clinicalArea || conditionClinicalAreaGuess(condition.bodyArea) === clinicalArea) : false;
    candidates.push({ conditionSlug, label, confidence: "suggested", score: count, areaMatch });
  }

  candidates.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    if (a.areaMatch !== b.areaMatch) return a.areaMatch ? -1 : 1;
    return a.label.localeCompare(b.label);
  });

  return candidates.map(({ conditionSlug, label, confidence }) => ({ conditionSlug, label, confidence }));
}
