import { PlanTray } from "@/components/exercise-library/plan-tray";

// Wraps every /exercises/** route (and nothing else) so the sticky "my plan"
// tray sits at the end of page flow on the library index, the condition hubs
// and all 158 exercise pages. Server component - the tray itself is the only
// client boundary and renders null until the visitor has saved something.
export default function ExercisesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {children}
      <PlanTray />
    </>
  );
}
