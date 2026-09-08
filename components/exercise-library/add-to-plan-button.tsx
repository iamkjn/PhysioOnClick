"use client";

// Toggles an exercise in the visitor's localStorage "my plan" list. The store is
// read on mount (never during render, so SSR and first paint match), and the
// button stays in sync with other instances / other tabs via `onPlanChange`.

import { useEffect, useState } from "react";
import {
  addToPlan,
  getPlan,
  onPlanChange,
  removeFromPlan,
} from "@/lib/exercise-plan-store";
import { trackLibraryEvent } from "@/lib/analytics";

export function AddToPlanButton({
  exerciseSlug,
  exerciseTitle,
}: {
  exerciseSlug: string;
  exerciseTitle: string;
}) {
  const [inPlan, setInPlan] = useState(false);

  useEffect(() => {
    setInPlan(getPlan().includes(exerciseSlug));
    return onPlanChange((slugs) => setInPlan(slugs.includes(exerciseSlug)));
  }, [exerciseSlug]);

  function toggle() {
    if (inPlan) {
      setInPlan(removeFromPlan(exerciseSlug).includes(exerciseSlug));
      return;
    }
    setInPlan(addToPlan(exerciseSlug).includes(exerciseSlug));
    trackLibraryEvent("library_add_to_plan", exerciseSlug);
  }

  return (
    <button
      type="button"
      className="exlib-add-btn"
      data-in-plan={inPlan ? "true" : "false"}
      aria-pressed={inPlan}
      onClick={toggle}
    >
      <span aria-hidden="true" className="exlib-add-btn__icon">
        {inPlan ? "✓" : "+"}
      </span>
      {inPlan ? "In your plan" : "Add to my plan"}
      <span className="sr-only">: {exerciseTitle}</span>
    </button>
  );
}
