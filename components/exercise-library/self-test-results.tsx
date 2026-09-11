// The three result panels for a self-check test. Green/success tint for the
// likely-normal (negative) result, coral/error tint for the possible-problem
// (positive) result, sky/accent tint for the tips. The [data-result] attributes
// give tests and analytics a stable hook. Server component.

export function SelfTestResults({
  negative,
  positive,
  tips,
  idPrefix = "selftest",
}: {
  negative: string[];
  positive: string[];
  tips: string[];
  /** Prefix for the result panel ids/aria-labelledby. Defaults to the fixed
   *  ids the public self-test page (one test per page) has always used, so
   *  that call site needs no changes. Callers that render multiple tests on
   *  one page (e.g. the patient portal) must pass a unique prefix per test
   *  to avoid duplicate DOM ids. */
  idPrefix?: string;
}) {
  const negativeId = `${idPrefix}-result-negative`;
  const positiveId = `${idPrefix}-result-positive`;
  const tipsId = `${idPrefix}-result-tips`;

  return (
    <div className="exlib-selftest-results">
      <section
        className="exlib-selftest-result exlib-selftest-result--negative"
        data-result="negative"
        aria-labelledby={negativeId}
      >
        <h3 id={negativeId} className="exlib-selftest-result__title">
          Likely normal
        </h3>
        <p className="exlib-selftest-result__hint">
          A negative result usually looks like this.
        </p>
        <ul>
          {negative.map((line, i) => (
            <li key={i}>{line}</li>
          ))}
        </ul>
      </section>

      <section
        className="exlib-selftest-result exlib-selftest-result--positive"
        data-result="positive"
        aria-labelledby={positiveId}
      >
        <h3 id={positiveId} className="exlib-selftest-result__title">
          Possible problem
        </h3>
        <p className="exlib-selftest-result__hint">
          A positive result usually looks like this.
        </p>
        <ul>
          {positive.map((line, i) => (
            <li key={i}>{line}</li>
          ))}
        </ul>
      </section>

      <section
        className="exlib-selftest-result exlib-selftest-result--tips"
        data-result="tips"
        aria-labelledby={tipsId}
      >
        <h3 id={tipsId} className="exlib-selftest-result__title">
          Tips for a clearer result
        </h3>
        <p className="exlib-selftest-result__hint">
          Small things that make the test easier to read.
        </p>
        <ul>
          {tips.map((line, i) => (
            <li key={i}>{line}</li>
          ))}
        </ul>
      </section>
    </div>
  );
}
