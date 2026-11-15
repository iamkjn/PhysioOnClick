"use client";

// Shown on recovery pages while the signed-in user is acting as a carer
// (lib/carer-access.ts), so it's never ambiguous whose plan a tick or a pain
// score is being saved to.
export function CarerModeBanner({ name }: { name: string }) {
  return (
    <div
      role="status"
      className="panel"
      style={{
        background: "var(--color-primary-light)",
        borderColor: "color-mix(in srgb, var(--color-primary) 30%, transparent)",
        padding: "var(--space-3) var(--space-4)",
        fontSize: "var(--text-sm)",
        color: "var(--color-text-primary)",
      }}
    >
      <strong>You&rsquo;re helping {name}.</strong>{" "}
      Exercises you tick off and pain scores you log are saved to {name}&rsquo;s plan, and their physio sees them.
    </div>
  );
}
