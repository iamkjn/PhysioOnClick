// "For reference only" label for every exercise in the library (clinical
// sign-off round 2, Q2). Wording lives in lib/exercise-disclaimer.ts.
//
//   ReferenceOnlyBadge - small badge for exercise cards and list rows. A <span>
//                        so it can sit inside a link or button.
//   ReferenceOnlyNote  - the badge plus the one-line note, for exercise pages
//                        and the library browser preview.

import { REFERENCE_ONLY_FOLLOW_UP, REFERENCE_ONLY_LABEL } from "@/lib/exercise-disclaimer";

export function ReferenceOnlyBadge() {
  return (
    <span className="exlib-ref-badge" data-reference-only>
      {REFERENCE_ONLY_LABEL}
    </span>
  );
}

export function ReferenceOnlyNote() {
  return (
    <p className="exlib-ref-note" data-reference-only-note>
      <ReferenceOnlyBadge /> <span className="exlib-ref-note__text">{REFERENCE_ONLY_FOLLOW_UP}</span>
    </p>
  );
}
