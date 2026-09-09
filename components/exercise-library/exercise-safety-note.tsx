// Shared "Using these exercises safely" guidance, rendered across the exercise
// library. Server component. The copy is a module const so the same generic
// do's and don'ts appear wherever it is used.
//
//   full    - the library index and each body-area page, where nothing else on
//             the page frames how to approach the exercises.
//   compact - every exercise page and condition hub, which already carry a
//             per-item safety line / red-flags box; here the note is just the
//             short general framing around them.

const HEADING = "Using these exercises safely";

const FULL_INTRO =
  "A few general rules that apply to every exercise and programme in this library:";

const FULL_POINTS = [
  "Build up gradually. Start with the easier end of what is suggested and add more only when it feels comfortable.",
  "Some muscle soreness during or after is normal - up to about 3 or 4 out of 10 that settles within a day is fine.",
  "Sharp pain, pain that spreads down a limb, pain that wakes you at night, or pain that is clearly worse the next morning means stop and get it checked.",
  "Do not push through pain to 'earn' progress. Slow, steady loading is what builds tissue tolerance.",
  "These are general exercises, not a substitute for a personal assessment. If you are not sure what is wrong, or things are not improving, book an assessment.",
];

const FULL_CLOSING =
  "If your symptoms are severe, spreading, or you feel unwell, see a doctor rather than starting exercises.";

const COMPACT_BODY =
  "Build up gradually, expect some mild soreness that settles within a day, and stop if pain is sharp, spreading, wakes you at night, or is clearly worse the next morning. These are general exercises - book an assessment if you are unsure or not improving.";

export function ExerciseSafetyNote({
  variant = "compact",
}: {
  variant?: "full" | "compact";
}) {
  return (
    <aside
      className={`exlib-safety exlib-safety--${variant}`}
      data-safety-note
      data-variant={variant}
    >
      <h2 className="exlib-safety__title">{HEADING}</h2>
      {variant === "full" ? (
        <>
          <p className="exlib-safety__intro">{FULL_INTRO}</p>
          <ul className="exlib-safety__list">
            {FULL_POINTS.map((point, i) => (
              <li key={i}>{point}</li>
            ))}
          </ul>
          <p className="exlib-safety__closing">{FULL_CLOSING}</p>
        </>
      ) : (
        <p className="exlib-safety__body">{COMPACT_BODY}</p>
      )}
    </aside>
  );
}
