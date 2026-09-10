// The three result panels for a self-check test. Green/success tint for the
// likely-normal (negative) result, coral/error tint for the possible-problem
// (positive) result, sky/accent tint for the tips. The [data-result] attributes
// give tests and analytics a stable hook. Server component.

export function SelfTestResults({
  negative,
  positive,
  tips,
}: {
  negative: string[];
  positive: string[];
  tips: string[];
}) {
  return (
    <div className="exlib-selftest-results">
      <section
        className="exlib-selftest-result exlib-selftest-result--negative"
        data-result="negative"
        aria-labelledby="selftest-result-negative"
      >
        <h3
          id="selftest-result-negative"
          className="exlib-selftest-result__title"
        >
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
        aria-labelledby="selftest-result-positive"
      >
        <h3
          id="selftest-result-positive"
          className="exlib-selftest-result__title"
        >
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
        aria-labelledby="selftest-result-tips"
      >
        <h3 id="selftest-result-tips" className="exlib-selftest-result__title">
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
