"use client";

// A slim bottom bar summarising the visitor's "my plan" list. Sticky (not
// fixed) so it sits at the end of the page flow and never covers content.
// Renders nothing while the plan is empty. Phase 1 has no dedicated plan view,
// so "view plan" links back to the library index with a #my-plan anchor.

import Link from "next/link";
import { useEffect, useState } from "react";
import { getPlan, onPlanChange } from "@/lib/exercise-plan-store";

export function PlanTray() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    setCount(getPlan().length);
    return onPlanChange((slugs) => setCount(slugs.length));
  }, []);

  if (count === 0) return null;

  const label = `${count} ${count === 1 ? "exercise" : "exercises"} · view plan`;

  return (
    <div className="exlib-tray" role="region" aria-label="Your exercise plan">
      <Link href="/exercises#my-plan" className="exlib-tray__link">
        {label}
      </Link>
    </div>
  );
}
